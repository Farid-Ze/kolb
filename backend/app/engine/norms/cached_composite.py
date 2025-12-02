from collections import OrderedDict
from typing import Dict, Iterable, List, Tuple
from threading import Lock

from sqlalchemy.orm import Session

from app.engine.constants import ALL_SCALE_CODES
from app.engine.norms.composite import AppendixNormProvider
from app.engine.norms.value_objects import PercentileResult, ScaleSample
from app.engine.norms.lru import _LRU
from app.assessments.klsi_v4.logic import (
    DEFAULT_NORM_VERSION,
    _split_norm_group_token,
)
from app.data.norms import APPENDIX_TABLES, lookup_lfi
from app.core.metrics import timer, inc_counter, measure_time, count_calls
from app.core.cache import sync_cache
from app.db.repositories import NormativeConversionRepository, NormativeConversionRow
from app.db.repositories.protocols import NormConversionReader


# Global cache shared across instances (per process)
_GLOBAL_CACHE = _LRU(maxsize=8192)

class CachedCompositeNormProvider:
    """Hybrid DB+Appendix norm repository with LRU caching."""

    def __init__(
        self,
        db: Session,
        group_chain: List[str] | None = None,
        *,
        max_cache: int = 8192,
        norm_repo: NormConversionReader | None = None,
    ):
        self.db = db
        self.group_chain = group_chain or []
        # Use global cache to persist across requests
        self._cache: _LRU = _GLOBAL_CACHE
        self._appendix = AppendixNormProvider()
        self._norm_repo: NormConversionReader = norm_repo or NormativeConversionRepository(db)

    # Public API --------------------------------------------------------------

    @count_calls("norms.cached.percentile.calls")
    @measure_time("norms.cached.percentile", histogram=True)
    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> PercentileResult:
        chain_tuple = tuple(group_chain or self.group_chain)
        sample = ScaleSample(scale, raw)
        key = self._cache_key(chain_tuple, sample)
        return self._cache.get_or_set(key, lambda: self._lookup_single(chain_tuple, sample))

    @count_calls("norms.cached.percentile_many.calls")
    @measure_time("norms.cached.percentile_many", histogram=True)
    def percentile_many(
        self, group_chain: List[str], items: Iterable[Tuple[str, int | float] | ScaleSample]
    ) -> Dict[Tuple[str, int | float], PercentileResult]:
        """Batch resolve percentiles for multiple (scale, raw) pairs."""

        with timer("norms.cached.batch.percentile_many"):
            chain_list = list(group_chain or self.group_chain)
            chain_tuple = tuple(chain_list)
            samples = [self._coerce_sample(item) for item in items]
            results: Dict[ScaleSample, PercentileResult] = {}

            for sample in list(samples):
                cached = self._cache.get(self._cache_key(chain_tuple, sample))
                if cached is not None:
                    results[sample] = cached
                    inc_counter("norms.cached.cache_hit")

            pending = [sample for sample in samples if sample not in results]
            if not pending:
                return {(sample.scale, sample.raw): results[sample] for sample in results}

            int_pending = [sample for sample in pending if sample.scale != "LFI"]
            sample_lookup: Dict[Tuple[str, int], List[ScaleSample]] = {}
            for sample in pending:
                sample_lookup.setdefault((sample.scale, int(sample.raw)), []).append(sample)

            for token in chain_list:
                base_group, req_version = _split_norm_group_token(token)
                versions = [req_version] if req_version == DEFAULT_NORM_VERSION else [req_version, DEFAULT_NORM_VERSION]

                if int_pending:
                    by_scale: Dict[str, List[int]] = {}
                    for sample in int_pending:
                        by_scale.setdefault(sample.scale, []).append(int(sample.raw))

                    rows: List[NormativeConversionRow] = []
                    
                    if by_scale:
                        # Use Redis-backed scale fetch
                        # Iterate versions in REVERSE order (Default -> Req) so Req overwrites Default
                        # in the consumer loop (which processes rows sequentially)
                        for scale, raws in by_scale.items():
                            for ver in reversed(versions):
                                scale_map = self._get_or_fetch_scale(base_group, ver, scale)
                                if scale_map:
                                    for r in raws:
                                        if r in scale_map:
                                            rows.append(NormativeConversionRow(
                                                base_group, ver, scale, r, scale_map[r]
                                            ))
                        
                        inc_counter("norms.cached.batch.query")

                    for entry in rows:
                        key = (entry.scale_name, entry.raw_score)
                        target_samples = sample_lookup.get(key, [])
                        if not target_samples:
                            continue
                        provenance_version = entry.norm_version or req_version
                        label = f"DB:{entry.norm_group}|{provenance_version}"
                        truncated = self._is_truncated(entry.raw_score, entry.scale_name)
                        result = PercentileResult(entry.percentile, label, truncated)
                        for sample in target_samples:
                            results[sample] = result
                            self._cache[self._cache_key(chain_tuple, sample)] = result

                int_pending = [sample for sample in int_pending if sample not in results]
                if not int_pending:
                    break

            remaining = [sample for sample in pending if sample not in results]
            for sample in remaining:
                result = self._appendix_percentile(sample)
                results[sample] = result
                self._cache[self._cache_key(chain_tuple, sample)] = result
                inc_counter("norms.cached.appendix_fallback")

            return {(sample.scale, sample.raw): results[sample] for sample in results}

    def prime(self, group_chain: List[str], required: Iterable[Tuple[str, int | float] | ScaleSample]) -> None:
        inc_counter("norms.cached.prime")
        self.percentile_many(group_chain or self.group_chain, required)

    def _get_or_fetch_scale(self, group: str, version: str, scale: str) -> Dict[int, float]:
        key = f"norms:{group}:{version}:{scale}"
        cached = sync_cache.get(key)
        if cached:
            return {int(k): v for k, v in cached.items()}
        
        rows = self._norm_repo.fetch_scale_chunk_sync(group, version, scale, limit=1000)
        data = {row.raw_score: row.percentile for row in rows}
        
        if data:
            sync_cache.set(key, data, ttl=86400)
        
        return data

    # Internals ---------------------------------------------------------------

    @staticmethod
    def _coerce_sample(item: Tuple[str, int | float] | ScaleSample) -> ScaleSample:
        if isinstance(item, ScaleSample):
            return item
        scale, raw = item
        return ScaleSample(scale, raw)

    @staticmethod
    def _cache_key(chain: Tuple[str, ...], sample: ScaleSample) -> Tuple[Tuple[str, ...], str, int | float]:
        raw_key: int | float = int(sample.raw) if sample.scale != "LFI" else sample.raw
        return chain, sample.scale, raw_key

    def _lookup_single(self, chain: Tuple[str, ...], sample: ScaleSample) -> PercentileResult:
        for token in chain:
            base_group, req_version = _split_norm_group_token(token)
            versions = [req_version] if req_version == DEFAULT_NORM_VERSION else [req_version, DEFAULT_NORM_VERSION]
            if sample.scale != "LFI":
                result = self._norm_repo.fetch_first_for_versions_sync(
                    base_group,
                    versions,
                    sample.scale,
                    int(sample.raw),
                )
                if result:
                    entry, resolved_version = result
                    inc_counter("norms.cached.single.lookup")
                    label = f"DB:{entry.norm_group}|{resolved_version}"
                    truncated = self._is_truncated(entry.raw_score, entry.scale_name)
                    return PercentileResult(entry.percentile, label, truncated)
        inc_counter("norms.cached.appendix_fallback")
        return self._appendix_percentile(sample)

    def _appendix_percentile(self, sample: ScaleSample) -> PercentileResult:
        scale = sample.scale
        raw = sample.raw
        if scale in ALL_SCALE_CODES:
            return self._appendix.percentile([], scale, int(raw))
        if scale == "LFI":
            value = lookup_lfi(raw / 100 if isinstance(raw, (int, float)) else raw)
            return PercentileResult(value, "Appendix:LFI", False)
        return PercentileResult(None, "Appendix:None", False)

    @staticmethod
    def _is_truncated(raw: int | float, scale: str) -> bool:
        if scale == "LFI":
            return False
        table = APPENDIX_TABLES.get(scale)
        if not table:
            return False
        raw_int = int(raw)
        return raw_int < table.min_key or raw_int > table.max_key
