from contextlib import asynccontextmanager
from datetime import datetime, timezone
import importlib
from pathlib import Path

from fastapi import Depends, FastAPI, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.formatting import format_decimal
from app.core.logging import configure_logging, get_logger
from app.core.metrics import get_counters, get_metrics
from app.db.database import Base, engine, get_db, transactional_session
from app.i18n import preload_i18n_resources
from app.core.sentinels import UNKNOWN
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.exceptions import register_exception_handlers
from app.routers.reports import router as reports_router
from app.routers.research import router as research_router
from app.routers.score import router as score_router
from app.routers.teams import router as teams_router
from app.routers.telemetry import router as telemetry_router
from app.services.seeds import seed_assessment_items, seed_instruments, seed_learning_styles
from app.engine.registry import engine_registry

# Ensure instrument authoring manifest and plugins register on import
importlib.import_module("app.instruments.klsi4")
from app.routers.engine import router as engine_router


configure_logging(environment=settings.environment)
logger = get_logger("kolb.app.main", component="app")
BASE_DIR = Path(__file__).resolve().parent.parent
GUIDES_STATIC_DIR = BASE_DIR / "docs" / "guides"

# Store application startup time for health endpoint
_app_start_time = datetime.now(timezone.utc)


def _auto_discover_plugins() -> dict[str, object]:
    if not settings.registry_auto_discover_enabled:
        return {"enabled": False, "discovered": 0}
    try:
        discovered = engine_registry.discover_plugins()
        return {
            "enabled": True,
            "discovered": len(discovered),
        }
    except Exception as exc:  # pragma: no cover - defensive guard
        logger.exception("plugin_discovery_failed", extra={"structured_data": {"error": str(exc)}})
        return {
            "enabled": True,
            "discovered": 0,
            "error": str(exc),
        }


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
    if settings.i18n_preload_enabled:
        logger.info("startup_preload_i18n", extra={"structured_data": {"i18n_preload_enabled": True}})
        stats = preload_i18n_resources()
        logger.info(
            "i18n_preload_complete",
            extra={"structured_data": stats}
        )
    discovery_stats = _auto_discover_plugins()
    logger.info("plugin_discovery_complete", extra={"structured_data": discovery_stats})
    yield
    # Shutdown: nothing

app = FastAPI(title=settings.app_name, lifespan=lifespan)
register_exception_handlers(app)

# Register routers at import time so tests see routes without requiring startup
app.include_router(auth_router)
app.include_router(engine_router)
app.include_router(admin_router)
app.include_router(reports_router)
app.include_router(score_router)
app.include_router(teams_router)
app.include_router(research_router)
app.include_router(telemetry_router)

if GUIDES_STATIC_DIR.exists():
    app.mount(
        "/static/guides",
        StaticFiles(directory=str(GUIDES_STATIC_DIR), html=False),
        name="guides-static",
    )
else:  # pragma: no cover - informational log when guides not packaged
    logger.warning(
        "guides_static_dir_missing",
        extra={"structured_data": {"path": str(GUIDES_STATIC_DIR)}}
    )

 

@app.get("/health")
def health(db: Session = Depends(get_db)):
    """Enhanced health endpoint showing application status and metrics.
    
    Checks:
        - Application uptime and version
        - Database connectivity
        - Request metrics summary
        
    Returns:
        - status: Application health status (healthy/degraded/unhealthy)
        - version: Application version from config
        - uptime_seconds: Time since application startup
        - mode: Current environment mode (development/production)
        - total_requests: Aggregate request count from metrics
        - database: Database connectivity status
        
    This endpoint provides observability into the running application state
    and is suitable for load balancer health checks.
    """
    now = datetime.now(timezone.utc)
    uptime = (now - _app_start_time).total_seconds()
    
    # Get aggregate metrics
    counters = get_counters()
    metrics = get_metrics()
    
    # Calculate total requests from counter metrics
    total_requests = sum(
        count for label, count in counters.items()
        if "request" in label.lower() or "session" in label.lower()
    )
    
    # Check database connectivity
    db_status = UNKNOWN
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
        overall_status = "healthy"
    except Exception as e:
        logger.error("health_check_db_failed", extra={"error": str(e)})
        db_status = "disconnected"
        overall_status = "unhealthy"
    return {
        "status": overall_status,
        "version": "1.0.0",  # TODO: Load from package metadata
        "started_at": _app_start_time.isoformat(),
        "uptime_seconds": format_decimal(uptime, decimals=2),
        "environment": settings.environment if hasattr(settings, 'environment') else "development",
        "total_requests": int(total_requests) if total_requests else 0,
        "database": {
            "status": db_status,
            "engine": "postgresql" if "postgresql" in str(settings.database_url) else "sqlite"
        },
        "metrics_summary": {
            "tracked_operations": len(metrics),
            "tracked_counters": len(counters),
        }
    }


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
