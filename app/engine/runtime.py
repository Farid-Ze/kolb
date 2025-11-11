from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.engine.authoring import get_instrument_locale_resource, get_instrument_spec
from app.engine.interfaces import InstrumentId
from app.engine.pipelines import assign_pipeline_version
from app.engine.registry import engine_registry
from app.models.klsi import AssessmentSession, Instrument, SessionStatus, User
from app.services.validation import run_session_validations


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
        try:
            get_instrument_spec(inst_id.key, inst_id.version)
        except KeyError as exc:
            raise HTTPException(
                status_code=500,
                detail="Instrument manifest belum dikonfigurasi",
            ) from exc

        session = AssessmentSession(
            user_id=user.id,
            status=SessionStatus.started,
            assessment_id=instrument.code,
            assessment_version=instrument.version,
            instrument_id=instrument.id,
            start_time=datetime.now(timezone.utc),
        )
        assign_pipeline_version(db, session, instrument.default_strategy_code)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def delivery_package(self, db: Session, session_id: int, *, locale: str | None = None) -> dict:
        session = self._resolve_session(db, session_id)
        inst_id = self._instrument_id(session)
        plugin = self._registry.plugin(inst_id)
        items = plugin.fetch_items(db, session_id)
        delivery = plugin.delivery()
        try:
            manifest = get_instrument_spec(inst_id.key, inst_id.version).manifest()
        except KeyError:
            manifest = None
        locale_payload: dict | None = None
        if locale:
            try:
                locale_payload = get_instrument_locale_resource(inst_id.key, inst_id.version, locale)
            except KeyError:
                locale_payload = None
        localized_items = {}
        localized_contexts: dict[str, str] = {}
        locale_metadata: dict[str, object] = {}
        if locale_payload:
            localized_items = {
                entry.get("item_number"): entry
                for entry in locale_payload.get("items", {}).get("learning_style", [])
                if isinstance(entry, dict) and entry.get("item_number") is not None
            }
            localized_contexts = locale_payload.get("contexts", {}) or {}
            locale_metadata = locale_payload.get("metadata", {}) or {}
        items_payload = []
        for item in items:
            entry = {
                "id": item.id,
                "number": item.number,
                "type": item.type,
                "stem": item.stem,
                "options": [dict(option) for option in item.options] if isinstance(item.options, list) else item.options,
            }
            if locale_payload:
                localized = localized_items.get(item.number)
                if localized and isinstance(localized, dict):
                    if localized.get("stem"):
                        entry["stem_localized"] = localized["stem"]
                    options_localized = localized.get("options", {}) or {}
                    if isinstance(entry["options"], list):
                        for option in entry["options"]:
                            mode = option.get("learning_mode")
                            if mode in options_localized:
                                option["text_localized"] = options_localized[mode]
            items_payload.append(entry)
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
            "items": items_payload,
            "manifest": manifest,
            "i18n": (
                {
                    "locale": locale,
                    "metadata": locale_metadata,
                    "contexts": localized_contexts,
                }
                if locale_payload
                else None
            ),
        }

    def submit_payload(self, db: Session, session_id: int, payload: dict) -> None:
        session = self._resolve_session(db, session_id)
        plugin = self._registry.plugin(self._instrument_id(session))
        plugin.validate_submit(db, session_id, payload)

    def finalize(
        self,
        db: Session,
        session_id: int,
        *,
        skip_validation: bool = False,
    ) -> dict:
        session = self._resolve_session(db, session_id)
        if session.status == SessionStatus.completed:
            raise HTTPException(status_code=409, detail="Sesi sudah selesai")
        validation = run_session_validations(db, session_id)
        if not validation.get("ready", False) and not skip_validation:
            raise HTTPException(
                status_code=400,
                detail={
                    "issues": validation.get("issues", []),
                    "diagnostics": validation.get("diagnostics"),
                },
            )

        scorer = self._registry.scorer(self._instrument_id(session))
        try:
            result = scorer.finalize(db, session_id, skip_checks=skip_validation)
            if not result.get("ok"):
                db.rollback()
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
        except HTTPException:
            db.rollback()
            raise
        except Exception as exc:  # pragma: no cover - defensive rollback
            db.rollback()
            raise HTTPException(status_code=500, detail="Gagal menyelesaikan sesi") from exc
        result["validation"] = validation
        result["override"] = skip_validation and not validation.get("ready", False)
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
