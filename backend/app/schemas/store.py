from app.schemas.base import CamelModel
from typing import Any

class ProductOut(CamelModel):
    id: int
    name: str
    description: str
    price_points: int
    meta: dict[str, Any] | None = None
    eligible: bool
