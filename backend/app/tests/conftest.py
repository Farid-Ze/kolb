import os

# Ensure critical settings exist for test imports before loading app modules
os.environ.setdefault("JWT_SECRET_KEY", "local-test-secret")
# Default to SQLite for most tests, but allow override
if "POSTGRES_TEST" not in os.environ:
    os.environ["DATABASE_URL"] = "sqlite:///test.db"
os.environ["RUN_STARTUP_SEED"] = "False"
print("DEBUG: LOADING CONFTEST.PY")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

# Import app modules AFTER setting env vars
from app.core.config import settings

@pytest.fixture(scope="session", autouse=True)
def patch_settings(request):
    """Patch settings for testing."""
    # Skip patching for race condition tests to use real Postgres
    # Check if we are running the race condition test file
    is_race_test = any("test_race_conditions.py" in str(arg) for arg in request.config.args)
    
    if is_race_test or os.environ.get("POSTGRES_TEST"):
        print("DEBUG: Skipping SQLite patch for race condition tests - using PostgreSQL")
        # Ensure we are using the real DB URL from env (which docker-compose provides)
        # We might need to reset it if it was overwritten by the import
        if settings.database_url.startswith("sqlite"):
             # Fallback to the docker service URL if available, or keep as is if it's already postgres
             pass
        return

    # Use SQLite for fast unit tests
    settings.database_url = "sqlite:///test.db"
    print(f"DEBUG: Patched settings.database_url to {settings.database_url}")

from app.db.database import Base, SessionLocal, engine
from app.main import app
from app.models import klsi as _  # ensure legacy models load before schema sync
print(f"DEBUG: conftest loaded klsi. Instrument type: {type(_.Instrument)}")
import sys
sys.stdout.flush()
from app.models import engine as _engine  # register new engine authoring models
from app.models.klsi.grant import AccessGrant
from app.models.klsi.user import User  # Ensure User model is registered
print(f"DEBUG: User model imported: {User}")
print(f"DEBUG: Base metadata tables: {Base.metadata.tables.keys()}")

@pytest.fixture(scope="session", autouse=True)
def db_setup():
    print("DEBUG: Executing db_setup fixture")
    # [Zenotika V4] Explicitly register plugins for tests since lifespan might not trigger reliably
    from app.main import _register_explicit_plugins
    _register_explicit_plugins()
    print("DEBUG: Explicitly registered plugins in conftest")
    # Recreate schema fresh to pick up new columns added in models (e.g., provenance fields)
    db_url = str(engine.url)
    if db_url.startswith("sqlite"):
        path = db_url.split("///")[-1]
        if os.path.exists(path):
            engine.dispose()
            try:
                os.remove(path)
            except OSError:
                pass
            
    # Drop dependent views first (Postgres only)
    if not db_url.startswith("sqlite"):
        with engine.connect() as conn:
            conn.execute(text("DROP MATERIALIZED VIEW IF EXISTS mv_class_style_stats CASCADE"))
            conn.execute(text("DROP VIEW IF EXISTS v_style_grid CASCADE"))
            conn.commit()

    Base.metadata.drop_all(bind=engine)
    from app.models.klsi.user import User
    print(f"DEBUG: Creating tables. Registered models: {Base.metadata.tables.keys()}")
    Base.metadata.create_all(bind=engine)
    
    from app.services.seeds import (
        seed_learning_styles,
        seed_assessment_items,
        # seed_instruments_v2,
        seed_engine_authoring,
        seed_gamification_badges,
        seed_growth_challenges,
    )

    def seed_instruments_v2(db):
        # (Keeping existing seed logic simplified for brevity in this replace, 
        # but in write_to_file I must provide full content. 
        # I will copy the seed logic from the previous view_file output)
        Instrument: Any = None
        InstrumentScale: Any = None
        ScoringPipeline: Any = None
        ScoringPipelineNode: Any = None
        with open("debug_log.txt", "a") as f:
            f.write("DEBUG: Entering seed_instruments_v2\n")
            import app.models.klsi.instrument as instr_file
            
            try:
                Instrument = instr_file.Instrument
                InstrumentScale = instr_file.InstrumentScale
                ScoringPipeline = instr_file.ScoringPipeline
                ScoringPipelineNode = instr_file.ScoringPipelineNode
            except Exception as e:
                f.write(f"DEBUG: Error accessing models: {e}\n")
            
            from datetime import datetime, timezone
            
            # Use raw SQL to avoid ORM mapper configuration issues during check
            if db.execute(text("SELECT 1 FROM instruments WHERE code = 'KLSI' AND version = '4.0'")).scalar():
                f.write("DEBUG: Instrument already exists\n")
                return

            now = datetime.now(timezone.utc)
            try:
                instrument = Instrument(
                    code="KLSI",
                    name="Kolb Learning Style Inventory",
                    version="4.0",
                    default_strategy_code="KLSI4.0",
                    description="Kolb Learning Style Inventory 4.0",
                    is_active=True,
                    created_at=now,
                )
                db.add(instrument)
                db.flush()
            except Exception as e:
                f.write(f"DEBUG: Error creating instrument: {e}\n")
                raise
        
        SCALE_DEFS = [
            ("CE", "Concrete Experience", 1),
            ("RO", "Reflective Observation", 2),
            ("AC", "Abstract Conceptualization", 3),
            ("AE", "Active Experimentation", 4),
            ("ACCE", "AC - CE Dialectic", 5),
            ("AERO", "AE - RO Dialectic", 6),
            ("LFI", "Learning Flexibility Index", 7),
        ]
        for code, name, order in SCALE_DEFS:
            db.add(
                InstrumentScale(
                    instrument_id=instrument.id,
                    scale_code=code,
                    display_name=name,
                    rendering_order=order,
                )
            )
        
        # Create default pipeline
        pipeline = ScoringPipeline(
            instrument_id=instrument.id,
            pipeline_code="KLSI4.0",
            version="v1",
            description="Standard KLSI 4.0 Scoring",
            is_active=True,
            created_at=now,
        )
        db.add(pipeline)
        db.flush()

        # Add nodes
        nodes = [
            ("compute_raw_scale_scores", 1, {}),
            ("compute_dialectic_scores", 2, {}),
            ("determine_learning_style", 3, {}),
            ("calculate_lfi", 4, {}),
            ("generate_feedback", 5, {}),
        ]
        
        for key, order, config in nodes:
            db.add(ScoringPipelineNode(
                pipeline_id=pipeline.id,
                node_key=key,
                execution_order=order,
                node_type="calculation",
                config=config
            ))
            
    # Seed data
    with SessionLocal() as db:
        seed_instruments_v2(db)
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
