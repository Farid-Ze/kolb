from uuid import uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.models.klsi import (
    AssessmentItem,
    AssessmentSession,
    ItemChoice,
    ItemType,
    LearningMode,
    SessionStatus,
    User,
    UserResponse,
)
from app.services.validation import check_session_complete

# NOTE: Using in-memory SQLite for unit test speed; ranks logic independent of PG features.
engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)


def _seed_minimal(session):
    # Ensure unique email per test run to avoid UNIQUE constraint collisions
    unique_email = f"t+{uuid4().hex}@example.com"
    u = User(full_name="Test User", email=unique_email)
    session.add(u); session.commit(); session.refresh(u)
    s = AssessmentSession(user_id=u.id, status=SessionStatus.started)
    session.add(s); session.commit(); session.refresh(s)
    # two items each with four choices
    for num in (1,2):
        ai = AssessmentItem(item_number=num, item_type=ItemType.learning_style, item_stem=f"Item {num}")
        session.add(ai); session.commit(); session.refresh(ai)
        modes = [LearningMode.CE, LearningMode.RO, LearningMode.AC, LearningMode.AE]
        for m in modes:
            ch = ItemChoice(item_id=ai.id, learning_mode=m, choice_text=f"{m.value} choice")
            session.add(ch)
        session.commit()
    return u, s


def test_validation_happy_path():
    session = SessionLocal()
    u, s = _seed_minimal(session)
    # submit full ranks for both items
    for item in session.query(AssessmentItem).all():
        choices = session.query(ItemChoice).filter(ItemChoice.item_id==item.id).all()
        # assign deterministic ranks 1..4
        for rank, ch in enumerate(choices, start=1):
            session.add(UserResponse(session_id=s.id, item_id=item.id, choice_id=ch.id, rank_value=rank))
    session.commit()
    result = check_session_complete(session, s.id)
    assert result['session_exists'] is True
    assert result['missing_item_ids'] == []
    assert result['items_with_rank_conflict'] == []
    assert result['items_with_missing_ranks'] == []
    assert result['ready_to_complete'] is True
    session.close()


def test_validation_item_missing():
    session = SessionLocal()
    u, s = _seed_minimal(session)
    # Provide ranks for only first item; treat all remaining as missing
    first_item = session.query(AssessmentItem).filter(AssessmentItem.item_number==1).first()
    assert first_item is not None
    choices = session.query(ItemChoice).filter(ItemChoice.item_id==first_item.id).all()
    for rank, ch in enumerate(choices, start=1):
        session.add(UserResponse(session_id=s.id, item_id=first_item.id, choice_id=ch.id, rank_value=rank))
    session.commit()
    result = check_session_complete(session, s.id)
    # Should list all other items as missing (here we seeded 2 items total)
    # Ensure at least one missing item and first item not in missing list
    assert first_item.id not in result['missing_item_ids']
    assert len(result['missing_item_ids']) >= 1
    assert result['ready_to_complete'] is False
    session.close()


def test_validation_rank_conflict():
    session = SessionLocal()
    u, s = _seed_minimal(session)
    first_item = session.query(AssessmentItem).filter(AssessmentItem.item_number==1).first()
    assert first_item is not None
    choices = session.query(ItemChoice).filter(ItemChoice.item_id==first_item.id).all()
    # Insert three ranks (1,2,3) and leave rank 4 missing; DB constraint prevents true duplicate ranks
    for rv, ch in zip([1,2,3], choices):
        session.add(UserResponse(session_id=s.id, item_id=first_item.id, choice_id=ch.id, rank_value=rv))
    session.commit()
    # Attempting to insert a duplicate rank should raise IntegrityError (DB-level ipsative enforcement)
    from sqlalchemy.exc import IntegrityError
    try:
        session.add(UserResponse(session_id=s.id, item_id=first_item.id, choice_id=choices[3].id, rank_value=1))
        session.commit()
        duplicate_blocked = False
    except IntegrityError:
        session.rollback()
        duplicate_blocked = True
    assert duplicate_blocked is True
    # Validation should at least report missing ranks
    result = check_session_complete(session, s.id)
    assert any(d['item_id'] == first_item.id and d['missing'] for d in result['items_with_missing_ranks'])
    assert result['ready_to_complete'] is False
    session.close()
