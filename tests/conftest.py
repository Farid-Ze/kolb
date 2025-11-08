import pytest
from fastapi.testclient import TestClient

from app.db.database import Base, SessionLocal, engine
from app.main import app
from app.services.seeds import seed_learning_styles, seed_placeholder_items


@pytest.fixture(scope="session")
def db_setup():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_learning_styles(db)
        seed_placeholder_items(db)
        db.commit()
    yield

@pytest.fixture()
def client(db_setup):
    return TestClient(app)

@pytest.fixture()
def session():
    with SessionLocal() as db:
        yield db
