from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache
from hashlib import sha256
from time import perf_counter
from typing import Any, Callable
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import (
    ConfigurationError,
    ConflictError,
    DomainError,
    InstrumentNotFoundError,
    SessionFinalizedError,
    SessionNotFoundError,
    ValidationError,
)
from app.core.logging import correlation_context, get_logger
from app.core.metrics import count_calls, measure_time, timeit
from app.db.database import get_repository_provider
from app.engine.authoring import get_instrument_locale_resource, get_instrument_spec
from app.engine.interfaces import InstrumentId
from app.engine.pipelines import assign_pipeline_version
from app.engine.registry import engine_registry
from app.engine.runtime_components import (
    RuntimeErrorReporter,
    RuntimeScheduler,
    RuntimeStateTracker,
)
from app.engine.runtime_logic import (
    FinalizePayload,
    ValidationReport,
    build_finalize_payload,
    compose_delivery_payload,
)
from app.i18n.id_messages import EngineMessages
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.audit import AuditLog
from app.models.klsi.enums import SessionStatus
from app.models.klsi.user import User
from app.services.validation import run_session_validations

logger = get_logger("kolb.engine.runtime", component="engine")


@dataclass(slots=True)
class FinalizeContext:
    """Shared context for finalize pipelines.

    Breaking the runtime into explicit dataclasses makes the ingest/validate/
    compute/normalize/output phases easier to follow and test independently.
    """

    db: Session
    session_id: int
    skip_validation: bool
    tracker: RuntimeStateTracker | None
    correlation_id: str


@dataclass(slots=True)
class FinalizeArtifacts:
    """Artifacts produced by the finalize pipeline phases."""

    session: AssessmentSession
    validation: ValidationReport
    scorer_result: dict[str, Any]
    payload: FinalizePayload
    override: bool
    duration_ms: float
    correlation_id: str


class EngineRuntime:
    """Co-ordinates pluggable assessment instruments via the engine registry.
    
    Sync/Async Boundaries:
    ----------------------
    This class is currently fully synchronous with the following I/O patterns:
    
    1. **Database I/O** (Blocking):
       - All DB operations use SQLAlchemy synchronous sessions
       - DB access stays within services/engine layers (not in routers)
       - Transaction management via context managers ensures atomicity
       
    2. **File I/O** (Blocking, Cached):
       - Manifest/locale loading is cached via @lru_cache
       - After first load, subsequent access is memory-only (no disk I/O)
       - i18n resources are preloaded at startup if enabled
       
    3. **Future Async Integration Points**:
       - External norm provider HTTP calls (when enabled):
         * Currently: external_norms_enabled=False (synchronous fallback)
         * Future: Replace with httpx.AsyncClient for async HTTP
         * Will require: async def percentile() → tuple[float | None, str]
       - Report generation for large datasets:
         * Currently: Synchronous report building
         * Future: Stream reports via async generators
       
    Design Notes:
    - Method signatures will remain sync-only until async is actually needed
    - When adding async, use AsyncSession from sqlalchemy.ext.asyncio
    - Router layer already supports async (FastAPI handles sync→async)
    - Engine→Services boundary stays sync for now (YAGNI principle)
    """

    def __init__(
        self,
        *,
        components_enabled: bool | None = None,
        scheduler: RuntimeScheduler | None = None,
        error_reporter: RuntimeErrorReporter | None = None,
    ) -> None:
        self._registry = engine_registry
        self._components_enabled = (
            settings.runtime_components_enabled if components_enabled is None else components_enabled
        )
        self._scheduler = scheduler or RuntimeScheduler(get_repository_provider)
        self._error_reporter = error_reporter or RuntimeErrorReporter(logger)

    def _resolve_session(self, db: Session, session_id: int) -> AssessmentSession:
        if self._components_enabled:
            session = self._scheduler.resolve_session(db, session_id)
        else:
            repo_provider = get_repository_provider(db)
            session = repo_provider.sessions.get_by_id(session_id)
        if not session:
            logger.warning(
                "session_not_found",
                extra={"structured_data": {"session_id": session_id}},
            )
            raise SessionNotFoundError()
        return session

    def _build_state_tracker(self, label: str) -> RuntimeStateTracker | None:
        if self._components_enabled:
            return RuntimeStateTracker(label)
        return None

    def _measure_duration(self, started: float, tracker: RuntimeStateTracker | None) -> float:
        if tracker:
            return tracker.duration_ms()
        return (perf_counter() - started) * 1000.0

    def _log_runtime_error(
        self,
        *,
        event: str,
        session_id: int,
        user_id: int | None,
        exc: Exception,
        correlation_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        if self._components_enabled:
            self._error_reporter.report(
                event=event,
                session_id=session_id,
                user_id=user_id,
                exc=exc,
                correlation_id=correlation_id,
                metadata=metadata,
            )
            return
        structured = {
            "session_id": session_id,
            "user_id": user_id,
            "error": str(exc),
            "correlation_id": correlation_id,
        }
        if metadata:
            structured.update(metadata)
        logger.exception(event, extra={"structured_data": structured})

    def _phase_ingest(
        self,
        context: FinalizeContext,
        *,
        missing_event: str,
        completed_event: str,
    ) -> AssessmentSession:
        try:
            session = self._resolve_session(context.db, context.session_id)
        except SessionNotFoundError as exc:
            logger.warning(
                missing_event,
                extra={
                    "structured_data": {
                        "session_id": context.session_id,
                        "status_code": exc.status_code,
                        "correlation_id": context.correlation_id,
                    }
                },
            )
            raise
        if session.status == SessionStatus.completed:
            logger.info(
                completed_event,
                extra={
                    "structured_data": {
                        "session_id": session.id,
                        "user_id": session.user_id,
                        "correlation_id": context.correlation_id,
                    }
                },
            )
            raise SessionFinalizedError()
        return session

    def _phase_validate(
        self,
        context: FinalizeContext,
        session: AssessmentSession,
        *,
        failure_event: str,
    ) -> ValidationReport:
        validation = ValidationReport.from_mapping(run_session_validations(context.db, session.id))
        if not validation.ready and not context.skip_validation:
            logger.warning(
                failure_event,
                extra={
                    "structured_data": {
                        "session_id": session.id,
                        "issues": validation.issues_list(),
                        "correlation_id": context.correlation_id,
                    }
                },
            )
            raise ValidationError(
                "Validasi sesi belum lengkap",
                detail={
                    "issues": validation.issues_list(),
                    "diagnostics": validation.diagnostics_dict(),
                },
            )
        return validation

    def _phase_compute(
        self,
        context: FinalizeContext,
        session: AssessmentSession,
        *,
        transactional: bool,
        scorer_issue_event: str,
        runtime_error_event: str,
        runtime_metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        scorer = self._registry.scorer(self._instrument_id(session))
        result: dict[str, Any] = {"ok": False}

        def _ensure_ok(payload: dict[str, Any]) -> None:
            if payload.get("ok"):
                return
            logger.warning(
                scorer_issue_event,
                extra={
                    "structured_data": {
                        "session_id": session.id,
                        "issues": payload.get("issues"),
                        "correlation_id": context.correlation_id,
                    }
                },
            )
            raise ValidationError(
                "Pipeline finalisasi mendeteksi masalah",
                detail={
                    "issues": payload.get("issues"),
                    "diagnostics": payload.get("diagnostics"),
                },
            )

        try:
            if transactional:
                with context.db.begin():
                    result = scorer.finalize(context.db, session.id, skip_checks=context.skip_validation)
                    _ensure_ok(result)
                    session.status = SessionStatus.completed
                    session.end_time = datetime.now(timezone.utc)
            else:
                result = scorer.finalize(context.db, session.id, skip_checks=context.skip_validation)
                _ensure_ok(result)
                session.status = SessionStatus.completed
                session.end_time = datetime.now(timezone.utc)
                context.db.commit()
        except DomainError:
            if not transactional:
                context.db.rollback()
            raise
        except Exception as exc:  # pragma: no cover - defensive rollback
            if not transactional:
                context.db.rollback()
            self._log_runtime_error(
                event=runtime_error_event,
                session_id=session.id,
                user_id=session.user_id,
                exc=exc,
                correlation_id=context.correlation_id,
                metadata=runtime_metadata,
            )
            result = self._build_engine_error_payload(exc)
        return result

    def _phase_normalize(
        self,
        context: FinalizeContext,
        validation: ValidationReport,
        scorer_result: dict[str, Any],
    ) -> tuple[FinalizePayload, bool]:
        override = context.skip_validation and not validation.ready
        payload = build_finalize_payload(scorer_result, validation, override=override)
        return payload, override

    def _phase_output(
        self,
        artifacts: FinalizeArtifacts,
        payload_dict: dict[str, Any],
        *,
        log_event: str,
        extra: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        structured = {
            "session_id": artifacts.session.id,
            "user_id": artifacts.session.user_id,
            "duration_ms": artifacts.duration_ms,
            "override": artifacts.override,
            "correlation_id": artifacts.correlation_id,
        }
        if extra:
            structured.update(extra)
        logger.info(log_event, extra={"structured_data": structured})
        return payload_dict

    def _execute_finalize_pipeline(
        self,
        context: FinalizeContext,
        *,
        transactional: bool,
        missing_event: str,
        completed_event: str,
        validation_event: str,
        scorer_issue_event: str,
        runtime_error_event: str,
        runtime_metadata: dict[str, Any] | None = None,
    ) -> FinalizeArtifacts:
        started = perf_counter()
        session = self._phase_ingest(
            context,
            missing_event=missing_event,
            completed_event=completed_event,
        )
        validation = self._phase_validate(
            context,
            session,
            failure_event=validation_event,
        )
        scorer_result = self._phase_compute(
            context,
            session,
            transactional=transactional,
            scorer_issue_event=scorer_issue_event,
            runtime_error_event=runtime_error_event,
            runtime_metadata=runtime_metadata,
        )
        payload, override = self._phase_normalize(context, validation, scorer_result)
        duration_ms = self._measure_duration(started, context.tracker)
        return FinalizeArtifacts(
            session=session,
            validation=validation,
            scorer_result=scorer_result,
            payload=payload,
            override=override,
            duration_ms=duration_ms,
            correlation_id=context.correlation_id,
        )

    def _build_engine_error_payload(self, exc: Exception) -> dict[str, Any]:
        return {
            "ok": False,
            "issues": [
                {
                    "code": "ENGINE_RUNTIME_ERROR",
                    "detail": str(exc),
                }
            ],
            "diagnostics": {"exception": str(exc)},
        }

    def _build_audit_payload_bytes(
        self,
        builder: Callable[[dict], bytes] | None,
        payload_dict: dict,
        *,
        session_id: int,
        correlation_id: str,
    ) -> bytes | None:
        if not callable(builder):
            return None
        try:
            return builder(payload_dict)
        except Exception:
            logger.warning(
                "audit_payload_builder_failed",
                extra={
                    "structured_data": {
                        "session_id": session_id,
                        "correlation_id": correlation_id,
                    }
                },
            )
            return None

    def _write_audit_log(
        self,
        db: Session,
        *,
        payload_bytes: bytes | None,
        actor_email: str,
        action: str,
        session_id: int,
        correlation_id: str,
    ) -> None:
        if not payload_bytes:
            return
        try:
            db.add(
                AuditLog(
                    actor=actor_email,
                    action=action,
                    payload_hash=sha256(payload_bytes).hexdigest(),
                    created_at=datetime.now(timezone.utc),
                )
            )
            db.commit()
        except Exception:
            db.rollback()
            logger.warning(
                "audit_write_failed",
                extra={
                    "structured_data": {
                        "session_id": session_id,
                        "correlation_id": correlation_id,
                    }
                },
            )
            # Non-fatal: keep result success even if audit write fails


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
        correlation_id = str(uuid4())
        with correlation_context(correlation_id):
            repo_provider = get_repository_provider(db)
            instrument_repo = repo_provider.instruments
            instrument = instrument_repo.get_by_code(instrument_code, instrument_version)
            if not instrument:
                logger.warning(
                    "instrument_not_found",
                    extra={
                        "structured_data": {
                            "instrument_code": instrument_code,
                            "instrument_version": instrument_version,
                            "correlation_id": correlation_id,
                        }
                    },
                )
                raise InstrumentNotFoundError()

            inst_id = InstrumentId(instrument.code, instrument.version)
            try:
                self._registry.plugin(inst_id)
            except KeyError:
                logger.error(
                    "plugin_not_registered",
                    extra={
                        "structured_data": {
                            "instrument_code": inst_id.key,
                            "instrument_version": inst_id.version,
                            "correlation_id": correlation_id,
                        }
                    },
                )
                raise ConflictError(EngineMessages.PLUGIN_NOT_REGISTERED, status_code=400) from None
            try:
                get_instrument_spec(inst_id.key, inst_id.version)
            except KeyError as exc:
                logger.error(
                    "manifest_missing",
                    extra={
                        "structured_data": {
                            "instrument_code": inst_id.key,
                            "instrument_version": inst_id.version,
                            "correlation_id": correlation_id,
                        }
                    },
                )
                raise ConfigurationError(EngineMessages.MANIFEST_NOT_CONFIGURED) from exc

            session = AssessmentSession(
                user_id=user.id,
                status=SessionStatus.started,
                assessment_id=instrument.code,
                assessment_version=instrument.version,
                instrument_id=instrument.id,
                start_time=datetime.now(timezone.utc),
            )
            started = perf_counter()
            try:
                assign_pipeline_version(db, session, instrument.default_strategy_code)
                db.add(session)
                db.commit()
                db.refresh(session)
            except Exception:
                db.rollback()
                logger.exception(
                    "start_session_failure",
                    extra={
                        "structured_data": {
                            "instrument_code": instrument.code,
                            "instrument_version": instrument.version,
                            "user_id": user.id,
                            "correlation_id": correlation_id,
                        }
                    },
                )
                raise
            duration_ms = (perf_counter() - started) * 1000.0
            logger.info(
                "start_session_success",
                extra={
                    "structured_data": {
                        "session_id": session.id,
                        "instrument_code": instrument.code,
                        "instrument_version": instrument.version,
                        "user_id": user.id,
                        "duration_ms": duration_ms,
                        "correlation_id": correlation_id,
                    }
                },
            )
            return session

    def delivery_package(self, db: Session, session_id: int, *, locale: str | None = None) -> dict:
        session = self._resolve_session(db, session_id)
        inst_id = self._instrument_id(session)
        plugin = self._registry.plugin(inst_id)
        items = plugin.fetch_items(db, session_id)
        delivery = plugin.delivery()
        manifest = _cached_manifest(inst_id.key, inst_id.version)
        locale_payload: dict | None = None
        if locale:
            locale_payload = _cached_locale(inst_id.key, inst_id.version, locale)
        return compose_delivery_payload(
            inst_id,
            items,
            delivery,
            manifest,
            locale_payload,
            locale=locale,
        )

    def submit_payload(self, db: Session, session_id: int, payload: dict) -> None:
        session = self._resolve_session(db, session_id)
        plugin = self._registry.plugin(self._instrument_id(session))
        plugin.validate_submit(db, session_id, payload)

    @count_calls("engine.finalize.calls")
    @measure_time("engine.finalize", histogram=True)
    @timeit("engine.finalize")
    def finalize(
        self,
        db: Session,
        session_id: int,
        *,
        skip_validation: bool = False,
    ) -> dict:
        correlation_id = str(uuid4())
        with correlation_context(correlation_id):
            tracker = self._build_state_tracker("engine.finalize")
            context = FinalizeContext(
                db=db,
                session_id=session_id,
                skip_validation=skip_validation,
                tracker=tracker,
                correlation_id=correlation_id,
            )
            artifacts = self._execute_finalize_pipeline(
                context,
                transactional=True,
                missing_event="finalize_session_missing",
                completed_event="finalize_already_completed",
                validation_event="finalize_validation_failed",
                scorer_issue_event="finalize_scorer_reported_issue",
                runtime_error_event="finalize_runtime_error",
            )
            payload_dict = artifacts.payload.as_dict()
            return self._phase_output(artifacts, payload_dict, log_event="finalize_success")

    @count_calls("engine.finalize_with_audit.calls")
    @measure_time("engine.finalize_with_audit", histogram=True)
    @timeit("engine.finalize_with_audit")
    def finalize_with_audit(
        self,
        db: Session,
        session_id: int,
        *,
        actor_email: str,
        action: str,
        build_payload: Callable[[dict], bytes],
        skip_validation: bool = False,
    ) -> dict:
        """Finalize session artifacts and write an AuditLog entry atomically.

        build_payload: callable that receives the result dict (post-finalize) and
        returns bytes to be hashed for payload_hash.
        """
        correlation_id = str(uuid4())
        with correlation_context(correlation_id):
            tracker = self._build_state_tracker("engine.finalize_with_audit")
            context = FinalizeContext(
                db=db,
                session_id=session_id,
                skip_validation=skip_validation,
                tracker=tracker,
                correlation_id=correlation_id,
            )
            artifacts = self._execute_finalize_pipeline(
                context,
                transactional=False,
                missing_event="finalize_audit_session_missing",
                completed_event="finalize_audit_already_completed",
                validation_event="finalize_audit_validation_failed",
                scorer_issue_event="finalize_audit_scorer_issue",
                runtime_error_event="finalize_audit_runtime_error",
                runtime_metadata={"actor_email": actor_email, "action": action},
            )

            payload_dict = artifacts.payload.as_dict()
            payload_bytes = self._build_audit_payload_bytes(
                build_payload,
                payload_dict,
                session_id=session_id,
                correlation_id=correlation_id,
            )
            self._write_audit_log(
                db,
                payload_bytes=payload_bytes,
                actor_email=actor_email,
                action=action,
                session_id=session_id,
                correlation_id=correlation_id,
            )

            return self._phase_output(
                artifacts,
                payload_dict,
                log_event="finalize_audit_success",
                extra={"actor": actor_email, "action": action},
            )

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


# Caching helpers (module-level to persist across runtime calls)
@lru_cache(maxsize=128)
def _cached_manifest(
    instrument_code: str, instrument_version: str
):  # pragma: no cover - pure cache
    try:
        return get_instrument_spec(instrument_code, instrument_version).manifest()
    except KeyError:
        return None


@lru_cache(maxsize=256)
def _cached_locale(
    instrument_code: str, instrument_version: str, locale: str
):  # pragma: no cover - pure cache
    try:
        return get_instrument_locale_resource(instrument_code, instrument_version, locale)
    except KeyError:
        return None
