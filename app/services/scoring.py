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


def validate_lfi_context_ranks(context_scores: list[dict]) -> None:
    """Validate that LFI context rankings satisfy forced-choice constraints.
    
    Each context must:
    1. Contain exactly 4 keys: CE, RO, AC, AE
    2. Have integer rank values between 1 and 4
    3. Form a permutation of [1, 2, 3, 4] (no duplicates, forced-choice)
    
    Args:
        context_scores: List of dicts with CE/RO/AC/AE rank mappings
    
    Raises:
        ValueError: If any validation constraint is violated
    
    Example:
        >>> validate_lfi_context_ranks([
        ...     {'CE': 1, 'RO': 2, 'AC': 3, 'AE': 4},  # Valid
        ...     {'CE': 2, 'RO': 1, 'AC': 4, 'AE': 3},  # Valid
        ... ])
        None  # No error
        
        >>> validate_lfi_context_ranks([
        ...     {'CE': 1, 'RO': 2, 'AC': 2, 'AE': 4},  # Duplicate rank!
        ... ])
        ValueError: Context 1 must be a permutation of [1,2,3,4] (forced-choice). Got: [1, 2, 2, 4]
    """
    modes = ['CE', 'RO', 'AC', 'AE']
    
    for idx, ctx in enumerate(context_scores, start=1):
        # Check all modes present
        if set(ctx.keys()) != set(modes):
            raise ValueError(
                f"Context {idx} must contain ranks for exactly {modes}. "
                f"Got keys: {list(ctx.keys())}"
            )
        
        ranks = [ctx[mode] for mode in modes]
        
        # Check integer types
        if not all(isinstance(r, int) for r in ranks):
            raise ValueError(
                f"Context {idx} has non-integer rank(s): {ranks}"
            )
        
        # Check range 1-4
        if not all(1 <= r <= 4 for r in ranks):
            raise ValueError(
                f"Context {idx} ranks must be within 1..4. Got: {ranks}"
            )
        
        # Check forced-choice (must be permutation of [1,2,3,4])
        if sorted(ranks) != [1, 2, 3, 4]:
            raise ValueError(
                f"Context {idx} must be a permutation of [1,2,3,4] (forced-choice). "
                f"Got: {ranks}"
            )



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
    sess: AssessmentSession | None = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.id == session_id)
        .first()
    )
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
    for name, _d in dists:
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
        btype = db.query(LST).filter(LST.style_name == backup).first()
        if btype:
            db.add(
                BackupLearningStyle(
                    session_id=combo.session_id,
                    style_type_id=btype.id,
                    frequency_count=1,
                    percentage=None,
                    contexts_used=None,
                )
            )
    return ustyle

def compute_kendalls_w(context_scores: list[dict]) -> float:
    """Compute Kendall's Coefficient of Concordance (W) for Learning Flexibility Index.
    
    Measures the degree of agreement in ranking the four learning modes (CE, RO, AC, AE)
    across eight different learning contexts. W ranges from 0 (complete disagreement/high
    flexibility) to 1 (perfect agreement/low flexibility).
    
    Formula (KLSI 4.0 Guide, page 1460):
        S = Σ(R_i - R̄)²  where R_i = sum of ranks for mode i, R̄ = m(n+1)/2
        W = 12S / [m² × (n³ - n)]  where m=8 contexts, n=4 modes
    
    Note: The denominator m²(n³-n) is algebraically equivalent to m²×n×(n²-1):
        n(n²-1) = n×n² - n×1 = n³ - n ✓
    
    Args:
        context_scores: List of 8 dicts, each with keys {CE, RO, AC, AE} and rank values 1-4.
                       Each context must be a forced-choice permutation of [1,2,3,4].
    
    Returns:
        W coefficient bounded to [0.0, 1.0]
    
    Examples:
        >>> # Perfect agreement (W=1.0): all contexts rank CE=1, RO=2, AC=3, AE=4
        >>> perfect = [{'CE':1,'RO':2,'AC':3,'AE':4}] * 8
        >>> compute_kendalls_w(perfect)
        1.0
        
        >>> # High flexibility (W≈0.0): varied rankings across contexts
        >>> varied = [
        ...     {'CE': 4, 'RO': 2, 'AC': 1, 'AE': 3},
        ...     {'CE': 3, 'RO': 1, 'AC': 2, 'AE': 4},
        ...     {'CE': 4, 'RO': 3, 'AC': 1, 'AE': 2},
        ...     {'CE': 4, 'RO': 2, 'AC': 1, 'AE': 3},
        ...     {'CE': 1, 'RO': 4, 'AC': 3, 'AE': 2},
        ...     {'CE': 1, 'RO': 3, 'AC': 4, 'AE': 2},
        ...     {'CE': 2, 'RO': 1, 'AC': 4, 'AE': 3},
        ...     {'CE': 1, 'RO': 2, 'AC': 4, 'AE': 3},
        ... ]
        >>> compute_kendalls_w(varied)
        0.025
    
    Reference:
        Kolb, A. Y., & Kolb, D. A. (2013). KLSI 4.0 Guide, page 1460.
        Legendre, P. (2005). Kendall's Coefficient of Concordance.
    """
    m = len(context_scores)  # number of contexts (judges), should be 8
    modes = ['CE','RO','AC','AE']
    n = len(modes)  # number of learning modes (objects), always 4
    
    # Step 1: Calculate row sums (R_i) for each mode across all contexts
    sums = {mode: 0 for mode in modes}
    for ctx in context_scores:
        for mode in modes:
            sums[mode] += ctx[mode]
    
    # Step 2: Calculate grand mean rank per mode
    R_bar = m * (n + 1) / 2  # For m contexts of n ranks, mean = m×(n+1)/2
    
    # Step 3: Calculate S = sum of squared deviations from grand mean
    S = sum((sums[mode] - R_bar) ** 2 for mode in modes)
    
    # Step 4: Apply Kendall's W formula
    # W = 12S / [m² × (n³ - n)]
    # Algebraic note: m²(n³-n) = m²×n×(n²-1) are equivalent forms
    numerator = 12 * S
    denominator = m * m * (pow(n, 3) - n)
    W = numerator / denominator
    
    # Bound to [0, 1] to handle floating-point edge cases
    return max(0.0, min(1.0, W))

def compute_lfi(db: Session, session_id: int) -> LearningFlexibilityIndex:
    """Compute Learning Flexibility Index (LFI) from 8 context rankings.
    
    LFI measures how consistently a person ranks learning modes across different contexts.
    It is derived from Kendall's W coefficient of concordance:
        LFI = 1 - W
    
    Where:
        - W = 0: Complete disagreement across contexts → LFI = 1 (high flexibility)
        - W = 1: Perfect agreement across contexts → LFI = 0 (low flexibility/rigid)
    
    The function:
    1. Retrieves 8 LFI context rankings from database
    2. Validates forced-choice constraints (each context = permutation of [1,2,3,4])
    3. Computes Kendall's W
    4. Transforms to LFI = 1 - W
    5. Converts to percentile using norm group precedence or Appendix 7 fallback
    6. Assigns flexibility level (Low <33.34, Moderate 33.34-66.67, High >66.67)
    
    Args:
        db: SQLAlchemy database session
        session_id: Assessment session identifier
    
    Returns:
        LearningFlexibilityIndex entity with W, LFI score, percentile, and level
    
    Raises:
        ValueError: If context rankings violate forced-choice constraints
    
    Example flow:
        User ranks CE/RO/AC/AE in 8 contexts → W=0.025 → LFI=0.975 → 97th percentile → High
    
    Reference:
        KLSI 4.0 Guide, Chapter 6, pages 1443-1466
    """
    # Retrieve LFI context scores from database
    rows = db.query(LFIContextScore).filter(LFIContextScore.session_id == session_id).all()
    
    # Convert to format expected by compute_kendalls_w
    context_scores = []
    for r in rows:
        context_scores.append({
            "CE": r.CE_rank,
            "RO": r.RO_rank,
            "AC": r.AC_rank,
            "AE": r.AE_rank
        })
    
    # Validate forced-choice constraints before computation
    validate_lfi_context_ranks(context_scores)
    
    # Compute Kendall's W
    W = compute_kendalls_w(context_scores)
    
    # Transform to LFI
    lfi_value = 1 - W
    
    # Convert to percentile using norm group precedence
    # Try DB normative first using subgroup precedence.
    # raw_score stored as int(LFI * 100) if present in database.
    lfi_pct = None
    norm_group_used = None
    
    for ng in _resolve_norm_groups(db, session_id):
        row = db.execute(
            text(
                "SELECT percentile FROM normative_conversion_table "
                "WHERE norm_group=:g AND scale_name='LFI' AND raw_score=:r LIMIT 1"
            ),
            {"g": ng, "r": int(round(lfi_value * 100))},
        ).fetchone()
        if row:
            lfi_pct = float(row[0])
            norm_group_used = ng
            break
    
    # Fallback to Appendix 7 mapping if no DB norm found
    if lfi_pct is None:
        # Round to 2 decimals for dictionary key matching
        lfi_pct = lookup_lfi(round(lfi_value, 2))
        norm_group_used = "AppendixFallback"
    
    # Assign flexibility level based on tertile cutoffs
    level = None
    if lfi_pct is not None:
        if lfi_pct < 33.34:
            level = 'Low'
        elif lfi_pct <= 66.67:
            level = 'Moderate'
        else:
            level = 'High'
    
    # Create and persist LFI entity
    lfi = LearningFlexibilityIndex(
        session_id=session_id,
        W_coefficient=W,
        LFI_score=lfi_value,
        LFI_percentile=lfi_pct,
        flexibility_level=level,
    )
    db.add(lfi)
    
    return lfi

def apply_percentiles(
    db: Session, scale: ScaleScore, combo: CombinationScore
) -> PercentileScore | None:
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
                text(
                    "SELECT percentile FROM normative_conversion_table "
                    "WHERE norm_group=:g AND scale_name=:s AND raw_score=:r LIMIT 1"
                ),
                {"g": ng, "s": scale_name, "r": raw},
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
    payload = (
        f"{scale.CE_raw},{scale.RO_raw},{scale.AC_raw},{scale.AE_raw};"
        f"{combo.ACCE_raw},{combo.AERO_raw};{lfi.LFI_score}"
    )
    db.add(
        AuditLog(
            actor='system',
            action='FINALIZE_SESSION',
            payload_hash=sha256(payload.encode('utf-8')).hexdigest(),
        )
    )
    return {
        "scale": scale,
        "combination": combo,
        "style": ustyle,
        "lfi": lfi,
        "percentiles": percentiles
    }
