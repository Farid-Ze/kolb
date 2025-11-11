from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache
from hashlib import sha256
from time import perf_counter
from typing import Callable
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.engine.authoring import get_instrument_locale_resource, get_instrument_spec
from app.engine.interfaces import InstrumentId
from app.engine.pipelines import assign_pipeline_version
from app.engine.registry import engine_registry
from app.engine.runtime_logic import (
    ValidationReport,
    build_finalize_payload,
    compose_delivery_payload,
)
from app.models.klsi import AssessmentSession, SessionStatus, User, AuditLog
from app.services.validation import run_session_validations
from app.db.database import get_repository_provider
from app.core.metrics import timeit, measure_time, count_calls
from app.core.logging import correlation_context, get_logger


logger = get_logger("kolb.engine.runtime", component="engine")


class EngineRuntime:
    """Co-ordinates pluggable assessment instruments via the engine registry."""

    def __init__(self) -> None:
        self._registry = engine_registry

    def _resolve_session(self, db: Session, session_id: int) -> AssessmentSession:
        repo_provider = get_repository_provider(db)
        repo = repo_provider.sessions
        session = repo.get_by_id(session_id)
        if not session:
            logger.warning(
                "session_not_found",
                extra={"structured_data": {"session_id": session_id}},
            )
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
                raise HTTPException(status_code=404, detail="Instrumen tidak ditemukan")

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
                raise HTTPException(
                    status_code=400,
                    detail="Instrument plugin belum terdaftar di engine",
                ) from None
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
            try:
                session = self._resolve_session(db, session_id)
            except HTTPException as exc:
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
                raise HTTPException(status_code=409, detail="Sesi sudah selesai")
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
                raise HTTPException(
                    status_code=400,
                    detail={
                        "issues": validation.issues_list(),
                        "diagnostics": validation.diagnostics_dict(),
                    },
                )

            scorer = self._registry.scorer(self._instrument_id(session))
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
                        raise HTTPException(
                            status_code=400,
                            detail={
                                "issues": scorer_result.get("issues"),
                                "diagnostics": scorer_result.get("diagnostics"),
                            },
                        )
                    session.status = SessionStatus.completed
                    session.end_time = datetime.now(timezone.utc)
            except HTTPException:
                raise
            except Exception as exc:  # pragma: no cover - defensive rollback
                logger.exception(
                    "finalize_runtime_error",
                    extra={
                        "structured_data": {
                            "session_id": session_id,
                            "user_id": session.user_id,
                            "correlation_id": correlation_id,
                        }
                    },
                )
                raise HTTPException(status_code=500, detail="Gagal menyelesaikan sesi") from exc
            duration_ms = (perf_counter() - started) * 1000.0
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
            try:
                session = self._resolve_session(db, session_id)
            except HTTPException:
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
                raise HTTPException(status_code=409, detail="Sesi sudah selesai")
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
                raise HTTPException(
                    status_code=400,
                    detail={
                        "issues": validation.issues_list(),
                        "diagnostics": validation.diagnostics_dict(),
                    },
                )

            scorer = self._registry.scorer(self._instrument_id(session))
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
                    raise HTTPException(
                        status_code=400,
                        detail={
                            "issues": scorer_result.get("issues"),
                            "diagnostics": scorer_result.get("diagnostics"),
                        },
                    )
                session.status = SessionStatus.completed
                session.end_time = datetime.now(timezone.utc)
                db.commit()
            except HTTPException:
                db.rollback()
                raise
            except Exception as exc:  # pragma: no cover
                db.rollback()
                logger.exception(
                    "finalize_audit_runtime_error",
                    extra={
                        "structured_data": {
                            "session_id": session_id,
                            "user_id": session.user_id,
                            "correlation_id": correlation_id,
                        }
                    },
                )
                raise HTTPException(status_code=500, detail="Gagal menyelesaikan sesi") from exc

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

            duration_ms = (perf_counter() - started) * 1000.0
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
def _cached_manifest(instrument_code: str, instrument_version: str):  # pragma: no cover - pure cache
    try:
        return get_instrument_spec(instrument_code, instrument_version).manifest()
    except KeyError:
        return None


@lru_cache(maxsize=256)
def _cached_locale(instrument_code: str, instrument_version: str, locale: str):  # pragma: no cover - pure cache
    try:
        return get_instrument_locale_resource(instrument_code, instrument_version, locale)
    except KeyError:
        return None
