from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import ConfigDict, Field

from app.schemas.base import CamelModel


class ResearchStudyCreate(CamelModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class ResearchStudyUpdate(CamelModel):
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import ConfigDict, Field

from app.schemas.base import CamelModel


class ResearchStudyCreate(CamelModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class ResearchStudyUpdate(CamelModel):
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class ResearchStudyOut(CamelModel):
    public_id: str
    title: str
    description: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    notes: Optional[str]
    model_config = ConfigDict(from_attributes=True)


class ReliabilityCreate(CamelModel):
    metric_name: str = Field(min_length=1, max_length=100)
    value: float
    notes: Optional[str] = Field(default=None, max_length=500)


class ValidityCreate(CamelModel):
    evidence_type: str = Field(min_length=1, max_length=50)
    description: Optional[str] = Field(default=None, max_length=1000)
    metric_name: Optional[str] = Field(default=None, max_length=100)
    value: Optional[float] = None


import uuid
class StudyDataPoint(CamelModel):
    session_id: uuid.UUID
    participant_hash: str
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


class StudyDataDateRange(CamelModel):
    earliest: datetime
    latest: datetime


class StudyDataSummary(CamelModel):
    total_sessions: int
    unique_participants: int
    date_range: Optional[StudyDataDateRange] = None
    style_distribution: Dict[str, int]



from app.schemas.pagination import PaginatedResponse


class ResearchStudyDataOut(PaginatedResponse[StudyDataPoint]):
    """Paginated research study data export with metadata.
    
    Extends PaginatedResponse to include study-specific metadata:
    - items: List[StudyDataPoint] (inherited, contains paginated data points)
    - total, page, size, pages (inherited pagination metadata)
    - study_public_id, study_title, filters_applied, summary (custom fields)
    """
    study_public_id: str
    study_title: str
    filters_applied: Dict[str, Any]
    summary: StudyDataSummary



class StudyDataFilter(CamelModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    learning_style: Optional[str] = None
    norm_group: Optional[str] = None
    user_email: Optional[str] = None
    page: int = Field(default=1, ge=1)
    size: int = Field(default=50, ge=1, le=1000)
