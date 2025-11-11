from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.klsi.user import User


class UserRepository:
    """Repository abstraction for user persistence and lookups."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, **data) -> User:
        user = User(**data)
        self.db.add(user)
        return user
