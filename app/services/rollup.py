from __future__ import annotations

from collections import Counter
from datetime import date
from typing import Dict, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.repositories import TeamAnalyticsRepository, TeamRollupRepository
from app.models.klsi import TeamAssessmentRollup


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
    analytics_repo = TeamAnalyticsRepository(db)
    rows = analytics_repo.fetch_completed_sessions(team_id, for_date)
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
            date_counter = Counter([r.session_date for r in rows if r.session_date is not None])
            if date_counter:
                rdate = date_counter.most_common(1)[0][0]
        if rdate is None:
            # Fallback to "today" according to DB by casting now()
            rdate = db.execute(select(func.current_date())).scalar()

    # Upsert TeamAssessmentRollup
    repo = TeamRollupRepository(db)
    if rdate is None:
        # As a last resort, fall back to today's date to ensure rollup key isn't null
        rdate = date.today()
    roll = repo.upsert(team_id, rdate, total_sessions, avg_lfi, style_counts)
    return roll
