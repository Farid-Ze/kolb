from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.klsi.items import AssessmentItemResponse
from app.schemas.telemetry import AssessmentTelemetryPayload


class TelemetryService:
    """Domain helpers for ingesting telemetry events."""

    def record_assessment_item_event(
        self,
        db: Session,
        payload: AssessmentTelemetryPayload,
    ) -> AssessmentItemResponse:
        telemetry_blob = self._build_telemetry_blob(payload)

        entity = (
            db.query(AssessmentItemResponse)
            .filter(
                AssessmentItemResponse.session_id == payload.session_id,
                AssessmentItemResponse.item_id == payload.item_id,
            )
            .one_or_none()
        )

        if entity:
            entity.response_rank = payload.response_rank
            entity.response_latency_ms = payload.response_latency_ms
            entity.telemetry = telemetry_blob
        else:
            entity = AssessmentItemResponse(
                session_id=payload.session_id,
                item_id=payload.item_id,
                response_rank=payload.response_rank,
                response_latency_ms=payload.response_latency_ms,
                telemetry=telemetry_blob,
            )
            db.add(entity)

        db.commit()
        return entity

    @staticmethod
    def _build_telemetry_blob(payload: AssessmentTelemetryPayload) -> dict[str, Any] | None:
        blob: dict[str, Any] = {}
        if payload.blur_events is not None:
            blob["blur_events"] = payload.blur_events
        if payload.meta:
            blob["meta"] = payload.meta
        return blob or None


telemetry_service = TelemetryService()
