"""Pure KLSI 4.0 calculations detached from I/O concerns."""

from __future__ import annotations

from collections import Counter
from math import sqrt
from typing import Iterable, Tuple

from .types import BalanceMedians, CombinationMetrics, ScoreVector, StyleIntensityMetrics

MODES = ("CE", "RO", "AC", "AE")


def aggregate_mode_scores(rank_tuples: Iterable[Tuple[str, int]]) -> ScoreVector:
    """Sum rank tuples into raw learning mode totals."""
    totals = Counter({mode: 0 for mode in MODES})
    for mode, value in rank_tuples:
        if mode in totals:
            totals[mode] += int(value)
    return ScoreVector(CE=totals["CE"], RO=totals["RO"], AC=totals["AC"], AE=totals["AE"])


def calculate_combination_metrics(scale: ScoreVector, medians: BalanceMedians) -> CombinationMetrics:
    """Derive dialectic and balance metrics from raw mode totals."""
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
    """Return standard intensity metrics used in reporting."""
    manhattan = abs(acc) + abs(aer)
    euclidean = sqrt(acc**2 + aer**2)
    return StyleIntensityMetrics(manhattan=manhattan, euclidean=euclidean)
