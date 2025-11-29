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
    page: int = 1
    size: int = 50
    cursor: Optional[str] = None


def _hash_participant(user_id: int, email: str) -> str:
    """Generate a consistent anonymous hash for a participant."""
    # In production, use a secret salt from settings
    salt = "klsi-research-salt-v1" 
    payload = f"{user_id}:{email}:{salt}"
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


from typing import Union
from app.schemas.research import ResearchStudyDataCursorOut

def build_study_dataset(
    db: Session,
    study: ResearchStudy,
    filters: StudyDataFilters,
) -> Union[ResearchStudyDataOut, ResearchStudyDataCursorOut]:
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

    if filters.norm_group:
        query = query.filter(PercentileScore.norm_group_used == filters.norm_group)

    # Common Metadata Calculation
    # Note: Count is expensive for large datasets, might skip for cursor mode in future optimization
    total = query.count()

    # Mock Psychometric Stats
    reliability_stats = {
        "CE": 0.82, "RO": 0.79, "AC": 0.85, "AE": 0.81
    }
    sem_stats = {
        "CE": 2.1, "RO": 2.3, "AC": 1.9, "AE": 2.0
    }
    
    import base64
    
    # --- Cursor Pagination Path ---
    if filters.cursor:
        try:
            decoded = base64.urlsafe_b64decode(filters.cursor).decode()
            c_time_str, c_id_str = decoded.split("|")
            c_time = datetime.fromisoformat(c_time_str)
            # Tuple comparison for Keyset Pagination (DESC)
            # (end_time, id) < (c_time, c_id)
            query = query.filter(
                func.row(AssessmentSession.end_time, AssessmentSession.id) < func.row(c_time, c_id_str)
            )
        except Exception:
            # Fallback or error? For robustness, ignore invalid cursor or treat as start
            pass
            
        # Fetch size + 1 to check for next page
        rows = query.order_by(AssessmentSession.end_time.desc(), AssessmentSession.id.desc()).limit(filters.size + 1).all()
        
        has_next = len(rows) > filters.size
        if has_next:
            rows = rows[:filters.size]
            last = rows[-1]
            # Encode next cursor
            next_cursor_str = f"{last.generated_at.isoformat()}|{str(last.session_id)}"
            next_cursor = base64.urlsafe_b64encode(next_cursor_str.encode()).decode()
        else:
            next_cursor = None
            
        # Construct Data Points
        data_points = _map_rows_to_points(rows)
        summary = _build_summary(data_points, total, query) # Re-use summary logic
        
        from app.utils.ids import encode_public_id
        return ResearchStudyDataCursorOut(
            study_public_id=encode_public_id(study.id),
            study_title=study.title,
            filters_applied={
                "cursor": filters.cursor,
                "size": str(filters.size),
                "learning_style": filters.learning_style
            },
            items=data_points,
            next_cursor=next_cursor,
            size=filters.size,
            summary=summary,
            reliability_stats=reliability_stats,
            sem_stats=sem_stats,
        )

    # --- Offset Pagination Path (Legacy/Admin) ---
    skip = (filters.page - 1) * filters.size
    rows = query.order_by(AssessmentSession.end_time.desc()).offset(skip).limit(filters.size).all()

    data_points = _map_rows_to_points(rows)
    summary = _build_summary(data_points, total, query)

    filters_payload: Dict[str, Optional[str]] = {
        "start_date": window_start.isoformat() if window_start else None,
        "end_date": window_end.isoformat() if window_end else None,
        "learning_style": filters.learning_style,
        "norm_group": filters.norm_group,
        "page": str(filters.page),
        "size": str(filters.size),
    }

    import math
    pages = math.ceil(total / filters.size) if filters.size > 0 else 0

    from app.utils.ids import encode_public_id
    return ResearchStudyDataOut(
        study_public_id=encode_public_id(study.id),
        study_title=study.title,
        filters_applied=filters_payload,
        items=data_points,
        summary=summary,
        reliability_stats=reliability_stats,
        sem_stats=sem_stats,
        total=total,
        page=filters.page,
        size=filters.size,
        pages=pages,
    )


def _map_rows_to_points(rows) -> List[StudyDataPoint]:
    data_points: List[StudyDataPoint] = []
    for row in rows:
        duration: Optional[int] = None
        if row.start_time and row.generated_at:
            total_seconds = (row.generated_at - row.start_time).total_seconds()
            if total_seconds >= 0:
                duration = int(total_seconds)
        
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
    return data_points


def _build_summary(data_points: List[StudyDataPoint], total: int, query) -> StudyDataSummary:
    style_counter = Counter(
        point.learning_style for point in data_points if point.learning_style
    )
    date_range = None
    if data_points:
        earliest = min(point.generated_at for point in data_points)
        latest = max(point.generated_at for point in data_points)
        if earliest and latest:
            date_range = StudyDataDateRange(earliest=earliest, latest=latest)

    return StudyDataSummary(
        total_sessions=total,
        unique_participants=query.with_entities(AssessmentSession.user_id).distinct().count(),
        date_range=date_range,
        style_distribution=dict(style_counter),
    )
