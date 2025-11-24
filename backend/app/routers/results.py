from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_db
from app.schemas.results import AssessmentResultsResponse
from app.services.assessments import get_latest_assessment_results_async
from app.services.security import get_current_user

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/latest", response_model=AssessmentResultsResponse)
async def get_latest_results(
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_user),
):
    payload = await get_latest_assessment_results_async(db, current_user.id)
    if not payload:
        raise HTTPException(status_code=404, detail="No finalized session found")
    return payload


@router.get("/sessions/latest", response_model=AssessmentResultsResponse)
async def get_latest_results_alias(
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_user),
):
    """Alias endpoint to match Zenotika SSOT sitemap.

    Provides the same payload as /results/latest but under a sessions-oriented path.
    """
    payload = await get_latest_assessment_results_async(db, current_user.id)
    if not payload:
        raise HTTPException(status_code=404, detail="No finalized session found")
    return payload
