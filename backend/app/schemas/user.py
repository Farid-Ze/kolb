from datetime import datetime

from pydantic import ConfigDict

from app.schemas.base import CamelModel


class BadgeOut(CamelModel):
    slug: str
    name: str
    rarity: str
    model_config = ConfigDict(from_attributes=True)


class UserAchievementOut(CamelModel):
    id: int
    awarded_at: datetime
    badge: BadgeOut
    model_config = ConfigDict(from_attributes=True)
