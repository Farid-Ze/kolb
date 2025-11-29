from typing import Any, Dict

from fastapi import APIRouter, Depends, Security

from app.db.database import get_db
from app.services.grant_service import GrantService
from app.services.security import get_current_user

router = APIRouter(prefix="/grants", tags=["grants"])

@router.get("/me", response_model=Dict[str, Any])
def get_my_grants(
    db: Any = Depends(get_db),
    current_user: Any = Security(get_current_user),
):
    """
    Get summary of active grants for the current user.
    """
    service = GrantService(db)
    return service.get_grant_summary(current_user.id)
