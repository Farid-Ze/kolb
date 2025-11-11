from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class StyleIntensityMetrics:
    """Vector magnitude proxies used to describe learning style intensity."""

    manhattan: float
    euclidean: float

    def as_dict(self) -> dict[str, float]:
        return {"manhattan": self.manhattan, "euclidean": self.euclidean}


@dataclass(frozen=True, slots=True)
class ScoreVector:
    """Immutable container for raw learning mode totals."""

    CE: int
    RO: int
    AC: int
    AE: int

    def as_dict(self) -> dict[str, int]:
        return {"CE": self.CE, "RO": self.RO, "AC": self.AC, "AE": self.AE}
