# Educator/Mediator Guide: Responsible Use of KLSI 4.0

This guide supports lecturers, facilitators, and mediators who leverage KLSI 4.0 for learning design. Use it alongside `docs/frontend_readiness.md`, `docs/03-klsi-overview.md`, and `docs/04-learning-space.md`.

## 1. Core Principles

1. **Formative, not selective** – communicate clearly that scores exist for reflection and activity planning, not judging aptitude or assigning labels.
2. **Norm transparency** – mention the norm version/group shown in the report (via `norm_group_used`) so participants understand the comparison base.
3. **ELT flexibility** – emphasize that learning styles shift with experience. The facilitator’s job is to help learners rotate through CE→RO→AC→AE.

## 2. Recommended Classroom Workflow

1. **Pre-session**
   - Share the consent text (see `docs/frontend_readiness.md §6.2`).
   - Create the class/team in `/teams` when needed.
   - Ensure each participant completes the assessment and passes validation (`ready: true`).
2. **During session**
   - Use report panels to trigger reflective dialogue; avoid flashing raw scores without context.
   - Show the learning-space chart to discuss diversity of approaches.
3. **Post-session**
   - Log insights from the group discussion.
   - Design follow-up activities that reinforce less dominant modes.

## 3. Privacy & Compliance

- Share individual reports only with their owners. For class discussions, use aggregated (≥10) or anonymized data.
- Respect retention limits (≤5 years or until graduation). Coordinate purge jobs when deletion is requested.
- Avoid downloading raw data to personal devices without encryption.

## 4. Designing CE/RO/AC/AE Activities

| Mode | Strategy | Sample activity |
|------|----------|-----------------|
| CE | Create direct experiences | Mini field trip, simulation, personal case reflection |
| RO | Encourage reflection | Journals, post-activity debrief, gallery walk |
| AC | Link to theory | Interactive mini-lecture, framework mapping, mind maps |
| AE | Test ideas | Quick prototyping, lab experiment, decision role-play |

Pair your agenda with the team’s aggregated style profile to ensure balanced exposure.

## 5. Using System Features

- **Mediator dashboard** – monitor session statuses; only use force finalize with documented reasons.
- **Teams & rollups** – call `/teams/{id}/rollup/run` to get style distributions and average LFI.
- **Research mode** – confirm research consent is granted and datasets are anonymized before exports.

## 6. Communication Guidelines

- Favor language like “current preference,” “learning strengths,” and “practice opportunities.”
- Avoid deterministic phrases such as “fixed type” or “perfect profile.”
- Reiterate the heuristic nature of balance percentiles whenever they appear.

## 7. Pre-Share Checklist

- [ ] Student consent is captured and stored.
- [ ] Participants reviewed their own results before class discussion.
- [ ] Slides/handouts cite the norm version and Kolb 4.0 Guide.
- [ ] Planned activities cover CE, RO, AC, and AE.
- [ ] Aggregated data for class sharing is anonymized.

## 8. Escalation & Support

- **Scientific Lead** – consult on interpretation changes or norm/style updates.
- **Engineering Lead** – troubleshoot technical or audit-log issues.
- **Data Protection Officer** – handle privacy, retention, and deletion requests.

Incorporate this guide into mediator onboarding and keep it updated whenever norms, reports, or privacy policies change.
