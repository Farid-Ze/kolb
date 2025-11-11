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
from app.models.klsi import (
    AssessmentSession,
    BackupLearningStyle,
    CombinationScore,
    LearningFlexibilityIndex,
    LFIContextScore,
    PercentileScore,
    ScaleScore,
    User,
    UserLearningStyle,
)
from app.services.regression import (
    analyze_lfi_contexts,
    generate_lfi_heatmap,
    predict_integrative_development,
    predicted_curve,
)
from app.db.repositories import SessionRepository


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
            tips.append("Tambahkan jeda refleksi terstruktur (debrief, jurnal) untuk menyeimbangkan kecenderungan aksi.")
        elif aero <= 0:
            tips.append("Sisipkan eksperimen aktif berjangka pendek (prototyping, role-play) untuk melatih orientasi aksi.")
    if acce is not None:
        if acce >= 15:
            tips.append("Perkaya pengalaman konkret (lab, simulasi, studi lapangan) agar konsep teruji dalam realitas.")
        elif acce <= 5:
            tips.append("Rangkum pengalaman ke dalam kerangka konseptual (peta konsep, model) untuk memperkuat abstraksi.")
    if acc_assm is not None:
        # With Assimilation - Accommodation (AC+RO) - (AE+CE):
        # positive → lebih asimilatif; negative → lebih akomodatif
        if acc_assm >= 10:
            tips.append("Waspadai over-asimilasi; dorong keterlibatan eksternal dengan stakeholders/klien (orientasi akomodasi).")
        elif acc_assm <= -10:
            tips.append("Seimbangkan eksplorasi dengan konsolidasi analitis (review literatur, analisis data, penetapan kriteria).")
    if conv_div is not None:
        if conv_div >= 10:
            tips.append("Cegah penutupan terlalu dini; fasilitasi sesi divergen (brainstorm tanpa evaluasi, multiple options).")
        elif conv_div <= -10:
            tips.append("Dorong konvergensi: gunakan matriks keputusan, kriteria eksplisit, dan time-boxing untuk memilih opsi.")
    if intensity is not None and intensity >= 20:
        tips.append("Intensitas gaya tinggi: rancang aktivitas yang memaksa menyentuh keempat kuadran siklus belajar.")
    if lfi is not None and lfi < 0.5:
        tips.append("Fleksibilitas rendah: desain urutan sesi mengelilingi siklus (CE→RO→AC→AE) dengan dukungan dan tantangan seimbang.")
    if not tips:
        tips.append("Pertahankan keseimbangan aksi–refleksi dan pengalaman–konsep; sediakan ruang aman namun menantang untuk percakapan bermakna.")
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
        stage = "Acquisition"
    elif intensity >= 12 and lfi < 0.70 and (abs_acc >= 15 or abs_aer >= 12):
        stage = "Specialization"
    else:
        stage = "Integration"

    # Deep learning level based on number of modes effectively engaged.
    # Use indices: if both ACCE and AERO near zero plus high LFI => integrative.
    if lfi >= 0.70 and abs_acc <= 10 and abs_aer <= 8:
        deep_level = "Integrative"
    elif lfi >= 0.55 and (abs_acc <= 15 and abs_aer <= 12):
        deep_level = "Interpretative"
    else:
        deep_level = "Registrative"

    rationale_parts = []
    rationale_parts.append(f"intensity={intensity}")
    rationale_parts.append(f"LFI={lfi:.2f}")
    rationale_parts.append(f"|ACCE|={abs_acc}, |AERO|={abs_aer}")
    rationale_parts.append(f"Acc-Assm={acc_assm}, Conv-Div={conv_div}")
    rationale = "; ".join(rationale_parts)

    disclaimer = (
        "Klasifikasi tahap perkembangan ini bersifat heuristik (bukan diagnosis). Didasarkan pada pola dialektika, fleksibilitas, dan intensitas gaya; gunakan sebagai pemicu refleksi, bukan label tetap."
    )
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
        tips.append("Rancang siklus belajar sadar (CE→RO→AC→AE) mingguan dan catat wawasan/aksi (tracking kemajuan, bukan nilai sesaat).")
    if abs(acce) >= 15:
        if acce > 0:
            tips.append("Mindfulness untuk membuka pengalaman konkret (CE) sebelum pemodelan; tambah proyek lapangan singkat.")
        else:
            tips.append("Ringkas pengalaman ke kerangka (AC): peta konsep, model 2x2; lakukan review konsep setelah refleksi.")
    if abs(aero) >= 12:
        if aero > 0:
            tips.append("Tambahkan jeda refleksi 10–15 menit pasca-aksi (journaling/debrief pasangan) untuk mengkonsolidasikan pelajaran.")
        else:
            tips.append("Lakukan eksperimen kecil berjangka pendek (time-boxed) untuk mengaktifkan AE dan mendapatkan umpan balik nyata.")
    if weakest == "CE":
        tips.append("Latih kehadiran inderawi & empati (napas tenang 2 menit, perhatikan 5 indera) sebelum diskusi.")
    elif weakest == "RO":
        tips.append("Buat jurnal refleksi terstruktur (apa? so what? now what?) minimal 2x per minggu.")
    elif weakest == "AC":
        tips.append("Bangun model/hipotesis singkat dan uji; gunakan matriks keputusan atau kerangka teori 1 halaman.")
    elif weakest == "AE":
        tips.append("Tetapkan goal kecil + umpan balik cepat (deliberate practice): coba–ukur–perbaiki dalam sprint 1–2 hari.")
    # Learning identity cues
    tips.append("Pantau self-talk: ganti 'tidak bisa' dengan 'belum bisa—akan dilatih'; rangkum 3 keberhasilan mingguan untuk menyeimbangkan fokus.")
    return tips


def _educator_role_suggestions(primary_style: str | None, acce: int | None, aero: int | None,
                               lfi: float | None) -> list[dict]:
    """Recommend role emphasis and sequence for teaching around the cycle.

    Roles: Facilitator (CE+RO), Expert (RO+AC), Evaluator (AC+AE), Coach (CE+AE)
    """
    recs: list[dict] = []
    # Defaults — full cycle once if nothing else is known
    seq = [
        {"role": "Facilitator", "focus": "CE+RO", "actions": ["aktivasi pengalaman", "dialog reflektif"]},
        {"role": "Expert", "focus": "RO+AC", "actions": ["pemetaan konsep", "model/teori"]},
        {"role": "Evaluator", "focus": "AC+AE", "actions": ["tugas kinerja", "umpan balik terhadap kriteria"]},
        {"role": "Coach", "focus": "CE+AE", "actions": ["rencana aksi personal", "prototipe"]},
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
        hint = "Pastikan langkah konvergensi (Evaluator/Coach) time-boxed agar tidak 'terbuka' terlalu lama."
    elif primary_style in {"Thinking","Deciding","Analyzing"}:
        hint = "Pastikan tahap divergen (Facilitator/Expert) cukup lama sebelum penutupan."
    elif primary_style in {"Initiating","Acting"}:
        hint = "Tambahkan debrief reflektif setelah setiap percobaan untuk menguatkan transfer."
    elif primary_style == "Balancing":
        hint = "Gunakan dua spiral singkat untuk mengeksplorasi dua pendekatan berbeda."
    recs = [{"step": i+1, **r} for i, r in enumerate(order)]
    if hint:
        recs.append({"note": hint})
    return recs


def _generate_flexibility_narrative(lfi_score: float, pattern: str, style_freq: dict) -> str:
    """Generate interpretive narrative about flexibility pattern (Mark vs Jason style)."""
    if pattern == "high":
        return (
            f"Profil fleksibilitas tinggi (LFI={lfi_score:.2f}): "
            f"Pembelajar ini menunjukkan kemampuan adaptif yang kuat, menggunakan {len(style_freq)} "
            f"gaya berbeda melintasi konteks pembelajaran. Seperti 'Mark' dalam studi kasus (persentil 98), "
            f"individu ini nyaman beroperasi di semua empat kuadran ruang pembelajaran—menggabungkan "
            f"pengalaman konkret, refleksi, konseptualisasi abstrak, dan eksperimen aktif sesuai tuntutan situasi. "
            f"Fleksibilitas ini mendukung perkembangan integratif yang lebih tinggi dan kemampuan beradaptasi "
            f"dengan beragam tantangan pembelajaran sepanjang hidup."
        )
    elif pattern == "moderate":
        return (
            f"Profil fleksibilitas moderat (LFI={lfi_score:.2f}): "
            f"Pembelajar ini menggunakan {len(style_freq)} gaya pembelajaran berbeda, menunjukkan kemampuan "
            f"adaptasi yang wajar namun dengan beberapa preferensi yang lebih kuat. Terdapat peluang untuk "
            f"memperluas repertoar gaya, khususnya dengan lebih banyak berlatih di kuadran yang kurang digunakan."
        )
    else:  # low
        return (
            f"Profil fleksibilitas rendah (LFI={lfi_score:.2f}): "
            f"Pembelajar ini cenderung mengandalkan {len(style_freq)} gaya yang terbatas melintasi konteks. "
            f"Seperti 'Jason' dalam studi kasus (persentil 4), pola ini dapat menciptakan tekanan ketika situasi "
            f"menuntut gaya yang kurang dikembangkan—terutama jika ada penekanan berlebihan pada refleksi/asimilasi "
            f"tanpa penyeimbang aksi/akomodasi yang memadai. Pengembangan strategis di kuadran yang kurang digunakan "
            f"dapat meningkatkan kemampuan adaptasi dan mengurangi stres dalam peran kepemimpinan atau tugas berorientasi aksi."
        )


def build_report(db: Session, session_id: int, viewer_role: Optional[str] = None) -> dict:
    # Eager load all required relations to avoid N+1 and reduce roundtrips
    session_repo = SessionRepository(db)
    s = session_repo.get_with_details(session_id)
    if not s:
        raise ValueError("Session not found")

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
                "validation_error": f"Expected exactly 8 LFI contexts, found {len(context_scores)}",
                "context_count": len(context_scores),
                "message": "Enhanced LFI analytics unavailable. User must complete all 8 context rankings.",
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
                    "interpretation": (
                        f"Skor Perkembangan Integratif diprediksi: {integrative_dev_score:.1f} "
                        f"(M=19.4, SD=3.5, rentang tipikal 13-26). "
                        f"LFI (β=0.25**) adalah prediktor terkuat dari perkembangan integratif, "
                        f"menunjukkan bahwa pembelajar fleksibel menunjukkan pemikiran integratif tingkat tinggi. "
                        f"Ini mengonfirmasi Hypothesis 6: fleksibilitas belajar secara positif terkait dengan tahapan "
                        f"perkembangan dewasa yang lebih tinggi (ego development, self-direction, integrative complexity)."
                    ),
                    "model_info": "Hierarchical Regression Model 1 (N=169, R²=0.13, Adj. R²=0.10)"
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
                "ACCE": ("Low" if acc_raw <= 5 else ("Mid" if acc_raw <= 14 else "High")),
                "AERO": ("Low" if aer_raw <= 0 else ("Mid" if aer_raw <= 11 else "High")),
            }

        balance_block: dict[str, Any] | None = None
        if combo is not None:
            balance_acce = getattr(combo, "balance_acce", None)
            balance_aero = getattr(combo, "balance_aero", None)
            balance_levels = {
                "ACCE": (
                    "High"
                    if (balance_acce is not None and balance_acce <= 3)
                    else ("Moderate" if (balance_acce is not None and balance_acce <= 8) else "Low")
                ),
                "AERO": (
                    "High"
                    if (balance_aero is not None and balance_aero <= 2)
                    else ("Moderate" if (balance_aero is not None and balance_aero <= 8) else "Low")
                ),
            }
            balance_block = {
                "ACCE": max(0.0, min(100.0, round((1 - ((balance_acce or 0) / 45.0)) * 100, 1))),
                "AERO": max(0.0, min(100.0, round((1 - ((balance_aero or 0) / 42.0)) * 100, 1))),
                "levels": balance_levels,
                "note": "BALANCE percentiles bersifat turunan teoritis dari jarak ke pusat normatif (ACCE≈9, AERO≈6); ini bukan persentil normatif populasi.",
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
            "acc_assm_peak_note": "Kurva fleksibilitas belajar (LFI) terhadap indeks akomodasi-asimilasi menunjukkan bentuk U-terbalik: meningkat menuju titik seimbang kemudian menurun tajam pada ekstrem yang sangat asimilatif (internalisasi tinggi tanpa penyeimbang eksternal).",
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
            "psychometric_terms": "Istilah seperti ACCE (AC−CE), AERO (AE−RO), Kendall’s W dan percentile dibiarkan dalam bahasa Inggris; ringkasan disampaikan dalam Bahasa Indonesia.",
            "acc_assm_definition": "Assim−Acc = (AC + RO) − (AE + CE). Nilai positif = preferensi lebih asimilatif; nilai negatif = lebih akomodatif.",
            "conv_div_definition": "Conv-Div = (AC + AE) − (CE + RO). Nilai positif = preferensi konvergen (penutupan pada satu opsi terbaik); nilai negatif = preferensi divergen (membuka alternatif).",
            "balance_definition": "BALANCE_ACCE = |ACCE − 9|, BALANCE_AERO = |AERO − 6|. Semakin kecil semakin seimbang; persentil BALANCE dihitung dengan penskalaan teoretis (bukan norma populasi).",
            "interpretation_summary": "Fleksibilitas rendah terutama muncul ketika proses asimilasi (AC+RO) tidak diimbangi orientasi akomodasi (AE+CE).",
        }
    }
