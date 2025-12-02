import logging
import asyncio
from datetime import datetime, timezone
from functools import wraps
from typing import Optional

from sqlalchemy import select, or_
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import InsufficientCreditsError
from app.models.klsi.audit import AuditLog
from app.models.klsi.grant import AccessGrant

logger = logging.getLogger(__name__)

def retry_on_deadlock(max_retries: int = 3, initial_wait: float = 0.1):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            retries = 0
            while True:
                try:
                    return await func(*args, **kwargs)
                except OperationalError as e:
                    # Check for deadlock (Postgres code 40P01) or serialization failure (40001)
                    pgcode = getattr(e.orig, 'pgcode', None)
                    if pgcode and pgcode in ('40P01', '40001'):
                        retries += 1
                        if retries > max_retries:
                            logger.error(f"Max retries reached for deadlock: {e}")
                            raise
                        wait_time = initial_wait * (2 ** (retries - 1))
                        logger.warning(f"Deadlock detected, retrying in {wait_time}s... (Attempt {retries}/{max_retries})")
                        await asyncio.sleep(wait_time)
                    else:
                        raise
        return wrapper
    return decorator

class GrantService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @retry_on_deadlock()
    async def redeem_credit(self, user_id: int, instrument_id: int, session_id: Optional[str] = None) -> AccessGrant:
        """
        Atomically redeem a credit for the user.
        Uses Optimistic Locking (Compare-and-Swap) to prevent race conditions.
        """
        from sqlalchemy import update
        
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Loop for optimistic retry
        for _ in range(5):
            # 1. Select valid grant (No Lock needed for Optimistic)
            stmt = (
                select(AccessGrant)
                .where(
                    AccessGrant.grantee_id == user_id,
                    AccessGrant.instrument_id == instrument_id,
                    AccessGrant.credits_consumed < AccessGrant.credits_total,
                    or_(AccessGrant.expiry_date.is_(None), AccessGrant.expiry_date > now)
                )
                .order_by(AccessGrant.created_at.asc())
                .limit(1)
            )

            result = await self.db.execute(stmt)
            grant = result.scalar_one_or_none()

            if not grant:
                logger.warning(f"DEBUG: No grant found for user {user_id} instrument {instrument_id}")
                raise InsufficientCreditsError(detail=f"User {user_id} has no credits for instrument {instrument_id}")

            # 2. Atomic Update with Version Check (credits_consumed)
            update_stmt = (
                update(AccessGrant)
                .where(
                    AccessGrant.id == grant.id,
                    AccessGrant.credits_consumed == grant.credits_consumed # Optimistic Lock
                )
                .values(
                    credits_consumed=AccessGrant.credits_consumed + 1,
                    updated_at=now
                )
            )
            
            result = await self.db.execute(update_stmt)
            
            if result.rowcount == 1:
                # Success!
                # 3. Audit Trail
                audit_action = f"REDEEM_GRANT:{grant.id}"
                if session_id:
                    audit_action += f":SESSION:{session_id}"
                    
                audit_log = AuditLog(
                    actor=str(user_id),
                    action=audit_action,
                    payload_hash="hash_placeholder",
                    created_at=now
                )
                self.db.add(audit_log)
                
                await self.db.commit()
                await self.db.refresh(grant)
                return grant
            else:
                # Failed (someone else updated it), retry
                await self.db.rollback()
                continue
        
        raise InsufficientCreditsError(detail="Failed to redeem credit due to high concurrency")

    async def get_grant_summary(self, user_id: int) -> dict:
        """
        Get summary of all active grants for a user.
        
        Returns:
            Dictionary with total available credits and grant details
        """
        from app.db.repositories import GrantRepository
        
        repo = GrantRepository(self.db)
        grants = await repo.get_all_active_grants(user_id)
        
        total_credits = sum(g.credits_total - g.credits_consumed for g in grants)
        
        return {
            "user_id": user_id,
            "total_available_credits": total_credits,
            "grants": [
                {
                    "id": g.id,
                    "instrument_id": g.instrument_id,
                    "credits_total": g.credits_total,
                    "credits_consumed": g.credits_consumed,
                    "credits_remaining": g.credits_total - g.credits_consumed,
                    "expires_at": g.expiry_date.isoformat() if g.expiry_date else None,
                    "created_at": g.created_at.isoformat(),
                }
                for g in grants
            ]
        }

    async def grant_credits(self, user_id: int, instrument_id: int, credits: int, expiry_date: Optional[datetime] = None) -> AccessGrant:
        """Grant credits to a user."""
        from app.db.repositories import GrantRepository
        repo = GrantRepository(self.db)
        grant = AccessGrant(
            grantee_id=user_id,
            instrument_id=instrument_id,
            credits_total=credits,
            expiry_date=expiry_date,
            grantor_id=None 
        )
        return await repo.create(grant)

    async def revoke_grant(self, grant_id: str, reason: Optional[str] = None) -> None:
        """Revoke a grant."""
        from app.db.repositories import GrantRepository
        repo = GrantRepository(self.db)
        grant = await repo.get_by_id(grant_id)
        if not grant:
            raise ValueError(f"Grant {grant_id} not found")
        await repo.revoke(grant)
        await self.db.commit()

