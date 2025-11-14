from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.models.klsi.enums import EducationLevel, Gender
from app.models.klsi.user import User


class UserRepository:
    """Repository abstraction for user persistence and lookups."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def create(
        self,
        *,
        full_name: str,
        email: str,
        role: str,
        password_hash: str | None = None,
        nim: str | None = None,
        kelas: str | None = None,
        tahun_masuk: int | None = None,
        date_of_birth: date | None = None,
        gender: Gender | None = None,
        education_level: EducationLevel | None = None,
        country: str | None = None,
        occupation: str | None = None,
    ) -> User:
        user = User(
            full_name=full_name,
            email=email,
            password_hash=password_hash,
            role=role,
            nim=nim,
            kelas=kelas,
            tahun_masuk=tahun_masuk,
            date_of_birth=date_of_birth,
            gender=gender,
            education_level=education_level,
            country=country,
            occupation=occupation,
        )
        self.db.add(user)
        return user
