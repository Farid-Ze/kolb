from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    app_name: str = "KLSI 4.0 API"
    debug: bool = True
    environment: str = os.getenv("ENV", "dev")
    database_url: str = os.getenv("DATABASE_URL", "sqlite+pysqlite:///./klsi.db")
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-me")
    jwt_algorithm: str = "HS256"
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