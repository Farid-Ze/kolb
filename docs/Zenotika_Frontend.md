# Zenotika Frontend & Platform – Agile Backlog (Master Plan)

> This is the **master Markdown backlog** for Zenotika (frontend + platform) aligned with `kolb` backend and Zenotika 3.0 blueprint.
>
> - Hierarchy: **Stream → Epic → Story → Tasks**.
> - Each Task has ID, dependencies, and estimates so it can be **converted into a Gantt chart**.

---

## Legend

- **ID format**: `Z3-[STREAM]-[EPIC]-[STORY]-[SEQ]`
  - STREAM: `PLT` (Platform), `FUT`, `SPH`, `STO`, `ADM`, `QLT`
- **EstimatedDays**: calendar days or ideal dev days (you decide).

---

## Stream 1 – Platform & Frontend Infrastructure (PLT)

### Epic PLT-1 – Frontend Foundation & Scaffolding

#### Story PLT-1-A – Initialize Frontend Monolith (`frontend/`)

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-PLT-1-A-01 | Decide frontend base stack (Vite+React+TS) and document rationale |  | 1 |  | frontend,architecture |
| Z3-PLT-1-A-02 | Scaffold `frontend/` with Vite (React+TS) and basic scripts | Z3-PLT-1-A-01 | 1 |  | frontend |
| Z3-PLT-1-A-03 | Configure TypeScript strict mode (`tsconfig.json`) | Z3-PLT-1-A-02 | 1 |  | frontend,quality |
| Z3-PLT-1-A-04 | Setup ESLint + Prettier with recommended rules | Z3-PLT-1-A-02 | 1 |  | frontend,quality |
| Z3-PLT-1-A-05 | Integrate frontend lint/test with existing pre-commit hooks | Z3-PLT-1-A-04 | 1 |  | platform,devops |
| Z3-PLT-1-A-06 | Add basic `README_frontend.md` for dev onboarding | Z3-PLT-1-A-02 | 1 |  | docs |

#### Story PLT-1-B – Project Structure Aligned with Backend

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-PLT-1-B-01 | Create base folder structure `src/{app,shared,entities,features,pages}` | Z3-PLT-1-A-02 | 1 |  | frontend,architecture |
| Z3-PLT-1-B-02 | Document mapping: routers → features (auth, sessions, engine, results, sphere, store, telemetry, challenges) | Z3-PLT-1-B-01 | 1 |  | docs,architecture |
| Z3-PLT-1-B-03 | Implement `app/App.tsx` with React Router shell | Z3-PLT-1-B-01 | 1 |  | frontend |
| Z3-PLT-1-B-04 | Define route map: `/`, `/login`, `/future/tunnel`, `/future/dashboard`, `/sphere`, `/store`, `/admin`, `/me` | Z3-PLT-1-B-03 | 1 |  | frontend,ux |
| Z3-PLT-1-B-05 | Add `TunnelLayout` (no navbar) and `ShellLayout` (with nav) components | Z3-PLT-1-B-03 | 1 |  | frontend,ux |

### Epic PLT-2 – Shared API Client & Type System

#### Story PLT-2-A – HTTP Client

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-PLT-2-A-01 | Implement `shared/api/client.ts` using Axios or Fetch wrapper | Z3-PLT-1-A-02 | 1 |  | frontend,api |
| Z3-PLT-2-A-02 | Configure base URL from env (`VITE_BACKEND_URL`) | Z3-PLT-2-A-01 | 0.5 |  | frontend,devops |
| Z3-PLT-2-A-03 | Add request interceptor for `Authorization: Bearer <token>` | Z3-PLT-2-A-01 | 1 |  | frontend,security |
| Z3-PLT-2-A-04 | Add response interceptor: handle 401/403 and route to login | Z3-PLT-2-A-03 | 1 |  | frontend,security |
| Z3-PLT-2-A-05 | Add generic error shape and logging hook | Z3-PLT-2-A-01 | 1 |  | frontend |

#### Story PLT-2-B – Type Mapping from Backend Schemas

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-PLT-2-B-01 | Audit `backend/app/schemas/*.py` and list key schemas for frontend |  | 1 |  | architecture,backend |
| Z3-PLT-2-B-02 | Create `entities/user/model.ts` from `schemas.user` | Z3-PLT-2-B-01 | 1 |  | frontend,types |
| Z3-PLT-2-B-03 | Create `entities/session/model.ts` from `schemas.session` | Z3-PLT-2-B-01 | 1 |  | frontend,types |
| Z3-PLT-2-B-04 | Create `entities/results/model.ts` from `schemas.results` | Z3-PLT-2-B-01 | 1 |  | frontend,types |
| Z3-PLT-2-B-05 | Create `entities/store/model.ts` from `schemas.store` | Z3-PLT-2-B-01 | 1 |  | frontend,types |
| Z3-PLT-2-B-06 | Create `entities/sphere/model.ts` from `schemas.sphere` | Z3-PLT-2-B-01 | 1 |  | frontend,types |
| Z3-PLT-2-B-07 | Mark Zenotika-only fields (e.g. `zen_points`, badges) as optional | Z3-PLT-2-B-02 | 1 |  | frontend,architecture |

### Epic PLT-3 – State Management, React Query, and Theming

#### Story PLT-3-A – Providers & Hooks

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-PLT-3-A-01 | Add `QueryClientProvider` hooked to React Query | Z3-PLT-1-A-02 | 1 |  | frontend |
| Z3-PLT-3-A-02 | Implement `AuthProvider` using JWT token in memory + localStorage | Z3-PLT-2-A-03 | 2 |  | frontend,security |
| Z3-PLT-3-A-03 | Implement `useAuth()` hook exposing user + token + TTL | Z3-PLT-3-A-02 | 1 |  | frontend |
| Z3-PLT-3-A-04 | Implement global time-lock checker (force logout if `exp-now < 45min`) | Z3-PLT-3-A-03 | 1 |  | frontend,security |
| Z3-PLT-3-A-05 | Add ThemeProvider (light/dark, Zenotika brand tokens) | Z3-PLT-1-B-05 | 2 |  | frontend,ux |

---

## Stream 2 – Future (Self) / Assessment Engine UX (FUT)

### Epic FUT-1 – Auth & Onboarding

#### Story FUT-1-A – Registration Flow

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-FUT-1-A-01 | Design registration UX wireframe based on `auth.register` rules |  | 1 |  | ux,frontend |
| Z3-FUT-1-A-02 | Implement `features/auth/api.ts` for `POST /auth/register` | Z3-PLT-2-A-01 | 1 |  | frontend,api |
| Z3-FUT-1-A-03 | Create `RegisterForm` with fields: full_name, email, nim, kelas, tahun_masuk, password | Z3-FUT-1-A-02 | 2 |  | frontend,ux |
| Z3-FUT-1-A-04 | Client-side validation aligning with backend regex/rules | Z3-FUT-1-A-03 | 1 |  | frontend,validation |
| Z3-FUT-1-A-05 | Handle registration errors using `AuthMessages` mapping | Z3-FUT-1-A-03 | 1 |  | frontend |

#### Story FUT-1-B – Login & TTL Handling

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-FUT-1-B-01 | Implement `features/auth/api.ts` for `POST /auth/login` | Z3-PLT-2-A-01 | 1 |  | frontend,api |
| Z3-FUT-1-B-02 | Implement `LoginForm` with email + password | Z3-FUT-1-B-01 | 1 |  | frontend,ux |
| Z3-FUT-1-B-03 | Decode JWT token `exp` to compute TTL | Z3-PLT-3-A-03 | 1 |  | frontend,security |
| Z3-FUT-1-B-04 | Implement pre-assessment time-lock check on `/future/tunnel` entry | Z3-FUT-1-B-03 | 1 |  | frontend,ux,security |
| Z3-FUT-1-B-05 | Show remaining time before expiry in header/status bar | Z3-FUT-1-B-03 | 1 |  | frontend,ux |

### Epic FUT-2 – Future Tunnel (`/future/tunnel`)

#### Story FUT-2-A – Session Lifecycle

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-FUT-2-A-01 | Implement `startSession()` calling `POST /sessions/start` | Z3-PLT-2-A-01 | 1 |  | frontend,api |
| Z3-FUT-2-A-02 | Implement `getSessionItems(sessionId)` from `GET /sessions/{id}/items` | Z3-FUT-2-A-01 | 1 |  | frontend,api |
| Z3-FUT-2-A-03 | Model local assessment state (answers, latencies, blur counts) | Z3-FUT-2-A-02 | 2 |  | frontend |
| Z3-FUT-2-A-04 | Ensure strict ownership check UX (forbidden if session not owned) | Z3-FUT-2-A-02 | 1 |  | frontend,security |
| Z3-FUT-2-A-05 | Implement submit/finalize flow using engine/session schemas | Z3-FUT-2-A-03 | 2 |  | frontend,api |

#### Story FUT-2-B – Tunnel UI & UX Safeguards

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-FUT-2-B-01 | Implement `FutureTunnelPage` with `TunnelLayout` (no nav) | Z3-PLT-1-B-05 | 2 |  | frontend,ux |
| Z3-FUT-2-B-02 | Build `ItemRankCard` enforcing no duplicate ranks (1–4) | Z3-FUT-2-A-03 | 2 |  | frontend,validation |
| Z3-FUT-2-B-03 | Add `TunnelProgress` component reflecting item completion | Z3-FUT-2-A-03 | 1 |  | frontend |
| Z3-FUT-2-B-04 | Implement auto-save or periodic submission if supported | Z3-FUT-2-A-05 | 2 |  | frontend |
| Z3-FUT-2-B-05 | Implement unsaved-changes warning if user tries to exit tunnel | Z3-FUT-2-A-03 | 1 |  | frontend,ux |

### Epic FUT-3 – Future Dashboard (`/future/dashboard`)

#### Story FUT-3-A – Latest Results View

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-FUT-3-A-01 | Implement `getLatestResults()` from `routers/results` | Z3-PLT-2-A-01 | 1 |  | frontend,api |
| Z3-FUT-3-A-02 | Map kite/percentile/primary style to TS models | Z3-FUT-3-A-01 | 1 |  | frontend,types |
| Z3-FUT-3-A-03 | Implement `KiteChart` visualization | Z3-FUT-3-A-02 | 2 |  | frontend,ux,data-viz |
| Z3-FUT-3-A-04 | Implement `StrengthsBlindspots` component | Z3-FUT-3-A-02 | 2 |  | frontend |
| Z3-FUT-3-A-05 | Integrate with `/future/dashboard` page | Z3-FUT-3-A-03 | 1 |  | frontend |

#### Story FUT-3-B – Growth Challenges Panel

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-FUT-3-B-01 | Implement `getUserChallenges()` from `routers/challenges` | Z3-PLT-2-A-01 | 1 |  | frontend,api |
| Z3-FUT-3-B-02 | Build `MyChallengesPanel` UI (list + status) | Z3-FUT-3-B-01 | 1 |  | frontend |
| Z3-FUT-3-B-03 | Display linkage between blindspots and suggested challenges | Z3-FUT-3-A-04 | 1 |  | frontend,ux |

---

## Stream 3 – Zenosphere (Past) (SPH)

### Epic SPH-1 – Sphere Nodes Visualization

#### Story SPH-1-A – API Integration

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-SPH-1-A-01 | Implement `listSphereNodes()` from `routers/sphere` | Z3-PLT-2-A-01 | 1 |  | frontend,api |
| Z3-SPH-1-A-02 | Map `sphere_nodes` schema to TS model | Z3-SPH-1-A-01 | 1 |  | frontend,types |

#### Story SPH-1-B – 2D/3D Sphere View (MVP)

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-SPH-1-B-01 | Design minimal 2D / radial layout for nodes | Z3-SPH-1-A-02 | 2 |  | frontend,ux,data-viz |
| Z3-SPH-1-B-02 | Implement `SphereTimeline` or map view | Z3-SPH-1-B-01 | 3 |  | frontend |
| Z3-SPH-1-B-03 | Add selection interaction to open reflections for a node | Z3-SPH-1-B-02 | 2 |  | frontend |

### Epic SPH-2 – Reflections

#### Story SPH-2-A – CRUD Reflections

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-SPH-2-A-01 | Implement `listReflections()` and `createReflection()` from `routers/sphere` | Z3-PLT-2-A-01 | 1 |  | frontend,api |
| Z3-SPH-2-A-02 | Create `ReflectionForm` UI with reflection_type selector | Z3-SPH-2-A-01 | 2 |  | frontend,ux |
| Z3-SPH-2-A-03 | Render reflections list filtered by type & node | Z3-SPH-2-A-01 | 2 |  | frontend |

---

## Stream 4 – ZenStore & Gamification (STO)

### Epic STO-1 – Storefront

#### Story STO-1-A – Product Listing

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-STO-1-A-01 | Implement `listProducts()` from `routers/store` | Z3-PLT-2-A-01 | 1 |  | frontend,api |
| Z3-STO-1-A-02 | Map store product schema to TS model (`required_badge`, meta) | Z3-STO-1-A-01 | 1 |  | frontend,types |
| Z3-STO-1-A-03 | Implement `StorePage` with product cards and eligibility markers | Z3-STO-1-A-02 | 2 |  | frontend,ux |

#### Story STO-1-B – Product Detail

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-STO-1-B-01 | Implement `getProductDetail(productId)` | Z3-STO-1-A-01 | 1 |  | frontend,api |
| Z3-STO-1-B-02 | Build `ProductDetailPage` | Z3-STO-1-B-01 | 2 |  | frontend,ux |

### Epic STO-2 – Gamification & Identity Extensions

#### Story STO-2-A – User Badges & Achievements (Zenotika Optional Fields)

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-STO-2-A-01 | Add optional badges/zen_points fields in `entities/user/model.ts` | Z3-PLT-2-B-02 | 1 |  | frontend,types |
| Z3-STO-2-A-02 | Implement `UserBadgeRow` component | Z3-STO-2-A-01 | 1 |  | frontend |
| Z3-STO-2-A-03 | Integrate badges display into `/me` and `/future/dashboard` | Z3-STO-2-A-02 | 2 |  | frontend |

---

## Stream 5 – Admin / Research / Teams (ADM)

### Epic ADM-1 – Admin Console (`/admin`)

#### Story ADM-1-A – Access Control & Shell

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-ADM-1-A-01 | Add route guard for `/admin` requiring mediator/admin role | Z3-FUT-1-B-01 | 1 |  | frontend,security |
| Z3-ADM-1-A-02 | Implement `AdminPage` shell with sidebar | Z3-ADM-1-A-01 | 2 |  | frontend,ux |

#### Story ADM-1-B – Norms, Pipelines, and Instrument Admin

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-ADM-1-B-01 | Integrate with selected admin endpoints (`/admin`) from router | Z3-PLT-2-A-01 | 2 |  | frontend,api |
| Z3-ADM-1-B-02 | Build UI for pipeline listing and activation | Z3-ADM-1-B-01 | 3 |  | frontend |
| Z3-ADM-1-B-03 | Build basic upload/import UI for norms if needed | Z3-ADM-1-B-01 | 3 |  | frontend |

### Epic ADM-2 – Teams & Research Dashboards

#### Story ADM-2-A – Teams Overview

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-ADM-2-A-01 | Implement `listTeams()` from `routers/teams` | Z3-PLT-2-A-01 | 1 |  | frontend,api |
| Z3-ADM-2-A-02 | Visualize team rollup stats (KLSI distribution) | Z3-ADM-2-A-01 | 3 |  | frontend,data-viz |

#### Story ADM-2-B – Research Studies

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-ADM-2-B-01 | Integrate `research` router for study CRUD | Z3-PLT-2-A-01 | 2 |  | frontend,api |
| Z3-ADM-2-B-02 | Build `ResearchStudyList` and detail view | Z3-ADM-2-B-01 | 3 |  | frontend |

---

## Stream 6 – Quality, Observability, Governance (QLT)

### Epic QLT-1 – Testing

#### Story QLT-1-A – Unit & Integration Tests

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-QLT-1-A-01 | Setup Vitest or Jest with React Testing Library | Z3-PLT-1-A-02 | 2 |  | frontend,quality |
| Z3-QLT-1-A-02 | Write tests for `features/auth` (login/register) | Z3-FUT-1-A-03 | 3 |  | frontend,quality |
| Z3-QLT-1-A-03 | Write tests for `features/future-tunnel` core logic | Z3-FUT-2-A-03 | 4 |  | frontend,quality |
| Z3-QLT-1-A-04 | Write tests for `features/future-dashboard` data mapping | Z3-FUT-3-A-02 | 3 |  | frontend,quality |

### Epic QLT-2 – E2E and UX Telemetry

#### Story QLT-2-A – E2E Flows

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-QLT-2-A-01 | Setup Playwright or Cypress for E2E tests | Z3-PLT-1-A-02 | 2 |  | frontend,quality |
| Z3-QLT-2-A-02 | E2E: register → login → /future/tunnel → finalize | Z3-QLT-2-A-01 | 3 |  | frontend,quality |

#### Story QLT-2-B – Telemetry Integration (Frontend → Backend)

| ID | Title | DependsOn | EstimatedDays | Assignee | Labels |
| --- | --- | --- | --- | --- | --- |
| Z3-QLT-2-B-01 | Implement `useTelemetryBeacon()` hook (sendBeacon to `/telemetry`) | Z3-PLT-2-A-01 | 2 |  | frontend,api |
| Z3-QLT-2-B-02 | Integrate latency/blur event capture into `FutureTunnelPage` | Z3-FUT-2-A-03 | 2 |  | frontend |
| Z3-QLT-2-B-03 | Verify telemetry payload schema against backend implementation | Z3-QLT-2-B-01 | 1 |  | frontend,backend |

---

## How to Use This File for Gantt Chart

1. **Import / copy** this Markdown into:
   - Excel / Google Sheets (one row per task).
   - Tools seperti Jira, ClickUp, Notion (import table).
2. Gunakan kolom:
   - `ID` sebagai unique key.
   - `DependsOn` untuk membuat **dependency edges** di Gantt.
   - `EstimatedDays` sebagai duration.
3. Anda bisa menambah kolom:
   - `StartDate`, `EndDate`, `Milestone` sesuai kebutuhan tool.

> Untuk mencapai total ~1000 task, Anda bisa:
> - Memperbanyak rincian per Story (misalnya pecah UI/logic/test/docs untuk setiap halaman).
> - Duplikasi pola di tiap stream untuk variasi device, i18n, A/B test, dsb.