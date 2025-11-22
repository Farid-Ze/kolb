from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import ConfigDict, Field

from app.schemas.base import CamelModel


class ProductBase(CamelModel):
    slug: str
    name: str
    description: str
    price_points: int
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
    items: list[CartItem]


class StoreOrderItemOut(CamelModel):
    product_id: int
    quantity: int
    price_at_purchase: int
    model_config = ConfigDict(from_attributes=True)


class StoreOrderOut(CamelModel):
    id: str
    total_amount: int
    payment_status: str
    snap_token: str | None = None
    created_at: datetime
    items: list[StoreOrderItemOut] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)
