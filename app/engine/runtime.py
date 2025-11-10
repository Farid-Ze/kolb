from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.engine.interfaces import InstrumentId
from app.engine.registry import engine_registry
from app.models.klsi import AssessmentSession, Instrument, SessionStatus, User


class EngineRuntime:
    """Co-ordinates pluggable assessment instruments via the engine registry."""

    def __init__(self) -> None:
        self._registry = engine_registry

    def _resolve_session(self, db: Session, session_id: int) -> AssessmentSession:
        session = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session tidak ditemukan")
        return session

    def _instrument_id(self, session: AssessmentSession) -> InstrumentId:
        if session.instrument:
            return InstrumentId(session.instrument.code, session.instrument.version)
        return InstrumentId(session.assessment_id, session.assessment_version)

    def start_session(
        self,
        db: Session,
        user: User,
        instrument_code: str,
        instrument_version: str | None = None,
    ) -> AssessmentSession:
        query = db.query(Instrument).filter(Instrument.code == instrument_code)
        if instrument_version:
            query = query.filter(Instrument.version == instrument_version)
        instrument = query.first()
        if not instrument:
            raise HTTPException(status_code=404, detail="Instrumen tidak ditemukan")

        inst_id = InstrumentId(instrument.code, instrument.version)
        try:
            self._registry.plugin(inst_id)
        except KeyError:
            raise HTTPException(
                status_code=400,
                detail="Instrument plugin belum terdaftar di engine",
            ) from None

        session = AssessmentSession(
            user_id=user.id,
            status=SessionStatus.started,
            assessment_id=instrument.code,
            assessment_version=instrument.version,
            instrument_id=instrument.id,
            start_time=datetime.now(timezone.utc),
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def delivery_package(self, db: Session, session_id: int) -> dict:
        session = self._resolve_session(db, session_id)
        inst_id = self._instrument_id(session)
        plugin = self._registry.plugin(inst_id)
        items = plugin.fetch_items(db, session_id)
        delivery = plugin.delivery()
        return {
            "instrument": {
                "code": inst_id.key,
                "version": inst_id.version,
            },
            "delivery": {
                "forced_choice": delivery.forced_choice,
                "sections": delivery.sections,
                "randomize": delivery.randomize,
                "expected_contexts": delivery.expected_contexts,
            },
            "items": [
                {
                    "id": item.id,
                    "number": item.number,
                    "type": item.type,
                    "stem": item.stem,
                    "options": item.options,
                }
                for item in items
            ],
        }

    def submit_payload(self, db: Session, session_id: int, payload: dict) -> None:
        session = self._resolve_session(db, session_id)
        plugin = self._registry.plugin(self._instrument_id(session))
        plugin.validate_submit(db, session_id, payload)

    def finalize(self, db: Session, session_id: int) -> dict:
        session = self._resolve_session(db, session_id)
        if session.status == SessionStatus.completed:
            raise HTTPException(status_code=409, detail="Sesi sudah selesai")
        scorer = self._registry.scorer(self._instrument_id(session))
        result = scorer.finalize(db, session_id)
        if not result.get("ok"):
            raise HTTPException(
                status_code=400,
                detail={
                    "issues": result.get("issues"),
                    "diagnostics": result.get("diagnostics"),
                },
            )
        session.status = SessionStatus.completed
        session.end_time = datetime.now(timezone.utc)
        db.commit()
        return result

    def build_report(self, db: Session, session_id: int, viewer_role: str | None) -> dict:
        session = self._resolve_session(db, session_id)
        builder = self._registry.report_builder(self._instrument_id(session))
        return builder.build(db, session_id, viewer_role)

    def percentile(
        self, db: Session, session_id: int, scale: str, raw: int | float
    ) -> tuple[float | None, str]:
        session = self._resolve_session(db, session_id)
        provider = self._registry.norm_provider(self._instrument_id(session))
        return provider.percentile(db, session_id, scale, raw)


runtime = EngineRuntime()
