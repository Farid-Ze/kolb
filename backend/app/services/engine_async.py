from __future__ import annotations

from typing import Any, Dict, TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import (
    DomainError,
    PermissionDeniedError,
    SessionFinalizedError,
    SessionNotFoundError,
)
from app.core.logging import get_logger
from app.db.repositories.assessment import (
    AsyncUserResponseRepository,
    AsyncLFIContextRepository,
)
from app.db.repositories.sessions import AsyncSessionRepository
from app.engine.runtime import runtime
from app.models.klsi.enums import SessionStatus
from app.schemas.session import SessionSubmissionPayload
from app.services.validation import validate_full_submission_payload_async
from app.i18n.id_messages import SessionErrorMessages
from app.services.engine import EngineSessionService

if TYPE_CHECKING:
    from app.models.klsi.user import User

logger = get_logger("kolb.services.engine_async", component="service")


class AsyncEngineSessionService:
    """High-level orchestration helpers for engine session endpoints (Async)."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self._sessions = AsyncSessionRepository(db)
        self._responses = AsyncUserResponseRepository(db)
        self._contexts = AsyncLFIContextRepository(db)

    async def submit_full_batch(
        self,
        session_id: int,
        user: "User",
        payload: SessionSubmissionPayload,
    ) -> Dict[str, Any]:
        try:
            session = await self._load_authorized_session(session_id, user)
            if session.status == SessionStatus.completed:
                raise SessionFinalizedError()

            # Validate before recording any ranks to ensure we never persist partial batches.
            await validate_full_submission_payload_async(self.db, payload)

            await self._persist_batch_payload(session_id, payload)
            
            # Use the async wrapper for finalize
            result = await runtime.finalize_with_audit_async(
                self.db,
                session_id,
                actor_email=user.email,
                action="FINALIZE_SESSION_ENGINE_BATCH",
                build_payload=EngineSessionService._build_standard_audit_payload(user.email, session_id),
            )
            
            await self.db.commit()
            return EngineSessionService._transform_finalize_result(result, override=result.get("override", False))
        except DomainError:
            await self.db.rollback()
            raise
        except Exception as exc:
            await self.db.rollback()
            logger.exception("async_batch_submit_failed", extra={"session_id": session_id})
            raise

    async def _load_authorized_session(
        self,
        session_id: int,
        user: "User",
    ) -> Any:
        session = await self._sessions.get_with_instrument(session_id)
        if not session:
            raise SessionNotFoundError()
        if user.role != "MEDIATOR" and session.user_id != user.id:
            raise PermissionDeniedError(SessionErrorMessages.ACCESS_DENIED)
        return session

    async def _persist_batch_payload(self, session_id: int, payload: SessionSubmissionPayload) -> None:
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
        # Flush to ensure runtime validations (autoflush disabled) observe the newly inserted ranks.
        await self.db.flush()
