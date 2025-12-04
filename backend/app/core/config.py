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

    @field_validator("jwt_secret_key")
    @classmethod
    def validate_secret_key(cls, v: str, info: Any) -> str:
        if info.data.get("environment") == "production" and v == "unsafe-secret-key-change-me":
            raise ValueError("Production environment must set a secure JWT_SECRET_KEY")
        return v

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]], info: Any) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        
        # [Security Fix] Insecure defaults only allowed in non-production
        if info.data.get("environment") != "production":
            return ["http://localhost:5173", "http://localhost:5174"]
            
        return []

    # Feature Flags
    run_startup_ddl: bool = True
    run_startup_seed: bool = False
    cache_enabled: bool = False
    redis_url: str = "redis://localhost:6379/0"
    
    # App Specific
    allowed_student_domain: str = "student.university.ac.id"
    runtime_components_enabled: bool = True
    engine_authoring_items_enabled: bool = False
    registry_auto_discover_enabled: bool = True
    i18n_preload_enabled: bool = True
    
    # Legacy Support
    disable_legacy_submission: bool = False
    disable_legacy_router: bool = False
    legacy_sunset: Any = None
    
    # Norms
    external_norms_enabled: bool = False
    external_norms_base_url: str = ""
    external_norms_api_key: str = ""
    external_norms_timeout_ms: int = 1500
    external_norms_ttl_sec: int = 300
    external_norms_cache_size: int = 100
    norm_percentile_cache_size: int = 8192
    norms_preload_enabled: bool = True
    norms_lazy_loader_enabled: bool = True
    norms_lazy_loader_chunk_size: int = 100
    norms_lazy_loader_cache_entries: int = 1024
    norms_preload_row_threshold: int = 1000
    norms_preload_max_entries: int = 10000
    
    # Audit
    audit_salt: str = "change-me-in-production"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


settings = Settings()
print(f"DEBUG: Loaded settings.backend_cors_origins: {settings.backend_cors_origins}")
