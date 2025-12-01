import uuid
from typing import Optional, Union, cast

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload, Session

from app.db.repositories.base import Repository
from app.models.klsi.assessment import AssessmentSession, AssessmentSessionDelta
from app.models.klsi.learning import (
    BackupLearningStyle,
    CombinationScore,
    LearningFlexibilityIndex,
    LFIContextScore,
    ScaleScore,
    UserLearningStyle,
)
from app.models.klsi.norms import PercentileScore
from app.models.klsi.enums import SessionStatus


from dataclasses import dataclass


@dataclass(slots=True, repr=True)
class SessionRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for assessment session access patterns."""

    async def get_by_id(self, session_id: uuid.UUID) -> Optional[AssessmentSession]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(AssessmentSession).filter(AssessmentSession.id == session_id)
        )
        return result.scalars().first()

    def get_by_id_sync(self, session_id: uuid.UUID) -> Optional[AssessmentSession]:
        """Fetch session by ID - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(AssessmentSession).filter(AssessmentSession.id == session_id)
        )
        return result.scalars().first()

    async def get_for_user(self, session_id: uuid.UUID, user_id: int) -> Optional[AssessmentSession]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .filter(AssessmentSession.user_id == user_id)
        )
        return result.scalars().first()

    async def is_completed(self, session_id: uuid.UUID) -> bool:
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(func.count())
            .select_from(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .filter(AssessmentSession.status == SessionStatus.completed)
        )
        count = result.scalar()
        return (count or 0) > 0

    async def get_with_details(self, session_id: uuid.UUID) -> Optional[AssessmentSession]:
        """Fetch session with all report-critical relationships eagerly loaded."""
        db = cast(AsyncSession, self.db)
        result = await db.execute(
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

    async def get_with_user(self, session_id: uuid.UUID) -> Optional[AssessmentSession]:
        """Fetch session with associated user eager-loaded."""
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(AssessmentSession)
            .options(joinedload(AssessmentSession.user))
            .filter(AssessmentSession.id == session_id)
        )
        return result.scalars().first()

    def get_with_user_sync(self, session_id: uuid.UUID) -> Optional[AssessmentSession]:
        """Fetch session with associated user eager-loaded - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(AssessmentSession)
            .options(joinedload(AssessmentSession.user))
            .filter(AssessmentSession.id == session_id)
        )
        return result.scalars().first()

    async def get_with_instrument(self, session_id: uuid.UUID) -> Optional[AssessmentSession]:
        """Fetch a session with instrument relationship eagerly loaded."""
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(AssessmentSession)
            .options(joinedload(AssessmentSession.instrument))
            .filter(AssessmentSession.id == session_id)
        )
        return result.scalars().first()

    async def list_lfi_context_scores(self, session_id: uuid.UUID) -> list[LFIContextScore]:
        """Return all LFI context score rows for a session."""
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(LFIContextScore)
            .filter(LFIContextScore.session_id == session_id)
        )
        return list(result.scalars().all())

    def list_lfi_context_scores_sync(self, session_id: uuid.UUID) -> list[LFIContextScore]:
        """Return all LFI context score rows for a session - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
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
        exclude_session_id: uuid.UUID,
    ) -> Optional[AssessmentSession]:
        """Fetch the most recent completed session for the same assessment, excluding the given session."""
        db = cast(AsyncSession, self.db)
        result = await db.execute(
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
        )
        return result.scalars().first()

    def get_previous_completed_session_sync(
        self,
        *,
        user_id: int,
        assessment_id: str,
        assessment_version: str,
        exclude_session_id: uuid.UUID,
    ) -> Optional[AssessmentSession]:
        """Fetch the most recent completed session for the same assessment, excluding the given session - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
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
        )
        return result.scalars().first()

    async def get_latest_completed_for_user(self, user_id: int) -> Optional[AssessmentSession]:
        """Fetch the most recent completed session for a user with all details."""
        db = cast(AsyncSession, self.db)
        result = await db.execute(
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

    def get_latest_completed_for_user_sync(self, user_id: int) -> Optional[AssessmentSession]:
        """Fetch the most recent completed session for a user with all details - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
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
        db = cast(AsyncSession, self.db)
        result = await db.execute(
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

    def list_completed_for_user_sync(self, user_id: int) -> list[AssessmentSession]:
        """Return all completed sessions for a user with summary-critical relations eagerly loaded - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
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
        db = cast(AsyncSession, self.db)
        stmt = select(AssessmentSession).filter(AssessmentSession.user_id == user_id)
        if status:
            stmt = stmt.filter(AssessmentSession.status == status)
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_with_lock(self, session_id: uuid.UUID) -> Optional[AssessmentSession]:
        """Fetch session with pessimistic write lock (FOR UPDATE)."""
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .with_for_update()
        )
        return result.scalars().first()

    def get_with_lock_sync(self, session_id: uuid.UUID) -> Optional[AssessmentSession]:
        """Fetch session with pessimistic write lock (FOR UPDATE) - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .with_for_update()
        )
        return result.scalars().first()

    def get_with_instrument_sync(self, session_id: uuid.UUID) -> Optional[AssessmentSession]:
        """Fetch a session with instrument relationship eagerly loaded - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(AssessmentSession)
            .options(joinedload(AssessmentSession.instrument))
            .filter(AssessmentSession.id == session_id)
        )
        return result.scalars().first()

    def get_with_details_sync(self, session_id: uuid.UUID) -> Optional[AssessmentSession]:
        """Fetch session with all report-critical relationships eagerly loaded - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
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

    def reset_artifacts_sync(self, session_id: uuid.UUID) -> None:
        """Delete all derived scores and artifacts for a session - Sync version."""
        db = cast(Session, self.db)
        db.query(CombinationScore).filter(
            CombinationScore.session_id == session_id
        ).delete(synchronize_session=False)
        db.query(UserLearningStyle).filter(
            UserLearningStyle.session_id == session_id
        ).delete(synchronize_session=False)
        db.query(BackupLearningStyle).filter(
            BackupLearningStyle.session_id == session_id
        ).delete(synchronize_session=False)
        db.query(PercentileScore).filter(
            PercentileScore.session_id == session_id
        ).delete(synchronize_session=False)
        db.query(LearningFlexibilityIndex).filter(
            LearningFlexibilityIndex.session_id == session_id
        ).delete(synchronize_session=False)
        db.query(AssessmentSessionDelta).filter(
            AssessmentSessionDelta.session_id == session_id
        ).delete(synchronize_session=False)
        db.flush()

    def upsert_scale_score_sync(
        self,
        session_id: uuid.UUID,
        CE: int,
        RO: int,
        AC: int,
        AE: int,
    ) -> ScaleScore:
        """Upsert scale scores for a session - Sync version."""
        db = cast(Session, self.db)
        scale = (
            db.query(ScaleScore)
            .filter(ScaleScore.session_id == session_id)
            .one_or_none()
        )
        if scale is None:
            scale = ScaleScore(
                session_id=session_id,
                CE_raw=CE,
                RO_raw=RO,
                AC_raw=AC,
                AE_raw=AE,
            )
            db.add(scale)
        else:
            scale.CE_raw = CE
            scale.RO_raw = RO
            scale.AC_raw = AC
            scale.AE_raw = AE
        db.flush()
        return scale

