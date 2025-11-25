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


def build_team_rollup_snapshot(db: Session, team_id: int) -> Dict[str, Any]:
    analytics_repo = TeamAnalyticsRepository(db)
    repo = TeamRepository(db)
    team = repo.get_with_members(team_id) or repo.get(team_id)
    if not team:
        raise ValueError("team_not_found")

    member_points = analytics_repo.fetch_latest_member_points(team_id)
    data_points = []
    legacy_members = []
    acce_values = []
    aero_values = []
    raw_totals: Dict[str, float] = {"CE": 0.0, "RO": 0.0, "AC": 0.0, "AE": 0.0}
    style_counter: Counter[str] = Counter()

    def _safe_avg(values: list[Optional[int]]) -> float:
        filtered = [v for v in values if isinstance(v, (int, float))]
        return round(sum(filtered) / len(filtered), 2) if filtered else 0.0

    member_points_by_user: Dict[int, Any] = {}
    for point in member_points:
        if point.user_id is not None:
            member_points_by_user[point.user_id] = point
        acce_values.append(point.ac_ce)
        aero_values.append(point.ae_ro)
        label = point.learning_style or point.style_code or "UNKNOWN"
        style_counter[label] += 1
        raw_scores = dict(point.raw_scores or {})
        for key in raw_totals:
            value = raw_scores.get(key)
            if isinstance(value, (int, float)):
                raw_totals[key] += float(value)
        data_points.append(
            {
                "user_id": point.user_id,
                "name": point.name,
                "email": point.email,
                "session_id": point.session_id,
                "generated_at": (point.completed_at or datetime.now(timezone.utc)),
                "ac_ce": point.ac_ce,
                "ae_ro": point.ae_ro,
                "learning_style": point.learning_style,
                "style_code": point.style_code,
                "raw_scores": raw_scores,
                "dialectic_scores": {
                    "ACCE": point.ac_ce,
                    "AERO": point.ae_ro,
                },
            }
        )

    now = datetime.now(timezone.utc)
    members = getattr(team, "members", []) or []
    for member in members:
        user = getattr(member, "user", None)
        point = member_points_by_user.get(member.user_id)
        base_entry = {
            "user_id": member.user_id,
            "name": getattr(user, "full_name", None),
            "email": getattr(user, "email", None),
            "role_in_team": getattr(member, "role_in_team", None),
            "joined_at": getattr(member, "joined_at", None),
            "status": None,
            "status_reason": None,
            "session_id": None,
            "generated_at": None,
            "ac_ce": None,
            "ae_ro": None,
            "learning_style": None,
            "style_code": None,
        }

        if point is None:
            entry = base_entry | {
                "status": "missing_data",
                "status_reason": "Belum ada sesi asesmen tuntas untuk anggota ini.",
            }
            legacy_members.append(entry)
            continue

        completed_at = point.completed_at
        is_partial = point.ac_ce is None or point.ae_ro is None
        is_stale = False
        if completed_at and completed_at.tzinfo is None:
            completed_at = completed_at.replace(tzinfo=timezone.utc)
        if completed_at:
            delta = now - completed_at
            is_stale = delta >= timedelta(days=STALE_SESSION_DAYS)

        if is_partial or is_stale:
            status = "partial" if is_partial else "stale"
            reason = (
                "Koordinat dialektik belum lengkap dari sesi terakhir."
                if is_partial
                else "Data asesmen terakhir melewati ambang 180 hari sehingga perlu pemutakhiran."
            )
            entry = base_entry | {
                "status": status,
                "status_reason": reason,
                "session_id": point.session_id,
                "generated_at": completed_at,
                "ac_ce": point.ac_ce,
                "ae_ro": point.ae_ro,
                "learning_style": point.learning_style,
                "style_code": point.style_code,
            }
            legacy_members.append(entry)

    legacy_members.sort(key=lambda item: (item.get("status") or "", item.get("name") or ""))

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
        "total_members": len(team.members),
        "members_with_data": len(member_points),
        "avg_ac_ce": _safe_avg(acce_values),
        "avg_ae_ro": _safe_avg(aero_values),
        "style_distribution": dict(style_counter),
    }

    return {
        "team_id": team.id,
        "team_name": team.name,
        "member_count": len(team.members),
        "data_points": data_points,
        "members": data_points,
        "legacy_members": legacy_members,
        "summary": summary,
        "diversity_score": diversity_score,
        "balance_metrics": balance_metrics,
    }
