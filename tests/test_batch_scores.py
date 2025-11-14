from __future__ import annotations

import numpy as np
import pytest

from app.assessments.klsi_v4.calculations import calculate_combination_metrics
from app.assessments.klsi_v4.types import BalanceMedians, ScoreVector
from app.services.batch_scores import (
    compute_batch_combination_metrics,
    vectorized_combination_metrics,
)


@pytest.fixture(scope="module")
def medians() -> BalanceMedians:
    return BalanceMedians(acce=9, aero=6)


def _sample_vectors() -> list[ScoreVector]:
    return [
        ScoreVector(CE=32, RO=28, AC=40, AE=35),
        ScoreVector(CE=27, RO=29, AC=39, AE=25),
        ScoreVector(CE=30, RO=30, AC=30, AE=30),
    ]


def test_vectorized_combination_metrics_matches_scalar(medians: BalanceMedians):
    vectors = _sample_vectors()
    matrix = np.array([[v.CE, v.RO, v.AC, v.AE] for v in vectors], dtype=np.int64)

    arrays = vectorized_combination_metrics(matrix, medians=medians)

    scalar = [calculate_combination_metrics(v, medians) for v in vectors]
    for idx, combo in enumerate(scalar):
        assert combo.ACCE == arrays["ACCE"][idx]
        assert combo.AERO == arrays["AERO"][idx]
        assert combo.assimilation_accommodation == arrays["assimilation_accommodation"][idx]
        assert combo.converging_diverging == arrays["converging_diverging"][idx]
        assert combo.balance_acce == arrays["balance_acce"][idx]
        assert combo.balance_aero == arrays["balance_aero"][idx]


def test_vectorized_combination_metrics_validates_shape(medians: BalanceMedians):
    bad_matrix = np.array([1, 2, 3])
    with pytest.raises(ValueError):
        vectorized_combination_metrics(bad_matrix, medians=medians)


def test_compute_batch_combination_metrics_returns_dataclasses(medians: BalanceMedians):
    vectors = _sample_vectors()
    combos = compute_batch_combination_metrics(vectors, medians=medians)

    assert len(combos) == len(vectors)
    assert all(hasattr(combo, "ACCE") for combo in combos)


def test_compute_batch_combination_metrics_empty(medians: BalanceMedians):
    assert compute_batch_combination_metrics([], medians=medians) == []
