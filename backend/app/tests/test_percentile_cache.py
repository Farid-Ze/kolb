from app.assessments.klsi_v4 import logic
from app.engine.norms.value_objects import PercentileResult


class _StubProvider:
    def __init__(self) -> None:
        self.calls: list[tuple[str, str, int | float]] = []

    def percentile(self, group_chain, scale: str, raw: int | float) -> PercentileResult:
        self.calls.append(("|".join(group_chain), scale, raw))
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


def test_percentile_cache_preserves_lfi_precision():
    provider = _StubProvider()
    logic.clear_percentile_cache()

    logic._lookup_percentile_cached(provider, ["Total"], "LFI", 0.72)
    logic._lookup_percentile_cached(provider, ["Total"], "LFI", 0.7200001)
    logic._lookup_percentile_cached(provider, ["Total"], "LFI", 0.721)

    assert len(provider.calls) == 2
    assert provider.calls[0][1:] == ("LFI", 0.72)
    assert provider.calls[1][2] == 0.721
