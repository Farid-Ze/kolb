
from __future__ import annotations

import json
from hashlib import sha256
from typing import Iterable, Sequence, TYPE_CHECKING

from sqlalchemy.orm import Session

import app.engine.strategies  # noqa: F401  # ensure strategy registrations execute

from app.engine.interfaces import ScoringContext
from app.engine.pipelines import assign_pipeline_version, resolve_klsi_pipeline_from_nodes
from app.engine.registry import get as get_definition
from app.engine.strategy_registry import get_strategy
from app.db.repositories import SessionRepository, StyleRepository, PipelineRepository
from app.models.klsi.audit import AuditLog
from app.services.regression import analyze_lfi_contexts
from app.services.validation import check_session_complete
from app.engine.validation import ValidationResult
from app.i18n.id_messages import EngineMessages, RegressionMessages, SessionErrorMessages

if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.assessment import AssessmentSession


def _unique(sequence: Iterable[str | None]) -> list[str]:
    seen: dict[str, None] = {}
    for value in sequence:
        if not value:
            continue
        if value not in seen:
            seen[value] = None
    return list(seen.keys())


def _strategy_candidates(session: "AssessmentSession", fallback_key: str | None) -> list[str]:
    """Derive ordered strategy candidates using structural pattern matching."""

    default_code = session.instrument.default_strategy_code if session.instrument else None

    match (session.strategy_code, default_code, fallback_key):
        case (str(primary), str(default), str(fallback)) if primary and default and fallback:
            ordered: Sequence[str] = (primary, default, fallback)
        case (str(primary), str(default), None | "") if primary and default:
            ordered = (primary, default)
        case (str(primary), None | "", str(fallback)) if primary and fallback:
            ordered = (primary, fallback)
        case (None | "", str(default), str(fallback)) if default and fallback:
            ordered = (default, fallback)
        case (str(primary), None | "", None | "") if primary:
            ordered = (primary,)
        case (None | "", str(default), None | "") if default:
            ordered = (default,)
        case (None | "", None | "", str(fallback)) if fallback:
            ordered = (fallback,)
        case _:
            ordered = ()

    return _unique(ordered)


def _parse_pipeline_version(pipeline_version: str | None) -> tuple[str, str] | None:
    """Split stored pipeline version token into (code, version)."""

    if not pipeline_version or ":" not in pipeline_version:
        return None
    code, _, version = pipeline_version.partition(":")
    if not code or not version:
        return None
    return code, version


def finalize_assessment(
    db: Session,
    session_id: int,
    assessment_id: str,
    assessment_version: str,
    salt: str,
    *,
    skip_checks: bool = False,
) -> dict:
    session_repo = SessionRepository(db)
    style_repo = StyleRepository(db)
    pipeline_repo = PipelineRepository(db)
    # Ensure atomicity: perform all writes within a nested transaction (SAVEPOINT)
    # so that any exception rolls back partial artifacts, while letting the outer
    # request/response life cycle control the final commit.
    with db.begin_nested():
        session = session_repo.get_with_instrument(session_id)
        if not session:
            raise ValueError(SessionErrorMessages.NOT_FOUND_WITH_ID.format(session_id=session_id))

        assessment = get_definition(assessment_id, assessment_version)

        validation_result = ValidationResult()
        if not skip_checks:
            # Run validation rules declared by the assessment definition.
            issues = []
            for rule in assessment.validation_rules():
                issues.extend(rule.validate(db, session_id))
            if issues:
                fatal = [i for i in issues if i.fatal]
                if strategy:
                    return {"ok": False, "issues": [i.as_dict() for i in issues]}

            # Always ensure ipsative core validation runs (engine-agnostic guard).
            completeness = check_session_complete(db, session_id)
            validation_result.structural["item_completeness"] = completeness
                    pipeline_tokens = _parse_pipeline_version(getattr(session, "pipeline_version", None))
                    if pipeline_tokens and session.instrument_id:
                        pipeline_code, pipeline_version = pipeline_tokens
                        pipeline = pipeline_repo.get_by_code_version(
                            session.instrument_id,
                            pipeline_code,
                            pipeline_version,
                            with_nodes=True,
                        )
                    if pipeline_tokens and (not pipeline or not getattr(pipeline, "nodes", None)):
                        merged = dict(validation_result.provenance)
                        merged["pipeline_warning"] = EngineMessages.PIPELINE_NO_NODES
                        validation_result.provenance = merged
                    elif pipeline and getattr(pipeline, "nodes", None):
                        try:
                            definition = resolve_klsi_pipeline_from_nodes(list(pipeline.nodes))
                            # Execute core scoring stages; percentiles and longitudinal
                            # analytics remain part of the strategy implementation.
                            definition.execute(db, session_id)
                        except ValueError as exc:
                            merged = dict(validation_result.provenance)
                            merged["pipeline_warning"] = EngineMessages.PIPELINE_UNSUPPORTED_NODE_KEY
                            merged["pipeline_error"] = str(exc)
                            validation_result.provenance = merged
        ctx = ScoringContext()
        artifact_snapshots: dict[str, dict] = {}

        strategy = None
        fallback_key = (
            f"{assessment_id}{assessment_version}".upper()
            if assessment_id and assessment_version
            else None
        )
        for candidate in _strategy_candidates(session, fallback_key):
            if not candidate:
                continue
            try:
                strategy = get_strategy(candidate)
                session.strategy_code = candidate
                assign_pipeline_version(db, session, candidate)
                break
            except KeyError:
                continue

        if strategy:
            # If a strategy is available, prefer declarative pipeline execution
            # based on the active scoring pipeline nodes. This preserves the
            # existing behavior of strategy.finalize while making the
            # orchestration declarative and engine-driven.
            pipeline = None
            if session.pipeline_id:
                pipeline = pipeline_repo.get(
                    session.pipeline_id,
                    session.instrument_id,  # type: ignore[arg-type]
                    with_nodes=True,
                )

            if session.pipeline_id and (not pipeline or not getattr(pipeline, "nodes", None)):
                validation_result.provenance["pipeline_warning"] = EngineMessages.PIPELINE_NO_NODES
            elif pipeline and getattr(pipeline, "nodes", None):
                try:
                    definition = resolve_klsi_pipeline_from_nodes(list(pipeline.nodes))
                    # Execute core scoring stages; percentiles and longitudinal
                    # analytics remain part of the strategy implementation.
                    definition.execute(db, session_id)
                except ValueError as exc:
                    validation_result.provenance["pipeline_warning"] = EngineMessages.PIPELINE_UNSUPPORTED_NODE_KEY
                    validation_result.provenance["pipeline_error"] = str(exc)
            payload = strategy.finalize(db, session_id)
            scale = payload["scale"]
            combo = payload["combo"]
            style = payload["style"]
            intensities = payload.get("intensity", {})
            lfi = payload["lfi"]
            percentiles = payload["percentiles"]
            delta = payload.get("delta")

            ctx["raw_modes"] = {
                "CE": scale.CE_raw,
                "RO": scale.RO_raw,
                "AC": scale.AC_raw,
                "AE": scale.AE_raw,
                "entity": scale,
            }
            artifact_snapshots["raw_modes"] = {
                key: value for key, value in ctx["raw_modes"].items() if key != "entity"
            }

            ctx["combination"] = {
                "ACCE": combo.ACCE_raw,
                "AERO": combo.AERO_raw,
                "assimilation_accommodation": combo.assimilation_accommodation,
                "converging_diverging": combo.converging_diverging,
                "balance_acce": combo.balance_acce,
                "balance_aero": combo.balance_aero,
                "entity": combo,
            }
            artifact_snapshots["combination"] = {
                key: value for key, value in ctx["combination"].items() if key != "entity"
            }

            ctx["style"] = {
                "primary_style_type_id": style.primary_style_type_id,
                "ACCE": style.ACCE_raw,
                "AERO": style.AERO_raw,
                "intensity": intensities.as_dict(),
                "intensity_metrics": intensities,
                "entity": style,
            }
            artifact_snapshots["style"] = {
                key: value
                for key, value in ctx["style"].items()
                if key not in {"entity", "intensity_metrics"}
            }

            ctx["lfi"] = {
                "W": lfi.W_coefficient,
                "score": lfi.LFI_score,
                "percentile": lfi.LFI_percentile,
                "level": lfi.flexibility_level,
                "provenance": lfi.norm_group_used,
                "entity": lfi,
            }
            artifact_snapshots["lfi"] = {
                key: value for key, value in ctx["lfi"].items() if key != "entity"
            }

            ctx["percentiles"] = {
                "CE": percentiles.CE_percentile,
                "RO": percentiles.RO_percentile,
                "AC": percentiles.AC_percentile,
                "AE": percentiles.AE_percentile,
                "ACCE": percentiles.ACCE_percentile,
                "AERO": percentiles.AERO_percentile,
                "sources": percentiles.norm_provenance,
                "truncated": percentiles.truncated_scales,
                "raw_outside_norm_range": percentiles.raw_outside_norm_range,
                "used_fallback_any": percentiles.used_fallback_any,
                "norm_group_used": percentiles.norm_group_used,
                "entity": percentiles,
            }
            artifact_snapshots["percentiles"] = {
                key: value for key, value in ctx["percentiles"].items() if key != "entity"
            }

            if delta:
                ctx["delta"] = {
                    "previous_session_id": delta.previous_session_id,
                    "delta_acce": delta.delta_acce,
                    "delta_aero": delta.delta_aero,
                    "delta_lfi": delta.delta_lfi,
                    "delta_intensity": delta.delta_intensity,
                }
                artifact_snapshots["delta"] = ctx["delta"]
            db.flush()
        else:
            assign_pipeline_version(db, session, None)
            for step in assessment.steps:
                for dep in getattr(step, "depends_on", []):
                    if dep not in artifact_snapshots and dep not in ctx:
                        from app.i18n.id_messages import EngineMessages
                        raise RuntimeError(EngineMessages.DEPENDENCY_NOT_AVAILABLE.format(dep=dep, step=step.name))
                step.run(db, session_id, ctx)
                db.flush()
                if step.name in ctx and isinstance(ctx[step.name], dict):
                    artifact_snapshots[step.name] = {
                        key: value
                        for key, value in ctx[step.name].items()
                        if key not in {"entity", "intensity_metrics"}
                    }
            session.strategy_code = None
            db.flush()

        # Canonical audit hash (sorted keys + salt for tamper resistance)
        audit_payload = {
            "session_id": session_id,
            "assessment": assessment_id,
            "version": assessment_version,
            "artifacts": artifact_snapshots,
        }
        serialized = json.dumps(audit_payload, sort_keys=True, default=str).encode("utf-8") + salt.encode("utf-8")
        db.add(
            AuditLog(
                actor="system",
                action="FINALIZE_SESSION",
                payload_hash=sha256(serialized).hexdigest(),
            )
        )

        # Populate provenance + anomaly diagnostics if present
        if "percentiles" in ctx:
            pct_ctx = ctx["percentiles"]
            provenance = dict(validation_result.provenance)
            provenance.update(
                {
                    "used_fallback_any": pct_ctx.get("used_fallback_any"),
                    "raw_outside_norm_range": pct_ctx.get("raw_outside_norm_range"),
                    "truncated_scales": pct_ctx.get("truncated"),
                    "norm_group_used": pct_ctx.get("norm_group_used"),
                }
            )
            validation_result.provenance = provenance
            # Anomalies: any truncated scale, mixed provenance
            if pct_ctx.get("raw_outside_norm_range"):
                validation_result.anomalies.append("RAW_OUTSIDE_NORM_RANGE")
            # Excessive truncations (>=2 scales truncated)
            trunc_map = pct_ctx.get("truncated") or {}
            if isinstance(trunc_map, dict) and len(trunc_map) >= 2:
                validation_result.anomalies.append("EXCESSIVE_TRUNCATION")
            sources = pct_ctx.get("sources", {}) or {}
            if any(v.get("used_fallback") for v in sources.values() if isinstance(v, dict)) and any(
                v.get("source", "").startswith("DB:") for v in sources.values() if isinstance(v, dict)
            ):
                validation_result.anomalies.append("MIXED_PROVENANCE")
        if "lfi" in ctx:
            lfi_ctx = ctx["lfi"]
            W = lfi_ctx.get("W")
            lfi_score = lfi_ctx.get("score")
            validation_result.psychometric["kendalls_w"] = W
            validation_result.psychometric["lfi_score"] = lfi_score
            # Anomalies: extreme W (near 0 or 1)
            if isinstance(W, (int, float)):
                if W < 0.05:
                    validation_result.anomalies.append("LOW_W_PATTERN")
                elif W > 0.95:
                    validation_result.anomalies.append("HIGH_W_UNIFORMITY")
            # Detect repeated LFI rank patterns (7+ or 6+ of 8 contexts identical)
            patterns = []
            rows = session_repo.list_lfi_context_scores(session_id)
            for r in rows:
                patterns.append((r.CE_rank, r.RO_rank, r.AC_rank, r.AE_rank))
            if patterns:
                from collections import Counter
                counts = Counter(patterns)
                top = counts.most_common(1)[0][1]
                if top >= 7:
                    validation_result.anomalies.append("LFI_REPEATED_PATTERN_7PLUS")
                elif top >= 6:
                    validation_result.anomalies.append("LFI_REPEATED_PATTERN_6PLUS")
            # Derive LFI-based backup styles: infer styles used across 8 contexts
            # and persist unique backups excluding primary style.
            try:
                # Preload all style types once (avoid N+1 lookups)
                all_styles = style_repo.list_learning_style_types()
                style_by_name = {s.style_name: s for s in all_styles}
                primary_style_type_id = None
                if "style" in ctx:
                    primary_style_type_id = ctx["style"].get("primary_style_type_id")
                primary_name = None
                if primary_style_type_id:
                    prim_row = next((s for s in all_styles if s.id == primary_style_type_id), None)
                    primary_name = prim_row.style_name if prim_row else None

                context_payload = [
                    {"CE": r.CE_rank, "RO": r.RO_rank, "AC": r.AC_rank, "AE": r.AE_rank}
                    for r in rows
                ]
                analysis = analyze_lfi_contexts(context_payload)
                # Map style -> list of contexts where it appeared
                contexts_for_style: dict[str, list[str]] = {}
                for entry in analysis.get("context_styles", []):
                    sname = entry.get("style")
                    if not sname or sname == RegressionMessages.UNCLASSIFIED_STYLE:
                        continue
                    contexts_for_style.setdefault(sname, []).append(entry.get("context"))
                style_freq: dict[str, int] = analysis.get("style_frequency", {}) or {}
                # Upsert using preloaded style mapping
                for sname, count in style_freq.items():
                    if sname == primary_name:
                        continue
                    style_row = style_by_name.get(sname)
                    if not style_row:
                        continue
                    style_repo.upsert_backup_style(
                        session_id,
                        style_row.id,
                        frequency_count=int(count),
                        contexts=contexts_for_style.get(sname, []),
                    )
            except Exception:
                # Non-fatal: keep finalize robust even if analysis fails
                pass
        # Near-boundary style window detection using combination raw ACCE/AERO
        if "combination" in ctx:
            combo_ctx = ctx["combination"]
            acce = combo_ctx.get("ACCE")
            aero = combo_ctx.get("AERO")
            near = False
            # Boundaries (per docs): ACCE cutpoints at 5/6 and 14/15; AERO at 0/1 and 11/12
            if isinstance(acce, int) and (acce in (5, 6, 14, 15)):
                near = True
            if isinstance(aero, int) and (aero in (0, 1, 11, 12)):
                near = True
            if near:
                validation_result.anomalies.append("NEAR_STYLE_BOUNDARY")
        return {"ok": True, "context": ctx, "artifacts": artifact_snapshots, "validation": validation_result.as_dict()}
