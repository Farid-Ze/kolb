from datetime import datetime, timezone
from typing import Optional, List, Union, cast
from dataclasses import dataclass

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models.klsi.grant import AccessGrant
from app.db.repositories.base import Repository

@dataclass(slots=True, repr=True)
class GrantRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for Grant operations with pessimistic locking for transactional integrity."""

    async def create(self, grant: AccessGrant) -> AccessGrant:
        db = cast(AsyncSession, self.db)
        db.add(grant)
        await db.flush()
        await db.refresh(grant)
        return grant

    async def get_active_grant_for_user_locked(self, user_id: int, instrument_id: int) -> Optional[AccessGrant]:
        """
        Get an active grant for a user with row locking (SELECT FOR UPDATE).
        
        Criteria:
        - grantee_id matches
        - instrument_id matches
        - credits_used < credits_total
        - expiry_date is None OR expiry_date > now
        """
        db = cast(AsyncSession, self.db)
        now = datetime.now(timezone.utc)
        
        stmt = (
            select(AccessGrant)
            .where(
                AccessGrant.grantee_id == user_id,
                AccessGrant.instrument_id == instrument_id,
                AccessGrant.credits_consumed < AccessGrant.credits_total,
                or_(AccessGrant.expiry_date.is_(None), AccessGrant.expiry_date > now)
            )
            .with_for_update() # CRITICAL: Row locking to prevent race conditions
            .limit(1)
        )
        
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_active_grants(self, user_id: int) -> List[AccessGrant]:
        """Get all active grants for a user (no lock)."""
        db = cast(AsyncSession, self.db)
        now = datetime.now(timezone.utc)
        stmt = (
            select(AccessGrant)
            .where(
                AccessGrant.grantee_id == user_id,
                AccessGrant.credits_consumed < AccessGrant.credits_total,
                or_(AccessGrant.expiry_date.is_(None), AccessGrant.expiry_date > now)
            )
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, grant_id: str) -> Optional[AccessGrant]:
        """Get grant by ID."""
        db = cast(AsyncSession, self.db)
        # Note: grant_id is UUID but passed as string or UUID object
        stmt = select(AccessGrant).where(AccessGrant.id == grant_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke(self, grant: AccessGrant) -> None:
        """Revoke a grant by expiring it immediately."""
        db = cast(AsyncSession, self.db)
        grant.expiry_date = datetime.now(timezone.utc)
        db.add(grant)
        await db.flush()

