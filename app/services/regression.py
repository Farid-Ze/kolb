"""Regression-based analytics for Learning Flexibility Index (LFI).

Coefficients, means, and standard deviations are loaded from
``app/assessments/klsi_v4/config.yaml`` so the implementation stays aligned
with the Kolb & Kolb (2013) specification and the repository's governance
rules for psychometric parameters.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Dict, Iterable, List, Mapping, Optional, Tuple

from app.assessments.klsi_v4 import load_config
from app.assessments.klsi_v4.enums import LearningStyleCode
from app.assessments.klsi_v4.logic import (
    CONTEXT_NAMES as _KLSI_CONTEXT_NAMES,
    STYLE_CODES as _KLSI_STYLE_CODES,
    STYLE_CUTS as _KLSI_STYLE_CUTS,
)
from app.engine.constants import PRIMARY_MODE_CODES


CONTEXT_NAMES: List[str] = list(_KLSI_CONTEXT_NAMES)
STYLE_CUTS = _KLSI_STYLE_CUTS
STYLE_CODES: Tuple[LearningStyleCode, ...] = _KLSI_STYLE_CODES


@dataclass(frozen=True, slots=True)
class ContextStyleSummary:
    context: str
    style: str
    ACCE: int
    AERO: int
    CE: int
    RO: int
    AC: int
    AE: int

    def as_dict(self) -> Dict[str, Any]:
        return {
            "context": self.context,
            "style": self.style,
            "ACCE": self.ACCE,
            "AERO": self.AERO,
            "CE": self.CE,
            "RO": self.RO,
            "AC": self.AC,
            "AE": self.AE,
        }


@dataclass(frozen=True, slots=True)
class ModeUsageSummary:
    count: int
    contexts: Tuple[str, ...]

    def as_dict(self) -> Dict[str, Any]:
        return {"count": self.count, "contexts": list(self.contexts)}


class RegressionConfigError(RuntimeError):
    """Raised when regression parameters are missing from the config."""


@lru_cache()
def _regression_cfg() -> Mapping[str, Any]:
    cfg = load_config()
    block = cfg.regression
    if not block:
        raise RegressionConfigError("Missing 'regression' section in KLSI config.")
    return block


@lru_cache()
def _lfi_cfg() -> Dict[str, Any]:
    block = _regression_cfg().get("lfi")
    if not block:
        raise RegressionConfigError("Missing 'regression.lfi' section in KLSI config.")
    return block


@lru_cache()
def _integrative_cfg() -> Dict[str, Any]:
    block = _regression_cfg().get("integrative_development")
    if not block:
        raise RegressionConfigError(
            "Missing 'regression.integrative_development' section in KLSI config."
        )
    return block


def _normalize_predictor(name: str, data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        mean = float(data["mean"])
        sd = float(data["sd"])
    except KeyError as exc:  # pragma: no cover - defensive safeguard
        missing = exc.args[0]
        raise RegressionConfigError(
            f"Predictor '{name}' is missing required key '{missing}'."
        ) from exc
    normalized = {
        "mean": mean,
        "sd": sd,
        "beta": float(data["beta"]) if "beta" in data else None,
        "squared_beta": float(data["squared_beta"]) if "squared_beta" in data else None,
        "orientation": data.get("orientation"),
    }
    return normalized


@lru_cache()
def _lfi_predictors() -> Dict[str, Dict[str, Any]]:
    raw = _lfi_cfg().get("predictors")
    if not raw:
        raise RegressionConfigError("Missing predictors in 'regression.lfi' configuration.")
    return {name: _normalize_predictor(name, payload) for name, payload in raw.items()}


@lru_cache()
def _lfi_params() -> Dict[str, Any]:
    cfg = _lfi_cfg()
    predictors = _lfi_predictors()
    try:
        mean = float(cfg["mean"])
        sd = float(cfg["sd"])
    except KeyError as exc:  # pragma: no cover - defensive safeguard
        missing = exc.args[0]
        raise RegressionConfigError(
            f"Missing LFI regression parameter '{missing}'."
        ) from exc

    means = {name: stats["mean"] for name, stats in predictors.items()}
    sds = {name: stats["sd"] for name, stats in predictors.items()}
    betas = {
        name: stats["beta"]
        for name, stats in predictors.items()
        if stats["beta"] is not None
    }
    acc_stats = predictors.get("acc_assm")
    if acc_stats and acc_stats.get("squared_beta") is not None:
        betas["acc_assm_sq"] = acc_stats["squared_beta"]

    curve_cfg = cfg.get("curve", {})
    range_cfg = curve_cfg.get("acc_range", {})
    start = int(range_cfg.get("min", -60))
    end = int(range_cfg.get("max", 60))
    step = int(range_cfg.get("step", 1)) or 1
    damping = float(curve_cfg.get("damping_factor", 0.8))
    if damping < 0 or damping > 1:
        damping = 0.8

    return {
        "mean": mean,
        "sd": sd,
        "predictors": predictors,
        "means": means,
        "sds": sds,
        "betas": betas,
        "orientation": acc_stats.get("orientation") if acc_stats else None,
        "acc_range": (start, end, step),
        "damping": damping,
    }


@lru_cache()
def _integrative_params() -> Dict[str, Any]:
    cfg = _integrative_cfg()
    try:
        mean = float(cfg["mean"])
        sd = float(cfg["sd"])
    except KeyError as exc:  # pragma: no cover - defensive safeguard
        missing = exc.args[0]
        raise RegressionConfigError(
            f"Missing Integrative Development parameter '{missing}'."
        ) from exc
    betas = {name: float(value) for name, value in cfg.get("betas", {}).items()}
    return {"mean": mean, "sd": sd, "betas": betas}


def z(value: Optional[float], mean: float, sd: float) -> float:
    if value is None:
        return 0.0
    if sd == 0:
        return 0.0
    return (float(value) - mean) / sd


def acc_assm_from_raw(ce: int, ro: int, ac: int, ae: int) -> int:
    """Compute Assim-Acc (spec orientation) = (AC+RO) - (AE+CE)."""
    return int((ac + ro) - (ae + ce))


def predict_lfi(
    *,
    age: Optional[float] = None,
    gender: Optional[float] = None,
    education: Optional[float] = None,
    specialization: Optional[float] = None,
    acc_assm: float,
) -> float:
    """Predict raw LFI in [0,1] using standardized betas (Model 3).

    Demographics default to sample means (z=0) if omitted.
    """
    params = _lfi_params()
    means = params["means"]
    sds = params["sds"]
    betas = params["betas"]
    predictors = params["predictors"]

    z_age = z(age, means.get("age", 0.0), sds.get("age", 1.0))
    z_gender = z(gender, means.get("gender", 0.0), sds.get("gender", 1.0))
    z_edu = z(education, means.get("education", 0.0), sds.get("education", 1.0))
    z_spec = z(specialization, means.get("specialization", 0.0), sds.get("specialization", 1.0))

    acc_stats = predictors.get("acc_assm")
    published_orientation = float(acc_assm)
    if acc_stats and acc_stats.get("orientation") == "accommodating_minus_assimilating":
        published_orientation = -float(acc_assm)
    z_acc = z(
        published_orientation,
        acc_stats["mean"] if acc_stats else 0.0,
        acc_stats["sd"] if acc_stats else 1.0,
    )
    z_acc_sq = z_acc ** 2

    z_y = (
        betas.get("age", 0.0) * z_age
        + betas.get("gender", 0.0) * z_gender
        + betas.get("education", 0.0) * z_edu
        + betas.get("specialization", 0.0) * z_spec
        + betas.get("acc_assm", 0.0) * z_acc
        + betas.get("acc_assm_sq", 0.0) * z_acc_sq
    )

    mean_lfi = params["mean"]
    sd_lfi = params["sd"]
    y = mean_lfi + z_y * sd_lfi
    return max(0.0, min(1.0, y))


def predicted_curve(
    acc_range: Iterable[float] | None = None,
    *,
    age: Optional[float] = None,
    gender: Optional[float] = None,
    education: Optional[float] = None,
    specialization: Optional[float] = None,
):
    """Generate predicted LFI values across an Acc-Assm range.

    Default range is -60..60 step 1, which comfortably spans common values.
    """
    params = _lfi_params()
    predictors = params["predictors"]
    acc_stats = predictors.get("acc_assm")
    start, end, step = params["acc_range"]
    if acc_range is None:
        stop = end + (1 if step > 0 else -1)
        acc_range = range(start, stop, step)

    points: List[Dict[str, float]] = []
    damping = params["damping"]
    mean_lfi = params["mean"]
    sd_lfi = params["sd"]
    beta_sq = params["betas"].get("acc_assm_sq", 0.0)
    acc_sd = acc_stats["sd"] if acc_stats else 1.0

    for x in acc_range:
        # Standardize around balance (0) using the published SD; mean intentionally 0
        z_acc = float(x) / acc_sd if acc_sd else 0.0
        z_acc_sq = z_acc ** 2
        z_y = beta_sq * z_acc_sq
        y = mean_lfi + z_y * sd_lfi
        if z_acc > 0:
            y = (y * damping) + (mean_lfi * (1 - damping))
        y = max(0.0, min(1.0, y))
        points.append({"acc_assm": float(x), "pred_lfi": y})
    return points


def predict_integrative_development(
    *,
    age: Optional[float] = None,
    gender: Optional[float] = None,
    education: Optional[float] = None,
    specialization: Optional[float] = None,
    acc_assm: float,
    lfi: float,
) -> float:
    """Predict Integrative Development score using Hypothesis 6 model.

    LFI (β=0.25**) is the strongest predictor of integrative development,
    demonstrating that flexible learners exhibit higher-order integrative
    thinking in Kolb & Kolb (2013).
    """

    lfi_params = _lfi_params()
    means = lfi_params["means"]
    sds = lfi_params["sds"]

    params = _integrative_params()
    betas = params["betas"]

    z_age = z(age, means.get("age", 0.0), sds.get("age", 1.0))
    z_gender = z(gender, means.get("gender", 0.0), sds.get("gender", 1.0))
    z_edu = z(education, means.get("education", 0.0), sds.get("education", 1.0))
    z_spec = z(specialization, means.get("specialization", 0.0), sds.get("specialization", 1.0))
    z_acc = z(acc_assm, means.get("acc_assm", 0.0), sds.get("acc_assm", 1.0))
    z_lfi = z(lfi, lfi_params["mean"], lfi_params["sd"])

    z_y = (
        betas.get("age", 0.0) * z_age
        + betas.get("gender", 0.0) * z_gender
        + betas.get("education", 0.0) * z_edu
        + betas.get("specialization", 0.0) * z_spec
        + betas.get("acc_assm", 0.0) * z_acc
        + betas.get("lfi", 0.0) * z_lfi
    )

    y = params["mean"] + z_y * params["sd"]
    return round(y, 2)


def analyze_lfi_contexts(contexts: List[Dict[str, int]]) -> Dict[str, Any]:
    """Analyze which learning styles are used in each of the 8 LFI contexts.

    This creates a profile like Mark's (98th %ile) or Jason's (4th %ile) showing
    how flexibly an individual moves around the learning space.

    Args:
        contexts: List of 8 dicts with keys CE, RO, AC, AE (rank values 1-4)

    Returns:
        {
            "context_styles": [
                {"context": "Starting_Something_New", "style": "Initiating", 
                 "ACCE": 2, "AERO": 8, "CE": 18, "RO": 20, "AC": 20, "AE": 28},
                ...
            ],
            "style_frequency": {"Balancing": 3, "Initiating": 2, ...},
            "mode_usage": {
                "CE": {"count": 5, "contexts": [...]},
                "RO": {"count": 2, "contexts": [...]},
                ...
            },
            "flexibility_pattern": "high" | "moderate" | "low"
        }
    """
    if len(contexts) != len(CONTEXT_NAMES):
        raise ValueError(f"Expected {len(CONTEXT_NAMES)} contexts, got {len(contexts)}")

    context_styles: List[ContextStyleSummary] = []
    style_freq: Dict[LearningStyleCode, int] = {}
    mode_counts: Dict[str, int] = {mode: 0 for mode in PRIMARY_MODE_CODES}
    
    for idx, ctx in enumerate(contexts):
        # Compute combination scores for this context
        ce_val = ctx.get("CE", 0)
        ro_val = ctx.get("RO", 0)
        ac_val = ctx.get("AC", 0)
        ae_val = ctx.get("AE", 0)
        
        acce = ac_val - ce_val
        aero = ae_val - ro_val
        
        # Classify style for this context
        style = None
        for name, rule in STYLE_CUTS.items():
            if rule(acce, aero):
                style = name
                break
        
        style_code = LearningStyleCode(style) if style else None
        if style_code:
            style_freq[style_code] = style_freq.get(style_code, 0) + 1
        
        # Track which mode was ranked highest (rank 4 = most preferred)
        ranks = {mode: ctx.get(mode, 0) for mode in PRIMARY_MODE_CODES}
        max_rank = max(ranks.values())
        for mode, rank in ranks.items():
            if rank == max_rank:
                mode_counts[mode] += 1
        
        context_name = CONTEXT_NAMES[idx] if idx < len(CONTEXT_NAMES) else f"Context_{idx + 1}"
        context_styles.append(
            ContextStyleSummary(
                context=context_name,
                style=(style_code.value if style_code else "Unclassified"),
                ACCE=acce,
                AERO=aero,
                CE=ce_val,
                RO=ro_val,
                AC=ac_val,
                AE=ae_val,
            )
        )
    
    # Determine flexibility pattern based on style diversity
    unique_styles = len(style_freq)
    if unique_styles >= 6:
        pattern = "high"  # Like Mark - uses 6+ different styles
    elif unique_styles >= 4:
        pattern = "moderate"
    else:
        pattern = "low"  # Like Jason - stuck in 1-3 styles
    
    # Build mode usage detail
    mode_usage: Dict[str, ModeUsageSummary] = {}
    for mode in PRIMARY_MODE_CODES:
        used_contexts = [
            cs.context
            for cs in context_styles
            if getattr(cs, mode) == max(cs.CE, cs.RO, cs.AC, cs.AE)
        ]
        mode_usage[mode] = ModeUsageSummary(count=mode_counts[mode], contexts=tuple(used_contexts))

    return {
        "context_styles": [entry.as_dict() for entry in context_styles],
        "style_frequency": {code.value: count for code, count in style_freq.items()},
        "mode_usage": {mode: summary.as_dict() for mode, summary in mode_usage.items()},
        "flexibility_pattern": pattern,
    }


def generate_lfi_heatmap(lfi_score: float, context_styles: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate heatmap data showing style usage intensity across contexts.

    Used for visualizations comparing low LFI (4th %ile) vs high LFI (98th %ile).

    Returns:
        {
            "lfi_percentile_band": "low" | "medium" | "high",
            "style_matrix": {
                "Imagining": 2, "Experiencing": 1, "Initiating": 0, ...
            },
            "region_coverage": {
                "Experiencing_quadrant": 3,  # CE-RO region
                "Reflecting_quadrant": 2,    # RO-AC region
                "Thinking_quadrant": 1,      # AC-AE region
                "Acting_quadrant": 2         # AE-CE region
            }
        }
    """
    # Determine LFI band
    if lfi_score >= 0.75:
        band = "high"
    elif lfi_score >= 0.60:
        band = "medium"
    else:
        band = "low"
    
    # Count style occurrences
    style_matrix = {code.value: 0 for code in STYLE_CODES}
    for cs in context_styles:
        style = cs.get("style")
        if style in style_matrix:
            style_matrix[style] += 1
    
    # Map styles to learning space regions
    region_map = {
        "Imagining": "Experiencing_quadrant",
        "Experiencing": "Experiencing_quadrant",
        "Initiating": "Acting_quadrant",
        "Reflecting": "Reflecting_quadrant",
        "Balancing": "Reflecting_quadrant",  # Central but RO-leaning
        "Acting": "Acting_quadrant",
        "Analyzing": "Thinking_quadrant",
        "Thinking": "Thinking_quadrant",
        "Deciding": "Thinking_quadrant",
    }
    
    region_coverage = {
        "Experiencing_quadrant": 0,
        "Reflecting_quadrant": 0,
        "Thinking_quadrant": 0,
        "Acting_quadrant": 0,
    }
    
    for style, count in style_matrix.items():
        region = region_map.get(style)
        if region:
            region_coverage[region] += count
    
    return {
        "lfi_percentile_band": band,
        "style_matrix": style_matrix,
        "region_coverage": region_coverage
    }
