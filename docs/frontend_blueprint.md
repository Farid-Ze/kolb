# KLSI 4.0 Frontend Blueprint (React + Liquid Glass)

Dokumen ini menjadi _single source of truth_ untuk rancangan frontend KLSI 4.0 berbasis React (Vite + TypeScript) yang:

- Mengikuti kontrak API backend (lihat `docs/SITEMAP.md`, `docs/frontend_readiness.md`).
- Mengadopsi prinsip desain Apple iOS/visionOS (interface fundamentals, liquid glass, app design & UI).
- Mematuhi batasan psikometrik dan pedoman penggunaan bertanggung jawab (lihat `docs/psychometrics_spec.md`, `docs/guides/student_profile*.md`, `docs/guides/educator_responsible_use*.md`).

Dokumen ini tidak berisi kode, tetapi struktur, naming, dan tanggung jawab komponen.

---

## 1. Stack & Prinsip Utama

- **Stack teknis (target)**
  - Build: Vite + React + TypeScript.
  - Routing: React Router (data routers atau `BrowserRouter`).
  - Data fetching: React Query (TanStack Query).
  - State global: kombinasi Context (Auth, UI preferences) + React Query; store terpisah (Zustand/Recoil) hanya jika kelak diperlukan.
  - Styling: modern CSS (CSS Modules / Tailwind / CSS-in-JS) dengan design tokens (spacing, radius, blur, warna).

- **Fundamental Liquid Glass (disarikan dari Apple)**
  - **Composed surfaces, bukan kartu terpisah**: UI dipandang sebagai satu permukaan berlapis dengan area fokus yang menonjol, bukan grid kartu yang saling terisolasi.
  - **Transparansi untuk konteks, bukan dekorasi**: kaca/translucency dipakai untuk mempertahankan sense of place (konten di belakang masih terasa), bukan sekadar efek visual.
  - **Depth yang dapat dibaca**: perbedaan elevasi (shadow, blur, scale) membantu pengguna memahami mana konten utama, mana secondary, dan mana overlay.
  - **Continuity & transform**: perpindahan antar state (misalnya list → detail, konten → modal) dilakukan dengan transformasi halus yang terasa seperti memindahkan permukaan yang sama, bukan mengganti layar secara kasar.
  - **Material & lighting yang konsisten**: semua panel glass mengikuti aturan material yang sama (radius, blur, opasitas, highlight) sehingga tampak satu keluarga; ini diturunkan ke design tokens di frontend.
  - **Preferences-aware**: efek blur, transparansi, dan motion selalu tunduk pada preferensi aksesibilitas (reduce motion/transparency) dan kemampuan perangkat.

- **Prinsip desain Apple / interface fundamentals**
  - **Hierarchy & clarity**: large titles untuk layar root, teks jelas, jarak lega, visual tidak berisik.
  - **Depth & layering**: background gradient, glass surfaces, elevation (shadow), modal layer yang memberi rasa kedalaman.
  - **Motion & continuity**: transisi halus (fade/scale), navigasi list → detail dengan animasi ringan; menghormati `prefers-reduced-motion`.
  - **Accessibility**: warna dan kontras mengikuti WCAG; fokus keyboard terlihat; efek glass/motion dapat direduksi via preferensi sistem.

- **Prinsip domain KLSI 4.0**
  - **Formative, not selective**: UI tidak pernah menyiratkan fungsi seleksi/diagnostik.
  - **Norm transparency**: norm group (`norm_group_used`) dan provenance harus mudah ditemukan.
  - **Heuristic balance**: balance percentiles (BAL_ACCE/BAL_AERO) selalu diberi label “heuristic, non-normative”.
  - **Privacy & consent**: akses data individu dan agregat sesuai `docs/frontend_readiness.md §6` dan guide educator.

---

## 2. Sitemap UI: Route → Screen → API → Guides

Tabel ringkas: setiap baris adalah layar/route utama.

| Route | Screen | User | API utama | Help guide |
|-------|--------|------|-----------|------------|
| `/auth/login` | `LoginScreen` | Student, Mediator | `POST /auth/login` | Opsional: `student_profile.<locale>.md` (intro) |
| `/auth/register` | `RegisterScreen` | Student, Mediator | `POST /auth/register` | Ringkasan consent (mengacu ke `frontend_readiness §6`) |
| `/` | `HomeDashboard` | Semua | Profil/user info | Student: `student_profile`; Mediator: `educator_responsible_use` |
| `/assessment/start` | `AssessmentStartScreen` | Student | `POST /engine/sessions/start` | `student_profile` ("how this works") |
| `/assessment/:sessionId/fill` | `AssessmentDeliveryScreen` | Student | `GET /engine/sessions/{id}/delivery`, submit di tahap berikutnya | `student_profile` (bagian cara menjawab & langkah pertama) |
| `/assessment/:sessionId/review` | `AssessmentReviewScreen` | Student | `POST /engine/sessions/{id}/submit_all` (bila perlu) | `student_profile` |
| `/assessment/:sessionId/report` | `AssessmentReportScreen` | Student, Mediator | `GET /engine/sessions/{id}/report` / `GET /reports/{id}` | Student: `student_profile`; Mediator: `educator_responsible_use` |
| `/reports/self` | `SelfReportsList` | Student | Endpoint list reports | `student_profile` |
| `/teams` | `TeamsDashboard` | Mediator | `GET /teams` | `educator_responsible_use` (onboarding panel) |
| `/teams/:teamId` | `TeamDetailScreen` | Mediator | `GET /teams/{id}`, `GET /teams/{id}/rollup/run` | `educator_responsible_use` (agregasi & privasi) |
| `/research/studies` | `ResearchStudiesOverview` | Mediator/Researcher | Endpoints research* | Guide riset (bisa ditambah) |
| `/research/studies/:studyId` | `ResearchStudyDetail` | Mediator/Researcher | Endpoints research* | Guide riset |

Catatan: endpoint riset mengikuti kontrak di `docs/SITEMAP.md` dan tests terkait.

---

## 3. App Shell & Layout

### 3.1 AppShell

- **Tanggung jawab**
  - Menyediakan kerangka global: background, nav atas, area konten, dan layer modal.
  - Menempatkan provider global: `AuthProvider`, `QueryClientProvider`, `ThemeProvider` (design tokens), `RouterProvider`.

- **Perilaku visual**
  - Background: gradient lembut + subtle parallax (jika motion diizinkan).
  - Foreground: central container ("main surface") dengan sudut membulat dan efek glass.
  - Modal: `ModalLayer` di atas semua, dengan blur & dim pada background saat aktif.

### 3.2 Layout-level Components

- `AuthLayout`
  - Digunakan untuk `/auth/login`, `/auth/register`.
  - Struktur: large title di atas, satu `GlassPanel` utama untuk form.

- `DashboardLayout`
  - Digunakan untuk `/` dan layar ringkas lain.
  - Struktur: `LargeTitleHeader` + grid `GlassPanelTile` sebagai menu utama.

- `AssessmentLayout`
  - Digunakan untuk `/assessment/*`.
  - Struktur: `LargeTitleHeader` (judul sesi), area konten (items), `BottomToolbar` untuk navigation + help.

- `ReportsLayout`
  - Digunakan untuk `/assessment/:sessionId/report` dan `/reports/*`.
  - Struktur: header dengan aksi (download, open guide), body scrollable dengan beberapa kartu.

- `SplitViewLayout`
  - Digunakan untuk `/teams*` dan `/research*`.
  - Pane kiri: list (teams/studies) di `GlassPanel` tipis.
  - Pane kanan: detail di `GlassPanel` yang lebih dominan (elevasi lebih tinggi).

---

## 4. UI Primitives (Liquid Glass Layer)

### 4.1 Komponen Dasar

- `GlassPanel`
  - Props: `density` (compact/regular), `emphasis` (low/medium/high), `scrollable`.
  - Efek: blur background, alpha tinggi, shadow lembut; responsive terhadap `prefers-reduced-transparency` (dapat fallback ke solid).

- `LargeTitleHeader`
  - Menampilkan judul besar + optional subtitle.
  - Collapse ke ukuran kecil saat konten di-scroll.

- `BottomToolbar` / `TopToolbar`
  - Glass bar dengan tombol konteks (Next, Finalize, Help).
  - Sticky di bawah/atas; motion minimal.

- `PrimaryButton`, `SecondaryButton`, `IconButton`
  - Styling konsisten dengan Apple-style (radius, warna, states hover/pressed).

- `ModalLayer`
  - Root untuk semua modal (termasuk `GuideModal`).
  - Menangani animasi masuk/keluar dan blur background.

### 4.2 Komponen Domain-spesifik

- `NonDiagnosticNotice`
  - Banner kecil/medium, menjelaskan bahwa KLSI adalah alat formatif, bukan diagnostik.
  - Dipakai di: `AssessmentStartScreen`, `AssessmentReviewScreen`, `AssessmentReportScreen`.

- `BalanceDisclaimer`
  - Pesan khusus tentang sifat heuristik balance percentiles.
  - Selalu muncul di `BalanceScoresCard`.

- `ProvenancePanel`
  - Collapsible card yang menampilkan `norm_group_used`, `norm_provenance`, `used_fallback_any`, `raw_outside_norm_range`, `truncated_scales`.
  - Keterangan jika nilai mendekati batas/di luar range norm.

- `GuideModal`
  - Modal glass di tengah yang merender konten Markdown guide.
  - Triggered oleh ikon/help di berbagai screen.

---

## 5. Blueprint Flow Domain (Vertical Slices)

### 5.1 Student Flow: Assessment End-to-End

1. **Login → HomeDashboard**
   - Student login, melihat kartu "Start assessment", "My reports".

2. **HomeDashboard → AssessmentStartScreen**
   - `NonDiagnosticNotice` + ringkasan consent.
   - Tombol "Start assessment" memanggil `POST /engine/sessions/start`.

3. **AssessmentStartScreen → AssessmentDeliveryScreen**
   - `GET /engine/sessions/{id}/delivery` untuk mengambil item/konteks.
   - Layout: `AssessmentLayout` dengan `ContextNavigator` + `RankedItemCard`.
   - Help button membuka `GuideModal` (student guide, bagian cara menjawab).

4. **AssessmentDeliveryScreen → AssessmentReviewScreen**
   - Ringkasan jawaban; `NonDiagnosticNotice` di atas.
   - Tombol "Finalize" memicu `submit_all` jika belum, lalu ke finalize.

5. **AssessmentReviewScreen → Finalize → AssessmentReportScreen**
   - Menjalankan `POST /engine/sessions/{id}/finalize`.
   - `AssessmentReportScreen` menampilkan report lengkap (lihat §6).

### 5.2 Mediator Flow: Responsible Use

1. **Login (role Mediator) → HomeDashboard**
   - Kartu khusus "Mediator tools".

2. **HomeDashboard → TeamsDashboard**
   - `SplitViewLayout`: list tim di kiri, onboarding panel di kanan (konten dari `educator_responsible_use`).

3. **TeamsDashboard → TeamDetailScreen**
   - `TeamRollupCard` menampilkan distribusi gaya dan rata-rata LFI (aggregated, anonim, ≥10 jika policy demikian).
   - Help button membuka `GuideModal` ke `educator_responsible_use.<locale>.md`.

### 5.3 Research & Audit Flow

1. **Mediator/Researcher → ResearchStudiesOverview**
   - List studi riset (jika ada fitur ini di API).

2. **ResearchStudiesOverview → ResearchStudyDetail**
   - Panel agregat + provenance norm group yang dipakai di studi tersebut.
   - Fitur export hanya di jalur yang mematuhi consent & anonymization.

---

## 6. Panel Psikometrik di `AssessmentReportScreen`

Setiap panel mengacu pada `docs/psychometrics_spec.md` dan data di response `/reports/{session_id}`.

- `LearningStyleSummaryCard`
  - Menampilkan primary style, backup style, intensitas.
  - Bahasa: "current learning preference" bukan "type".

- `ModeScoresCard`
  - CE, RO, AC, AE raw + percentile.
  - Subtitle: "Percentiles based on norm group: {norm_group_used}".

- `DialecticScoresCard`
  - ACCE dan AERO + Low/Mid/High band.
  - Penjelasan singkat per sumbu.

- `BalanceScoresCard`
  - Menampilkan BAL_ACCE dan BAL_AERO + label "balance heuristic".
  - Selalu menyertakan `BalanceDisclaimer`.

- `LearningSpaceKite`
  - Grafik posisi di kuadran ELT.

- `LFISection`
  - Nilai LFI + level (Low/Med/High) + deskripsi interpretasi sesuai dokumen.

- `ProvenancePanel`
  - Lihat §4.2; menampilkan sumber norm, fallback, truncation.

- `MetaLearningRecommendationsCard`
  - Narrative & rekomendasi praktik; digunakan untuk action plan.

---

## 7. Sistem Bantuan Kontekstual & Telemetry

### 7.1 Fetch & Render Guides

- **Hook `useGuide(guideId, locale)`**
  - Fetch: `GET /static/guides/{guideId}.{locale}.md`.
  - Fallback: jika 404, coba tanpa sufiks locale (`{guideId}.md`).
  - Output: `content` (string Markdown), `isLoading`, `error`.

- **Komponen `GuideModal`**
  - Props: `guideId`, `locale`, `isOpen`, `onClose`, `surface` ("modal"/"drawer"/"link").
  - Perilaku:
    - Saat transisi `isOpen` false→true: panggil telemetry `trackGuideOpen`.
    - Tampilkan konten Markdown dalam `GlassPanel` dengan scroll.

### 7.2 Telemetry

- **Hook `useTelemetry()`**
  - Fungsi `trackGuideOpen({ guideId, locale, surface })` → `POST /telemetry/guide-open`.
  - Dipanggil oleh `GuideModal`.

- **Integrasi di Screen**
  - `AssessmentStart`, `AssessmentFill`, `AssessmentReport`, `TeamsDashboard`, `TeamDetail`, `ResearchStudyDetail` memicu `GuideModal` sesuai mapping di §2.

---

## 8. State Management & Data Layer

- **AuthContext**
  - Menyimpan `user` + `accessToken`.
  - Metode: `login`, `logout`, `refreshToken`.
  - Digunakan oleh HTTP client untuk menyertakan header Authorization.

- **React Query**
  - Query keys:
    - `['session', sessionId]`, `['session', sessionId, 'report']`.
    - `['teams']`, `['teams', teamId]`, `['teams', teamId, 'rollup']`.
    - `['research', 'studies']`, `['research', 'studies', studyId]`.
    - `['guide', guideId, locale]`.
  - Mutations:
    - Auth (`/auth/login`, `/auth/register`).
    - Assessment (`/engine/sessions/start`, `submit_all`, `finalize`).
    - Telemetry (`/telemetry/guide-open`).

- **UI Preferences Context**
  - Menyimpan preferensi: tema (light/dark), motion, transparency.
  - Sinkron dengan media query `prefers-reduced-motion` / `prefers-reduced-transparency`.

---

## 9. Implementasi Bertahap

- **Tahap 1: Shell & Layout**
  - Implement `AppShell`, layout dasar, dan beberapa screen stub dengan dummy data.

- **Tahap 2: Vertical Slice Student**
  - Implement alur penuh: Login → Start Assessment → Fill → Review → Report, terhubung ke backend.

- **Tahap 3: Mediator Tools**
  - Implement `/teams` dan `/teams/:id` + integrasi guide `educator_responsible_use` dan rollup.

- **Tahap 4: Research & refinements**
  - Implement layar research (jika API sudah siap) dan polish motion + accessibility.

Dokumen ini menjadi referensi bagi tim frontend dan backend saat mengembangkan dan mengevaluasi konsistensi UI terhadap arsitektur serta batasan psikometrik KLSI 4.0.