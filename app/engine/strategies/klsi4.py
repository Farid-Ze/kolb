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


class KLSI4Strategy(ScoringStrategy):
    code = "KLSI4.0"

    def finalize(self, db: Session, session_id: int) -> Dict[str, Any]:
        scale = compute_raw_scale_scores(db, session_id)
        db.flush()
        combo = compute_combination_scores(db, scale)
        db.flush()
        style, intensities = assign_learning_style(db, combo)
        db.flush()
        lfi = compute_lfi(db, session_id)
        db.flush()
        percentiles = apply_percentiles(db, session_id, scale, combo)
        db.flush()
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
