import uuid
from collections import defaultdict
from datetime import datetime, timezone
import logging
from typing import Any, Callable, Dict, Iterable, Optional, Sequence, TYPE_CHECKING

from sqlalchemy.orm import Session

from app.assessments.constants import (
    CONTEXT_COUNT_LFI,
    ITEM_COUNT_KLSI4,
    LEARNING_MODES,
    RANK_SUM_PER_ITEM,
)
from app.core.errors import (
    ConfigurationError,
    DomainError,
    InvalidAssessmentData,
    PermissionDeniedError,
    SessionFinalizedError,
    SessionNotFoundError,
)
from app.core.logging import get_logger
from app.db.repositories.assessment import AssessmentItemRepository, LFIContextRepository, UserResponseRepository
from app.db.repositories.sessions import SessionRepository
from app.engine.runtime import runtime
from app.models.klsi.assessment import AssessmentSessionDelta
from app.models.klsi import (
    AssessmentSession,
    LearningMode,
    LFIContextScore,
    SessionStatus,
    UserResponse,
)
from app.models.klsi.enums import ItemType
from app.models.klsi.items import AssessmentItem, AssessmentItemResponse, ItemChoice
from app.models.klsi.learning import (
    BackupLearningStyle,
    CombinationScore,
    LearningFlexibilityIndex,
    ScaleScore,
    UserLearningStyle,
)
from app.models.klsi.norms import PercentileScore
from app.schemas.session import (
    AutosaveItemRank,
    LegacyItemSubmissionPayload,
    SessionAutosavePayload,
    SessionSubmissionPayload,
)
from app.services.validation import run_session_validations, validate_full_submission_payload
from app.i18n.id_messages import SessionErrorMessages, ValidationMessages, DomainErrorMessages
from app.services.assessments import build_kite_coordinates, detect_blindspots, detect_strengths
from app.services.scoring import (
    apply_percentiles,
    compute_combination_scores,
    compute_lfi,
    compute_longitudinal_delta,
)
from app.assessments.klsi_v4.logic import assign_learning_style as logic_assign_learning_style
from app.services.challenge_service import challenge_service
from app.services.gamification_service import gamification_service
from app.services.sphere_service import sphere_service
from app.db.repositories import TeamMemberRepository
from app.services.rollup import compute_and_cache_team_snapshot
from app.services.provenance import _upsert_scale_provenance_sync

if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.user import User


logger = get_logger("kolb.services.engine", component="service")

def finalize_background_task(session_id: uuid.UUID, user_id: int) -> None:
    """
    Background task to finalize a session.
    Creates its own DB session to ensure thread safety and persistence after request scope.
    """
    from app.db.database import SessionLocal
    from app.models.klsi.user import User
    from app.db.repositories import UserRepository
    
    logger.info(f"Starting background finalization for session {session_id}")
    db = SessionLocal()
    try:
        user_repo = UserRepository(db)
        user = user_repo.get_sync(user_id)
        if not user:
            logger.error(f"User {user_id} not found during background finalization")
            return

        service = EngineSessionService(db)
        # Finalize the session logic
        result = service.finalize_session(session_id, user)
        
        # [Correctness Fix] Synchronous Provenance Logging
        if result and "_provenance_payload" in result:
             prov_payload = result.pop("_provenance_payload")
             try:
                 _upsert_scale_provenance_sync(
                     db, 
                     prov_payload['session_id'], 
                     prov_payload['raw_scores'], 
                     prov_payload['percentile_map'], 
                     prov_payload['provenance_map'], 
                     prov_payload['truncations'], 
                     prov_payload.get('algorithm_sha')
                 )
             except Exception as e:
                 logger.error(f"Failed to log provenance in background task: {e}") 

        logger.info(f"Successfully finalized session {session_id}")
        db.commit()
    except Exception as e:
        logger.exception(f"Failed to finalize session {session_id}: {e}")
        db.rollback()
    finally:
        db.close()

class EngineSessionService:
    """High-level orchestration helpers for engine session endpoints."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self._sessions = SessionRepository(db)
        self._responses = UserResponseRepository(db)
        self._contexts = LFIContextRepository(db)
        self._items = AssessmentItemRepository(db)

    def start_session(
        self,
        user: Optional["User"],
        *,
        instrument_code: str,
        instrument_version: Optional[str] = None,
    ):
        return runtime.start_session(
            self.db,
            user,
            instrument_code=instrument_code,
            instrument_version=instrument_version,
            study_id=None,
        )

    def delivery_package(self, session_id: uuid.UUID, user: "User", *, locale: str | None = None, lite: bool = False) -> Dict[str, Any]:
        self._load_authorized_session(session_id, user)
        return runtime.delivery_package(self.db, session_id, locale=locale, lite=lite)

    def session_state(
        self,
        session_id: uuid.UUID,
        user: "User",
        *,
        locale: str | None = None,
    ) -> Dict[str, Any]:
        session = self._load_authorized_session(session_id, user)
        delivery = runtime.delivery_package(self.db, session_id, locale=locale)
        items = delivery.get("items", []) if isinstance(delivery, dict) else []
        responses = self._responses.list_with_choices_sync(session_id)
        response_map = self._build_response_map(responses)
        contexts = self._contexts.list_for_session_sync(session_id)
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
        session_id: uuid.UUID,
        user: "User",
        payload: SessionAutosavePayload,
        *,
        locale: str | None = None,
    ) -> Dict[str, Any]:
        self._load_authorized_session(session_id, user)
        if not payload.responses and not payload.contexts:
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
        
        for ctx in payload.contexts:
            from app.schemas.session import LegacyContextSubmissionPayload
            submission = LegacyContextSubmissionPayload(
                context_name=ctx.context_name,
                CE=ctx.CE,
                RO=ctx.RO,
                AC=ctx.AC,
                AE=ctx.AE,
                overwrite=True
            )
            runtime.submit_payload(self.db, session_id, submission.runtime_payload())
            saved += 1

        return {"saved_count": saved}

    def submit_full_batch(
        self,
        session_id: uuid.UUID,
        user: "User",
        payload: SessionSubmissionPayload,
    ) -> Dict[str, Any]:
        try:
            # [Architecture Fix] Use Repository for Pessimistic Locking
            session = self._sessions.get_with_lock_sync(session_id)
            if not session:
                raise SessionNotFoundError()
            
            self._check_session_access(session, user)

            if session.status == SessionStatus.completed:
                raise SessionFinalizedError()

            # Defensive Validation
            MIN_DURATION_SECONDS = 45
            now = datetime.now(timezone.utc)
            start_time = session.start_time
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=timezone.utc)
            
            if (now - start_time).total_seconds() < MIN_DURATION_SECONDS:
                raise InvalidAssessmentData(ValidationMessages.SUBMISSION_TOO_FAST)

            validate_full_submission_payload(self.db, payload)
            self._persist_batch_payload(session_id, payload)
            
            result = runtime.finalize_with_audit(
                self.db,
                session_id,
                actor_email=user.email if user.email else "guest",
                action="FINALIZE_SESSION_ENGINE_BATCH",
                build_payload=self._build_standard_audit_payload(user.email if user.email else "guest", session_id),
                transactional=True,
            )
            self.db.commit()
            final_result = self._transform_finalize_result(result, override=result.get("override", False))
            
            if "percentiles" in result:
                provenance_payload = getattr(result["percentiles"], "_provenance_payload", None)
                if provenance_payload:
                    final_result["_provenance_payload"] = provenance_payload
            
            self._update_user_team_caches(user.id)
            return final_result
        except DomainError:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            logger.exception("batch_submission_failed", extra={"structured_data": {"error": str(exc)}})
            raise ConfigurationError(SessionErrorMessages.BATCH_FAILURE) from exc

    def submit_interaction(
        self,
        session_id: uuid.UUID,
        user: "User",
        payload: Dict[str, Any],
    ) -> None:
        self._load_authorized_session(session_id, user)
        runtime.submit_payload(self.db, session_id, payload)

    def finalize_session(self, session_id: uuid.UUID, user: "User") -> Dict[str, Any]:
        session = self._load_authorized_session(session_id, user)
        if session.status == SessionStatus.completed:
            raise SessionFinalizedError(SessionErrorMessages.ALREADY_COMPLETED)
        use_native = self._should_use_native_pipeline(session.id)
        if use_native:
            result = self._finalize_native_session(session)
        else:
            result = runtime.finalize_with_audit(
                self.db,
                session_id,
                actor_email=user.email,
                action="FINALIZE_SESSION_USER",
                build_payload=self._build_standard_audit_payload(user.email, session_id),
            )
        snapshot = self._persist_results_snapshot(session_id, result)
        blindspots = snapshot.get("blindspots", [])

        self._safe_assign_growth_challenges(user.id, blindspots)
        self._safe_apply_gamification(user.id)
        self._safe_create_sphere_event(user.id, session_id)

        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        final_result = self._transform_finalize_result(result, override=result.get("override", False))
        
        provenance_payload = None
        if "percentiles" in result:
             provenance_payload = getattr(result["percentiles"], "_provenance_payload", None)

        if provenance_payload:
            final_result["_provenance_payload"] = provenance_payload
                  
        self._update_user_team_caches(user.id)
        return final_result

    def force_finalize(
        self,
        session_id: uuid.UUID,
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

    def build_report(self, session_id: uuid.UUID, viewer: "User") -> Dict[str, Any]:
        self._load_authorized_session(session_id, viewer)
        viewer_role = "MEDIATOR" if viewer.role == "MEDIATOR" else None
        return runtime.build_report(self.db, session_id, viewer_role)

    def _should_use_native_pipeline(self, session_id: uuid.UUID) -> bool:
        """Return True when assessment_item_responses + LFI contexts are complete."""
        # [Architecture Fix] Use Repository methods instead of direct query
        response_count = self._responses.count_by_session(session_id)
        if response_count < ITEM_COUNT_KLSI4 * len(LEARNING_MODES):
            return False
        
        context_count = self._contexts.count_by_session(session_id)
        return context_count >= CONTEXT_COUNT_LFI

    def _finalize_native_session(self, session: "AssessmentSession") -> Dict[str, Any]:
        rows = self._load_native_responses(session.id)
        totals = self._summarize_forced_choice_rows(rows)
        scale = self._upsert_scale_score(session.id, totals)
        self._reset_session_artifacts(session.id)
        combo = compute_combination_scores(self.db, scale)
        style, intensity_metrics = logic_assign_learning_style(self.db, combo)
        percentiles = self._apply_percentiles_native(session.id, scale, combo)
        lfi = self._compute_lfi_native(session.id)
        delta = self._compute_delta_native(session.id, combo, lfi, intensity_metrics)
        session.status = SessionStatus.completed
        session.end_time = datetime.now(timezone.utc)
        session.pipeline_version = "native:v1"
        self.db.flush()
        result = {
            "combination": combo,
            "style": style,
            "lfi": lfi,
            "percentiles": percentiles,
            "delta": delta,
            "validation": {"ready": True, "issues": [], "diagnostics": {}},
            "override": False,
        }
        return result

    def _load_native_responses(
        self,
        session_id: uuid.UUID,
    ) -> list[tuple[UserResponse, int, LearningMode | None]]:
        rows = self._responses.get_native_responses_sync(session_id)
        if not rows:
            raise InvalidAssessmentData(ValidationMessages.ITEMS_INCOMPLETE)
        return rows

    def _summarize_forced_choice_rows(
        self,
        rows: Sequence[tuple[UserResponse, int, LearningMode | None]],
    ) -> dict[str, int]:
        totals = {mode: 0 for mode in LEARNING_MODES}
        per_item_ranks: dict[int, list[int]] = defaultdict(list)
        expected_per_item = sorted(range(1, len(LEARNING_MODES) + 1))
        for response, assessment_item_id, learning_mode in rows:
            if learning_mode is None:
                raise InvalidAssessmentData(SessionErrorMessages.ITEM_OPTION_NOT_FOUND)
            rank = int(response.rank_value)
            if rank < 1 or rank > len(LEARNING_MODES):
                raise InvalidAssessmentData(ValidationMessages.ITEM_RANK_PERMUTATION)
            mode_key = learning_mode.value
            if mode_key not in totals:
                raise InvalidAssessmentData(SessionErrorMessages.ITEM_OPTION_NOT_FOUND)
            per_item_ranks[int(assessment_item_id)].append(rank)
            totals[mode_key] += rank
        if len(per_item_ranks) != ITEM_COUNT_KLSI4:
            raise InvalidAssessmentData(ValidationMessages.ITEMS_INCOMPLETE)
        for ranks in per_item_ranks.values():
            if sorted(ranks) != expected_per_item:
                raise InvalidAssessmentData(ValidationMessages.ITEM_RANK_PERMUTATION)
        expected_total = ITEM_COUNT_KLSI4 * RANK_SUM_PER_ITEM
        actual_total = sum(totals.values())
        if actual_total != expected_total:
            raise InvalidAssessmentData(ValidationMessages.ITEM_RANK_GAPS)
        return totals

    def _upsert_scale_score(self, session_id: uuid.UUID, totals: dict[str, int]) -> ScaleScore:
        return self._sessions.upsert_scale_score_sync(
            session_id,
            totals["CE"],
            totals["RO"],
            totals["AC"],
            totals["AE"],
        )

    def _reset_session_artifacts(self, session_id: uuid.UUID) -> None:
        self._sessions.reset_artifacts_sync(session_id)

    def _apply_percentiles_native(
        self,
        session_id: uuid.UUID,
        scale: ScaleScore,
        combo: CombinationScore,
    ) -> PercentileScore:
        return apply_percentiles(self.db, scale, combo)

    def _compute_lfi_native(self, session_id: uuid.UUID) -> LearningFlexibilityIndex:
        return compute_lfi(self.db, session_id)

    def _compute_delta_native(
        self,
        session_id: uuid.UUID,
        combo: CombinationScore,
        lfi: LearningFlexibilityIndex,
        intensity_metrics: Any,
    ) -> AssessmentSessionDelta | None:
        return compute_longitudinal_delta(
            self.db,
            session_id,
            combo,
            lfi,
            intensity_metrics,
        )

    def ensure_access(self, session_id: uuid.UUID, user: "User") -> None:
        self._load_authorized_session(session_id, user)

    def validation_snapshot(self, session_id: uuid.UUID, user: "User") -> Dict[str, Any]:
        self._load_authorized_session(session_id, user)
        return run_session_validations(self.db, session_id)

    def _check_session_access(self, session: "AssessmentSession", user: "User") -> None:
        is_guest = getattr(user, "is_guest", False)
        if is_guest:
            if not session.guest_token or session.guest_token != user.guest_token:
                 raise PermissionDeniedError(DomainErrorMessages.PERMISSION_DENIED)
            return

        if user.role != "MEDIATOR" and session.user_id != user.id:
            raise PermissionDeniedError(DomainErrorMessages.PERMISSION_DENIED)

    def _load_authorized_session(
        self,
        session_id: uuid.UUID,
        user: "User",
    ) -> "AssessmentSession":
        session = self._sessions.get_with_instrument_sync(session_id)
        if not session:
            raise SessionNotFoundError()
            
        self._check_session_access(session, user)
        return session

    def _persist_batch_payload(self, session_id: uuid.UUID, payload: SessionSubmissionPayload) -> None:
        for item in payload.items:
            for r in item.ranks:
                self._responses.record_response_sync(
                    session_id=session_id,
                    item_id=item.item_id,
                    choice_id=int(r.choice_id),
                    rank_value=int(r.rank),
                )
        for ctx in payload.contexts:
            self._contexts.record_context_sync(
                session_id=session_id,
                context_name=ctx.context_name,
                CE=ctx.CE,
                RO=ctx.RO,
                AC=ctx.AC,
                AE=ctx.AE,
            )
        self.db.flush()

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
    def _build_standard_audit_payload(actor_email: str, session_id: uuid.UUID) -> Callable[[Dict[str, Any]], bytes]:
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
        session_id: uuid.UUID,
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
            "norm_group_used": getattr(percentiles, "norm_group_used", None) if percentiles else None,
            "norm_version_used": getattr(percentiles, "norm_version_used", None) if percentiles else None,
            "validation": result.get("validation"),
            "override": override,
        }
        if override_reason is not None:
            payload["override_reason"] = override_reason
        return payload

    def _persist_results_snapshot(self, session_id: uuid.UUID, result: Dict[str, Any]) -> Dict[str, Any]:
        session = self._sessions.get_with_details_sync(session_id)
        if not session:
            return {}

        kite_coordinates = build_kite_coordinates(session)
        blindspots = detect_blindspots(kite_coordinates)
        strengths = detect_strengths(kite_coordinates)

        percentiles_payload = self._percentiles_payload(
            result.get("percentiles"), getattr(session, "percentile_score", None)
        )
        runtime_lfi = result.get("lfi")
        lfi_score = getattr(runtime_lfi, "LFI_score", None)
        if lfi_score is None:
            lfi_score = getattr(getattr(session, "lfi_index", None), "LFI_score", None)

        results = {
            "kite_coordinates": kite_coordinates,
            "lfi_score": lfi_score,
            "percentiles": percentiles_payload,
            "blindspots": blindspots,
            "strengths": strengths,
        }
        session.results_json = results
        return results

    def _update_user_team_caches(self, user_id: int) -> None:
        try:
            team_repo = TeamMemberRepository(self.db)
            memberships = team_repo.list_by_user_sync(user_id)
            for membership in memberships:
                compute_and_cache_team_snapshot(self.db, membership.team_id)
        except Exception as e:
            logger.error(f"Failed to update team cache for user {user_id}: {e}")

    @staticmethod
    def _percentiles_payload(runtime_percentiles: Any, model_percentiles: Any) -> Optional[Dict[str, Any]]:
        source = runtime_percentiles or model_percentiles
        if not source:
            return None
        if isinstance(source, dict):
            return {
                "CE": source.get("CE"),
                "RO": source.get("RO"),
                "AC": source.get("AC"),
                "AE": source.get("AE"),
                "ACCE": source.get("ACCE"),
                "AERO": source.get("AERO"),
                "norm_group": source.get("norm_group"),
                "norm_version": source.get("norm_version"),
            }
        return {
            "CE": getattr(source, "CE_percentile", None),
            "RO": getattr(source, "RO_percentile", None),
            "AC": getattr(source, "AC_percentile", None),
            "AE": getattr(source, "AE_percentile", None),
            "ACCE": getattr(source, "ACCE_percentile", None),
            "AERO": getattr(source, "AERO_percentile", None),
            "norm_group": getattr(source, "norm_group_used", None),
            "norm_version": getattr(source, "norm_version_used", None),
        }

    def _safe_assign_growth_challenges(self, user_id: int, blindspots: list[str]) -> None:
        deficiency_codes = [f"{dimension}_low" for dimension in blindspots]
        if not deficiency_codes:
            return
        try:
            challenge_service.assign_challenges_for_deficiencies(
                self.db,
                user_id,
                deficiency_codes,
            )
        except Exception:
            logger.exception(
                "assign_growth_challenge_failed",
                extra={"structured_data": {"user_id": user_id, "deficiencies": deficiency_codes}},
            )

    def _safe_apply_gamification(self, user_id: int) -> None:
        try:
            gamification_service.award_badge(self.db, user_id, "the-seeker")
            gamification_service.add_points(self.db, user_id, 100)
        except Exception:
            logger.exception(
                "gamification_award_failed",
                extra={"structured_data": {"user_id": user_id, "badge": "the-seeker"}},
            )

    def _safe_create_sphere_event(self, user_id: int, session_id: uuid.UUID) -> None:
        try:
            sphere_service.create_node_for_event(
                self.db, 
                user_id, 
                "assessment_completed", 
                {"session_id": str(session_id)}
            )
        except Exception:
            logger.exception(
                "sphere_node_creation_failed",
                extra={"structured_data": {"user_id": user_id, "session_id": session_id}},
            )

    def submit_single_response(self, session_id: uuid.UUID, user: "User", item_id: int, response_map: Dict[str, int]) -> Dict[str, Any]:
        self._load_authorized_session(session_id, user)
        
        choices = self._items.get_choices_sync(item_id)
        if not choices:
            raise DomainError(f"Item {item_id} not found or has no choices")

        ranks = {}
        for choice in choices:
            mode_code = choice.learning_mode.name if hasattr(choice.learning_mode, "name") else str(choice.learning_mode)
            if mode_code in response_map:
                ranks[choice.id] = response_map[mode_code]
        
        if len(ranks) != 4:
            raise InvalidAssessmentData("Could not map all 4 dimensions to choices for this item")

        runtime_payload = {
            "kind": "item",
            "item_id": item_id,
            "ranks": ranks,
        }

        runtime.submit_payload(self.db, session_id, runtime_payload)

        # Use repo count
        responded_count = self._responses.count_by_session(session_id)
        progress = min(100.0, (responded_count / 12.0) * 100.0)
        return {"status": "synced", "progress": progress}

    def record_telemetry(
        self,
        session_id: uuid.UUID,
        user: "User",
        item_id: int,
        response_rank: int | None = None,
        response_latency_ms: int | None = None,
        blur_events: int | None = None,
        meta: dict[str, Any] | None = None,
    ) -> None:
        self._load_authorized_session(session_id, user)
        
        item_response = self._responses.get_response_sync(session_id, item_id)

        if item_response:
            if response_rank is not None:
                item_response.response_rank = response_rank
            if response_latency_ms is not None:
                item_response.response_latency_ms = response_latency_ms
            
            telemetry_data = dict(item_response.telemetry or {})
            if blur_events is not None:
                telemetry_data["blur_events"] = blur_events
            if meta:
                telemetry_data["meta"] = meta
            item_response.telemetry = telemetry_data
            
            self.db.commit()
