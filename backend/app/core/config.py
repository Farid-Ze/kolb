from typing import Any, List, Union

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Zenotika Assessment Engine"
    environment: str = "development"
    debug: bool = True
    
    # Database
    database_url: str = "sqlite:///./sql_app.db"
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800
    db_pool_pre_ping: bool = True
    
    # Security
    jwt_secret_key: str = "unsafe-secret-key-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    jwt_issuer: str = "zenotika"
    jwt_audience: str = "zenotika-client"
    
    # [Security Fix] CORS Configuration
    # Strict validation ensures comma-separated strings are parsed into lists
    backend_cors_origins: List[str] = []

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Feature Flags
    run_startup_ddl: bool = True
    run_startup_seed: bool = False
    cache_enabled: bool = False
    redis_url: str = "redis://localhost:6379/0"
    
    # App Specific
    allowed_student_domain: str = "student.university.ac.id"
    runtime_components_enabled: bool = True
    registry_auto_discover_enabled: bool = True
    i18n_preload_enabled: bool = True
    
    # Legacy Support
    disable_legacy_submission: bool = False
    disable_legacy_router: bool = False
    legacy_sunset: Any = None
    
    # Norms
    external_norms_enabled: bool = False
    external_norms_base_url: str = ""
    norm_percentile_cache_size: int = 8192

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


settings = Settings()
