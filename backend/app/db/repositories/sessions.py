from __future__ import annotations

from typing import Optional

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
        return (
            self.db.query(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .first()
        )

    def get_for_user(self, session_id: int, user_id: int) -> Optional[AssessmentSession]:
        return (
            self.db.query(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .filter(AssessmentSession.user_id == user_id)
            .first()
        )

    def is_completed(self, session_id: int) -> bool:
        return (
            self.db.query(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .filter(AssessmentSession.status == SessionStatus.completed)
            .count()
            > 0
        )

    def get_with_details(self, session_id: int) -> Optional[AssessmentSession]:
        """Fetch session with all report-critical relationships eagerly loaded."""
        return (
            self.db.query(AssessmentSession)
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
            .first()
        )

    def get_with_user(self, session_id: int) -> Optional[AssessmentSession]:
        """Fetch session with associated user eager-loaded."""
        return (
            self.db.query(AssessmentSession)
            .options(joinedload(AssessmentSession.user))
            .filter(AssessmentSession.id == session_id)
            .first()
        )

    def get_with_instrument(self, session_id: int) -> Optional[AssessmentSession]:
        """Fetch a session with instrument relationship eagerly loaded."""
        return (
            self.db.query(AssessmentSession)
            .options(joinedload(AssessmentSession.instrument))
            .filter(AssessmentSession.id == session_id)
            .first()
        )

    def list_lfi_context_scores(self, session_id: int) -> list[LFIContextScore]:
        """Return all LFI context score rows for a session."""
        return (
            self.db.query(LFIContextScore)
            .filter(LFIContextScore.session_id == session_id)
            .all()
        )

    def get_previous_completed_session(
        self,
        *,
        user_id: int,
        assessment_id: str,
        assessment_version: str,
        exclude_session_id: int,
    ) -> Optional[AssessmentSession]:
        """Fetch the most recent completed session for the same assessment, excluding the given session."""
        return (
            self.db.query(AssessmentSession)
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
            .first()
        )
