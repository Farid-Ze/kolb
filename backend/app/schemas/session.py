import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional

from pydantic import Field, field_validator, model_validator

from app.assessments.klsi_v4.logic import CONTEXT_NAMES
from app.i18n.id_messages import ValidationMessages
from app.schemas.base import CamelModel


class ItemChoiceRank(CamelModel):
    choice_id: int = Field(..., description="ID of the selected choice")
    rank: int = Field(..., ge=1, le=4, description="Rank assigned (1=Least like me, 4=Most like me)")


class ItemRank(CamelModel):
    item_id: int = Field(gt=0)
    ranks: list[ItemChoiceRank] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="List of 4 ranked choices. Must be unique ranks 1-4."
    )

    @field_validator("ranks")
    @classmethod
    def validate_ranks(cls, v: list[ItemChoiceRank]):
        if len(v) != 4:
            raise ValueError(ValidationMessages.ITEM_RANK_COUNT)
        
        # Check unique choice IDs
        choice_ids = {r.choice_id for r in v}
        if len(choice_ids) != 4:
            raise ValueError("Duplicate choice IDs in item rank")
            
        # Check permutation of ranks
        rank_values = sorted([r.rank for r in v])
        if rank_values != [1, 2, 3, 4]:
            raise ValueError(ValidationMessages.ITEM_RANK_PERMUTATION)
            
        return v


class ContextRank(CamelModel):
    context_name: str = Field(min_length=3, max_length=60)
    CE: int = Field(ge=1, le=4)
    RO: int = Field(ge=1, le=4)
    AC: int = Field(ge=1, le=4)
    AE: int = Field(ge=1, le=4)

    @field_validator("context_name")
    @classmethod
    def validate_context_name(cls, value: str) -> str:  # noqa: D401
        normalized = value.strip()
        if normalized not in CONTEXT_NAMES:
            raise ValueError(ValidationMessages.LFI_CONTEXT_UNKNOWN)
        return normalized

    @model_validator(mode="after")
    def validate_context(self):  # noqa: D401
        # Ensure permutation across the four ranks
        ranks = [self.CE, self.RO, self.AC, self.AE]
        if sorted(ranks) != [1, 2, 3, 4]:
            raise ValueError(ValidationMessages.CONTEXT_RANK_PERMUTATION)
        return self


class SessionSubmissionPayload(CamelModel):
    items: list[ItemRank] = Field(..., min_length=12, max_length=12)
    contexts: list[ContextRank] = Field(..., min_length=8, max_length=8)
    client_duration_ms: int | None = Field(None, ge=0, description="Total duration spent by user in ms")

    @field_validator("items")
    @classmethod
    def ensure_unique_items(cls, v: list[ItemRank]):  # noqa: D401
        ids = [x.item_id for x in v]
        if len(ids) != len(set(ids)):
            raise ValueError(ValidationMessages.DUPLICATE_ITEM_IDS)
        return v

    @field_validator("contexts")
    @classmethod
    def ensure_unique_contexts(cls, v: list[ContextRank]):  # noqa: D401
        names = [x.context_name for x in v]
        if len(names) != len(set(names)):
            raise ValueError(ValidationMessages.DUPLICATE_CONTEXT_NAMES)
        return v


class LegacyItemSubmissionPayload(CamelModel):
    """Payload model for legacy /submit_item requests."""

    item_id: int = Field(gt=0)
    ranks: dict[int, int]
    kind: Literal["item"] = "item"

    @field_validator("ranks")
    @classmethod
    def validate_ranks(cls, v: dict[int, int]):
        if len(v) != 4:
            raise ValueError(ValidationMessages.ITEM_RANK_COUNT)
        
        # Check permutation of ranks
        rank_values = sorted(v.values())
        if rank_values != [1, 2, 3, 4]:
            raise ValueError(ValidationMessages.ITEM_RANK_PERMUTATION)
            
        return v

    def runtime_payload(self) -> dict[str, object]:
        """Return dict payload expected by runtime.submit_payload."""
        return {
            "kind": self.kind,
            "item_id": self.item_id,
            "ranks": self.ranks,
        }


class LegacyContextSubmissionPayload(ContextRank):
    """Payload model for legacy /submit_context requests."""

    kind: Literal["context"] = "context"
    overwrite: bool = False

    def runtime_payload(self) -> dict[str, object]:
        """Return dict payload expected by runtime.submit_payload."""
        return {
            "kind": self.kind,
            "context_name": self.context_name,
            "CE": self.CE,
            "RO": self.RO,
            "AC": self.AC,
            "AE": self.AE,
            "overwrite": self.overwrite,
        }


class SingleItemResponsePayload(CamelModel):
    """Payload for real-time single item response (Walking Skeleton)."""

    item_id: int = Field(gt=0)
    response_map: dict[str, int]
    timestamp: str | None = None

    @field_validator("response_map")
    @classmethod
    def validate_response_map(cls, v: dict[str, int]):
        # Must be exactly 4 entries and a permutation of {1,2,3,4}
        if len(v) != 4:
            raise ValueError(ValidationMessages.ITEM_RANK_COUNT)
        
        required_keys = {"CE", "RO", "AC", "AE"}
        if set(v.keys()) != required_keys:
            raise ValueError("Keys must be exactly CE, RO, AC, AE")

        values = list(v.values())
        if sorted(values) != [1, 2, 3, 4]:
            raise ValueError(ValidationMessages.ITEM_RANK_PERMUTATION)
        return v


class SingleItemResponse(CamelModel):
    status: str
    progress: float


class AutosaveItemRank(CamelModel):
    item_id: int = Field(gt=0)
    ranks: dict[str, int]

    @field_validator("ranks")
    @classmethod
    def validate_autosave_ranks(cls, value: dict[str, int]):  # noqa: D401
        if len(value) != 4:
            raise ValueError(ValidationMessages.ITEM_RANK_COUNT)
        normalized: dict[str, int] = {}
        for option_code, rank in value.items():
            if not isinstance(option_code, str):
                raise ValueError(ValidationMessages.ITEM_OPTION_NOT_FOUND)
            code = option_code.strip().upper()
            if code not in {"CE", "RO", "AC", "AE"}:
                raise ValueError(ValidationMessages.ITEM_OPTION_NOT_FOUND)
            normalized[code] = rank
        if sorted(normalized.values()) != [1, 2, 3, 4]:
            raise ValueError(ValidationMessages.ITEM_RANK_PERMUTATION)
        return normalized


class SessionAutosavePayload(CamelModel):
    responses: list[AutosaveItemRank] = Field(default_factory=list)
    contexts: list[ContextRank] = Field(default_factory=list)

    @field_validator("responses")
    @classmethod
    def ensure_unique_item_ids(cls, value: list[AutosaveItemRank]):  # noqa: D401
        ids = [entry.item_id for entry in value]
        if len(ids) != len(set(ids)):
            raise ValueError(ValidationMessages.DUPLICATE_ITEM_IDS)
        return value


class SessionStartResponse(CamelModel):
    session_id: uuid.UUID
    guest_token: Optional[str] = None


class StartSessionRequest(CamelModel):
    instrument_code: str
    instrument_version: Optional[str] = None


class OperationStatus(CamelModel):
    ok: bool = True


class SessionOperationResult(OperationStatus):
    result: dict[str, Any] | None = None


class SessionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class SessionListResponse(CamelModel):
    id: uuid.UUID
    start_time: datetime
    end_time: Optional[datetime] = None
    status: SessionStatus
    assessment_id: str
    assessment_version: str

    model_config = {
        "from_attributes": True
    }


class AssessmentItemResponsePayload(CamelModel):
    item_id: int
    response_rank: int = Field(ge=1, le=4)
    response_latency_ms: int
    blur_events: int | None = 0



class AssessmentResponseBatch(CamelModel):
    responses: list[AssessmentItemResponsePayload]


class EngineSessionResponse(CamelModel):
    session_id: uuid.UUID
    instrument_code: str
    instrument_version: str | None = None
    status: SessionStatus
    delivery: dict[str, Any] | None = None
    responses: list[ItemRank]
    contexts: list[ContextRank]
    total_items: int
    completed_items: int
    progress: float
    current_item_index: int


class SessionUpdate(CamelModel):
    status: Optional[SessionStatus] = None
    reason: Optional[str] = None  # For force finalize or abandonment reasons
