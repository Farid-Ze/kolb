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
from app.assessments.klsi_v4.calculations import calculate_lfi_variance
from app.assessments.klsi_v4.logic import determine_style_from_percentiles, determine_backup_style_from_percentiles


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
    # Refactored to use Variance-based LFI (Epic C-01)
    lfi_value = calculate_lfi_variance(contexts)

    pcts = _percentiles(raw, acce, aero)
    
    # Refactored to use Kite Topology (Epic C-02)
    acce_val = pcts.ACCE if pcts.ACCE is not None else 50.0
    aero_val = pcts.AERO if pcts.AERO is not None else 50.0

    primary_name = determine_style_from_percentiles(acce_val, aero_val)
    backup_name = determine_backup_style_from_percentiles(acce_val, aero_val, primary_name)

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
        style=ScorePreviewStyle(primary_name=primary_name, backup_name=backup_name),
        lfi=ScorePreviewLFI(value=lfi_value),
        percentiles=pcts,
        analytics=ScorePreviewAnalytics(predicted_lfi_curve=predicted_curve()),
    )
    return response
