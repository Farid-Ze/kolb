# Cinematic Rooms Experience

This document captures how the "rooms" journey delivers an Audemars-Piguet–style cinematic flow while staying faithful to Kolb Learning Style Inventory 4.0 psychometrics and backend contracts.

## 1. Architectural Backbone

| Layer | Responsibility | Key Files |
| --- | --- | --- |
| `SceneController` | Orchestrates room navigation, slide transitions, HUD states, and lazy loading. | `frontend/src/scenes/SceneController.tsx` |
| `ROOM_REGISTRY` | Defines ordering, metadata, and background classes for each ELT room. | `frontend/src/scenes/registry.ts` |
| Cinematic shell | Provides the gradient, vignette, and centered content column shared by rooms, assessment, and reports. | `frontend/src/core/design-system/Layout.tsx` (`PageShell`, `RoomContent`) |
| Materials & typography | Ensures consistent glass surfaces, typography, and motion primitives. | `frontend/src/core/design-system/Materials.tsx`, `Typography.tsx`, `core/physics/*` |

All room components now import the shared shell and design-system primitives so any future room automatically inherits the cinematic treatment.

## 2. Data & Services (Source of Truth)

| Concern | Client Hook/Service | Backend Endpoint |
| --- | --- | --- |
| Active session lookup | `getSessions({ status: 'ACTIVE' })` | `GET /engine/sessions/?status=ACTIVE` |
| Completed session for previews | `getSessions({ status: 'COMPLETED' })` | `GET /engine/sessions/?status=COMPLETED` |
| Report snippets in rooms | `getReport(sessionId)` | `GET /reports/{session_id}` |
| Telemetry consent + tracking | `useTelemetry` hook | `POST /telemetry/page-view`, `/telemetry/action` |

Rooms never recompute scores or norms. They simply visualize existing backend payloads where available (e.g., `AbstractConceptualizationRoom` renders a quadrant dot using `report.raw.AERO` / `report.raw.ACCE`).

## 3. Telemetry & Consent

Each room imports `useTelemetry` and:

1. Calls `trackPageView('/experience/<room>', '<Room Name>')` inside `useEffect`.
2. Records CTA clicks with `trackAction('room_cta_click', '<room-id>', targetPath, metadata)`.
3. Respects the `telemetryEnabled` consent flag via the hook (no additional logic required in rooms).

Telemetry metadata indicates whether the learner had an active session when launching the CTA, helping research UX flows without storing psychometric answers client-side.

## 4. Student Journey Touchpoints

1. **Intro / Concrete / Reflective / Abstract / Active rooms** – context setting, ethical framing, narrative prompts.
2. **AssessmentStartPage** – consent, instructions, NonDiagnosticNotice. Triggered by room CTAs through consistent `resolveActionTarget()` helpers.
3. **AssessmentPage** – forced-choice ipsative UX powered by `useAssessment` and backend validation.
4. **AssessmentReviewPage** – final checklist leveraging `/engine/sessions/:id/validation`.
5. **ReportPage** – canonical visualization using backend scores plus optional “post-report rooms” (future work) for guided reflection.

## 5. Mediator & Research Extensions (Next Phase)

*Mediator rooms*: wrap `MediatorDashboardPage`, `TeamDetailPage`, and related services (`teamService`) in cinematic shells to tell team-level narratives (style distributions, balance metrics, LFI spreads) without altering backend analytics.

*Research rooms*: apply the same pattern to `ResearchDashboardPage` / `ResearchDetailPage` using `researchService`. Emphasize responsible-use copy already present in docs and keep interaction telemetry for aggregate UX research.

## 6. Implementation Notes

- CTAs route to `/auth/login`, `/assessment/start`, or `/assessment/:sessionId` based on authentication + active session presence. The logic lives inside each room’s `resolveActionTarget()` helper to avoid breaking protected routes.
- `AbstractConceptualizationRoom` displays real report snippets **only when** the learner has at least one completed session; otherwise it stays conceptual. This prevents leaking incomplete data.
- Motion: `staggerContainer`, `fadeInUp`, and `scaleIn` create the AP-style cadence without additional physics engines.
- Accessibility: rooms keep `useRoomFocus` on headings for screen-reader continuity and rely on semantic buttons.

This document should stay alongside the frontend to guide future contributors on how cinematic rooms tie back to the verified backend systems, telemetry, and ethical constraints.
