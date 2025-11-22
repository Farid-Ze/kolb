from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.klsi.challenge import GrowthChallenge, UserChallenge
from app.models.klsi.enums import ChallengeStatus
from app.models.klsi.user import User
from app.services.challenge_service import challenge_service
from app.services.security import get_current_user


def _override_user(user: User):
    app.dependency_overrides[get_current_user] = lambda: user


def _clear_overrides():
    app.dependency_overrides = {}


def _create_user(session: Session, email: str) -> User:
    nim_value = f"{abs(hash(email)) % 10**8:08d}"
    user = User(full_name="Challenge Tester", email=email, nim=nim_value, kelas="IF-42")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _seed_user_challenge(session: Session, user: User) -> UserChallenge:
    challenge = session.query(GrowthChallenge).first()
    assert challenge is not None, "seeded growth challenge required"
    uc = UserChallenge(
        user_id=user.id,
        challenge_id=challenge.id,
        status=ChallengeStatus.active,
        created_at=datetime.utcnow(),
    )
    session.add(uc)
    session.commit()
    session.refresh(uc)
    return uc


def test_complete_challenge_awards_points(client: TestClient, session: Session):
    user = _create_user(session, "challenge-complete@example.com")
    uc = _seed_user_challenge(session, user)
    try:
        _override_user(user)
        payload = {"proofUrl": "https://example.com/proof"}
        response = client.post(f"/challenges/user/{uc.id}/complete", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"].lower() == "completed"
        session.refresh(user)
        assert user.zen_points == challenge_service.COMPLETION_AWARD_POINTS
    finally:
        _clear_overrides()


def test_complete_challenge_twice_returns_conflict(client: TestClient, session: Session):
    user = _create_user(session, "challenge-conflict@example.com")
    uc = _seed_user_challenge(session, user)
    try:
        _override_user(user)
        first = client.post(f"/challenges/user/{uc.id}/complete", json={})
        assert first.status_code == 200
        second = client.post(f"/challenges/user/{uc.id}/complete", json={})
        assert second.status_code == 409
    finally:
        _clear_overrides()
