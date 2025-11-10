from __future__ import annotations

from functools import lru_cache
from math import sqrt
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.assessments.klsi_v4 import load_config
from app.engine.norms.base import InMemoryNormRepository
from app.models.klsi import (
    AssessmentSession,
    AssessmentSessionDelta,
    CombinationScore,
    ItemType,
    LearningFlexibilityIndex,
    LearningMode,
    LearningStyleType,
    LFIContextScore,
    PercentileScore,
    ScaleScore,
    SessionStatus,
    User,
    UserLearningStyle,
    UserResponse,
)

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


@lru_cache()
def _cfg() -> Dict[str, Any]:
    return load_config()


def context_names() -> List[str]:
    return list(_cfg()["context_names"])


def _style_window(name: str) -> Dict[str, Optional[int]]:
    window = _cfg()["style_windows"][name]
    return {
        "acce_min": window["ACCE"][0],
        "acce_max": window["ACCE"][1],
        "aero_min": window["AERO"][0],
        "aero_max": window["AERO"][1],
    }


def _within(value: int, lower: Optional[int], upper: Optional[int]) -> bool:
    if lower is not None and value < lower:
        return False
    if upper is not None and value > upper:
        return False
    return True


def _build_style_cuts() -> Dict[str, Any]:
    cuts: Dict[str, Any] = {}
    for style_name in _cfg()["style_windows"].keys():
        window = _style_window(style_name)

        def rule(acc: int, aer: int, w=window) -> bool:
            return _within(acc, w["acce_min"], w["acce_max"]) and _within(aer, w["aero_min"], w["aero_max"])

        cuts[style_name] = rule
    return cuts


STYLE_CUTS = _build_style_cuts()
CONTEXT_NAMES = context_names()


def validate_lfi_context_ranks(context_scores: List[Dict[str, int]]) -> None:
    modes = [mode.value for mode in LearningMode]
    expected = {1, 2, 3, 4}
    for idx, ctx in enumerate(context_scores, start=1):
        if set(ctx.keys()) != set(modes):
            raise ValueError(
                f"Context {idx} must contain ranks for exactly {modes}. Got keys: {sorted(ctx.keys())}"
            )
        ranks = list(ctx.values())
        if not all(isinstance(rank, int) for rank in ranks):
            raise ValueError(f"Context {idx} has non-integer rank(s): {ranks}")
        if not all(1 <= rank <= 4 for rank in ranks):
            raise ValueError(f"Context {idx} ranks must be within 1..4. Got: {ranks}")
        if set(ranks) != expected:
            raise ValueError(
                f"Context {idx} must be a permutation of [1,2,3,4]. Got: {ranks}"
            )


def compute_kendalls_w(context_scores: List[Dict[str, int]]) -> float:
    m = len(context_scores)
    modes = [mode.value for mode in LearningMode]
    n = len(modes)
    sums = {mode: 0 for mode in modes}
    for ctx in context_scores:
        for mode in modes:
            sums[mode] += ctx[mode]
    mean_rank = m * (n + 1) / 2
    S = sum((total - mean_rank) ** 2 for total in sums.values())
    numerator = 12 * S
    denominator = m * m * (pow(n, 3) - n)
    if denominator == 0:
        return 0.0
    W = numerator / denominator
    return max(0.0, min(1.0, W))


def _age_to_band(user: User) -> Optional[str]:
    if not user or not getattr(user, "date_of_birth", None):
        return None
    from datetime import date, datetime

    dob = getattr(user, "date_of_birth")
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


def resolve_norm_groups(db: Session, session_id: int) -> List[str]:
    sess = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.id == session_id)
        .first()
    )
    user: Optional[User] = sess.user if sess else None
    candidates: List[str] = []
    if user and user.education_level:
        candidates.append(f"EDU:{user.education_level.value}")
    if user and getattr(user, "country", None):
        candidates.append(f"COUNTRY:{user.country}")
    if user:
        age_band = _age_to_band(user)
        if age_band:
            candidates.append(f"AGE:{age_band}")
    if user and user.gender:
        candidates.append(f"GENDER:{user.gender.value}")
    candidates.append("Total")
    seen = set()
    ordered: List[str] = []
    for g in candidates:
        if g not in seen:
            ordered.append(g)
            seen.add(g)
    return ordered


def compute_raw_scale_scores(db: Session, session_id: int) -> ScaleScore:
    responses = (
        db.query(UserResponse)
        .filter(UserResponse.session_id == session_id)
        .all()
    )
    mode_totals = {mode.value: 0 for mode in LearningMode}
    for response in responses:
        if response.choice.item.item_type == ItemType.learning_style:
            mode_totals[response.choice.learning_mode.value] += response.rank_value
    scale = ScaleScore(
        session_id=session_id,
        CE_raw=mode_totals["CE"],
        RO_raw=mode_totals["RO"],
        AC_raw=mode_totals["AC"],
        AE_raw=mode_totals["AE"],
    )
    db.add(scale)
    return scale


def compute_combination_scores(db: Session, scale: ScaleScore) -> CombinationScore:
    medians = _cfg()["balance_medians"]
    acc = scale.AC_raw - scale.CE_raw
    aer = scale.AE_raw - scale.RO_raw
    assimilation_accommodation = (scale.AC_raw + scale.RO_raw) - (scale.AE_raw + scale.CE_raw)
    converging_diverging = (scale.AC_raw + scale.AE_raw) - (scale.CE_raw + scale.RO_raw)
    balance_acce = abs(scale.AC_raw - (scale.CE_raw + medians["ACCE"]))
    balance_aero = abs(scale.AE_raw - (scale.RO_raw + medians["AERO"]))
    combo = CombinationScore(
        session_id=scale.session_id,
        ACCE_raw=acc,
        AERO_raw=aer,
        assimilation_accommodation=assimilation_accommodation,
        converging_diverging=converging_diverging,
        balance_acce=balance_acce,
        balance_aero=balance_aero,
    )
    db.add(combo)
    return combo


def _style_distance(acc: int, aer: int, window: Dict[str, Optional[int]]) -> int:
    dx = 0
    if window["acce_min"] is not None and acc < window["acce_min"]:
        dx = window["acce_min"] - acc
    elif window["acce_max"] is not None and acc > window["acce_max"]:
        dx = acc - window["acce_max"]
    dy = 0
    if window["aero_min"] is not None and aer < window["aero_min"]:
        dy = window["aero_min"] - aer
    elif window["aero_max"] is not None and aer > window["aero_max"]:
        dy = aer - window["aero_max"]
    return dx + dy


def assign_learning_style(db: Session, combo: CombinationScore) -> tuple[UserLearningStyle, Dict[str, float]]:
    acc, aer = combo.ACCE_raw, combo.AERO_raw
    primary_name: Optional[str] = None
    for name, rule in STYLE_CUTS.items():
        if rule(acc, aer):
            primary_name = name
            break
    windows = {name: _style_window(name) for name in STYLE_CUTS.keys()}
    distances = sorted(((name, _style_distance(acc, aer, window)) for name, window in windows.items()), key=lambda item: item[1])
    if primary_name is None and distances:
        primary_name = distances[0][0]
    backup_name = next((name for name, dist in distances if name != primary_name), None)
    primary_type = (
        db.query(LearningStyleType)
        .filter(LearningStyleType.style_name == primary_name)
        .first()
        if primary_name
        else None
    )
    manhattan = abs(acc) + abs(aer)
    euclidean = sqrt(acc**2 + aer**2)
    kite = {}
    if combo.session and combo.session.scale_score:
        kite = {
            "CE": combo.session.scale_score.CE_raw,
            "RO": combo.session.scale_score.RO_raw,
            "AC": combo.session.scale_score.AC_raw,
            "AE": combo.session.scale_score.AE_raw,
        }
    user_style = UserLearningStyle(
        session_id=combo.session_id,
        primary_style_type_id=primary_type.id if primary_type else None,
        ACCE_raw=acc,
        AERO_raw=aer,
        kite_coordinates=kite,
        style_intensity_score=int(manhattan),
    )
    db.add(user_style)
    if backup_name:
        backup_type = (
            db.query(LearningStyleType)
            .filter(LearningStyleType.style_name == backup_name)
            .first()
        )
        if backup_type:
            from app.models.klsi import BackupLearningStyle

            db.add(
                BackupLearningStyle(
                    session_id=combo.session_id,
                    style_type_id=backup_type.id,
                    frequency_count=1,
                    percentage=None,
                    contexts_used=None,
                )
            )
    return user_style, {"manhattan": manhattan, "euclidean": euclidean}


def _db_norm_lookup(db: Session, group: str, scale: str, raw: int | float) -> Optional[float]:
    row = db.execute(
        text(
            "SELECT percentile FROM normative_conversion_table "
            "WHERE norm_group=:g AND scale_name=:s AND raw_score=:r LIMIT 1"
        ),
        {"g": group, "s": scale, "r": int(raw)},
    ).fetchone()
    if row:
        return float(row[0])
    return None


def compute_lfi(db: Session, session_id: int) -> LearningFlexibilityIndex:
    rows = (
        db.query(LFIContextScore)
        .filter(LFIContextScore.session_id == session_id)
        .all()
    )
    if len(rows) != _cfg()["context_count"]:
        raise ValueError(f"Expected {_cfg()['context_count']} contexts, found {len(rows)}")
    allowed = set(context_names())
    if any(row.context_name not in allowed for row in rows):
        raise ValueError("Context name tidak dikenal dalam konfigurasi")
    if len({row.context_name for row in rows}) != len(rows):
        raise ValueError("Duplicate context names detected for session")
    payload = []
    for row in rows:
        payload.append(
            {
                "CE": row.CE_rank,
                "RO": row.RO_rank,
                "AC": row.AC_rank,
                "AE": row.AE_rank,
            }
        )
    validate_lfi_context_ranks(payload)
    W = compute_kendalls_w(payload)
    lfi_value = 1 - W
    repo = InMemoryNormRepository(lambda group, scale, raw: _db_norm_lookup(db, group, scale, raw))
    group_chain = resolve_norm_groups(db, session_id)
    percentile, provenance, _ = repo.percentile(group_chain, "LFI", int(round(lfi_value * 100)))
    if percentile is None:
        percentile = lookup_lfi(round(lfi_value, 2))
        provenance = "Appendix:LFI"
    tertiles = _cfg()["lfi"]["tertiles"]
    level = None
    if percentile is not None:
        if percentile < tertiles["low"]:
            level = "Low"
        elif percentile <= tertiles["moderate"]:
            level = "Moderate"
        else:
            level = "High"
    entity = LearningFlexibilityIndex(
        session_id=session_id,
        W_coefficient=W,
        LFI_score=lfi_value,
        LFI_percentile=percentile,
        flexibility_level=level,
        norm_group_used=provenance,
    )
    db.add(entity)
    return entity


def apply_percentiles(
    db: Session,
    session_id: int,
    scale: ScaleScore,
    combo: CombinationScore,
) -> PercentileScore:
    repo = InMemoryNormRepository(
        lambda group, scale_name, raw: _db_norm_lookup(db, group, scale_name, raw)
    )
    group_chain = resolve_norm_groups(db, session_id)

    table_map = {
        "CE": CE_PERCENTILES,
        "RO": RO_PERCENTILES,
        "AC": AC_PERCENTILES,
        "AE": AE_PERCENTILES,
        "ACCE": ACCE_PERCENTILES,
        "AERO": AERO_PERCENTILES,
    }
    range_bounds = {
        name: (min(values.keys()), max(values.keys()))
        for name, values in table_map.items()
        if values
    }

    def resolve(scale_name: str, raw: int | float) -> tuple[Optional[float], str, bool]:
        pct, prov, truncated_flag = repo.percentile(group_chain, scale_name, raw)
        if pct is not None:
            return pct, prov, truncated_flag
        if scale_name in table_map:
            fallback_pct = lookup_percentile(int(raw), table_map[scale_name])
            low, high = range_bounds.get(scale_name, (None, None))
            truncated_outside = False
            if low is not None and high is not None:
                truncated_outside = raw < low or raw > high
            return fallback_pct, f"Appendix:{scale_name}", truncated_outside
        return None, "Unknown", False

    percentiles: Dict[str, Optional[float]] = {}
    provenance: Dict[str, str] = {}
    truncations: Dict[str, bool] = {}
    raw_scores: Dict[str, int | float] = {}

    for name, raw in {
        "CE": scale.CE_raw,
        "RO": scale.RO_raw,
        "AC": scale.AC_raw,
        "AE": scale.AE_raw,
        "ACCE": combo.ACCE_raw,
        "AERO": combo.AERO_raw,
    }.items():
        pct, prov, truncated_flag = resolve(name, raw)
        percentiles[name] = pct
        provenance[name] = prov
        truncations[name] = truncated_flag
        raw_scores[name] = raw

    db_provenances = {
        scale_name: prov
        for scale_name, prov in provenance.items()
        if prov.startswith("DB:")
    }

    def _session_norm_group() -> str:
        for group in group_chain:
            tag = f"DB:{group}"
            if tag in db_provenances.values():
                return tag
        if db_provenances:
            # deterministic order for reproducibility
            for scale_name in ("CE", "RO", "AC", "AE", "ACCE", "AERO"):
                prov = db_provenances.get(scale_name)
                if prov:
                    return prov
        return "Appendix:Fallback"

    entity = PercentileScore(
        session_id=session_id,
        norm_group_used=_session_norm_group(),
        CE_percentile=percentiles["CE"],
        RO_percentile=percentiles["RO"],
        AC_percentile=percentiles["AC"],
        AE_percentile=percentiles["AE"],
        ACCE_percentile=percentiles["ACCE"],
        AERO_percentile=percentiles["AERO"],
        CE_source=provenance["CE"],
        RO_source=provenance["RO"],
        AC_source=provenance["AC"],
        AE_source=provenance["AE"],
        ACCE_source=provenance["ACCE"],
        AERO_source=provenance["AERO"],
        used_fallback_any=any(
            not src.startswith("DB:") for src in provenance.values()
        ),
        norm_provenance=provenance,
        raw_outside_norm_range=any(truncations.values()),
        truncated_scales={
            name: {
                "raw": raw_scores[name],
                "min": range_bounds[name][0] if name in range_bounds else None,
                "max": range_bounds[name][1] if name in range_bounds else None,
            }
            for name, truncated_flag in truncations.items()
            if truncated_flag
        },
    )
    db.add(entity)
    return entity


def compute_longitudinal_delta(
    db: Session,
    session_id: int,
    combo: CombinationScore,
    lfi: LearningFlexibilityIndex,
    intensity_metrics: Dict[str, float],
) -> Optional[AssessmentSessionDelta]:
    session = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.id == session_id)
        .first()
    )
    if not session:
        return None
    previous = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.user_id == session.user_id)
        .filter(AssessmentSession.assessment_id == session.assessment_id)
        .filter(AssessmentSession.assessment_version == session.assessment_version)
        .filter(AssessmentSession.status == SessionStatus.completed)
        .filter(AssessmentSession.id != session_id)
        .order_by(AssessmentSession.end_time.desc())
        .first()
    )
    if not previous or not previous.combination_score or not previous.lfi_index:
        return None
    previous_intensity = previous.learning_style.style_intensity_score if previous.learning_style else None
    delta = AssessmentSessionDelta(
        session_id=session_id,
        previous_session_id=previous.id,
        delta_acce=combo.ACCE_raw - previous.combination_score.ACCE_raw,
        delta_aero=combo.AERO_raw - previous.combination_score.AERO_raw,
        delta_lfi=(lfi.LFI_score - previous.lfi_index.LFI_score) if previous.lfi_index else None,
        delta_intensity=(int(intensity_metrics["manhattan"]) - previous_intensity) if previous_intensity is not None else None,
    )
    db.add(delta)
    return delta
