from pydantic import BaseModel, EmailStr
from enum import Enum

class Role(str, Enum):
    MAHASISWA = "MAHASISWA"
    MEDIATOR = "MEDIATOR"

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    nim: str | None = None
    kelas: str | None = None  # format IF-<number>
    tahun_masuk: int | None = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: Role
    nim: str | None = None
    kelas: str | None = None
    tahun_masuk: int | None = None
    model_config = {
        "from_attributes": True
    }
