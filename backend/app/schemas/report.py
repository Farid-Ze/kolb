import uuid
from datetime import datetime
from typing import Any, Mapping

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
    lfi_score: float | None = None
    percentile: float | None = None
    level: str | None = None
    level_label: str | None = None


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


from typing import Literal, Union

class ReportPayloadBase(CamelModel):
    session_id: uuid.UUID
    generated_at: datetime | None = None
    kind: str


class IndividualReportPayload(ReportPayloadBase):
    kind: Literal["individual"] = "individual"
    raw: Mapping[str, Any]
    percentiles: Mapping[str, Any]
    style: Mapping[str, Any]
    lfi: Mapping[str, Any]
    analytics: Mapping[str, Any]
    visualization: Mapping[str, Any] | None = None
    session_designs: list[Mapping[str, Any]] | None = None
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
]
