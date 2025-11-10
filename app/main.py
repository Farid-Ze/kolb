from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.core.config import settings
from app.db.database import Base, SessionLocal, engine
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.reports import router as reports_router
from app.routers.research import router as research_router
from app.routers.score import router as score_router
from app.routers.sessions import router as sessions_router
from app.routers.teams import router as teams_router
from app.services.seeds import seed_assessment_items, seed_instruments, seed_learning_styles

# Ensure instrument authoring manifest and plugins register on import
import app.instruments.klsi4  # noqa: F401
from app.routers.engine import router as engine_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle.
    
    DDL Strategy:
        Development: create_all() + ad-hoc DDL for convenience (auto-setup on run)
        Production: Use Alembic migrations exclusively (alembic upgrade head)
        
    Rationale:
        - create_all() provides rapid iteration for local dev
        - Ad-hoc DDL creates indexes/views not captured in ORM models
        - Alembic is authoritative source of truth for production schema
        - Both approaches use IF NOT EXISTS/OR REPLACE for idempotency
        
    See: migrations/versions/*.py for production schema changes
    """
    # Startup
    # NOTE: In production, disable create_all() via RUN_STARTUP_DDL=false env var
    # and rely on Alembic migrations only
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_instruments(db)
        seed_learning_styles(db)
        seed_assessment_items(db)
        try:
            db.execute(text(
                """
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'ix_assessment_sessions_completed'
                ) THEN
                    EXECUTE 'CREATE INDEX ix_assessment_sessions_completed ON assessment_sessions (user_id, end_time) WHERE status = ''Completed''';
                END IF;
            END $$;"""
            ))
        except Exception:
            # Non-Postgres atau sudah ada
            if settings.environment != 'prod':
                try:
                    db.execute(text(
                        """
                    CREATE OR REPLACE VIEW v_style_grid AS
                    SELECT s.id AS session_id,
                             s.user_id,
                             cs.ACCE_raw,
                             cs.AERO_raw,
                             CASE
                                 WHEN cs.ACCE_raw <= 5 THEN 'Low'
                                 WHEN cs.ACCE_raw <= 14 THEN 'Mid'
                                 ELSE 'High'
                             END AS acce_band,
                             CASE
                                 WHEN cs.AERO_raw <= 0 THEN 'Low'
                                 WHEN cs.AERO_raw <= 11 THEN 'Mid'
                                 ELSE 'High'
                             END AS aero_band,
                             lst.style_name
                    FROM assessment_sessions s
                        JOIN combination_scores cs ON cs.session_id = s.id
                        LEFT JOIN user_learning_styles uls ON uls.session_id = s.id
                        LEFT JOIN learning_style_types lst ON lst.id = uls.primary_style_type_id;
                    """
                    ))
                except Exception:
                    pass
        db.commit()
    yield
    # Shutdown: nothing

app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Register routers at import time so tests see routes without requiring startup
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(engine_router)
app.include_router(admin_router)
app.include_router(reports_router)
app.include_router(score_router)
app.include_router(teams_router)
app.include_router(research_router)

 

@app.get("/health")
def health():
    return {"status": "ok"}
