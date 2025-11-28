import os

# Ensure critical settings exist for test imports before loading app modules
os.environ.setdefault("JWT_SECRET_KEY", "local-test-secret")
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["RUN_STARTUP_SEED"] = "False"
print("DEBUG: LOADING CONFTEST.PY")

import pytest
from fastapi.testclient import TestClient

from app.db.database import Base, SessionLocal, engine
from app.main import app
from app.models import klsi as _  # ensure legacy models load before schema sync
print(f"DEBUG: conftest loaded klsi. Instrument type: {type(_.Instrument)}")
import sys
sys.stdout.flush()
from app.models import engine as _engine  # register new engine authoring models
from app.models.klsi.grant import AccessGrant
# import app.instruments.klsi4  # register KLSI 4.0 plugin - REMOVED to avoid circular import crash
from sqlalchemy import text


@pytest.fixture(scope="session")
def db_setup():
    print("DEBUG: Executing db_setup fixture")
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
        Instrument: Any = None
        InstrumentScale: Any = None
        ScoringPipeline: Any = None
        ScoringPipelineNode: Any = None
        with open("debug_log.txt", "a") as f:
            f.write("DEBUG: Entering seed_instruments_v2\n")
            import app.models.klsi.instrument as instr_file
            f.write(f"DEBUG: instr_file: {instr_file}\n")
            
            try:
                Instrument = instr_file.Instrument
                f.write(f"DEBUG: Instrument: {Instrument}, type: {type(Instrument)}\n")
            except Exception as e:
                f.write(f"DEBUG: Error accessing Instrument: {e}\n")

            try:
                InstrumentScale = instr_file.InstrumentScale
                f.write(f"DEBUG: InstrumentScale: {InstrumentScale}, type: {type(InstrumentScale)}\n")
            except Exception as e:
                f.write(f"DEBUG: Error accessing InstrumentScale: {e}\n")

            try:
                ScoringPipeline = instr_file.ScoringPipeline
                f.write(f"DEBUG: ScoringPipeline: {ScoringPipeline}, type: {type(ScoringPipeline)}\n")
            except Exception as e:
                f.write(f"DEBUG: Error accessing ScoringPipeline: {e}\n")

            try:
                ScoringPipelineNode = instr_file.ScoringPipelineNode
                f.write(f"DEBUG: ScoringPipelineNode: {ScoringPipelineNode}, type: {type(ScoringPipelineNode)}\n")
            except Exception as e:
                f.write(f"DEBUG: Error accessing ScoringPipelineNode: {e}\n")
            
            from app.models.engine import RuleType
            from sqlalchemy import select, text
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
                f.write(f"DEBUG: Created instrument object: {instrument}\n")
            except Exception as e:
                f.write(f"DEBUG: Error creating instrument: {e}\n")
                raise

            try:
                db.add(instrument)
                f.write("DEBUG: Added instrument to session\n")
                db.flush()
                f.write("DEBUG: Flushed session\n")
            except Exception as e:
                f.write(f"DEBUG: Error in db.add/flush: {e}\n")
                import traceback
                f.write(traceback.format_exc())
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
        with open("debug_log.txt", "a") as f:
            f.write("DEBUG: Calling seed_instruments_v2\n")
        seed_instruments_v2(db)
        
        with open("debug_log.txt", "a") as f:
            f.write("DEBUG: Calling seed_learning_styles\n")
        seed_learning_styles(db)
        
        with open("debug_log.txt", "a") as f:
            f.write("DEBUG: Calling seed_assessment_items\n")
        seed_assessment_items(db)
        
        with open("debug_log.txt", "a") as f:
            f.write("DEBUG: Calling seed_engine_authoring\n")
        seed_engine_authoring(db)
        
        with open("debug_log.txt", "a") as f:
            f.write("DEBUG: Calling seed_gamification_badges\n")
        seed_gamification_badges(db)
        
        with open("debug_log.txt", "a") as f:
            f.write("DEBUG: Calling seed_growth_challenges\n")
        seed_growth_challenges(db)
        
        db.commit()
        with open("debug_log.txt", "a") as f:
            f.write("DEBUG: DB Setup Complete\n")
    
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
