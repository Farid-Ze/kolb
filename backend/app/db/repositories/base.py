from dataclasses import dataclass
from typing import Generic, TypeVar, Union

from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession


TSession = TypeVar("TSession", bound=Union[Session, AsyncSession])


@dataclass
class Repository(Generic[TSession]):
    """Lightweight base repository exposing a SQLAlchemy session."""

    db: TSession

    @property
    def session(self) -> TSession:
        """Expose the underlying SQLAlchemy session for advanced use cases."""
        return self.db
