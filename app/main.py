from fastapi import FastAPI
from app.core.config import settings
from app.db.database import Base, engine, SessionLocal
from app.routers.sessions import router as sessions_router
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.reports import router as reports_router
from app.routers.score import router as score_router
from app.routers.teams import router as teams_router
from app.routers.research import router as research_router
from app.services.seeds import seed_learning_styles, seed_placeholder_items
from sqlalchemy import text

app = FastAPI(title=settings.app_name)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    app.include_router(auth_router)
    app.include_router(sessions_router)
    app.include_router(admin_router)
    app.include_router(reports_router)
    app.include_router(score_router)
    app.include_router(teams_router)
    app.include_router(research_router)
    # seed minimal reference data
    with SessionLocal() as db:
        seed_learning_styles(db)
        seed_placeholder_items(db)
        # ─────────────────────────────────────────────────────────────
        # Create partial index for completed sessions (PostgreSQL only)
        # and style grid view for reporting convenience.
        # Safe to run each startup (IF NOT EXISTS semantics where possible).
        # ─────────────────────────────────────────────────────────────
        try:
            db.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'ix_assessment_sessions_completed'
                ) THEN
                    EXECUTE 'CREATE INDEX ix_assessment_sessions_completed ON assessment_sessions (user_id, end_time) WHERE status = ''Completed''';
                END IF;
            END $$;"""))
        except Exception:
            pass  # Non-Postgres atau sudah ada
            # Create or replace view v_style_grid — only on non-prod to avoid silent override
            if settings.environment != 'prod':
                try:
                    db.execute(text("""
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
                    """))
                except Exception:
                    pass
        db.commit()

@app.get("/health")
def health():
    return {"status": "ok"}
