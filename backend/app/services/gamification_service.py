from datetime import datetime, timezone

from sqlalchemy import select
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
        """Add gamification points to a user with thread-safe atomic update.
        
        Uses row-level locking (SELECT FOR UPDATE) to prevent race conditions
        in concurrent point additions. This is critical for Python 3.14 No-GIL
        compatibility.
        
        Args:
            db: Database session
            user_id: User to award points to
            points: Number of points to add (can be negative for deductions)
            
        Returns:
            Updated User object
        """
        # Lock the user row to prevent concurrent modifications
        user = db.query(User).filter_by(id=user_id).with_for_update().first()
        if user:
            # Atomic update: read and write within the same locked transaction
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

gamification_service = GamificationService()
