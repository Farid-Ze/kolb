from datetime import UTC, date, datetime
from uuid import uuid4

from app.db.database import SessionLocal
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.learning import (
    LearningFlexibilityIndex,
    LearningStyleType,
    UserLearningStyle,
)
from app.models.klsi.research import ReliabilityResult, ValidityEvidence
from app.models.klsi.team import TeamAssessmentRollup
from app.models.klsi.user import User


def _issue_token(user_id: int):
    # Minimal JWT mimic: gunakan service security untuk pembuatan token.
    from app.services.security import create_access_token
    return create_access_token(subject=str(user_id))


def test_team_crud_and_member_and_rollup(client):
    with SessionLocal() as db:
        mediator = db.query(User).filter(User.email == 'mediator@mahasiswa.unikom.ac.id').first()
        if mediator is None:
            mediator = User(
                full_name='Mediator',
                email='mediator@mahasiswa.unikom.ac.id',
                role='MEDIATOR',
            )
            db.add(mediator)
            db.commit()
            db.refresh(mediator)
        normal = db.query(User).filter(User.email == 'user@mahasiswa.unikom.ac.id').first()
        if normal is None:
            normal = User(
                full_name='User',
                email='user@mahasiswa.unikom.ac.id',
                role='MAHASISWA',
            )
            db.add(normal)
            db.commit()
            db.refresh(normal)
        token_mediator = _issue_token(mediator.id)

    # Create team (mediator)
    team_name = f"Alpha Team {uuid4().hex[:6]}"
    r = client.post(
        '/teams/',
        json={'name': team_name},
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r.status_code == 200, r.text
    team_id = r.json()['id']

    # List teams (public)
    r = client.get('/teams/?q=Alpha')
    assert r.status_code == 200 and any(t['id'] == team_id for t in r.json())

    # Update team (mediator)
    r = client.patch(
        f'/teams/{team_id}',
        json={'description': 'Desc'},
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r.status_code == 200 and r.json()['description'] == 'Desc'

    # Add member (mediator)
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == 'user@mahasiswa.unikom.ac.id').first()
        assert user is not None
    r = client.post(
        f'/teams/{team_id}/members',
        json={'user_id': user.id, 'role_in_team': 'Member'},
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r.status_code == 200
    member_id = r.json()['id']

    # Duplicate member should 409
    r_dup = client.post(
        f'/teams/{team_id}/members',
        json={'user_id': user.id},
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r_dup.status_code == 409

    # Prepare a completed session for rollup (direct DB insert for speed)
    with SessionLocal() as db:
        st = db.query(LearningStyleType).first()
        assert st is not None
        now = datetime.now(UTC)
        s = AssessmentSession(
            user_id=user.id,
            status=SessionStatus.completed,
            start_time=now,
            end_time=now,
        )
        db.add(s)
        db.commit()
        db.refresh(s)
        db.add(
            LearningFlexibilityIndex(
                session_id=s.id,
                W_coefficient=0.4,
                LFI_score=0.6,
                LFI_percentile=None,
                flexibility_level='Moderate',
            )
        )
        db.add(
            UserLearningStyle(
                session_id=s.id,
                primary_style_type_id=st.id,
                ACCE_raw=10,
                AERO_raw=6,
                kite_coordinates=None,
                style_intensity_score=16,
            )
        )
        db.commit()

    # Trigger rollup (mediator)
    # Use explicit date from created session (end_time) to avoid counting seeded sessions
    session_date = date.today().isoformat()
    r = client.post(
        f'/teams/{team_id}/rollup/run?for_date={session_date}',
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
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
    r = client.delete(
        f'/teams/{team_id}/members/{member_id}',
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r.status_code == 200
    # Manually delete rollups
    with SessionLocal() as db:
        db.query(TeamAssessmentRollup).filter(TeamAssessmentRollup.team_id == team_id).delete()
        db.commit()
    r = client.delete(f'/teams/{team_id}', headers={'Authorization': f'Bearer {token_mediator}'})
    assert r.status_code == 200


def test_research_crud_and_children(client):
    with SessionLocal() as db:
        mediator = db.query(User).filter(User.email == 'mediator@mahasiswa.unikom.ac.id').first()
        if mediator is None:
            mediator = User(
                full_name='Mediator',
                email='mediator@mahasiswa.unikom.ac.id',
                role='MEDIATOR',
            )
            db.add(mediator)
            db.commit()
            db.refresh(mediator)
    token_mediator = _issue_token(mediator.id)

    # Create study
    r = client.post(
        '/research/studies',
        json={'title': 'Studi A', 'description': 'D'},
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r.status_code == 200
    sid = r.json()['id']

    # List studies
    r = client.get('/research/studies?q=Studi')
    assert r.status_code == 200 and any(s['id'] == sid for s in r.json())

    # Update study
    r = client.patch(
        f'/research/studies/{sid}',
        json={'notes': 'Catatan'},
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r.status_code == 200 and r.json()['notes'] == 'Catatan'

    # Add reliability
    r = client.post(
        f'/research/studies/{sid}/reliability',
        json={'metric_name': 'Cronbach_alpha_AC', 'value': 0.81},
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r.status_code == 200

    # Add validity
    r = client.post(
        f'/research/studies/{sid}/validity',
        json={'evidence_type': 'construct', 'description': 'Factor structure'},
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r.status_code == 200

    # List reliability & validity
    r_rel = client.get(f'/research/studies/{sid}/reliability')
    r_val = client.get(f'/research/studies/{sid}/validity')
    assert r_rel.status_code == 200 and len(r_rel.json()) == 1
    assert r_val.status_code == 200 and len(r_val.json()) == 1

    # Delete should 409 while children exist
    r = client.delete(
        f'/research/studies/{sid}',
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r.status_code == 409

    # (Optional) Remove children then delete
    # For brevity: direct DB delete
    with SessionLocal() as db:
        db.query(ReliabilityResult).filter_by(study_id=sid).delete()
        db.query(ValidityEvidence).filter_by(study_id=sid).delete()
        db.commit()
    r = client.delete(
        f'/research/studies/{sid}',
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r.status_code == 200
