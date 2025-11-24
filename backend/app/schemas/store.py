from datetime import datetime
from typing import Any

from pydantic import ConfigDict, Field, model_validator

from app.schemas.base import CamelModel


class ProductBase(CamelModel):
    slug: str
    name: str
    description: str
    base_price: int
    required_badge_id: int | None = None
    meta: dict[str, Any] | None = None


class ProductOut(ProductBase):
    id: int
    eligible: bool = True
    model_config = ConfigDict(from_attributes=True)


class CartItem(CamelModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CheckoutRequest(CamelModel):
    items: list[CartItem] | None = None
    product_id: int | None = None
    quantity: int = Field(default=1, ge=1)
    contribution_points: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def ensure_items(self):
        if self.items and len(self.items) > 0:
            return self
        if self.product_id is None:
            raise ValueError("productId is required when items list is empty")
        self.items = [CartItem(product_id=self.product_id, quantity=self.quantity)]
        return self


class StoreOrderItemOut(CamelModel):
    product_id: int
    quantity: int
    price_at_purchase: int
    model_config = ConfigDict(from_attributes=True)


class StoreOrderOut(CamelModel):
    id: str
    total_amount: int
    contribution_points: int = 0
    payment_status: str
    snap_token: str | None = None
    created_at: datetime
    items: list[StoreOrderItemOut] = Field(default_factory=list)
    remaining_points: int | None = None
    model_config = ConfigDict(from_attributes=True)


class CommunityFundSummary(CamelModel):
    total_points: int
    contributors: int
