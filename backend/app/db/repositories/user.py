from datetime import date
from typing import Optional, Union, cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import set_committed_value

from app.db.repositories.base import Repository
from app.models.klsi.enums import EducationLevel, Gender
from app.models.klsi.user import User


class UserRepository(Repository[Union[AsyncSession, Session]]):
    """Repository abstraction for user persistence and lookups."""

    async def get(self, user_id: int) -> Optional[User]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(select(User).filter(User.id == user_id))
        return result.scalars().first()

    def get_sync(self, user_id: int) -> Optional[User]:
        """Get user by ID - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(select(User).filter(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(select(User).filter(User.email == email))
        return result.scalars().first()

    def get_by_email_sync(self, email: str) -> Optional[User]:
        """Get user by email - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(select(User).filter(User.email == email))
        return result.scalars().first()

    async def create(
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
        db = cast(AsyncSession, self.db)
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
        db.add(user)
        await db.flush()
        await db.refresh(user)
        # Avoid lazy load error in Pydantic
        set_committed_value(user, "achievements", [])
        return user

