from app.data.norms import APPENDIX_TABLES
from app.schemas.score import (
    ContextItemRank,
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
from app.assessments.klsi_v4.logic import determine_style_from_percentiles, determine_backup_style_from_percentiles, determine_cycle_phase

# MATHEMATICAL FIDELITY NOTE:
# This preview module uses the EXACT SAME production functions from logic.py and
# calculations.py to ensure mathematical consistency. The only difference is that
# percentile lookup uses generic norms (APPENDIX_TABLES) since user demographic
# data is not available pre-submission. This guarantees preview accuracy.


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





from sqlalchemy.orm import Session
from app.models.klsi.items import ItemChoice

def _calculate_raw_totals(db: Session, items: list) -> RawTotalsWrite:
    """Calculate raw totals from item ranks by querying choice metadata."""
    totals = {"CE": 0, "RO": 0, "AC": 0, "AE": 0}
    
    # Collect all choice IDs
    all_choice_ids = []
    rank_map = {} # choice_id -> rank
    for item in items:
        for r in item.ranks:
            all_choice_ids.append(r.choice_id)
            rank_map[r.choice_id] = r.rank
            
    if not all_choice_ids:
        return RawTotalsWrite(CE=0, RO=0, AC=0, AE=0)

    # Query metadata
    choices = db.query(ItemChoice).filter(ItemChoice.id.in_(all_choice_ids)).all()
    
    for choice in choices:
        if choice.learning_mode:
            mode = choice.learning_mode.value
            if mode in totals:
                totals[mode] += rank_map.get(choice.id, 0)
                
    return RawTotalsWrite(
        CE=totals["CE"],
        RO=totals["RO"],
        AC=totals["AC"],
        AE=totals["AE"]
    )

def build_score_preview(db: Session, payload: ScorePreviewRequest) -> ScorePreviewResponse:
    raw = _calculate_raw_totals(db, payload.items)
    ce, ro, ac, ae = raw.CE, raw.RO, raw.AC, raw.AE
    acce = ac - ce
    aero = ae - ro
    acc_assm = (ac + ro) - (ae + ce)
    accom_minus_assim = -acc_assm
    conv_div = (ac + ae) - (ce + ro)

def _resolve_context_ranks(db: Session, contexts: list) -> list[dict[str, int]]:
    """Resolve raw choice IDs to mode-rank maps for LFI calculation."""
    all_choice_ids = []
    for ctx in contexts:
        all_choice_ids.extend(ctx.ranks.keys())
        
    if not all_choice_ids:
        return []
        
    choices = db.query(ItemChoice).filter(ItemChoice.id.in_(all_choice_ids)).all()
    choice_mode_map = {c.id: c.learning_mode.value for c in choices}
    
    resolved_contexts = []
    for ctx in contexts:
        mode_ranks = {}
        for choice_id, rank in ctx.ranks.items():
            if choice_id in choice_mode_map:
                mode_ranks[choice_mode_map[choice_id]] = rank
        resolved_contexts.append(mode_ranks)
        
    return resolved_contexts

def build_score_preview(db: Session, payload: ScorePreviewRequest) -> ScorePreviewResponse:
    raw = _calculate_raw_totals(db, payload.items)
    ce, ro, ac, ae = raw.CE, raw.RO, raw.AC, raw.AE
    acce = ac - ce
    aero = ae - ro
    acc_assm = (ac + ro) - (ae + ce)
    accom_minus_assim = -acc_assm
    conv_div = (ac + ae) - (ce + ro)
    
    # Resolve raw context ranks to mode ranks (Audit Point 1)
    resolved_contexts = _resolve_context_ranks(db, payload.contexts)
    
    # Refactored to use Variance-based LFI (Epic C-01)
    lfi_value = calculate_lfi_variance(resolved_contexts)

    pcts = _percentiles(raw, acce, aero)
    
    # Refactored to use Kite Topology (Epic C-02)
    acce_val = pcts.ACCE if pcts.ACCE is not None else 50.0
    aero_val = pcts.AERO if pcts.AERO is not None else 50.0

    primary_name = determine_style_from_percentiles(acce_val, aero_val)
    backup_name = determine_backup_style_from_percentiles(acce_val, aero_val, primary_name)
    cycle_phase = determine_cycle_phase(primary_name)

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
        style=ScorePreviewStyle(
            primary_name=primary_name, 
            backup_name=backup_name,
            cycle_phase=cycle_phase
        ),
        lfi=ScorePreviewLFI(value=lfi_value),
        percentiles=pcts,
        analytics=ScorePreviewAnalytics(predicted_lfi_curve=predicted_curve()),
    )
    return response
