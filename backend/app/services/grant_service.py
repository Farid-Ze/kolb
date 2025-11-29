import logging
import time
from datetime import datetime, timezone
from functools import wraps
from typing import Optional

from sqlalchemy import select, or_
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.core.errors import InsufficientCreditsError
from app.models.klsi.audit import AuditLog
from app.models.klsi.grant import AccessGrant

logger = logging.getLogger(__name__)

def retry_on_deadlock(max_retries: int = 3, initial_wait: float = 0.1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            while True:
                try:
                    return func(*args, **kwargs)
                except OperationalError as e:
                    # Check for deadlock (Postgres code 40P01) or serialization failure (40001)
                    if e.orig and hasattr(e.orig, 'pgcode') and e.orig.pgcode in ('40P01', '40001'):
                        retries += 1
                        if retries > max_retries:
                            logger.error(f"Max retries reached for deadlock: {e}")
                            raise
                        wait_time = initial_wait * (2 ** (retries - 1))
                        logger.warning(f"Deadlock detected, retrying in {wait_time}s... (Attempt {retries}/{max_retries})")
                        time.sleep(wait_time)
                    else:
                        raise
        return wrapper
    return decorator

class GrantService:
    def __init__(self, db: Session):
        self.db = db

    @retry_on_deadlock()
    def redeem_credit(self, user_id: int, instrument_id: int, session_id: Optional[str] = None) -> AccessGrant:
        """
        Atomically redeem a credit for the user.
        Uses pessimistic locking (SELECT ... FOR UPDATE) to prevent race conditions.
        """
        now = datetime.now(timezone.utc)
        
        # 1. Select valid grant with locking
        stmt = (
            select(AccessGrant)
            .where(
                AccessGrant.grantee_id == user_id,
                AccessGrant.instrument_id == instrument_id,
                AccessGrant.credits_consumed < AccessGrant.credits_total,
                or_(AccessGrant.expiry_date.is_(None), AccessGrant.expiry_date > now)
            )
            .with_for_update() # Pessimistic Lock
            .order_by(AccessGrant.created_at.asc())
            .limit(1)
        )

        grant = self.db.execute(stmt).scalar_one_or_none()

        if not grant:
            raise InsufficientCreditsError(detail=f"User {user_id} has no credits for instrument {instrument_id}")

        # 3. Mutation
        grant.credits_consumed += 1
        
        # 4. Audit Trail
        audit_action = f"REDEEM_GRANT:{grant.id}"
        if session_id:
            audit_action += f":SESSION:{session_id}"
            
        audit_log = AuditLog(
            actor=str(user_id),
            action=audit_action,
            payload_hash="hash_placeholder" 
        )
        self.db.add(audit_log)
        
        # 5. Commit to release lock and save changes
        self.db.commit()
        self.db.refresh(grant)
        
        return grant
