import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.klsi.gamification import UserAchievement
from app.models.klsi.store import StoreOrder, StoreOrderItem, StoreProduct
from app.models.klsi.user import User
from app.schemas.store import CheckoutRequest


class StoreServiceError(Exception):
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class StoreService:
    def list_products(self, db: Session, user_id: int):
        products = db.execute(select(StoreProduct)).scalars().all()
        return [self._serialize_product(db, user_id, product) for product in products]

    def get_product_details(self, db: Session, user_id: int, product_id: int):
        product = db.get(StoreProduct, product_id)
        if not product:
            return None
        return self._serialize_product(db, user_id, product)

    def create_order(self, db: Session, user_id: int, payload: CheckoutRequest) -> StoreOrder:
        if not payload.items:
            raise StoreServiceError("Cart cannot be empty")

        user = self._require_user(db, user_id)

        order_id = f"ORDER-{uuid.uuid4().hex[:8].upper()}"
        order = StoreOrder(
            id=order_id,
            user_id=user_id,
            total_amount=0,
            contribution_points=max(0, payload.contribution_points or 0),
            payment_status="pending",
        )
        db.add(order)
        db.flush()

        total_amount = 0
        for cart_item in payload.items:
            product = self._require_product(db, cart_item.product_id)
            if not self._is_product_eligible(db, user_id, product):
                raise StoreServiceError("Badge requirement not satisfied", status_code=403)

            quantity = max(1, cart_item.quantity)
            line_total = product.base_price * quantity
            total_amount += line_total

            db.add(
                StoreOrderItem(
                    order_id=order_id,
                    product_id=product.id,
                    quantity=quantity,
                    price_at_purchase=product.base_price,
                )
            )

        current_points = user.zen_points or 0
        if order.contribution_points > current_points:
            raise StoreServiceError("Insufficient zen points for contribution", status_code=400)

        if order.contribution_points:
            user.zen_points = current_points - order.contribution_points

        order.total_amount = total_amount
        if order.total_amount > 0:
            order.snap_token = f"SNAP-{uuid.uuid4().hex[:10].upper()}"

        db.commit()
        db.refresh(user)
        db.refresh(order)
        setattr(order, "remaining_points", user.zen_points)
        return order

    def _serialize_product(self, db: Session, user_id: int, product: StoreProduct) -> dict:
        eligible = self._is_product_eligible(db, user_id, product)
        return {
            "id": product.id,
            "slug": product.slug,
            "name": product.name,
            "description": product.description,
            "base_price": product.base_price,
            "required_badge_id": product.required_badge_id,
            "meta": product.meta,
            "eligible": eligible,
        }

    def _require_product(self, db: Session, product_id: int) -> StoreProduct:
        product = db.get(StoreProduct, product_id)
        if not product:
            raise StoreServiceError("Product not found", status_code=404)
        return product

    def _require_user(self, db: Session, user_id: int) -> User:
        user = db.get(User, user_id)
        if not user:
            raise StoreServiceError("User not found", status_code=404)
        return user

    def _is_product_eligible(self, db: Session, user_id: int, product: StoreProduct) -> bool:
        if not product.required_badge_id:
            return True
        has_badge = (
            db.query(UserAchievement)
            .filter_by(user_id=user_id, badge_id=product.required_badge_id)
            .first()
        )
        return has_badge is not None

    def get_community_fund_summary(self, db: Session) -> dict[str, int]:
        total_points = (
            db.query(func.coalesce(func.sum(StoreOrder.contribution_points), 0))
            .scalar()
            or 0
        )
        contributors = (
            db.query(func.count(func.distinct(StoreOrder.user_id)))
            .filter(StoreOrder.contribution_points > 0)
            .scalar()
            or 0
        )
        return {
            "total_points": int(total_points),
            "contributors": int(contributors),
        }


store_service = StoreService()
