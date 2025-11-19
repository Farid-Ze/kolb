from __future__ import annotations

from collections import defaultdict
from typing import Any, Callable, Dict, Iterable, Optional, Sequence, TYPE_CHECKING

from sqlalchemy.orm import Session

from app.core.errors import (
    ConfigurationError,
    DomainError,
    InvalidAssessmentData,
    PermissionDeniedError,
    SessionFinalizedError,
    SessionNotFoundError,
)
from app.db.repositories.assessment import LFIContextRepository, UserResponseRepository
from app.db.repositories.sessions import SessionRepository
from app.engine.runtime import runtime
from app.models.klsi.enums import SessionStatus
from app.schemas.session import (
    AutosaveItemRank,
    LegacyItemSubmissionPayload,
    SessionAutosavePayload,
    SessionSubmissionPayload,
)
from app.services.validation import run_session_validations, validate_full_submission_payload
from app.i18n.id_messages import SessionErrorMessages, ValidationMessages

if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.assessment import AssessmentSession
    from app.models.klsi.items import UserResponse
    from app.models.klsi.learning import LFIContextScore
    from app.models.klsi.user import User


class EngineSessionService:
    """High-level orchestration helpers for engine session endpoints."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self._sessions = SessionRepository(db)
        self._responses = UserResponseRepository(db)
        self._contexts = LFIContextRepository(db)

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

    def session_state(
        self,
        session_id: int,
        user: "User",
        *,
        locale: str | None = None,
    ) -> Dict[str, Any]:
        session = self._load_authorized_session(session_id, user)
        delivery = runtime.delivery_package(self.db, session_id, locale=locale)
        items = delivery.get("items", []) if isinstance(delivery, dict) else []
        responses = self._responses.list_with_choices(session_id)
        response_map = self._build_response_map(responses)
        contexts = self._contexts.list_for_session(session_id)
        response_payload = self._order_responses(items, response_map)
        contexts_payload = self._build_context_payload(contexts)
        total_items = len(items)
        completed_items = sum(1 for ranks in response_map.values() if self._is_complete_response(ranks))
        progress = (completed_items / total_items) * 100 if total_items else 0.0
        next_index = self._next_incomplete_index(items, response_map)
        return {
            "session_id": session.id,
            "instrument_code": session.assessment_id,
            "instrument_version": session.assessment_version,
            "status": session.status.value,
            "delivery": delivery,
            "responses": response_payload,
            "contexts": contexts_payload,
            "total_items": total_items,
            "completed_items": completed_items,
            "progress": progress,
            "current_item_index": next_index,
        }

    def autosave_responses(
        self,
        session_id: int,
        user: "User",
        payload: SessionAutosavePayload,
        *,
        locale: str | None = None,
    ) -> Dict[str, Any]:
        self._load_authorized_session(session_id, user)
        if not payload.responses:
            return {"saved_count": 0}
        delivery = runtime.delivery_package(self.db, session_id, locale=locale)
        items = delivery.get("items", []) if isinstance(delivery, dict) else []
        option_lookup = self._build_option_lookup(items)
        saved = 0
        for entry in payload.responses:
            normalized = self._convert_autosave_ranks(entry, option_lookup)
            submission = LegacyItemSubmissionPayload(item_id=entry.item_id, ranks=normalized)
            runtime.submit_payload(self.db, session_id, submission.runtime_payload())
            saved += 1
        return {"saved_count": saved}

    def submit_full_batch(
        self,
        session_id: int,
        user: "User",
        payload: SessionSubmissionPayload,
    ) -> Dict[str, Any]:
        try:
            session = self._load_authorized_session(session_id, user)
            if session.status == SessionStatus.completed:
                raise SessionFinalizedError()

            # Validate before recording any ranks to ensure we never persist partial batches.
            validate_full_submission_payload(self.db, payload)

            self._persist_batch_payload(session_id, payload)
            self.db.commit()
        except DomainError:
            self.db.rollback()
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
        session = self._load_authorized_session(session_id, user)
        if session.status == SessionStatus.completed:
            raise SessionFinalizedError(SessionErrorMessages.ALREADY_COMPLETED)
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

    def validation_snapshot(self, session_id: int, user: "User") -> Dict[str, Any]:
        """Return validation diagnostics once access is confirmed."""

        self._load_authorized_session(session_id, user)
        return run_session_validations(self.db, session_id)

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
                self._responses.record_response(
                    session_id=session_id,
                    item_id=item.item_id,
                    choice_id=int(choice_id),
                    rank_value=int(rank_value),
                )
        for ctx in payload.contexts:
            self._contexts.record_context(
                session_id=session_id,
                context_name=ctx.context_name,
                CE=ctx.CE,
                RO=ctx.RO,
                AC=ctx.AC,
                AE=ctx.AE,
            )

    def _build_response_map(self, responses: Sequence["UserResponse"]) -> dict[int, dict[str, int]]:
        response_map: dict[int, dict[str, int]] = defaultdict(dict)
        for response in responses:
            choice = getattr(response, "choice", None)
            learning_mode = getattr(choice, "learning_mode", None) if choice is not None else None
            if not learning_mode:
                continue
            response_map[int(response.item_id)][learning_mode.value] = int(response.rank_value)
        return response_map

    @staticmethod
    def _order_responses(items: Sequence[Any], response_map: dict[int, dict[str, int]]) -> list[dict[str, Any]]:
        ordered: list[dict[str, Any]] = []
        for item in items:
            item_id = EngineSessionService._coerce_item_id(item)
            if item_id is None:
                continue
            ranks = response_map.get(int(item_id))
            if not ranks:
                continue
            ordered.append({"item_id": int(item_id), "ranks": ranks})
        return ordered

    @staticmethod
    def _build_context_payload(contexts: Sequence["LFIContextScore"]) -> list[dict[str, Any]]:
        payload: list[dict[str, Any]] = []
        for ctx in contexts:
            payload.append(
                {
                    "context_name": ctx.context_name,
                    "CE": ctx.CE_rank,
                    "RO": ctx.RO_rank,
                    "AC": ctx.AC_rank,
                    "AE": ctx.AE_rank,
                }
            )
        return payload

    @staticmethod
    def _coerce_item_id(item: Any) -> int | None:
        if isinstance(item, dict):
            identifier = item.get("id")
        else:
            identifier = getattr(item, "id", None)
        try:
            if identifier is None:
                return None
            return int(identifier)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _is_complete_response(ranks: dict[str, int] | None) -> bool:
        if not ranks or len(ranks) != 4:
            return False
        values = list(ranks.values())
        return sorted(values) == [1, 2, 3, 4]

    def _next_incomplete_index(
        self,
        items: Sequence[Any],
        response_map: dict[int, dict[str, int]],
    ) -> int:
        if not items:
            return 0
        for index, item in enumerate(items):
            item_id = self._coerce_item_id(item)
            ranks = response_map.get(item_id) if item_id is not None else None
            if not self._is_complete_response(ranks):
                return index
        return max(len(items) - 1, 0)

    @staticmethod
    def _build_option_lookup(items: Sequence[Any]) -> dict[tuple[int, str], int]:
        lookup: dict[tuple[int, str], int] = {}
        for item in items:
            item_id = EngineSessionService._coerce_item_id(item)
            if item_id is None:
                continue
            if isinstance(item, dict):
                options = item.get("options")
            else:
                options = getattr(item, "options", None)
            if not isinstance(options, Iterable):
                continue
            for option in options:
                if isinstance(option, dict):
                    code = option.get("learning_mode") or option.get("option_code")
                    choice_id = option.get("id")
                else:
                    code = getattr(option, "learning_mode", None)
                    choice_id = getattr(option, "id", None)
                if code is None or choice_id is None:
                    continue
                try:
                    lookup[(int(item_id), str(code).upper())] = int(choice_id)
                except (TypeError, ValueError):
                    continue
        return lookup

    def _convert_autosave_ranks(
        self,
        entry: AutosaveItemRank,
        option_lookup: dict[tuple[int, str], int],
    ) -> dict[int, int]:
        normalized: dict[int, int] = {}
        for option_code, rank in entry.ranks.items():
            choice_id = option_lookup.get((entry.item_id, option_code))
            if choice_id is None:
                raise InvalidAssessmentData(
                    ValidationMessages.ITEM_OPTION_NOT_FOUND,
                    detail={"item_id": entry.item_id, "option_code": option_code},
                )
            normalized[int(choice_id)] = int(rank)
        return normalized

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