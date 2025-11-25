import pytest
import uuid
from app.db.database import SessionLocal
from app.models.klsi.user import User
from app.models.klsi.instrument import Instrument
from app.services.grant_service import GrantService, InsufficientCreditsError
from app.models.klsi.grant import AccessGrant


def test_allocate_and_redeem_credits(db):
    # Setup: Create a user with unique email
    email = f"test_grant_{uuid.uuid4()}@example.com"
    user = User(email=email, full_name="Test Grant User", password_hash="hash")
    db.add(user)
    db.commit()
    db.refresh(user)

    # Get an instrument (assuming seeded)
    instrument = db.query(Instrument).first()
    if not instrument:
        # Create a dummy instrument if none exists
        instrument = Instrument(
            code="TEST_INST",
            name="Test Instrument",
            version="1.0",
            description="Test Desc",
            is_active=True
        )
        db.add(instrument)
        db.commit()
        db.refresh(instrument)

    # 1. Allocate Credits
    grant = GrantService.allocate_credits(
        db, 
        grantor_id=user.id, # Self-grant for simplicity
        instrument_id=instrument.id,
        grantee_id=user.id,
        credits=5
    )
    
    assert grant.id is not None
    assert grant.credits_allocated == 5
    assert grant.credits_consumed == 0
    
    # 2. Check Balance
    balance = GrantService.get_balance(db, user.id, instrument.id)
    assert balance == 5
    
    # 3. Redeem Credit
    used_grant = GrantService.redeem_credit(db, user.id, instrument.id)
    assert used_grant.id == grant.id
    assert used_grant.credits_consumed == 1
    
    # 4. Check Balance again
    balance = GrantService.get_balance(db, user.id, instrument.id)
    assert balance == 4

def test_redeem_insufficient_credits(db):
    email = f"test_poor_{uuid.uuid4()}@example.com"
    user = User(email=email, full_name="Poor User", password_hash="hash")
    db.add(user)
    db.commit()

    instrument = db.query(Instrument).first()
    if not instrument:
        instrument = Instrument(
            code="TEST_INST_2",
            name="Test Instrument 2",
            version="1.0",
            description="Test Desc",
            is_active=True
        )
        db.add(instrument)
        db.commit()
        db.refresh(instrument)

    with pytest.raises(InsufficientCreditsError):
        GrantService.redeem_credit(db, user.id, instrument.id)
