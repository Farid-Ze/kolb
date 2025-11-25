"""Pure KLSI 4.0 calculations detached from I/O concerns.

This module contains pure functions for psychometric computations.
All functions are:
- Pure (no side effects, deterministic)
- Testable (no I/O dependencies)
- Type-safe (comprehensive type hints)
- Well-documented (Google-style docstrings)

Constants are imported from app.assessments.constants to avoid magic numbers.
"""

from math import sqrt, isnan, isinf
from typing import Iterable, Tuple

from app.assessments.constants import LEARNING_MODES
from .types import BalanceMedians, CombinationMetrics, ScoreVector, StyleIntensityMetrics

MODES = LEARNING_MODES  # Backward compatibility alias


def _safe_div(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Perform division with protection against ZeroDivisionError, NaN, and Infinity."""
    try:
        if denominator == 0:
            return default
        result = numerator / denominator
        if isnan(result) or isinf(result):
            return default
        return result
    except (ZeroDivisionError, OverflowError):
        return default


def aggregate_mode_scores(rank_tuples: Iterable[Tuple[str, int]]) -> ScoreVector:
    """Sum rank tuples into raw learning mode totals.
    
    This is the first stage of KLSI scoring: aggregating ipsative rankings
    into raw scale scores for each of the four learning modes.
    
    Args:
        rank_tuples: Iterable of (mode, rank_value) pairs from user responses.
                     Each tuple represents one choice from the forced-choice items.
                     
    Returns:
        ScoreVector containing raw sums for CE, RO, AC, and AE modes.
        The sum CE + RO + AC + AE should equal 120 for 12 items (integrity check).
        
    Example:
        >>> ranks = [("CE", 3), ("RO", 1), ("AC", 4), ("AE", 2), ...]
        >>> scores = aggregate_mode_scores(ranks)
        >>> scores.CE + scores.RO + scores.AC + scores.AE  # Should be 120
        120
        
    Note:
        This function is pure and testable without database access.
        Invalid mode names are silently ignored (defensive programming).
        Strictly enforces integer values for ranks.
    """
    # Optimization: Use direct dictionary update instead of Counter for speed
    # This avoids the overhead of Counter's internal checks and method calls
    totals = {"CE": 0, "RO": 0, "AC": 0, "AE": 0}
    for mode, value in rank_tuples:
        if not isinstance(value, int):
            # Strict validation: reject floats even if they are whole numbers
            raise TypeError(f"Rank value must be integer, got {type(value).__name__}")
            
        if mode in totals:
            totals[mode] += value
    return ScoreVector(CE=totals["CE"], RO=totals["RO"], AC=totals["AC"], AE=totals["AE"])


def calculate_combination_metrics(scale: ScoreVector, medians: BalanceMedians) -> CombinationMetrics:
    """Derive dialectic and balance metrics from raw mode totals.
    
    This is the second stage of KLSI scoring: computing derived metrics that
    describe learning style tendencies and balance.
    
    Formulas:
        ACCE = AC - CE  (Abstract-Concrete dialectic)
        AERO = AE - RO  (Action-Reflection dialectic)
        Assim-Accom = (AC + RO) - (AE + CE)
        Conv-Div = (AC + AE) - (CE + RO)
        Balance_ACCE = |AC - (CE + median_ACCE)|
        Balance_AERO = |AE - (RO + median_AERO)|
        
    Args:
        scale: Raw learning mode scores (CE, RO, AC, AE).
        medians: Normative median offsets for balance calculations.
        
    Returns:
        CombinationMetrics containing dialectics and balance measures.
        
    Note:
        ACCE and AERO map to the 3x3 learning style grid via cutpoints.
        Balance metrics measure distance from normative center (lower = more balanced).
        
    References:
        - KLSI 4.0 Guide, Figure 4 (Learning Style Grid)
        - KLSI 4.0 Guide, Appendix 1 (Score Distributions)
    """
    acce = scale.AC - scale.CE  # Kolb LSI 4.0 Guide, p.45 (AC vs CE dialectic)
    aero = scale.AE - scale.RO  # Kolb LSI 4.0 Guide, p.45 (AE vs RO dialectic)
    return CombinationMetrics(
        ACCE=acce,
        AERO=aero,
        assimilation_accommodation=(scale.AC + scale.RO) - (scale.AE + scale.CE),  # Kolb Guide, p.46
        converging_diverging=(scale.AC + scale.AE) - (scale.CE + scale.RO),  # Kolb Guide, p.46
        balance_acce=abs(scale.AC - (scale.CE + medians.acce)),  # Kolb Guide, p.48 (balance to ACCE median)
        balance_aero=abs(scale.AE - (scale.RO + medians.aero)),  # Kolb Guide, p.48 (balance to AERO median)
    )


def calculate_style_intensity(acc: int, aer: int) -> StyleIntensityMetrics:
    """Calculate learning style intensity using distance metrics.
    
    Style intensity measures how far a learner's profile is from the center
    of the learning style grid (ACCE=9, AERO=6 normative center).
    
    Metrics:
        Manhattan distance: |ACCE| + |AERO| (sum of absolute deviations)
        Euclidean distance: sqrt(ACCE² + AERO²) (straight-line distance)
        
    Args:
        acc: ACCE dialectic score (AC - CE).
        aer: AERO dialectic score (AE - RO).
        
    Returns:
        StyleIntensityMetrics with manhattan and euclidean distance measures.
        
    Interpretation:
        Higher values = stronger style preference (more distance from center)
        Lower values = more balanced across modes (closer to center)
        
    Example:
        >>> # Strongly deciding style: ACCE=20, AERO=15
        >>> intensity = calculate_style_intensity(20, 15)
        >>> intensity.manhattan  # 35
        35
        >>> round(intensity.euclidean, 1)  # 25.0
        25.0
        
    Note:
        Intensity is independent of style type - two people with different
        styles can have the same intensity if they're equidistant from center.
    """
    manhattan = abs(acc) + abs(aer)
    euclidean = sqrt(acc**2 + aer**2)
    return StyleIntensityMetrics(manhattan=manhattan, euclidean=euclidean)


def calculate_lfi_variance(context_ranks: Iterable[dict[str, int]]) -> float:
    """Calculate Learning Flexibility Index (LFI) using variance method.
    
    LFI measures the variability of a learner's ranking of learning modes
    across different contexts. A higher LFI indicates greater flexibility
    (adapting style to context), while a lower LFI indicates a consistent
    (rigid) learning style regardless of context.
    
    Formula:
        LFI = Sum((Ri - R_bar)^2) / N
        Where:
        - Ri is the rank of a mode in a specific context
        - R_bar is the mean rank of that mode across all contexts
        - N is the number of contexts
        - Summation is performed over all contexts and all 4 modes.
        
    Args:
        context_ranks: Iterable of dictionaries, where each dict represents
                       a context and maps mode codes ('CE', 'RO', 'AC', 'AE')
                       to their integer rank (1-4).
                       
    Returns:
        Float representing the LFI score.
    """
    contexts = list(context_ranks)
    n = len(contexts)
    if n == 0:
        return 0.0
        
    modes = ["CE", "RO", "AC", "AE"]
    
    # 1. Calculate sums for means
    totals = {m: 0 for m in modes}
    for ctx in contexts:
        for m in modes:
            totals[m] += ctx.get(m, 0)
            
    means = {m: totals[m] / n for m in modes}
    
    # 2. Calculate sum of squared deviations
    ssd = 0.0
    for ctx in contexts:
        for m in modes:
            diff = ctx.get(m, 0) - means[m]
            ssd += diff * diff
            
    # 3. Divide by N
    return ssd / n
