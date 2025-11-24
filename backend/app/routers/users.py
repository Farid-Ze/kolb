from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_db
from app.schemas.auth import UserOut
from app.schemas.user import UserAchievementOut
from app.services.gamification_service import gamification_service, async_gamification_service
from app.services.security import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user = Depends(get_current_user)):
    return current_user


@router.get("/me/achievements", response_model=list[UserAchievementOut])
async def list_user_achievements(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await async_gamification_service.list_user_achievements(db, current_user.id)
