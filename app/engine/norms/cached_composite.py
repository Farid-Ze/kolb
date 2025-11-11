from __future__ import annotations

from collections import OrderedDict
from typing import Dict, Iterable, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.engine.norms.composite import AppendixNormProvider
from app.assessments.klsi_v4.logic import (
    DEFAULT_NORM_VERSION,
    _split_norm_group_token,
)
from app.data import norms as appendix_norms
from app.core.metrics import timer, inc_counter


ScaleRaw = Tuple[str, int | float]
PctResult = Tuple[Optional[float], str, bool]


class _LRU(OrderedDict):
    def __init__(self, maxsize: int = 4096):
        super().__init__()
        self.maxsize = maxsize

    def get_or_set(self, key, factory):
        try:
            value = self.pop(key)
            self[key] = value
            return value
        except KeyError:
            value = factory()
            self[key] = value
            if len(self) > self.maxsize:
                self.popitem(last=False)
            return value


class CachedCompositeNormProvider:
    """
    DB-first norm repository with:
    - Batch loading across a precedence chain (EDU→COUNTRY→AGE→GENDER→Total)
    - Per-process LRU cache (safe for read-only tables)
    - Appendix fallback for missing entries

    Implements the same percentile() contract as other NormProvider(s),
    plus percentile_many() and prime() for pre-warming cache.
    """

    def __init__(self, db: Session, group_chain: List[str] | None = None, *, max_cache: int = 8192):
        self.db = db
        self.group_chain = group_chain or []
        self._cache: _LRU = _LRU(maxsize=max_cache)
        self._appendix = AppendixNormProvider()

    # Public API --------------------------------------------------------------

    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> PctResult:
        chain = tuple(group_chain or self.group_chain)
        key = (chain, scale, raw)
        return self._cache.get_or_set(key, lambda: self._lookup_single(chain, scale, raw))

    def percentile_many(
        self, group_chain: List[str], items: Iterable[ScaleRaw]
    ) -> Dict[ScaleRaw, PctResult]:
        """Batch resolve percentiles for multiple (scale, raw) pairs.

        Performance instrumentation:
        - Timer label: norms.cached.batch.percentile_many
        - Counters:
          * norms.cached.prime (when called via prime())
          * norms.cached.batch.query (each executed SQL batch)
          * norms.cached.cache_hit (per item served from cache)
          * norms.cached.appendix_fallback (per item falling back to appendix)
        """
        with timer("norms.cached.batch.percentile_many"):
            chain = list(group_chain or self.group_chain)
            needed = list(items)
            results: Dict[ScaleRaw, PctResult] = {}

            # First: fill from cache
            for pair in list(needed):
                cached = self._cache.get((tuple(chain), pair[0], pair[1]))
                if cached is not None:
                    results[pair] = cached
                    inc_counter("norms.cached.cache_hit")
            needed = [p for p in needed if p not in results]

            if not needed:
                return results

            # Batch DB per group precedence
            # Only integer-raw scales are stored in DB (CE/RO/AC/AE/ACCE/AERO). LFI handled by appendix.
            int_needed = [(s, int(r)) for (s, r) in needed if s != "LFI"]

            for token in chain:
                base_group, req_version = _split_norm_group_token(token)
                versions = [req_version]
                if req_version != DEFAULT_NORM_VERSION:
                    versions.append(DEFAULT_NORM_VERSION)

                if int_needed:
                    by_scale: Dict[str, List[int]] = {}
                    for s, r in int_needed:
                        by_scale.setdefault(s, []).append(r)

                    # Build ORed scale filters; parameterize raw lists (dialect aware)
                    where_clauses = []
                    params: Dict[str, object] = {"g": base_group}
                    version_frag = " OR ".join([f"norm_version=:v{i}" for i, _ in enumerate(versions)])
                    for i, v in enumerate(versions):
                        params[f"v{i}"] = v

                    # Detect SQLite to avoid ANY() which is PostgreSQL-specific
                    is_sqlite = False
                    try:
                        bind = self.db.get_bind()  # type: ignore[attr-defined]
                        is_sqlite = bool(getattr(getattr(bind, "dialect", None), "name", "") == "sqlite")
                    except Exception:
                        is_sqlite = False

                    k = 0
                    for scale, raws in by_scale.items():
                        params[f"s_{scale}"] = scale
                        if is_sqlite:
                            raw_list = ",".join(str(int(x)) for x in set(raws)) or "-999999"
                            where_clauses.append(
                                f"(scale_name=:s_{scale} AND raw_score IN ({raw_list}))"
                            )
                        else:
                            params[f"rs{k}"] = tuple(set(raws))
                            where_clauses.append(
                                f"(scale_name=:s_{scale} AND raw_score = ANY(:rs{k}))"
                            )
                            k += 1

                    if where_clauses:
                        sql = f"""
                            SELECT norm_group, norm_version, scale_name, raw_score, percentile
                            FROM normative_conversion_table
                            WHERE norm_group=:g AND ({version_frag})
                              AND ({' OR '.join(where_clauses)})
                        """
                        rows = self.db.execute(text(sql), params).fetchall()
                        inc_counter("norms.cached.batch.query")
                        for norm_group, norm_version, scale_name, raw_score, pct in rows:
                            pair = (str(scale_name), int(raw_score))
                            # Only fill if not resolved yet (respect precedence)
                            if pair not in results:
                                resolved = float(pct)
                                prov = f"DB:{str(norm_group)}|{str(norm_version or req_version)}"
                                trunc = self._is_truncated(int(raw_score), str(scale_name))
                                res: PctResult = (resolved, prov, trunc)
                                results[pair] = res
                                # populate cache
                                self._cache[(tuple(chain), str(scale_name), int(raw_score))] = res

                # Remove resolved ints from int_needed before next precedence
                int_needed = [(s, r) for (s, r) in int_needed if (s, r) not in results]

                if not int_needed:
                    break

            # Appendix fallback for remaining
            for scale, raw in needed:
                if (scale, raw) in results:
                    continue
                res = self._appendix_percentile(scale, raw)
                results[(scale, raw)] = res
                self._cache[(tuple(chain), scale, raw)] = res
                inc_counter("norms.cached.appendix_fallback")

            return results

    def prime(self, group_chain: List[str], required: Iterable[ScaleRaw]) -> None:
        # Pre-warm cache with a single batch
        inc_counter("norms.cached.prime")
        self.percentile_many(group_chain or self.group_chain, required)

    # Internals ---------------------------------------------------------------

    def _lookup_single(self, chain: Tuple[str, ...], scale: str, raw: int | float) -> PctResult:
        # Try DB in precedence order
        for token in chain:
            base_group, req_version = _split_norm_group_token(token)
            versions = [req_version] if req_version == DEFAULT_NORM_VERSION else [req_version, DEFAULT_NORM_VERSION]
            if scale != "LFI":  # integer raw in DB
                for version in versions:
                    row = self.db.execute(
                        text(
                            "SELECT percentile, norm_version FROM normative_conversion_table "
                            "WHERE norm_group=:g AND norm_version=:v AND scale_name=:s AND raw_score=:r LIMIT 1"
                        ),
                        {"g": base_group, "v": version, "s": scale, "r": int(raw)},
                    ).fetchone()
                    if row:
                        inc_counter("norms.cached.single.lookup")
                        pct = float(row[0])
                        v = row[1] or version
                        return pct, f"DB:{base_group}|{v}", self._is_truncated(raw, scale)
        # Fallback appendix
        inc_counter("norms.cached.appendix_fallback")
        return self._appendix_percentile(scale, raw)

    def _appendix_percentile(self, scale: str, raw: int | float) -> PctResult:
        # Delegate to existing appendix provider; ensure LFI raw normalized to 0-1 for lookup
        if scale == "CE":
            val, src, trunc = self._appendix.percentile([], "CE", int(raw))
            return val, src, trunc
        if scale == "RO":
            val, src, trunc = self._appendix.percentile([], "RO", int(raw))
            return val, src, trunc
        if scale == "AC":
            val, src, trunc = self._appendix.percentile([], "AC", int(raw))
            return val, src, trunc
        if scale == "AE":
            val, src, trunc = self._appendix.percentile([], "AE", int(raw))
            return val, src, trunc
        if scale == "ACCE":
            val, src, trunc = self._appendix.percentile([], "ACCE", int(raw))
            return val, src, trunc
        if scale == "AERO":
            val, src, trunc = self._appendix.percentile([], "AERO", int(raw))
            return val, src, trunc
        if scale == "LFI":
            value = appendix_norms.lookup_lfi(raw / 100 if isinstance(raw, (int, float)) else raw)
            return value, "Appendix:LFI", False
        return None, "Appendix:None", False

    @staticmethod
    def _is_truncated(raw: int | float, scale: str) -> bool:
        # Mark if raw outside appendix range (for transparency)
        if scale == "LFI":
            # Appendix LFI handled via lookup_lfi which clamps appropriately; mark False
            return False
        mapping = {
            "CE": appendix_norms.CE_PERCENTILES,
            "RO": appendix_norms.RO_PERCENTILES,
            "AC": appendix_norms.AC_PERCENTILES,
            "AE": appendix_norms.AE_PERCENTILES,
            "ACCE": appendix_norms.ACCE_PERCENTILES,
            "AERO": appendix_norms.AERO_PERCENTILES,
        }
        table = mapping.get(scale)
        if not table:
            return False
        keys = table.keys()
        return int(raw) < min(keys) or int(raw) > max(keys)
