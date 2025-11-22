from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.klsi.gamification import GamificationBadge, UserAchievement
from app.models.klsi.store import StoreProduct
from app.models.klsi.user import User
from app.services.security import get_current_user


def _override_user(user: User):
    app.dependency_overrides[get_current_user] = lambda: user


def _clear_overrides():
    app.dependency_overrides = {}


def _create_user(session: Session, email: str) -> User:
    nim_value = f"{abs(hash(email)) % 10**8:08d}"
    user = User(full_name="Store Tester", email=email, nim=nim_value, kelas="IF-99")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def test_store_products_seeded(client: TestClient, session: Session):
    user = _create_user(session, "store-seed@example.com")
    try:
        _override_user(user)
        response = client.get("/store/products")
        assert response.status_code == 200
        payload = response.json()
        names = {item["name"] for item in payload}
        assert "Zen Reflection Journal" in names
        assert "Impact Canvas Pack" in names
    finally:
        _clear_overrides()


def test_store_badge_gating(client: TestClient, session: Session):
    user = _create_user(session, "store-gate@example.com")
    gated_product = session.query(StoreProduct).filter(StoreProduct.required_badge_id.isnot(None)).first()
    assert gated_product is not None

    try:
        _override_user(user)
        initial = client.get("/store/products")
        assert initial.status_code == 200
        initial_payload = initial.json()
        gated_snapshot = next(item for item in initial_payload if item["id"] == gated_product.id)
        assert gated_snapshot["eligible"] is False

        badge = session.query(GamificationBadge).filter_by(slug="the-seeker").first()
        assert badge is not None
        session.add(UserAchievement(user_id=user.id, badge_id=badge.id))
        session.commit()

        updated = client.get("/store/products")
        assert updated.status_code == 200
        refreshed = next(item for item in updated.json() if item["id"] == gated_product.id)
        assert refreshed["eligible"] is True
    finally:
        _clear_overrides()
