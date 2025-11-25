import pytest
import uuid
from app.db.database import SessionLocal
from app.models.klsi.user import User
from app.models.klsi.store import StoreProduct
from app.services.grant_service import GrantService, InsufficientCreditsError
from app.models.klsi.grant import AccessGrant

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_allocate_and_redeem_credits(db):
    # Setup: Create a user with unique email
    email = f"test_grant_{uuid.uuid4()}@example.com"
    user = User(email=email, full_name="Test Grant User", password_hash="hash")
    db.add(user)
    db.commit()
    db.refresh(user)

    # Get a product (assuming seeded)
    product = db.query(StoreProduct).first()
    if not product:
        # Create a dummy product if none exists
        product = StoreProduct(
            name="Test Product", 
            description="Test Desc", 
            price=100, 
            is_active=True,
            product_type="instrument"
        )
        db.add(product)
        db.commit()
        db.refresh(product)

    # 1. Allocate Credits
    grant = GrantService.allocate_credits(
        db, 
        grantor_id=user.id, # Self-grant for simplicity
        instrument_id=product.id,
        grantee_id=user.id,
        credits=5
    )
    
    assert grant.id is not None
    assert grant.credits_allocated == 5
    assert grant.credits_consumed == 0
    
    # 2. Check Balance
    balance = GrantService.get_balance(db, user.id, product.id)
    assert balance == 5
    
    # 3. Redeem Credit
    used_grant = GrantService.redeem_credit(db, user.id, product.id)
    assert used_grant.id == grant.id
    assert used_grant.credits_consumed == 1
    
    # 4. Check Balance again
    balance = GrantService.get_balance(db, user.id, product.id)
    assert balance == 4

def test_redeem_insufficient_credits(db):
    email = f"test_poor_{uuid.uuid4()}@example.com"
    user = User(email=email, full_name="Poor User", password_hash="hash")
    db.add(user)
    db.commit()

    product = db.query(StoreProduct).first()
    if not product:
        product = StoreProduct(
            name="Test Product 2", 
            description="Test Desc", 
            price=100, 
            is_active=True,
            product_type="instrument"
        )
        db.add(product)
        db.commit()
        db.refresh(product)

    with pytest.raises(InsufficientCreditsError):
        GrantService.redeem_credit(db, user.id, product.id)
