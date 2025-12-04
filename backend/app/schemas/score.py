from typing import Dict, List, Optional, Self

from pydantic import Field, model_validator

from app.schemas.base import CamelModel

from app.i18n.id_messages import ValidationMessages

__all__ = [
    "RawTotalsWrite",
    "ContextRanksWrite",
    "ScorePreviewRequest",
    "ScorePreviewRaw",
    "ScorePreviewStyle",
    "ScorePreviewLFI",
    "ScorePreviewPercentiles",
    "ScorePreviewAnalytics",
    "ScorePreviewResponse",
]


class RawTotalsWrite(CamelModel):
    CE: int = Field(ge=0)
    RO: int = Field(ge=0)
    AC: int = Field(ge=0)
    AE: int = Field(ge=0)


class ContextRanksWrite(CamelModel):
    """Raw ranking for a specific context scenario (Audit Point 1)."""
    context_id: int = Field(..., description="ID of the context scenario (1-8)")
    ranks: dict[int, int] = Field(
        ...,
        description="Map of choice_id to rank (1-4). Must be unique per context.",
        json_schema_extra={"example": {"101": 4, "102": 3, "103": 2, "104": 1}}
    )

    @model_validator(mode="after")
    def _validate_ranks(self) -> Self:
        if len(self.ranks) != 4:
            raise ValueError(ValidationMessages.CONTEXT_RANK_COUNT or "Must rank exactly 4 options")
        if sorted(self.ranks.values()) != [1, 2, 3, 4]:
            raise ValueError(ValidationMessages.CONTEXT_RANK_PERMUTATION or "Ranks must be 1, 2, 3, 4")
        return self


from app.schemas.session import ItemRank

class ScorePreviewRequest(CamelModel):
    """Request payload for score preview.
    
    Validation rules:
    - Exactly 8 context entries required
    - No duplicate context IDs allowed
    - No duplicate item IDs allowed within items list
    """
    items: List[ItemRank]
    contexts: List[ContextRanksWrite]

    @model_validator(mode="after")
    def _validate_payload(self) -> Self:
        """Validate context count, context ID uniqueness, and item ID uniqueness."""
        # Validate context count
        if len(self.contexts) != 8:
            raise ValueError(ValidationMessages.CONTEXT_COUNT_REQUIRED)
        
        # [Audit Fix] Check for duplicate context IDs
        context_ids = [c.context_id for c in self.contexts]
        if len(set(context_ids)) != len(context_ids):
            raise ValueError("Duplicate context IDs found in request")
        
        # [Audit Fix] Check for duplicate item IDs in session payload
        if self.items:
            item_ids = [item.item_id for item in self.items]
            if len(set(item_ids)) != len(item_ids):
                raise ValueError(ValidationMessages.DUPLICATE_ITEM_IDS)
            
        return self


class ScorePreviewRaw(CamelModel):
    ce: int = Field(ge=12, le=48, description="Concrete Experience raw score (12-48)")
    ro: int = Field(ge=12, le=48, description="Reflective Observation raw score (12-48)")
    ac: int = Field(ge=12, le=48, description="Abstract Conceptualization raw score (12-48)")
    ae: int = Field(ge=12, le=48, description="Active Experimentation raw score (12-48)")
    acce: int = Field(ge=-36, le=36, description="AC-CE dialectic score (-36 to +36)")
    aero: int = Field(ge=-36, le=36, description="AE-RO dialectic score (-36 to +36)")
    acc_assm: int = Field(ge=-72, le=72, description="Accommodating-Assimilating dimension (AC+RO) - (AE+CE)")
    accom_minus_assim: int = Field(ge=-72, le=72, description="Inverse of acc_assm")
    conv_div: int = Field(
        ge=-72, 
        le=72, 
        description="Converging-Diverging dimension (AC+AE) - (CE+RO). Positive = Converging, Negative = Diverging."
    )


class ScorePreviewStyle(CamelModel):
    primary_name: Optional[str]
    backup_name: Optional[str] = None
    cycle_phase: Optional[str] = None


class ScorePreviewLFI(CamelModel):
    value: float


class ScorePreviewPercentiles(CamelModel):
    CE: Optional[float]
    RO: Optional[float]
    AC: Optional[float]
    AE: Optional[float]
    ACCE: Optional[float]
    AERO: Optional[float]
    source_provenance: str


class ScorePreviewAnalytics(CamelModel):
    predicted_lfi_curve: List[Dict[str, float]]


class ScorePreviewResponse(CamelModel):
    raw: ScorePreviewRaw
    style: ScorePreviewStyle
    lfi: ScorePreviewLFI
    percentiles: ScorePreviewPercentiles
    analytics: ScorePreviewAnalytics
