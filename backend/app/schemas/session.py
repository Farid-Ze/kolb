from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.assessments.klsi_v4.logic import CONTEXT_NAMES
from app.i18n.id_messages import ValidationMessages


class ItemRank(BaseModel):
    item_id: int = Field(gt=0)
    ranks: dict[int, int]

    @field_validator("ranks")
    @classmethod
    def validate_ranks(cls, v: dict[int, int]):  # noqa: D401
        # Must be exactly 4 entries and a permutation of {1,2,3,4}
        if len(v) != 4:
            raise ValueError(ValidationMessages.ITEM_RANK_COUNT)
        values = list(v.values())
        if sorted(values) != [1, 2, 3, 4]:
            raise ValueError(ValidationMessages.ITEM_RANK_PERMUTATION)
        return v


class ContextRank(BaseModel):
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


class SessionSubmissionPayload(BaseModel):
    items: list[ItemRank] = Field(..., min_length=12, max_length=12)
    contexts: list[ContextRank] = Field(..., min_length=8, max_length=8)

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


class LegacyItemSubmissionPayload(ItemRank):
    """Payload model for legacy /submit_item requests."""

    kind: Literal["item"] = "item"

    def runtime_payload(self) -> dict[str, object]:
        """Return dict payload expected by runtime.submit_payload."""
        return {
            "kind": self.kind,
            "item_id": self.item_id,
            "ranks": {int(choice_id): rank for choice_id, rank in self.ranks.items()},
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
