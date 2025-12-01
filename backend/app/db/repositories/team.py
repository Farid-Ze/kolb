import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Union, cast

from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, Session

from app.db.repositories.base import Repository
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.learning import (
    CombinationScore,
    LearningFlexibilityIndex,
    LearningStyleType,
    ScaleScore,
    UserLearningStyle,
)
from app.models.klsi.team import Team, TeamAssessmentRollup, TeamMember
from app.models.klsi.user import User


@dataclass(slots=True)
class TeamSessionRow:
    session_id: uuid.UUID
    session_date: Optional[date]
    lfi: Optional[float]
    style_name: Optional[str]


@dataclass(slots=True)
class TeamRollupMemberPoint:
    user_id: int
    name: Optional[str]
    email: Optional[str]
    session_id: Optional[uuid.UUID]
    completed_at: Optional[datetime]
    ac_ce: Optional[int]
    ae_ro: Optional[int]
    raw_scores: Dict[str, Optional[int]]
    learning_style: Optional[str]
    style_code: Optional[str]


@dataclass(slots=True, repr=True)
class TeamRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for team CRUD operations."""

    async def get(self, team_id: int) -> Optional[Team]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(Team).filter(Team.id == team_id)
        )
        return result.scalars().first()

    def get_sync(self, team_id: int) -> Optional[Team]:
        """Get team by ID - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(Team).filter(Team.id == team_id)
        )
        return result.scalars().first()

    async def get_with_members(self, team_id: int) -> Optional[Team]:
        db = cast(AsyncSession, self.db)
        stmt = (
            select(Team)
            .options(selectinload(Team.members).selectinload(TeamMember.user))
            .filter(Team.id == team_id)
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def find_by_name(self, name: str) -> Optional[Team]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(Team).filter(Team.name == name)
        )
        return result.scalars().first()

    def find_by_name_sync(self, name: str) -> Optional[Team]:
        """Find team by name - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(Team).filter(Team.name == name)
        )
        return result.scalars().first()

    async def create(self, name: str, kelas: Optional[str], description: Optional[str]) -> Team:
        db = cast(AsyncSession, self.db)
        team = Team(name=name, kelas=kelas, description=description)
        db.add(team)
        await db.flush()
        await db.refresh(team)
        return team

    def create_sync(self, name: str, kelas: Optional[str], description: Optional[str]) -> Team:
        """Create a new team - Sync version."""
        db = cast(Session, self.db)
        team = Team(name=name, kelas=kelas, description=description)
        db.add(team)
        db.flush()
        db.refresh(team)
        return team

    async def list(self, skip: int, limit: int, q: Optional[str]) -> List[Team]:
        db = cast(AsyncSession, self.db)
        stmt = select(Team)
        if q:
            like = f"%{q}%"
            stmt = stmt.filter((Team.name.ilike(like)) | (Team.kelas.ilike(like)))
        stmt = stmt.order_by(Team.id.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    def list_sync(self, skip: int, limit: int, q: Optional[str]) -> List[Team]:
        """List teams with pagination and search - Sync version."""
        db = cast(Session, self.db)
        stmt = select(Team)
        if q:
            like = f"%{q}%"
            stmt = stmt.filter((Team.name.ilike(like)) | (Team.kelas.ilike(like)))
        stmt = stmt.order_by(Team.id.desc()).offset(skip).limit(limit)
        result = db.execute(stmt)
        return list(result.scalars().all())

    async def delete(self, team: Team) -> None:
        db = cast(AsyncSession, self.db)
        await db.delete(team)

    def delete_sync(self, team: Team) -> None:
        """Delete a team - Sync version."""
        db = cast(Session, self.db)
        db.delete(team)

    async def count(self, q: Optional[str]) -> int:
        db = cast(AsyncSession, self.db)
        stmt = select(func.count()).select_from(Team)
        if q:
            like = f"%{q}%"
            stmt = stmt.filter((Team.name.ilike(like)) | (Team.kelas.ilike(like)))
        result = await db.execute(stmt)
        return result.scalar() or 0

    def count_sync(self, q: Optional[str]) -> int:
        """Count teams matching query - Sync version."""
        db = cast(Session, self.db)
        stmt = select(func.count()).select_from(Team)
        if q:
            like = f"%{q}%"
            stmt = stmt.filter((Team.name.ilike(like)) | (Team.kelas.ilike(like)))
        result = db.execute(stmt)
        return result.scalar() or 0


@dataclass(slots=True, repr=True)
class TeamMemberRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for team membership operations."""

    async def list_by_team(self, team_id: int) -> List[TeamMember]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(TeamMember).filter(TeamMember.team_id == team_id)
        )
        return list(result.scalars().all())

    def list_by_team_sync(self, team_id: int) -> List[TeamMember]:
        """List members of a team - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(TeamMember).filter(TeamMember.team_id == team_id)
        )
        return list(result.scalars().all())

    async def list_by_user(self, user_id: int) -> List[TeamMember]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(TeamMember).filter(TeamMember.user_id == user_id)
        )
        return list(result.scalars().all())

    def list_by_user_sync(self, user_id: int) -> List[TeamMember]:
        """List team memberships for a user - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(TeamMember).filter(TeamMember.user_id == user_id)
        )
        return list(result.scalars().all())

    async def exists(self, team_id: int, user_id: int) -> bool:
        db = cast(AsyncSession, self.db)
        stmt = select(func.count()).select_from(TeamMember).filter(
            TeamMember.team_id == team_id, TeamMember.user_id == user_id
        )
        result = await db.execute(stmt)
        count = result.scalar()
        return (count or 0) > 0

    def exists_sync(self, team_id: int, user_id: int) -> bool:
        """Check if user is a member of the team - Sync version."""
        db = cast(Session, self.db)
        stmt = select(func.count()).select_from(TeamMember).filter(
            TeamMember.team_id == team_id, TeamMember.user_id == user_id
        )
        result = db.execute(stmt)
        count = result.scalar()
        return (count or 0) > 0

    async def add(self, team_id: int, user_id: int, role_in_team: Optional[str]) -> TeamMember:
        db = cast(AsyncSession, self.db)
        member = TeamMember(team_id=team_id, user_id=user_id, role_in_team=role_in_team)
        db.add(member)
        await db.flush()
        await db.refresh(member)
        return member

    def add_sync(self, team_id: int, user_id: int, role_in_team: Optional[str]) -> TeamMember:
        """Add a member to a team - Sync version."""
        db = cast(Session, self.db)
        member = TeamMember(team_id=team_id, user_id=user_id, role_in_team=role_in_team)
        db.add(member)
        db.flush()
        db.refresh(member)
        return member

    async def get(self, team_id: int, member_id: int) -> Optional[TeamMember]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(TeamMember).filter(TeamMember.id == member_id, TeamMember.team_id == team_id)
        )
        return result.scalars().first()

    def get_sync(self, team_id: int, member_id: int) -> Optional[TeamMember]:
        """Get a team member - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(TeamMember).filter(TeamMember.id == member_id, TeamMember.team_id == team_id)
        )
        return result.scalars().first()

    async def delete(self, member: TeamMember) -> None:
        db = cast(AsyncSession, self.db)
        await db.delete(member)

    def delete_sync(self, member: TeamMember) -> None:
        """Remove a team member - Sync version."""
        db = cast(Session, self.db)
        db.delete(member)

    async def count_by_team(self, team_id: int) -> int:
        db = cast(AsyncSession, self.db)
        stmt = select(func.count()).select_from(TeamMember).filter(TeamMember.team_id == team_id)
        result = await db.execute(stmt)
        return result.scalar() or 0

    def count_by_team_sync(self, team_id: int) -> int:
        """Count members in a team - Sync version."""
        db = cast(Session, self.db)
        stmt = select(func.count()).select_from(TeamMember).filter(TeamMember.team_id == team_id)
        result = db.execute(stmt)
        return result.scalar() or 0


@dataclass(slots=True, repr=True)
class TeamRollupRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for team rollup analytics."""

    async def count_by_team(self, team_id: int) -> int:
        db = cast(AsyncSession, self.db)
        stmt = select(func.count()).select_from(TeamAssessmentRollup).filter(
            TeamAssessmentRollup.team_id == team_id
        )
        result = await db.execute(stmt)
        return result.scalar() or 0

    def count_by_team_sync(self, team_id: int) -> int:
        """Count rollups for a team - Sync version."""
        db = cast(Session, self.db)
        stmt = select(func.count()).select_from(TeamAssessmentRollup).filter(
            TeamAssessmentRollup.team_id == team_id
        )
        result = db.execute(stmt)
        return result.scalar() or 0

    async def list_by_team(self, team_id: int) -> List[TeamAssessmentRollup]:
        db = cast(AsyncSession, self.db)
        stmt = (
            select(TeamAssessmentRollup)
            .filter(TeamAssessmentRollup.team_id == team_id)
            .order_by(TeamAssessmentRollup.date.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    def list_by_team_sync(self, team_id: int) -> List[TeamAssessmentRollup]:
        """List rollups for a team - Sync version."""
        db = cast(Session, self.db)
        stmt = (
            select(TeamAssessmentRollup)
            .filter(TeamAssessmentRollup.team_id == team_id)
            .order_by(TeamAssessmentRollup.date.desc())
        )
        result = db.execute(stmt)
        return list(result.scalars().all())

    async def upsert(
        self,
        team_id: int,
        rdate: date,
        total_sessions: int,
        avg_lfi: Optional[float],
        style_counts: Dict[str, int],
    ) -> TeamAssessmentRollup:
        db = cast(AsyncSession, self.db)
        stmt = select(TeamAssessmentRollup).filter(
            TeamAssessmentRollup.team_id == team_id,
            TeamAssessmentRollup.date == rdate,
        )
        result = await db.execute(stmt)
        existing = result.scalars().first()
        if existing:
            existing.total_sessions = total_sessions
            existing.avg_lfi = avg_lfi
            existing.style_counts = style_counts
            await db.flush()
            return existing
        roll = TeamAssessmentRollup(
            team_id=team_id,
            date=rdate,
            total_sessions=total_sessions,
            avg_lfi=avg_lfi,
            style_counts=style_counts,
        )
        db.add(roll)
        await db.flush()
        await db.refresh(roll)
        return roll

    def upsert_sync(
        self,
        team_id: int,
        rdate: date,
        total_sessions: int,
        avg_lfi: Optional[float],
        style_counts: Dict[str, int],
    ) -> TeamAssessmentRollup:
        """Upsert team rollup - Sync version."""
        db = cast(Session, self.db)
        stmt = select(TeamAssessmentRollup).filter(
            TeamAssessmentRollup.team_id == team_id,
            TeamAssessmentRollup.date == rdate,
        )
        result = db.execute(stmt)
        existing = result.scalars().first()
        if existing:
            existing.total_sessions = total_sessions
            existing.avg_lfi = avg_lfi
            existing.style_counts = style_counts
            db.flush()
            return existing
        roll = TeamAssessmentRollup(
            team_id=team_id,
            date=rdate,
            total_sessions=total_sessions,
            avg_lfi=avg_lfi,
            style_counts=style_counts,
        )
        db.add(roll)
        db.flush()
        db.refresh(roll)
        return roll


@dataclass(slots=True, repr=True)
class TeamAnalyticsRepository(Repository[Union[AsyncSession, Session]]):
    """Repository exposing analytics-oriented queries for teams."""

    async def fetch_completed_sessions(
        self,
        team_id: int,
        for_date: Optional[date] = None,
    ) -> List[TeamSessionRow]:
        db = cast(AsyncSession, self.db)
        # Note: self.db.query is not available on AsyncSession, but we can use select
        # However, the original code used self.db.query(TeamMember.user_id) which is sync style.
        # We should rewrite it to use select() if possible, or just cast and hope for the best if it's a mixin.
        # But AsyncSession definitely doesn't have .query().
        # The original code:
        # member_user_ids_subq = (
        #     self.db.query(TeamMember.user_id)
        #     .filter(TeamMember.team_id == team_id)
        #     .subquery()
        # )
        # This looks like it was copied from sync code and might be broken in async if self.db is AsyncSession.
        # Let's fix it to use select().
        
        member_user_ids_subq = (
            select(TeamMember.user_id)
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
                result = await db.execute(select(func.current_date()))
                db_today = result.scalar()
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

        stmt = (
            select(
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
            .where(and_(*filters))
        )

        result = await db.execute(stmt)
        rows = result.all()
        return [
            TeamSessionRow(
                session_id=row.session_id,
                session_date=row.sdate,
                lfi=row.lfi,
                style_name=row.style_name,
            )
            for row in rows
        ]

    async def fetch_latest_member_points(self, team_id: int) -> List[TeamRollupMemberPoint]:
        db = cast(AsyncSession, self.db)
        member_user_ids_subq = (
            select(TeamMember.user_id)
            .filter(TeamMember.team_id == team_id)
            .subquery()
        )

        stmt = (
            select(
                AssessmentSession.user_id.label("user_id"),
                User.full_name.label("user_name"),
                User.email.label("email"),
                AssessmentSession.id.label("session_id"),
                AssessmentSession.start_time.label("start_time"),
                AssessmentSession.end_time.label("end_time"),
                CombinationScore.ACCE_raw.label("acce"),
                CombinationScore.AERO_raw.label("aero"),
                ScaleScore.CE_raw.label("ce"),
                ScaleScore.RO_raw.label("ro"),
                ScaleScore.AC_raw.label("ac"),
                ScaleScore.AE_raw.label("ae"),
                LearningStyleType.style_name.label("style_name"),
                LearningStyleType.style_code.label("style_code"),
            )
            .join(User, User.id == AssessmentSession.user_id)
            .outerjoin(CombinationScore, CombinationScore.session_id == AssessmentSession.id)
            .outerjoin(ScaleScore, ScaleScore.session_id == AssessmentSession.id)
            .outerjoin(UserLearningStyle, UserLearningStyle.session_id == AssessmentSession.id)
            .outerjoin(LearningStyleType, LearningStyleType.id == UserLearningStyle.primary_style_type_id)
            .where(
                AssessmentSession.user_id.in_(select(member_user_ids_subq.c.user_id)),
                AssessmentSession.status == SessionStatus.completed,
            )
            .order_by(AssessmentSession.end_time.desc().nullslast())
        )

        result = await db.execute(stmt)
        rows = result.all()
        latest_by_user: Dict[int, TeamRollupMemberPoint] = {}
        for row in rows:
            user_id = row.user_id
            if user_id in latest_by_user:
                continue
            completed_at: Optional[datetime] = row.end_time or row.start_time
            latest_by_user[user_id] = TeamRollupMemberPoint(
                user_id=user_id,
                name=row.user_name,
                email=row.email,
                session_id=row.session_id,
                completed_at=completed_at,
                ac_ce=row.acce,
                ae_ro=row.aero,
                raw_scores={
                    "CE": row.ce,
                    "RO": row.ro,
                    "AC": row.ac,
                    "AE": row.ae,
                },
                learning_style=row.style_name,
                style_code=row.style_code,
            )

        return list(latest_by_user.values())

    async def fetch_paginated_member_points(
        self,
        team_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[TeamRollupMemberPoint], int]:
        """Fetch latest assessment data for team members with pagination."""
        db = cast(AsyncSession, self.db)
        
        # 1. Identify team members
        member_subq = (
            select(TeamMember.user_id)
            .filter(TeamMember.team_id == team_id)
            .subquery()
        )
        
        # 2. Count total members (for pagination metadata)
        count_stmt = select(func.count()).select_from(TeamMember).filter(TeamMember.team_id == team_id)
        count_result = await db.execute(count_stmt)
        total_count = count_result.scalar() or 0

        if total_count == 0:
            return [], 0

        # 3. CTE to rank sessions by date for each user
        # We want the latest completed session for each user
        stmt = (
            select(
                AssessmentSession.user_id,
                AssessmentSession.id.label("session_id"),
                AssessmentSession.start_time,
                AssessmentSession.end_time,
                func.row_number().over(
                    partition_by=AssessmentSession.user_id,
                    order_by=AssessmentSession.end_time.desc().nullslast()
                ).label("rn")
            )
            .where(
                AssessmentSession.user_id.in_(select(member_subq)),
                AssessmentSession.status == SessionStatus.completed
            )
            .cte("latest_sessions")
        )

        # 4. Main query joining User -> Latest Session -> Scores
        # We query ALL members, left joining to their latest session
        # This ensures we return members even if they have no data (consistent with "legacy_members" logic)
        # But wait, the original logic separated "data_points" (with data) and "legacy_members" (without or stale).
        # The user request implies a unified list or just "members analytics".
        # Let's return a unified list of members, populated with data if available.
        
        data_stmt = (
            select(
                User.id.label("user_id"),
                User.full_name.label("user_name"),
                User.email.label("email"),
                stmt.c.session_id,
                stmt.c.start_time,
                stmt.c.end_time,
                CombinationScore.ACCE_raw.label("acce"),
                CombinationScore.AERO_raw.label("aero"),
                ScaleScore.CE_raw.label("ce"),
                ScaleScore.RO_raw.label("ro"),
                ScaleScore.AC_raw.label("ac"),
                ScaleScore.AE_raw.label("ae"),
                LearningStyleType.style_name.label("style_name"),
                LearningStyleType.style_code.label("style_code"),
            )
            .select_from(TeamMember)
            .join(User, User.id == TeamMember.user_id)
            .outerjoin(stmt, and_(stmt.c.user_id == User.id, stmt.c.rn == 1))
            .outerjoin(CombinationScore, CombinationScore.session_id == stmt.c.session_id)
            .outerjoin(ScaleScore, ScaleScore.session_id == stmt.c.session_id)
            .outerjoin(UserLearningStyle, UserLearningStyle.session_id == stmt.c.session_id)
            .outerjoin(LearningStyleType, LearningStyleType.id == UserLearningStyle.primary_style_type_id)
            .where(TeamMember.team_id == team_id)
            .order_by(User.full_name)
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(data_stmt)
        rows = result.all()
        results = []
        for row in rows:
            completed_at: Optional[datetime] = row.end_time or row.start_time
            raw_scores: Dict[str, Optional[int]] = {}
            if row.ce is not None:
                raw_scores = {
                    "CE": row.ce,
                    "RO": row.ro,
                    "AC": row.ac,
                    "AE": row.ae,
                }
            
            results.append(TeamRollupMemberPoint(
                user_id=row.user_id,
                name=row.user_name,
                email=row.email,
                session_id=row.session_id,
                completed_at=completed_at,
                ac_ce=row.acce,
                ae_ro=row.aero,
                raw_scores=raw_scores,
                learning_style=row.style_name,
                style_code=row.style_code,
            ))
            
        return results, total_count

    def fetch_paginated_member_points_sync(
        self,
        team_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[TeamRollupMemberPoint], int]:
        """Fetch latest assessment data for team members with pagination - Sync version."""
        db = cast(Session, self.db)
        
        # 1. Identify team members
        member_subq = (
            select(TeamMember.user_id)
            .filter(TeamMember.team_id == team_id)
            .subquery()
        )
        
        # 2. Count total members (for pagination metadata)
        count_stmt = select(func.count()).select_from(TeamMember).filter(TeamMember.team_id == team_id)
        count_result = db.execute(count_stmt)
        total_count = count_result.scalar() or 0

        if total_count == 0:
            return [], 0

        # 3. CTE to rank sessions by date for each user
        # We want the latest completed session for each user
        stmt = (
            select(
                AssessmentSession.user_id,
                AssessmentSession.id.label("session_id"),
                AssessmentSession.start_time,
                AssessmentSession.end_time,
                func.row_number().over(
                    partition_by=AssessmentSession.user_id,
                    order_by=AssessmentSession.end_time.desc().nullslast()
                ).label("rn")
            )
            .where(
                AssessmentSession.user_id.in_(select(member_subq)),
                AssessmentSession.status == SessionStatus.completed
            )
            .cte("latest_sessions")
        )

        # 4. Main query joining User -> Latest Session -> Scores
        data_stmt = (
            select(
                User.id.label("user_id"),
                User.full_name.label("user_name"),
                User.email.label("email"),
                stmt.c.session_id,
                stmt.c.start_time,
                stmt.c.end_time,
                CombinationScore.ACCE_raw.label("acce"),
                CombinationScore.AERO_raw.label("aero"),
                ScaleScore.CE_raw.label("ce"),
                ScaleScore.RO_raw.label("ro"),
                ScaleScore.AC_raw.label("ac"),
                ScaleScore.AE_raw.label("ae"),
                LearningStyleType.style_name.label("style_name"),
                LearningStyleType.style_code.label("style_code"),
            )
            .select_from(TeamMember)
            .join(User, User.id == TeamMember.user_id)
            .outerjoin(stmt, and_(stmt.c.user_id == User.id, stmt.c.rn == 1))
            .outerjoin(CombinationScore, CombinationScore.session_id == stmt.c.session_id)
            .outerjoin(ScaleScore, ScaleScore.session_id == stmt.c.session_id)
            .outerjoin(UserLearningStyle, UserLearningStyle.session_id == stmt.c.session_id)
            .outerjoin(LearningStyleType, LearningStyleType.id == UserLearningStyle.primary_style_type_id)
            .where(TeamMember.team_id == team_id)
            .order_by(User.full_name)
            .offset(skip)
            .limit(limit)
        )

        result = db.execute(data_stmt)
        rows = result.all()
        results = []
        for row in rows:
            completed_at: Optional[datetime] = row.end_time or row.start_time
            raw_scores: Dict[str, Optional[int]] = {}
            if row.ce is not None:
                raw_scores = {
                    "CE": row.ce,
                    "RO": row.ro,
                    "AC": row.ac,
                    "AE": row.ae,
                }
            
            results.append(TeamRollupMemberPoint(
                user_id=row.user_id,
                name=row.user_name,
                email=row.email,
                session_id=row.session_id,
                completed_at=completed_at,
                ac_ce=row.acce,
                ae_ro=row.aero,
                raw_scores=raw_scores,
                learning_style=row.style_name,
                style_code=row.style_code,
            ))
            
        return results, total_count

    def fetch_completed_sessions_sync(
        self,
        team_id: int,
        for_date: Optional[date] = None,
    ) -> List[TeamSessionRow]:
        """Fetch completed sessions for team analytics - Sync version."""
        db = cast(Session, self.db)
        member_user_ids_subq = (
            db.query(TeamMember.user_id)
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
                result = db.execute(select(func.current_date()))
                db_today = result.scalar()
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

        stmt = (
            select(
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
            .where(and_(*filters))
        )

        result = db.execute(stmt)
        rows = result.all()
        return [
            TeamSessionRow(
                session_id=row.session_id,
                session_date=row.sdate,
                lfi=row.lfi,
                style_name=row.style_name,
            )
            for row in rows
        ]

    def fetch_latest_member_points_sync(self, team_id: int) -> List[TeamRollupMemberPoint]:
        """Fetch latest member points for team analytics - Sync version."""
        db = cast(Session, self.db)
        member_user_ids_subq = (
            select(TeamMember.user_id)
            .filter(TeamMember.team_id == team_id)
            .subquery()
        )

        stmt = (
            select(
                AssessmentSession.user_id.label("user_id"),
                User.full_name.label("user_name"),
                User.email.label("email"),
                AssessmentSession.id.label("session_id"),
                AssessmentSession.start_time.label("start_time"),
                AssessmentSession.end_time.label("end_time"),
                CombinationScore.ACCE_raw.label("acce"),
                CombinationScore.AERO_raw.label("aero"),
                ScaleScore.CE_raw.label("ce"),
                ScaleScore.RO_raw.label("ro"),
                ScaleScore.AC_raw.label("ac"),
                ScaleScore.AE_raw.label("ae"),
                LearningStyleType.style_name.label("style_name"),
                LearningStyleType.style_code.label("style_code"),
            )
            .join(User, User.id == AssessmentSession.user_id)
            .outerjoin(CombinationScore, CombinationScore.session_id == AssessmentSession.id)
            .outerjoin(ScaleScore, ScaleScore.session_id == AssessmentSession.id)
            .outerjoin(UserLearningStyle, UserLearningStyle.session_id == AssessmentSession.id)
            .outerjoin(LearningStyleType, LearningStyleType.id == UserLearningStyle.primary_style_type_id)
            .where(
                AssessmentSession.user_id.in_(select(member_user_ids_subq.c.user_id)),
                AssessmentSession.status == SessionStatus.completed,
            )
            .order_by(AssessmentSession.end_time.desc().nullslast())
        )

        result = db.execute(stmt)
        rows = result.all()
        latest_by_user: Dict[int, TeamRollupMemberPoint] = {}
        for row in rows:
            user_id = row.user_id
            if user_id in latest_by_user:
                continue
            completed_at: Optional[datetime] = row.end_time or row.start_time
            latest_by_user[user_id] = TeamRollupMemberPoint(
                user_id=user_id,
                name=row.user_name,
                email=row.email,
                session_id=row.session_id,
                completed_at=completed_at,
                ac_ce=row.acce,
                ae_ro=row.aero,
                raw_scores={
                    "CE": row.ce,
                    "RO": row.ro,
                    "AC": row.ac,
                    "AE": row.ae,
                },
                learning_style=row.style_name,
                style_code=row.style_code,
            )

        return list(latest_by_user.values())
