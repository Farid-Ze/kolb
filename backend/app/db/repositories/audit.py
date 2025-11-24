from typing import Any

from sqlalchemy.orm import Session

from app.db.repositories.base import Repository
from app.models.klsi.audit import AuditLog


class AuditRepository(Repository[Session]):
    def __init__(self, db: Session):
        super().__init__(db)

    def log(self, actor: str, action: str, payload_hash: str | None = None) -> AuditLog:
        audit = AuditLog(
            actor=actor,
            action=action,
            payload_hash=payload_hash,
        )
        self.db.add(audit)
        return audit
