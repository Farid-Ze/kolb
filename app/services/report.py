from typing import Any, Optional

from sqlalchemy.orm import Session

from app.data.session_designs import recommend_for_primary
from app.i18n.id_styles import (
    EDUCATOR_RECO_ID,
    LFI_LABEL_ID,
    STYLE_BRIEF_ID,
    STYLE_DETAIL_ID,
    STYLE_LABELS_ID,
)
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.learning import (
    BackupLearningStyle,
    CombinationScore,
    LFIContextScore,
    LearningFlexibilityIndex,
    LearningStyleType,
    ScaleProvenance,
    ScaleScore,
    UserLearningStyle,
)
from app.models.klsi.norms import PercentileScore
from app.models.klsi.user import User
from app.services.regression import (
    analyze_lfi_contexts,
    generate_lfi_heatmap,
    predict_integrative_development,
    predicted_curve,
)
from app.db.repositories import SessionRepository
from app.i18n.id_messages import (
    ReportAnalyticsMessages,
    ReportBandLabels,
    ReportBalanceMessages,
    ReportDeepLearningLabels,
    ReportDevelopmentLabels,
    ReportEducatorActions,
    ReportEducatorFocusLabels,
    ReportEducatorRoleLabels,
    ReportEducatorHints,
    ReportFlexNarratives,
    ReportLearningSpaceTips,
    ReportMetaLearningTips,
    ReportMessages,
    ReportNotesMessages,
)


def _derive_learning_space_suggestions(acce: int | None, aero: int | None,
                                       acc_assm: int | None, conv_div: int | None,
                                       lfi: float | None, intensity: int | None) -> list[str]:
    """Heuristic educator tips grounded in ELT learning space principles.

    Paraphrased from ELT literature: balance acting vs reflecting and experiencing vs thinking;
    create hospitable, safe but challenging spaces; promote conversation; sequence divergence → convergence;
    and support deliberate practice. This emits brief actionable bullets.
    """
    tips: list[str] = []
    if aero is not None:
        if aero >= 12:
            tips.append(ReportLearningSpaceTips.AERO_HIGH)
        elif aero <= 0:
            tips.append(ReportLearningSpaceTips.AERO_LOW)
    if acce is not None:
        if acce >= 15:
            tips.append(ReportLearningSpaceTips.ACCE_HIGH)
        elif acce <= 5:
            tips.append(ReportLearningSpaceTips.ACCE_LOW)
    if acc_assm is not None:
        # With Assimilation - Accommodation (AC+RO) - (AE+CE):
        # positive → lebih asimilatif; negative → lebih akomodatif
        if acc_assm >= 10:
            tips.append(ReportLearningSpaceTips.ACC_ASSM_HIGH)
        elif acc_assm <= -10:
            tips.append(ReportLearningSpaceTips.ACC_ASSM_LOW)
    if conv_div is not None:
        if conv_div >= 10:
            tips.append(ReportLearningSpaceTips.CONV_DIV_HIGH)
        elif conv_div <= -10:
            tips.append(ReportLearningSpaceTips.CONV_DIV_LOW)
    if intensity is not None and intensity >= 20:
        tips.append(ReportLearningSpaceTips.HIGH_INTENSITY)
    if lfi is not None and lfi < 0.5:
        tips.append(ReportLearningSpaceTips.LOW_FLEXIBILITY)
    if not tips:
        tips.append(ReportMessages.FLEXIBILITY_NOTE_DEFAULT)
    return tips


def _classify_development(acce: int | None, aero: int | None, acc_assm: int | None,
                          conv_div: int | None, lfi: float | None, intensity: int | None) -> dict | None:
    """Heuristic, non-diagnostic mapping to ELT spiral notions.

    Paraphrased mapping referencing acquisition (early undifferentiated), specialization (strong polarity),
    integration (balanced + flexibility). Not a psychological assessment; purely formative guidance.
    """
    if acce is None or aero is None or acc_assm is None or conv_div is None or lfi is None or intensity is None:
        return None
    abs_acc = abs(int(acce))
    abs_aer = abs(int(aero))
    # Stage criteria (very rough):
    # Acquisition: low intensity (< 12) AND low flexibility (< 0.45)
    # Specialization: moderate/high intensity (>= 12) AND low/mod flexibility (< 0.70) AND one axis dominant
    # Integration: intensity not extreme (< 28) AND high flexibility (>= 0.70) OR both axes moderate (< 15)
    stage: str
    if intensity < 12 and lfi < 0.45:
        stage = ReportDevelopmentLabels.ACQUISITION
    elif intensity >= 12 and lfi < 0.70 and (abs_acc >= 15 or abs_aer >= 12):
        stage = ReportDevelopmentLabels.SPECIALIZATION
    else:
        stage = ReportDevelopmentLabels.INTEGRATION

    # Deep learning level based on number of modes effectively engaged.
    # Use indices: if both ACCE and AERO near zero plus high LFI => integrative.
    if lfi >= 0.70 and abs_acc <= 10 and abs_aer <= 8:
        deep_level = ReportDeepLearningLabels.INTEGRATIVE
    elif lfi >= 0.55 and (abs_acc <= 15 and abs_aer <= 12):
        deep_level = ReportDeepLearningLabels.INTERPRETATIVE
    else:
        deep_level = ReportDeepLearningLabels.REGISTRATIVE

    rationale_parts = []
    rationale_parts.append(f"intensity={intensity}")
    rationale_parts.append(f"LFI={lfi:.2f}")
    rationale_parts.append(f"|ACCE|={abs_acc}, |AERO|={abs_aer}")
    rationale_parts.append(f"Acc-Assm={acc_assm}, Conv-Div={conv_div}")
    rationale = "; ".join(rationale_parts)

    disclaimer = ReportMessages.DEVELOPMENT_DISCLAIMER
    return {
        "spiral_stage": stage,
        "deep_learning_level": deep_level,
        "rationale": rationale,
        "disclaimer": disclaimer
    }


def _derive_meta_learning(ac: int | None, ce: int | None, ae: int | None, ro: int | None,
                          acce: int | None, aero: int | None, lfi: float | None) -> list[str]:
    """Suggest meta-learning practices (paraphrased from ELT + mindfulness + deliberate practice).

    Heuristics:
    - Low LFI → plan full CE→RO→AC→AE loops; track progress over time
    - High |ACCE| or |AERO| → mindfulness to temper the opposing mode; deliberate practice in underused mode
    - Identify weakest raw mode and recommend targeted skills
    """
    tips: list[str] = []
    # Guard
    if ac is None or ce is None or ae is None or ro is None or acce is None or aero is None or lfi is None:
        return tips
    # Weakest mode (all are ints here)
    modes = {"CE": ce, "RO": ro, "AC": ac, "AE": ae}
    weakest = min(modes.items(), key=lambda kv: kv[1])[0]
    if lfi < 0.55:
        tips.append(ReportMetaLearningTips.LFI_LOW)
    if abs(acce) >= 15:
        if acce > 0:
            tips.append(ReportMetaLearningTips.ACCE_POSITIVE)
        else:
            tips.append(ReportMetaLearningTips.ACCE_NEGATIVE)
    if abs(aero) >= 12:
        if aero > 0:
            tips.append(ReportMetaLearningTips.AERO_POSITIVE)
        else:
            tips.append(ReportMetaLearningTips.AERO_NEGATIVE)
    if weakest == "CE":
        tips.append(ReportMetaLearningTips.WEAKEST_CE)
    elif weakest == "RO":
        tips.append(ReportMetaLearningTips.WEAKEST_RO)
    elif weakest == "AC":
        tips.append(ReportMetaLearningTips.WEAKEST_AC)
    elif weakest == "AE":
        tips.append(ReportMetaLearningTips.WEAKEST_AE)
    # Learning identity cues
    tips.append(ReportMetaLearningTips.SELF_TALK)
    return tips


def _educator_role_suggestions(primary_style: str | None, acce: int | None, aero: int | None,
                               lfi: float | None) -> list[dict]:
    """Recommend role emphasis and sequence for teaching around the cycle.

    Roles: Facilitator (CE+RO), Expert (RO+AC), Evaluator (AC+AE), Coach (CE+AE)
    """
    recs: list[dict] = []
    # Defaults — full cycle once if nothing else is known
    seq = [
        {
            "role": ReportEducatorRoleLabels.FACILITATOR,
            "focus": ReportEducatorFocusLabels.FACILITATOR,
            "actions": list(ReportEducatorActions.FACILITATOR),
        },
        {
            "role": ReportEducatorRoleLabels.EXPERT,
            "focus": ReportEducatorFocusLabels.EXPERT,
            "actions": list(ReportEducatorActions.EXPERT),
        },
        {
            "role": ReportEducatorRoleLabels.EVALUATOR,
            "focus": ReportEducatorFocusLabels.EVALUATOR,
            "actions": list(ReportEducatorActions.EVALUATOR),
        },
        {
            "role": ReportEducatorRoleLabels.COACH,
            "focus": ReportEducatorFocusLabels.COACH,
            "actions": list(ReportEducatorActions.COACH),
        },
    ]
    # Adjust sequence based on polarity
    if acce is not None and acce >= 15:
        # Too conceptual — start with CE to ground
        seq = [seq[0], seq[1], seq[2], seq[3]]
    elif acce is not None and acce <= 5:
        # Heavy experience — bring Expert earlier to scaffold abstraction
        seq = [seq[1], seq[0], seq[3], seq[2]]
    if aero is not None and aero >= 12:
        # Action heavy — insert Facilitator reflection before Evaluator
        seq = [seq[0], seq[1], seq[2], seq[3]]  # already includes reflection early
    elif aero is not None and aero <= 0:
        # Reflection heavy — move Coach earlier to trigger action
        seq = [seq[0], seq[3], seq[1], seq[2]]
    # LFI low: recommend multiple shorter spirals
    cycles = 1
    if lfi is not None and lfi < 0.55:
        cycles = 2
    # Encode result
    order = []
    for _ in range(cycles):
        order.extend(seq)
    # Add a hint aligned with primary style if present
    hint = None
    if primary_style in {"Imagining","Experiencing"}:
        hint = ReportEducatorHints.IMAGINING_OR_EXPERIENCING
    elif primary_style in {"Thinking","Deciding","Analyzing"}:
        hint = ReportEducatorHints.THINKING_DECIDING_ANALYZING
    elif primary_style in {"Initiating","Acting"}:
        hint = ReportEducatorHints.INITIATING_OR_ACTING
    elif primary_style == "Balancing":
        hint = ReportEducatorHints.BALANCING
    recs = [{"step": i+1, **r} for i, r in enumerate(order)]
    if hint:
        recs.append({"note": hint})
    return recs


def _generate_flexibility_narrative(lfi_score: float, pattern: str, style_freq: dict) -> str:
    """Generate interpretive narrative about flexibility pattern (Mark vs Jason style)."""
    if pattern == "high":
        return ReportFlexNarratives.HIGH.format(
            score=lfi_score,
            style_count=len(style_freq)
        )
    elif pattern == "moderate":
        return ReportFlexNarratives.MODERATE.format(
            score=lfi_score,
            style_count=len(style_freq)
        )
    else:  # low
        return ReportFlexNarratives.LOW.format(
            score=lfi_score,
            style_count=len(style_freq)
        )


def build_report(db: Session, session_id: int, viewer_role: Optional[str] = None) -> dict:
    # Eager load all required relations to avoid N+1 and reduce roundtrips
    session_repo = SessionRepository(db)
    s = session_repo.get_with_details(session_id)
    if not s:
        raise ValueError(ReportMessages.SESSION_NOT_FOUND)

    scale = s.scale_score
    combo = s.combination_score
    ustyle = s.learning_style
    p = s.percentile_score
    lfi = s.lfi_index

    primary = ustyle.style_type if ustyle else None
    backup = None
    backup_type = None
    if s.backup_styles:
        backup = max(s.backup_styles, key=lambda b: (b.frequency_count or 0))
        backup_type = backup.style_type  # Already eagerly loaded

    intensity = abs(combo.ACCE_raw) + abs(combo.AERO_raw) if combo else None
    intensity_key = "low_intensity" if intensity is not None and intensity <= 10 else ("moderate_intensity" if intensity and intensity <= 20 else "high_intensity")

    recommendations = []
    if primary:
        recommendations = [
            {
                "code": d["code"],
                "title": d["title"],
                "summary": d["summary"],
                "activates": d["activates"],
                "duration_min": d["duration_min"],
            }
            for d in recommend_for_primary(primary.style_name, backup_type.style_name if backup_type else None, limit=4)
        ]

    # ═══════════════════════════════════════════════════════════════════════
    # Enhanced Analytics (MEDIATOR-ONLY)
    # ═══════════════════════════════════════════════════════════════════════
    enhanced_analytics = None
    if viewer_role == "MEDIATOR":
        # Retrieve LFI context scores (ordered by context_name to ensure consistency)
        # Use eagerly loaded context scores (already limited to this session)
        context_scores = sorted(s.lfi_context_scores, key=lambda c: c.context_name)
        
        # Validate exactly 8 LFI contexts before including enhanced analytics
        if len(context_scores) != 8:
            # Include validation error in report for transparency
            enhanced_analytics = {
                "validation_error": ReportMessages.ENHANCED_CONTEXT_ERROR.format(
                    found=len(context_scores)
                ),
                "context_count": len(context_scores),
                "message": ReportMessages.ENHANCED_CONTEXT_MESSAGE,
            }
        elif scale and combo and lfi:
            # Build contexts list for analysis
            contexts = []
            for ctx in context_scores:
                contexts.append({
                    "CE": ctx.CE_rank,
                    "RO": ctx.RO_rank,
                    "AC": ctx.AC_rank,
                    "AE": ctx.AE_rank,
                })
            
            # Contextual style profile analysis
            contextual_profile = analyze_lfi_contexts(contexts)
            
            # Heatmap for visualization
            heatmap = generate_lfi_heatmap(lfi.LFI_score, contextual_profile["context_styles"])
            
            # Integrative Development prediction
            user = s.user
            age_val = None
            gender_val = None
            education_val = None
            
            if user:
                # Map user demographics to numeric codes
                # Note: User model has date_of_birth, not age_group. Calculate from DOB if available.
                if user.date_of_birth:
                    from datetime import date
                    dob = user.date_of_birth
                    if isinstance(dob, date):
                        age_years = (date.today() - dob).days // 365
                        if age_years < 19:
                            age_val = 1
                        elif age_years < 25:
                            age_val = 2
                        elif age_years < 35:
                            age_val = 3
                        elif age_years < 45:
                            age_val = 4
                        elif age_years < 55:
                            age_val = 5
                        elif age_years < 65:
                            age_val = 6
                        else:
                            age_val = 7
                
                if user.gender:
                    gender_val = 1.0 if user.gender.value == "Male" else 0.0
                
                if user.education_level:
                    edu_map = {"Primary": 1, "Secondary": 2, "University": 3, "Masters": 4, "Doctoral": 5}
                    education_val = edu_map.get(user.education_level.value)
            
            integrative_dev_score = predict_integrative_development(
                age=age_val,
                gender=gender_val,
                education=education_val,
                specialization=None,  # Not collected in current User model
                acc_assm=combo.assimilation_accommodation,
                lfi=lfi.LFI_score
            )
            
            enhanced_analytics = {
                "contextual_profile": contextual_profile,
                "heatmap": heatmap,
                "integrative_development": {
                    "predicted_score": integrative_dev_score,
                    "interpretation": ReportMessages.INTEGRATIVE_DEV_INTERPRETATION.format(
                        score=integrative_dev_score
                    ),
                    "model_info": ReportMessages.INTEGRATIVE_MODEL_INFO,
                },
                "flexibility_narrative": _generate_flexibility_narrative(
                    lfi.LFI_score,
                    contextual_profile["flexibility_pattern"],
                    contextual_profile["style_frequency"]
                )
            }

    # Build percentiles block with explicit typing to satisfy mypy (heterogeneous value types)
    percentiles: dict[str, Any] | None
    if not p:
        percentiles = None
    else:
        acc_raw = combo.ACCE_raw if combo else None
        aer_raw = combo.AERO_raw if combo else None
        bands = None
        if acc_raw is not None and aer_raw is not None:
            bands = {
                "ACCE": (
                    ReportBandLabels.LOW
                    if acc_raw <= 5
                    else (ReportBandLabels.MID if acc_raw <= 14 else ReportBandLabels.HIGH)
                ),
                "AERO": (
                    ReportBandLabels.LOW
                    if aer_raw <= 0
                    else (ReportBandLabels.MID if aer_raw <= 11 else ReportBandLabels.HIGH)
                ),
            }

        balance_block: dict[str, Any] | None = None
        if combo is not None:
            balance_acce = getattr(combo, "balance_acce", None)
            balance_aero = getattr(combo, "balance_aero", None)
            balance_levels = {
                "ACCE": (
                    ReportBandLabels.HIGH
                    if (balance_acce is not None and balance_acce <= 3)
                    else (
                        ReportBandLabels.MODERATE
                        if (balance_acce is not None and balance_acce <= 8)
                        else ReportBandLabels.LOW
                    )
                ),
                "AERO": (
                    ReportBandLabels.HIGH
                    if (balance_aero is not None and balance_aero <= 2)
                    else (
                        ReportBandLabels.MODERATE
                        if (balance_aero is not None and balance_aero <= 8)
                        else ReportBandLabels.LOW
                    )
                ),
            }
            balance_block = {
                "ACCE": max(0.0, min(100.0, round((1 - ((balance_acce or 0) / 45.0)) * 100, 1))),
                "AERO": max(0.0, min(100.0, round((1 - ((balance_aero or 0) / 42.0)) * 100, 1))),
                "levels": balance_levels,
                "note": ReportBalanceMessages.NOTE,
            }

        percentiles = {
            "CE": p.CE_percentile,
            "RO": p.RO_percentile,
            "AC": p.AC_percentile,
            "AE": p.AE_percentile,
            "ACCE": p.ACCE_percentile,
            "AERO": p.AERO_percentile,
            "bands": bands,
            "BALANCE": balance_block,
            "source_provenance": p.norm_group_used,
            "per_scale_provenance": p.norm_provenance,
        }

    return {
        "session_id": session_id,
        "raw": {
            "CE": scale.CE_raw if scale else None,
            "RO": scale.RO_raw if scale else None,
            "AC": scale.AC_raw if scale else None,
            "AE": scale.AE_raw if scale else None,
            "ACCE": combo.ACCE_raw if combo else None,
            "AERO": combo.AERO_raw if combo else None,
            "ACC_ASSM": combo.assimilation_accommodation if combo else None,
            "CONV_DIV": combo.converging_diverging if combo else None,
            "BALANCE": {
                "ACCE": None if not combo else getattr(combo, "balance_acce", None),
                "AERO": None if not combo else getattr(combo, "balance_aero", None)
            }
        },
        "percentiles": percentiles,
        "style": None if not primary else {
            "primary_code": primary.style_code,
            "primary_name": STYLE_LABELS_ID.get(primary.style_name, primary.style_name),
            "primary_brief": STYLE_BRIEF_ID.get(primary.style_name),
            "primary_detail": STYLE_DETAIL_ID.get(primary.style_name),
            "backup_name": None if not backup_type else STYLE_LABELS_ID.get(backup_type.style_name, backup_type.style_name),
            "backup_code": None if not backup_type else backup_type.style_code,
            "backup_brief": None if not backup_type else STYLE_BRIEF_ID.get(backup_type.style_name),
            "backup_detail": None if not backup_type else STYLE_DETAIL_ID.get(backup_type.style_name),
            "intensity": intensity,
            "educator_reco": EDUCATOR_RECO_ID.get(intensity_key)
        },
        "lfi": None if not lfi else {
            "value": lfi.LFI_score,
            "percentile": lfi.LFI_percentile,
            "level": lfi.flexibility_level,
            "level_label": None if not lfi.flexibility_level else LFI_LABEL_ID.get(lfi.flexibility_level)
        },
        "visualization": None if not ustyle else {
            "kite": ustyle.kite_coordinates,
            "dialectic": {"ACCE": combo.ACCE_raw if combo else None, "AERO": combo.AERO_raw if combo else None, "CONV_DIV": combo.converging_diverging if combo else None, "intensity": intensity}
        },
        "session_designs": recommendations,
        "analytics": {
            "predicted_lfi_curve": predicted_curve(age=None, gender=None, education=None, specialization=None) if combo else None,
            "acc_assm_peak_note": ReportAnalyticsMessages.ACC_ASSM_PEAK_NOTE,
        },
        "learning_space": {
            "suggestions": _derive_learning_space_suggestions(
                combo.ACCE_raw if combo else None,
                combo.AERO_raw if combo else None,
                combo.assimilation_accommodation if combo else None,
                combo.converging_diverging if combo else None,
                None if not lfi else lfi.LFI_score,
                intensity
            ),
            "development": _classify_development(
                combo.ACCE_raw if combo else None,
                combo.AERO_raw if combo else None,
                combo.assimilation_accommodation if combo else None,
                combo.converging_diverging if combo else None,
                None if not lfi else lfi.LFI_score,
                intensity
            ),
            "meta_learning": _derive_meta_learning(
                scale.AC_raw if scale else None,
                scale.CE_raw if scale else None,
                scale.AE_raw if scale else None,
                scale.RO_raw if scale else None,
                combo.ACCE_raw if combo else None,
                combo.AERO_raw if combo else None,
                None if not lfi else lfi.LFI_score
            ),
            "educator_roles": _educator_role_suggestions(
                None if not primary else primary.style_name,
                combo.ACCE_raw if combo else None,
                combo.AERO_raw if combo else None,
                None if not lfi else lfi.LFI_score
            )
        },
        "enhanced_analytics": enhanced_analytics,  # MEDIATOR-only comprehensive diagnostics
        "notes": {
            "psychometric_terms": ReportNotesMessages.PSYCHOMETRIC_TERMS,
            "acc_assm_definition": ReportNotesMessages.ACC_ASSM_DEFINITION,
            "conv_div_definition": ReportNotesMessages.CONV_DIV_DEFINITION,
            "balance_definition": ReportNotesMessages.BALANCE_DEFINITION,
            "interpretation_summary": ReportNotesMessages.INTERPRETATION_SUMMARY,
        }
    }
