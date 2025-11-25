from types import MappingProxyType
from typing import Any, Mapping, Sequence, Tuple

from pydantic import BaseModel, ConfigDict, StrictFloat, StrictInt


class StyleIntensityMetrics(BaseModel):
    """Vector magnitude proxies used to describe learning style intensity."""
    model_config = ConfigDict(frozen=True)

    manhattan: StrictFloat
    euclidean: StrictFloat

    def as_dict(self) -> dict[str, float]:
        return {"manhattan": self.manhattan, "euclidean": self.euclidean}


class ScoreVector(BaseModel):
    """Immutable container for raw learning mode totals."""
    model_config = ConfigDict(frozen=True)

    CE: StrictInt
    RO: StrictInt
    AC: StrictInt
    AE: StrictInt

    def as_dict(self) -> dict[str, int]:
        return {"CE": self.CE, "RO": self.RO, "AC": self.AC, "AE": self.AE}


class CombinationMetrics(BaseModel):
    """Derived dialectics and balance metrics from raw mode totals."""
    model_config = ConfigDict(frozen=True)

    ACCE: StrictInt
    AERO: StrictInt
    assimilation_accommodation: StrictInt
    converging_diverging: StrictInt
    balance_acce: StrictInt
    balance_aero: StrictInt


class StyleWindow(BaseModel):
    """Inclusive ACCE/AERO bounds describing a learning style region."""
    model_config = ConfigDict(frozen=True)

    acce_min: StrictInt | None
    acce_max: StrictInt | None
    aero_min: StrictInt | None
    aero_max: StrictInt | None

    @classmethod
    def from_bounds(
        cls,
        acce_bounds: Sequence[int | None],
        aero_bounds: Sequence[int | None],
    ) -> "StyleWindow":
        lower_acce, upper_acce = cls._normalize_bounds(acce_bounds)
        lower_aero, upper_aero = cls._normalize_bounds(aero_bounds)
        return cls(
            acce_min=lower_acce, 
            acce_max=upper_acce, 
            aero_min=lower_aero, 
            aero_max=upper_aero
        )

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


class BalanceMedians(BaseModel):
    """Normative median offsets used for balance metrics."""
    model_config = ConfigDict(frozen=True)

    acce: StrictInt
    aero: StrictInt


class LfiTertiles(BaseModel):
    """Tertile cut points separating low/moderate/high LFI levels."""
    model_config = ConfigDict(frozen=True)

    low: StrictFloat
    moderate: StrictFloat


class LfiConfig(BaseModel):
    model_config = ConfigDict(frozen=True)
    tertiles: LfiTertiles


class KLSIParameters(BaseModel):
    """Immutable container for the Kolb 4.0 assessment configuration."""
    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)

    instrument_id: str
    version: str
    item_count: StrictInt
    context_count: StrictInt
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
