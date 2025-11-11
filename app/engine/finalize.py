from __future__ import annotations

import json
from hashlib import sha256

from sqlalchemy.orm import Session

import app.engine.strategies  # noqa: F401  # ensure strategy registrations execute

from app.engine.interfaces import ScoringContext
from app.engine.pipelines import assign_pipeline_version
from app.engine.registry import get as get_definition
from app.engine.strategy_registry import get_strategy
from app.models.klsi import AssessmentSession, AuditLog
from app.services.validation import check_session_complete


def finalize_assessment(
    db: Session,
    session_id: int,
    assessment_id: str,
    assessment_version: str,
    salt: str,
    *,
    skip_checks: bool = False,
) -> dict:
    # Ensure atomicity: perform all writes within a nested transaction (SAVEPOINT)
    # so that any exception rolls back partial artifacts, while letting the outer
    # request/response life cycle control the final commit.
    with db.begin_nested():
        session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} tidak ditemukan")

        assessment = get_definition(assessment_id, assessment_version)

        if not skip_checks:
            # Run validation rules declared by the assessment definition.
            issues = []
            for rule in assessment.validation_rules():
                issues.extend(rule.validate(db, session_id))
            if issues:
                fatal = [i for i in issues if i.fatal]
                if fatal:
                    return {"ok": False, "issues": [i.as_dict() for i in issues]}

            # Always ensure ipsative core validation runs (engine-agnostic guard).
            completeness = check_session_complete(db, session_id)
            if not completeness.get("ready_to_complete"):
                return {
                    "ok": False,
                    "issues": [
                        {
                            "code": "INCOMPLETE_ITEMS",
                            "message": "12 item gaya belajar belum terpenuhi",
                            "fatal": True,
                        }
                    ],
                    "diagnostics": completeness,
                }

        ctx = ScoringContext()
        artifact_snapshots: dict[str, dict] = {}

        strategy = None
        strategy_candidates: list[str] = []
        if session.strategy_code:
            strategy_candidates.append(session.strategy_code)
        if session.instrument and session.instrument.default_strategy_code:
            if session.instrument.default_strategy_code not in strategy_candidates:
                strategy_candidates.append(session.instrument.default_strategy_code)
        fallback_key = f"{assessment_id}{assessment_version}".upper() if assessment_id and assessment_version else None
        if fallback_key and fallback_key not in strategy_candidates:
            strategy_candidates.append(fallback_key)

        for candidate in strategy_candidates:
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
                "intensity": intensities,
                "entity": style,
            }
            artifact_snapshots["style"] = {
                key: value for key, value in ctx["style"].items() if key != "entity"
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
                        raise RuntimeError(f"Dependency '{dep}' belum tersedia untuk step '{step.name}'")
                step.run(db, session_id, ctx)
                db.flush()
                if step.name in ctx and isinstance(ctx[step.name], dict):
                    artifact_snapshots[step.name] = {
                        key: value
                        for key, value in ctx[step.name].items()
                        if key != "entity"
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

        return {"ok": True, "context": ctx, "artifacts": artifact_snapshots}
