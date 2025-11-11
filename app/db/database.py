from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from typing import TYPE_CHECKING, Iterator

from sqlalchemy import Engine, create_engine
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



@dataclass(frozen=True, slots=True)
class DatabaseGateway:
    """Encapsulates engine and session factory lifecycle."""

    engine: Engine
    session_factory: sessionmaker[Session]

    @contextmanager
    def session(self) -> Iterator[Session]:
        session: Session = self.session_factory()
        try:
            yield session
        finally:
            session.close()

    @contextmanager
    def transactional(self, *, flush_before_commit: bool = False) -> Iterator[Session]:
        session: Session = self.session_factory()
        try:
            yield session
            if flush_before_commit:
                session.flush()
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()


# Note: psycopg2 is used for PostgreSQL when DATABASE_URL is set accordingly
engine: Engine = create_engine(settings.database_url, echo=False, future=True)
SessionLocal: sessionmaker[Session] = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
database_gateway = DatabaseGateway(engine=engine, session_factory=SessionLocal)


def get_db():
    with database_gateway.session() as session:
        yield session


@contextmanager
def transactional_session() -> Iterator[Session]:
    """Context manager that manages commit/rollback for explicit transactions."""

    with database_gateway.transactional() as session:
        yield session


@contextmanager
def hyperatomic_session() -> Iterator[Session]:
    """Stricter transactional scope that prevents nested commits by callers."""

    with database_gateway.transactional(flush_before_commit=True) as session:
        yield session


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


__all__ = [
    "Base",
    "database_gateway",
    "engine",
    "SessionLocal",
    "get_db",
    "transactional_session",
    "hyperatomic_session",
    "RepositoryProvider",
    "get_repository_provider",
    "repository_scope",
    "AssessmentRepositoryGroup",
]
