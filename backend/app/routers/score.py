from typing import Any
from fastapi import APIRouter, Depends
from app.db.database import get_db

from app.schemas.score import ScorePreviewRequest, ScorePreviewResponse
from app.services.score_preview import build_score_preview

router = APIRouter(prefix="/score", tags=["score"])

@router.post("/raw", response_model=ScorePreviewResponse)
def score_raw(
    payload: ScorePreviewRequest,
    db: Any = Depends(get_db)
) -> ScorePreviewResponse:
    return build_score_preview(db, payload)
