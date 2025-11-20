from __future__ import annotations

import json
from typing import Any

import pytest

import app.engine.registry as assessment_registry
import app.engine.strategy_registry as strategy_registry
from app.assessments.klsi_v4 import logic
from app.assessments.klsi_v4.definition import KLSIAssessmentDefinition  # noqa: F401 ensures registration

from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.instrument import Instrument
from app.models.klsi.learning import CombinationScore, ScaleProvenance, ScaleScore
from app.models.klsi.norms import PercentileScore
from app.models.klsi.user import User

from app.engine.strategies.klsi4 import KLSI4Strategy
from app.engine.runtime import EngineRuntime
from app.engine.norms.value_objects import PercentileResult
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
        assert percentile_entity.norm_version_used is None

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
        assert ce_row.norm_version is None
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


def test_finalize_artifacts_match_between_strategy_and_manual_paths():
    db = build_seeded_memory_db()
    original_strategy = strategy_registry._STRATEGIES.get("KLSI4.0")
    try:
        session_strategy = seed_complete_session(db)
        result_strategy = finalize_session(db, session_strategy.id)
        assert result_strategy["ok"] is True
        session_strategy.user.email = "strategy-user@example.com"
        db.flush()

        strategy_registry._STRATEGIES.pop("KLSI4.0", None)
        session_manual = seed_complete_session(db)
        result_manual = finalize_session(db, session_manual.id)
        assert result_manual["ok"] is True

        assert result_manual["artifacts"] == result_strategy["artifacts"]
        keys = ("norm_group_used", "raw_outside_norm_range", "truncated_scales", "used_fallback_any")
        manual_prov = result_manual["validation"].get("provenance", {})
        strategy_prov = result_strategy["validation"].get("provenance", {})
        for key in keys:
            assert manual_prov.get(key) == strategy_prov.get(key)
    finally:
        if original_strategy is not None:
            strategy_registry._STRATEGIES["KLSI4.0"] = original_strategy
        else:
            strategy_registry._STRATEGIES.pop("KLSI4.0", None)
        db.close()


def test_engine_runtime_finalize_with_audit_matches_manual_path_artifacts():
    db = build_seeded_memory_db()
    runtime = EngineRuntime(components_enabled=False)
    original_strategy = strategy_registry._STRATEGIES.get("KLSI4.0")
    captured_payloads: list[dict[str, Any]] = []
    try:
        session_strategy = seed_complete_session(db)
        strategy_result = finalize_session(db, session_strategy.id)
        assert strategy_result["ok"] is True
        session_strategy.user.email = "runtime-strategy@example.com"
        db.flush()

        strategy_registry._STRATEGIES.pop("KLSI4.0", None)
        session_manual = seed_complete_session(db)

        def _build_payload(payload_dict: dict[str, Any]) -> bytes:
            captured_payloads.append(payload_dict)
            return json.dumps(payload_dict, default=str).encode("utf-8")

        runtime_result = runtime.finalize_with_audit(
            db,
            session_manual.id,
            actor_email="mediator@example.com",
            action="FINALIZE",
            build_payload=_build_payload,
        )

        assert runtime_result["ok"] is True
        assert captured_payloads
        assert runtime_result["artifacts"] == strategy_result["artifacts"]
        assert runtime_result["validation"]["structural"] == strategy_result["validation"]["structural"]
        runtime_prov = runtime_result["validation"].get("provenance", {})
        strategy_prov = strategy_result["validation"].get("provenance", {})
        for key in ("norm_group_used", "raw_outside_norm_range", "truncated_scales", "used_fallback_any"):
            assert runtime_prov.get(key) == strategy_prov.get(key)
    finally:
        if original_strategy is not None:
            strategy_registry._STRATEGIES["KLSI4.0"] = original_strategy
        else:
            strategy_registry._STRATEGIES.pop("KLSI4.0", None)
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


def test_apply_percentiles_records_norm_versions_per_scale():
    class StubProvider:
        def percentile(self, group_chain, scale_name, raw):  # pragma: no cover - simple stub
            return PercentileResult(75.0, "DB:Total|2025Q2", False)

    db = build_seeded_memory_db()
    try:
        session = seed_complete_session(db)
        scale = ScaleScore(
            session_id=session.id,
            CE_raw=32,
            RO_raw=30,
            AC_raw=34,
            AE_raw=28,
        )
        combo = CombinationScore(
            session_id=session.id,
            ACCE_raw=scale.AC_raw - scale.CE_raw,
            AERO_raw=scale.AE_raw - scale.RO_raw,
            assimilation_accommodation=scale.AC_raw - scale.RO_raw,
            converging_diverging=scale.AE_raw - scale.CE_raw,
            balance_acce=abs(scale.AC_raw - scale.CE_raw),
            balance_aero=abs(scale.AE_raw - scale.RO_raw),
        )
        db.add(scale)
        db.add(combo)
        db.flush()

        provider = StubProvider()
        group_token = logic._pack_norm_group_token("Total", "2025Q2")
        logic.apply_percentiles(
            db,
            session.id,
            scale,
            combo,
            norm_provider=provider,
            group_chain=[group_token],
        )
        db.flush()

        percentile = (
            db.query(PercentileScore)
            .filter(PercentileScore.session_id == session.id)
            .one()
        )
        assert percentile.norm_group_used == "DB:Total|2025Q2"
        assert percentile.norm_version_used == "2025Q2"

        prov_rows = (
            db.query(ScaleProvenance)
            .filter(ScaleProvenance.session_id == session.id)
            .all()
        )
        assert len(prov_rows) == 6
        assert {row.norm_version for row in prov_rows} == {"2025Q2"}
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
