
import pytest
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.klsi.user import User
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus, ReflectionType
from app.services.sphere_service import sphere_service
from app.schemas.sphere import ReflectionCreate

def test_sphere_node_creation(session: Session):
    user = User(email="sphere_test@example.com", full_name="Sphere Test", nim="99999999")
    session.add(user)
    session.commit()
    session.refresh(user)

    node = sphere_service.create_node_for_event(
        session, 
        user.id, 
        "assessment_finalized", 
        {"session_id": 1}
    )
    
    assert node.id is not None
    assert node.user_id == user.id
    assert node.meta["event_type"] == "assessment_finalized"
    # Check if coordinates are not all zero (unless it's the first one and random logic allows it, but highly unlikely to be exactly 0,0,0 with the new logic)
    assert node.pos_x != 0 or node.pos_y != 0 or node.pos_z != 0

def test_reflection_flow(session: Session):
    user = User(email="reflection_test@example.com", full_name="Reflection Test", nim="88888888")
    session.add(user)
    session.commit()
    session.refresh(user)

    # Create reflection
    payload = ReflectionCreate(
        content="This is a test reflection",
        reflection_type=ReflectionType.thinking
    )
    reflection = sphere_service.create_reflection(session, user.id, payload)
    
    assert reflection.id is not None
    assert reflection.content == "This is a test reflection"
    assert reflection.reflection_type == ReflectionType.thinking

    # List reflections
    reflections = sphere_service.list_reflections(session, user.id)
    assert len(reflections) == 1
    assert reflections[0].id == reflection.id

    # Filter by type
    thinking_reflections = sphere_service.list_reflections(session, user.id, ReflectionType.thinking)
    assert len(thinking_reflections) == 1
    
    feeling_reflections = sphere_service.list_reflections(session, user.id, ReflectionType.feeling)
    assert len(feeling_reflections) == 0

def test_get_prompt_for_user(session: Session):
    user = User(email="prompt_test@example.com", full_name="Prompt Test", nim="77777777")
    session.add(user)
    session.commit()
    session.refresh(user)

    # No assessment -> default prompt
    prompt = sphere_service.get_prompt_for_user(session, user.id)
    assert prompt == "Reflect on your journey so far. What are your goals?"

    # Add assessment with CE dominant
    results_json = {
        "kite_coordinates": {"CE": 0.9, "RO": 0.5, "AC": 0.2, "AE": 0.4},
        "lfi_score": 0.5,
        "percentiles": {},
        "blindspots": [],
        "strengths": []
    }
    assessment = AssessmentSession(
        user_id=user.id,
        status=SessionStatus.completed,
        results_json=results_json,
        start_time=datetime.now()
    )
    session.add(assessment)
    session.commit()

    prompt = sphere_service.get_prompt_for_user(session, user.id)
    assert "How did this experience make you feel?" in prompt
