from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.klsi.gamification import GamificationBadge, UserAchievement
from app.models.klsi.user import User
from app.services.security import get_current_user


def _override_user(user: User):
    app.dependency_overrides[get_current_user] = lambda: user


def _clear_overrides():
    app.dependency_overrides = {}


def _create_user(session: Session, email: str) -> User:
    nim_value = f"{abs(hash(email)) % 10**8:08d}"
    user = User(
        full_name="Users Router Tester",
        email=email,
        nim=nim_value,
        kelas="IF-01",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def test_get_me_returns_profile(client: TestClient, session: Session):
    user = _create_user(session, "users-profile@example.com")
    user.avatar_url = "https://example.com/avatar.png"
    user.zen_points = 250
    user.current_lvl = 3
    user.life_motto = "Grow daily"
    session.commit()
    try:
        _override_user(user)
        response = client.get("/users/me")
        assert response.status_code == 200
        payload = response.json()
        assert payload["email"] == user.email
        assert payload["zenPoints"] == 250
        assert payload["currentLvl"] == 3
        assert payload["avatarUrl"] == "https://example.com/avatar.png"
        assert payload["lifeMotto"] == "Grow daily"
    finally:
        _clear_overrides()


def test_list_achievements_returns_badges(client: TestClient, session: Session):
    user = _create_user(session, "users-achievements@example.com")
    badge = session.query(GamificationBadge).filter_by(slug="the-seeker").first()
    assert badge is not None
    session.add(UserAchievement(user_id=user.id, badge_id=badge.id))
    session.commit()
    try:
        _override_user(user)
        response = client.get("/users/me/achievements")
        assert response.status_code == 200
        payload = response.json()
        assert isinstance(payload, list)
        assert payload, "expected at least one achievement"
        first = payload[0]
        assert first["badge"]["slug"] == "the-seeker"
        assert "awardedAt" in first
    finally:
        _clear_overrides()
