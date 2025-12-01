from typing import Any, Union, cast

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.db.repositories.base import Repository
from app.models.klsi.audit import AuditLog


class AuditRepository(Repository[Union[AsyncSession, Session]]):
    def __init__(self, db: Union[AsyncSession, Session]):
        super().__init__(db)

    async def log(self, actor: str, action: str, payload_hash: str | None = None) -> AuditLog:
        db = cast(AsyncSession, self.db)
        audit = AuditLog(
            actor=actor,
            action=action,
            payload_hash=payload_hash,
        )
        db.add(audit)
        await db.flush()
        await db.refresh(audit)
        return audit

    def log_sync(self, actor: str, action: str, payload_hash: str | None = None) -> AuditLog:
        """Log audit entry - Sync version."""
        db = cast(Session, self.db)
        audit = AuditLog(
            actor=actor,
            action=action,
            payload_hash=payload_hash,
        )
        db.add(audit)
        db.flush()
        db.refresh(audit)
        return audit

