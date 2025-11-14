"""Pure KLSI 4.0 calculations detached from I/O concerns.

This module contains pure functions for psychometric computations.
All functions are:
- Pure (no side effects, deterministic)
- Testable (no I/O dependencies)
- Type-safe (comprehensive type hints)
- Well-documented (Google-style docstrings)

Constants are imported from app.assessments.constants to avoid magic numbers.
"""

from __future__ import annotations

from collections import Counter
from math import sqrt
from typing import Iterable, Tuple

from app.assessments.constants import LEARNING_MODES
from .types import BalanceMedians, CombinationMetrics, ScoreVector, StyleIntensityMetrics

MODES = LEARNING_MODES  # Backward compatibility alias


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
    """
    totals = Counter({mode: 0 for mode in MODES})
    for mode, value in rank_tuples:
        if mode in totals:
            totals[mode] += int(value)
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
    acce = scale.AC - scale.CE
    aero = scale.AE - scale.RO
    return CombinationMetrics(
        ACCE=acce,
        AERO=aero,
        assimilation_accommodation=(scale.AC + scale.RO) - (scale.AE + scale.CE),
        converging_diverging=(scale.AC + scale.AE) - (scale.CE + scale.RO),
        balance_acce=abs(scale.AC - (scale.CE + medians.acce)),
        balance_aero=abs(scale.AE - (scale.RO + medians.aero)),
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
