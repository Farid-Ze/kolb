from __future__ import annotations

from typing import Protocol, List

from app.engine.norms.value_objects import PercentileResult


class NormProvider(Protocol):
    """Protocol for normative conversions returning :class:`PercentileResult`."""

    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> PercentileResult:
        ...
