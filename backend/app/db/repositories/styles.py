from dataclasses import dataclass
from typing import List, Optional, Union, cast
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.repositories.base import Repository
from app.models.klsi.learning import BackupLearningStyle, LearningStyleType


@dataclass(slots=True, repr=True)
class StyleRepository(Repository[Union[AsyncSession, Session]]):
    """Repository helpers for learning style metadata and contextual backups."""

    async def list_learning_style_types(self) -> List[LearningStyleType]:
        """Return all learning style type rows."""
        db = cast(AsyncSession, self.db)
        result = await db.execute(select(LearningStyleType))
        return list(result.scalars().all())

    async def get_by_name(self, style_name: str) -> Optional[LearningStyleType]:
        """Fetch a learning style type by its canonical name."""
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(LearningStyleType)
            .filter(LearningStyleType.style_name == style_name)
        )
        return result.scalars().first()

    def get_by_name_sync(self, style_name: str) -> Optional[LearningStyleType]:
        """Fetch a learning style type by its canonical name - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(LearningStyleType)
            .filter(LearningStyleType.style_name == style_name)
        )
        return result.scalars().first()

    def list_learning_style_types_sync(self) -> List[LearningStyleType]:
        """Return all learning style type rows - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(select(LearningStyleType))
        return list(result.scalars().all())

    async def upsert_backup_style(
        self,
        session_id: UUID,
        style_type_id: int,
        *,
        frequency_count: int,
        contexts: Optional[List[str]] = None,
    ) -> BackupLearningStyle:
        """Create or update a backup learning style row for a session."""
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(BackupLearningStyle)
            .filter(
                BackupLearningStyle.session_id == session_id,
                BackupLearningStyle.style_type_id == style_type_id,
            )
        )
        existing = result.scalars().first()
        payload = {"contexts": contexts} if contexts is not None else None
        if existing:
            existing.frequency_count = frequency_count
            existing.contexts_used = payload
            existing.percentage = None
            return existing

        entry = BackupLearningStyle(
            session_id=session_id,
            style_type_id=style_type_id,
            frequency_count=frequency_count,
            contexts_used=payload,
            percentage=None,
        )
        db.add(entry)
        await db.flush()
        await db.refresh(entry)
        return entry

    def upsert_backup_style_sync(
        self,
        session_id: UUID,
        style_type_id: int,
        *,
        frequency_count: int,
        contexts: Optional[List[str]] = None,
    ) -> BackupLearningStyle:
        """Create or update a backup learning style row for a session - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(BackupLearningStyle)
            .filter(
                BackupLearningStyle.session_id == session_id,
                BackupLearningStyle.style_type_id == style_type_id,
            )
        )
        existing = result.scalars().first()
        payload = {"contexts": contexts} if contexts is not None else None
        if existing:
            existing.frequency_count = frequency_count
            existing.contexts_used = payload
            existing.percentage = None
            return existing

        entry = BackupLearningStyle(
            session_id=session_id,
            style_type_id=style_type_id,
            frequency_count=frequency_count,
            contexts_used=payload,
            percentage=None,
        )
        db.add(entry)
        db.flush()
        db.refresh(entry)
        return entry
