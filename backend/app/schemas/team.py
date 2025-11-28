import uuid
from datetime import date, datetime
from typing import Dict, Optional

from pydantic import ConfigDict, Field

from app.schemas.base import CamelModel


from enum import Enum

class TeamRole(str, Enum):
    MEMBER = "MEMBER"
    LEADER = "LEADER"


class TeamCreate(CamelModel):
    name: str = Field(min_length=1, max_length=100)
    kelas: Optional[str] = Field(default=None, max_length=20)
    description: Optional[str] = Field(default=None, max_length=500)


class TeamUpdate(CamelModel):
    name: Optional[str] = Field(default=None, max_length=100)
    kelas: Optional[str] = Field(default=None, max_length=20)
    description: Optional[str] = Field(default=None, max_length=500)


class TeamMemberAdd(CamelModel):
    email: str = Field(..., description="Email address of the user to add")
    role_in_team: TeamRole = Field(default=TeamRole.MEMBER)


class TeamOut(CamelModel):
    id: int
    name: str
    kelas: Optional[str]
    description: Optional[str]
    model_config = ConfigDict(from_attributes=True)


class TeamMemberOut(CamelModel):
    id: int
    team_id: int
    user_id: int
    role_in_team: TeamRole
    model_config = ConfigDict(from_attributes=True)


class TeamRollupOut(CamelModel):
    id: int
    team_id: int
    date: datetime
    total_sessions: int
    avg_lfi: Optional[float]
    style_counts: Optional[Dict[str, int]]
    model_config = ConfigDict(from_attributes=True)


class TeamRollupMemberOut(CamelModel):
    user_id: int
    name: Optional[str]
    email: Optional[str]
    session_id: Optional[uuid.UUID]
    generated_at: Optional[datetime]
    ac_ce: Optional[int]
    ae_ro: Optional[int]
    learning_style: Optional[str]
    style_code: Optional[str]
    raw_scores: Optional[Dict[str, Optional[int]]]
    dialectic_scores: Optional[Dict[str, Optional[int]]]


class TeamRollupSummaryOut(CamelModel):
    total_members: int
    members_with_data: int
    avg_ac_ce: float
    avg_ae_ro: float
    style_distribution: Dict[str, int]


class TeamRollupBalanceMetricsOut(CamelModel):
    CE_percentage: float
    RO_percentage: float
    AC_percentage: float
    AE_percentage: float


class TeamRollupLegacyMemberOut(CamelModel):
    user_id: int
    name: Optional[str]
    email: Optional[str]
    role_in_team: Optional[str]
    joined_at: Optional[datetime]
    status: Optional[str]
    status_reason: Optional[str]
    session_id: Optional[uuid.UUID]
    generated_at: Optional[datetime]
    ac_ce: Optional[int]
    ae_ro: Optional[int]
    learning_style: Optional[str]
    style_code: Optional[str]


class TeamRollupDetail(CamelModel):
    team_id: int
    team_name: str
    member_count: int
    # data_points and legacy_members removed for scalability (Audit Round 2)
    summary: TeamRollupSummaryOut
    diversity_score: Optional[float]
    balance_metrics: TeamRollupBalanceMetricsOut


class TeamMemberAnalyticsResponse(CamelModel):
    items: list[TeamRollupMemberOut]
    total: int
    page: int
    size: int
    pages: int


class TeamListResponse(CamelModel):
    items: list[TeamOut]
    total: int
    page: int
    size: int
    pages: int
