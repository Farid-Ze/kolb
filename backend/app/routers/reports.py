from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db, get_async_db
from app.db.repositories import SessionRepository
from app.i18n.id_messages import SessionErrorMessages
from app.models.klsi.user import User
from app.schemas.report import ReportPayload, ReportSummaryPayload, as_report_payload
from app.schemas.report_share import ReportShareCreate, ReportShareOut
from app.services.report import build_report
from app.services.report_summary import list_report_summaries
from app.services.report_share import (
    ReportShareService,
    SharePermissionError,
    ShareValidationError,
)
from app.services.security import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


async def try_get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_async_db)
) -> User | None:
    """Attempt to resolve current user; return None on auth errors."""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization, db)
    except HTTPException as exc:
        if exc.status_code == 401:
            return None
        raise


@router.get("/self", response_model=list[ReportSummaryPayload])
async def list_self_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await run_in_threadpool(list_report_summaries, db, user_id=current_user.id)


@router.get("/{session_id}", response_model=ReportPayload)
async def get_report(
    session_id: int,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(try_get_current_user)
):
    def _get_session():
        repo = SessionRepository(db)
        return repo.get_by_id(session_id)

    session = await run_in_threadpool(_get_session)
    if not session:
        raise HTTPException(status_code=404, detail=SessionErrorMessages.NOT_FOUND)
    
    # Determine viewer role for analytics access control
    viewer_role = None
    if viewer:
        # Only provide enhanced analytics if viewer is a MEDIATOR viewing student data
        if viewer.role == "MEDIATOR":
            viewer_role = "MEDIATOR"
        # Students can only see their own basic reports
        elif viewer.id != session.user_id:
            raise HTTPException(status_code=403, detail=SessionErrorMessages.FORBIDDEN)
    
    try:
        data = await run_in_threadpool(build_report, db, session_id, viewer_role=viewer_role)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from None
    return as_report_payload(data)


@router.post("/{session_id}/share", response_model=ReportShareOut)
async def create_report_share(
    session_id: int,
    payload: ReportShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    def _create_share():
        service = ReportShareService(db)
        share, token = service.create_share(
            session_id=session_id,
            owner=current_user,
            mediator_email=payload.mediator_email,
            expires_in_hours=payload.expires_in_hours,
            note=payload.note,
        )
        db.commit()
        return share, token

    try:
        share, token = await run_in_threadpool(_create_share)
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
async def get_shared_report(
    share_token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    def _resolve_and_build():
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
        db.commit()
        return data

    try:
        data = await run_in_threadpool(_resolve_and_build)
    except SharePermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ShareValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return as_report_payload(data)
