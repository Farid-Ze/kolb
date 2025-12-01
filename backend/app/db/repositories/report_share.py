import uuid
from datetime import datetime, timezone
from typing import Optional, Union, cast

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.db.repositories.base import Repository
from app.models.klsi.report_share import ReportShareLink


class ReportShareRepository(Repository[Union[AsyncSession, Session]]):
    """Persistence helpers for report share links."""


    async def create(
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
        db = cast(AsyncSession, self.db)
        share = ReportShareLink(
            session_id=session_id,
            owner_id=owner_id,
            mediator_id=mediator_id,
            mediator_email=mediator_email,
            token_hash=token_hash,
            expires_at=expires_at,
            note=note,
        )
        db.add(share)
        await db.flush()
        await db.refresh(share)
        return share

    def create_sync(
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
        db = cast(Session, self.db)
        share = ReportShareLink(
            session_id=session_id,
            owner_id=owner_id,
            mediator_id=mediator_id,
            mediator_email=mediator_email,
            token_hash=token_hash,
            expires_at=expires_at,
            note=note,
        )
        db.add(share)
        db.flush()
        db.refresh(share)
        return share

    async def get_active_by_token(self, token_hash: str, *, now: datetime | None = None) -> Optional[ReportShareLink]:
        db = cast(AsyncSession, self.db)
        current = now or datetime.now(timezone.utc)
        result = await db.execute(
            select(ReportShareLink)
            .filter(ReportShareLink.token_hash == token_hash)
            .filter(ReportShareLink.revoked_at.is_(None))
            .filter(ReportShareLink.expires_at >= current)
        )
        return result.scalars().first()

    def get_active_by_token_sync(self, token_hash: str, *, now: datetime | None = None) -> Optional[ReportShareLink]:
        db = cast(Session, self.db)
        current = now or datetime.now(timezone.utc)
        result = db.execute(
            select(ReportShareLink)
            .filter(ReportShareLink.token_hash == token_hash)
            .filter(ReportShareLink.revoked_at.is_(None))
            .filter(ReportShareLink.expires_at >= current)
        )
        return result.scalars().first()

    async def revoke_existing(self, *, session_id: uuid.UUID, mediator_id: int, now: datetime | None = None) -> int:
        db = cast(AsyncSession, self.db)
        current = now or datetime.now(timezone.utc)
        stmt = (
            update(ReportShareLink)
            .where(ReportShareLink.session_id == session_id)
            .where(ReportShareLink.mediator_id == mediator_id)
            .where(ReportShareLink.revoked_at.is_(None))
            .values(revoked_at=current)
        )
        result = await db.execute(stmt)
        return int(result.rowcount or 0)

    def revoke_existing_sync(self, *, session_id: uuid.UUID, mediator_id: int, now: datetime | None = None) -> int:
        db = cast(Session, self.db)
        current = now or datetime.now(timezone.utc)
        stmt = (
            update(ReportShareLink)
            .where(ReportShareLink.session_id == session_id)
            .where(ReportShareLink.mediator_id == mediator_id)
            .where(ReportShareLink.revoked_at.is_(None))
            .values(revoked_at=current)
        )
        result = db.execute(stmt)
        return int(result.rowcount or 0)

    def mark_access(self, share: ReportShareLink, *, at: datetime | None = None) -> None:
        share.last_accessed_at = at or datetime.now(timezone.utc)
        share.access_count = (share.access_count or 0) + 1

