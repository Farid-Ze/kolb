from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Mapping, Sequence, Tuple


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


@dataclass(frozen=True, slots=True)
class CombinationMetrics:
    """Derived dialectics and balance metrics from raw mode totals."""

    ACCE: int
    AERO: int
    assimilation_accommodation: int
    converging_diverging: int
    balance_acce: int
    balance_aero: int


@dataclass(frozen=True, slots=True)
class StyleWindow:
    """Inclusive ACCE/AERO bounds describing a learning style region."""

    acce_min: int | None
    acce_max: int | None
    aero_min: int | None
    aero_max: int | None

    @classmethod
    def from_bounds(
        cls,
        acce_bounds: Sequence[int | None],
        aero_bounds: Sequence[int | None],
    ) -> "StyleWindow":
        lower_acce, upper_acce = cls._normalize_bounds(acce_bounds)
        lower_aero, upper_aero = cls._normalize_bounds(aero_bounds)
        return cls(lower_acce, upper_acce, lower_aero, upper_aero)

    @staticmethod
    def _normalize_bounds(bounds: Sequence[int | None]) -> Tuple[int | None, int | None]:
        """Coerce YAML-loaded bounds into canonical (min, max) tuples."""
        if len(bounds) != 2:
            raise ValueError("Bounds must contain exactly two elements: [min, max]")
        lower, upper = bounds
        return (
            int(lower) if lower is not None else None,
            int(upper) if upper is not None else None,
        )

    def as_dict(self) -> dict[str, int | None]:
        return {
            "acce_min": self.acce_min,
            "acce_max": self.acce_max,
            "aero_min": self.aero_min,
            "aero_max": self.aero_max,
        }


@dataclass(frozen=True, slots=True)
class BalanceMedians:
    """Normative median offsets used for balance metrics."""

    acce: int
    aero: int


@dataclass(frozen=True, slots=True)
class LfiTertiles:
    """Tertile cut points separating low/moderate/high LFI levels."""

    low: float
    moderate: float


@dataclass(frozen=True, slots=True)
class LfiConfig:
    tertiles: LfiTertiles


@dataclass(frozen=True, slots=True)
class KLSIParameters:
    """Immutable container for the Kolb 4.0 assessment configuration."""

    instrument_id: str
    version: str
    item_count: int
    context_count: int
    style_windows: Mapping[str, StyleWindow]
    balance_medians: BalanceMedians
    intensity_metrics: Tuple[str, ...]
    context_names: Tuple[str, ...]
    lfi: LfiConfig
    regression: Mapping[str, Any]

    def window(self, name: str) -> StyleWindow:
        return self.style_windows[name]

    @classmethod
    def from_raw(cls, payload: Mapping[str, Any]) -> "KLSIParameters":
        style_windows = {
            key: StyleWindow.from_bounds(value["ACCE"], value["AERO"])
            for key, value in payload["style_windows"].items()
        }
        balance = payload["balance_medians"]
        intensity_metrics = tuple(str(metric) for metric in payload.get("intensity_metrics", ()))
        context_names = tuple(str(name) for name in payload["context_names"])
        tertiles = payload.get("lfi", {}).get("tertiles", {})
        lfi_config = LfiConfig(
            tertiles=LfiTertiles(
                low=float(tertiles.get("low", 0.0)),
                moderate=float(tertiles.get("moderate", 0.0)),
            )
        )
        regression = MappingProxyType(dict(payload.get("regression", {})))
        return cls(
            instrument_id=str(payload["id"]),
            version=str(payload["version"]),
            item_count=int(payload["item_count"]),
            context_count=int(payload["context_count"]),
            style_windows=MappingProxyType(style_windows),
            balance_medians=BalanceMedians(
                acce=int(balance["ACCE"]),
                aero=int(balance["AERO"]),
            ),
            intensity_metrics=intensity_metrics,
            context_names=context_names,
            lfi=lfi_config,
            regression=regression,
        )
