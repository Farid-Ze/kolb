from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.klsi.gamification import UserAchievement
from app.models.klsi.store import StoreOrder, StoreProduct
from app.models.klsi.user import User


class StoreServiceError(Exception):
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class StoreService:
    def list_products(self, db: Session, user_id: int):
        products = db.query(StoreProduct).all()
        return [self._serialize_product(db, user_id, product) for product in products]

    def get_product_details(self, db: Session, user_id: int, product_id: int):
        product = self._get_product(db, product_id)
        if not product:
            return None
        return self._serialize_product(db, user_id, product)

    def community_fund_snapshot(self, db: Session):
        total_points = db.query(func.coalesce(func.sum(StoreOrder.contribution_points), 0)).scalar() or 0
        contributor_count = db.query(func.count(func.distinct(StoreOrder.user_id))).scalar() or 0
        order_count = db.query(func.count(StoreOrder.id)).scalar() or 0
        last_contribution = db.query(func.max(StoreOrder.created_at)).scalar()
        return {
            "total_points": int(total_points),
            "contributors": int(contributor_count),
            "orders": int(order_count),
            "last_contribution_at": last_contribution,
        }

    def checkout(
        self,
        db: Session,
        user_id: int,
        *,
        product_id: int,
        contribution_points: int = 0,
    ):
        if contribution_points < 0:
            raise StoreServiceError("Contribution must be zero or positive")

        product = self._require_product(db, product_id)
        if not self._is_product_eligible(db, user_id, product):
            raise StoreServiceError("Badge requirement not satisfied", status_code=403)

        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            raise StoreServiceError("User not found", status_code=404)

        total_cost = product.price_points + contribution_points
        current_points = user.zen_points or 0
        if total_cost > current_points:
            raise StoreServiceError("Insufficient zen points for checkout")

        user.zen_points = current_points - total_cost
        user.current_lvl = max(1, 1 + (user.zen_points // 1000))

        order = StoreOrder(
            user_id=user_id,
            product_id=product.id,
            points_spent=product.price_points,
            contribution_points=contribution_points,
        )
        db.add(order)
        db.flush()
        fund_snapshot = self.community_fund_snapshot(db)
        db.commit()
        return order, user.zen_points, fund_snapshot

    def _serialize_product(self, db: Session, user_id: int, product: StoreProduct) -> dict:
        eligible = self._is_product_eligible(db, user_id, product)
        return {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price_points": product.price_points,
            "meta": product.meta,
            "eligible": eligible,
        }

    def _get_product(self, db: Session, product_id: int):
        return db.query(StoreProduct).filter_by(id=product_id).first()

    def _require_product(self, db: Session, product_id: int) -> StoreProduct:
        product = self._get_product(db, product_id)
        if not product:
            raise StoreServiceError("Product not found", status_code=404)
        return product

    def _is_product_eligible(self, db: Session, user_id: int, product: StoreProduct) -> bool:
        if not product.required_badge_id:
            return True
        has_badge = (
            db.query(UserAchievement)
            .filter_by(user_id=user_id, badge_id=product.required_badge_id)
            .first()
        )
        return has_badge is not None


store_service = StoreService()
