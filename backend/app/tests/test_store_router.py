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


def _grant_badge(session: Session, user: User, slug: str = "the-seeker"):
    badge = session.query(GamificationBadge).filter_by(slug=slug).first()
    assert badge is not None
    session.add(UserAchievement(user_id=user.id, badge_id=badge.id))
    session.commit()


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


def test_store_checkout_updates_points_and_fund(client: TestClient, session: Session):
    user = _create_user(session, "store-checkout@example.com")
    user.zen_points = 1000
    session.commit()
    product = (
        session.query(StoreProduct)
        .filter(StoreProduct.required_badge_id.is_(None))
        .first()
    )
    assert product is not None

    try:
        _override_user(user)
        payload = {"productId": product.id, "contributionPoints": 50}
        response = client.post("/store/checkout", json=payload)
        assert response.status_code == 200
        data = response.json()
        session.refresh(user)
        assert data["remainingPoints"] == user.zen_points == 1000 - 50
        assert data["totalAmount"] == product.base_price
        assert data["snapToken"] is not None

        fund = client.get("/store/community-fund")
        assert fund.status_code == 200
        fund_payload = fund.json()
        assert fund_payload["totalPoints"] >= 50
        assert fund_payload["contributors"] >= 1
    finally:
        _clear_overrides()


def test_store_checkout_requires_badge(client: TestClient, session: Session):
    user = _create_user(session, "store-checkout-badge@example.com")
    user.zen_points = 1000
    session.commit()
    gated_product = (
        session.query(StoreProduct)
        .filter(StoreProduct.required_badge_id.isnot(None))
        .first()
    )
    assert gated_product is not None

    try:
        _override_user(user)
        payload = {"productId": gated_product.id}
        response = client.post("/store/checkout", json=payload)
        assert response.status_code == 403

        _grant_badge(session, user, slug="the-seeker")
        session.refresh(user)
        response2 = client.post("/store/checkout", json=payload)
        assert response2.status_code == 200
    finally:
        _clear_overrides()


def test_store_checkout_requires_balance(client: TestClient, session: Session):
    user = _create_user(session, "store-checkout-balance@example.com")
    user.zen_points = 10
    session.commit()
    product = session.query(StoreProduct).first()
    assert product is not None

    try:
        _override_user(user)
        payload = {"productId": product.id}
        response = client.post("/store/checkout", json=payload)
        assert response.status_code == 200

        over_contribution = {"productId": product.id, "contributionPoints": 50}
        response2 = client.post("/store/checkout", json=over_contribution)
        assert response2.status_code == 400
        assert "contribution" in response2.json()["detail"].lower()
    finally:
        _clear_overrides()
