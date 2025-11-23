import json
from datetime import datetime, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

import os
os.environ.setdefault("JWT_SECRET_KEY", "debug-secret-key")

from app.main import app
from app.db.database import SessionLocal
from app.models.klsi.user import User
from app.models.klsi.learning import LearningStyleType, LearningFlexibilityIndex, UserLearningStyle
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.services.security import create_access_token

client = TestClient(app)

with SessionLocal() as db:
    mediator = db.query(User).filter_by(email="mediator-debug@unikom.ac.id").first()
    if mediator is None:
        mediator = User(full_name="Mediator Debug", email="mediator-debug@unikom.ac.id", role="MEDIATOR")
        db.add(mediator)
        db.commit()
        db.refresh(mediator)
    user = db.query(User).filter_by(email="user-debug@unikom.ac.id").first()
    if user is None:
        user = User(full_name="User Debug", email="user-debug@unikom.ac.id", role="MAHASISWA")
        db.add(user)
        db.commit()
        db.refresh(user)
    mediator_id = mediator.id
    user_id = user.id

token = create_access_token(str(mediator_id))
team_name = f"Debug Team {uuid4().hex[:6]}"
resp = client.post("/teams/", json={"name": team_name}, headers={"Authorization": f"Bearer {token}"})
resp.raise_for_status()
team_id = resp.json()["id"]
client.post(
    f"/teams/{team_id}/members",
    json={"user_id": user_id},
    headers={"Authorization": f"Bearer {token}"},
)

with SessionLocal() as db:
    style = db.query(LearningStyleType).first()
    if style is None:
        raise RuntimeError("No LearningStyleType seeded")
    sess = AssessmentSession(
        user_id=user_id,
        status=SessionStatus.completed,
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc),
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)
    db.add(LearningFlexibilityIndex(session_id=sess.id, W_coefficient=0.4, LFI_score=0.7))
    db.add(
        UserLearningStyle(
            session_id=sess.id,
            primary_style_type_id=style.id,
            ACCE_raw=10,
            AERO_raw=5,
            style_intensity_score=15,
        )
    )
    db.commit()

today = datetime.now(timezone.utc).date().isoformat()
roll = client.post(
    f"/teams/{team_id}/rollup/run",
    params={"for_date": today},
    headers={"Authorization": f"Bearer {token}"},
)
print(roll.status_code)
print(json.dumps(roll.json(), indent=2))
