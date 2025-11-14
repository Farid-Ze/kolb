"""Runtime support components extracted from engine runtime.

This module keeps scheduling, timing, and error-reporting helpers decoupled
from the orchestration logic in ``app.engine.runtime``. Separating these
concerns satisfies the TODO requirement to isolate supporting infrastructure
from the core finalize pipeline, making the runtime easier to test and reuse.
"""

from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter
from typing import Any, Callable, Protocol

from sqlalchemy.orm import Session


class SessionRepository(Protocol):
    """Protocol for repositories that expose session retrieval."""

    def get_by_id(self, session_id: int) -> Any:
        ...


class RepositoryProvider(Protocol):
    """Protocol for repository providers produced by database factories."""

    @property
    def sessions(self) -> SessionRepository:
        ...


@dataclass(slots=True)
class RuntimeScheduler:
    """Thin wrapper responsible for resolving sessions via repositories."""

    repo_provider_factory: Callable[[Session], RepositoryProvider]

    def resolve_session(self, db: Session, session_id: int) -> Any:
        repo_provider = self.repo_provider_factory(db)
        repo = repo_provider.sessions
        return repo.get_by_id(session_id)


class RuntimeStateTracker:
    """Tracks elapsed wall clock time for runtime phases."""

    def __init__(self, label: str):
        self.label = label
        self._started = perf_counter()

    def duration_ms(self) -> float:
        return (perf_counter() - self._started) * 1000.0


class RuntimeErrorReporter:
    """Centralizes structured logging for runtime errors."""

    def __init__(self, logger_instance):
        self._logger = logger_instance

    def report(
        self,
        *,
        event: str,
        session_id: int,
        user_id: int | None,
        exc: Exception,
        correlation_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        structured = {
            "session_id": session_id,
            "user_id": user_id,
            "error": str(exc),
            "correlation_id": correlation_id,
        }
        if metadata:
            structured.update(metadata)
        self._logger.exception(event, extra={"structured_data": structured})


__all__ = [
    "RuntimeScheduler",
    "RuntimeStateTracker",
    "RuntimeErrorReporter",
]
