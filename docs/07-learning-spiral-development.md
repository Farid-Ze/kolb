# Experiential Learning Spiral & Adult Development (ELT)

> Catatan: Rumus & ambang kanonik (ACCE/AERO bands, balance, LFI, intensity, dsb.) berada di `docs/psychometrics_spec.md`. Dokumen ini merujuk tanpa menduplikasi; angka di sini yang bersifat heuristik ditandai jelas.

Paraphrased synthesis (Kolb 1984; Kolb & Kolb KLSI 4.0 Guide; Zull 2002; Maturana & Varela 1980). No proprietary wording copied. Bridges theory → implementation.

---
## 1. Spiral vs Cycle
ELT's four-mode cycle (CE → RO → AC → AE) becomes a *spiral* when each pass produces richer, transferable structures. Reflection enriches experience; abstraction assigns meaning; action tests and generates new experience that starts a higher-level iteration. Repeated loops expand *affective, perceptual, symbolic, behavioral* complexity.

| Mode | Complexity Dimension (paraphrased) |
|------|------------------------------------|
| CE (Concrete Experience) | Affective richness (emotional nuance, empathy) |
| RO (Reflective Observation) | Perceptual discernment (pattern noticing, perspective) |
| AC (Abstract Conceptualization) | Symbolic structuring (models, logic) |
| AE (Active Experimentation) | Behavioral adaptability (implementation, iteration) |

Integration occurs as dialectic tensions (AC↔CE, AE↔RO) are flexibly resolved.

---
## 2. Autopoiesis & Neuroscience Link
- Zull: Spiral maps to cortical regions (sensory → integrative → frontal → motor) strengthening neuronal networks through repeated cycling.
- Maturana & Varela: Autopoiesis (self-making) — cognition as self-organizing recursive loops; learning spirals as living system pattern.

Our system operationalizes loop variation with **LFI = 1 − W** (Kendall's W across 8 contexts) indicating adaptive repertoire breadth.

---
## 3. Developmental Stages (Heuristic Representation)
Original ELT adult development notion (inspired by Jungian individuation):
1. Acquisition (Foundational differentiation of basic capabilities)
2. Specialization (Dominant style consolidates via education/career demands)
3. Integration (Non-dominant modes expressed → holistic pattern)

We approximate indicators (non-diagnostic) using indices:
- **Intensity** (lihat `psychometrics_spec.md`) — strong polarity suggests specialization
- **Flexibility (LFI)**: High values suggest integrative movement among regions.
- **Acc‑Assm & Conv‑Div** extremes can denote skew toward accommodation or convergence; balanced near zero supports integration.

---
## 4. Deep Learning Levels
Paraphrasing multi-loop learning ideas (registrative ↔ interpretative ↔ integrative):
| Level | Operational Marker (Heuristic) | Description |
|-------|--------------------------------|-------------|
| Registrative | Low LFI, high polarity (intensity), 2 modes dominate | Recording & performing within specialization boundaries |
| Interpretative | Moderate LFI, partial polarity, 3 modes active | Reframing with an added mode, expansion of meaning |
| Integrative | High LFI, balanced polarity, all 4 modes engaged | Full-cycle adaptation; dialectics flexibly coordinated |

Related research traditions: single-loop (performance), double-loop (learning), triple-loop (development/meta-learning).

---
## 5. Implementation Mapping
| Construct | Code Source | Notes |
|----------|-------------|-------|
| Raw mode scores | `compute_raw_scale_scores` | Base affective/perceptual/symbolic/behavioral inputs |
| ACCE, AERO | `compute_combination_scores` | Core dialectic differentials |
| Acc‑Assm, Conv‑Div | `compute_combination_scores` | Combination dialectics (Accommodation vs Assimilation; Converging vs Diverging) |
| LFI (Kendall's W) | `compute_kendalls_w` / `compute_lfi` | Contextual spiral variability |
| Development block | `build_report` (`learning_space.development`) | Heuristic stage + deep level + rationale |
| Integrative Development regression | `predict_integrative_development` | Empirical link (β LFI strongest) |

---
## 6. Heuristic Classification (Report Layer)
Added field: `learning_space.development` with:
```json
{
  "spiral_stage": "Acquisition|Specialization|Integration",
  "deep_learning_level": "Registrative|Interpretative|Integrative",
  "rationale": "intensity=..; LFI=..; |ACCE|=..; |AERO|=..; Acc-Assm=..; Conv-Div=..",
  "disclaimer": "Heuristic only; formative guidance."
}
```
Criteria (simplified thresholds):
- Acquisition: intensity < 12 AND LFI < 0.45
- Specialization: intensity ≥ 12 AND LFI < 0.70 AND (|ACCE| ≥ 15 OR |AERO| ≥ 12)
- Integration: else (balanced or flexible pattern)
- Deep Level: Integrative if LFI ≥ 0.70 & |ACCE| ≤ 10 & |AERO| ≤ 8; Interpretative if LFI ≥ 0.55 & moderate polarity; otherwise Registrative.

---
## 7. Use & Limitations
The developmental mapping is *supportive analytics*, not psychometric staging. It encourages reflective planning (e.g., adding underused modes) and avoids labeling permanence. Longitudinal tracking would be required for formal developmental research.

---
## 8. Future Enhancements
- Longitudinal session comparison to observe spiral shift trends.
- Mode complexity proxies (e.g., lexical diversity in reflection logs for perceptual complexity).
- Adaptive recommendations sequencing (e.g., prescribe CE→RO→AC→AE loops for low LFI users).

---
## 9. Quick Example
A learner: ACCE=18, AERO=14, Acc‑Assm=−22, Conv‑Div=25, intensity=32, LFI=0.42 → Stage="Specialization" (concept/action polarity), Level="Registrative" (low flexibility). Suggestions: integrate concrete experiences and reflection cycles; promote divergence before decision closure.

---
## 10. Summary
This document links ELT's spiral model to the indices exposed by the API. By surfacing a heuristic stage and deep learning level, educators receive formative cues to balance cycles, broaden adaptive modes, and guide developmental interventions without asserting rigid hierarchical progression.
