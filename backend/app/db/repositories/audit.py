from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.base import Repository
from app.models.klsi.audit import AuditLog


class AuditRepository(Repository[AsyncSession]):
    def __init__(self, db: AsyncSession):
        super().__init__(db)

    async def log(self, actor: str, action: str, payload_hash: str | None = None) -> AuditLog:
        audit = AuditLog(
            actor=actor,
            action=action,
            payload_hash=payload_hash,
        )
        self.db.add(audit)
        await self.db.flush()
        await self.db.refresh(audit)
        return audit

