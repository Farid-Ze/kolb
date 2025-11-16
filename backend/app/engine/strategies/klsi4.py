from __future__ import annotations

from typing import Any, Dict

from sqlalchemy.orm import Session

from app.assessments.klsi_v4.logic import (
    apply_percentiles,
    assign_learning_style,
    compute_combination_scores,
    compute_lfi,
    compute_raw_scale_scores,
    compute_longitudinal_delta,
)
from app.engine.strategies.base import ScoringStrategy
from app.core.metrics import count_calls, measure_time, timer


class KLSI4Strategy(ScoringStrategy):
    code = "KLSI4.0"

    @count_calls("pipeline.klsi4.finalize.calls")
    @measure_time("pipeline.klsi4.finalize", histogram=True)
    def finalize(self, db: Session, session_id: int) -> Dict[str, Any]:
        with timer("pipeline.klsi4.finalize"):
            # Compute pipeline artifacts; defer flush until dependent graphs are ready
            scale = compute_raw_scale_scores(db, session_id)
            combo = compute_combination_scores(db, scale)
            style, intensities = assign_learning_style(db, combo)
            lfi = compute_lfi(db, session_id)
            percentiles = apply_percentiles(db, session_id, scale, combo)
            # Single flush for core artifacts
            db.flush()
            # Optional delta (persisted only if produced)
            delta = compute_longitudinal_delta(db, session_id, combo, lfi, intensities)
            if delta:
                db.flush()
            return {
                "scale": scale,
                "combo": combo,
                "style": style,
                "intensity": intensities,
                "lfi": lfi,
                "percentiles": percentiles,
                "delta": delta,
            }
