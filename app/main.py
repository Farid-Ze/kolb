from contextlib import asynccontextmanager

from fastapi import FastAPI, Response
from sqlalchemy import text

from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.db.database import Base, engine, transactional_session
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.reports import router as reports_router
from app.routers.research import router as research_router
from app.routers.score import router as score_router
from app.routers.teams import router as teams_router
from app.services.seeds import seed_assessment_items, seed_instruments, seed_learning_styles

# Ensure instrument authoring manifest and plugins register on import
import app.instruments.klsi4  # noqa: F401
from app.routers.engine import router as engine_router


configure_logging()
logger = get_logger("kolb.app.main", component="app")


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
    if settings.run_startup_ddl:
        logger.info("startup_execute_ddl", extra={"structured_data": {"run_startup_ddl": True}})
        Base.metadata.create_all(bind=engine)
    if settings.run_startup_seed:
        logger.info("startup_seed_data", extra={"structured_data": {"run_startup_seed": True}})
        with transactional_session() as db:
            seed_instruments(db)
            seed_learning_styles(db)
            seed_assessment_items(db)
    yield
    # Shutdown: nothing

app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Register routers at import time so tests see routes without requiring startup
app.include_router(auth_router)
app.include_router(engine_router)
app.include_router(admin_router)
app.include_router(reports_router)
app.include_router(score_router)
app.include_router(teams_router)
app.include_router(research_router)

 

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
def root():
    """Lightweight index to avoid 404s and point to docs."""
    return {
        "name": settings.app_name,
        "status": "ok",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    """Empty favicon to prevent 404 noise in logs."""
    return Response(status_code=204)
