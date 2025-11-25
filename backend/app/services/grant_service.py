import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update, func
from sqlalchemy.orm import Session

from app.models.klsi.grant import AccessGrant
from app.models.klsi.instrument import Instrument
from app.models.klsi.user import User


class GrantServiceError(Exception):
    """Base exception for GrantService errors."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class InsufficientCreditsError(GrantServiceError):
    """Raised when a user attempts to redeem a credit but has none available."""
    pass


class GrantService:
    """
    Service for managing Access Grants (Research Credits).
    Follows the 'Stateless Service' pattern for Python 3.13t (No-GIL) compatibility.
    """

    @staticmethod
    def allocate_credits(
        db: Session,
        grantor_id: int,
        instrument_id: int,
        grantee_id: Optional[int] = None,
        credits: int = 1,
        expiry_date: Optional[datetime] = None,
    ) -> AccessGrant:
        """
        Allocates research credits to a user (or creates a token grant).
        
        Args:
            db: Database session.
            grantor_id: ID of the user granting the credits (e.g. Admin/Professor).
            instrument_id: ID of the instrument (Instrument) being granted.
            grantee_id: ID of the recipient user. If None, this is a token grant.
            credits: Number of credits to allocate.
            expiry_date: Optional expiration date.
            
        Returns:
            The created AccessGrant object.
        """
        # Validate existence of grantor and instrument
        grantor = db.get(User, grantor_id)
        if not grantor:
            raise GrantServiceError(f"Grantor with ID {grantor_id} not found.")
            
        instrument = db.get(Instrument, instrument_id)
        if not instrument:
            raise GrantServiceError(f"Instrument with ID {instrument_id} not found.")

        if grantee_id:
            grantee = db.get(User, grantee_id)
            if not grantee:
                raise GrantServiceError(f"Grantee with ID {grantee_id} not found.")

        grant_id = str(uuid.uuid4())
        grant = AccessGrant(
            id=grant_id,
            grantor_id=grantor_id,
            grantee_id=grantee_id,
            instrument_id=instrument_id,
            credits_allocated=credits,
            credits_consumed=0,
            expiry_date=expiry_date,
            is_active=True,
        )
        
        db.add(grant)
        db.commit()
        db.refresh(grant)
        return grant

    @staticmethod
    def get_active_grants(db: Session, grantee_id: int, instrument_id: int) -> list[AccessGrant]:
        """
        Retrieves active grants for a user and instrument that have remaining credits.
        """
        stmt = select(AccessGrant).where(
            AccessGrant.grantee_id == grantee_id,
            AccessGrant.instrument_id == instrument_id,
            AccessGrant.is_active == True,
            AccessGrant.credits_consumed < AccessGrant.credits_allocated
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def redeem_credit(
        db: Session,
        grantee_id: int,
        instrument_id: int
    ) -> AccessGrant:
        """
        Redeems a single credit for the specified user and instrument.
        Uses ROW LOCKING (SELECT ... FOR UPDATE) to prevent race conditions.
        
        Args:
            db: Database session.
            grantee_id: The user attempting to use a credit.
            instrument_id: The instrument being accessed.
            
        Returns:
            The AccessGrant that was used.
            
        Raises:
            InsufficientCreditsError: If no valid credits are available.
        """
        # Find the oldest active grant with available credits
        # We lock the row immediately to prevent double-spending in concurrent requests
        stmt = (
            select(AccessGrant)
            .where(
                AccessGrant.grantee_id == grantee_id,
                AccessGrant.instrument_id == instrument_id,
                AccessGrant.is_active == True,
                AccessGrant.credits_consumed < AccessGrant.credits_allocated
            )
            .order_by(AccessGrant.created_at.asc())
            .limit(1)
            .with_for_update()  # CRITICAL: Locks the row until commit
        )
        
        grant = db.execute(stmt).scalar_one_or_none()
        
        if not grant:
            raise InsufficientCreditsError(
                f"User {grantee_id} has no available credits for instrument {instrument_id}."
            )
            
        # Check expiry if set
        if grant.expiry_date and grant.expiry_date < datetime.now(timezone.utc):
             # If expired, we can't use it. 
             # Ideally we might want to mark it inactive or look for another grant,
             # but for now we just fail to be safe and simple.
             # In a real loop we would try the next one, but let's keep it atomic.
             raise InsufficientCreditsError("Available grant has expired.")

        # Consume the credit
        grant.credits_consumed += 1
        grant.updated_at = datetime.now(timezone.utc)
        
        db.add(grant)
        db.commit()
        db.refresh(grant)
        
        return grant

    @staticmethod
    def get_balance(db: Session, user_id: int, instrument_id: int) -> int:
        """
        Calculates the total available credits for a user and instrument.
        Read-only operation, no locking needed.
        """
        stmt = (
            select(
                func.sum(AccessGrant.credits_allocated - AccessGrant.credits_consumed)
            )
            .where(
                AccessGrant.grantee_id == user_id,
                AccessGrant.instrument_id == instrument_id,
                AccessGrant.is_active == True,
                (AccessGrant.expiry_date == None) | (AccessGrant.expiry_date > datetime.now(timezone.utc))
            )
        )
        
        result = db.execute(stmt).scalar()
        return result or 0
