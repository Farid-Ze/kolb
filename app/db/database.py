from contextlib import contextmanager
from dataclasses import dataclass
from typing import TYPE_CHECKING, Callable, Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

if TYPE_CHECKING:  # pragma: no cover - type checking helpers only
    from app.db.repositories import (
        AssessmentItemRepository,
        InstrumentRepository,
        LFIContextRepository,
        PipelineRepository,
        SessionRepository,
        StyleRepository,
        UserResponseRepository,
    )


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


@contextmanager
def transactional_session() -> Iterator[Session]:
    """Context manager that manages commit/rollback for explicit transactions."""
    db: Session = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@contextmanager
def hyperatomic_session() -> Iterator[Session]:
    """Stricter transactional scope that prevents nested commits by callers."""

    db: Session = SessionLocal()
    try:
        yield db
        db.flush()
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@dataclass(frozen=True, slots=True)
class AssessmentRepositoryGroup:
    items: "AssessmentItemRepository"
    responses: "UserResponseRepository"
    lfi_contexts: "LFIContextRepository"


@dataclass(slots=True)
class RepositoryProvider:
    """Factory for repository instances bound to a specific session."""

    db: Session

    @property
    def sessions(self) -> "SessionRepository":
        from app.db.repositories import SessionRepository

        return SessionRepository(self.db)

    @property
    def instruments(self) -> "InstrumentRepository":
        from app.db.repositories import InstrumentRepository

        return InstrumentRepository(self.db)

    @property
    def pipelines(self) -> "PipelineRepository":
        from app.db.repositories import PipelineRepository

        return PipelineRepository(self.db)

    @property
    def styles(self) -> "StyleRepository":
        from app.db.repositories import StyleRepository

        return StyleRepository(self.db)

    @property
    def assessments(self) -> AssessmentRepositoryGroup:
        from app.db.repositories import AssessmentItemRepository, UserResponseRepository, LFIContextRepository

        return AssessmentRepositoryGroup(
            items=AssessmentItemRepository(self.db),
            responses=UserResponseRepository(self.db),
            lfi_contexts=LFIContextRepository(self.db),
        )


def get_repository_provider(db: Session) -> RepositoryProvider:
    """Helper to bind repository provider to an existing session."""

    return RepositoryProvider(db)


@contextmanager
def repository_scope() -> Iterator[RepositoryProvider]:
    """Yield a repository provider within an automatic transactional boundary."""

    with hyperatomic_session() as db:
        yield RepositoryProvider(db)
