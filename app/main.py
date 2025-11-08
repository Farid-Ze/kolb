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
from app.services.seeds import seed_learning_styles, seed_placeholder_items


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_learning_styles(db)
        seed_placeholder_items(db)
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
app.include_router(admin_router)
app.include_router(reports_router)
app.include_router(score_router)
app.include_router(teams_router)
app.include_router(research_router)

 

@app.get("/health")
def health():
    return {"status": "ok"}
