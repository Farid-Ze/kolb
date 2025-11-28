from typing import Any, Optional

from fastapi import APIRouter, Depends, Header

from app.db.database import get_db
from app.services.assessments import get_latest_completed_assessment_summary
from app.services.security import get_current_user
from app.schemas.base import CamelModel
from pydantic import Field

router = APIRouter(prefix="/assessments", tags=["assessments"])

class AssessmentResults(CamelModel):
    ac_score: int
    ce_score: int
    ae_score: int
    ro_score: int
    acce_score: int
    aero_score: int
    learning_style: str
    lfi_score: Optional[float] = None

class AssessmentSessionResponse(CamelModel):
    session_id: str = Field(..., alias="sessionId")
    date: str
    status: str = "completed"
    results: AssessmentResults

@router.get("/latest", response_model=Optional[AssessmentSessionResponse])
def get_latest_assessment(
    db: Any = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Get the latest completed assessment session for the current user.
    
    This endpoint is strictly scoped to the authenticated user. It retrieves the most
    recent session with status 'completed' and maps the internal ORM model to a
    frontend-friendly DTO.
    
    Returns:
        AssessmentSessionResponse: The latest completed session with results.
        None: If the user has no completed sessions (returns 200 OK with null body).
    
    Raises:
        HTTPException(401): If the user is not authenticated.
    """
    payload = get_latest_completed_assessment_summary(db, current_user.id)
    if not payload:
        return None

    results = payload["results"]
    response = AssessmentSessionResponse(
        session_id=payload["id"],
        date=payload["date"],
        status=payload.get("status", "completed"),
        results=AssessmentResults(**results),
    )
    return response
