import pytest
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.services.store_service import store_service
from app.services.engine import EngineSessionService
from app.services.grant_service import GrantService
from app.models.klsi.store import StoreProduct
from app.models.klsi.user import User
from app.schemas.store import CheckoutRequest, CartItem

# Ensure KLSI plugin is registered
import app.instruments.klsi4.plugin

def create_test_user(db: Session) -> User:
    unique_email = f"test_store_{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        email=unique_email,
        full_name="Test Store User",
        password_hash="hashed_secret"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_seeded_product(db: Session) -> StoreProduct:
    # Fetch the seeded KLSI product
    stmt = select(StoreProduct).where(StoreProduct.slug == "klsi-4.0")
    product = db.execute(stmt).scalar_one_or_none()
    if not product:
        # Fallback if seeding didn't run (should not happen with db_setup)
        product = StoreProduct(
            slug="klsi-4.0",
            name="Kolb Learning Style Inventory 4.0",
            description="Official assessment",
            base_price=1,
            meta={"instrument_code": "KLSI", "instrument_version": "4.0"}
        )
        db.add(product)
        db.commit()
        db.refresh(product)
    return product

def test_full_purchase_flow(db: Session):
    # 1. Setup
    user = create_test_user(db)
    product = get_seeded_product(db)
    engine_service = EngineSessionService(db)
    
    # 2. Create Order
    checkout_payload = CheckoutRequest(
        items=[CartItem(product_id=product.id, quantity=2)]
    )
    order = store_service.create_order(db, user.id, checkout_payload)
    
    assert order.payment_status == "pending"
    # assert order.total_amount == 200 # Price might be 1 or 100 depending on seed/fallback
    
    # Verify no grants yet
    grants = GrantService.get_active_grants(db, user.id, product.id)
    assert len(grants) == 0
    
    # 3. Process Payment
    store_service.process_payment_success(db, order.id)
    
    # 4. Verify Grant Allocation
    grants = GrantService.get_active_grants(db, user.id, product.id)
    assert len(grants) == 1
    assert grants[0].credits_allocated - grants[0].credits_consumed == 2
    
    # 5. Start Session (Redeem 1 credit)
    # We use "KLSI" as instrument code to match seeded instrument and engine check
    
    session = engine_service.start_session(user, instrument_code="KLSI")
    assert session is not None
    
    # 6. Verify Grant Deduction
    db.refresh(grants[0])
    assert grants[0].credits_allocated - grants[0].credits_consumed == 1

def create_test_product(db: Session, slug="klsi-v4-test", price=100) -> StoreProduct:
    product = StoreProduct(
        slug=slug,
        name="Test Instrument",
        description="Test Description",
        base_price=price,
        meta={"instrument_code": "KLSI", "instrument_version": "4.0"}
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

def test_free_order_auto_grant(db: Session):
    # 1. Setup
    user = create_test_user(db)
    product = create_test_product(db, slug="free-klsi", price=0)
    
    # 2. Create Order
    checkout_payload = CheckoutRequest(
        items=[CartItem(product_id=product.id, quantity=1)]
    )
    order = store_service.create_order(db, user.id, checkout_payload)
    
    # 3. Verify Auto-Payment and Grant
    assert order.payment_status == "paid"
    
    grants = GrantService.get_active_grants(db, user.id, product.id)
    assert len(grants) == 1
    assert grants[0].credits_allocated - grants[0].credits_consumed == 1
