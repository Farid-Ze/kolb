from __future__ import annotations
from typing import Optional
from datetime import datetime
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

    class Config:
        from_attributes = True


class ReliabilityCreate(BaseModel):
    metric_name: str = Field(min_length=1, max_length=100)
    value: float
    notes: Optional[str] = Field(default=None, max_length=500)


class ValidityCreate(BaseModel):
    evidence_type: str = Field(min_length=1, max_length=50)
    description: Optional[str] = Field(default=None, max_length=1000)
    metric_name: Optional[str] = Field(default=None, max_length=100)
    value: Optional[float] = None
