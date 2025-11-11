from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.repositories.base import Repository
from app.models.klsi import BackupLearningStyle, LearningStyleType


@dataclass
class StyleRepository(Repository[Session]):
    """Repository helpers for learning style metadata and contextual backups."""

    def list_learning_style_types(self) -> List[LearningStyleType]:
        """Return all learning style type rows."""
        return self.db.query(LearningStyleType).all()

    def get_by_name(self, style_name: str) -> Optional[LearningStyleType]:
        """Fetch a learning style type by its canonical name."""
        return (
            self.db.query(LearningStyleType)
            .filter(LearningStyleType.style_name == style_name)
            .first()
        )

    def upsert_backup_style(
        self,
        session_id: int,
        style_type_id: int,
        *,
        frequency_count: int,
        contexts: Optional[List[str]] = None,
    ) -> BackupLearningStyle:
        """Create or update a backup learning style row for a session."""
        existing = (
            self.db.query(BackupLearningStyle)
            .filter(
                BackupLearningStyle.session_id == session_id,
                BackupLearningStyle.style_type_id == style_type_id,
            )
            .first()
        )
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
        return entry
