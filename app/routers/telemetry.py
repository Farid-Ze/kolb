from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.metrics import inc_counter

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


class GuideOpenEvent(BaseModel):
    guide_id: str = Field(min_length=2, max_length=80)
    language: str | None = Field(default=None, max_length=8)
    surface: Literal["modal", "tooltip", "drawer", "link"] = "modal"


@router.post("/guide-open", status_code=202)
def record_guide_open(event: GuideOpenEvent):
    if not event.guide_id.strip():
        raise HTTPException(status_code=422, detail="guide_id cannot be blank")

    normalized_id = event.guide_id.strip().lower().replace(" ", "-")
    inc_counter("guides.open.total")
    inc_counter(f"guides.open.guide.{normalized_id}")
    inc_counter(f"guides.open.surface.{event.surface}")
    if event.language:
        inc_counter(f"guides.open.lang.{event.language.lower()}")
    return {"ok": True}
