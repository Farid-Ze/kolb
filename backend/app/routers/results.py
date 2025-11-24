from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.db.database import get_db
from app.schemas.results import AssessmentResultsResponse
from app.services.assessments import get_latest_assessment_results
from app.services.security import get_current_user

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/latest", response_model=AssessmentResultsResponse)
def get_latest_results(
    db: Any = Depends(get_db),
    current_user = Depends(get_current_user),
):
    payload = get_latest_assessment_results(db, current_user.id)
    if not payload:
        raise HTTPException(status_code=404, detail="No finalized session found")
    return payload


@router.get("/sessions/latest", response_model=AssessmentResultsResponse)
def get_latest_results_alias(
    db: Any = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Alias endpoint to match Zenotika SSOT sitemap.

    Provides the same payload as /results/latest but under a sessions-oriented path.
    """
    payload = get_latest_assessment_results(db, current_user.id)
    if not payload:
        raise HTTPException(status_code=404, detail="No finalized session found")
    return payload
