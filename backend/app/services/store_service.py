from sqlalchemy.orm import Session
from app.models.klsi.store import StoreProduct
from app.models.klsi.gamification import UserAchievement

class StoreService:
    def list_products(self, db: Session, user_id: int):
        products = db.query(StoreProduct).all()
        results = []
        for p in products:
            is_eligible = True
            if p.required_badge_id:
                has_badge = db.query(UserAchievement).filter_by(
                    user_id=user_id, badge_id=p.required_badge_id
                ).first()
                if not has_badge:
                    is_eligible = False
            
            results.append({
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price_points": p.price_points,
                "meta": p.meta,
                "eligible": is_eligible
            })
        return results

    def get_product(self, db: Session, product_id: int):
        return db.query(StoreProduct).filter_by(id=product_id).first()

    def get_product_details(self, db: Session, user_id: int, product_id: int):
        p = db.query(StoreProduct).filter_by(id=product_id).first()
        if not p:
            return None
        
        is_eligible = True
        if p.required_badge_id:
            has_badge = db.query(UserAchievement).filter_by(
                user_id=user_id, badge_id=p.required_badge_id
            ).first()
            if not has_badge:
                is_eligible = False
        
        return {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price_points": p.price_points,
            "meta": p.meta,
            "eligible": is_eligible
        }

store_service = StoreService()
