from __future__ import annotations

from app.assessments.klsi_v4 import logic
from app.engine.norms.value_objects import PercentileResult


class _StubProvider:
    def __init__(self) -> None:
        self.calls: list[tuple[str, str, int]] = []

    def percentile(self, group_chain, scale: str, raw: int | float) -> PercentileResult:
        self.calls.append(("|".join(group_chain), scale, int(raw)))
        return PercentileResult(float(raw), "DB:Total", False)


def test_percentile_cache_deduplicates_repeated_lookups():
    provider = _StubProvider()
    logic.clear_percentile_cache()

    first = logic._lookup_percentile_cached(provider, ["Total"], "CE", 42)
    second = logic._lookup_percentile_cached(provider, ["Total"], "CE", 42)

    assert first == second
    assert len(provider.calls) == 1, "cache should prevent duplicate provider hits"


def test_percentile_cache_can_be_cleared():
    provider = _StubProvider()
    logic.clear_percentile_cache()

    logic._lookup_percentile_cached(provider, ["Total"], "RO", 30)
    logic.clear_percentile_cache()
    logic._lookup_percentile_cached(provider, ["Total"], "RO", 30)

    assert len(provider.calls) == 2, "clearing cache should force provider to be called again"
