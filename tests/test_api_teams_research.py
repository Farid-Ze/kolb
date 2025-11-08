from datetime import date, datetime, UTC
from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.database import Base, SessionLocal
from app.db.database import engine as app_engine
from app.main import app
from app.models.klsi import (
    AssessmentSession,
    LearningFlexibilityIndex,
    LearningStyleType,
    SessionStatus,
    TeamAssessmentRollup,
    User,
    UserLearningStyle,
)
from app.services.seeds import seed_learning_styles, seed_placeholder_items

# NOTE: We re-use the existing engine (likely SQLite in tests) and seed data once.
# Create a mediator and normal user for auth flows.

def _ensure_seed():
    Base.metadata.create_all(bind=app_engine)
    with SessionLocal() as db:
        seed_learning_styles(db)
        seed_placeholder_items(db)
        # mediator user
        if not db.query(User).filter(User.email == 'mediator@example.com').first():
            db.add(User(full_name='Mediator', email='mediator@example.com', role='MEDIATOR'))
        if not db.query(User).filter(User.email == 'user@example.com').first():
            db.add(User(full_name='User', email='user@example.com', role='MAHASISWA'))
        db.commit()


def _issue_token(user_id: int):
    # Minimal JWT mimic: tests bypass actual signing by using settings secret via real auth endpoint would be better.
    # For simplicity, call auth router? If no password hashed, direct token issuance stub.
    # Here we import security service to create token properly.
    from app.services.security import create_access_token
    return create_access_token(subject=str(user_id))


def test_team_crud_and_member_and_rollup():
    _ensure_seed()
    client = TestClient(app)
    with SessionLocal() as db:
        mediator = db.query(User).filter(User.email == 'mediator@example.com').first()
        if mediator is None:
            mediator = User(full_name='Mediator', email='mediator@example.com', role='MEDIATOR')
            db.add(mediator); db.commit(); db.refresh(mediator)
        normal = db.query(User).filter(User.email == 'user@example.com').first()
        if normal is None:
            normal = User(full_name='User', email='user@example.com', role='MAHASISWA')
            db.add(normal); db.commit(); db.refresh(normal)
        token_mediator = _issue_token(mediator.id)
        token_user = _issue_token(normal.id)

    # Create team (mediator)
    team_name = f"Alpha Team {uuid4().hex[:6]}"
    r = client.post('/teams/', json={'name': team_name}, headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200, r.text
    team_id = r.json()['id']

    # List teams (public)
    r = client.get('/teams/?q=Alpha')
    assert r.status_code == 200 and any(t['id'] == team_id for t in r.json())

    # Update team (mediator)
    r = client.patch(f'/teams/{team_id}', json={'description': 'Desc'}, headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200 and r.json()['description'] == 'Desc'

    # Add member (mediator)
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == 'user@example.com').first()
        assert user is not None
    r = client.post(f'/teams/{team_id}/members', json={'user_id': user.id, 'role_in_team': 'Member'}, headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200
    member_id = r.json()['id']

    # Duplicate member should 409
    r_dup = client.post(f'/teams/{team_id}/members', json={'user_id': user.id}, headers={'Authorization': f'Bearer {token_mediator}'})
    assert r_dup.status_code == 409

    # Prepare a completed session for rollup (direct DB insert for speed)
    with SessionLocal() as db:
        st = db.query(LearningStyleType).first()
        assert st is not None
        now = datetime.now(UTC)
        s = AssessmentSession(user_id=user.id, status=SessionStatus.completed, start_time=now, end_time=now)
        db.add(s); db.commit(); db.refresh(s)
        db.add(LearningFlexibilityIndex(session_id=s.id, W_coefficient=0.4, LFI_score=0.6, LFI_percentile=None, flexibility_level='Moderate'))
        db.add(UserLearningStyle(session_id=s.id, primary_style_type_id=st.id, ACCE_raw=10, AERO_raw=6, kite_coordinates=None, style_intensity_score=16))
        db.commit()

    # Trigger rollup (mediator)
    # Use explicit date from the created session (end_time date) to avoid counting prior seeded sessions
    session_date = date.today().isoformat()
    r = client.post(f'/teams/{team_id}/rollup/run?for_date={session_date}', headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data['total_sessions'] >= 1
    assert data['avg_lfi'] is not None
    assert data['style_counts']

    # Attempt delete team should 409 (has member & rollup)
    r = client.delete(f'/teams/{team_id}', headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 409

    # Remove member and rollup then delete
    # Remove member
    r = client.delete(f'/teams/{team_id}/members/{member_id}', headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200
    # Manually delete rollups
    with SessionLocal() as db:
        db.query(TeamAssessmentRollup).filter(TeamAssessmentRollup.team_id == team_id).delete()
        db.commit()
    r = client.delete(f'/teams/{team_id}', headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200


def test_research_crud_and_children():
    _ensure_seed()
    client = TestClient(app)
    with SessionLocal() as db:
        mediator = db.query(User).filter(User.email == 'mediator@example.com').first()
        if mediator is None:
            mediator = User(full_name='Mediator', email='mediator@example.com', role='MEDIATOR')
            db.add(mediator); db.commit(); db.refresh(mediator)
    token_mediator = _issue_token(mediator.id)

    # Create study
    r = client.post('/research/studies', json={'title': 'Studi A', 'description': 'D'}, headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200
    sid = r.json()['id']

    # List studies
    r = client.get('/research/studies?q=Studi')
    assert r.status_code == 200 and any(s['id'] == sid for s in r.json())

    # Update study
    r = client.patch(f'/research/studies/{sid}', json={'notes': 'Catatan'}, headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200 and r.json()['notes'] == 'Catatan'

    # Add reliability
    r = client.post(f'/research/studies/{sid}/reliability', json={'metric_name': 'Cronbach_alpha_AC', 'value': 0.81}, headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200

    # Add validity
    r = client.post(f'/research/studies/{sid}/validity', json={'evidence_type': 'construct', 'description': 'Factor structure'}, headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200

    # List reliability & validity
    r_rel = client.get(f'/research/studies/{sid}/reliability')
    r_val = client.get(f'/research/studies/{sid}/validity')
    assert r_rel.status_code == 200 and len(r_rel.json()) == 1
    assert r_val.status_code == 200 and len(r_val.json()) == 1

    # Delete should 409 while children exist
    r = client.delete(f'/research/studies/{sid}', headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 409

    # (Optional) Remove children then delete
    # For brevity: direct DB delete
    with SessionLocal() as db:
        from app.models.klsi import ReliabilityResult, ValidityEvidence
        db.query(ReliabilityResult).filter_by(study_id=sid).delete()
        db.query(ValidityEvidence).filter_by(study_id=sid).delete()
        db.commit()
    r = client.delete(f'/research/studies/{sid}', headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200
