import hashlib
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.learning import (
    CombinationScore,
    LearningStyleType,
    ScaleScore,
    UserLearningStyle,
)
from app.models.klsi.norms import PercentileScore
from app.models.klsi.research import ResearchStudy
from app.models.klsi.user import User
from app.schemas.research import (
    ResearchStudyDataOut,
    StudyDataDateRange,
    StudyDataPoint,
    StudyDataSummary,
)


@dataclass
class StudyDataFilters:
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    learning_style: Optional[str] = None
    norm_group: Optional[str] = None
    user_email: Optional[str] = None


def build_study_dataset(
    db: Session,
    study: ResearchStudy,
    filters: StudyDataFilters,
) -> ResearchStudyDataOut:
    """Aggregate completed sessions for research export."""

    window_start = filters.start_at or study.started_at
    window_end = filters.end_at or study.completed_at

    query = (
        db.query(
            AssessmentSession.id.label("session_id"),
            AssessmentSession.user_id.label("user_id"),
            User.email.label("user_email"),
            User.full_name.label("user_name"),
            AssessmentSession.end_time.label("generated_at"),
            AssessmentSession.start_time.label("start_time"),
            ScaleScore.CE_raw.label("ce_score"),
            ScaleScore.RO_raw.label("ro_score"),
            ScaleScore.AC_raw.label("ac_score"),
            ScaleScore.AE_raw.label("ae_score"),
            CombinationScore.ACCE_raw.label("ac_ce"),
            CombinationScore.AERO_raw.label("ae_ro"),
            LearningStyleType.style_name.label("learning_style"),
            LearningStyleType.style_code.label("style_code"),
            PercentileScore.norm_group_used.label("norm_group"),
        )
        .join(User, User.id == AssessmentSession.user_id)
        .join(ScaleScore, ScaleScore.session_id == AssessmentSession.id)
        .join(CombinationScore, CombinationScore.session_id == AssessmentSession.id)
        .join(UserLearningStyle, UserLearningStyle.session_id == AssessmentSession.id)
        .join(
            LearningStyleType,
            LearningStyleType.id == UserLearningStyle.primary_style_type_id,
        )
        .outerjoin(PercentileScore, PercentileScore.session_id == AssessmentSession.id)
        .filter(AssessmentSession.status == SessionStatus.completed)
        .filter(AssessmentSession.end_time.isnot(None))
    )

    if window_start is not None:
        query = query.filter(AssessmentSession.end_time >= window_start)
    if window_end is not None:
        query = query.filter(AssessmentSession.end_time <= window_end)
    if filters.learning_style:
        lowered = filters.learning_style.lower()
        query = query.filter(func.lower(LearningStyleType.style_name) == lowered)
    if filters.norm_group:
        query = query.filter(PercentileScore.norm_group_used == filters.norm_group)
    if filters.user_email:
        query = query.filter(User.email.ilike(f"%{filters.user_email}%"))

    rows = query.order_by(AssessmentSession.end_time.desc()).all()

def _hash_participant(user_id: int, email: str) -> str:
    """Generate a consistent anonymous hash for a participant."""
    # In production, use a secret salt from settings
    salt = "klsi-research-salt-v1" 
    payload = f"{user_id}:{email}:{salt}"
    return hashlib.sha256(payload.encode()).hexdigest()[:16]

    data_points: List[StudyDataPoint] = []
    for row in rows:
        duration: Optional[int] = None
        if row.start_time and row.generated_at:
            total_seconds = (row.generated_at - row.start_time).total_seconds()
            if total_seconds >= 0:
                duration = int(total_seconds)
        
        # Anonymize participant (Audit Point 4)
        p_hash = _hash_participant(row.user_id, row.user_email)
        
        data_points.append(
            StudyDataPoint(
                session_id=row.session_id,
                participant_hash=p_hash,
                generated_at=row.generated_at,
                ce_score=row.ce_score,
                ro_score=row.ro_score,
                ac_score=row.ac_score,
                ae_score=row.ae_score,
                ac_ce=row.ac_ce,
                ae_ro=row.ae_ro,
                learning_style=row.learning_style,
                style_code=row.style_code,
                norm_group=row.norm_group,
                assessment_duration_seconds=duration,
            )
        )

    style_counter = Counter(
        point.learning_style for point in data_points if point.learning_style
    )
    date_range = None
    if data_points:
        earliest = min(point.generated_at for point in data_points)
        latest = max(point.generated_at for point in data_points)
        if earliest and latest:
            date_range = StudyDataDateRange(earliest=earliest, latest=latest)

    summary = StudyDataSummary(
        total_sessions=len(data_points),
        unique_participants=len({point.user_id for point in data_points}),
        date_range=date_range,
        style_distribution=dict(style_counter),
    )

    filters_payload: Dict[str, Optional[str]] = {
        "start_date": window_start.isoformat() if window_start else None,
        "end_date": window_end.isoformat() if window_end else None,
        "learning_style": filters.learning_style,
        "norm_group": filters.norm_group,
        "user_email": filters.user_email,
    }

    from app.utils.ids import encode_public_id
    return ResearchStudyDataOut(
        study_public_id=encode_public_id(study.id),
        study_title=study.title,
        filters_applied=filters_payload,
        data_points=data_points,
        summary=summary,
    )
