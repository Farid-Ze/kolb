from __future__ import annotations

import asyncio
from typing import Any, Dict, Optional, TYPE_CHECKING

from sqlalchemy.orm import Session

from app.services.engine import EngineSessionService
from app.schemas.session import SessionAutosavePayload, SessionSubmissionPayload

if TYPE_CHECKING:
    from app.models.klsi.user import User


class AsyncEngineSessionService:
    """
    Asynchronous wrapper for EngineSessionService.
    
    This service uses asyncio.to_thread to offload blocking synchronous 
    operations (DB access, heavy computation) to a thread pool, allowing 
    the main event loop to remain responsive.
    
    This is part of the Phase 3: Transisi No-GIL / Refaktor Async audit.
    """

    def __init__(self, db: Session) -> None:
        self._sync_service = EngineSessionService(db)

    async def start_session(
        self,
        user: "User",
        *,
        instrument_code: str,
        instrument_version: Optional[str] = None,
    ):
        return await asyncio.to_thread(
            self._sync_service.start_session,
            user,
            instrument_code=instrument_code,
            instrument_version=instrument_version,
        )

    async def delivery_package(
        self, session_id: int, user: "User", *, locale: str | None = None
    ) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._sync_service.delivery_package,
            session_id,
            user,
            locale=locale,
        )

    async def session_state(
        self,
        session_id: int,
        user: "User",
        *,
        locale: str | None = None,
    ) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._sync_service.session_state,
            session_id,
            user,
            locale=locale,
        )

    async def autosave_responses(
        self,
        session_id: int,
        user: "User",
        payload: SessionAutosavePayload,
        *,
        locale: str | None = None,
    ) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._sync_service.autosave_responses,
            session_id,
            user,
            payload,
            locale=locale,
        )

    async def submit_full_batch(
        self,
        session_id: int,
        user: "User",
        payload: SessionSubmissionPayload,
    ) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._sync_service.submit_full_batch,
            session_id,
            user,
            payload,
        )

    async def submit_interaction(
        self,
        session_id: int,
        user: "User",
        payload: Dict[str, Any],
    ) -> None:
        await asyncio.to_thread(
            self._sync_service.submit_interaction,
            session_id,
            user,
            payload,
        )

    async def submit_single_response(
        self,
        session_id: int,
        user: "User",
        item_id: int,
        response_map: Dict[str, int],
    ) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._sync_service.submit_single_response,
            session_id,
            user,
            item_id,
            response_map,
        )

    async def finalize_session(self, session_id: int, user: "User") -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._sync_service.finalize_session,
            session_id,
            user,
        )

    async def force_finalize(
        self,
        session_id: int,
        mediator: "User",
        *,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._sync_service.force_finalize,
            session_id,
            mediator,
            reason=reason,
        )

    async def build_report(self, session_id: int, viewer: "User") -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._sync_service.build_report,
            session_id,
            viewer,
        )

    async def ensure_access(self, session_id: int, user: "User") -> None:
        await asyncio.to_thread(
            self._sync_service.ensure_access,
            session_id,
            user,
        )

    async def validation_snapshot(self, session_id: int, user: "User") -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._sync_service.validation_snapshot,
            session_id,
            user,
        )
