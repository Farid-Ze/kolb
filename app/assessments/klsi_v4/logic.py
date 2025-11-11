from __future__ import annotations

from datetime import date, datetime
from functools import lru_cache
from math import sqrt
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.assessments.klsi_v4 import load_config
from app.engine.norms.provider import NormProvider
from app.engine.norms.factory import build_composite_norm_provider
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
from app.services.provenance import upsert_scale_provenance

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
_NORM_VERSION_DELIM = "|"
DEFAULT_NORM_VERSION = "default"


def _split_norm_group_token(token: str) -> Tuple[str, str]:
    if _NORM_VERSION_DELIM in token:
        base, version = token.split(_NORM_VERSION_DELIM, 1)
        return base, version or DEFAULT_NORM_VERSION
    return token, DEFAULT_NORM_VERSION


def _pack_norm_group_token(group: str, version: str) -> str:
    version = version or DEFAULT_NORM_VERSION
    return f"{group}{_NORM_VERSION_DELIM}{version}"


def _describe_provenance(tag: str) -> Tuple[str, Optional[str], Optional[str]]:
    if tag.startswith("DB:"):
        payload = tag[3:]
        group, version = _split_norm_group_token(payload)
        return "database", group, version
    if tag.startswith("Appendix:"):
        appendix_group = tag.split(":", 1)[1]
        return "appendix", appendix_group, None
    return "unknown", None, None


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
    """Optimized Kendall's W computation for forced-choice LFI contexts.

    Each context provides a permutation of ranks (1..4) across the four
    learning modes (CE, RO, AC, AE). For KLSI 4.0 the number of objects
    ``n`` is always 4. The number of contexts ``m`` is typically 8 but we
    keep the formula general for validation flexibility.

    W = (12 * S) / (m^2 * (n^3 - n))
      with S = Σ_j (R_j - R_mean)^2 where R_j is the total rank for
      object j across all contexts.

    This implementation minimizes Python attribute and dictionary lookup
    overhead by using local bindings and list arithmetic. Numerical
    guarding clamps the result to [0,1] per the coefficient definition.
    """
    m = len(context_scores)
    if m == 0:
        return 0.0
    # Fixed mode ordering for deterministic accumulation
    dims = ("CE", "RO", "AC", "AE")
    n = 4  # number of objects (learning modes)
    totals = [0, 0, 0, 0]
    get = dict.get
    for row in context_scores:
        # direct indexed updates avoid inner dict iteration
        totals[0] += get(row, "CE", 0)
        totals[1] += get(row, "RO", 0)
        totals[2] += get(row, "AC", 0)
        totals[3] += get(row, "AE", 0)
    # mean total rank per object (m * (n + 1) / 2) equals average of sums
    # but we retain canonical form for clarity
    mean_rank = m * (n + 1) / 2.0
    # S = Σ (Rj - mean_rank)^2 expanded inline for speed
    d0 = totals[0] - mean_rank
    d1 = totals[1] - mean_rank
    d2 = totals[2] - mean_rank
    d3 = totals[3] - mean_rank
    S = d0 * d0 + d1 * d1 + d2 * d2 + d3 * d3
    denom = (m * m) * (n * n * n - n)
    if denom <= 0:
        return 0.0
    W = (12.0 * S) / denom
    if W < 0.0:
        return 0.0
    if W > 1.0:
        return 1.0
    return W


def _age_to_band(user: User, reference_date: Optional[date]) -> Optional[str]:
    if not user or not getattr(user, "date_of_birth", None):
        return None
    dob = getattr(user, "date_of_birth")
    if isinstance(dob, datetime):
        dob = dob.date()
    snapshot = reference_date or date.today()
    years = snapshot.year - dob.year - int((snapshot.month, snapshot.day) < (dob.month, dob.day))
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
    sess = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    user: Optional[User] = sess.user if sess else None
    reference_date: Optional[date] = None
    if sess:
        timestamp = sess.end_time or sess.start_time
        if isinstance(timestamp, datetime):
            reference_date = timestamp.date()
    candidates: List[str] = []
    if user and user.education_level:
        candidates.append(f"EDU:{user.education_level.value}")
    if user and getattr(user, "country", None):
        candidates.append(f"COUNTRY:{user.country}")
    if user:
        age_band = _age_to_band(user, reference_date)
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
    """Sum forced-choice ranks for each learning mode.

    The KLSI 4.0 manual specifies that participants assign the value ``4``
    to the statement that best describes them within an item and ``1`` to
    the statement that least describes them. Summing the rank values keeps
    that directionality so higher totals reflect stronger relative
    preference for the associated learning mode, aligning with the
    normative tables in Appendix 1 (range 12–48).
    """
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
    """Assign primary (and backup) style using DB windows exclusively.

    This removes reliance on in-code STYLE_CUTS lambdas to avoid drift.
    Windows are read from learning_style_types (ACCE_min/max, AERO_min/max).
    """
    acc, aer = combo.ACCE_raw, combo.AERO_raw

    # Load windows from DB
    types: list[LearningStyleType] = db.query(LearningStyleType).all()
    if not types:
        raise ValueError("Learning style windows not seeded; please seed learning_style_types")
    windows: dict[str, dict[str, Optional[int]]] = {}
    for t in types:
        windows[t.style_name] = {
            "acce_min": t.ACCE_min,
            "acce_max": t.ACCE_max,
            "aero_min": t.AERO_min,
            "aero_max": t.AERO_max,
        }

    # Determine primary by containment
    primary_name: Optional[str] = None
    for name, w in windows.items():
        if _within(acc, w["acce_min"], w["acce_max"]) and _within(aer, w["aero_min"], w["aero_max"]):
            primary_name = name
            break

    # Compute L1 distance to each window for backup selection and tie-breaks
    ordered_by_distance = sorted(
        ((name, _style_distance(acc, aer, w)) for name, w in windows.items()),
        key=lambda item: (item[1], item[0]),  # stable deterministic ordering
    )
    if primary_name is None and ordered_by_distance:
        primary_name = ordered_by_distance[0][0]
    backup_name = next((name for name, dist in ordered_by_distance if name != primary_name), None)

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


def _db_norm_lookup(
    db: Session,
    group_token: str,
    scale: str,
    raw: int | float,
) -> Tuple[Optional[float], Optional[str]]:
    base_group, requested_version = _split_norm_group_token(group_token)
    candidates = [requested_version]
    if requested_version != DEFAULT_NORM_VERSION:
        candidates.append(DEFAULT_NORM_VERSION)
    for version in candidates:
        row = db.execute(
            text(
                "SELECT percentile, norm_version FROM normative_conversion_table "
                "WHERE norm_group=:g AND norm_version=:v AND scale_name=:s AND raw_score=:r LIMIT 1"
            ),
            {"g": base_group, "v": version, "s": scale, "r": int(raw)},
        ).fetchone()
        if row:
            percentile = float(row[0])
            resolved_version = row[1] or version
            return percentile, resolved_version
    return None, None


def compute_lfi(db: Session, session_id: int, norm_provider: NormProvider | None = None) -> LearningFlexibilityIndex:
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
    provider = norm_provider or build_composite_norm_provider(db)
    group_chain = resolve_norm_groups(db, session_id)
    percentile, provenance, _ = provider.percentile(group_chain, "LFI", int(round(lfi_value * 100)))
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
    norm_provider: NormProvider | None = None,
) -> PercentileScore:
    provider = norm_provider or build_composite_norm_provider(db)
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
        # Provider already chains DB → Appendix → External; preserve truncation
        pct, prov, truncated_flag = provider.percentile(group_chain, scale_name, raw)
        # As a guard, compute truncation flag if provider didn't set it for appendix tables
        if pct is not None and prov.startswith("Appendix:") and scale_name in table_map and not truncated_flag:
            low, high = range_bounds.get(scale_name, (None, None))
            truncated_flag = (raw < low or raw > high) if low is not None and high is not None else False
        return pct, prov, truncated_flag

    percentiles: Dict[str, Optional[float]] = {}
    provenance: Dict[str, str] = {}
    truncations: Dict[str, bool] = {}
    raw_scores: Dict[str, int | float] = {}
    detailed_provenance: Dict[str, Dict[str, Any]] = {}

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
        source_kind, norm_group_label, norm_version = _describe_provenance(prov)
        detailed_provenance[name] = {
            "percentile": pct,
            "raw_score": raw,
            "source": prov,
            "source_kind": source_kind,
            "norm_group": norm_group_label,
            "norm_version": norm_version,
            "used_fallback": source_kind != "database",
            "truncated": truncated_flag,
        }

    db_provenances = {
        scale_name: info
        for scale_name, info in detailed_provenance.items()
        if info["source_kind"] == "database"
    }

    def _session_norm_group() -> str:
        for group in group_chain:
            base_group, version_hint = _split_norm_group_token(group)
            for info in db_provenances.values():
                if info.get("norm_group") != base_group:
                    continue
                info_version = info.get("norm_version") or DEFAULT_NORM_VERSION
                if info_version == version_hint or version_hint == DEFAULT_NORM_VERSION:
                    if info_version != DEFAULT_NORM_VERSION:
                        return f"DB:{_pack_norm_group_token(base_group, info_version)}"
                    return f"DB:{base_group}"
        if db_provenances:
            for scale_name in ("CE", "RO", "AC", "AE", "ACCE", "AERO"):
                detail = db_provenances.get(scale_name)
                if detail:
                    info_version = detail.get("norm_version") or DEFAULT_NORM_VERSION
                    base = detail.get("norm_group") or "Total"
                    if info_version != DEFAULT_NORM_VERSION:
                        return f"DB:{_pack_norm_group_token(base, info_version)}"
                    return f"DB:{base}"
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
    norm_provenance=detailed_provenance,
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
    upsert_scale_provenance(db, session_id, raw_scores, percentiles, provenance, truncations)
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
