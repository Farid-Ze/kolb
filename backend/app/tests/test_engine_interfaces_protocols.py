"""Tests for runtime-checkable engine protocols."""

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.engine.interfaces import (
    EngineNormProvider,
    EngineReportBuilder,
    EngineScorer,
    InstrumentPlugin,
    NormRepository,
    ScoringStep,
)


class _MockScoringStep:
    name = "mock_step"
    depends_on: List[str] = []

    def run(self, db: Session, session_id: int, ctx: Dict[str, Any]) -> None:  # pragma: no cover - structure only
        ctx["called"] = True


class _MockNormRepo:
    def percentile(self, group_chain: List[str], scale: str, raw: int | float):
        return 75.0, "TEST", False


class _MockInstrumentPlugin:
    def id(self):
        return None

    def delivery(self):  # pragma: no cover - structure only
        return None

    def fetch_items(self, db: Session, session_id: int):
        return []

    def validate_submit(self, db: Session, session_id: int, payload: Dict[str, Any]) -> None:
        return None


class _MockScorer:
    def finalize(self, db: Session, session_id: int, *, skip_checks: bool = False):  # pragma: no cover
        return {"ok": True}


class _MockNormProvider:
    def percentile(self, db: Session, session_id: int, scale: str, raw: int | float):  # pragma: no cover
        return 50.0, "MOCK"


class _MockReportBuilder:
    def build(self, db: Session, session_id: int, viewer_role: Optional[str] = None):  # pragma: no cover
        return {"report": True}


def test_engine_protocols_are_runtime_checkable():
    step = _MockScoringStep()
    norm_repo = _MockNormRepo()
    plugin = _MockInstrumentPlugin()
    scorer = _MockScorer()
    norm_provider = _MockNormProvider()
    report_builder = _MockReportBuilder()

    assert isinstance(step, ScoringStep)
    assert isinstance(norm_repo, NormRepository)
    assert isinstance(plugin, InstrumentPlugin)
    assert isinstance(scorer, EngineScorer)
    assert isinstance(norm_provider, EngineNormProvider)
    assert isinstance(report_builder, EngineReportBuilder)
