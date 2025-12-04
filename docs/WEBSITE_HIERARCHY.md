# Zenotika Website Hierarchy

## Overview

Zenotika adalah platform assessment gaya belajar berbasis **Kolb Learning Style Inventory (KLSI) 4.0** dengan dua pengalaman utama:
- **Future**: Penilaian, hasil, dan tantangan pertumbuhan
- **Sphere**: Refleksi dan visualisasi pembelajaran

---

## Struktur Hirarki Frontend (Aktif di Routes)

```
🏠 Zenotika
├── 🌐 / (Landing Page)
│   └── Halaman utama dengan navigasi ke seluruh fitur
│
├── 🔐 /auth (Authentication)
│   ├── Login Form
│   └── Register Form
│
├── 🚀 /future (Future Experience)
│   ├── /future/dashboard (Assessment Dashboard)
│   │   ├── Kite Summary - Visualisasi koordinat ACCE/AERO
│   │   ├── Percentile Summary - Rangkuman persentil
│   │   └── Challenges Panel - Tantangan pertumbuhan berdasarkan blindspots
│   │
│   └── /future/tunnel (Tunnel Experience) [Layout Khusus]
│       └── Forced-choice assessment dengan 12 items + Learning Flexibility contexts
│
├── 🌍 /sphere (Zenosphere)
│   ├── Sphere Visualization - Visualisasi node interaktif
│   ├── Reflection Form - Form untuk membuat refleksi baru
│   └── Reflection List - Daftar refleksi dengan filter node
│
├── 👤 /me (Profile Page)
│   ├── User Identity - Nama, email, avatar
│   ├── Zen Points & Level - Statistik gamifikasi
│   ├── Life Motto - Motto kehidupan
│   └── Badges & Achievements - (Sementara disabled)
│
├── ⚙️ /admin (Admin Console) [Mediator Only]
│   ├── Teams Tab - Manajemen tim dengan pagination
│   ├── Research Tab - Konfigurasi studi riset
│   └── Pipelines Tab - Manajemen scoring pipelines
│
└── ❓ /* (Not Found Page)
```

---

## Backend API Endpoints (untuk Referensi)

### Authentication (`/api/v1/auth`)
- `POST /login` - Login dengan email/password
- `POST /register` - Registrasi user baru
- `POST /refresh` - Refresh JWT token

### Users (`/api/v1/users`)
- `GET /me` - Data user saat ini
- `GET /me/achievements` - Achievements user

### Sessions (`/api/v1/sessions`)
- `POST /start` - Mulai session assessment baru
- `GET /` - List semua sessions
- `GET /{session_id}` - Detail session
- `GET /{session_id}/delivery` - Items untuk diisi
- `POST /{session_id}/responses` - Submit responses
- `POST /{session_id}/submit-all-responses` - Submit semua responses
- `POST /{session_id}/finalize` - Finalisasi session
- `GET /{session_id}/state` - State session (untuk resume)
- `POST /{session_id}/autosave` - Autosave drafts

### Results (`/api/v1/results`)
- `GET /latest` - Hasil assessment terbaru
- `GET /sessions/latest` - Session terakhir dengan hasil

### Reports (`/api/v1/reports`)
- `GET /{session_id}` - Report individual
- `GET /self` - Report untuk user saat ini
- `POST /{session_id}/share` - Generate share token
- `GET /shared/{share_token}` - View shared report

### Challenges (`/api/v1/challenges`)
- `GET /user` - Challenges untuk user
- `POST /user/{challenge_id}/complete` - Mark challenge selesai

### Teams (`/api/v1/teams`)
- `GET /` - List teams
- `POST /` - Create team
- `GET /{team_id}` - Detail team
- `GET /{team_id}/members` - List members
- `POST /{team_id}/members` - Add member
- `GET /{team_id}/analytics/members` - Analytics per member
- `GET /{team_id}/rollups` - Team rollups

### Sphere (`/api/v1/sphere`)
- `GET /nodes` - Sphere nodes
- `GET /prompt` - Prompt harian
- `GET /reflections` - List reflections
- `POST /reflections` - Create reflection

### Research (`/api/v1/research`)
- `GET /studies` - List studies
- `POST /studies` - Create study
- `GET /studies/{study_id}` - Detail study
- `GET /studies/{study_id}/data` - Data export
- `GET /studies/{study_id}/reliability` - Cronbach alpha
- `GET /studies/{study_id}/validity` - Validity statistics

### Admin (`/api/v1/admin`)
- `GET /instruments/{code}/pipelines` - List pipelines
- `POST /instruments/{code}/pipelines` - Create pipeline
- `POST /instruments/{code}/pipelines/{id}/activate` - Activate pipeline
- `POST /instruments/{code}/pipelines/{id}/clone` - Clone pipeline
- `GET /norms/cache-stats` - Cache statistics
- `POST /users/{user_id}/grant` - Grant role
- `POST /users/{user_id}/revoke` - Revoke role
- `GET /perf-metrics` - Performance metrics

### Telemetry (`/api/v1/telemetry`)
- `POST /page-view` - Track page view
- `POST /action` - Track user action
- `POST /assessment` - Track assessment event
- `POST /guide-open` - Track guide open
- `POST /batch` - Batch telemetry
- `POST /replay-events` - Replay events

### Grants (`/api/v1/grants`)
- `GET /me` - User grants/roles

---

## Layout

### 1. ShellLayout (Layout Utama)
**Digunakan oleh:** `/`, `/future/dashboard`, `/sphere`, `/me`, `/admin`, `/auth`

Fitur:
- Header dengan navigasi utama (Home, Future, Sphere, Admin)
- Theme switcher (Light/Dark/System)
- Auth status (Login/Logout button)
- Session timer countdown (saat authenticated)

### 2. TunnelLayout (Layout Tunnel)
**Digunakan oleh:** `/future/tunnel`

Fitur:
- Layout khusus tanpa navigasi header
- Proteksi `beforeunload` (mencegah browser close/refresh tidak sengaja)
- Pengalaman fokus penuh untuk assessment

> **Note**: Blocker navigasi (`useBlocker`) ada di komponen `FutureTunnelExperience.tsx`, bukan di layout.

---

## Akses & Autentikasi

| Route              | Akses               | Guard                                         |
|--------------------|---------------------|-----------------------------------------------|
| `/`                | Public              | -                                             |
| `/auth`            | Public              | -                                             |
| `/future/dashboard`| Authenticated       | ✅ ProtectedRoute → redirect `/auth`          |
| `/future/tunnel`   | Authenticated       | ✅ ProtectedRoute → redirect `/auth`          |
| `/sphere`          | Authenticated       | ✅ ProtectedRoute → redirect `/auth`          |
| `/me`              | Authenticated       | ✅ ProtectedRoute → redirect `/auth`          |
| `/admin`           | Mediator Only       | ✅ ProtectedRoute → redirect `/auth` atau `/` |
| `/*`               | Public              | 404 Not Found                                 |

> **✅ Semua route yang memerlukan autentikasi sudah memiliki proper guard dengan redirect.**

---

## Navigasi Utama (ShellLayout)

```tsx
const links = [
  { to: '/', label: 'Home' },
  { to: '/future/dashboard', label: 'Future' },
  { to: '/sphere', label: 'Sphere' },
  { to: '/admin', label: 'Admin', requireMediator: true },
]
```

> **Note**: 
> - `/me` (Profile) ditampilkan sebagai icon button di header saat authenticated
> - `/admin` hanya muncul di navigasi jika user adalah mediator

---

## Fitur Per Halaman

### Landing Page (`/`)
- Deskripsi singkat Zenotika
- Teks informasi tentang Future dan Sphere experiences
- Navigasi ke fitur lain melalui header (ShellLayout)

### Auth Page (`/auth`)
- Tab Login/Register
- Validasi form
- Redirect ke `/future/dashboard` setelah berhasil
- Error handling dengan toast

### Future Dashboard (`/future/dashboard`)
- **KiteSummary**: Visualisasi hasil assessment (berisi KiteChart + StrengthsBlindspots)
- **PercentileSummary**: Statistik persentil dari norm groups
- **ChallengesPanel**: Tantangan pertumbuhan berdasarkan blindspots
- **UserBadgeRow**: (Sementara disabled/commented out)
- Data dari `GET /results/latest`, `GET /challenges/user`

### Future Tunnel (`/future/tunnel`)
- **FutureTunnelExperience**: Komponen utama dengan semua logika
  - Session management (start, autosave, finalize)
  - useBlocker untuk konfirmasi navigasi keluar
  - Draft restoration dari autosave
- **AssessmentItemCard**: Forced-choice items (12 items) dengan ranking 1-4
- **AssessmentContextCard**: Learning Flexibility contexts (4 konteks)
- **Progress tracking**: Bar progress untuk items dan contexts
- **Finalize section**: Scoring snapshot setelah submit
- Data dari `POST /sessions/start`, `GET /{id}/delivery`, `POST /{id}/autosave`, `POST /{id}/finalize`

### Sphere Page (`/sphere`)
- **SphereVisualization**: Visualisasi node interaktif (SVG-based)
- **ReflectionForm**: Input refleksi baru dengan type selection
- **ReflectionList**: Daftar refleksi dengan filter per node yang dipilih
- **Prompt**: Daily prompt untuk inspirasi (ditampilkan sebagai quote)
- **Node selection**: Klik node untuk filter reflections
- Data dari `GET /sphere/nodes`, `GET /sphere/reflections`, `GET /sphere/prompt`

### Profile Page (`/me`)
- Informasi user (nama, email, avatar initial)
- Zen Points & Level (gamifikasi)
- Life Motto (jika diisi)
- Badges & Achievements (sementara disabled/commented out)
- Data dari `useAuth().user`

### Admin Page (`/admin`)
- **TeamsPanel**: CRUD tim dengan pagination (50 per page)
- **ResearchPanel**: Manajemen studi riset (create, view status)
- **PipelinesPanel**: Konfigurasi scoring pipelines
- Data dari `GET /teams`, `GET /research/studies`, `GET /admin/instruments/{code}/pipelines`

---

## Catatan Teknis

### Stack Frontend
- **Framework**: React 18 + React Router v6
- **Build**: Vite
- **Styling**: TailwindCSS dengan CSS variables (tema)
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios via `apiClient`
- **Icons**: -

### Contexts
- **AuthContext**: `useAuthContext()` - status autentikasi, token, logout
- **ThemeContext**: `useTheme()` - dark/light/system theme

### Route Protection
- **ProtectedRoute**: Wrapper component di `app/layout/ProtectedRoute.tsx`
- Redirect ke `/auth` jika tidak authenticated
- Support `requireMediator` prop untuk admin-only routes

### API Integration
- Generated types dari OpenAPI: `@/shared/api/generated`
- Base client: `@/shared/api/client`
