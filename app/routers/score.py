from typing import List

from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator, model_validator

from app.data.norms import APPENDIX_TABLES
from app.services.regression import predicted_curve
from app.services.scoring import STYLE_CUTS, compute_kendalls_w

router = APIRouter(prefix="/score", tags=["score"])


class RawTotals(BaseModel):
    CE: int
    RO: int
    AC: int
    AE: int


class ContextRanks(BaseModel):
    CE: int = Field(ge=1, le=4)
    RO: int = Field(ge=1, le=4)
    AC: int = Field(ge=1, le=4)
    AE: int = Field(ge=1, le=4)

    @model_validator(mode="after")
    def unique_ranks(self) -> "ContextRanks":
        # After all fields set; enforce set {1,2,3,4}
        ranks = {self.CE, self.RO, self.AC, self.AE}
        if ranks != {1, 2, 3, 4}:
            raise ValueError("Ranks per context must be unique 1..4")
        return self


class ScoreRequest(BaseModel):
    raw: RawTotals
    contexts: List[ContextRanks]

    @field_validator("contexts")
    @classmethod
    def require_eight_contexts(cls, v: List[ContextRanks]) -> List[ContextRanks]:
        if len(v) != 8:
            raise ValueError("Exactly 8 contexts required")
        return v


@router.post("/raw")
def score_raw(payload: ScoreRequest):
    CE, RO, AC, AE = payload.raw.CE, payload.raw.RO, payload.raw.AC, payload.raw.AE
    ACCE = AC - CE
    AERO = AE - RO
    # Align with core KLSI spec used in services.scoring:
    # Assimilation - Accommodation = (AC + RO) - (AE + CE)
    ACC_ASSM = (AC + RO) - (AE + CE)
    # Provide the opposite orientation as well for consumers that follow the
    # regression module convention (Accommodating - Assimilating)
    ACCOM_MINUS_ASSIM = -ACC_ASSM
    CONV_DIV = (AC + AE) - (CE + RO)

    # Style classification
    primary = None
    for name, rule in STYLE_CUTS.items():
        if rule(ACCE, AERO):
            primary = name
            break

    # LFI via Kendall's W
    contexts = [{"CE": c.CE, "RO": c.RO, "AC": c.AC, "AE": c.AE} for c in payload.contexts]
    W = compute_kendalls_w(contexts)
    LFI = 1 - W

    # Percentiles using Appendix fallback tables
    tables = APPENDIX_TABLES
    percentiles = {
        "CE": tables["CE"].lookup(CE),
        "RO": tables["RO"].lookup(RO),
        "AC": tables["AC"].lookup(AC),
        "AE": tables["AE"].lookup(AE),
        "ACCE": tables["ACCE"].lookup(ACCE),
        "AERO": tables["AERO"].lookup(AERO),
        "source_provenance": "AppendixFallback"
    }

    return {
        "raw": {"CE": CE, "RO": RO, "AC": AC, "AE": AE, "ACCE": ACCE, "AERO": AERO, "ACC_ASSM": ACC_ASSM, "ACCOM_MINUS_ASSIM": ACCOM_MINUS_ASSIM, "CONV_DIV": CONV_DIV},
        "style": {"primary_name": primary},
        "lfi": {"value": LFI},
        "percentiles": percentiles,
        "analytics": {"predicted_lfi_curve": predicted_curve()}
    }
