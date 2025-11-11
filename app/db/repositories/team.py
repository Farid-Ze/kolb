from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Dict, List, Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.db.repositories.base import Repository
from app.models.klsi import (
    AssessmentSession,
    LearningFlexibilityIndex,
    LearningStyleType,
    SessionStatus,
    Team,
    TeamAssessmentRollup,
    TeamMember,
    UserLearningStyle,
)


@dataclass
class TeamSessionRow:
    session_id: int
    session_date: Optional[date]
    lfi: Optional[float]
    style_name: Optional[str]


@dataclass
class TeamRepository(Repository[Session]):
    """Repository for team CRUD operations."""

    def get(self, team_id: int) -> Optional[Team]:
        return (
            self.db.query(Team)
            .filter(Team.id == team_id)
            .first()
        )

    def find_by_name(self, name: str) -> Optional[Team]:
        return (
            self.db.query(Team)
            .filter(Team.name == name)
            .first()
        )

    def create(self, name: str, kelas: Optional[str], description: Optional[str]) -> Team:
        team = Team(name=name, kelas=kelas, description=description)
        self.db.add(team)
        self.db.flush()
        self.db.refresh(team)
        return team

    def list(self, skip: int, limit: int, q: Optional[str]) -> List[Team]:
        query = self.db.query(Team)
        if q:
            like = f"%{q}%"
            query = query.filter((Team.name.ilike(like)) | (Team.kelas.ilike(like)))
        return (
            query.order_by(Team.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def delete(self, team: Team) -> None:
        self.db.delete(team)


@dataclass
class TeamMemberRepository(Repository[Session]):
    """Repository for team membership operations."""

    def list_by_team(self, team_id: int) -> List[TeamMember]:
        return (
            self.db.query(TeamMember)
            .filter(TeamMember.team_id == team_id)
            .all()
        )

    def exists(self, team_id: int, user_id: int) -> bool:
        return (
            self.db.query(TeamMember)
            .filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
            .count()
            > 0
        )

    def add(self, team_id: int, user_id: int, role_in_team: Optional[str]) -> TeamMember:
        member = TeamMember(team_id=team_id, user_id=user_id, role_in_team=role_in_team)
        self.db.add(member)
        self.db.flush()
        self.db.refresh(member)
        return member

    def get(self, team_id: int, member_id: int) -> Optional[TeamMember]:
        return (
            self.db.query(TeamMember)
            .filter(TeamMember.id == member_id, TeamMember.team_id == team_id)
            .first()
        )

    def delete(self, member: TeamMember) -> None:
        self.db.delete(member)

    def count_by_team(self, team_id: int) -> int:
        return (
            self.db.query(TeamMember)
            .filter(TeamMember.team_id == team_id)
            .count()
        )


@dataclass
class TeamRollupRepository(Repository[Session]):
    """Repository for team rollup analytics."""

    def count_by_team(self, team_id: int) -> int:
        return (
            self.db.query(TeamAssessmentRollup)
            .filter(TeamAssessmentRollup.team_id == team_id)
            .count()
        )

    def list_by_team(self, team_id: int) -> List[TeamAssessmentRollup]:
        return (
            self.db.query(TeamAssessmentRollup)
            .filter(TeamAssessmentRollup.team_id == team_id)
            .order_by(TeamAssessmentRollup.date.desc())
            .all()
        )

    def upsert(
        self,
        team_id: int,
        rdate: date,
        total_sessions: int,
        avg_lfi: Optional[float],
        style_counts: Dict[str, int],
    ) -> TeamAssessmentRollup:
        existing = (
            self.db.query(TeamAssessmentRollup)
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
            self.db.flush()
            return existing
        roll = TeamAssessmentRollup(
            team_id=team_id,
            date=rdate,
            total_sessions=total_sessions,
            avg_lfi=avg_lfi,
            style_counts=style_counts,
        )
        self.db.add(roll)
        self.db.flush()
        self.db.refresh(roll)
        return roll


@dataclass
class TeamAnalyticsRepository(Repository[Session]):
    """Repository exposing analytics-oriented queries for teams."""

    def fetch_completed_sessions(
        self,
        team_id: int,
        for_date: Optional[date] = None,
    ) -> List[TeamSessionRow]:
        member_user_ids_subq = (
            self.db.query(TeamMember.user_id)
            .filter(TeamMember.team_id == team_id)
            .subquery()
        )

        session_date_expr = func.date(
            func.coalesce(AssessmentSession.end_time, AssessmentSession.start_time)
        )
        filters = [
            AssessmentSession.user_id.in_(select(member_user_ids_subq.c.user_id)),
            AssessmentSession.status == SessionStatus.completed,
        ]

        if for_date is not None:
            db_today = None
            try:
                db_today = self.db.execute(select(func.current_date())).scalar()
            except Exception:
                db_today = None

            delta_days = 0
            if isinstance(db_today, date) and db_today != date.today():
                delta_days = (date.today() - db_today).days
                if delta_days > 1:
                    delta_days = 1
                if delta_days < -1:
                    delta_days = -1

            if delta_days == 0:
                filters.append(session_date_expr == for_date)
            else:
                adjusted = for_date - timedelta(days=delta_days)
                filters.append(
                    or_(session_date_expr == for_date, session_date_expr == adjusted)
                )

        query = (
            self.db.query(
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

        rows = query.all()
        return [
            TeamSessionRow(
                session_id=row.session_id,
                session_date=row.sdate,
                lfi=row.lfi,
                style_name=row.style_name,
            )
            for row in rows
        ]
