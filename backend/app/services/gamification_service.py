from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, joinedload

from app.models.klsi.gamification import GamificationBadge, UserAchievement
from app.models.klsi.user import User

class GamificationService:
    def award_badge(self, db: Session, user_id: int, badge_slug: str):
        badge = db.query(GamificationBadge).filter_by(slug=badge_slug).first()
        if not badge:
            return None 
        
        existing = db.query(UserAchievement).filter_by(user_id=user_id, badge_id=badge.id).first()
        if existing:
            return existing
            
        achievement = UserAchievement(
            user_id=user_id,
            badge_id=badge.id,
            awarded_at=datetime.now(timezone.utc),
        )
        db.add(achievement)
        return achievement

    def add_points(self, db: Session, user_id: int, points: int):
        user = db.query(User).filter_by(id=user_id).first()
        if user:
            current_points = user.zen_points or 0
            user.zen_points = current_points + points
            # Simple level logic: 1 level per 1000 points
            user.current_lvl = 1 + (user.zen_points // 1000)
        return user

    def list_user_achievements(self, db: Session, user_id: int):
        return (
            db.query(UserAchievement)
            .options(joinedload(UserAchievement.badge))
            .filter(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.awarded_at.desc())
            .all()
        )

class AsyncGamificationService:
    async def award_badge(self, db: AsyncSession, user_id: int, badge_slug: str):
        result = await db.execute(select(GamificationBadge).filter_by(slug=badge_slug))
        badge = result.scalars().first()
        if not badge:
            return None 
        
        result = await db.execute(select(UserAchievement).filter_by(user_id=user_id, badge_id=badge.id))
        existing = result.scalars().first()
        if existing:
            return existing
            
        achievement = UserAchievement(
            user_id=user_id,
            badge_id=badge.id,
            awarded_at=datetime.now(timezone.utc),
        )
        db.add(achievement)
        return achievement

    async def add_points(self, db: AsyncSession, user_id: int, points: int):
        result = await db.execute(select(User).filter_by(id=user_id))
        user = result.scalars().first()
        if user:
            current_points = user.zen_points or 0
            user.zen_points = current_points + points
            # Simple level logic: 1 level per 1000 points
            user.current_lvl = 1 + (user.zen_points // 1000)
        return user

    async def list_user_achievements(self, db: AsyncSession, user_id: int):
        result = await db.execute(
            select(UserAchievement)
            .options(joinedload(UserAchievement.badge))
            .filter(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.awarded_at.desc())
        )
        return result.scalars().all()

gamification_service = GamificationService()
async_gamification_service = AsyncGamificationService()
