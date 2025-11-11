from __future__ import annotations

from pydantic import BaseModel, Field, validator


class ItemRank(BaseModel):
    item_id: int = Field(gt=0)
    ranks: dict[int, int]

    @validator("ranks")
    def validate_ranks(cls, v: dict[int, int]):  # noqa: D401
        # Must be exactly 4 entries and a permutation of {1,2,3,4}
        if len(v) != 4:
            raise ValueError("Item harus memiliki tepat 4 pilihan dengan ranking")
        values = list(v.values())
        if sorted(values) != [1, 2, 3, 4]:
            raise ValueError("Ranking item harus merupakan permutasi [1,2,3,4]")
        return v


class ContextRank(BaseModel):
    context_name: str = Field(min_length=3, max_length=60)
    CE: int = Field(ge=1, le=4)
    RO: int = Field(ge=1, le=4)
    AC: int = Field(ge=1, le=4)
    AE: int = Field(ge=1, le=4)

    @validator("AE")
    def validate_context(cls, _v, values):  # noqa: D401
        # Ensure permutation across the four ranks
        ranks = [values.get("CE"), values.get("RO"), values.get("AC"), values.get("AE")]
        if sorted(ranks) != [1, 2, 3, 4]:
            raise ValueError("Ranking konteks LFI harus permutasi [1,2,3,4]")
        return _v


class SessionSubmissionPayload(BaseModel):
    items: list[ItemRank] = Field(..., min_items=12, max_items=12)
    contexts: list[ContextRank] = Field(..., min_items=8, max_items=8)

    @validator("items")
    def ensure_unique_items(cls, v: list[ItemRank]):  # noqa: D401
        ids = [x.item_id for x in v]
        if len(ids) != len(set(ids)):
            raise ValueError("Item ID duplikat dalam payload batch")
        return v

    @validator("contexts")
    def ensure_unique_contexts(cls, v: list[ContextRank]):  # noqa: D401
        names = [x.context_name for x in v]
        if len(names) != len(set(names)):
            raise ValueError("Nama konteks LFI duplikat dalam payload batch")
        return v
