from typing import List

from fastapi import APIRouter
from pydantic import BaseModel, Field, validator

from app.data.norms import (
    AC_PERCENTILES,
    ACCE_PERCENTILES,
    AE_PERCENTILES,
    AERO_PERCENTILES,
    CE_PERCENTILES,
    RO_PERCENTILES,
    lookup_percentile,
)
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

    @validator('*')
    def ensure_int(cls, v):
        return int(v)

    @validator('AE')
    def unique_ranks(cls, v, values):
        # Triggered after all fields are set; enforce set {1,2,3,4}
        if len(values) == 3:
            ranks = {values['CE'], values['RO'], values['AC'], v}
            if ranks != {1, 2, 3, 4}:
                raise ValueError('Ranks per context must be unique 1..4')
        return v


class ScoreRequest(BaseModel):
    raw: RawTotals
    contexts: List[ContextRanks]

    @validator('contexts')
    def require_eight_contexts(cls, v):
        if len(v) != 8:
            raise ValueError('Exactly 8 contexts required')
        return v


@router.post("/raw")
def score_raw(payload: ScoreRequest):
    CE, RO, AC, AE = payload.raw.CE, payload.raw.RO, payload.raw.AC, payload.raw.AE
    ACCE = AC - CE
    AERO = AE - RO
    ACC_ASSM = (AE + CE) - (AC + RO)
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
    percentiles = {
        "CE": lookup_percentile(CE, CE_PERCENTILES),
        "RO": lookup_percentile(RO, RO_PERCENTILES),
        "AC": lookup_percentile(AC, AC_PERCENTILES),
        "AE": lookup_percentile(AE, AE_PERCENTILES),
        "ACCE": lookup_percentile(ACCE, ACCE_PERCENTILES),
        "AERO": lookup_percentile(AERO, AERO_PERCENTILES),
        "source_provenance": "AppendixFallback"
    }

    return {
        "raw": {"CE": CE, "RO": RO, "AC": AC, "AE": AE, "ACCE": ACCE, "AERO": AERO, "ACC_ASSM": ACC_ASSM, "CONV_DIV": CONV_DIV},
        "style": {"primary_name": primary},
        "lfi": {"value": LFI},
        "percentiles": percentiles,
        "analytics": {"predicted_lfi_curve": predicted_curve()}
    }
