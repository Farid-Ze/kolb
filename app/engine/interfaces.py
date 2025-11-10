from __future__ import annotations

from typing import Any, Dict, List, Optional, Protocol

from sqlalchemy.orm import Session


class ScoringContext(dict):
    """Mutable state container passed across scoring steps."""


class ScoringStep(Protocol):
    """Executable node that performs a deterministic scoring transformation."""

    name: str
    depends_on: List[str]

    def run(self, db: Session, session_id: int, ctx: ScoringContext) -> None:
        """Execute the step and mutate *ctx* or persist database rows."""


class NormRepository(Protocol):
    """Lookup interface for normative conversions."""

    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> tuple[Optional[float], str, bool]:
        """Return (percentile, provenance, was_truncated)."""


class AssessmentDefinition(Protocol):
    """Declarative description of an assessment pipeline."""

    id: str
    version: str
    item_count: int
    context_count: int
    steps: List[ScoringStep]

    def validation_rules(self) -> List["ValidationRule"]:
        ...

    def norm_scales(self) -> List[str]:
        ...

    def report_composer(self) -> "ReportComposer":
        ...


class ValidationIssue:
    """Outcome of executing a validation rule."""

    def __init__(self, code: str, message: str, fatal: bool = False) -> None:
        self.code = code
        self.message = message
        self.fatal = fatal

    def as_dict(self) -> Dict[str, Any]:
        return {"code": self.code, "message": self.message, "fatal": self.fatal}


class ValidationRule(Protocol):
    code: str

    def validate(self, db: Session, session_id: int) -> List[ValidationIssue]:
        ...


class ReportComposer(Protocol):
    def build(
        self, db: Session, session_id: int, viewer_role: Optional[str], locale: str = "id"
    ) -> Dict[str, Any]:
        ...
