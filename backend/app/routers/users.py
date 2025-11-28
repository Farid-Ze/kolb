from typing import Any, TYPE_CHECKING

from fastapi import APIRouter, Depends

if TYPE_CHECKING:
    import sqlalchemy.orm

from app.db.database import get_db
from app.schemas.auth import UserOut
from app.schemas.user import UserAchievementOut
from app.services.gamification_service import gamification_service
from app.services.security import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user = Depends(get_current_user)):
    return current_user


@router.get("/me/achievements", response_model=list[UserAchievementOut])
def list_user_achievements(
    current_user = Depends(get_current_user),
    db: Any = Depends(get_db),
):
    return gamification_service.list_user_achievements(db, current_user.id)
