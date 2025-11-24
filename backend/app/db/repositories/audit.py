from typing import Any

from sqlalchemy.orm import Session

from app.db.repositories.base import BaseRepository
from app.models.klsi.audit import AuditLog


class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(db, AuditLog)

    def log(self, actor: str, action: str, payload_hash: str | None = None) -> AuditLog:
        audit = AuditLog(
            actor=actor,
            action=action,
            payload_hash=payload_hash,
        )
        self.db.add(audit)
        return audit
