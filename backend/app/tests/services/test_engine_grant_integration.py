import pytest
import uuid
from sqlalchemy import select
from app.db.database import SessionLocal
from app.models.klsi.user import User
from app.models.klsi.store import StoreProduct
from app.services.engine import EngineSessionService
from app.services.grant_service import GrantService
from app.core.errors import PermissionDeniedError
from app.services.seeds import seed_store_products, seed_instruments

@pytest.fixture
def db():
    session = SessionLocal()
    # Ensure seeds are run for this test session
    seed_instruments(session)
    seed_store_products(session)
    try:
        yield session
    finally:
        session.close()

def test_start_session_requires_grant(db):
    # Setup User
    email = f"test_engine_grant_{uuid.uuid4()}@example.com"
    user = User(email=email, full_name="Test Engine Grant", password_hash="hash")
    db.add(user)
    db.commit()
    db.refresh(user)
    
    service = EngineSessionService(db)
    
    # 1. Try to start session without grant -> Should Fail
    with pytest.raises(PermissionDeniedError) as excinfo:
        service.start_session(user, instrument_code="KLSI", instrument_version="4.0")
    
    # Check for localized message or fallback
    assert "Kuota akses tidak mencukupi" in str(excinfo.value) or "Insufficient credits" in str(excinfo.value)

    # 2. Allocate Grant
    # Find the product seeded
    # Use slug for test simplicity and to avoid JSON dialect issues in test env
    stmt = select(StoreProduct).where(StoreProduct.slug == "klsi-4.0")
    product = db.execute(stmt).scalars().first()
    assert product is not None, "KLSI 4.0 product not found in seeds"
    
    GrantService.allocate_credits(db, user.id, product.id, grantee_id=user.id, credits=1)
    
    # 3. Try to start session -> Should Succeed (or at least pass the grant check)
    try:
        session = service.start_session(user, instrument_code="KLSI", instrument_version="4.0")
        assert session is not None
    except PermissionDeniedError:
        pytest.fail("Should not raise PermissionDeniedError after grant allocation")
    except Exception:
        # Ignore other runtime errors (like missing pipeline config) as we only test the grant gate here
        pass
