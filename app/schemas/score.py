from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field, model_validator

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


class RawTotalsWrite(BaseModel):
    CE: int = Field(ge=0)
    RO: int = Field(ge=0)
    AC: int = Field(ge=0)
    AE: int = Field(ge=0)


class ContextRanksWrite(BaseModel):
    CE: int = Field(ge=1, le=4)
    RO: int = Field(ge=1, le=4)
    AC: int = Field(ge=1, le=4)
    AE: int = Field(ge=1, le=4)

    @model_validator(mode="after")
    def _unique_ranks(self) -> "ContextRanksWrite":  # noqa: D401
        """Ensure forced-choice permutation of ranks 1..4."""
        ranks = {self.CE, self.RO, self.AC, self.AE}
        if ranks != {1, 2, 3, 4}:
            raise ValueError("Ranks per context must be unique 1..4")
        return self


class ScorePreviewRequest(BaseModel):
    raw: RawTotalsWrite
    contexts: List[ContextRanksWrite]

    @model_validator(mode="after")
    def _validate_context_count(self) -> "ScorePreviewRequest":
        if len(self.contexts) != 8:
            raise ValueError("Exactly 8 contexts required")
        return self


class ScorePreviewRaw(BaseModel):
    CE: int
    RO: int
    AC: int
    AE: int
    ACCE: int
    AERO: int
    ACC_ASSM: int
    ACCOM_MINUS_ASSIM: int
    CONV_DIV: int


class ScorePreviewStyle(BaseModel):
    primary_name: Optional[str]


class ScorePreviewLFI(BaseModel):
    value: float


class ScorePreviewPercentiles(BaseModel):
    CE: Optional[float]
    RO: Optional[float]
    AC: Optional[float]
    AE: Optional[float]
    ACCE: Optional[float]
    AERO: Optional[float]
    source_provenance: str


class ScorePreviewAnalytics(BaseModel):
    predicted_lfi_curve: List[Dict[str, float]]


class ScorePreviewResponse(BaseModel):
    raw: ScorePreviewRaw
    style: ScorePreviewStyle
    lfi: ScorePreviewLFI
    percentiles: ScorePreviewPercentiles
    analytics: ScorePreviewAnalytics
