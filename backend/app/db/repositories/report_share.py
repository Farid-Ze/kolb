import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.db.repositories.base import Repository
from app.models.klsi.report_share import ReportShareLink


class ReportShareRepository(Repository[Session]):
    """Persistence helpers for report share links."""


    def create(
        self,
        *,
        session_id: uuid.UUID,
        owner_id: int,
        mediator_id: int,
        mediator_email: str,
        token_hash: str,
        expires_at: datetime,
        note: str | None = None,
    ) -> ReportShareLink:
        share = ReportShareLink(
            session_id=session_id,
            owner_id=owner_id,
            mediator_id=mediator_id,
            mediator_email=mediator_email,
            token_hash=token_hash,
            expires_at=expires_at,
            note=note,
        )
        self.db.add(share)
        return share

    def get_active_by_token(self, token_hash: str, *, now: datetime | None = None) -> Optional[ReportShareLink]:
        current = now or datetime.now(timezone.utc)
        return (
            self.db.query(ReportShareLink)
            .filter(ReportShareLink.token_hash == token_hash)
            .filter(ReportShareLink.revoked_at.is_(None))
            .filter(ReportShareLink.expires_at >= current)
            .first()
        )

    def revoke_existing(self, *, session_id: uuid.UUID, mediator_id: int, now: datetime | None = None) -> int:
        current = now or datetime.now(timezone.utc)
        result = (
            self.db.query(ReportShareLink)
            .filter(ReportShareLink.session_id == session_id)
            .filter(ReportShareLink.mediator_id == mediator_id)
            .filter(ReportShareLink.revoked_at.is_(None))
            .update({ReportShareLink.revoked_at: current})
        )
        return int(result or 0)

    def mark_access(self, share: ReportShareLink, *, at: datetime | None = None) -> None:
        share.last_accessed_at = at or datetime.now(timezone.utc)
        share.access_count = (share.access_count or 0) + 1
