from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.db.repositories.base import Repository
from app.models.klsi import AssessmentSession


from dataclasses import dataclass


@dataclass
class SessionRepository(Repository[Session]):
    """Repository for assessment session access patterns."""

    def get_by_id(self, session_id: int) -> Optional[AssessmentSession]:
        return (
            self.db.query(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .first()
        )
