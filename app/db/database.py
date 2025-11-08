from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings


class Base(DeclarativeBase):
    pass


# Note: psycopg2 is used for PostgreSQL when DATABASE_URL is set accordingly
engine = create_engine(settings.database_url, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
