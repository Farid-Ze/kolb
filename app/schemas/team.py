from __future__ import annotations
from typing import Optional, Dict
from pydantic import BaseModel, Field


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    kelas: Optional[str] = Field(default=None, max_length=20)
    description: Optional[str] = Field(default=None, max_length=500)


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    kelas: Optional[str] = Field(default=None, max_length=20)
    description: Optional[str] = Field(default=None, max_length=500)


class TeamMemberAdd(BaseModel):
    user_id: int
    role_in_team: Optional[str] = Field(default=None, max_length=50)


class TeamOut(BaseModel):
    id: int
    name: str
    kelas: Optional[str]
    description: Optional[str]
    model_config = {"from_attributes": True}


class TeamMemberOut(BaseModel):
    id: int
    team_id: int
    user_id: int
    role_in_team: Optional[str]
    model_config = {"from_attributes": True}


class TeamRollupOut(BaseModel):
    id: int
    team_id: int
    date: str
    total_sessions: int
    avg_lfi: Optional[float]
    style_counts: Optional[Dict[str, int]]
    model_config = {"from_attributes": True}
