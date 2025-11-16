from __future__ import annotations

from typing import Any, Callable, Dict, Optional, TYPE_CHECKING

from sqlalchemy.orm import Session

from app.core.errors import (
    ConfigurationError,
    DomainError,
    PermissionDeniedError,
    SessionFinalizedError,
    SessionNotFoundError,
)
from app.db.repositories.sessions import SessionRepository
from app.engine.runtime import runtime
from app.models.klsi.enums import SessionStatus
from app.models.klsi.learning import LFIContextScore
from app.models.klsi.items import UserResponse
from app.schemas.session import SessionSubmissionPayload
from app.services.validation import validate_full_submission_payload
from app.i18n.id_messages import SessionErrorMessages

if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.assessment import AssessmentSession
    from app.models.klsi.user import User


class EngineSessionService:
    """High-level orchestration helpers for engine session endpoints."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self._sessions = SessionRepository(db)

    def start_session(
        self,
        user: "User",
        *,
        instrument_code: str,
        instrument_version: Optional[str] = None,
    ):
        return runtime.start_session(
            self.db,
            user,
            instrument_code=instrument_code,
            instrument_version=instrument_version,
        )

    def delivery_package(self, session_id: int, user: "User", *, locale: str | None = None) -> Dict[str, Any]:
        self._load_authorized_session(session_id, user)
        return runtime.delivery_package(self.db, session_id, locale=locale)

    def submit_full_batch(
        self,
        session_id: int,
        user: "User",
        payload: SessionSubmissionPayload,
    ) -> Dict[str, Any]:
        session = self._load_authorized_session(session_id, user)
        if session.status == SessionStatus.completed:
            raise SessionFinalizedError()

        # Fail fast before touching persistence
        validate_full_submission_payload(self.db, payload)

        try:
            with self.db.begin():
                self._persist_batch_payload(session_id, payload)
        except DomainError:
            raise
        except Exception as exc:  # pragma: no cover - defensive guard for DB errors
            self.db.rollback()
            raise ConfigurationError(SessionErrorMessages.BATCH_FAILURE) from exc

        result = runtime.finalize_with_audit(
            self.db,
            session_id,
            actor_email=user.email,
            action="FINALIZE_SESSION_ENGINE_BATCH",
            build_payload=self._build_standard_audit_payload(user.email, session_id),
        )
        return self._transform_finalize_result(result, override=result.get("override", False))

    def submit_interaction(
        self,
        session_id: int,
        user: "User",
        payload: Dict[str, Any],
    ) -> None:
        self._load_authorized_session(session_id, user)
        runtime.submit_payload(self.db, session_id, payload)

    def finalize_session(self, session_id: int, user: "User") -> Dict[str, Any]:
        self._load_authorized_session(session_id, user)
        result = runtime.finalize_with_audit(
            self.db,
            session_id,
            actor_email=user.email,
            action="FINALIZE_SESSION_USER",
            build_payload=self._build_standard_audit_payload(user.email, session_id),
        )
        return self._transform_finalize_result(result, override=result.get("override", False))

    def force_finalize(
        self,
        session_id: int,
        mediator: "User",
        *,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        if mediator.role != "MEDIATOR":
            raise PermissionDeniedError(SessionErrorMessages.MEDIATOR_OVERRIDE_FORBIDDEN)

        self._load_authorized_session(session_id, mediator)

        result = runtime.finalize_with_audit(
            self.db,
            session_id,
            actor_email=mediator.email,
            action="FORCE_FINALIZE_SESSION",
            build_payload=self._build_force_override_payload(mediator.email, session_id, reason),
            skip_validation=True,
        )
        payload = self._transform_finalize_result(result, override=True, override_reason=reason)
        payload["override"] = True
        payload["override_reason"] = reason
        return payload

    def build_report(self, session_id: int, viewer: "User") -> Dict[str, Any]:
        self._load_authorized_session(session_id, viewer)
        viewer_role = "MEDIATOR" if viewer.role == "MEDIATOR" else None
        return runtime.build_report(self.db, session_id, viewer_role)

    def ensure_access(self, session_id: int, user: "User") -> None:
        """Expose access guard for routers needing pre-flight checks."""

        self._load_authorized_session(session_id, user)

    def _load_authorized_session(
        self,
        session_id: int,
        user: "User",
    ) -> "AssessmentSession":
        session = self._sessions.get_with_instrument(session_id)
        if not session:
            raise SessionNotFoundError()
        if user.role != "MEDIATOR" and session.user_id != user.id:
            raise PermissionDeniedError(SessionErrorMessages.ACCESS_DENIED)
        return session

    def _persist_batch_payload(self, session_id: int, payload: SessionSubmissionPayload) -> None:
        for item in payload.items:
            for choice_id, rank_value in item.ranks.items():
                self.db.add(
                    UserResponse(
                        session_id=session_id,
                        item_id=item.item_id,
                        choice_id=int(choice_id),
                        rank_value=int(rank_value),
                    )
                )
        for ctx in payload.contexts:
            self.db.add(
                LFIContextScore(
                    session_id=session_id,
                    context_name=ctx.context_name,
                    CE_rank=ctx.CE,
                    RO_rank=ctx.RO,
                    AC_rank=ctx.AC,
                    AE_rank=ctx.AE,
                )
            )

    @staticmethod
    def _build_standard_audit_payload(actor_email: str, session_id: int) -> Callable[[Dict[str, Any]], bytes]:
        def _builder(result: Dict[str, Any]) -> bytes:
            combination = result.get("combination")
            lfi = result.get("lfi")
            if not combination or not lfi:
                return b""
            return (
                f"user:{actor_email};session:{session_id};ACCE:{getattr(combination, 'ACCE_raw', None)};"
                f"AERO:{getattr(combination, 'AERO_raw', None)};LFI:{getattr(lfi, 'LFI_score', None)}"
            ).encode("utf-8")

        return _builder

    @staticmethod
    def _build_force_override_payload(
        mediator_email: str,
        session_id: int,
        reason: Optional[str],
    ) -> Callable[[Dict[str, Any]], bytes]:
        def _builder(result: Dict[str, Any]) -> bytes:
            combination = result.get("combination")
            lfi = result.get("lfi")
            validation = result.get("validation") or {}
            issues = []
            if isinstance(validation, dict):
                issues = validation.get("issues", [])
            issue_codes = ",".join(
                sorted({issue.get("code", "") for issue in issues if isinstance(issue, dict) and issue.get("code")})
            )
            return (
                f"mediator:{mediator_email};session:{session_id};override:true;"
                f"reason:{reason or '-'};issues:{issue_codes or '-'};"
                f"ACCE:{getattr(combination, 'ACCE_raw', None)};AERO:{getattr(lfi, 'LFI_score', None)}"
            ).encode("utf-8")

        return _builder

    @staticmethod
    def _transform_finalize_result(
        result: Dict[str, Any],
        *,
        override: bool,
        override_reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        combination = result.get("combination")
        lfi = result.get("lfi")
        style = result.get("style")
        percentiles = result.get("percentiles")
        per_scale_provenance = getattr(percentiles, "norm_provenance", None) if percentiles is not None else None
        payload: Dict[str, Any] = {
            "ACCE": getattr(combination, "ACCE_raw", None) if combination else None,
            "AERO": getattr(combination, "AERO_raw", None) if combination else None,
            "style_primary_id": getattr(style, "primary_style_type_id", None) if style else None,
            "LFI": getattr(lfi, "LFI_score", None) if lfi else None,
            "delta": result.get("delta"),
            "percentile_sources": per_scale_provenance,
            "validation": result.get("validation"),
            "override": override,
        }
        if override_reason is not None:
            payload["override_reason"] = override_reason
        return payload