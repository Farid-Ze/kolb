from __future__ import annotations

from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, joinedload, selectinload

from app.db.repositories.base import Repository
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.learning import BackupLearningStyle, LFIContextScore, UserLearningStyle
from app.models.klsi.enums import SessionStatus


from dataclasses import dataclass


@dataclass(slots=True, repr=True)
class SessionRepository(Repository[Session]):
    """Repository for assessment session access patterns."""

    def get_by_id(self, session_id: int) -> Optional[AssessmentSession]:
        return self.db.execute(
            select(AssessmentSession).filter(AssessmentSession.id == session_id)
        ).scalars().first()

    def get_for_user(self, session_id: int, user_id: int) -> Optional[AssessmentSession]:
        return self.db.execute(
            select(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .filter(AssessmentSession.user_id == user_id)
        ).scalars().first()

    def is_completed(self, session_id: int) -> bool:
        count = self.db.execute(
            select(func.count())
            .select_from(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .filter(AssessmentSession.status == SessionStatus.completed)
        ).scalar()
        return (count or 0) > 0

    def get_with_details(self, session_id: int) -> Optional[AssessmentSession]:
        """Fetch session with all report-critical relationships eagerly loaded."""
        return self.db.execute(
            select(AssessmentSession)
            .options(
                joinedload(AssessmentSession.scale_score),
                joinedload(AssessmentSession.combination_score),
                joinedload(AssessmentSession.learning_style).joinedload(UserLearningStyle.style_type),
                joinedload(AssessmentSession.percentile_score),
                joinedload(AssessmentSession.lfi_index),
                selectinload(AssessmentSession.backup_styles).joinedload(BackupLearningStyle.style_type),
                selectinload(AssessmentSession.lfi_context_scores),
                joinedload(AssessmentSession.user),
            )
            .filter(AssessmentSession.id == session_id)
        ).scalars().first()

    def get_with_user(self, session_id: int) -> Optional[AssessmentSession]:
        """Fetch session with associated user eager-loaded."""
        return self.db.execute(
            select(AssessmentSession)
            .options(joinedload(AssessmentSession.user))
            .filter(AssessmentSession.id == session_id)
        ).scalars().first()

    def get_with_instrument(self, session_id: int) -> Optional[AssessmentSession]:
        """Fetch a session with instrument relationship eagerly loaded."""
        return self.db.execute(
            select(AssessmentSession)
            .options(joinedload(AssessmentSession.instrument))
            .filter(AssessmentSession.id == session_id)
        ).scalars().first()

    def list_lfi_context_scores(self, session_id: int) -> list[LFIContextScore]:
        """Return all LFI context score rows for a session."""
        return list(self.db.execute(
            select(LFIContextScore)
            .filter(LFIContextScore.session_id == session_id)
        ).scalars().all())

    def get_previous_completed_session(
        self,
        *,
        user_id: int,
        assessment_id: str,
        assessment_version: str,
        exclude_session_id: int,
    ) -> Optional[AssessmentSession]:
        """Fetch the most recent completed session for the same assessment, excluding the given session."""
        return self.db.execute(
            select(AssessmentSession)
            .options(
                joinedload(AssessmentSession.combination_score),
                joinedload(AssessmentSession.learning_style),
                joinedload(AssessmentSession.lfi_index),
            )
            .filter(AssessmentSession.user_id == user_id)
            .filter(AssessmentSession.assessment_id == assessment_id)
            .filter(AssessmentSession.assessment_version == assessment_version)
            .filter(AssessmentSession.status == SessionStatus.completed)
            .filter(AssessmentSession.id != exclude_session_id)
            .order_by(AssessmentSession.end_time.desc())
        ).scalars().first()

    def get_latest_completed_for_user(self, user_id: int) -> Optional[AssessmentSession]:
        """Fetch the most recent completed session for a user with all details."""
        return self.db.execute(
            select(AssessmentSession)
            .options(
                joinedload(AssessmentSession.scale_score),
                joinedload(AssessmentSession.combination_score),
                joinedload(AssessmentSession.learning_style).joinedload(UserLearningStyle.style_type),
                joinedload(AssessmentSession.percentile_score),
                joinedload(AssessmentSession.lfi_index),
            )
            .filter(AssessmentSession.user_id == user_id)
            .filter(AssessmentSession.status == SessionStatus.completed)
            .order_by(AssessmentSession.end_time.desc())
        ).scalars().first()

    def list_completed_for_user(self, user_id: int) -> list[AssessmentSession]:
        """Return all completed sessions for a user with summary-critical relations eagerly loaded."""
        return (
            self.db.query(AssessmentSession)
            .options(
                joinedload(AssessmentSession.learning_style).joinedload(UserLearningStyle.style_type),
                joinedload(AssessmentSession.lfi_index),
                joinedload(AssessmentSession.delta),
                joinedload(AssessmentSession.combination_score),
            )
            .filter(AssessmentSession.user_id == user_id)
            .filter(AssessmentSession.status == SessionStatus.completed)
            .order_by(AssessmentSession.end_time.desc(), AssessmentSession.id.desc())
            .all()
        )

    def get_by_user(
        self,
        user_id: int,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AssessmentSession]:
        """List sessions for a user with optional status filter."""
        query = self.db.query(AssessmentSession).filter(AssessmentSession.user_id == user_id)
        if status:
            query = query.filter(AssessmentSession.status == status)
        return query.offset(skip).limit(limit).all()


@dataclass(slots=True, repr=True)
class AsyncSessionRepository:
    """Async Repository for assessment session access patterns."""
    db: AsyncSession

    async def get_by_id(self, session_id: int) -> Optional[AssessmentSession]:
        result = await self.db.execute(
            select(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
        )
        return result.scalars().first()

    async def get_for_user(self, session_id: int, user_id: int) -> Optional[AssessmentSession]:
        result = await self.db.execute(
            select(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .filter(AssessmentSession.user_id == user_id)
        )
        return result.scalars().first()

    async def is_completed(self, session_id: int) -> bool:
        result = await self.db.execute(
            select(func.count())
            .select_from(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .filter(AssessmentSession.status == SessionStatus.completed)
        )
        count = result.scalar()
        return (count or 0) > 0

    async def get_with_details(self, session_id: int) -> Optional[AssessmentSession]:
        """Fetch session with all report-critical relationships eagerly loaded."""
        result = await self.db.execute(
            select(AssessmentSession)
            .options(
                joinedload(AssessmentSession.scale_score),
                joinedload(AssessmentSession.combination_score),
                joinedload(AssessmentSession.learning_style).joinedload(UserLearningStyle.style_type),
                joinedload(AssessmentSession.percentile_score),
                joinedload(AssessmentSession.lfi_index),
                selectinload(AssessmentSession.backup_styles).joinedload(BackupLearningStyle.style_type),
                selectinload(AssessmentSession.lfi_context_scores),
                joinedload(AssessmentSession.user),
            )
            .filter(AssessmentSession.id == session_id)
        )
        return result.scalars().first()

    async def get_with_user(self, session_id: int) -> Optional[AssessmentSession]:
        """Fetch session with associated user eager-loaded."""
        result = await self.db.execute(
            select(AssessmentSession)
            .options(joinedload(AssessmentSession.user))
            .filter(AssessmentSession.id == session_id)
        )
        return result.scalars().first()

    async def get_with_instrument(self, session_id: int) -> Optional[AssessmentSession]:
        """Fetch a session with instrument relationship eagerly loaded."""
        result = await self.db.execute(
            select(AssessmentSession)
            .options(joinedload(AssessmentSession.instrument))
            .filter(AssessmentSession.id == session_id)
        )
        return result.scalars().first()

    async def list_lfi_context_scores(self, session_id: int) -> list[LFIContextScore]:
        """Return all LFI context score rows for a session."""
        result = await self.db.execute(
            select(LFIContextScore)
            .filter(LFIContextScore.session_id == session_id)
        )
        return list(result.scalars().all())

    async def get_previous_completed_session(
        self,
        *,
        user_id: int,
        assessment_id: str,
        assessment_version: str,
        exclude_session_id: int,
    ) -> Optional[AssessmentSession]:
        """Fetch the most recent completed session for the same assessment, excluding the given session."""
        result = await self.db.execute(
            select(AssessmentSession)
            .options(
                joinedload(AssessmentSession.combination_score),
                joinedload(AssessmentSession.learning_style),
                joinedload(AssessmentSession.lfi_index),
            )
            .filter(
                AssessmentSession.user_id == user_id,
                AssessmentSession.assessment_id == assessment_id,
                AssessmentSession.assessment_version == assessment_version,
                AssessmentSession.status == SessionStatus.completed,
                AssessmentSession.id != exclude_session_id,
            )
            .order_by(AssessmentSession.end_time.desc())
        )
        return result.scalars().first()

    async def get_latest_completed_for_user(self, user_id: int) -> Optional[AssessmentSession]:
        """Fetch the most recent completed session for a user with all details."""
        result = await self.db.execute(
            select(AssessmentSession)
            .options(
                joinedload(AssessmentSession.scale_score),
                joinedload(AssessmentSession.combination_score),
                joinedload(AssessmentSession.learning_style).joinedload(UserLearningStyle.style_type),
                joinedload(AssessmentSession.percentile_score),
                joinedload(AssessmentSession.lfi_index),
            )
            .filter(AssessmentSession.user_id == user_id)
            .filter(AssessmentSession.status == SessionStatus.completed)
            .order_by(AssessmentSession.end_time.desc())
        )
        return result.scalars().first()

    async def list_completed_for_user(self, user_id: int) -> list[AssessmentSession]:
        """Return all completed sessions for a user with summary-critical relations eagerly loaded."""
        result = await self.db.execute(
            select(AssessmentSession)
            .options(
                joinedload(AssessmentSession.learning_style).joinedload(UserLearningStyle.style_type),
                joinedload(AssessmentSession.lfi_index),
                joinedload(AssessmentSession.delta),
                joinedload(AssessmentSession.combination_score),
            )
            .filter(AssessmentSession.user_id == user_id)
            .filter(AssessmentSession.status == SessionStatus.completed)
            .order_by(AssessmentSession.end_time.desc(), AssessmentSession.id.desc())
        )
        return list(result.scalars().all())

    async def get_by_user(
        self,
        user_id: int,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AssessmentSession]:
        """List sessions for a user with optional status filter."""
        query = select(AssessmentSession).filter(AssessmentSession.user_id == user_id)
        if status:
            query = query.filter(AssessmentSession.status == status)
        result = await self.db.execute(query.offset(skip).limit(limit))
        return list(result.scalars().all())
