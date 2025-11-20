from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping

from app.schemas.base import CamelModel


class ReportShareContext(CamelModel):
    share_id: int
    session_id: int
    mediator_email: str | None = None
    mediator_name: str | None = None
    owner_name: str | None = None
    owner_email: str | None = None
    expires_at: datetime | None = None
    note: str | None = None


class ReportPayload(CamelModel):
    session_id: int
    raw: Mapping[str, Any] | None = None
    percentiles: Mapping[str, Any] | None = None
    style: Mapping[str, Any] | None = None
    lfi: Mapping[str, Any] | None = None
    visualization: Mapping[str, Any] | None = None
    session_designs: list[Mapping[str, Any]] | None = None
    analytics: Mapping[str, Any] | None = None
    learning_space: Mapping[str, Any] | None = None
    enhanced_analytics: Mapping[str, Any] | None = None
    notes: Mapping[str, Any] | None = None
    owner: Mapping[str, Any] | None = None
    share_context: ReportShareContext | None = None
    responsible_use_notice: str | None = None


def as_report_payload(data: Mapping[str, Any]) -> ReportPayload:
    """Convert raw report dicts into CamelModel payloads."""

    payload = dict(data)
    share_context = payload.get("share_context")
    if isinstance(share_context, Mapping):
        payload["share_context"] = ReportShareContext(**share_context)
    else:
        payload["share_context"] = None
    return ReportPayload(**payload)


__all__ = ["ReportPayload", "ReportShareContext", "as_report_payload"]
