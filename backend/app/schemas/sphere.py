from datetime import datetime
from typing import Any

from app.schemas.base import CamelModel
from app.models.klsi.enums import ReflectionType as _ReflectionType

ReflectionType = _ReflectionType


class SphereNodeMeta(CamelModel):
    """Strict schema for SphereNode metadata to prevent logic leakage."""
    label: str | None = None
    description: str | None = None
    icon: str | None = None
    visual_style: str | None = None
    unlock_condition: dict[str, Any] | None = None
    
    model_config = {"extra": "forbid"}

class SphereNodeOut(CamelModel):
    id: int
    pos_x: float
    pos_y: float
    pos_z: float
    unlock_date: datetime
    meta: SphereNodeMeta | None = None


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
