import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime

from app.main import app
from app.services.security import get_current_user
from app.models.klsi.user import User
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus

def test_get_latest_results_no_session(client: TestClient, session: Session):
    # Create a user
    user = User(
        email="test@example.com",
        full_name="Test User",
        nim="12345678",
    )
    user.kelas = "IF-01"
    session.add(user)
    session.commit()
    session.refresh(user)

    # Override dependency
    app.dependency_overrides[get_current_user] = lambda: user

    response = client.get("/results/latest")
    
    # Should return 404
    assert response.status_code == 404
    assert response.json()["detail"] == "No finalized session found"

    # Clean up
    app.dependency_overrides = {}

def test_get_latest_results_success(client: TestClient, session: Session):
    # Create a user
    user = User(
        email="test2@example.com",
        full_name="Test User 2",
        nim="87654321",
        kelas="IF-02"
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Create a finalized session with results
    results_json = {
        "kite_coordinates": {"CE": 0.8, "RO": 0.6, "AC": 0.4, "AE": 0.2},
        "lfi_score": 0.5,
        "percentiles": {"CE": 80, "RO": 60, "AC": 40, "AE": 20},
        "blindspots": ["AE", "AC"],
        "strengths": ["CE", "RO"]
    }
    
    assessment_session = AssessmentSession(
        user_id=user.id,
        status=SessionStatus.completed,
        results_json=results_json,
        start_time=datetime.now()
    )
    session.add(assessment_session)
    session.commit()

    # Override dependency
    app.dependency_overrides[get_current_user] = lambda: user

    response = client.get("/results/latest")

    assert response.status_code == 200
    data = response.json()
    assert data["kiteCoordinates"]["CE"] == 0.8
    assert data["blindspots"] == ["AE", "AC"]
    assert data["strengths"] == ["CE", "RO"]

    # Clean up
    app.dependency_overrides = {}
