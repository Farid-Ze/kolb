from __future__ import annotations

from contextlib import contextmanager
from time import perf_counter
from dataclasses import dataclass
from typing import TYPE_CHECKING, Iterator

from sqlalchemy import Engine, create_engine
from sqlalchemy.engine import make_url, URL
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import logging
from sqlalchemy.pool import QueuePool, StaticPool

from app.core.config import settings

logger = logging.getLogger(__name__)
from app.core.metrics import (
    inc_counter,
    observe_histogram,
    record_last_run,
    metrics_registry,
)

if TYPE_CHECKING:  # pragma: no cover - type checking helpers only
    from app.db.repositories import (
        AssessmentItemRepository,
        InstrumentRepository,
        LFIContextRepository,
        PipelineRepository,
        SessionRepository,
        StyleRepository,
        UserResponseRepository,
        NormativeConversionRepository,
    )


class Base(DeclarativeBase):
    pass

SESSION_DURATION_BUCKETS: tuple[float, ...] = (2.0, 5.0, 10.0, 25.0, 50.0, 100.0)
TRANSACTION_DURATION_BUCKETS: tuple[float, ...] = (
    5.0,
    10.0,
    25.0,
    50.0,
    100.0,
    250.0,
    500.0,
)


@dataclass(frozen=True, slots=True)
class DatabaseGateway:
    """Encapsulates engine and session factory lifecycle."""

    engine: Engine
    session_factory: sessionmaker[Session]

    @contextmanager
    def session(self) -> Iterator[Session]:
        started = perf_counter()
        inc_counter("db.session.opens")
        session: Session = self.session_factory()
        try:
            yield session
        finally:
            elapsed_ms = (perf_counter() - started) * 1000.0
            metrics_registry.record("db.session.duration", elapsed_ms)
            observe_histogram("db.session.duration", elapsed_ms, buckets=SESSION_DURATION_BUCKETS)
            record_last_run("db.session.duration", elapsed_ms)
            inc_counter("db.session.closes")
            session.close()

    @contextmanager
    def transactional(self, *, flush_before_commit: bool = False) -> Iterator[Session]:
        session: Session = self.session_factory()
        started = perf_counter()
        committed = False
        rolled_back = False
        inc_counter("db.transaction.opens")
        try:
            yield session
            if flush_before_commit:
                inc_counter("db.transaction.flushes")
                session.flush()
            session.commit()
            committed = True
            inc_counter("db.transaction.commits")
        except SQLAlchemyError as e:
            session.rollback()
            rolled_back = True
            inc_counter("db.transaction.rollbacks")
            logger.error("transaction_rollback", extra={"error": str(e)})
            raise
        finally:
            elapsed_ms = (perf_counter() - started) * 1000.0
            metrics_registry.record("db.transaction.duration", elapsed_ms)
            observe_histogram(
                "db.transaction.duration",
                elapsed_ms,
                buckets=TRANSACTION_DURATION_BUCKETS,
            )
            record_last_run(
                "db.transaction.duration",
                elapsed_ms,
                metadata={
                    "committed": committed,
                    "rolled_back": rolled_back,
                    "flush": flush_before_commit,
                },
            )
            inc_counter("db.transaction.closes")
            session.close()


# Note: psycopg2 is used for PostgreSQL when DATABASE_URL is set accordingly
# Connection pooling configuration for improved performance
ENGINE_CONFIG_SNAPSHOT: dict[str, object] = {}


def _build_engine() -> Engine:
    url: URL = make_url(settings.database_url)
    kwargs: dict[str, object] = {
        "echo": False,
        "future": True,
    }

    if url.get_backend_name() == "sqlite":
        connect_args: dict[str, object] = {"check_same_thread": False}
        database = url.database or ""
        if database.startswith("file:"):
            connect_args["uri"] = True
        kwargs["connect_args"] = connect_args

        if database in ("", None, ":memory:", "file::memory:"):
            kwargs["poolclass"] = StaticPool
        else:
            kwargs.update(
                {
                    "poolclass": QueuePool,
                    "pool_size": settings.db_pool_size,
                    "max_overflow": settings.db_max_overflow,
                    "pool_timeout": settings.db_pool_timeout,
                    "pool_recycle": settings.db_pool_recycle,
                    "pool_pre_ping": settings.db_pool_pre_ping,
                }
            )
    else:
        kwargs.update(
            {
                "pool_size": settings.db_pool_size,
                "max_overflow": settings.db_max_overflow,
                "pool_timeout": settings.db_pool_timeout,
                "pool_recycle": settings.db_pool_recycle,
                "pool_pre_ping": settings.db_pool_pre_ping,
            }
        )

    engine_instance = create_engine(settings.database_url, **kwargs)
    _set_engine_snapshot(engine_instance, kwargs)
    return engine_instance


def _set_engine_snapshot(engine_instance: Engine, kwargs: dict[str, object]) -> None:
    global ENGINE_CONFIG_SNAPSHOT
    snapshot = {
        "url": str(engine_instance.url),
        "poolclass": getattr(kwargs.get("poolclass"), "__name__", engine_instance.pool.__class__.__name__),
        "connect_args": dict(kwargs.get("connect_args", {})),
        "pool_size": kwargs.get("pool_size"),
        "max_overflow": kwargs.get("max_overflow"),
        "pool_timeout": kwargs.get("pool_timeout"),
        "pool_recycle": kwargs.get("pool_recycle"),
        "pool_pre_ping": kwargs.get("pool_pre_ping"),
    }
    ENGINE_CONFIG_SNAPSHOT = snapshot


engine: Engine = _build_engine()
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


@contextmanager
def norm_session_scope() -> Iterator[Session]:
    """Dedicated pooled session scope for norm-heavy workloads with metrics."""

    session: Session = SessionLocal()
    started = perf_counter()
    inc_counter("db.norm_session.opens")
    try:
        yield session
    finally:
        elapsed_ms = (perf_counter() - started) * 1000.0
        metrics_registry.record("db.norm_session.duration", elapsed_ms)
        observe_histogram(
            "db.norm_session.duration",
            elapsed_ms,
            buckets=SESSION_DURATION_BUCKETS,
        )
        record_last_run("db.norm_session.duration", elapsed_ms)
        inc_counter("db.norm_session.closes")
        session.close()


def get_engine_config_snapshot() -> dict[str, object]:
    return dict(ENGINE_CONFIG_SNAPSHOT)


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
    def norms(self) -> "NormativeConversionRepository":
        from app.db.repositories import NormativeConversionRepository

        return NormativeConversionRepository(self.db)

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
    "norm_session_scope",
    "RepositoryProvider",
    "get_repository_provider",
    "repository_scope",
    "AssessmentRepositoryGroup",
]
