from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Gender(enum.Enum):
    male = "Male"
    female = "Female"
    other = "Other"
    prefer_not = "Prefer not to say"

class AgeGroup(enum.Enum):
    lt19 = "<19"
    g19_24 = "19-24"
    g25_34 = "25-34"
    g35_44 = "35-44"
    g45_54 = "45-54"
    g55_64 = "55-64"
    gt64 = ">64"

class EducationLevel(enum.Enum):
    primary = "Primary School"
    secondary = "Secondary School"
    university = "University Degree"
    masters = "Master's Degree"
    doctoral = "Doctoral Degree"

class SessionStatus(enum.Enum):
    started = "Started"
    in_progress = "In Progress"
    completed = "Completed"
    abandoned = "Abandoned"

class ItemType(enum.Enum):
    learning_style = "Learning_Style"
    learning_flex = "Learning_Flexibility"

class LearningMode(enum.Enum):
    CE = "CE"
    RO = "RO"
    AC = "AC"
    AE = "AE"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    nim: Mapped[Optional[str]] = mapped_column(String(8), unique=True, nullable=True)
    kelas: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # format IF-<number>
    tahun_masuk: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    date_of_birth: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[Gender]] = mapped_column(Enum(Gender), nullable=True)
    education_level: Mapped[Optional[EducationLevel]] = mapped_column(Enum(EducationLevel), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    occupation: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[Optional[str]] = mapped_column(String(20), default="MAHASISWA")  # 'MEDIATOR','MAHASISWA'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    sessions: Mapped[list[AssessmentSession]] = relationship(back_populates="user")

class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    start_time: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.started)
    version: Mapped[str] = mapped_column(String(10), default="KLSI 4.0")
    session_type: Mapped[str] = mapped_column(String(20), default="Initial")
    days_since_last_session: Mapped[Optional[int]] = mapped_column(Integer)

    user: Mapped[User] = relationship(back_populates="sessions")
    responses: Mapped[list[UserResponse]] = relationship(back_populates="session")
    scale_score: Mapped[Optional[ScaleScore]] = relationship(back_populates="session", uselist=False)
    combination_score: Mapped[Optional[CombinationScore]] = relationship(back_populates="session", uselist=False)
    learning_style: Mapped[Optional[UserLearningStyle]] = relationship(back_populates="session", uselist=False)
    lfi_index: Mapped[Optional[LearningFlexibilityIndex]] = relationship(back_populates="session", uselist=False)

class AssessmentItem(Base):
    __tablename__ = "assessment_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_number: Mapped[int] = mapped_column(Integer, index=True)
    item_type: Mapped[ItemType] = mapped_column(Enum(ItemType))
    item_stem: Mapped[str] = mapped_column(String(300))
    item_category: Mapped[Optional[str]] = mapped_column(String(100))
    item_order_position: Mapped[Optional[int]] = mapped_column(Integer)
    language: Mapped[str] = mapped_column(String(10), default="EN")

    choices: Mapped[list[ItemChoice]] = relationship(back_populates="item")

class ItemChoice(Base):
    __tablename__ = "item_choices"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("assessment_items.id"))
    learning_mode: Mapped[LearningMode] = mapped_column(Enum(LearningMode))
    choice_text: Mapped[str] = mapped_column(String(400))

    item: Mapped[AssessmentItem] = relationship(back_populates="choices")
    responses: Mapped[list[UserResponse]] = relationship(back_populates="choice")

class UserResponse(Base):
    __tablename__ = "user_responses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"))
    item_id: Mapped[int] = mapped_column(ForeignKey("assessment_items.id"))
    choice_id: Mapped[int] = mapped_column(ForeignKey("item_choices.id"))
    rank_value: Mapped[int] = mapped_column(Integer)

    __table_args__ = (
        UniqueConstraint("session_id", "item_id", "rank_value", name="uq_rank_per_item"),
        UniqueConstraint("session_id", "choice_id", name="uq_choice_once_per_session"),
        CheckConstraint("rank_value BETWEEN 1 AND 4", name="ck_rank_range")
    )

    session: Mapped[AssessmentSession] = relationship(back_populates="responses")
    choice: Mapped[ItemChoice] = relationship(back_populates="responses")

class ScaleScore(Base):
    __tablename__ = "scale_scores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    CE_raw: Mapped[int] = mapped_column(Integer)
    RO_raw: Mapped[int] = mapped_column(Integer)
    AC_raw: Mapped[int] = mapped_column(Integer)
    AE_raw: Mapped[int] = mapped_column(Integer)

    session: Mapped[AssessmentSession] = relationship(back_populates="scale_score")

class CombinationScore(Base):
    __tablename__ = "combination_scores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    ACCE_raw: Mapped[int] = mapped_column(Integer)
    AERO_raw: Mapped[int] = mapped_column(Integer)
    assimilation_accommodation: Mapped[int] = mapped_column(Integer)
    converging_diverging: Mapped[int] = mapped_column(Integer)
    # Continuous balance scores (non-ipsative)
    balance_acce: Mapped[int] = mapped_column(Integer)
    balance_aero: Mapped[int] = mapped_column(Integer)

    session: Mapped[AssessmentSession] = relationship(back_populates="combination_score")

class LearningStyleType(Base):
    __tablename__ = "learning_style_types"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    style_name: Mapped[str] = mapped_column(String(50), unique=True)
    style_code: Mapped[str] = mapped_column(String(20), unique=True)
    ACCE_min: Mapped[int] = mapped_column(Integer)
    ACCE_max: Mapped[int] = mapped_column(Integer)
    AERO_min: Mapped[int] = mapped_column(Integer)
    AERO_max: Mapped[int] = mapped_column(Integer)
    quadrant: Mapped[Optional[str]] = mapped_column(String(10))
    description: Mapped[Optional[str]] = mapped_column(String(500))

class UserLearningStyle(Base):
    __tablename__ = "user_learning_styles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    primary_style_type_id: Mapped[int] = mapped_column(ForeignKey("learning_style_types.id"))
    ACCE_raw: Mapped[int] = mapped_column(Integer)
    AERO_raw: Mapped[int] = mapped_column(Integer)
    kite_coordinates: Mapped[Optional[dict]] = mapped_column(JSON)
    style_intensity_score: Mapped[Optional[int]] = mapped_column(Integer)

    session: Mapped[AssessmentSession] = relationship(back_populates="learning_style")
    style_type: Mapped[LearningStyleType] = relationship()

class LFIContextScore(Base):
    __tablename__ = "lfi_context_scores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"))
    context_name: Mapped[str] = mapped_column(String(50))
    CE_rank: Mapped[int] = mapped_column(Integer)
    RO_rank: Mapped[int] = mapped_column(Integer)
    AC_rank: Mapped[int] = mapped_column(Integer)
    AE_rank: Mapped[int] = mapped_column(Integer)
    __table_args__ = (
        UniqueConstraint("session_id", "context_name", name="uq_lfi_context_per_session"),
    )

class LearningFlexibilityIndex(Base):
    __tablename__ = "learning_flexibility_index"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    W_coefficient: Mapped[float] = mapped_column(Float)
    LFI_score: Mapped[float] = mapped_column(Float)
    LFI_percentile: Mapped[Optional[float]] = mapped_column(Float)
    flexibility_level: Mapped[Optional[str]] = mapped_column(String(20))
    # Provenance norm group used for percentile conversion (DB subgroup or AppendixFallback)
    norm_group_used: Mapped[Optional[str]] = mapped_column(String(50))

    session: Mapped[AssessmentSession] = relationship(back_populates="lfi_index")

class BackupLearningStyle(Base):
    __tablename__ = "backup_learning_styles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"))
    style_type_id: Mapped[int] = mapped_column(ForeignKey("learning_style_types.id"))
    frequency_count: Mapped[int] = mapped_column(Integer)
    contexts_used: Mapped[Optional[dict]] = mapped_column(JSON)
    percentage: Mapped[Optional[int]] = mapped_column(Integer)

class NormativeConversionTable(Base):
    __tablename__ = "normative_conversion_table"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    norm_group: Mapped[str] = mapped_column(String(150))  # Expanded to accommodate long country names
    scale_name: Mapped[str] = mapped_column(String(5))
    raw_score: Mapped[int] = mapped_column(Integer)
    percentile: Mapped[float] = mapped_column(Float)
    # Ensure no overlapping normative rows for same (group, scale, raw)
    __table_args__ = (
        UniqueConstraint("norm_group", "scale_name", "raw_score", name="uq_norm_group_scale_raw"),
    )

class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor: Mapped[str] = mapped_column(String(100))  # user email or 'system'
    action: Mapped[str] = mapped_column(String(100))
    payload_hash: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class PercentileScore(Base):
    __tablename__ = "percentile_scores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("assessment_sessions.id"), unique=True)
    norm_group_used: Mapped[str] = mapped_column(String(50))
    CE_percentile: Mapped[float] = mapped_column(Float)
    RO_percentile: Mapped[float] = mapped_column(Float)
    AC_percentile: Mapped[float] = mapped_column(Float)
    AE_percentile: Mapped[float] = mapped_column(Float)
    ACCE_percentile: Mapped[float] = mapped_column(Float)
    AERO_percentile: Mapped[float] = mapped_column(Float)
    # Per-scale provenance: 'DB:<group>' or 'AppendixFallback'
    CE_source: Mapped[str] = mapped_column(String(60), default='AppendixFallback')
    RO_source: Mapped[str] = mapped_column(String(60), default='AppendixFallback')
    AC_source: Mapped[str] = mapped_column(String(60), default='AppendixFallback')
    AE_source: Mapped[str] = mapped_column(String(60), default='AppendixFallback')
    ACCE_source: Mapped[str] = mapped_column(String(60), default='AppendixFallback')
    AERO_source: Mapped[str] = mapped_column(String(60), default='AppendixFallback')
    used_fallback_any: Mapped[Optional[bool]] = mapped_column(Integer, default=1)

class NormativeStatistics(Base):
    __tablename__ = "normative_statistics"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    norm_group: Mapped[str] = mapped_column(String(150))  # Expanded to match normative_conversion_table
    sample_size: Mapped[int] = mapped_column(Integer)
    CE_mean: Mapped[float] = mapped_column(Float)
    CE_stdev: Mapped[float] = mapped_column(Float)
    RO_mean: Mapped[float] = mapped_column(Float)
    RO_stdev: Mapped[float] = mapped_column(Float)
    AC_mean: Mapped[float] = mapped_column(Float)
    AC_stdev: Mapped[float] = mapped_column(Float)
    AE_mean: Mapped[float] = mapped_column(Float)
    AE_stdev: Mapped[float] = mapped_column(Float)
    ACCE_mean: Mapped[float] = mapped_column(Float)
    ACCE_stdev: Mapped[float] = mapped_column(Float)
    AERO_mean: Mapped[float] = mapped_column(Float)
    AERO_stdev: Mapped[float] = mapped_column(Float)

# --- Team & Research Schema ---

class Team(Base):
    __tablename__ = "teams"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    kelas: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    members: Mapped[list["TeamMember"]] = relationship(back_populates="team")
    rollups: Mapped[list["TeamAssessmentRollup"]] = relationship(back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    role_in_team: Mapped[Optional[str]] = mapped_column(String(50))
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    team: Mapped[Team] = relationship(back_populates="members")
    user: Mapped[User] = relationship()

    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_user_unique"),
    )


class TeamAssessmentRollup(Base):
    __tablename__ = "team_assessment_rollup"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"))
    date: Mapped[Date] = mapped_column(Date)
    total_sessions: Mapped[int] = mapped_column(Integer)
    avg_lfi: Mapped[Optional[float]] = mapped_column(Float)
    style_counts: Mapped[Optional[dict]] = mapped_column(JSON)  # {style_name: count}

    team: Mapped[Team] = relationship(back_populates="rollups")

    __table_args__ = (
        UniqueConstraint("team_id", "date", name="uq_team_date_unique"),
    )


class ResearchStudy(Base):
    __tablename__ = "research_studies"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(String(1000))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    notes: Mapped[Optional[str]] = mapped_column(String(1000))


class ReliabilityResult(Base):
    __tablename__ = "reliability_results"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    study_id: Mapped[int] = mapped_column(ForeignKey("research_studies.id"))
    metric_name: Mapped[str] = mapped_column(String(100))  # e.g., Cronbach_alpha_AC
    value: Mapped[float] = mapped_column(Float)
    notes: Mapped[Optional[str]] = mapped_column(String(500))


class ValidityEvidence(Base):
    __tablename__ = "validity_evidence"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    study_id: Mapped[int] = mapped_column(ForeignKey("research_studies.id"))
    evidence_type: Mapped[str] = mapped_column(String(50))  # content|construct|criterion
    description: Mapped[Optional[str]] = mapped_column(String(1000))
    metric_name: Mapped[Optional[str]] = mapped_column(String(100))
    value: Mapped[Optional[float]] = mapped_column(Float)
