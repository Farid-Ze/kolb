from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import Field
from sqlalchemy.orm import Session

from app.core.metrics import inc_counter
from app.db.database import get_db
from app.db.repositories import SessionRepository
from app.i18n.id_messages import SessionErrorMessages
from app.models.klsi.user import User
from app.schemas.base import CamelModel
from app.schemas.telemetry import AssessmentTelemetryPayload
from app.services.security import get_current_user
from app.services.telemetry_service import telemetry_service

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


class GuideOpenEvent(CamelModel):
    guide_id: str = Field(min_length=2, max_length=80)
    language: str | None = Field(default=None, max_length=8)
    surface: Literal["modal", "tooltip", "drawer", "link"] = "modal"
    context: str | None = Field(default=None, max_length=80)
    metadata: dict[str, str] | None = Field(default=None)
    consent: bool = True


class PageViewEvent(CamelModel):
    page_path: str = Field(min_length=1, max_length=200)
    page_title: str = Field(min_length=1, max_length=120)
    referrer: str | None = Field(default=None, max_length=200)
    locale: str | None = Field(default=None, max_length=8)
    consent: bool = True


class ActionEvent(CamelModel):
    action_type: str = Field(min_length=2, max_length=80)
    action_target: str = Field(min_length=2, max_length=120)
    action_value: str | None = Field(default=None, max_length=120)
    metadata: dict[str, str] | None = Field(default=None)
    consent: bool = True
    actor_role: Literal["STUDENT", "MEDIATOR", "ADMIN", "ANON"] = "ANON"


@router.post("/guide-open", status_code=202)
async def record_guide_open(event: GuideOpenEvent):
    if not event.guide_id.strip():
        raise HTTPException(status_code=422, detail="guide_id cannot be blank")

    normalized_id = event.guide_id.strip().lower().replace(" ", "-")
    inc_counter("guides.open.total")
    inc_counter(f"guides.open.guide.{normalized_id}")
    inc_counter(f"guides.open.surface.{event.surface}")
    if event.language:
        inc_counter(f"guides.open.lang.{event.language.lower()}")
    if event.context:
        inc_counter(f"guides.open.context.{event.context}")
    consent_bucket = "granted" if event.consent else "denied"
    inc_counter(f"guides.open.consent.{consent_bucket}")
    return {"ok": True}


@router.post("/page-view", status_code=202)
async def record_page_view(event: PageViewEvent):
    inc_counter("page.view.total")
    normalized_path = event.page_path.strip().replace(" ", "_")
    inc_counter(f"page.view.path.{normalized_path}")
    if event.locale:
        inc_counter(f"page.view.locale.{event.locale}")
    if event.referrer:
        inc_counter("page.view.with_referrer")
    consent_bucket = "granted" if event.consent else "denied"
    inc_counter(f"page.view.consent.{consent_bucket}")
    return {"ok": True}


@router.post("/action", status_code=202)
async def record_action(event: ActionEvent):
    inc_counter("action.total")
    inc_counter(f"action.type.{event.action_type}")
    inc_counter(f"action.target.{event.action_target}")
    consent_bucket = "granted" if event.consent else "denied"
    inc_counter(f"action.consent.{consent_bucket}")
    inc_counter(f"action.role.{event.actor_role}")
    return {"ok": True}


@router.post("/assessment", status_code=202)
async def record_assessment_telemetry(
    payload: AssessmentTelemetryPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    def _record():
        repo = SessionRepository(db)
        session = repo.get_for_user(payload.session_id, current_user.id)
        if not session or session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail=SessionErrorMessages.ACCESS_DENIED)

        telemetry_service.record_assessment_item_event(db, payload)
        return {"ok": True}

    return await run_in_threadpool(_record)
