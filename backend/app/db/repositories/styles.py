from dataclasses import dataclass
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.repositories.base import Repository
from app.models.klsi.learning import BackupLearningStyle, LearningStyleType


@dataclass(slots=True, repr=True)
class StyleRepository(Repository[AsyncSession]):
    """Repository helpers for learning style metadata and contextual backups."""

    async def list_learning_style_types(self) -> List[LearningStyleType]:
        """Return all learning style type rows."""
        result = await self.db.execute(select(LearningStyleType))
        return list(result.scalars().all())

    async def get_by_name(self, style_name: str) -> Optional[LearningStyleType]:
        """Fetch a learning style type by its canonical name."""
        result = await self.db.execute(
            select(LearningStyleType)
            .filter(LearningStyleType.style_name == style_name)
        )
        return result.scalars().first()

    async def upsert_backup_style(
        self,
        session_id: UUID,
        style_type_id: int,
        *,
        frequency_count: int,
        contexts: Optional[List[str]] = None,
    ) -> BackupLearningStyle:
        """Create or update a backup learning style row for a session."""
        result = await self.db.execute(
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
        self.db.add(entry)
        await self.db.flush()
        await self.db.refresh(entry)
        return entry
