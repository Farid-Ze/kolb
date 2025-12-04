import uuid
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException

from app.db.database import get_db
from app.db.repositories import SessionRepository
from app.i18n.id_messages import SessionErrorMessages
from app.schemas.report import ReportPayload, ReportSummaryPayload, as_report_payload
from app.schemas.report_share import ReportShareCreate, ReportShareOut
from app.services.report import build_report
from app.services.report_summary import list_report_summaries
from app.services.report_share import (
    ReportShareService,
    SharePermissionError,
    ShareValidationError,
)
from app.core.cache import cached
from app.services.security import get_current_user, get_current_user_optional, get_current_user_or_guest
from fastapi.concurrency import run_in_threadpool

router = APIRouter(prefix="/reports", tags=["reports"])

def report_key_builder(session_id: uuid.UUID, viewer=None, *args, **kwargs) -> str:
    viewer_part = f"user:{viewer.id}" if getattr(viewer, "id", None) else f"guest:{getattr(viewer, 'guest_token', 'anon')}"
    role_part = getattr(viewer, "role", "anon")
    return f"report:{session_id}:viewer:{viewer_part}:role:{role_part}"

@router.get("/self", response_model=list[ReportSummaryPayload])
async def get_my_reports(
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    return await run_in_threadpool(list_report_summaries, db, user_id=current_user.id)

@router.get("/{session_id}", response_model=ReportPayload)
async def get_report(
    session_id: uuid.UUID,
    db: Any = Depends(get_db),
    viewer: Any | None = Depends(get_current_user_or_guest)
):
    repo = SessionRepository(db)
    
    # We use run_in_threadpool for blocking DB operations
    def _get_report_sync():
        session = repo.get_by_id_sync(session_id)

        if not session:
            raise HTTPException(status_code=404, detail=SessionErrorMessages.NOT_FOUND)
        
        # [SECURITY FIX] IDOR Protection & Guest Access Control
        viewer_role = None
        
        # Case 1: Anonymous Session (Guest)
        if session.user_id is None:
            if not viewer:
                raise HTTPException(status_code=403, detail=SessionErrorMessages.FORBIDDEN)
            
            # Must match the guest token exactly
            viewer_guest_token = getattr(viewer, "guest_token", None)
            if not viewer_guest_token or viewer_guest_token != session.guest_token:
                raise HTTPException(status_code=403, detail=SessionErrorMessages.FORBIDDEN)
                
        # Case 2: Registered User Session
        else:
            if not viewer:
                raise HTTPException(status_code=403, detail=SessionErrorMessages.FORBIDDEN)
                
            # Mediator Access
            if viewer.role == "MEDIATOR":
                viewer_role = "MEDIATOR"
            # Owner Access
            elif viewer.id == session.user_id:
                pass # Authorized as owner
            # Unauthorized
            else:
                raise HTTPException(status_code=403, detail=SessionErrorMessages.FORBIDDEN)
        
        try:
            data = build_report(db, session_id, viewer_role=viewer_role)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e)) from None
        return as_report_payload(data)

    return await run_in_threadpool(_get_report_sync)


@router.post("/{session_id}/share", response_model=ReportShareOut)
def create_report_share(
    session_id: uuid.UUID,
    payload: ReportShareCreate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    try:
        service = ReportShareService(db)
        share, token = service.create_share(
            session_id=session_id,
            owner=current_user,
            mediator_email=payload.mediator_email,
            expires_in_hours=payload.expires_in_hours,
            note=payload.note,
        )
    except SharePermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ShareValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    mediator_name = getattr(share.mediator, "full_name", None)
    return ReportShareOut(
        share_id=share.id,
        session_id=session_id,
        mediator_email=share.mediator_email,
        mediator_name=mediator_name,
        expires_at=share.expires_at,
        share_token=token,
        note=share.note,
    )


@router.get("/shared/{share_token}", response_model=ReportPayload)
def get_shared_report(
    share_token: str,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    try:
        service = ReportShareService(db)
        share = service.resolve_share(share_token=share_token, viewer=current_user)
        data: dict[str, Any] = build_report(db, share.session_id, viewer_role="MEDIATOR")
        data["share_context"] = {
            "share_id": share.id,
            "session_id": share.session_id,
            "mediator_email": share.mediator_email,
            "mediator_name": getattr(share.mediator, "full_name", None),
            "owner_name": getattr(share.owner, "full_name", None),
            "owner_email": getattr(share.owner, "email", None),
            "expires_at": share.expires_at,
            "note": share.note,
        }
    except SharePermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ShareValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return as_report_payload(data)
