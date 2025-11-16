from __future__ import annotations

from app.data.norms import APPENDIX_TABLES
from app.schemas.score import (
    ContextRanksWrite,
    RawTotalsWrite,
    ScorePreviewAnalytics,
    ScorePreviewLFI,
    ScorePreviewPercentiles,
    ScorePreviewRequest,
    ScorePreviewResponse,
    ScorePreviewRaw,
    ScorePreviewStyle,
)
from app.services.regression import predicted_curve
from app.services.scoring import STYLE_CUTS, compute_kendalls_w


def _compute_style(acce: int, aero: int) -> str | None:
    for name, rule in STYLE_CUTS.items():
        if rule(acce, aero):
            return name
    return None


def _percentiles(raw: RawTotalsWrite, acce: int, aero: int) -> ScorePreviewPercentiles:
    tables = APPENDIX_TABLES
    return ScorePreviewPercentiles(
        CE=tables["CE"].lookup(raw.CE),
        RO=tables["RO"].lookup(raw.RO),
        AC=tables["AC"].lookup(raw.AC),
        AE=tables["AE"].lookup(raw.AE),
        ACCE=tables["ACCE"].lookup(acce),
        AERO=tables["AERO"].lookup(aero),
        source_provenance="AppendixFallback",
    )


def _contexts_to_dicts(contexts: list[ContextRanksWrite]) -> list[dict[str, int]]:
    return [ctx.model_dump() for ctx in contexts]


def build_score_preview(payload: ScorePreviewRequest) -> ScorePreviewResponse:
    raw = payload.raw
    ce, ro, ac, ae = raw.CE, raw.RO, raw.AC, raw.AE
    acce = ac - ce
    aero = ae - ro
    acc_assm = (ac + ro) - (ae + ce)
    accom_minus_assim = -acc_assm
    conv_div = (ac + ae) - (ce + ro)

    contexts = _contexts_to_dicts(payload.contexts)
    W = compute_kendalls_w(contexts)
    lfi_value = 1 - W

    response = ScorePreviewResponse(
        raw=ScorePreviewRaw(
            CE=ce,
            RO=ro,
            AC=ac,
            AE=ae,
            ACCE=acce,
            AERO=aero,
            ACC_ASSM=acc_assm,
            ACCOM_MINUS_ASSIM=accom_minus_assim,
            CONV_DIV=conv_div,
        ),
        style=ScorePreviewStyle(primary_name=_compute_style(acce, aero)),
        lfi=ScorePreviewLFI(value=lfi_value),
        percentiles=_percentiles(raw, acce, aero),
        analytics=ScorePreviewAnalytics(predicted_lfi_curve=predicted_curve()),
    )
    return response
