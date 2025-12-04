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
        
        # [Audit Fix] Retry logic for audit logging
        max_retries = 3
        for attempt in range(max_retries):
            try:
                await db.flush()
                await db.refresh(audit)
                return audit
            except Exception as e:
                if attempt == max_retries - 1:
                    # Log failure on final attempt
                    from app.core.logging import get_logger
                    logger = get_logger("kolb.db.audit")
                    logger.error(f"Failed to write audit log after {max_retries} attempts: {e}", extra={"actor": actor, "action": action})
                    raise
                await db.rollback()
                # Re-add since rollback clears the session
                db.add(audit)

    def log_sync(self, actor: str, action: str, payload_hash: str | None = None) -> AuditLog:
        """Log audit entry - Sync version."""
        db = cast(Session, self.db)
        audit = AuditLog(
            actor=actor,
            action=action,
            payload_hash=payload_hash,
        )
        db.add(audit)
        
        # [Audit Fix] Retry logic for audit logging
        max_retries = 3
        for attempt in range(max_retries):
            try:
                db.flush()
                db.refresh(audit)
                return audit
            except Exception as e:
                if attempt == max_retries - 1:
                    from app.core.logging import get_logger
                    logger = get_logger("kolb.db.audit")
                    logger.error(f"Failed to write audit log after {max_retries} attempts: {e}", extra={"actor": actor, "action": action})
                    raise
                db.rollback()
                db.add(audit)

