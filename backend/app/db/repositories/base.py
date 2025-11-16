from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeVar

from sqlalchemy.orm import Session


TSession = TypeVar("TSession", bound=Session)


@dataclass
class Repository(Generic[TSession]):
    """Lightweight base repository exposing a SQLAlchemy session."""

    db: TSession

    @property
    def session(self) -> TSession:
        """Expose the underlying SQLAlchemy session for advanced use cases."""
        return self.db
