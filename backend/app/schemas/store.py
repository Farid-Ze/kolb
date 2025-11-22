from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import ConfigDict

from app.schemas.base import CamelModel

class ProductOut(CamelModel):
    id: int
    name: str
    description: str
    price_points: int
    meta: dict[str, Any] | None = None
    eligible: bool


class CommunityFundOut(CamelModel):
    total_points: int
    contributors: int
    orders: int
    last_contribution_at: datetime | None = None


class CheckoutRequest(CamelModel):
    product_id: int
    contribution_points: int = 0


class CheckoutResponse(CamelModel):
    order_id: int
    remaining_points: int
    community_fund: CommunityFundOut
    model_config = ConfigDict(from_attributes=True)
