# Learning Space in Experiential Learning Theory (ELT)

> Catatan: Angka dan rumus kanonik (band ACCE/AERO, balance, LFI, intensity, dsb.) berada di `docs/psychometrics_spec.md`. Dokumen ini merujuk ke spesifikasi tersebut dan menghindari duplikasi.

Paraphrased synthesis based on Kolb & Kolb, with supporting ideas from Lewin, Bronfenbrenner, Lave & Wenger, and Nonaka & Konno. No proprietary wording is copied verbatim. This document aligns the theory with how this app interprets and uses learning space data.

---
## 1) What is a learning space?
Learning needs a space—far beyond a classroom. ELT treats learning space as multi‑dimensional, including:
- Physical (classrooms, architecture, environment)
- Cultural (values, norms, language, history)
- Institutional (policies, goals, traditions)
- Social (peers, teachers, community)
- Psychological (learning style, skills, values)

These layers interact in the learner’s subjective experience. The app focuses on the psychological/social layer via measured style and flexibility, and provides guidance educators can map back to the other layers.

---
## 2) Foundations behind the concept
- Lewin’s life space: Behavior = f(Person, Environment). Learning space is the lived psychological field shaped by real conditions and expectations (e.g., time pressure discouraging reflection).
- Bronfenbrenner’s nested ecology: Microsystem (course), Mesosystem (other settings), Exosystem (institutional structures), Macrosystem (cultural patterns). These shape the learning space the learner experiences.
- Situated learning (Lave & Wenger): Learning is participation in communities of practice; situations are socially constructed; identity development (novice→expert) is integral.
- Nonaka & Konno’s “ba”: A shared context that fosters knowledge creation; requires care, trust, and commitment. Psychological safety and purpose matter.

---
## 3) Human‑aggregate view and the ELT learning map
Learning spaces can be profiled by the people in them. ELT maps a two‑dimensional space using the dialectics:
- Experiencing (CE) ↔ Conceptualizing (AC)
- Acting (AE) ↔ Reflecting (RO)

Regions in this map align with KLSI 4.0’s nine styles. A person’s style is their home region; their LFI shows how flexibly they move across regions in different contexts. Our system makes these visible through:
- Raw mode totals (CE, RO, AC, AE)
- Primary differences (lihat `psychometrics_spec.md`: definisi ACCE & AERO)
- Combination indices (Acc‑Assm, Conv‑Div)
- LFI from Kendall’s W across 8 contexts

---
## 4) Principles for creating growth‑producing learning spaces
Practical guidance synthesized for educators (classroom, workshop, or workplace):

1. Respect the learner and their experience
   - Treat the full life space (relationships, safety, purpose) as part of learning.
2. Begin with the learner’s experience of the subject
   - Activate prior knowledge; connect new material to lived experience.
3. Create a hospitable space that is safe and challenging
   - Blend support with stretch. Normalize differences and dissent.
4. Make space for conversation
   - Use teams, reflective dialogues, and sense‑making rituals; integrate talking and listening.
5. Make space for development of expertise
   - Favor deep practice around goals; organize knowledge into conceptual frameworks.
6. Balance acting and reflecting
   - Learning cycles need both expression/testing and consolidation.
7. Integrate feeling and thinking
   - Emotions gate attention and memory; design affect‑cognitive integration.
8. Support inside‑out learning and learner agency
   - Foster self‑direction, meta‑cognition, and ownership of learning plans.

---
## 5) From theory to data‑driven guidance in this app
We operationalize the above via:
- Measurement: CE/RO/AC/AE totals, ACCE/AERO, Acc‑Assm & Conv‑Div, and LFI.
- Report guidance: The API report includes a `learning_space.suggestions` array that proposes concrete adjustments for educators, derived from the learner’s indices and flexibility. Examples:
  - High AERO (action heavy): add structured reflection/debriefs.
  - Low AERO (reflection heavy): add short active experiments.
  - High ACCE (concept heavy): increase concrete experiences.
  - Low ACCE (experience heavy): scaffold abstraction and modeling.
  - Extreme Acc‑Assm or Conv‑Div: counterbalance with convergence/divergence as needed.
  - Low LFI: design sequences that visit all four stages of the cycle.

---
## 6) Cross‑references
- Code: `app/services/report.py` (learning_space.suggestions), `app/services/scoring.py` (indices, LFI)
- Docs: `docs/05-learning-styles-theory.md` (nine styles, indices), `docs/06-enhanced-lfi-analytics.md` (contexts, heatmap)

---
## 7) Notes
This document paraphrases and aligns with ELT and KLSI literature to remain faithful to theory while avoiding verbatim reuse. It is intended as a bridge between research concepts and practical implementation in this system.
