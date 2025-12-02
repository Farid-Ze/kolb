import uuid
from datetime import datetime
from typing import Any, Mapping, List, Optional, Literal, Union

from pydantic import Field, BaseModel, field_validator

from app.schemas.base import CamelModel


class ReportShareContext(CamelModel):
    share_id: int
    session_id: uuid.UUID
    mediator_email: str | None = None
    mediator_name: str | None = None
    owner_name: str | None = None
    owner_email: str | None = None
    expires_at: datetime | None = None
    note: str | None = None


class ReportStyleSummary(CamelModel):
    style_code: str | None = None
    style_name: str | None = None
    description: str | None = None
    quadrant: str | None = None


class ReportFlexibilitySummary(CamelModel):
    lfi_score: float | None = Field(None, description="LFI Score (Precision: 4 decimal places)")
    percentile: float | None = None
    level: str | None = None
    level_label: str | None = None

    @field_validator("lfi_score")
    @classmethod
    def round_lfi(cls, v: float | None) -> float | None:
        return round(v, 4) if v is not None else None


class ReportDialecticSummary(CamelModel):
    acce: int | None = None
    aero: int | None = None
    intensity: int | None = None


class ReportLongitudinalSummary(CamelModel):
    previous_session_id: uuid.UUID | None = None
    previous_session_date: datetime | None = None
    time_elapsed_days: int | None = None
    delta_acce: int | None = None
    delta_aero: int | None = None
    delta_lfi: float | None = None
    delta_intensity: int | None = None


class ReportSummaryPayload(CamelModel):
    session_id: uuid.UUID
    generated_at: datetime | None = None
    learning_style: ReportStyleSummary | None = None
    nine_style: ReportStyleSummary | None = None
    flexibility: ReportFlexibilitySummary | None = None
    dialectic: ReportDialecticSummary | None = None
    longitudinal: ReportLongitudinalSummary | None = None


# --- Strict Schemas for Individual Report ---

class VisualizationConfig(CamelModel):
    """Configuration for frontend visualizations."""
    chart_type: str
    data_points: List[Mapping[str, Any]]
    axes: Mapping[str, Any] | None = None
    annotations: List[Mapping[str, Any]] | None = None

class LearningSpaceData(CamelModel):
    """Coordinates and metadata for the Learning Space."""
    x: float
    y: float
    quadrant: str
    region: str | None = None

class AnalyticsData(CamelModel):
    """Detailed analytics metrics."""
    raw_scores: Mapping[str, float]
    percentiles: Mapping[str, float]
    norms_version: str

class SessionDesign(CamelModel):
    """Recommended session design based on learning style."""
    title: str
    description: str
    activities: List[str]
    duration_minutes: int | None = None

# --------------------------------------------

class ReportPayloadBase(CamelModel):
    session_id: uuid.UUID
    generated_at: datetime | None = None
    # kind is defined in subclasses for discriminated union


class IndividualReportPayload(ReportPayloadBase):
    kind: Literal["individual"] = "individual"
    raw: Mapping[str, Any]
    percentiles: Mapping[str, Any] | None = None
    style: Mapping[str, Any] | None = None
    lfi: Mapping[str, Any] | None = None
    analytics: Mapping[str, Any] | None = None
    visualization: Mapping[str, Any] | None = None
    session_designs: List[Mapping[str, Any]] | None = None
    learning_space: Mapping[str, Any] | None = None
    enhanced_analytics: Mapping[str, Any] | None = None
    notes: Mapping[str, Any] | None = None
    owner: Mapping[str, Any] | None = None
    share_context: ReportShareContext | None = None
    responsible_use_notice: str | None = None


class TeamReportPayload(ReportPayloadBase):
    kind: Literal["team"] = "team"
    team_id: int
    analytics: Mapping[str, Any] | None = None


ReportPayload = Union[IndividualReportPayload, TeamReportPayload]


def as_report_payload(data: Mapping[str, Any]) -> ReportPayload:
    """Convert raw report dicts into CamelModel payloads."""

    payload = dict(data)
    share_context = payload.get("share_context")
    if isinstance(share_context, Mapping):
        payload["share_context"] = ReportShareContext(**share_context)
    else:
        payload["share_context"] = None
        
    # Default to individual report for now as that's the primary usage
    if "kind" not in payload:
        payload["kind"] = "individual"
        
    if payload["kind"] == "individual":
        return IndividualReportPayload(**payload)
    elif payload["kind"] == "team":
        return TeamReportPayload(**payload)
    
    raise ValueError(f"Unknown report kind: {payload.get('kind')}")


__all__ = [
    "ReportPayload",
    "ReportShareContext",
    "ReportSummaryPayload",
    "ReportStyleSummary",
    "ReportFlexibilitySummary",
    "ReportDialecticSummary",
    "ReportLongitudinalSummary",
    "as_report_payload",
    "VisualizationConfig",
    "LearningSpaceData",
    "AnalyticsData",
    "SessionDesign",
]
