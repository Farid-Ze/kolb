from __future__ import annotations

from collections import Counter
from datetime import date, timedelta
from typing import Dict, Optional

from sqlalchemy import and_, func, or_, select
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
        # Handle potential timezone differences between Python (local) and DB CURRENT_DATE (often UTC)
        # Compute a 0/±1 day delta and include both dates to avoid off-by-one errors across environments.
        try:
            db_today = db.execute(select(func.current_date())).scalar()
        except Exception:
            db_today = None
        delta_days = 0
        if isinstance(db_today, date) and db_today != date.today():
            delta_days = (date.today() - db_today).days
            # Clamp to at most 1 day adjustment to prevent overly broad selection
            if delta_days > 1:
                delta_days = 1
            if delta_days < -1:
                delta_days = -1

        if delta_days == 0:
            filters.append(session_date_expr == for_date)
        else:
            # Include both local-provided date and the DB-shifted equivalent
            adjusted = for_date - timedelta(days=delta_days)
            filters.append(or_(session_date_expr == for_date, session_date_expr == adjusted))

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
