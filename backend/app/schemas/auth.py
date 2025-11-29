from uuid import UUID
from enum import Enum

from pydantic import ConfigDict, EmailStr, Field

from app.schemas.base import CamelModel
from app.schemas.user import UserAchievementOut

class Role(str, Enum):
    MAHASISWA = "MAHASISWA"
    MEDIATOR = "MEDIATOR"
    USER = "USER"

class UserCreate(CamelModel):
    full_name: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    nim: str | None = None
    kelas: str | None = None  # format IF-<number>
    tahun_masuk: int | None = None
    guest_session_id: UUID | None = None
    guest_token: str | None = None


class Token(CamelModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int

class UserOut(CamelModel):
    id: int
    full_name: str
    email: EmailStr
    role: Role
    nim: str | None = None
    kelas: str | None = None
    tahun_masuk: int | None = None
    avatar_url: str | None = None
    zen_points: int = 0
    current_lvl: int = 1
    life_motto: str | None = None
    achievements: list[UserAchievementOut] = []
    model_config = ConfigDict(from_attributes=True)
