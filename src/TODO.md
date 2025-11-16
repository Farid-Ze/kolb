# KLSI 4.0 TODO

Daftar tugas ini mencakup implementasi, refactor, dan integrasi React Query untuk frontend dan backend KLSI 4.0, dengan kepatuhan penuh pada `Guidelines.md` (Liquid Glass), `frontend_blueprint.md`, dan `psychometrics_spec.md`.

## Phase 1: Backend Core & Validasi Psikometrik (10 Tugas)

Tugas-tugas ini memastikan logika inti di backend Python secara akurat mencerminkan panduan psikometrik KLSI 4.0.

* [ ] **Refactor**: `app/services/scoring.py` - Verifikasi `compute_raw_scale_scores` menjumlahkan rank 1-4 dengan benar (total 120 untuk 12 item), sesuai `psychometrics_spec.md §1`.
* [ ] **Refactor**: `app/services/scoring.py` - Verifikasi `compute_combination_scores` menghitung `ACCE = AC_raw - CE_raw` dan `AERO = AE_raw - RO_raw` (hlm. 45-46 PDF).
* [ ] **Implementasi**: `app/services/scoring.py` - Implementasikan `compute_combination_scores` untuk `BAL_ACCE` dan `BAL_AERO` menggunakan median normatif 9 dan 6, sesuai `psychometrics_spec.md §2.1` (hlm. 48 PDF).
* [ ] **Refactor**: `app/assessments/klsi_v4/logic.py` - Konfirmasi `assign_learning_style` menggunakan *cutpoints* yang benar untuk 9-style grid (ACCE ≤5, 6-14, ≥15; AERO ≤0, 1-11, ≥12) sesuai `psychometrics_spec.md §3` (hlm. 50 PDF).
* [ ] **Implementasi**: `app/assessments/klsi_v4/logic.py` - Implementasikan logika penentuan `backup_learning_styles` berdasarkan 8 konteks LFI (hlm. 84-88 PDF) dan simpan ke `backup_learning_styles` (per `psychometrics_spec.md §3`).
* [ ] **Refactor**: `app/services/scoring.py` - Pastikan `compute_lfi` (Kendall's W) diimplementasikan sebagai `LFI = 1 - W` (hlm. 77 PDF).
* [ ] **Refactor**: `app/services/scoring.py` - Pastikan strategi `apply_percentiles` menggunakan fallback "nearest-lower" (konservatif) jika data norma tidak ada, sesuai `psychometrics_spec.md §5`.
* [ ] **Implementasi**: `app/services/report.py` - Implementasikan `_classify_development` (Acquisition, Specialization, Integration) berdasarkan `intensity` dan `lfi` (hlm. 24-26 PDF).
* [ ] **Implementasi**: `app/services/report.py` - Implementasikan `_derive_meta_learning` untuk memberikan tips berdasarkan mode skor mentah terendah (CE/RO/AC/AE) (hlm. 32-33 PDF).
* [ ] **Refactor**: `app/main.py` - Konfigurasi `StaticFiles` untuk `/static/guides` agar dapat menyajikan file markdown dari `docs/guides/` (untuk `frontend_blueprint.md §7.1`).

## Phase 2: Frontend Foundation & Design System "Liquid Glass" (18 Tugas)

Membangun UI primitives berdasarkan `Guidelines.md` dan `frontend_blueprint.md`.

* [x] **Implementasi**: `src/components/ui/GlassPanel.tsx` - Buat komponen "Liquid Glass" utama dengan `backdrop-blur` dan `border` (per `Guidelines.md §4.2`).
* [x] **Refactor**: `GlassPanel.tsx` - Tambahkan props `density` (compact/regular) dan `emphasis` (low/medium/high) yang mengontrol `background-opacity` dan `shadow` (per `frontend_blueprint.md §4.1`).
* [x] **Refactor**: `GlassPanel.tsx` - Implementasikan *fallback* aksesibilitas ke *solid color* saat `prefers-reduced-transparency: reduce` aktif (per `Guidelines.md §8.5.3`).
* [x] **Implementasi**: `src/components/layout/AppShell.tsx` - Buat layout global dengan background (gradient/parallax) dan area konten utama (per `frontend_blueprint.md §3.1`).
* [x] **Implementasi**: `src/components/ui/LargeTitleHeader.tsx` - Buat header yang *collapses* saat di-scroll (per `Guidelines.md §1.2.1`).
* [x] **Implementasi**: `src/components/ui/BottomToolbar.tsx` - Buat komponen glass bar *sticky* di bawah untuk navigasi mobile (`Guidelines.md §1.3.2 Zona Hijau`).
* [x] **Implementasi**: `src/components/ui/ModalLayer.tsx` - Buat root modal yang memberi efek *blur & dim* pada konten di belakangnya (`Guidelines.md §1.6`).
* [x] **Implementasi**: `src/config/theme.ts` - Definisikan *design tokens* (spacing, radius, blur, colors) yang konsisten dengan `Guidelines.md`.
* [x] **Refactor**: `src/App.tsx` - Pastikan `UIPreferencesProvider` membaca `prefers-reduced-motion` dan `prefers-reduced-transparency`.
* [x] **Refactor**: CSS/Styling - Pastikan semua animasi transisi menggunakan *physics-based springs* (cth: `framer-motion` `type: "spring"`) bukan *keyframe* `ease-in-out` (per `Guidelines.md §2.3.1`).
* [x] **Refactor**: Animations - Terapkan `prefers-reduced-motion` untuk mengganti animasi *spring* menjadi *cross-fade* sederhana (per `Guidelines.md §2.5.2`).
* [x] **Implementasi**: `src/components/layout/AuthLayout.tsx` dan `DashboardLayout.tsx` (per `frontend_blueprint.md §3.2`).
* [x] **Implementasi**: `src/components/layout/AssessmentLayout.tsx` dan `ReportsLayout.tsx` (per `frontend_blueprint.md §3.2`).
* [x] **Implementasi**: `src/components/layout/SplitViewLayout.tsx` (untuk Mediator) (per `frontend_blueprint.md §3.2`).
* [x] **Implementasi**: `src/components/ui/PrimaryButton.tsx` - Pastikan styling konsisten menggunakan *accent color* (per `Guidelines.md §3.4.1`).
* [x] **Implementasi**: `src/components/common/ErrorBoundary.tsx` - Sesuai `App.tsx`.
* [x] **Implementasi**: `src/components/common/LoadingComponent.tsx` - Gunakan *skeleton loader* dengan *shimmer/pulse* (per `Guidelines.md §2.4.2`).
* [x] **Implementasi**: `src/components/common/ThemeToggle.tsx` - Untuk beralih mode light/dark.

## Phase 3: Alur Autentikasi & Akun (9 Tugas)

Menghubungkan frontend React ke API otentikasi `app/routers/auth.py`.

* [ ] **Refactor**: `app/routers/auth.py` - Amankan endpoint `POST /auth/login` dan `POST /auth/register`.
* [x] **Refactor**: `src/types/api.d.ts` - Pastikan tipe `LoginResponse` dan `User` sesuai dengan respons backend.
* [x] **Implementasi**: `src/services/authService.ts` - Buat fungsi `login` dan `register` yang memanggil API.
* [x] **Implementasi**: `src/contexts/AuthContext.tsx` - Buat provider untuk menyimpan `user` dan `accessToken` (sesuai `frontend_blueprint.md §8`).
* [x] **Refactor**: `src/utils/apiHelper.ts` - Implementasikan *logic* di `authenticatedApiCall` untuk *auto-refresh token* jika API mengembalikan 401.
* [x] **Implementasi**: `src/hooks/useAuth.ts` - Buat hook `useAuth` untuk akses mudah ke konteks.
* [x] **Implementasi**: `src/components/auth/ProtectedRoute.tsx` - Implementasikan *redirect* ke `/auth/login` jika tidak ada token.
* [x] **React Query**: `src/pages/LoginPage.tsx` - Gunakan `useMutation` dari React Query untuk `authService.login`, kelola `isLoading` dan `error`.
* [x] **React Query**: `src/pages/RegisterPage.tsx` - Gunakan `useMutation` untuk `authService.register` dan tampilkan pesan consent (per `frontend_blueprint.md §2`).

## Phase 4: Alur Asesmen Siswa (Frontend) (20 Tugas)

Mengimplementasikan alur lengkap dari `HomePage` hingga `AssessmentReviewPage` menggunakan React Query.

* [x] **Implementasi**: `src/pages/HomePage.tsx` - Buat UI dashboard (`DashboardLayout`) dengan kartu `GlassPanelTile` untuk "Mulai Asesmen" dan "Laporan Saya".
* [x] **Implementasi**: `src/pages/AssessmentStartPage.tsx` - Tampilkan `NonDiagnosticNotice` dan ringkasan consent (per `frontend_blueprint.md §5.1`).
* [x] **Implementasi**: `src/services/assessmentService.ts` - Buat fungsi `startSession` (`POST /engine/sessions/start`).
* [x] **React Query**: `src/pages/AssessmentStartPage.tsx` - Gunakan `useMutation` untuk `startSession`, lalu navigasi ke `/assessment/:sessionId` (dari `StartSessionResponse`).
* [x] **Refactor**: `src/services/assessmentService.ts` - Pastikan `getAssessmentItems` (`GET /engine/sessions/:id/items`) diimplementasikan (sesuai `Task 25`).
* [x] **React Query**: `src/hooks/useAssessment.ts` - Terapkan `useQuery(['assessment-items', sessionId], getAssessmentItems)` (sesuai `Task 27`).
* [x] **Refactor**: `src/services/assessmentService.ts` - Pastikan `submitAnswers` (`POST /engine/sessions/:id/items`) diimplementasikan (sesuai `Task 29`).
* [x] **React Query**: `src/hooks/useAssessment.ts` - Terapkan `useMutation` (debounced autosave) untuk `submitAnswers` (sesuai `Task 30`).
* [x] **Refactor**: `src/hooks/useAssessment.ts` - Pastikan *timeout* autosave dibatalkan (`clearTimeout`) saat *unmount* (sesuai `useEffect` di `useAssessment.ts`).
* [x] **Implementasi**: `src/components/assessment/RankingItem.tsx` - Buat komponen *item* yang dapat di-rank (sesuai `Task 31`).
* [x] **Refactor**: `src/pages/AssessmentPage.tsx` - Implementasikan UI untuk *ranking berbasis tombol* (mode `!dragMode`) (sesuai `Task 31-32`).
* [x] **Refactor**: `src/pages/AssessmentPage.tsx` - Terapkan `DndContext` untuk *ranking drag-and-drop* (mode `dragMode`) (sesuai `Task 31`).
* [x] **Refactor**: `src/pages/AssessmentPage.tsx` - Hubungkan `BottomToolbar` (Tombol "Berikutnya" / "Sebelumnya") ke `useAssessment` (`nextItem`, `prevItem`).
* [x] **Implementasi**: `src/components/assessment/ProgressBar.tsx` - Buat komponen progress bar (sesuai `Task 31`).
* [x] **Implementasi**: `src/pages/AssessmentPage.tsx` - Implementasikan *dots* navigasi item dan hubungkan ke `goToItem`.
* [x] **Refactor**: `src/hooks/useAssessment.ts` - Sempurnakan logika `isCurrentItemComplete` (memastikan rank 1, 2, 3, dan 4 unik).
* [x] **Refactor**: `src/hooks/useAssessment.ts` - Sempurnakan logika `isComplete` (semua item terjawab).
* [x] **Refactor**: `src/pages/AssessmentPage.tsx` - Aktifkan tombol "Review & Selesai" hanya jika `isComplete` true.
* [x] **Implementasi**: `src/pages/AssessmentReviewPage.tsx` - Tampilkan ringkasan jawaban dan `NonDiagnosticNotice`.
* [x] **React Query**: `src/pages/AssessmentReviewPage.tsx` - Gunakan `useMutation` untuk `finalizeSession` (`POST /engine/sessions/:id/finalize`, `Task 33`) dan navigasi ke `/assessment/:sessionId/report`.

## Phase 5: Laporan Siswa (Frontend) (13 Tugas)

Memvisualisasikan data dari `app/services/report.py` di `ReportPage.tsx`, mematuhi `frontend_blueprint.md §6`.

* [x] **Refactor**: `src/services/reportService.ts` - Implementasikan `getReport` (`GET /reports/sessions/:id`) (sesuai `Task 37`).
* [x] **React Query**: `src/pages/ReportPage.tsx` - Terapkan `useQuery(['report', sessionId], getReport)` (sesuai `Task 38`).
* [x] **React Query**: `src/pages/ReportPage.tsx` - Terapkan *polling* (`refetchInterval`) jika `getReport` masih dalam status *processing* (sesuai `Task 39`).
* [x] **Implementasi**: `src/pages/ReportPage.tsx` - Tampilkan UI *Loading* (saat polling) dan *Error* (jika gagal) (sesuai `Task 39`).
* [x] **Implementasi**: `src/components/report/NonDiagnosticNotice.tsx` - Buat komponen banner "formatif, bukan seleksi" (sesuai `frontend_blueprint.md §4.2`).
* [x] **Implementasi**: `src/pages/ReportPage.tsx` - Tampilkan `NonDiagnosticNotice` di atas laporan (sesuai `Task 53`).
* [x] **Implementasi**: `src/components/report/LearningStyleChart.tsx` - Buat visualisasi 4-kuadran (ELT grid) (sesuai `Task 44-45`).
* [x] **Implementasi**: `src/components/report/FlexibilityChart.tsx` - Buat visualisasi LFI (skor 0-100 dan 3 kategori Low/Mod/High) (sesuai `Task 49` & `psychometrics_spec.md §4`).
* [x] **Implementasi**: `src/components/report/ScoreDisplay.tsx` - Buat tabel untuk *Raw Scores* (CE/RO/AC/AE) dan *Dialectic Scores* (ACCE/AERO) (sesuai `Task 47-48`).
* [x] **Implementasi**: `src/components/report/BalanceScoresCard.tsx` - Tampilkan `BAL_ACCE` & `BAL_AERO` (dari `psychometrics_spec.md §2.1`) dan sertakan `BalanceDisclaimer` (per `frontend_blueprint.md §4.2`).
* [x] **Implementasi**: `src/components/report/ProvenancePanel.tsx` - Tampilkan `norm_group.norm_name` dan `percentile_scores.source_provenance` (per `frontend_blueprint.md §4.2`).
* [x] **Refactor**: `src/pages/ReportPage.tsx` - Fungsikan tombol Cetak (`handlePrint`) (sesuai `Task 49`).
* [x] **Implementasi**: `src/pages/MyReportsPage.tsx` - Buat `useQuery` untuk `getSelfReports` (`GET /reports/self`) dan tampilkan daftar laporan.

## Phase 6: Alur Mediator & Analitik Tambahan (15 Tugas)

Mengimplementasikan fitur khusus untuk peran "MEDIATOR", termasuk analitik yang lebih mendalam di `app/services/report.py`.

* [ ] **Refactor**: `app/routers/reports.py` - Pastikan `get_report` mengecek `viewer.role == "MEDIATOR"` (sesuai `reports.py`).
* [ ] **Refactor**: `app/services/report.py` - Implementasikan *logic* untuk *hanya* menyertakan blok `enhanced_analytics` jika `viewer_role == "MEDIATOR"`.
* [ ] **Implementasi**: `app/services/report.py` - Implementasikan `_generate_flexibility_narrative` (analisis pola fleksibilitas "Mark vs Jason", hlm. 85-88 PDF) untuk `enhanced_analytics`.
* [ ] **Implementasi**: `app/services/report.py` - Implementasikan `_educator_role_suggestions` (Facilitator, Expert, Evaluator, Coach) untuk `enhanced_analytics` (hlm. 37-38 PDF).
* [ ] **Implementasi**: `app/services/report.py` - Implementasikan `predict_integrative_development` (regresi) untuk `enhanced_analytics` (hlm. 81 PDF).
* [x] **Refactor**: `src/components/auth/ProtectedRoute.tsx` - Tambahkan prop `requiredRole` untuk memvalidasi peran (STUDENT/MEDIATOR).
* [x] **Refactor**: `src/App.tsx` - Terapkan `requiredRole="MEDIATOR"` pada route `/teams` dan `/research`.
* [x] **Implementasi**: `src/pages/MediatorDashboardPage.tsx` - Gunakan `SplitViewLayout` dan tampilkan `GuideModal` (onboarding) dengan guide `educator_responsible_use` (per `frontend_blueprint.md §5.2`).
* [x] **Implementasi**: `src/services/teamService.ts` - Buat `getTeams` (`GET /teams`) dan `getTeamRollup` (`GET /teams/:id/rollup/run`).
* [x] **React Query**: `src/pages/MediatorDashboardPage.tsx` - Gunakan `useQuery(['teams'], getTeams)` untuk mengisi *sidebar* list.
* [x] **Implementasi**: `src/pages/TeamDetailPage.tsx` - Buat halaman detail tim.
* [x] **React Query**: `src/pages/TeamDetailPage.tsx` - Gunakan `useQuery(['teams', teamId, 'rollup'], getTeamRollup)`.
* [x] **Implementasi**: `src/components/teams/TeamRollupChart.tsx` - Buat komponen untuk memvisualisasikan distribusi gaya belajar tim (per `frontend_blueprint.md`).
* [x] **Refactor**: `src/types/api.d.ts` - Tambahkan `enhanced_analytics: EnhancedAnalytics | null` dan `delta: LongitudinalDelta | null` pada interface `Report` (mencerminkan logika `report.py`).
* [x] **Refactor**: `src/pages/ReportPage.tsx` - Tampilkan blok `enhanced_analytics` dan `delta` jika ada (untuk Mediator dan longitudinal tracking).

## Phase 7: Bantuan Kontekstual & Telemetri (5 Tugas)

Mengimplementasikan sistem bantuan *in-app* dan *telemetry* sesuai `frontend_blueprint.md §7`.

* [ ] **Implementasi**: `app/routers/telemetry.py` - Buat endpoint `POST /telemetry/guide-open` (per `frontend_blueprint.md §7.2`).
* [x] **Implementasi**: `src/services/telemetryService.ts` - Buat fungsi `trackGuideOpen`.
* [x] **React Query**: `src/hooks/useTelemetry.ts` - Buat hook `useTelemetry` dengan `useMutation` untuk `trackGuideOpen`.
* [x] **Implementasi**: `src/services/guideService.ts` - Buat `getGuideContent` (`GET /static/guides/:guideId.:locale.md`).
* [x] **React Query**: `src/hooks/useGuide.ts` - Buat `useQuery(['guide', guideId, locale], getGuideContent)` dengan *logic fallback* locale (per `frontend_blueprint.md §7.1`).
* [x] **Implementasi**: `src/components/common/GuideModal.tsx` - Buat modal untuk menampilkan guide markdown dengan telemetry tracking.

## Phase 8: Refactor Akhir & Longitudinal (10 Tugas)

Fokus pada optimalisasi backend, data longitudinal (lintas sesi), dan penyelesaian UI Riset.

* [ ] **Refactor**: `app/services/scoring.py` - Terapkan `CachedCompositeNormProvider` (seperti di docstring `apply_percentiles`) untuk memperbaiki *N+1 query* saat konversi persentil.
* [ ] **Refactor**: `app/engine/runtime.py` - Selesaikan `_write_audit_log` untuk `finalize_with_audit` guna memastikan `payload_hash` (SHA256) tersimpan di `AuditLog`.
* [ ] **Refactor**: `app/models/klsi/assessment.py` - Pastikan `AssessmentSessionDelta` (Tabel `assessment_session_deltas`) ada.
* [ ] **Implementasi**: `app/assessments/klsi_v4/logic.py` - Selesaikan `compute_longitudinal_delta` (per `klsi4.py`) untuk menghitung perubahan `delta_acce`, `delta_aero`, `delta_lfi` dari sesi sebelumnya.
* [l] **Refactor**: `app/services/report.py` - Masukkan data `delta` (jika ada) ke dalam payload `build_report`.
* [x] **Implementasi**: `src/components/report/DeltaChangesCard.tsx` - (Jika `report.delta` ada) Tampilkan visualisasi perubahan skor ACCE/AERO/LFI dari asesmen sebelumnya.
* [x] **Implementasi**: `src/pages/ResearchDashboardPage.tsx` - Buat UI untuk `GET /research/studies`.
* [x] **Implementasi**: `src/pages/ResearchDetailPage.tsx` - Buat UI untuk `GET /research/studies/:id`.
* [ ] **Implementasi**: `app/services/regression.py` - Implementasikan `analyze_lfi_contexts` untuk menghasilkan `style_frequency` dan `flexibility_pattern` (high/moderate/low) (per `report.py`).
* [ ] **Implementasi**: `app/services/regression.py` - Implementasikan `generate_lfi_heatmap` (per `report.py`) untuk analitik mediator.