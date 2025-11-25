from enum import Enum

from pydantic import ConfigDict, EmailStr

from app.schemas.base import CamelModel
from app.schemas.user import UserAchievementOut

class Role(str, Enum):
    MAHASISWA = "MAHASISWA"
    MEDIATOR = "MEDIATOR"

class UserCreate(CamelModel):
    full_name: str
    email: EmailStr
    password: str
    nim: str | None = None
    kelas: str | None = None  # format IF-<number>
    tahun_masuk: int | None = None
    guest_session_id: int | None = None
    guest_token: str | None = None


class Token(CamelModel):
    access_token: str
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
    zen_points: int | None = None
    current_lvl: int | None = None
    life_motto: str | None = None
    achievements: list[UserAchievementOut] | None = None
    model_config = ConfigDict(from_attributes=True)
