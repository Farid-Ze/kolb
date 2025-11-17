from __future__ import annotations

import json

import pytest

import app.engine.registry as assessment_registry
import app.engine.strategy_registry as strategy_registry
from app.assessments.klsi_v4.definition import KLSIAssessmentDefinition  # noqa: F401 ensures registration

from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.instrument import Instrument
from app.models.klsi.learning import ScaleProvenance
from app.models.klsi.user import User

from app.engine.strategies.klsi4 import KLSI4Strategy
from app.engine.runtime import EngineRuntime
from app.services.scoring import finalize_session
from app.db.repositories.pipeline import PipelineRepository
from app.i18n.id_messages import EngineMessages
from app.tests.helpers import build_seeded_memory_db, seed_complete_session


def test_klsi_definition_dependency_graph_matches_expected_flow():
    definition = KLSIAssessmentDefinition()
    step_names = [step.name for step in definition.steps]
    assert step_names == [
        "raw_modes",
        "combination",
        "style",
        "lfi",
        "percentiles",
        "delta",
    ]
    deps = {step.name: list(step.depends_on) for step in definition.steps}
    assert deps["percentiles"] == ["raw_modes", "combination", "style"]
    assert deps["delta"] == ["combination", "style", "lfi"]


def test_finalize_records_truncation_and_artifacts():
    db = build_seeded_memory_db()
    try:
        session = seed_complete_session(db)

        result = finalize_session(db, session.id)
        assert result["ok"] is True

        percentile_entity = result["percentiles"]
        assert percentile_entity.raw_outside_norm_range is True
        assert "CE" in percentile_entity.truncated_scales
        assert percentile_entity.truncated_scales["CE"]["raw"] == 48

        artifacts = result["artifacts"]["percentiles"]
        assert artifacts["raw_outside_norm_range"] is True
        assert "CE" in artifacts["truncated"]
        assert artifacts["truncated"]["CE"]["raw"] == 48
        assert artifacts["norm_group_used"] == "Appendix:Fallback"
        balance = artifacts["balance"]
        assert balance["heuristic"] is True
        assert balance["kind"] == "heuristic_distance"
        assert balance["pseudo_percentiles"]["ACCE"] is not None
        assert artifacts["per_scale_sources"]["CE"].startswith("Appendix")

        scale_rows = (
            db.query(ScaleProvenance)
            .filter(ScaleProvenance.session_id == session.id)
            .order_by(ScaleProvenance.scale_code.asc())
            .all()
        )
        assert len(scale_rows) == 6
        ce_row = next(row for row in scale_rows if row.scale_code == "CE")
        assert ce_row.truncated is True
        assert ce_row.provenance_tag == "Appendix:CE"
        assert ce_row.source_kind == "appendix"
        assert ce_row.norm_group == "CE"
    finally:
        db.close()


def test_finalize_delegates_to_registered_strategy():
    db = build_seeded_memory_db()
    original_strategy = strategy_registry._STRATEGIES.get("KLSI4.0")
    try:
        session = seed_complete_session(db)

        # Ensure there is an active pipeline with nodes so that the
        # declarative resolver path in finalize_assessment is exercised.
        pipeline_repo = PipelineRepository(db)
        instrument = (
            db.query(Instrument)
            .filter(Instrument.code == "KLSI", Instrument.version == "4.0")
            .first()
        )
        assert instrument is not None
        pipelines = pipeline_repo.list_with_nodes(instrument.id)
        assert pipelines, "Expected at least one pipeline for KLSI instrument"

        class TrackingStrategy(KLSI4Strategy):
            def __init__(self) -> None:
                super().__init__()
                self.invoked = False

            def finalize(self, db, session_id):  # type: ignore[override]
                self.invoked = True
                return super().finalize(db, session_id)

        strategy_registry._STRATEGIES.pop("KLSI4.0", None)
        tracker = TrackingStrategy()
        strategy_registry.register_strategy(tracker)

        result = finalize_session(db, session.id)
        assert result["ok"] is True
        assert tracker.invoked is True

    finally:
        if original_strategy is not None:
            strategy_registry._STRATEGIES["KLSI4.0"] = original_strategy
        else:
            strategy_registry._STRATEGIES.pop("KLSI4.0", None)
        db.close()


def test_finalize_falls_back_to_definition_steps_when_strategy_missing():
    db = build_seeded_memory_db()
    alt_key = "ALT:1.0"
    original_definition = assessment_registry._registry.get(alt_key)
    try:
        instrument = Instrument(
            code="ALT",
            name="Alt Assessment",
            version="1.0",
            default_strategy_code=None,
            description=None,
            is_active=True,
        )
        db.add(instrument)
        db.flush()

        class AltAssessmentDefinition(KLSIAssessmentDefinition):
            id = "ALT"
            version = "1.0"

        assessment_registry.register(AltAssessmentDefinition())

        session = seed_complete_session(
            db,
            assessment_id="ALT",
            assessment_version="1.0",
        )
        session.instrument_id = instrument.id
        db.flush()

        assert "ALT1.0" not in strategy_registry._STRATEGIES

        result = finalize_session(db, session.id)
        assert result["ok"] is True
        artifacts = result["artifacts"]
        assert artifacts["raw_modes"]["CE"] == 48
        assert artifacts["percentiles"]["norm_group_used"] == "Appendix:Fallback"

    finally:
        if original_definition is not None:
            assessment_registry._registry[alt_key] = original_definition
        else:
            assessment_registry._registry.pop(alt_key, None)
        db.close()


def test_finalize_assigns_pipeline_version():
    db = build_seeded_memory_db()
    try:
        session = seed_complete_session(db)
        session.pipeline_version = None
        db.flush()

        result = finalize_session(db, session.id)
        assert result["ok"] is True

        refetched = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.id == session.id)
            .first()
        )
        assert refetched is not None
        assert refetched.pipeline_version == "KLSI4.0:v1"
    finally:
        db.close()


def test_finalize_sets_pipeline_warning_when_pipeline_has_no_nodes(monkeypatch):
    db = build_seeded_memory_db()
    try:
        session = seed_complete_session(db)

        class DummyPipeline:
            id = 1
            nodes = []

        class DummyRepo(PipelineRepository):
            def get_by_code_version(  # type: ignore[override]
                self,
                instrument_id,
                pipeline_code,
                pipeline_version,
                *,
                with_nodes: bool = False,
            ):
                return DummyPipeline()

        # Patch PipelineRepository used inside finalize_assessment
        monkeypatch.setattr("app.engine.finalize.PipelineRepository", DummyRepo)

        result = finalize_session(db, session.id)
        assert result["ok"] is True
        diagnostics = result.get("validation", {}) or result.get("diagnostics", {})
        provenance = diagnostics.get("provenance") or {}
        assert provenance.get("pipeline_warning") == EngineMessages.PIPELINE_NO_NODES
    finally:
        db.close()


def test_runtime_start_session_sets_pipeline_version():
    db = build_seeded_memory_db()
    runtime = EngineRuntime()
    try:
        user = User(full_name="Runtime User", email="runtime_user@example.com")
        db.add(user)
        db.flush()

        session = runtime.start_session(db, user, "KLSI", "4.0")
        assert session.pipeline_version == "KLSI4.0:v1"
    finally:
        db.close()


def test_finalize_dependency_guard_raises_when_artifact_missing():
    db = build_seeded_memory_db()
    alt_key = "ALT:broken"
    original_definition = assessment_registry._registry.get(alt_key)
    saved_strategies = dict(strategy_registry._STRATEGIES)
    saved_default = strategy_registry._REGISTRY._default_strategy_code
    try:
        strategy_registry._STRATEGIES.clear()
        strategy_registry._REGISTRY._default_strategy_code = None

        instrument = Instrument(
            code="ALT",
            name="Alt Assessment Broken",
            version="broken",
            default_strategy_code=None,
            description=None,
            is_active=True,
        )
        db.add(instrument)
        db.flush()

        class BrokenStep:
            name = "broken"
            depends_on = ["combination"]

            def run(self, db, session_id, ctx):  # pragma: no cover - not expected to run
                ctx[self.name] = {"ran": True}

        class BrokenDefinition(KLSIAssessmentDefinition):
            id = "ALT"
            version = "broken"

            def __init__(self) -> None:
                super().__init__()
                self.steps = [BrokenStep()] + self.steps

        assessment_registry.register(BrokenDefinition())

        session = seed_complete_session(
            db,
            assessment_id="ALT",
            assessment_version="broken",
        )
        session.instrument_id = instrument.id
        db.flush()

        expected_message = EngineMessages.DEPENDENCY_NOT_AVAILABLE.format(
            dep="combination",
            step="broken",
        )

        with pytest.raises(RuntimeError) as exc:
            finalize_session(db, session.id)

        assert str(exc.value) == expected_message
    finally:
        strategy_registry._STRATEGIES.clear()
        strategy_registry._STRATEGIES.update(saved_strategies)
        strategy_registry._REGISTRY._default_strategy_code = saved_default
        if original_definition is not None:
            assessment_registry._registry[alt_key] = original_definition
        else:
            assessment_registry._registry.pop(alt_key, None)
        db.close()
