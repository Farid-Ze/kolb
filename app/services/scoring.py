from math import pow

from sqlalchemy import text
from sqlalchemy.orm import Session

# Fallback normative dictionaries (Appendix 1 & 7) if DB normative tables absent
from app.data.norms import (
    AC_PERCENTILES,
    ACCE_PERCENTILES,
    AE_PERCENTILES,
    AERO_PERCENTILES,
    CE_PERCENTILES,
    RO_PERCENTILES,
    lookup_lfi,
    lookup_percentile,
)
from app.models.klsi import (
    AssessmentSession,
    CombinationScore,
    ItemType,
    LearningFlexibilityIndex,
    LearningStyleType,
    LFIContextScore,
    PercentileScore,
    ScaleScore,
    User,
    UserLearningStyle,
    UserResponse,
)

# Cutpoints per KLSI 4.0: ACCE bands (<6, 6–14, >14) and AERO bands (<1, 1–11, >11)
STYLE_CUTS = {
    "Imagining":   lambda acc, aer: acc <= 5  and aer <= 0,    # low ACCE, low AERO
    "Experiencing":lambda acc, aer: acc <= 5  and 1 <= aer <= 11, # low ACCE, mid AERO
    "Initiating":  lambda acc, aer: acc <= 5  and aer >= 12,   # low ACCE, high AERO
    "Reflecting":  lambda acc, aer: 6 <= acc <= 14 and aer <= 0,  # mid ACCE, low AERO
    "Balancing":   lambda acc, aer: 6 <= acc <= 14 and 1 <= aer <= 11, # mid, mid
    "Acting":      lambda acc, aer: 6 <= acc <= 14 and aer >= 12, # mid ACCE, high AERO
    "Analyzing":   lambda acc, aer: acc >= 15 and aer <= 0,    # high ACCE, low AERO
    "Thinking":    lambda acc, aer: acc >= 15 and 1 <= aer <= 11, # high ACCE, mid AERO
    "Deciding":    lambda acc, aer: acc >= 15 and aer >= 12,   # high ACCE, high AERO
}

CONTEXT_NAMES = [
    "Starting_Something_New","Influencing_Someone","Getting_To_Know_Someone","Learning_In_A_Group",
    "Planning_Something","Analyzing_Something","Evaluating_An_Opportunity","Choosing_Between_Alternatives"
]


def _age_to_band(user: User) -> str | None:
    """Derive coarse age band compatible with Appendix 2.

    Returns a label like '19-24', '25-34', etc., or None if unknown.
    """
    if not user or not getattr(user, "date_of_birth", None):
        return None
    try:
        from datetime import date, datetime
        dob = getattr(user, "date_of_birth", None)
        if dob is None:
            return None
        if isinstance(dob, datetime):
            dob = dob.date()
        today = date.today()
        years = today.year - dob.year - int((today.month, today.day) < (dob.month, dob.day))
        if years < 19:
            return "<19"
        if 19 <= years <= 24:
            return "19-24"
        if 25 <= years <= 34:
            return "25-34"
        if 35 <= years <= 44:
            return "35-44"
        if 45 <= years <= 54:
            return "45-54"
        if 55 <= years <= 64:
            return "55-64"
        return ">64"
    except Exception:
        return None


def _resolve_norm_groups(db: Session, session_id: int) -> list[str]:
    """Return ordered list of candidate norm_group labels based on user demographics.

    Precedence (assumption; document in specs): Education → Age → Gender → Total.
    The labels are free-form strings; ensure your imported CSV uses matching names, e.g.:
      - EDU:University Degree
      - AGE:19-24
      - GENDER:Male
      - Total
    """
    sess: AssessmentSession | None = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    user: User | None = sess.user if sess else None
    candidates: list[str] = []

    # Education
    if user and user.education_level:
        candidates.append(f"EDU:{user.education_level.value}")

    # Country (cultural cluster proxy)
    if user and getattr(user, "country", None):
        candidates.append(f"COUNTRY:{user.country}")

    # Age band
    age_band = _age_to_band(user) if user else None
    if age_band:
        candidates.append(f"AGE:{age_band}")

    # Gender
    if user and user.gender:
        candidates.append(f"GENDER:{user.gender.value}")

    # Always include Total as fallback before Appendix dicts
    candidates.append("Total")
    # De-duplicate while preserving order
    seen = set()
    ordered = []
    for g in candidates:
        if g not in seen:
            ordered.append(g)
            seen.add(g)
    return ordered


def compute_raw_scale_scores(db: Session, session_id: int) -> ScaleScore:
    responses = db.query(UserResponse).filter(UserResponse.session_id == session_id).all()
    # aggregate ranks per learning mode only for first 12 items (learning style items)
    mode_totals = {"CE":0,"RO":0,"AC":0,"AE":0}
    for r in responses:
        # Aggregate only Learning Style items (exclude LFI contexts)
        if r.choice.item.item_type == ItemType.learning_style:
            mode = r.choice.learning_mode.value
            mode_totals[mode] += r.rank_value
    scale = ScaleScore(session_id=session_id,
                       CE_raw=mode_totals['CE'], RO_raw=mode_totals['RO'],
                       AC_raw=mode_totals['AC'], AE_raw=mode_totals['AE'])
    db.add(scale)
    return scale

def compute_combination_scores(db: Session, scale: ScaleScore) -> CombinationScore:
    acc = scale.AC_raw - scale.CE_raw
    aer = scale.AE_raw - scale.RO_raw
    # Assimilation - Accommodation per KLSI 4.0 spec: (AC + RO) - (AE + CE)
    assimilation_accommodation = (scale.AC_raw + scale.RO_raw) - (scale.AE_raw + scale.CE_raw)
    converging_diverging = (scale.AC_raw + scale.AE_raw) - (scale.CE_raw + scale.RO_raw)
    # Continuous balance scores centered on KLSI 4.0 medians (Appendix guidance)
    # BALANCE_ACCE = | AC - (CE + 9) | ; BALANCE_AERO = | AE - (RO + 6) |
    balance_acce = abs(scale.AC_raw - (scale.CE_raw + 9))
    balance_aero = abs(scale.AE_raw - (scale.RO_raw + 6))
    combo = CombinationScore(session_id=scale.session_id, ACCE_raw=acc, AERO_raw=aer,
                             assimilation_accommodation=assimilation_accommodation,
                             converging_diverging=converging_diverging,
                             balance_acce=balance_acce,
                             balance_aero=balance_aero)
    db.add(combo)
    return combo

def assign_learning_style(db: Session, combo: CombinationScore) -> UserLearningStyle:
    acc, aer = combo.ACCE_raw, combo.AERO_raw
    # primary style by rule-in region
    primary_name = None
    for name, rule in STYLE_CUTS.items():
        if rule(acc, aer):
            primary_name = name
            break
    # objective backup: pick the next closest region by minimal L1 distance to region window
    def dist_to_window(a: int, r: int, name: str) -> int:
        # Use style type ranges if available, else infer from name grouping
        st = db.query(LearningStyleType).filter(LearningStyleType.style_name==name).first()
        if st:
            dx = 0
            if a < st.ACCE_min:
                dx = st.ACCE_min - a
            elif a > st.ACCE_max:
                dx = a - st.ACCE_max
            dy = 0
            if r < st.AERO_min:
                dy = st.AERO_min - r
            elif r > st.AERO_max:
                dy = r - st.AERO_max
            return dx + dy
        # fallback large distance (should not happen if seeded)
        return 1_000_000

    names = list(STYLE_CUTS.keys())
    dists = [(name, dist_to_window(acc, aer, name)) for name in names]
    # sort by distance; primary should be zero when inside window
    dists.sort(key=lambda x: x[1])
    primary = dists[0][0] if primary_name is None else primary_name
    backup = None
    for name, d in dists:
        if name != primary:
            backup = name
            break

    primary_type = db.query(LearningStyleType).filter(LearningStyleType.style_name==primary).first()
    kite = {}
    if combo.session and combo.session.scale_score:
        kite = {"CE": combo.session.scale_score.CE_raw,
                "RO": combo.session.scale_score.RO_raw,
                "AC": combo.session.scale_score.AC_raw,
                "AE": combo.session.scale_score.AE_raw}
    ustyle = UserLearningStyle(session_id=combo.session_id,
                               primary_style_type_id=primary_type.id if primary_type else None,
                               ACCE_raw=acc, AERO_raw=aer,
                               kite_coordinates=kite,
                               style_intensity_score=abs(acc)+abs(aer))
    db.add(ustyle)
    # Save backup into BackupLearningStyle for traceability
    from app.models.klsi import BackupLearningStyle
    from app.models.klsi import LearningStyleType as LST
    if backup:
        btype = db.query(LST).filter(LST.style_name==backup).first()
        if btype:
            db.add(BackupLearningStyle(session_id=combo.session_id, style_type_id=btype.id, frequency_count=1, percentage=None, contexts_used=None))
    return ustyle

def compute_kendalls_w(context_scores: list[dict]) -> float:
    # context_scores: list of dict {CE,RO,AC,AE} ranks for each of 8 contexts
    m = len(context_scores)  # 8
    modes = ['CE','RO','AC','AE']
    # Sum of ranks per mode
    sums = {mode:0 for mode in modes}
    for ctx in context_scores:
        for mode in modes:
            sums[mode] += ctx[mode]
    # R_bar
    n = len(modes)
    R_bar = m*(n+1)/2  # m*(n+1)/2
    numerator = 0.0
    for mode in modes:
        numerator += (sums[mode]-R_bar)**2
    # Kendall's W formula: 12 * Σ(Rj - R̄)^2 / (m^2 * (n^3 - n))
    W = 12 * numerator / (m*m * (pow(n,3)-n))
    return max(0.0, min(1.0, W))

def compute_lfi(db: Session, session_id: int) -> LearningFlexibilityIndex:
    rows = db.query(LFIContextScore).filter(LFIContextScore.session_id==session_id).all()
    context_scores = []
    for r in rows:
        context_scores.append({"CE": r.CE_rank, "RO": r.RO_rank, "AC": r.AC_rank, "AE": r.AE_rank})
    W = compute_kendalls_w(context_scores)
    lfi_value = 1 - W
    # Try DB normative first using subgroup precedence; raw_score stored as int( LFI * 100 ) if present
    lfi_pct = None
    for ng in _resolve_norm_groups(db, session_id):
        row = db.execute(
            text("SELECT percentile FROM normative_conversion_table WHERE norm_group=:g AND scale_name='LFI' AND raw_score=:r LIMIT 1"),
            {"g": ng, "r": int(round(lfi_value * 100))}
        ).fetchone()
        if row:
            lfi_pct = float(row[0])
            break
    if lfi_pct is None:
        # Fallback to Appendix 7 mapping (nearest value)
        lfi_pct = lookup_lfi(round(lfi_value, 2))  # round to 2 decimals for dictionary keys
    level = None
    if lfi_pct is not None:
        level = 'Low' if lfi_pct < 33.34 else ('Moderate' if lfi_pct <= 66.67 else 'High')
    lfi = LearningFlexibilityIndex(session_id=session_id, W_coefficient=W, LFI_score=lfi_value, LFI_percentile=lfi_pct, flexibility_level=level)
    db.add(lfi)
    return lfi

def apply_percentiles(db: Session, scale: ScaleScore, combo: CombinationScore) -> PercentileScore | None:
    """Populate percentile scores using DB normative tables if present else Appendix fallback.

    Precedence: DB row (normative_conversion_table) > local dict fallback.
    """
    used_db_any = False
    used_group: str | None = None
    candidates = _resolve_norm_groups(db, scale.session_id)

    def pct(scale_name: str, raw: int) -> float | None:
        # Try subgroup precedence list first
        for ng in candidates:
            row = db.execute(
                text("SELECT percentile FROM normative_conversion_table WHERE norm_group=:g AND scale_name=:s AND raw_score=:r LIMIT 1"),
                {"g": ng, "s": scale_name, "r": raw}
            ).fetchone()
            if row:
                nonlocal used_db_any, used_group
                used_db_any = True
                used_group = ng if used_group is None else used_group
                return float(row[0])
        # Fallback dictionary
        if scale_name == 'CE':
            return lookup_percentile(raw, CE_PERCENTILES)
        if scale_name == 'RO':
            return lookup_percentile(raw, RO_PERCENTILES)
        if scale_name == 'AC':
            return lookup_percentile(raw, AC_PERCENTILES)
        if scale_name == 'AE':
            return lookup_percentile(raw, AE_PERCENTILES)
        if scale_name == 'ACCE':
            return lookup_percentile(raw, ACCE_PERCENTILES)
        if scale_name == 'AERO':
            return lookup_percentile(raw, AERO_PERCENTILES)
        return None
    ps = PercentileScore(session_id=scale.session_id,
                         norm_group_used=(used_group if used_db_any else 'AppendixFallback'),
                         CE_percentile=pct('CE', scale.CE_raw),
                         RO_percentile=pct('RO', scale.RO_raw),
                         AC_percentile=pct('AC', scale.AC_raw),
                         AE_percentile=pct('AE', scale.AE_raw),
                         ACCE_percentile=pct('ACCE', combo.ACCE_raw),
                         AERO_percentile=pct('AERO', combo.AERO_raw))
    db.add(ps)
    return ps

def finalize_session(db: Session, session_id: int):
    scale = compute_raw_scale_scores(db, session_id)
    combo = compute_combination_scores(db, scale)
    db.flush()
    ustyle = assign_learning_style(db, combo)
    lfi = compute_lfi(db, session_id)
    percentiles = apply_percentiles(db, scale, combo)
    # Audit log entry
    from hashlib import sha256

    from app.models.klsi import AuditLog
    payload = f"{scale.CE_raw},{scale.RO_raw},{scale.AC_raw},{scale.AE_raw};{combo.ACCE_raw},{combo.AERO_raw};{lfi.LFI_score}"
    db.add(AuditLog(actor='system', action='FINALIZE_SESSION', payload_hash=sha256(payload.encode('utf-8')).hexdigest()))
    return {
        "scale": scale,
        "combination": combo,
        "style": ustyle,
        "lfi": lfi,
        "percentiles": percentiles
    }
