from fastapi import APIRouter

from app.schemas.score import ScorePreviewRequest, ScorePreviewResponse
from app.services.score_preview import build_score_preview

router = APIRouter(prefix="/score", tags=["score"])

@router.post("/raw", response_model=ScorePreviewResponse)
def score_raw(payload: ScorePreviewRequest) -> ScorePreviewResponse:
    return build_score_preview(payload)
