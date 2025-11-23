from datetime import datetime
from typing import Any

from app.schemas.base import CamelModel
from app.models.klsi.enums import ReflectionType as _ReflectionType

ReflectionType = _ReflectionType


class SphereNodeOut(CamelModel):
    id: int
    pos_x: float
    pos_y: float
    pos_z: float
    unlock_date: datetime
    meta: dict[str, Any] | None = None


class ReflectionCreate(CamelModel):
    sphere_node_id: int | None = None
    content: str
    reflection_type: _ReflectionType


class ReflectionOut(CamelModel):
    id: int
    content: str
    reflection_type: _ReflectionType
    created_at: datetime
    sphere_node_id: int | None = None
