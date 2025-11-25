import os

# Ensure critical settings exist for test imports before loading app modules
os.environ.setdefault("JWT_SECRET_KEY", "local-test-secret")

import pytest
from fastapi.testclient import TestClient

from app.db.database import Base, SessionLocal, engine
from app.main import app
from app.models import klsi as _  # ensure legacy models load before schema sync
from app.models import engine as _engine  # register new engine authoring models
from app.services.seeds import (
    seed_learning_styles,
    seed_assessment_items,
    seed_instruments,
    seed_engine_authoring,
    seed_gamification_badges,
    seed_growth_challenges,
)
from sqlalchemy import text


@pytest.fixture(scope="session")
def db_setup():
    # Recreate schema fresh to pick up new columns added in models (e.g., provenance fields)
    db_url = str(engine.url)
    if db_url.startswith("sqlite"):
        path = db_url.split("///")[-1]
        if os.path.exists(path):
            engine.dispose()
            os.remove(path)
            
    # Drop dependent views first
    with engine.connect() as conn:
        conn.execute(text("DROP MATERIALIZED VIEW IF EXISTS mv_class_style_stats CASCADE"))
        conn.execute(text("DROP VIEW IF EXISTS v_style_grid CASCADE"))
        conn.commit()

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_instruments(db)
        seed_learning_styles(db)
        seed_assessment_items(db)
        seed_engine_authoring(db)
        seed_gamification_badges(db)
        seed_growth_challenges(db)
        db.commit()
    yield

@pytest.fixture
def db(db_setup):
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture()
def client(db_setup):
    with TestClient(app) as c:
        yield c

@pytest.fixture()
def session(db_setup):
    with SessionLocal() as db:
        yield db
