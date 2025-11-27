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
    CE: int = Field(ge=1, le=4)
    RO: int = Field(ge=1, le=4)
    AC: int = Field(ge=1, le=4)
    AE: int = Field(ge=1, le=4)

    @model_validator(mode="after")
    def _unique_ranks(self) -> Self:  # noqa: D401
        """Ensure forced-choice permutation of ranks 1..4."""
        ranks = {self.CE, self.RO, self.AC, self.AE}
        if ranks != {1, 2, 3, 4}:
            raise ValueError(ValidationMessages.CONTEXT_RANK_UNIQUE)
        return self


class ScorePreviewRequest(CamelModel):
    raw: RawTotalsWrite
    contexts: List[ContextRanksWrite]

    @model_validator(mode="after")
    def _validate_context_count(self) -> Self:
        if len(self.contexts) != 8:
            raise ValueError(ValidationMessages.CONTEXT_COUNT_REQUIRED)
        return self


class ScorePreviewRaw(CamelModel):
    ce: int
    ro: int
    ac: int
    ae: int
    acce: int
    aero: int
    acc_assm: int
    accom_minus_assim: int
    conv_div: int


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
