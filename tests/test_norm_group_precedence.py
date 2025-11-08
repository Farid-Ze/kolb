from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.models.klsi import AssessmentSession, EducationLevel, Gender, User
from app.services.scoring import _resolve_norm_groups


def _db():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine)()


def test_norm_group_precedence_includes_country():
    db = _db()
    # Create user with edu, country, dob, gender
    from datetime import date
    u = User(full_name="T", email="t@example.com", password_hash=None,
             date_of_birth=date(1995, 1, 1),
             gender=Gender.male,
             education_level=EducationLevel.university,
             country="Germany")
    db.add(u)
    db.flush()

    sess = AssessmentSession(user_id=u.id)
    db.add(sess)
    db.commit()

    groups = _resolve_norm_groups(db, sess.id)
    # Check order segments
    assert groups[0].startswith("EDU:")
    assert any(g.startswith("COUNTRY:") for g in groups)
    # AGE should be present
    assert any(g.startswith("AGE:") for g in groups)
    # Gender present
    assert any(g.startswith("GENDER:") for g in groups)
    # Total always last candidate
    assert groups[-1] == "Total"
