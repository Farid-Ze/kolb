from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ResearchStudyCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class ResearchStudyUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class ResearchStudyOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    notes: Optional[str]
    model_config = {"from_attributes": True}


class ReliabilityCreate(BaseModel):
    metric_name: str = Field(min_length=1, max_length=100)
    value: float
    notes: Optional[str] = Field(default=None, max_length=500)


class ValidityCreate(BaseModel):
    evidence_type: str = Field(min_length=1, max_length=50)
    description: Optional[str] = Field(default=None, max_length=1000)
    metric_name: Optional[str] = Field(default=None, max_length=100)
    value: Optional[float] = None


class StudyDataPoint(BaseModel):
    session_id: int
    user_id: int
    user_email: str
    user_name: str
    generated_at: datetime
    ce_score: int
    ro_score: int
    ac_score: int
    ae_score: int
    ac_ce: int
    ae_ro: int
    learning_style: Optional[str] = None
    style_code: Optional[str] = None
    norm_group: Optional[str] = None
    assessment_duration_seconds: Optional[int] = None


class StudyDataDateRange(BaseModel):
    earliest: datetime
    latest: datetime


class StudyDataSummary(BaseModel):
    total_sessions: int
    unique_participants: int
    date_range: Optional[StudyDataDateRange] = None
    style_distribution: Dict[str, int]


class ResearchStudyDataOut(BaseModel):
    study_id: int
    study_title: str
    filters_applied: Dict[str, Any]
    data_points: List[StudyDataPoint]
    summary: StudyDataSummary
