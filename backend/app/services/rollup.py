import uuid
from collections import Counter
from datetime import date, datetime, timedelta, timezone
import math
from typing import Any, Dict, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.repositories import TeamAnalyticsRepository, TeamRepository, TeamRollupRepository
from app.models.klsi.team import TeamAssessmentRollup


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


STALE_SESSION_DAYS = 365  # mark sessions older than ~12 months as stale


def get_team_rollup_snapshot(db: Session, team_id: int) -> Dict[str, Any]:
    """Get team rollup snapshot, using cache if available."""
    repo = TeamRepository(db)
    team = repo.get(team_id)
    if not team:
        raise ValueError("team_not_found")
    
    if team.summary_cache:
        return team.summary_cache
        
    return compute_and_cache_team_snapshot(db, team_id)


def compute_and_cache_team_snapshot(db: Session, team_id: int) -> Dict[str, Any]:
    analytics_repo = TeamAnalyticsRepository(db)
    team_repo = TeamRepository(db)
    team = team_repo.get(team_id)
    if not team:
        raise ValueError("team_not_found")

    member_points = analytics_repo.fetch_latest_member_points(team_id)

    acce_values = []
    aero_values = []
    raw_totals: Dict[str, float] = {"CE": 0.0, "RO": 0.0, "AC": 0.0, "AE": 0.0}
    style_counter: Counter[str] = Counter()

    def _safe_avg(values: list[Optional[int]]) -> float:
        filtered = [v for v in values if isinstance(v, (int, float))]
        return round(sum(filtered) / len(filtered), 2) if filtered else 0.0

    # Optimized: Only calculate aggregates, do not build data_points list
    for point in member_points:
        acce_values.append(point.ac_ce)
        aero_values.append(point.ae_ro)
        label = point.learning_style or point.style_code or "UNKNOWN"
        style_counter[label] += 1
        raw_scores = dict(point.raw_scores or {})
        for key in raw_totals:
            value = raw_scores.get(key)
            if isinstance(value, (int, float)):
                raw_totals[key] += float(value)

    def _percent(value: float, total: float) -> float:
        return round((value / total) * 100, 2) if total else 0.0

    raw_total_sum = sum(raw_totals.values())
    balance_metrics = {
        "CE_percentage": _percent(raw_totals["CE"], raw_total_sum),
        "RO_percentage": _percent(raw_totals["RO"], raw_total_sum),
        "AC_percentage": _percent(raw_totals["AC"], raw_total_sum),
        "AE_percentage": _percent(raw_totals["AE"], raw_total_sum),
    }

    diversity_score = None
    total_styles = sum(style_counter.values())
    if total_styles:
        entropy = 0.0
        for count in style_counter.values():
            proportion = count / total_styles
            if proportion > 0:
                entropy -= proportion * math.log(proportion, 2)
        max_entropy = math.log(len(style_counter), 2) if len(style_counter) > 1 else 0
        diversity_score = round((entropy / max_entropy) * 100, 2) if max_entropy else round(entropy * 100, 2)

    summary = {
        "total_members": len(getattr(team, "members", []) or []),
        "members_with_data": len(member_points),
        "avg_ac_ce": _safe_avg(acce_values),
        "avg_ae_ro": _safe_avg(aero_values),
        "style_distribution": dict(style_counter),
    }

    snapshot = {
        "team_id": team.id,
        "team_name": team.name,
        "member_count": len(getattr(team, "members", []) or []),
        # data_points and legacy_members removed for scalability (Audit Round 2)
        "summary": summary,
        "diversity_score": diversity_score,
        "balance_metrics": balance_metrics,
    }
    
    team.summary_cache = snapshot
    db.add(team)
    db.flush()
    
    return snapshot


build_team_rollup_snapshot = compute_and_cache_team_snapshot
