from __future__ import annotations

from collections import Counter
from datetime import date
from typing import Dict, Optional

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.klsi import (
    AssessmentSession,
    LearningFlexibilityIndex,
    LearningStyleType,
    SessionStatus,
    TeamAssessmentRollup,
    TeamMember,
    UserLearningStyle,
)


def compute_team_rollup(
    db: Session, team_id: int, for_date: Optional[date] = None
) -> TeamAssessmentRollup:
    """Compute and upsert daily rollup for a team.

    Contract:
    - Input: team_id, optional for_date (default: today on DB side using session end_time/start_time date)
    - Aggregate only completed sessions for users who are team members.
    - total_sessions: count of completed sessions (date-filtered when provided)
    - avg_lfi: mean of LFI scores across included sessions; None if none
    - style_counts: mapping of primary style name -> count
    - Upsert into TeamAssessmentRollup (unique by team_id+date)
    """
    # Build base subquery of member user ids
    member_user_ids_subq = (
        db.query(TeamMember.user_id)
        .filter(TeamMember.team_id == team_id)
        .subquery()
    )

    # Build sessions query joined with LFI and Style
    # Use date from end_time if present else start_time
    session_date_expr = func.date(func.coalesce(AssessmentSession.end_time, AssessmentSession.start_time))
    filters = [
        AssessmentSession.user_id.in_(select(member_user_ids_subq.c.user_id)),
        AssessmentSession.status == SessionStatus.completed,
    ]
    if for_date is not None:
        filters.append(session_date_expr == for_date)

    sessions_q = (
        db.query(
            AssessmentSession.id.label("session_id"),
            session_date_expr.label("sdate"),
            LearningFlexibilityIndex.LFI_score.label("lfi"),
            LearningStyleType.style_name.label("style_name"),
        )
        .join(
            LearningFlexibilityIndex,
            LearningFlexibilityIndex.session_id == AssessmentSession.id,
            isouter=True,
        )
        .join(
            UserLearningStyle,
            UserLearningStyle.session_id == AssessmentSession.id,
            isouter=True,
        )
        .join(
            LearningStyleType,
            LearningStyleType.id == UserLearningStyle.primary_style_type_id,
            isouter=True,
        )
        .filter(and_(*filters))
    )

    rows = sessions_q.all()
    total_sessions = len(rows)
    avg_lfi: Optional[float] = None
    if total_sessions:
        lfis = [r.lfi for r in rows if r.lfi is not None]
        avg_lfi = (sum(lfis) / len(lfis)) if lfis else None
    style_counts: Dict[str, int] = dict(Counter([r.style_name for r in rows if r.style_name]))

    # Determine rollup date
    rdate = for_date
    if rdate is None:
        # If not provided, and we have rows, use the mode of session dates; else today() from DB server
        if rows:
            date_counter = Counter([r.sdate for r in rows if r.sdate is not None])
            if date_counter:
                rdate = date_counter.most_common(1)[0][0]
        if rdate is None:
            # Fallback to "today" according to DB by casting now()
            rdate = db.execute(select(func.current_date())).scalar()

    # Upsert TeamAssessmentRollup
    existing = (
        db.query(TeamAssessmentRollup)
        .filter(
            TeamAssessmentRollup.team_id == team_id,
            TeamAssessmentRollup.date == rdate,
        )
        .first()
    )
    if existing:
        existing.total_sessions = total_sessions
        existing.avg_lfi = avg_lfi
        existing.style_counts = style_counts
        roll = existing
    else:
        roll = TeamAssessmentRollup(
            team_id=team_id,
            date=rdate,
            total_sessions=total_sessions,
            avg_lfi=avg_lfi,
            style_counts=style_counts,
        )
        db.add(roll)

    db.commit()
    db.refresh(roll)
    return roll
