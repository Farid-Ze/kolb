# Educator Roles & Teaching Around the Experiential Learning Cycle

> Catatan: Rumus & ambang indeks (ACCE/AERO bands, LFI, intensity, kombinasi dialektik) tersentral di `docs/psychometrics_spec.md`. Dokumen ini hanya merujuk.

Paraphrased synthesis (Kolb & Kolb; ELT). Connects roles to app analytics. No proprietary wording copied.

---
## 1. Teaching Around the Cycle & Spiral
Effective design activates all four modes (CE→RO→AC→AE) repeatedly, forming an ascending spiral (transfer → deeper questioning → more effective action). Each passage strengthens affective, perceptual, symbolic, and behavioral complexity. Our system surfaces indices (lihat `psychometrics_spec.md` untuk definisi ACCE/AERO, Acc‑Assm, Conv‑Div, LFI) guna memandu fokus mode.

---
## 2. Four Core Educator Roles
| Role | Mode Pair | Primary Purpose | Typical Practices |
|------|-----------|-----------------|------------------|
| Facilitator | CE + RO | Surface experience & intrinsic motivation; open perspectives | Dialog reflektif, studi kasus hidup, journaling, circle sharing |
| Expert | RO + AC | Structure concepts; connect reflections to knowledge frameworks | Mini-lecture terfokus, pemetaan konsep, model teori, analisis contoh |
| Evaluator | AC + AE | Apply standards; close loop via performance & feedback | Rubrik kinerja, tugas proyek, uji prototipe, review kualitas |
| Coach | CE + AE | Personalized action & iteration; contextual adaptation | 1:1 goal session, action plan, rapid experiment, feed-forward meeting |

Each role engages one grasp + one transform mode (experience/abstraction + reflection/action).

---
## 3. Sequencing Patterns
| Learner Polarity | Recommended Spiral Sequence | Rationale |
|------------------|-----------------------------|-----------|
| High Concept (ACCE: band tinggi) | Facilitator → Expert → Evaluator → Coach | Ground abstraction in lived experience, then scaffold application and personalized transfer |
| High Experience (ACCE: band rendah) | Expert → Facilitator → Coach → Evaluator | Provide structure early, then broaden experiential range and finalize with standards |
| High Action (AERO: band tinggi) | Facilitator → Expert → Evaluator → Coach | Insert reflection early, end with coaching for sustainable iteration |
| High Reflection (AERO: band rendah) | Facilitator → Coach → Expert → Evaluator | Activate action earlier, then consolidate conceptual/system performance |
| Low Flexibility (LFI band rendah) | Two short spirals back-to-back | More repetitions build modal switching capacity |
| Balanced & High Flex (LFI band tinggi) | Full single spiral; optional divergence extension | Capable of deep integration; extend Facilitator/Expert for richer synthesis |

---
## 4. System Integration
- Function `_educator_role_suggestions` (in `report.py`) derives role sequence and outputs `learning_space.educator_roles`.
- Inputs: primary style, ACCE, AERO, LFI.
- Output: ordered steps with role, focus pair, action hints, plus a tailored note.

Example snippet:
```json
"educator_roles": [
  {"step":1,"role":"Facilitator","focus":"CE+RO","actions":["aktivasi pengalaman","dialog reflektif"]},
  {"step":2,"role":"Expert","focus":"RO+AC","actions":["pemetaan konsep","model/teori"]},
  {"step":3,"role":"Evaluator","focus":"AC+AE","actions":["tugas kinerja","umpan balik terhadap kriteria"]},
  {"step":4,"role":"Coach","focus":"CE+AE","actions":["rencana aksi personal","prototipe"]},
  {"note":"Tambahkan debrief reflektif setelah setiap percobaan untuk menguatkan transfer."}
]
```

---
## 5. Adapting Roles for Primary Styles
| Primary Style Cluster | Added Emphasis |
|-----------------------|----------------|
| Imagining / Experiencing | Ensure convergent closure (Evaluator/Coach) is time-boxed |
| Thinking / Deciding / Analyzing | Prolong divergent generation (Facilitator/Expert) before locking decisions |
| Initiating / Acting | Embed reflection checkpoints (Facilitator) after action bursts |
| Balancing | Offer dual spiral paths to compare alternative knowledge constructions |

---
## 6. Practical Micro-Design Template
```
Phase 1 (Facilitator): Trigger lived experience (scenario immersion) + reflective framing
Phase 2 (Expert): Distill patterns into conceptual map + principle extraction
Phase 3 (Evaluator): Performance task applying model (prototype, case analysis) + criteria-based feedback
Phase 4 (Coach): Personal action plan + commitment + experiment scheduling
Repeat (optional): Shortened loop to reinforce transfer
```

---
## 7. Metrics for Iteration Quality (Future Extension)
| Metric | Source | Insight |
|--------|--------|--------|
| Mode dwell time | Session logs | Over/under-emphasized phases |
| Reflection latency | Timestamp diff CE→RO | Need forced pause? |
| Concept density | Notes NLP measure | Adequacy of abstraction phase |
| Action iteration count | AE attempts / session | Experimentation vigor |
| Feedback turnaround | Evaluator→Coach time | Learning velocity |

---
## 8. Constraints & Disclaimer
Role recommendations are heuristic scaffolds, not prescriptive mandates. Local context (class size, modality, assessment regime) may require variations. Calibrate empirically with learner feedback and outcome metrics.

---
## 9. Roadmap
- Tag roles with cognitive/emotional load estimates.
- Dynamic spiral length adjustment using LFI trajectory.
- Cohort distribution heatmap to auto-suggest aggregate role balance.

---
## 10. Summary
Integrating educator roles with learner style/flexibility indices enables adaptive design that systematically activates all stages of the learning cycle while addressing polarity, flexibility gaps, and style clustering. This document provides the conceptual and implementation bridge for that alignment.
