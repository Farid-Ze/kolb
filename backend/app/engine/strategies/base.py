from typing import Any, Dict, Protocol
from uuid import UUID

from sqlalchemy.orm import Session


class ScoringStrategy(Protocol):
    """Protocol for instrument-specific scoring strategies."""

    code: str

    def finalize(self, db: Session, session_id: UUID) -> Dict[str, Any]: ...
