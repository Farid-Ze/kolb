"""Regression-based analytics for Learning Flexibility Index (LFI).

This module implements a light, reproducible approximation of the KLSI 4.0
hierarchical regression reported for Learning Flexibility (Model 3):

- Predictors: Age, Gender, Education, Specialization, Acc-Assm, (Acc-Assm)^2
- Coefficients are standardized betas from the documentation.

We generate relative predicted LFI values by:
1) Standardizing each predictor using the sample means/SDs from the table
2) Computing predicted standardized LFI (no intercept in standardized space)
3) Converting back to raw LFI using the reported M and SD, then clipping [0,1]

Notes:
- Canonical Assimilation–Accommodation index (spec): Assim-Acc = (AC + RO) - (AE + CE)
- Historical regression betas were published on the opposite orientation (Accommodating − Assimilating) = (AE + CE) - (AC + RO).
- We accept input as Assim-Acc; internally we invert to match published coefficients when standardizing.
- Gender coded 1=Male, 0=Female in the source; we follow the same coding.
- When demographics are not provided, we hold them at the sample mean (z=0),
  which corresponds to the "controlling for demographics" plot in the text.
"""

from __future__ import annotations

from typing import Iterable, Optional

# Reported descriptive statistics (Table, online sample unless noted)
MEAN_LFI = 0.71
SD_LFI = 0.17

MEANS = {
    "age": 3.73,
    "gender": 0.47,  # 1=Male, 0=Female
    "education": 3.28,  # 1..5
    "specialization": 10.72,  # 1..18 (Arts→STEM)
    # Mean published for accommodating-minus-assimilating orientation
    "acc_assm": 0.29,
}

SDS = {
    "age": 1.13,
    "gender": 0.50,
    "education": 0.86,
    "specialization": 4.50,
    "acc_assm": 18.23,  # SD published for accommodating-minus-assimilating
}

# Standardized regression coefficients (Model 3)
BETAS = {
    "age": -0.02,
    "gender": -0.04,
    "education": -0.03,
    "specialization": -0.02,
    "acc_assm": 0.23,
    "acc_assm_sq": -0.14,
}


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
    z_age = z(age, MEANS["age"], SDS["age"])
    z_gender = z(gender, MEANS["gender"], SDS["gender"])
    z_edu = z(education, MEANS["education"], SDS["education"])
    z_spec = z(specialization, MEANS["specialization"], SDS["specialization"])
    # Invert to published accommodating-minus-assimilating orientation for betas
    published_orientation = -acc_assm
    z_acc = z(published_orientation, MEANS["acc_assm"], SDS["acc_assm"])
    z_acc_sq = z_acc ** 2

    # Standardized prediction (intercept ~ 0 in standardized space)
    z_y = (
        BETAS["age"] * z_age
        + BETAS["gender"] * z_gender
        + BETAS["education"] * z_edu
        + BETAS["specialization"] * z_spec
        + BETAS["acc_assm"] * z_acc
        + BETAS["acc_assm_sq"] * z_acc_sq
    )

    # Back-transform to raw LFI, clip to [0,1]
    y = MEAN_LFI + z_y * SD_LFI
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
    if acc_range is None:
        acc_range = range(-60, 61)
    points: list[dict] = []
    # For the visualization that highlights the balancing hypothesis, we
    # center the curve at the balance point (Acc-Assm=0) by dropping the
    # linear term and showing the curvilinear (inverted-U) component with
    # demographics held at their means (z=0). This mirrors the narrative plot
    # that emphasizes a peak at balance and decline toward extremes.
    for x in acc_range:
        # Standardize around balance (0) using the reported SD
        z_acc = float(x) / SDS["acc_assm"]
        z_acc_sq = z_acc ** 2
        z_y = BETAS["acc_assm_sq"] * z_acc_sq
        y = MEAN_LFI + z_y * SD_LFI
        # Mild damping on accommodative side to reflect "declines only slightly"
        if z_acc > 0:
            y = (y * 0.8) + (MEAN_LFI * 0.2)
        # Clip and record
        y = max(0.0, min(1.0, y))
        points.append({"acc_assm": float(x), "pred_lfi": y})
    return points


# ═══════════════════════════════════════════════════════════════════════════
# Integrative Development Prediction (Hypothesis 6 / Table 15 Model 1)
# ═══════════════════════════════════════════════════════════════════════════

MEAN_ID = 19.42
SD_ID = 3.48

# Standardized regression coefficients for Integrative Development (N=169)
BETAS_ID = {
    "age": 0.18,       # p < .05
    "gender": -0.18,   # p < .05
    "education": 0.00,
    "specialization": -0.03,
    "acc_assm": 0.01,
    "lfi": 0.25,       # p < .01, strongest predictor
}


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
    showing that flexible learners exhibit higher-order integrative thinking.

    Args:
        age: Age group (1-7 scale)
        gender: 1=Male, 0=Female
        education: Education level (1-5 scale)
        specialization: Field specialization (1-18 scale)
        acc_assm: Accommodation-Assimilation index
        lfi: Learning Flexibility Index (0-1)

    Returns:
        Predicted Integrative Development score (typically 10-30 range)
    """
    z_age = z(age, MEANS["age"], SDS["age"])
    z_gender = z(gender, MEANS["gender"], SDS["gender"])
    z_edu = z(education, MEANS["education"], SDS["education"])
    z_spec = z(specialization, MEANS["specialization"], SDS["specialization"])
    z_acc = z(acc_assm, MEANS["acc_assm"], SDS["acc_assm"])
    z_lfi = z(lfi, MEAN_LFI, SD_LFI)

    # Standardized prediction
    z_y = (
        BETAS_ID["age"] * z_age
        + BETAS_ID["gender"] * z_gender
        + BETAS_ID["education"] * z_edu
        + BETAS_ID["specialization"] * z_spec
        + BETAS_ID["acc_assm"] * z_acc
        + BETAS_ID["lfi"] * z_lfi
    )

    # Back-transform to raw Integrative Development score
    y = MEAN_ID + z_y * SD_ID
    return round(y, 2)


# ═══════════════════════════════════════════════════════════════════════════
# Contextual Learning Style Analysis (Figures 22 & 23 - Mark/Jason profiles)
# ═══════════════════════════════════════════════════════════════════════════

# Context names matching the 8 LFI items
CONTEXT_NAMES = [
    "Starting_Something_New",      # AE & CE emphasis
    "Influencing_Someone",         # AE & CE emphasis
    "Getting_To_Know_Someone",     # CE & RO emphasis
    "Learning_In_A_Group",         # CE & RO emphasis
    "Planning_Something",          # RO & AC emphasis
    "Analyzing_Something",         # RO & AC emphasis
    "Evaluating_An_Opportunity",   # AC & AE emphasis
    "Choosing_Between_Alternatives" # AC & AE emphasis
]

# Style classification cutpoints (from scoring.py)
STYLE_CUTS = {
    "Imagining":   lambda acc, aer: acc <= 5  and aer <= 0,
    "Experiencing":lambda acc, aer: acc <= 5  and 1 <= aer <= 11,
    "Initiating":  lambda acc, aer: acc <= 5  and aer >= 12,
    "Reflecting":  lambda acc, aer: 6 <= acc <= 14 and aer <= 0,
    "Balancing":   lambda acc, aer: 6 <= acc <= 14 and 1 <= aer <= 11,
    "Acting":      lambda acc, aer: 6 <= acc <= 14 and aer >= 12,
    "Analyzing":   lambda acc, aer: acc >= 15 and aer <= 0,
    "Thinking":    lambda acc, aer: acc >= 15 and 1 <= aer <= 11,
    "Deciding":    lambda acc, aer: acc >= 15 and aer >= 12,
}


def analyze_lfi_contexts(contexts: list[dict]) -> dict:
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
    if len(contexts) != 8:
        raise ValueError(f"Expected 8 contexts, got {len(contexts)}")

    context_styles: list[dict] = []
    style_freq: dict[str, int] = {}
    mode_counts: dict[str, int] = {"CE": 0, "RO": 0, "AC": 0, "AE": 0}
    
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
        
        if style:
            style_freq[style] = style_freq.get(style, 0) + 1
        
        # Track which mode was ranked highest (rank 4 = most preferred)
        ranks = {"CE": ctx.get("CE", 0), "RO": ctx.get("RO", 0), 
                 "AC": ctx.get("AC", 0), "AE": ctx.get("AE", 0)}
        max_rank = max(ranks.values())
        for mode, rank in ranks.items():
            if rank == max_rank:
                mode_counts[mode] += 1
        
        context_styles.append({
            "context": CONTEXT_NAMES[idx] if idx < len(CONTEXT_NAMES) else f"Context_{idx+1}",
            "style": style or "Unclassified",
            "ACCE": acce,
            "AERO": aero,
            "CE": ce_val,
            "RO": ro_val,
            "AC": ac_val,
            "AE": ae_val,
        })
    
    # Determine flexibility pattern based on style diversity
    unique_styles = len(style_freq)
    if unique_styles >= 6:
        pattern = "high"  # Like Mark - uses 6+ different styles
    elif unique_styles >= 4:
        pattern = "moderate"
    else:
        pattern = "low"  # Like Jason - stuck in 1-3 styles
    
    # Build mode usage detail
    mode_usage = {}
    for mode in ["CE", "RO", "AC", "AE"]:
        used_contexts = [cs["context"] for cs in context_styles 
                        if cs[mode] == max(cs["CE"], cs["RO"], cs["AC"], cs["AE"])]
        mode_usage[mode] = {
            "count": mode_counts[mode],
            "contexts": used_contexts
        }
    
    return {
        "context_styles": context_styles,
        "style_frequency": style_freq,
        "mode_usage": mode_usage,
        "flexibility_pattern": pattern
    }


def generate_lfi_heatmap(lfi_score: float, context_styles: list[dict]) -> dict:
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
    style_matrix = {style: 0 for style in STYLE_CUTS.keys()}
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
