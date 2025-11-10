import os
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "KLSI 4.0 API"
    debug: bool = True
    environment: str = os.getenv("ENV", "dev")
    database_url: str = os.getenv("DATABASE_URL", "sqlite+pysqlite:///./klsi.db")
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-me")
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = os.getenv("JWT_ISSUER", "klsi-api")
    jwt_audience: str = os.getenv("JWT_AUDIENCE", "klsi-users")
    access_token_expire_minutes: int = 60
    allowed_student_domain: str = "mahasiswa.unikom.ac.id"

    # Pydantic v2 config via ConfigDict
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8"
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()