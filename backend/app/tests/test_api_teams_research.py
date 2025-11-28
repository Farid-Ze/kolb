from datetime import UTC, date, datetime
from uuid import uuid4

from app.db.database import SessionLocal
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.learning import (
    CombinationScore,
    LearningFlexibilityIndex,
    LearningStyleType,
    ScaleScore,
    UserLearningStyle,
)
from app.models.klsi.norms import PercentileScore
from app.models.klsi.research import ReliabilityResult, ResearchStudy, ValidityEvidence
from app.models.klsi.team import TeamAssessmentRollup
from app.models.klsi.user import User


def _issue_token(user_id: int):
    # Minimal JWT mimic: gunakan service security untuk pembuatan token.
    from app.services.security import create_access_token
    return create_access_token(subject=str(user_id))


def test_team_crud_and_member_and_rollup(client):
    print("DEBUG: Entering test_team_crud_and_member_and_rollup")
    try:
        with SessionLocal() as db:
            print("DEBUG: Inside SessionLocal context")
            mediator = db.query(User).filter(User.email == 'mediator@mahasiswa.unikom.ac.id').first()
            print(f"DEBUG: Mediator query result: {mediator}")
            if mediator is None:
                mediator = User(
                    full_name='Mediator',
                    email='mediator@mahasiswa.unikom.ac.id',
                    role='MEDIATOR',
                )
                db.add(mediator)
                db.commit()
                db.refresh(mediator)
            print("DEBUG: Mediator ready")
            
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
            print("DEBUG: Normal user ready")
            
            token_mediator = _issue_token(mediator.id)
            print("DEBUG: Token issued")
    except Exception as e:
        print(f"DEBUG: Exception in test setup: {e}")
        import traceback
        traceback.print_exc()
        raise

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
    r = client.get(f'/teams/?q={team_name}')
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert any(t['id'] == team_id for t in data['items'])

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
        json={'email': user.email, 'role_in_team': 'MEMBER'},
        headers={'Authorization': f'Bearer {token_mediator}'},
    )
    assert r.status_code == 200
    member_id = r.json()['id']

    # Duplicate member should 409
    r_dup = client.post(
        f'/teams/{team_id}/members',
        json={'email': user.email},
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
    assert data['totalSessions'] >= 1
    assert data['avgLfi'] is not None
    assert data['styleCounts']

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
    sid = r.json()['publicId']

    # List studies
    mediator_headers = {'Authorization': f'Bearer {token_mediator}'}

    r = client.get('/research/studies?q=Studi', headers=mediator_headers)
    assert r.status_code == 200 and any(s['publicId'] == sid for s in r.json())
    r_unauth = client.get('/research/studies?q=Studi')
    assert r_unauth.status_code == 401

    # Update study
    r = client.patch(
        f'/research/studies/{sid}',
        json={'notes': 'Catatan'},
        headers=mediator_headers,
    )
    assert r.status_code == 200 and r.json()['notes'] == 'Catatan'

    # Fetch single study
    r_detail = client.get(
        f'/research/studies/{sid}',
        headers=mediator_headers,
    )
    assert r_detail.status_code == 200 and r_detail.json()['publicId'] == sid
    r_detail_unauth = client.get(f'/research/studies/{sid}')
    assert r_detail_unauth.status_code == 401

    # Add reliability
    r = client.post(
        f'/research/studies/{sid}/reliability',
        json={'metric_name': 'Cronbach_alpha_AC', 'value': 0.81},
        headers=mediator_headers,
    )
    assert r.status_code == 200

    # Add validity
    r = client.post(
        f'/research/studies/{sid}/validity',
        json={'evidence_type': 'construct', 'description': 'Factor structure'},
        headers=mediator_headers,
    )
    assert r.status_code == 200

    # List reliability & validity
    r_rel = client.get(f'/research/studies/{sid}/reliability', headers=mediator_headers)
    r_val = client.get(f'/research/studies/{sid}/validity', headers=mediator_headers)
    assert r_rel.status_code == 200 and len(r_rel.json()) == 1
    assert r_val.status_code == 200 and len(r_val.json()) == 1
    r_rel_unauth = client.get(f'/research/studies/{sid}/reliability')
    r_val_unauth = client.get(f'/research/studies/{sid}/validity')
    assert r_rel_unauth.status_code == 401
    assert r_val_unauth.status_code == 401

    # Delete should 409 while children exist
    r = client.delete(
        f'/research/studies/{sid}',
        headers=mediator_headers,
    )
    assert r.status_code == 409

    # (Optional) Remove children then delete
    # For brevity: direct DB delete
    with SessionLocal() as db:
        study = db.query(ResearchStudy).filter_by(title='Studi A').first()
        if study:
            db.query(ReliabilityResult).filter_by(study_id=study.id).delete()
            db.query(ValidityEvidence).filter_by(study_id=study.id).delete()
            db.commit()
            
    r = client.delete(
        f'/research/studies/{sid}',
        headers=mediator_headers,
    )
    assert r.status_code == 200


def test_research_study_data_endpoint(client):
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
        participant = db.query(User).filter(User.email == 'participant@unikom.ac.id').first()
        if participant is None:
            participant = User(
                full_name='Participant One',
                email='participant@unikom.ac.id',
                role='MAHASISWA',
            )
            db.add(participant)
            db.commit()
            db.refresh(participant)
        study = ResearchStudy(
            title='Dataset Study',
            description='Export contract',
            started_at=datetime(2025, 1, 1, tzinfo=UTC),
            completed_at=datetime(2025, 12, 31, tzinfo=UTC),
        )
        db.add(study)
        db.commit()
        db.refresh(study)
        style_type = db.query(LearningStyleType).first()
        assert style_type is not None
        now = datetime(2025, 6, 1, tzinfo=UTC)
        session = AssessmentSession(
            user_id=participant.id,
            status=SessionStatus.completed,
            start_time=now,
            end_time=now,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        db.add(
            ScaleScore(
                session_id=session.id,
                CE_raw=28,
                RO_raw=30,
                AC_raw=32,
                AE_raw=34,
            )
        )
        db.add(
            CombinationScore(
                session_id=session.id,
                ACCE_raw=4,
                AERO_raw=2,
                assimilation_accommodation=0,
                converging_diverging=0,
                balance_acce=3,
                balance_aero=2,
            )
        )
        db.add(
            UserLearningStyle(
                session_id=session.id,
                primary_style_type_id=style_type.id,
                ACCE_raw=4,
                AERO_raw=2,
                kite_coordinates=None,
                style_intensity_score=10,
            )
        )
        db.add(
            PercentileScore(
                session_id=session.id,
                norm_group_used='Total',
                CE_percentile=50,
                RO_percentile=55,
                AC_percentile=60,
                AE_percentile=65,
                ACCE_percentile=50,
                AERO_percentile=50,
                CE_source='DB',
                RO_source='DB',
                AC_source='DB',
                AE_source='DB',
                ACCE_source='DB',
                AERO_source='DB',
                used_fallback_any=False,
                norm_provenance=None,
                raw_outside_norm_range=False,
                truncated_scales=None,
            )
        )
        db.commit()
        mediator_id = mediator.id
        study_id = study.public_id

    token_mediator = _issue_token(mediator_id)
    headers = {'Authorization': f'Bearer {token_mediator}'}
    
    # Get data (POST)
    r = client.post(
        f'/research/studies/{study_id}/data',
        json={},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    payload = r.json()
    assert payload['summary']['totalSessions'] == 1
    assert payload['summary']['uniqueParticipants'] == 1
    assert len(payload['items']) == 1  # Changed from dataPoints to items
    assert payload['items'][0]['normGroup'] == 'Total'

    style_name = payload['items'][0]['learningStyle']
    assert style_name
    
    # Filter by style (POST)
    r_filtered = client.post(
        f"/research/studies/{study_id}/data",
        json={"learning_style": style_name},
        headers=headers,
    )
    assert r_filtered.status_code == 200
    assert len(r_filtered.json()['items']) == 1  # Changed from dataPoints to items

    # Filter by nonexistent style (POST)
    r_empty = client.post(
        f"/research/studies/{study_id}/data",
        json={"learning_style": "Nonexistent"},
        headers=headers,
    )
    assert r_empty.status_code == 200
    assert r_empty.json()['summary']['totalSessions'] == 0

