import os
from datetime import datetime
from functools import lru_cache
from typing import Literal, Optional, cast

from pydantic import Field, HttpUrl, computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _load_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


class Settings(BaseSettings):
    """Strongly typed configuration sourced from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = Field(default="KLSI 4.0 API")
    environment: Literal["dev", "test", "staging", "prod"] = Field(default="dev")
    debug: bool = Field(default=False)
    database_url: str = Field(default="sqlite+pysqlite:///./klsi.db")

    jwt_secret_key: str = Field(default_factory=lambda: _load_required_env("JWT_SECRET_KEY"), min_length=8, description="Symmetric key for HS256 JWT signing")
    jwt_algorithm: Literal["HS256"] = Field(default="HS256")
    jwt_issuer: str = Field(default="klsi-api")
    jwt_audience: str = Field(default="klsi-users")
    access_token_expire_minutes: int = Field(default=60, ge=1)

    allowed_student_domain: str = Field(default="mahasiswa.unikom.ac.id")
    audit_salt: str = Field(default="klsi-default-salt")

    run_startup_seed: bool = Field(default=True)
    run_startup_ddl: bool = Field(default=True)

    external_norms_enabled: bool = Field(default=False)
    external_norms_base_url: Optional[HttpUrl] = Field(default=None)
    external_norms_timeout_ms: int = Field(default=1500, ge=1)
    external_norms_api_key: Optional[str] = Field(default=None)
    external_norms_cache_size: int = Field(default=512, ge=0)
    external_norms_ttl_sec: int = Field(default=60, ge=1)

    norms_preload_enabled: bool = Field(default=True)
    norms_preload_row_threshold: int = Field(default=200_000, ge=0)
    norms_preload_max_entries: int = Field(default=400_000, ge=0)
    cached_norm_provider_enabled: bool = Field(default=True)

    disable_legacy_submission: bool = Field(default=False)
    disable_legacy_router: bool = Field(default=False)
    legacy_sunset: Optional[datetime] = Field(default=None)

    mode: Literal["development", "testing", "staging", "production"] = Field(default="development")

    @field_validator("legacy_sunset")
    @classmethod
    def _normalize_legacy_sunset(cls, value: Optional[str | datetime]) -> Optional[datetime]:
        if value in (None, "", b""):
            return None
        if isinstance(value, datetime):
            return value
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:  # pragma: no cover - defensive parsing
            raise ValueError(
                "LEGACY_SUNSET must be an ISO 8601 timestamp, e.g. 2026-01-31T00:00:00Z"
            ) from exc

    @field_validator("external_norms_base_url")
    @classmethod
    def _normalize_blank_url(cls, value: Optional[HttpUrl | str]) -> Optional[HttpUrl]:
        if value in (None, "", b""):
            return None
        return cast(HttpUrl, value)

    @computed_field
    @property
    def is_production(self) -> bool:
        return self.environment == "prod"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
