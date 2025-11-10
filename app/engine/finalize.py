from __future__ import annotations

import json
from hashlib import sha256

from sqlalchemy.orm import Session

from app.engine.interfaces import ScoringContext
from app.engine.registry import get
from app.models.klsi import AssessmentSession, AuditLog
from app.services.validation import check_session_complete


def finalize_assessment(
    db: Session,
    session_id: int,
    assessment_id: str,
    assessment_version: str,
    salt: str,
) -> dict:
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise ValueError(f"Session {session_id} tidak ditemukan")

    assessment = get(assessment_id, assessment_version)

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
