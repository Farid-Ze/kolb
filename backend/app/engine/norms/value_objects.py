from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True, slots=True)
class ScaleSample:
    """Immutable representation of a scale/raw pair for percentile lookups."""

    scale: str
    raw: int | float

    def as_key(self) -> tuple[str, int]:
        """Return a stable key for caches that expect integer raw scores."""
        return self.scale, int(self.raw)


@dataclass(frozen=True, slots=True)
class PercentileResult:
    """Value object wrapping percentile lookup results."""

    percentile: Optional[float]
    provenance: str
    truncated: bool

    def as_tuple(self) -> tuple[Optional[float], str, bool]:
        return self.percentile, self.provenance, self.truncated
