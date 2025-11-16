from __future__ import annotations

from typing import Any, Sequence, TypeAlias, TYPE_CHECKING

from app.assessments.klsi_v4.types import BalanceMedians, CombinationMetrics, ScoreVector

if TYPE_CHECKING:  # pragma: no cover
    import numpy as _np
    from numpy.typing import NDArray as _NDArray

    IntArray = _NDArray[_np.int64]
    ModeMatrix: TypeAlias = _NDArray[_np.int64]
else:  # Runtime fallback keeps import lazy until needed
    IntArray = Any  # type: ignore[assignment]
    ModeMatrix = Any  # type: ignore[assignment]

_NUMPY_MODULE = None


def _require_numpy():
    """Import numpy lazily to avoid module load in non-batch workloads."""

    global _NUMPY_MODULE
    if _NUMPY_MODULE is None:
        import numpy as np  # type: ignore[import-not-found]

        _NUMPY_MODULE = np
    return _NUMPY_MODULE


def vectorized_combination_metrics(
    mode_matrix: ModeMatrix,
    *,
    medians: BalanceMedians,
) -> dict[str, IntArray]:
    """Compute combination metrics for many rows at once using NumPy.

    Args:
        mode_matrix: ``(n, 4)`` matrix ordered as ``CE, RO, AC, AE``.
        medians: Normative balance medians applied to every row.

    Returns:
        Dictionary mapping metric name to ``(n,)`` arrays (ACCE, AERO,
        assimilation_accommodation, converging_diverging, balance_acce,
        balance_aero).
    """

    np_mod = _require_numpy()
    matrix = np_mod.asarray(mode_matrix, dtype=np_mod.int64)
    if matrix.ndim != 2 or (matrix.size and matrix.shape[1] != 4):
        raise ValueError("mode_matrix must be shape (n, 4)")
    if matrix.size == 0:
        return {name: np_mod.empty((0,), dtype=np_mod.int64) for name in (
            "ACCE",
            "AERO",
            "assimilation_accommodation",
            "converging_diverging",
            "balance_acce",
            "balance_aero",
        )}

    ce, ro, ac, ae = matrix.T
    acce = ac - ce
    aero = ae - ro
    assimilation = (ac + ro) - (ae + ce)
    converging = (ac + ae) - (ce + ro)
    balance_acce = np_mod.abs(ac - (ce + medians.acce))
    balance_aero = np_mod.abs(ae - (ro + medians.aero))

    return {
        "ACCE": acce,
        "AERO": aero,
        "assimilation_accommodation": assimilation,
        "converging_diverging": converging,
        "balance_acce": balance_acce,
        "balance_aero": balance_aero,
    }


def compute_batch_combination_metrics(
    vectors: Sequence[ScoreVector],
    *,
    medians: BalanceMedians,
) -> list[CombinationMetrics]:
    """Convert a sequence of score vectors into combination metrics.

    This is the high-level helper that future batch endpoints will use after
    loading raw mode totals into memory.
    """

    if not vectors:
        return []

    matrix = _vectors_to_matrix(vectors)
    arrays = vectorized_combination_metrics(matrix, medians=medians)
    rows = matrix.shape[0]
    result: list[CombinationMetrics] = []
    for idx in range(rows):
        result.append(
            CombinationMetrics(
                ACCE=int(arrays["ACCE"][idx]),
                AERO=int(arrays["AERO"][idx]),
                assimilation_accommodation=int(arrays["assimilation_accommodation"][idx]),
                converging_diverging=int(arrays["converging_diverging"][idx]),
                balance_acce=int(arrays["balance_acce"][idx]),
                balance_aero=int(arrays["balance_aero"][idx]),
            )
        )
    return result


def _vectors_to_matrix(vectors: Sequence[ScoreVector]) -> ModeMatrix:
    np_mod = _require_numpy()
    matrix = np_mod.empty((len(vectors), 4), dtype=np_mod.int64)
    for idx, vector in enumerate(vectors):
        matrix[idx] = (vector.CE, vector.RO, vector.AC, vector.AE)
    return matrix


__all__ = [
    "vectorized_combination_metrics",
    "compute_batch_combination_metrics",
]
