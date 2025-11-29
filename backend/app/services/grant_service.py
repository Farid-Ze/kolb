from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.repositories.grant import GrantRepository
from app.models.klsi.grant import AccessGrant

class InsufficientCreditsError(Exception):
    """Raised when a user has no active grants or insufficient credits."""
    pass

class GrantService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = GrantRepository(db)

    def consume_credit(self, user_id: int, instrument_id: int) -> AccessGrant:
        """
        Consume 1 credit for the given user and instrument.
        Raises 403 Forbidden if no active grant is available.
        """
        # 1. Get active grant with row lock
        grant = self.repo.get_active_grant_for_user_locked(user_id, instrument_id)
        
        if not grant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No active grant found or quota exceeded."
            )
            
        # 2. Mutate state
        grant.credits_used += 1
        grant.updated_at = datetime.now(timezone.utc)
        
        # 3. Commit is expected to be handled by the caller (FastAPI dependency)
        # But to be safe and atomic here, we can flush.
        self.db.flush()
        
        return grant

    def get_grant_summary(self, user_id: int) -> Dict[str, Any]:
        """
        Get a summary of grants for the user.
        Returns: { "instruments": { "1": 5, "2": 2 } }
        """
        grants = self.repo.get_all_active_grants(user_id)
        
        summary = {}
        for grant in grants:
            remaining = grant.credits_total - grant.credits_used
            inst_id = str(grant.instrument_id)
            
            if inst_id in summary:
                summary[inst_id] += remaining
            else:
                summary[inst_id] = remaining
                
        return {"instruments": summary}
