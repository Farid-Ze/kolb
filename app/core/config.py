import os
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "KLSI 4.0 API"
    debug: bool = True
    environment: str = os.getenv("ENV", "dev")
    database_url: str = os.getenv("DATABASE_URL", "sqlite+pysqlite:///./klsi.db")
    jwt_secret_key: str = Field(default_factory=lambda: _require_env("JWT_SECRET_KEY"), description="JWT secret key; must be provided via environment JWT_SECRET_KEY")
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = os.getenv("JWT_ISSUER", "klsi-api")
    jwt_audience: str = os.getenv("JWT_AUDIENCE", "klsi-users")
    access_token_expire_minutes: int = 60
    allowed_student_domain: str = "mahasiswa.unikom.ac.id"
    audit_salt: str = os.getenv("AUDIT_SALT", "klsi-default-salt")
    # Startup behavior toggles (prefer Alembic in production)
    run_startup_seed: bool = bool(int(os.getenv("RUN_STARTUP_SEED", "1")))
    run_startup_ddl: bool = bool(int(os.getenv("RUN_STARTUP_DDL", "1")))

    # External norm provider configuration
    external_norms_enabled: bool = bool(int(os.getenv("EXTERNAL_NORMS_ENABLED", "0")))
    external_norms_base_url: str = os.getenv("EXTERNAL_NORMS_BASE_URL", "")
    external_norms_timeout_ms: int = int(os.getenv("EXTERNAL_NORMS_TIMEOUT_MS", "1500"))
    external_norms_api_key: str | None = os.getenv("EXTERNAL_NORMS_API_KEY") or None
    external_norms_cache_size: int = int(os.getenv("EXTERNAL_NORMS_CACHE_SIZE", "512"))
    external_norms_ttl_sec: int = int(os.getenv("EXTERNAL_NORMS_TTL_SEC", "60"))

    # Norm DB adaptive preload
    # When enabled, if the normative_conversion_table row count is below the threshold,
    # the norms are preloaded into an in-memory map for O(1) lookups (avoids per-lookup SQL).
    norms_preload_enabled: bool = bool(int(os.getenv("NORMS_PRELOAD_ENABLED", "1")))
    # If total rows <= threshold, preload will be activated. Keep conservative by default.
    norms_preload_row_threshold: int = int(os.getenv("NORMS_PRELOAD_ROW_THRESHOLD", "200000"))
    # Safety limit on maximum entries to load into memory (protect low-RAM envs)
    norms_preload_max_entries: int = int(os.getenv("NORMS_PRELOAD_MAX_ENTRIES", "400000"))

    # API compatibility toggles
    # When set to 1, legacy per-item/context submission endpoints return HTTP 410
    disable_legacy_submission: bool = bool(int(os.getenv("DISABLE_LEGACY_SUBMISSION", "0")))
    # When set to 1, legacy sessions router is not registered (except in dev/test)
    disable_legacy_router: bool = bool(int(os.getenv("DISABLE_LEGACY_ROUTER", "0")))
    # Optional RFC 8594 Sunset date-time string for deprecated endpoints, e.g., "2026-01-31T00:00:00Z"
    legacy_sunset: str | None = os.getenv("LEGACY_SUNSET") or None

    # Pydantic v2 config via ConfigDict
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8"
    }


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()