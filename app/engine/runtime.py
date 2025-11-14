from __future__ import annotations

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
from app.engine.runtime_logic import (
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


class RuntimeScheduler:
    """Thin wrapper responsible for resolving sessions via repositories."""

    def __init__(self, repo_provider_factory=get_repository_provider):
        self._repo_provider_factory = repo_provider_factory

    def resolve_session(self, db: Session, session_id: int) -> AssessmentSession | None:
        repo_provider = self._repo_provider_factory(db)
        repo = repo_provider.sessions
        return repo.get_by_id(session_id)


class RuntimeStateTracker:
    """Tracks elapsed wall time for runtime phases."""

    def __init__(self, label: str):
        self.label = label
        self._started = perf_counter()

    def duration_ms(self) -> float:
        return (perf_counter() - self._started) * 1000.0


class RuntimeErrorReporter:
    """Centralizes structured logging for runtime errors."""

    def __init__(self, logger_instance):
        self._logger = logger_instance

    def report(
        self,
        *,
        event: str,
        session_id: int,
        user_id: int | None,
        exc: Exception,
        correlation_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        structured = {
            "session_id": session_id,
            "user_id": user_id,
            "error": str(exc),
            "correlation_id": correlation_id,
        }
        if metadata:
            structured.update(metadata)
        self._logger.exception(event, extra={"structured_data": structured})


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
            try:
                session = self._resolve_session(db, session_id)
            except SessionNotFoundError as exc:
                logger.warning(
                    "finalize_session_missing",
                    extra={
                        "structured_data": {
                            "session_id": session_id,
                            "status_code": exc.status_code,
                            "correlation_id": correlation_id,
                        }
                    },
                )
                raise
            if session.status == SessionStatus.completed:
                logger.info(
                    "finalize_already_completed",
                    extra={
                        "structured_data": {
                            "session_id": session_id,
                            "user_id": session.user_id,
                            "correlation_id": correlation_id,
                        }
                    },
                )
                raise SessionFinalizedError()
            validation = ValidationReport.from_mapping(run_session_validations(db, session_id))
            if not validation.ready and not skip_validation:
                logger.warning(
                    "finalize_validation_failed",
                    extra={
                        "structured_data": {
                            "session_id": session_id,
                            "issues": validation.issues_list(),
                            "correlation_id": correlation_id,
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

            scorer = self._registry.scorer(self._instrument_id(session))
            scorer_result: dict[str, Any] = {"ok": False}
            started = perf_counter()
            try:
                # Atomic transaction: finalize artifacts + status update together
                with db.begin():
                    scorer_result = scorer.finalize(db, session_id, skip_checks=skip_validation)
                    if not scorer_result.get("ok"):
                        logger.warning(
                            "finalize_scorer_reported_issue",
                            extra={
                                "structured_data": {
                                    "session_id": session_id,
                                    "issues": scorer_result.get("issues"),
                                    "correlation_id": correlation_id,
                                }
                            },
                        )
                        raise ValidationError(
                            "Pipeline finalisasi mendeteksi masalah",
                            detail={
                                "issues": scorer_result.get("issues"),
                                "diagnostics": scorer_result.get("diagnostics"),
                            },
                        )
                    session.status = SessionStatus.completed
                    session.end_time = datetime.now(timezone.utc)
            except DomainError:
                raise
            except Exception as exc:  # pragma: no cover - defensive rollback
                self._log_runtime_error(
                    event="finalize_runtime_error",
                    session_id=session_id,
                    user_id=session.user_id,
                    exc=exc,
                    correlation_id=correlation_id,
                )
                scorer_result = {
                    "ok": False,
                    "issues": [
                        {
                            "code": "ENGINE_RUNTIME_ERROR",
                            "detail": str(exc),
                        }
                    ],
                    "diagnostics": {"exception": str(exc)},
                }
            duration_ms = self._measure_duration(started, tracker)
            override = skip_validation and not validation.ready
            payload = build_finalize_payload(scorer_result, validation, override=override)
            result = payload.as_dict()
            logger.info(
                "finalize_success",
                extra={
                    "structured_data": {
                        "session_id": session_id,
                        "user_id": session.user_id,
                        "duration_ms": duration_ms,
                        "override": override,
                        "correlation_id": correlation_id,
                    }
                },
            )
            return result

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
            try:
                session = self._resolve_session(db, session_id)
            except SessionNotFoundError:
                logger.warning(
                    "finalize_audit_session_missing",
                    extra={
                        "structured_data": {
                            "session_id": session_id,
                            "correlation_id": correlation_id,
                        }
                    },
                )
                raise
            if session.status == SessionStatus.completed:
                logger.info(
                    "finalize_audit_already_completed",
                    extra={
                        "structured_data": {
                            "session_id": session_id,
                            "user_id": session.user_id,
                            "correlation_id": correlation_id,
                        }
                    },
                )
                raise SessionFinalizedError()
            validation = ValidationReport.from_mapping(run_session_validations(db, session_id))
            if not validation.ready and not skip_validation:
                logger.warning(
                    "finalize_audit_validation_failed",
                    extra={
                        "structured_data": {
                            "session_id": session_id,
                            "issues": validation.issues_list(),
                            "correlation_id": correlation_id,
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

            scorer = self._registry.scorer(self._instrument_id(session))
            scorer_result: dict[str, Any] = {"ok": False}
            started = perf_counter()
            try:
                scorer_result = scorer.finalize(db, session_id, skip_checks=skip_validation)
                if not scorer_result.get("ok"):
                    logger.warning(
                        "finalize_audit_scorer_issue",
                        extra={
                            "structured_data": {
                                "session_id": session_id,
                                "issues": scorer_result.get("issues"),
                                "correlation_id": correlation_id,
                            }
                        },
                    )
                    raise ValidationError(
                        "Pipeline finalisasi mendeteksi masalah",
                        detail={
                            "issues": scorer_result.get("issues"),
                            "diagnostics": scorer_result.get("diagnostics"),
                        },
                    )
                session.status = SessionStatus.completed
                session.end_time = datetime.now(timezone.utc)
                db.commit()
            except DomainError:
                db.rollback()
                raise
            except Exception as exc:  # pragma: no cover
                db.rollback()
                self._log_runtime_error(
                    event="finalize_audit_runtime_error",
                    session_id=session_id,
                    user_id=session.user_id,
                    exc=exc,
                    correlation_id=correlation_id,
                    metadata={"actor_email": actor_email, "action": action},
                )
                scorer_result = {
                    "ok": False,
                    "issues": [
                        {
                            "code": "ENGINE_RUNTIME_ERROR",
                            "detail": str(exc),
                        }
                    ],
                    "diagnostics": {"exception": str(exc)},
                }

            override = skip_validation and not validation.ready
            payload = build_finalize_payload(scorer_result, validation, override=override)
            payload_dict = payload.as_dict()

            # Persist audit in a follow-up small transaction to preserve prior parity
            payload_bytes = None
            if callable(build_payload):
                try:
                    payload_bytes = build_payload(payload_dict)
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
            if payload_bytes:
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
                    pass

            duration_ms = self._measure_duration(started, tracker)
            result = payload_dict
            logger.info(
                "finalize_audit_success",
                extra={
                    "structured_data": {
                        "session_id": session_id,
                        "user_id": session.user_id,
                        "duration_ms": duration_ms,
                        "override": override,
                        "actor": actor_email,
                        "correlation_id": correlation_id,
                    }
                },
            )
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
