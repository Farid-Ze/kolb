from __future__ import annotations

from typing import Any, Dict, Protocol

from sqlalchemy.orm import Session


class ScoringStrategy(Protocol):
    """Protocol for instrument-specific scoring strategies."""

    code: str

    def finalize(self, db: Session, session_id: int) -> Dict[str, Any]: ...
