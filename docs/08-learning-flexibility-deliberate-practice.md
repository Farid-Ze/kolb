# Learning Flexibility, Meta-Learning & Deliberate Practice

> Catatan: Semua rumus & cut-point kanonik (ACCE/AERO bands, balance, LFI, intensity, Acc‑Assm, Conv‑Div) berada di `docs/psychometrics_spec.md`. Dokumen ini merujuk tanpa menduplikasi.

Paraphrased synthesis (Kolb 1984; Kolb & Kolb KLSI 4.0 Guide; Flavell 1979; Zull 2002; Ericsson et al. 1993; mindfulness research). Bridges flexibility theory with implementation artifacts.

---
## 1. Flexibility vs Style
- **Style**: Preferred pattern (home region) in ELT space (ACCE & AERO position).
- **Flexibility (LFI)**: Capacity to vary mode order/usage across *contexts* (LFI = 1 − Kendall's W). High LFI → broader adaptive repertoire; low LFI → specialization lock-in.
- **Accentuation loop**: Preferred interpretation → chosen actions → reinforcing contexts → entrenchment (can be interrupted by conscious meta-learning).

Backup styles (observed alternate region usage in contexts) signal emergent adaptability.

---
## 2. Indices Supporting Flexibility Analysis
| Metric | Meaning | Risk When Extreme |
|--------|---------|------------------|
| ACCE | Conceptual vs experiential pole (lihat `psychometrics_spec.md`) | Over‑abstraction (experience deficit) or unintegrated immersion |
| AERO | Action vs reflection pole (lihat `psychometrics_spec.md`) | Premature closure / analysis paralysis |
| Acc‑Assm | Combination dialectic (lihat `psychometrics_spec.md`) | Reaction/exploration bias vs over‑internal assimilation |
| Conv‑Div | Combination dialectic (lihat `psychometrics_spec.md`) | Narrow convergence vs idea diffusion without decision |
| Intensity | Lihat `psychometrics_spec.md` | High polarity reduces modal switching ease |
| LFI | Berbasis Kendall’s W (lihat `psychometrics_spec.md`) | Low: rigid; High: context-sensitive |

---
## 3. Meta-Cognition & Learning Identity
Meta-cognition: Monitor (What am I doing?), evaluate (Is it working?), regulate (What next?).
Learning identity polarity (Fixed ↔ Learning Self) shapes persistence and risk posture.

| Fixed Self Signals | Learning Self Signals |
|--------------------|----------------------|
| Negative self-talk | Trusts experiential process |
| Avoids risk/failure | Seeks challenge/new contexts |
| Threatened by others' success | Learns from others' success |
| Outcome fixation | Tracks progress trend |

Shift tactics: replace absolute self-judgments with process language; inventory weekly gains; externalize failure as data.

---
## 4. Mindfulness Enablement
Mindfulness strengthens CE (present sensory contact) and opens bandwidth for RO before AC/AE sequencing.
Core micro-practices:
1. Breath anchor (2 minutes, exhale longer) pre high-cognitive task.
2. 5-sense scan to break abstraction loop (rebalancing high ACCE).
3. Post-action pause: 3 prompt journal (What? So What? Now What?).

---
## 5. Deliberate Practice & Learning Cycle
Deliberate practice = Goal → Focused attempt → Feedback vs model → Adjust → Repeat.
Map to ELT: CE (performance attempt) → RO (feedback analysis) → AC (model refinement) → AE (next iteration). Repeated compression of loop speeds skill acquisition.

Checklist:
- Specific micro-skill (not generic "be better at analysis").
- Immediate metric (accuracy %, latency, defect count).
- Feedback source (mentor, rubric, instrumentation).
- Scheduled repetition (sprint cadence).

---
## 6. Developing Each Mode (Skills Lens)
| Mode | Primary Skill Cluster | Inhibiting Opposite | Micro-Interventions |
|------|-----------------------|---------------------|---------------------|
| CE | Interpersonal / emotional attunement | Excess abstraction | Sense data log; empathy mirroring exercise |
| RO | Information & sense-making | Impulsive action | Structured reflection template; perspective-taking rotation |
| AC | Analytical/modeling | Over-immersion affect | Concept map after session; hypothesis articulation |
| AE | Initiative/implementation | Rumination/delay | Time-boxed prototype; 24h experiment rule |

---
## 7. System Implementation Hooks
| Feature | Code | Output Field |
|---------|------|--------------|
| LFI computation | `compute_kendalls_w` / `compute_lfi` | `lfi.value` / percentile |
| Backup style capture | `assign_learning_style` (+backup) | `style.backup_*` |
| Flexibility narrative | `_generate_flexibility_narrative` | `enhanced_analytics.flexibility_narrative` |
| Meta-learning suggestions | `_derive_meta_learning` | `learning_space.meta_learning` |
| Spiral/development heuristic | `_classify_development` | `learning_space.development` |

---
## 8. Heuristic Thresholds (Current Defaults)
| Aspect | Low / Concern | Target / Balanced | High / Note |
|--------|---------------|-------------------|-------------|
| LFI | < 0.50 | 0.55–0.75 | > 0.80 (watch diffusion) |
| Intensity | > 28 (strong polarity) | 12–24 | < 10 (may lack differentiation) |
| ACCE (band) | High band | Mid band | Low band |
| AERO (band) | High band | Mid band | Low band |

---
## 9. Using Suggestions Programmatically
`learning_space.meta_learning` returns a sequence of concise action prompts. Clients (UI) can group by theme (Mindfulness, Mode Development, Identity) by keyword matching (e.g., "Mindfulness", "jurnal", "goal"). Future: tag each suggestion explicitly.

---
## 10. Future Enhancements
- Tag taxonomy for suggestions (JSON: {text, category, evidence_ref}).
- Longitudinal LFI trajectory slope & stability metric.
- Adaptive coaching engine (reinforcement learning ranking of next intervention effectiveness).
- Peer benchmark module (percentile context for intensity and polarity indices once larger dataset ingested).

---
## 11. Disclaimer
All analytics are formative aids, not clinical or high-stakes assessments. Thresholds may evolve with normative data maturation.

---
## 12. Quick Example
Input indices: ACCE=18, AERO=4, Acc-Assm=−10, Conv-Div=22, LFI=0.48, intensity=22.
Output meta highlights might include: widen concrete experience, add iterative prototypes, schedule structured reflection to elevate LFI above 0.55, mindfulness to temper conceptual dominance.

---
## 13. Summary
Flexibility operationalizes dynamic movement in the ELT spiral. Meta-cognitive, mindful, and deliberate practice interventions are generated automatically to expand adaptive range while maintaining differentiated strengths.
