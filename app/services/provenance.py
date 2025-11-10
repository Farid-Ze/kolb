from __future__ import annotations

from typing import Dict, Iterable, Optional

from sqlalchemy.orm import Session

from app.models.klsi import (
    CombinationScore,
    PercentileScore,
    ScaleProvenance,
    ScaleScore,
)


ScaleDict = Dict[str, float | int | None]


def _normalize_provenance(tag: str) -> tuple[str, Optional[str]]:
    if tag.startswith("DB:"):
        return "database", tag[3:]
    if tag.startswith("Appendix:"):
        return "appendix", tag.split(":", 1)[1]
    return "unknown", None


def upsert_scale_provenance(
    db: Session,
    session_id: int,
    raw_scores: Dict[str, float | int],
    percentile_map: Dict[str, Optional[float]],
    provenance_map: Dict[str, str],
    truncations: Dict[str, bool],
) -> None:
    db.query(ScaleProvenance).filter(ScaleProvenance.session_id == session_id).delete(
        synchronize_session=False
    )
    for scale_code in ("CE", "RO", "AC", "AE", "ACCE", "AERO"):
        if scale_code not in raw_scores or scale_code not in provenance_map:
            continue
        raw_value = raw_scores[scale_code]
        if raw_value is None:
            continue
        source_kind, norm_group = _normalize_provenance(provenance_map[scale_code])
        db.add(
            ScaleProvenance(
                session_id=session_id,
                scale_code=scale_code,
                raw_score=float(raw_value),
                percentile_value=percentile_map.get(scale_code),
                provenance_tag=provenance_map[scale_code],
                source_kind=source_kind,
                norm_group=norm_group,
                truncated=bool(truncations.get(scale_code, False)),
            )
        )


def backfill_scale_provenance(
    db: Session,
    session_ids: Optional[Iterable[int]] = None,
) -> None:
    query = (
        db.query(
            PercentileScore,
            ScaleScore,
            CombinationScore,
        )
        .join(ScaleScore, ScaleScore.session_id == PercentileScore.session_id)
        .join(CombinationScore, CombinationScore.session_id == PercentileScore.session_id)
    )
    if session_ids is not None:
        query = query.filter(PercentileScore.session_id.in_(list(session_ids)))

    for percentile, scales, combo in query.all():
        raw_scores: Dict[str, float | int] = {
            "CE": scales.CE_raw,
            "RO": scales.RO_raw,
            "AC": scales.AC_raw,
            "AE": scales.AE_raw,
            "ACCE": combo.ACCE_raw,
            "AERO": combo.AERO_raw,
        }
        percentiles = {
            "CE": percentile.CE_percentile,
            "RO": percentile.RO_percentile,
            "AC": percentile.AC_percentile,
            "AE": percentile.AE_percentile,
            "ACCE": percentile.ACCE_percentile,
            "AERO": percentile.AERO_percentile,
        }
        provenance_map = {
            "CE": percentile.CE_source,
            "RO": percentile.RO_source,
            "AC": percentile.AC_source,
            "AE": percentile.AE_source,
            "ACCE": percentile.ACCE_source,
            "AERO": percentile.AERO_source,
        }
        truncated = {
            key: bool(percentile.truncated_scales.get(key)) if percentile.truncated_scales else False
            for key in ("CE", "RO", "AC", "AE", "ACCE", "AERO")
        }
        upsert_scale_provenance(
            db,
            percentile.session_id,
            raw_scores,
            percentiles,
            provenance_map,
            truncated,
        )
    db.flush()
