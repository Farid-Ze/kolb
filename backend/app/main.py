from contextlib import asynccontextmanager
from datetime import datetime, timezone
import importlib
from pathlib import Path
from typing import Any, Callable

from fastapi import APIRouter, Depends, FastAPI, Response, Request
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.utils import get_openapi
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.formatting import format_decimal
from app.core.logging import configure_logging, get_logger, configure_provenance_logging
from app.core.metrics import get_counters, get_metrics
from app.db.database import Base, engine, get_db, transactional_session
from app.i18n import preload_i18n_resources
from app.core.sentinels import UNKNOWN
from app.routers.admin import router as admin_router
from app.routers.assessments import router as assessments_router
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.exceptions import register_exception_handlers
from app.routers.reports import router as reports_router
from app.routers.results import router as results_router
from app.routers.research import router as research_router
from app.routers.score import router as score_router
from app.routers.sessions import router as sessions_router
from app.routers.teams import router as teams_router
from app.routers.telemetry import router as telemetry_router
from app.routers.sphere import router as sphere_router
from app.routers.challenges import router as challenges_router
from app.routers.grants import router as grants_router

from app.engine.registry import engine_registry

from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.routers.engine import router as engine_router
from app.core.rate_limit import limiter


configure_logging(environment=settings.environment)
configure_provenance_logging()
logger = get_logger("kolb.app.main", component="app")
BASE_DIR = Path(__file__).resolve().parent.parent
GUIDES_STATIC_DIR = BASE_DIR / "docs" / "guides"

# Store application startup time for health endpoint
_app_start_time = datetime.now(timezone.utc)


def custom_openapi():
    """
    Custom OpenAPI schema with proper security schemes.
    
    Implements OpenAPI 3.1.0 standard for Bearer authentication
    instead of manual authorization headers.
    """
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.app_name,
        version="4.0.0",
        description="Assessment engine and analytics API for KLSI 4.0",
        routes=app.routes,
    )
    
    # Add security schemes (OpenAPI 3.1.0 standard)
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}
    
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT token obtained from /auth/login or /auth/register",
            "flows": {
                "clientCredentials": {
                    "tokenUrl": "/api/v1/auth/token",
                    "scopes": {
                        "assessment:write": "Take assessments",
                        "report:read": "View reports",
                        "admin:all": "Full administrative access",
                        "research:read": "Access research data"
                    }
                }
            }
        }
    }
    
    # Apply global security (can be overridden per-endpoint with security=[])
    openapi_schema["security"] = [{"BearerAuth": []}]
    
    # Fix nullable fields for OpenAPI 3.1.0 (DX improvement)
    # Replace verbose anyOf: [{type: string}, {type: null}] with type: [string, null]
    # Fix nullable fields for OpenAPI 3.1.0 (DX improvement)
    # Replace verbose anyOf: [{type: string}, {type: null}] with type: [string, null]
    def _fix_nullables(schema: Any):
        if isinstance(schema, dict):
            if "anyOf" in schema:
                any_of = schema["anyOf"]
                if len(any_of) == 2:
                    types = [t.get("type") for t in any_of if isinstance(t, dict) and "type" in t]
                    # Handle $ref + null case
                    refs = [t.get("$ref") for t in any_of if isinstance(t, dict) and "$ref" in t]
                    
                    if "null" in types and len(types) == 2:
                        # Case 1: type: [string, null]
                        other_type = next(t for t in types if t != "null")
                        schema.pop("anyOf")
                        schema["type"] = [other_type, "null"]
                    elif "null" in types and len(refs) == 1:
                        # Case 2: anyOf: [{$ref: ...}, {type: null}] -> oneOf with nullable? 
                        # OpenAPI 3.1 allows type: ["object", "null"] but $ref is tricky.
                        # Actually, for 3.1 we can just leave it as anyOf if it involves $ref, 
                        # OR we can try to use standard nullable if supported.
                        # But the user specifically asked for `type: ["T", "null"]`.
                        # If T is a ref, we can't do type: [$ref, "null"].
                        # So we only fix primitive types.
                        pass
            
            for key, value in schema.items():
                _fix_nullables(value)
        elif isinstance(schema, list):
            for item in schema:
                _fix_nullables(item)

    _fix_nullables(openapi_schema)

    app.openapi_schema = openapi_schema
    return app.openapi_schema


def _register_explicit_plugins() -> None:
    """Explicitly register known instrument plugins to avoid implicit side-effects."""
    # KLSI 4.0
    importlib.import_module("app.instruments.klsi4")


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
    _register_explicit_plugins()

    # NOTE: In production, disable create_all() via RUN_STARTUP_DDL=false env var
    # and rely on Alembic migrations only
    if settings.run_startup_ddl:
        logger.info("startup_execute_ddl", extra={"structured_data": {"run_startup_ddl": True}})
        # Base.metadata.create_all(bind=engine)  # Removed per 2025 standards - use Alembic
    print("DEBUG: Executing lifespan")
    if settings.run_startup_seed:
        from app.services.seeds import (
            seed_instruments_v2,
            seed_learning_styles,
            seed_assessment_items,
            seed_engine_authoring,
            seed_gamification_badges,
            seed_growth_challenges,
        )
        logger.info("startup_seed_data", extra={"structured_data": {"run_startup_seed": True}})
        with transactional_session() as db:
            seed_instruments_v2(db)
            seed_learning_styles(db)
            seed_assessment_items(db)
            seed_engine_authoring(db)
            seed_gamification_badges(db)
            seed_growth_challenges(db)
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

print("DEBUG: Creating FastAPI app instance")
app = FastAPI(title="DEBUG APP", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.openapi = custom_openapi
register_exception_handlers(app)

import sys

# [Zenotika V4] Security: CORS Configuration
# Explicitly allow frontend origin to prevent unauthorized cross-origin requests
logger.info(f"DEBUG: Enabling CORS for origins: {settings.backend_cors_origins}")
# Force explicit list for debugging
origins = ["http://localhost:5174", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # allow_origin_regex='.*', # Try this if specific origins fail
)

@app.get("/crash-route")
def crash_route():
    raise RuntimeError("CRASH ROUTE HIT")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.warning(f"DEBUG: Request: {request.method} {request.url}")
    logger.warning(f"DEBUG: Headers: {request.headers}")
    if "crash" in str(request.url):
        raise RuntimeError("CRASH TEST MIDDLEWARE RUNNING")
    response = await call_next(request)
    logger.warning(f"DEBUG: Response status: {response.status_code}")
    return response

@app.options("/api/v1/auth/register")
async def options_register():
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "http://localhost:5174",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    })

# Register routers at import time so tests see routes without requiring startup
# Create v1 router
api_v1_router = APIRouter(prefix="/api/v1")

# Register routers at import time so tests see routes without requiring startup
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(assessments_router)
api_v1_router.include_router(sessions_router)
api_v1_router.include_router(engine_router, include_in_schema=False)  # Internal/Legacy
api_v1_router.include_router(admin_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(results_router)
api_v1_router.include_router(score_router)
api_v1_router.include_router(teams_router)
api_v1_router.include_router(research_router)
api_v1_router.include_router(telemetry_router)
api_v1_router.include_router(sphere_router)
api_v1_router.include_router(challenges_router)
api_v1_router.include_router(grants_router)

app.include_router(api_v1_router)

# [Legacy/Test Support] Mount routers at root for backward compatibility/tests
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(assessments_router)
app.include_router(sessions_router)
app.include_router(engine_router, include_in_schema=False)
app.include_router(admin_router)
app.include_router(reports_router)
app.include_router(results_router)
app.include_router(score_router)
app.include_router(teams_router)
app.include_router(research_router)
app.include_router(telemetry_router)
app.include_router(sphere_router)
app.include_router(challenges_router)
app.include_router(grants_router)

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

# Trigger reload
# Force reload for E2E fix
