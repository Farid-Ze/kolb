from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import select, or_, func
from sqlalchemy.orm import Session

from app.models.klsi.grant import AccessGrant

class GrantRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, grant: AccessGrant) -> AccessGrant:
        self.db.add(grant)
        self.db.flush()
        self.db.refresh(grant)
        return grant

    def get_active_grant_for_user_locked(self, user_id: int, instrument_id: int) -> Optional[AccessGrant]:
        """
        Get an active grant for a user with row locking (SELECT FOR UPDATE).
        
        Criteria:
        - grantee_id matches
        - instrument_id matches
        - credits_used < credits_total
        - expiry_date is None OR expiry_date > now
        """
        now = datetime.now(timezone.utc)
        
        stmt = (
            select(AccessGrant)
            .where(
                AccessGrant.grantee_id == user_id,
                AccessGrant.instrument_id == instrument_id,
                AccessGrant.credits_used < AccessGrant.credits_total,
                or_(AccessGrant.expiry_date.is_(None), AccessGrant.expiry_date > now)
            )
            .with_for_update() # CRITICAL: Row locking to prevent race conditions
            .limit(1)
        )
        
        return self.db.execute(stmt).scalar_one_or_none()

    def get_all_active_grants(self, user_id: int) -> List[AccessGrant]:
        """Get all active grants for a user (no lock)."""
        now = datetime.now(timezone.utc)
        stmt = (
            select(AccessGrant)
            .where(
                AccessGrant.grantee_id == user_id,
                AccessGrant.credits_used < AccessGrant.credits_total,
                or_(AccessGrant.expiry_date.is_(None), AccessGrant.expiry_date > now)
            )
        )
        return list(self.db.execute(stmt).scalars().all())
