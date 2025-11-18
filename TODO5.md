# TODO 5.0 – Full Stack Integration & UX Hardening

> Fokus: tugas lintas layer (backend ↔ frontend) untuk memastikan alur asesmen, laporan, dan dashboard berjalan ujung ke ujung dengan kualitas UX, aksesibilitas, dan telemetry yang sesuai Guidelines.md dan dokumen ELT.

## A. Assessment Flow End-to-End

- [ ] **SSOT Assessment State (Guidelines §5–§6):** Pastikan `useAssessment`, `assessmentService` (`getAssessmentItems`, `submitAnswers`), dan backend `/sessions/*` (`start`, `.../items`, `.../submit_all_responses`, `.../{id}/finalize`) konsisten dengan `frontend_blueprint.md` dan prinsip $UI = f(State)$ (satu source of truth, data mengalir ke bawah, event ke atas) untuk state asesmen (loading, error, resume).
- [ ] **Validation Ujung ke Ujung:** Cek bahwa finalisasi sesi di backend (`runtime.finalize_with_audit` via `/sessions/{id}/finalize` dan `/sessions/{id}/submit_all_responses`) sinkron dengan UI `AssessmentReviewPage` (konfirmasi, error, retry) dan pesan error dari `run_session_validations`.
- [ ] **Empty / Edge Cases (Guidelines §1.2, §7.3):** Tangani kasus sesi tanpa item, payload kosong/parsial, timeout API, atau jawaban tidak lengkap di UI dan backend dengan pesan yang konsisten (termasuk status 400, 403, 409 dari router sessions) dan uji di berbagai form factor (mobile/tablet/desktop) serta state (Loading, Error, Data Kosong, Data Penuh).
- [ ] **Assessment Progress Persistence Tests:** Tambah integration test yang memverifikasi bahwa autosave di `useAssessment` menghasilkan payload identik dengan `SessionSubmissionPayload` di backend untuk beberapa skenario (jawaban lengkap, sebagian, duplikat rank).
- [ ] **Idempotent Finalize Behaviour:** Tambah test backend yang memastikan pemanggilan ulang `/sessions/{id}/finalize` setelah completed selalu memberikan respons konsisten (409 + pesan jelas) tanpa mengubah hasil psychometric.
- [ ] **LFI Context Completeness UX:** Di UI `AssessmentReviewPage`, tampilkan indikator eksplisit untuk 8 konteks LFI sesuai diagnosa dari `run_session_validations` (bukan hanya "ada error"), supaya peserta dan fasilitator mengerti mengapa finalize ditolak.

## B. Report & Psychometrics Integration

- [ ] **Report Data Shape:** Sinkronkan schema `Report` di frontend (`frontend/src/types/api.ts`, `useReport`, `reportService`) dengan payload backend `GET /reports/{session_id}` (raw scores, dialectic, percentiles, LFI, provenance, `responsible_use_notice`).
- [ ] **Non-Diagnostic Notice (Guidelines §3, §8.5.3):** Gunakan `NonDiagnosticNotice` dan/atau `ResponsibleUseFooter` di `ReportPage` dan halaman terkait dengan teks yang konsisten dengan `guides/educator_responsible_use.*`, serta pastikan warna dan kontras banner memenuhi WCAG (rasio kontras minimal 4.5:1) baik pada material standar maupun saat reduce transparency aktif.
- [ ] **Enhanced Analytics (Mediator-Only):** Pastikan `EnhancedAnalyticsPanel`, `FlexibilityChart`, dan `LearningStyleChart` hanya menampilkan enhanced analytics ketika backend mengizinkan (mis. `viewer_role='MEDIATOR'`), dan memakai data yang benar dari backend (LFI, style windows) tanpa melanggar batasan non-diagnostik.
- [ ] **Heuristic vs Normative Flagging:** Tambahkan flag eksplisit di payload report (mis. `is_heuristic: true`) untuk setiap section yang berasal dari `_classify_development`, `_derive_learning_space_suggestions`, `_derive_meta_learning`, dan pastikan UI memberi label visual yang membedakan skor normatif vs rekomendasi heuristik.
- [ ] **Norm Provenance Surfacing:** Expose ringkas `norm_provenance` di UI (mis. tooltip di `ScoreDisplay`) untuk menunjukkan norm group dan sumber (DB vs Appendix) tanpa membanjiri pengguna, selaras dengan standar test fairness.
- [ ] **Cross-Validation of Report Types (Guidelines §7.3):** Tambah test yang membandingkan output `build_report` dengan contoh JSON di `docs/sample_api_payloads/report.sample.json` untuk beberapa edge case (near-boundary, truncation, mixed-provenance) dan pratinjau (preview) komponen report di berbagai state (Loading, Error, Data penuh/kosong) untuk mencegah drift antara implementasi, dokumentasi, dan UI.

## C. Auth, Roles & Access Control

- [ ] **Role-Based Routing:** Konsolidasikan akses `MediatorDashboardPage`, `ResearchDashboardPage`, `TeamDetailPage` dengan role dari `AuthContext` dan backend (STUDENT/MEDIATOR/ADMIN), mengikuti aturan di `routers/reports.py` dan `routers/teams.py`.
- [ ] **Session Guarding:** Pastikan halaman asesmen & laporan memeriksa autentikasi dan kepemilikan session/report (authorization consistency backend ↔ frontend, termasuk batasan student hanya boleh melihat sessinya sendiri).
- [ ] **Error UX Auth:** Integrasikan `errorHandler` dan `isAuthError` ke seluruh service (redirect ke login, pesan error ramah, preservasi intent setelah login) dan sinkron dengan event `auth:unauthorized` yang dipicu dari `apiHelper`.
- [ ] **Consistent Role Propagation:** Tambah contract test yang memastikan claim JWT (role) → `get_current_user` → `AuthContext.user.role` konsisten untuk seluruh role (STUDENT/MEDIATOR/ADMIN) dan bahwa UI tidak pernah menampilkan route yang backend pasti tolak.
- [ ] **Fine-Grained Report Sharing:** Rancang dan uji flow share report (mis. link `reportId`) yang tetap menghormati privasi: student hanya boleh share ke mediator yang terotorisasi, dan UI harus menampilkan `NonDiagnosticNotice` secara menonjol saat link dibuka.
- [ ] **Login Page Contrast & Motion (Guidelines §2.5, §3.4):** Audit `LoginPage` (Card, Alert, Button, glass-regular background) untuk memastikan kombinasi warna teks/background memenuhi rasio kontras WCAG di semua state (default, error, hover) dan animasi `motion.div` mematuhi preferensi `useReduceMotion` (mis. menonaktifkan spring/bounce saat reduce motion aktif).

## D. Telemetry & Responsible Use Tracking

- [ ] **Guide Telemetry:** Pastikan `useGuide` dan `useTelemetry` mengirim payload yang selaras dengan model backend `GuideOpenEvent` (`routers/telemetry.py`) dan dipakai di event utama (buka guide, lihat report, dsb.).
- [ ] **Page View Tracking:** Implementasikan `trackPageView` untuk halaman kunci (AssessmentStart, Report, Mediator Dashboard) sesuai prinsip `educator_responsible_use`.
- [ ] **Privacy & Consent:** Tambahkan UI minimal (checkbox/notice atau banner) untuk memberi informasi tentang telemetry yang dikirim, dengan referensi ke `guides/educator_responsible_use.*`.
- [ ] **Telemetry Schema Alignment:** Selaraskan tipe `GuideOpenEvent` di front-end (`useTelemetry`, `telemetryService`) dengan model backend (`guide_id`, `language`, `surface`), dan tambahkan test yang memastikan permintaan standar tidak menghasilkan 4xx.
- [ ] **Opt-In Telemetry Toggle:** Tambah preferensi di `UIPreferencesContext` untuk telemetry (opt-in/opt-out) dan hormati preferensi ini di seluruh pemanggilan `useTelemetry`, selaras dengan pedoman etika penelitian pendidikan.
- [ ] **Anonymization & Aggregation Guarantees:** Dokumentasikan secara eksplisit di API docs & UI bahwa telemetry tidak menyimpan data identitas sensitif per event, hanya agregat; tambahkan test untuk memastikan router telemetry tidak menulis entitas user-spesifik ke DB.

## E. Accessibility, Motion & Transparency Cross-Cutting

- [x] **Reduce Motion (Guidelines §2.5):** Audit semua komponen yang memakai spring/motion (`PrimaryButton`, `BottomToolbar`, `LayeredIcon`, `MorphingIcon`, `NotificationBadge`, `Spinner`, transisi halaman) agar membaca preferensi dari `useReduceMotion` + `UIPreferencesContext` dan selalu menyediakan fallback cross-fade/slide sederhana ketika reduce motion aktif; tambah test snapshot untuk kedua mode.
- [ ] **Reduce Transparency Fallback (Guidelines §8.5.3):** Pastikan semua glass components (`GlassPanel`, `TintedGlassButton`, `ModalLayer`, navigation bars) mengikuti pola `GlassPanel` saat preferensi reduce transparency aktif: `backdrop-filter: none`, mengganti blur dengan `bg-background border-border` opaque, dan lulus seluruh skenario di `frontend/src/tests/accessibility/reduceTransparency.test.tsx`.
- [ ] **Dynamic Type & Contrast (Guidelines §1.4.3, §3.4):** Integrasikan utilitas aksesibilitas (dynamic text size & contrast checks) pada header/section penting (Assessment pages, Report, Dashboards) dan uji bahwa pada ukuran teks terbesar tidak ada teks yang clipping atau overlap, serta warna foreground/background memenuhi rasio kontras 4.5:1 (teks normal) dan 3:1 (teks besar).
- [ ] **Glass Hierarchy & Anti-Patterns (Guidelines §4.2–4.3, §8.5.1–8.5.2):** Audit pemakaian `GlassPanel` dan material lain untuk memastikan glass hanya digunakan di lapisan fungsional (nav bar, toolbar, modal/sheet), bukan sebagai background area konten; hindari glass-on-glass (popover di atas sidebar glass, sheet di atas tabbar glass), dan pastikan varian `clear` selalu digabung dengan `withDimming` sehingga teks di atasnya tetap memenuhi kontras WCAG.
- [ ] **Keyboard-Only & Screen Reader Audit:** Tambah test aksesibilitas untuk halaman Assessment, Report, TeamDetail, ResearchDetail yang memverifikasi jalur fokus keyboard, `aria-label`/`aria-describedby` kritis, dan bahwa `NonDiagnosticNotice` dibaca secara berurutan oleh screen reader sebelum grafik atau panel analitik.

## F. Teams & Research: Data Flow & Visualization

- [ ] **Team Rollup Consistency (Guidelines §1.2, §3.4):** Sinkronkan schema `TeamRollupDataPoint` dan backend aggregator untuk `TeamRollupChart` (ACCE/AERO, style labels, colors), termasuk perbedaan endpoint `GET /teams/{id}/rollup` (frontend) vs `/teams/{id}/rollups` + `/teams/{id}/rollup/run` (backend), dan pastikan visualisasi tetap terbaca di berbagai ukuran layar serta memenuhi rasio kontras WCAG.
- [ ] **Research Data Export:** Pastikan `ResearchDetailPage` CSV export menggunakan endpoint backend `GET /research/studies/*` yang sama dengan tampilan tabel, dengan field names yang konsisten dengan dokumen penelitian dan `schemas/research.py`.
- [ ] **Legacy Member Handling:** Implementasikan dan uji `TeamRollupLegacyMember` kasus (anggota tanpa data lengkap, sesi lama) dalam grafik dan tabel, selaras dengan bentuk payload yang dikembalikan `TeamRollupRepository`.
- [ ] **Rollup Endpoint Harmonization:** Putuskan satu kontrak stabil untuk team rollup (mis. `GET /teams/{id}/rollup` yang mengembalikan `TeamRollupOut`) dan tambahkan adapter di backend atau frontend agar payload konsisten; tambahkan contract test untuk payload tersebut.
- [ ] **Research Data Dictionary Sync:** Sinkronkan export CSV di `ResearchDetailPage` dengan skema `ResearchStudy`/`Reliability`/`Validity` (nama kolom, tipe) dan dokumentasikan data dictionary di `docs/`.
- [ ] **Team Diversity Metrics Validation:** Tambah test yang memverifikasi bahwa `diversity_score` dan `balance_metrics` untuk team tidak pernah diinterpretasikan sebagai “baik/buruk” secara normatif di UI; gunakan label netral sesuai literatur ELT.

## G. Testing & CI Full Stack

- [ ] **Integration Tests Frontend:** Lengkapi dan stabilkan `AssessmentFlow.test.tsx`, `ReportPage.test.tsx`, `TeamDetailPage.test.tsx` agar memotret alur aktual terhadap mock API yang merefleksikan backend (session → report → teams flow).
- [ ] **Backend–Frontend Contract Tests:** Tambah kontrak minimal (snapshot atau schema check) untuk respons endpoints yang dipakai front-end (auth, sessions, reports, teams, research, telemetry) dan sinkron dengan tipe di `frontend/src/types/api.ts`.
- [ ] **CI Pipeline:** Pastikan langkah `pytest` backend dan `pnpm test` frontend berjalan di pipeline yang sama dan gagal jika ada kontrak yang berubah tanpa update di sisi lain.
- [ ] **Golden Path E2E Scenario:** Tambah satu skenario E2E terintegrasi yang mencakup: register → login → start session → melengkapi assessment → finalize → melihat report → join team → muncul di TeamRollupChart, dan verifikasi bahwa semua langkah menampilkan `NonDiagnosticNotice` dan mengikuti rules akses.
- [ ] **Dashboard Color & Contrast Audit (Guidelines §1.2, §3.4):** Tambah test visual/manual untuk `DashboardLayout`, `MediatorDashboardPage`, dan `ResearchDashboardPage` yang memverifikasi bahwa penggunaan warna (primary, secondary, accent) dan background memenuhi rasio kontras minimal 4.5:1 dan tetap terbaca di berbagai ukuran layar serta mode reduce transparency.
- [ ] **Contract Linting Script:** Tambah skrip kecil di CI yang membandingkan definisi tipe di `frontend/src/types/api.ts` dengan skema Pydantic/OpenAPI untuk endpoints utama; fail bila ada drift.
- [ ] **Performance Baseline for Key Flows:** Tambah benchmark ringan (mis. dengan Playwright/Lighthouse terpisah) untuk mengukur waktu muat AssessmentStartPage dan ReportPage pada koneksi lambat, memastikan Query caching & polling tidak menyebabkan N+1 call atau blocking.

---

Ini adalah backlog full stack (backend ↔ frontend). Setiap poin sebaiknya dibuatkan ticket/issue terpisah dengan detail lebih lanjut dan dikaitkan dengan referensi dokumen di `docs/` dan/atau `tests/` yang relevan.
