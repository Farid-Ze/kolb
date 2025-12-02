from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.klsi.enums import EducationLevel, Gender

__all__ = ["User"]


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    nim: Mapped[Optional[str]] = mapped_column(String(8), unique=True, nullable=True)
    kelas: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    tahun_masuk: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    date_of_birth: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[Gender]] = mapped_column(Enum(Gender), nullable=True)
    education_level: Mapped[Optional[EducationLevel]] = mapped_column(Enum(EducationLevel), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    occupation: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[Optional[str]] = mapped_column(String(20), default="MAHASISWA")
    avatar_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    zen_points: Mapped[int] = mapped_column(Integer, default=0)
    current_lvl: Mapped[int] = mapped_column(Integer, default=1)
    life_motto: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )

    sessions: Mapped[list["AssessmentSession"]] = relationship(back_populates="user")
    achievements: Mapped[list["UserAchievement"]] = relationship(back_populates="user", lazy="noload")
    challenges: Mapped[list["UserChallenge"]] = relationship(back_populates="user")
    sphere_nodes: Mapped[list["SphereNode"]] = relationship(back_populates="user")
    reflections: Mapped[list["MemoryReflection"]] = relationship(back_populates="user")

    # Non-mapped attributes
    __allow_unmapped__ = True
    is_guest: bool = False
    guest_token: Optional[str] = None


if TYPE_CHECKING:  # pragma: no cover - for type checking only
    from app.models.klsi.assessment import AssessmentSession
    from app.models.klsi.gamification import UserAchievement
    from app.models.klsi.challenge import UserChallenge
    from app.models.klsi.sphere import SphereNode, MemoryReflection
