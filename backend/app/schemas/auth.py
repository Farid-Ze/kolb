from enum import Enum

from pydantic import ConfigDict, EmailStr

from app.schemas.base import CamelModel


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

class Token(CamelModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(CamelModel):
    id: int
    full_name: str
    email: EmailStr
    role: Role
    nim: str | None = None
    kelas: str | None = None
    tahun_masuk: int | None = None
    model_config = ConfigDict(from_attributes=True)
