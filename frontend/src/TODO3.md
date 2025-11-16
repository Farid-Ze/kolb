# TODO.md (Phase 2: High-Fidelity & Fluidic Polish)

Daftar tugas ini berfokus pada refactor, implementasi, dan pemanfaatan React Query untuk mengimplementasikan 100% visi `Guidelines.md` di atas fondasi yang ada.

## Phase 1: Refactor Fondasi & Design Tokens (12 Tugas)

Mencabut fondasi CSS statis dan menggantinya dengan *design tokens* "Liquid Glass".

* [x] **Implementasi**: `src/tailwind.config.js` - Konfigurasikan *spacing tokens* (cth: `spacing.2`, `spacing.4`) agar 100% mematuhi **Grid Ritmis 8-point** (kelipatan 4 & 8 poin) untuk *margin*, *padding*, dan *gap*.
* [x] **Implementasi**: `src/config/theme.ts` - Definisikan *design tokens* untuk **Material Kaca Fluidik** (`glass-regular`, `glass-clear`) dan **Material Standar** (`content-regular`, `content-thick`).
* [x] **Refactor**: `src/styles/globals.css` - Ganti *font* standar dengan *font* yang mendukung **Skala Teks Dinamis** (`rem` dan `clamp()`).
* [x] **Refactor**: `src/tailwind.config.js` - Definisikan *color tokens* untuk **Warna Sistem** (cth: `label`, `secondaryLabel`, `separator`, `systemBackground`) untuk mode Terang dan Gelap.
* [x] **Refactor**: `src/tailwind.config.js` - Definisikan *color tokens* untuk **Warna Semantik** (`error`, `success`, `warning`) beserta varian *high-contrast*.
* [x] **Refactor**: `src/tailwind.config.js` - Pastikan hanya ada satu **Warna Aksen** (cth: `primary`) yang didefinisikan untuk semua elemen interaktif.
* [x] **Implementasi**: `src/lib/motion.ts` - Buat konstanta `springTransition` (cth: `{ type: "spring", stiffness: 300, damping: 20 }`) untuk `framer-motion`, menggantikan kurva Bézier.
* [x] **Implementasi**: `src/hooks/useReduceMotion.ts` - Buat hook `useReduceMotion()` yang mendeteksi `(prefers-reduced-motion: reduce)`.
* [x] **Implementasi**: `src/hooks/useReduceTransparency.ts` - Buat hook `useReduceTransparency()` yang mendeteksi `(prefers-reduced-transparency: reduce)`.
* [x] **Refactor**: `src/contexts/UIPreferencesContext.tsx` - Integrasikan `useReduceMotion` dan `useReduceTransparency` ke dalam provider global.
* [x] **Implementasi**: `src/lib/accessibility.ts` - Buat fungsi utilitas `getDynamicTextSize(baseRem, scaleFactor)` untuk mendukung Dynamic Type.
* [x] **Refactor**: `src/index.css` - Terapkan *font smoothing* (`-webkit-font-smoothing: antialiased;`) untuk rendering teks yang lebih halus.

---

## Phase 2: Refactor Komponen UI (Material & Fisika) (25 Tugas)

Mengganti implementasi `shadcn/ui` statis dengan komponen *fluid* yang mematuhi `Guidelines.md`.

* [x] **Refactor**: `src/components/ui/GlassPanel.tsx` (Baru) - Gantikan `src/components/ui/card.tsx` dengan komponen `GlassPanel` baru sebagai *primitive* utama.
* [x] **Implementasi**: `src/components/ui/GlassPanel.tsx` - Implementasikan *props* `material="functional"` (Kaca Fluidik, `§4.2`) dan `material="content"` (Material Standar, `§4.3`).
* [x] **Refactor**: `src/components/ui/GlassPanel.tsx` - Terapkan *fallback* `useReduceTransparency()`: jika `true`, ganti `backdrop-blur` dengan *fill* buram (opaque).
* [x] **Implementasi**: `src/hooks/useVibrancy.ts` - Buat hook yang secara dinamis menghitung warna teks (Primer/Sekunder) yang menjamin kontras 4.5:1 terhadap *background* dinamis di belakang *glass*.
* [x] **Implementasi**: `src/components/ui/VibrantText.tsx` - Buat komponen teks yang menggunakan `useVibrancy` untuk menerapkan warna teks yang *vibrant* secara otomatis saat berada di atas `GlassPanel`.
* [x] **Refactor**: Ganti semua `className="text-foreground"` di atas `GlassPanel` dengan komponen `VibrantText` baru. (Completed: LargeTitleHeader, GuideModal, AppShell, Spinner)
* [x] **Refactor**: `src/components/ui/button.tsx` - Ganti CSS `transition` dengan `framer-motion` dan `springTransition`.
* [x] **Refactor**: `src/components/ui/button.tsx` - Terapkan *motion* **Flexing (Melentur)**: `whileTap={{ scale: 0.95, filter: "brightness(1.1)" }}` untuk umpan balik instan <100ms.
* [x] **Refactor**: `src/components/ui/dialog.tsx` - Ganti `DialogContent` agar menggunakan `GlassPanel` dan animasi *spring* (bukan CSS keyframes) untuk muncul/hilang.
* [x] **Refactor**: `src/components/ui/sheet.tsx` - Ganti `SheetContent` agar menggunakan `GlassPanel` dan `framer-motion` untuk *slide* dari bawah dengan *spring physics*.
* [x] **Refactor**: `src/components/ui/popover.tsx` - Ganti `PopoverContent` agar menggunakan `GlassPanel` dan animasi *scale/fade* berbasis *spring*.
* [x] **Refactor**: `src/components/ui/accordion.tsx` - Ganti transisi `height` CSS dengan `framer-motion` (`AnimatePresence` + `initial/animate/exit`) agar *interruptible*.
* [x] **Refactor**: `src/components/ui/tooltip.tsx` - Ganti animasi CSS dengan *spring* untuk *fade-in*.
* [x] **Refactor**: `src/components/ui/switch.tsx` - Ganti transisi CSS dengan *spring* untuk *knob* dan perubahan warna.
* [x] **Refactor**: `src/components/ui/tabs.tsx` - Animasikan *indicator* aktif menggunakan `framer-motion` (`layoutId`) agar terasa *fluid* saat berpindah tab.
* [x] **Implementasi**: `src/components/ui/MorphingIcon.tsx` - Buat komponen ikon yang dapat berubah bentuk (morph) antar 2 *SVG path* (cth: `Move` ke `Check`) menggunakan `framer-motion`.
* [x] **Refactor**: `src/pages/AssessmentPage.tsx` - Ganti ikon tombol *drag mode* dengan `<MorphingIcon.tsx />`.
* [x] **Refactor**: `src/components/common/SkeletonLoader.tsx` - Gantikan `skeleton.tsx` (`shadcn`) dengan implementasi *shimmer/pulse* yang lebih halus (per `Guidelines.md §2.4.2`).
* [x] **Refactor**: `src/components/ui/alert.tsx` - Terapkan **Warna Semantik** (`error`, `success`, `warning`) dan pastikan *selalu* ada ikon (indikator non-warna).
* [x] **Refactor**: `src/components/ui/input.tsx` - Terapkan *state* `error` menggunakan *border* Warna Semantik dan ikon.
* [x] **Implementasi**: `src/components/ui/NotificationBadge.tsx` - Buat *badge* yang muncul dengan *bounce* kecil (`§2.2.3`) atau "berdenyut" (`§2.2.2`).
* [x] **Implementasi**: `src/components/ui/TintedGlassPanel.tsx` - Buat varian `GlassPanel` yang menerima `tintColor` untuk *tinting volumetrik*.
* [x] **Implementasi**: `src/hooks/useWindowFocus.ts` - (Baru) Buat hook untuk mendeteksi fokus jendela.
* [x] **Refactor**: `src/components/ui/GlassPanel.tsx` - Gunakan `useWindowFocus` untuk mengurangi saturasi/vibrancy saat jendela tidak aktif (khusus Desktop).
* [x] **Implementasi**: `src/components/dev/GPUProfiler.tsx` - (Tugas Baru) Buat komponen *dev-only* untuk memantau *shader load* dan *frame drop* saat menguji material Kaca.

---

## Phase 3: Tata Letak (Layout), Ergonomi & Aksesibilitas (20 Tugas)

Memastikan *shell* aplikasi mematuhi ergonomi dan aksesibilitas tata letak.

* [x] **Refactor**: `src/styles/globals.css` - Terapkan `padding` global menggunakan `env(safe-area-inset-*)` pada `body` untuk menghormati **Area Aman (Safe Area)**.
* [x] **Refactor**: `src/components/ui/BottomToolbar.tsx` - Pastikan komponen ini *selalu* menggunakan `padding-bottom: env(safe-area-inset-bottom)`.
* [x] **Refactor**: `src/pages/AssessmentPage.tsx` - Pastikan `BottomToolbar` (navigasi) menempati **Zona Hijau Ergonomis** (selalu terlihat di bawah pada seluler).
* [x] **Implementasi**: `src/hooks/useBreakpoint.ts` - Buat hook `useBreakpoint()` (cth: `isMobile`, `isTablet`) berdasarkan *breakpoint* logis (bukan perangkat).
* [x] **Refactor**: `src/components/layout/AppShell.tsx` - Gunakan `useBreakpoint` untuk beralih dari *stacked layout* (seluler) ke *split-view/sidebar* (desktop).
* [x] **Audit**: Lakukan audit *codebase* untuk menghapus *lebar/tinggi/margin* *hard-coded* (cth: `width: 300px`) dan ganti dengan unit relatif (`%`, `rem`) atau *spacing tokens*.
* [x] **Implementasi**: `src/components/ui/DynamicType.tsx` - Buat komponen wrapper yang menerapkan *Dynamic Type* (skala font aksesibilitas).
* [x] **Refactor**: Ganti semua elemen teks (`<p>`, `<h1>`) dengan `<DynamicType as=\"p\">` untuk memastikan teks merespons pengaturan aksesibilitas sistem.
* [x] **Audit**: Tinjau `ReportPage.tsx` dan `GuideModal.tsx`. Pastikan *panjang baris* (measure) teks paragraf dibatasi (cth: `max-w-prose`) antara 45-75 karakter.
* [x] **Audit**: Tinjau `ReportPage.tsx` dan `GuideModal.tsx`. Pastikan semua blok teks panjang menggunakan `text-left`, bukan `text-center`.
* [x] **Refactor**: `src/pages/HomePage.tsx` - Terapkan prinsip Gestalt **Proximity** (Kedekatan); audit jarak antar elemen.
* [x] **Refactor**: `src/components/report/ScoreDisplay.tsx` - Ganti `Separator` (`shadcn`) dengan *negative space* (spasi) yang lebih lega jika memungkinkan (per `Guidelines.md §1.5`).
* [x] **Implementasi**: `src/components/ui/Sheet.tsx` - Pastikan tombol aksi primer (Simpan, Kirim) pada *sheet* seluler berada di **Zona Hijau** (bawah).
* [x] **Implementasi**: `src/components/ui/ScrollEdgeHandler.tsx` - Buat komponen yang mendeteksi `scrollTop` dari *scroll view*.
* [x] **Refactor**: `src/components/layout/LargeTitleHeader.tsx` - Gunakan `ScrollEdgeHandler` untuk menerapkan material Kaca Fluidik (blur) secara dinamis saat konten di-scroll di bawahnya.
* [x] **Refactor**: `src/pages/ReportPage.tsx` - Tinjau ulang *padding* dan *tinggi baris* (whitespace) agar lebih lega, sesuai `Guidelines.md §8.4.1`.
* [x] **Implementasi**: `src/components/ui/SectionHeader.tsx` (Baru) - Buat komponen header untuk *list*.
* [x] **Refactor**: `src/components/ui/SectionHeader.tsx` - Pastikan teks menggunakan **Title-Style Capitalization** (Huruf Besar di Awal Kata), bukan ALL-CAPS.
* [x] **Audit**: (Kritis) Audit `src/components/ui/BottomToolbar.tsx` dan `src/components/layout/AppShell.tsx`. Hapus semua *background* kustom (warna solid/gradien) yang menimpa Kaca Fluidik.
* [x] **Audit**: Cari penggunaan *metrik hard-coded* (cth: `height: 60px`) pada *bar* navigasi dan hapus agar sesuai dengan metrik sistem.

---

## Phase 4: State Management (SSOT) & React 19 Polish (15 Tugas)

Memastikan arsitektur state 100% deklaratif, mematuhi `Guidelines.md §5 & §6`, dan memanfaatkan React 19.

* [ ] **React Query**: `src/hooks/useAssessment.ts` - Refactor `setRank` untuk menggunakan `useOptimistic` (React 19) guna memberikan umpan balik instan (<100ms) sebelum *mutation* autosave selesai.
* [x] **React Query**: `src/hooks/useOptimisticSubmit.ts` (Baru) - Buat hook optimistic UI untuk *form submission* (Note: React 19 belum tersedia, gunakan pendekatan standar).
* [x] **Refactor**: `src/contexts/AuthContext.tsx` - Sudah menggunakan `useContext` (React 19 `use()` belum tersedia).
* [x] **Refactor**: `src/contexts/UIPreferencesContext.tsx` - Sudah menggunakan `useContext` (React 19 belum tersedia).
* [x] **Audit**: Tinjau `src/pages/AssessmentPage.tsx`. Pastikan *view* 100% **Deklaratif** (`UI = f(State)`)—hanya me-render `currentItem` dari `useAssessment`.
* [x] **Audit**: Tinjau `src/components/assessment/RankingItem.tsx`. Pastikan komponen ini mematuhi **Data Down, Events Up** (menerima `rank` via *props*, mengirim `onRankChange` via *callback*).
* [x] **Audit**: Tinjau *tree* komponen. Pastikan `src/App.tsx` menggunakan **Komposisi di atas Pewarisan (Composition over Inheritance)**. (Sudah baik, hindari `BasePage` dll).
* [x] **React Query**: `src/hooks/useReport.ts` (Baru) - Ekstrak logika *polling* `useQuery` dari `src/pages/ReportPage.tsx` ke dalam hook *reusable* ini, menjadikannya **SSOT** untuk data laporan.
* [x] **React Query**: `src/pages/ReportPage.tsx` - Refactor untuk menggunakan `useReport(sessionId)` yang baru.
* [ ] **React Query**: `src/hooks/useGuide.ts` - Selesaikan `useQuery` untuk `GET /static/guides/...`.
* [ ] **React Query**: `src/hooks/useTelemetry.ts` - Selesaikan `useMutation` untuk `POST /telemetry/guide-open`.
* [ ] **Implementasi**: `src/hooks/useAssessment.ts` - Implementasikan *state machine* (cth: `xstate` atau `zod`) untuk mengelola *state* internal hook (cth: `idle`, `loading`, `saving`, `complete`) (per `Guidelines.md §6.2`).
* [ ] **Implementasi**: `src/hooks/useAuth.ts` - (Baru) Buat hook `useAuth` yang mengekspos `user` dan `role`.
* [ ] **Refactor**: `src/components/auth/ProtectedRoute.tsx` - Gunakan `useAuth` untuk memeriksa `role` (cth: `requiredRole="MEDIATOR"`).
* [ ] **React Query**: `src/hooks/useAssessment.ts` - Pastikan `queryKey: ['assessment-items', sessionId]` memiliki `staleTime: Infinity` karena data item sesi tidak berubah (per `useAssessment.ts`).

---

## Phase 5: Ikonografi Berlapis & Adopsi (10 Tugas)

Mengganti ikonografi statis dengan aset berlapis yang dinamis.

* [x] **Implementasi**: `src/components/ui/LayeredIcon.tsx` - Buat komponen ikon yang merender 3 lapisan (latar belakang, tengah, latar depan) dari *props* SVG.
* [x] **Implementasi**: `src/components/ui/LayeredIcon.tsx` - Terapkan efek *parallax* ringan pada lapisan-lapisan (menggunakan `framer-motion` `useMotionValue`) sebagai respons terhadap gerakan mouse untuk simulasi *lighting*.
* [x] **Refactor**: Ganti semua ikon di `src/pages/HomePage.tsx` (kartu menu) dengan `<LayeredIcon.tsx />` baru.
* [x] **Refactor**: Ganti ikon di `src/pages/ReportPage.tsx` (cth: ikon Tipe Gaya Belajar) dengan `<LayeredIcon.tsx />`.
* [x] **Implementasi**: `src/components/common/GuideModal.tsx` - Buat modal *glass* yang me-render konten Markdown dari `useGuide`.
* [x] **Refactor**: Hubungkan tombol *Help* di `AssessmentPage.tsx` (`HelpCircle`) ke `GuideModal`, memuat `GUIDE_IDS.ASSESSMENT_INSTRUCTIONS`.
* [x] **Refactor**: Hubungkan tombol *Help* di `ReportPage.tsx` ke `GuideModal`, memuat `GUIDE_IDS.RESULTS_INTERPRETATION`.
* [ ] **Refactor**: Hubungkan *onboarding panel* di `MediatorDashboardPage.tsx` ke `GuideModal`, memuat `GUIDE_IDS.EDUCATOR_RESPONSIBLE_USE`.

---

## Phase 6: High-Fidelity Report & Analytics (20 Tugas)

Memastikan `ReportPage.tsx` menyajikan *semua data* dari `app/services/report.py` (termasuk `enhanced_analytics`) menggunakan *Liquid Glass*.

* [ ] **Implementasi**: `src/components/report/LearningStyleChart.tsx` - Pastikan visualisasi 4-kuadran menggunakan *GlassPanel* dan *spring physics* untuk animasi *reveal*.
* [ ] **Implementasi**: `src/components/report/FlexibilityChart.tsx` - Pastikan *gauge* LFI menggunakan animasi *spring* untuk jarumnya.
* [ ] **Implementasi**: `src/components/report/ScoreDisplay.tsx` - Terapkan *layout* yang lega (whitespace) dan tipografi hierarkis (Primer/Sekunder).
* [ ] **Implementasi**: `src/components/report/BalanceScoresCard.tsx` (Baru) - Buat komponen ini.
* [ ] **Refactor**: `src/components/report/BalanceScoresCard.tsx` - Pastikan `BalanceDisclaimer` ("heuristic, non-normative") *selalu* ditampilkan.
* [ ] **Implementasi**: `src/components/report/ProvenancePanel.tsx` (Baru) - Buat komponen *collapsible* (`Accordion`) untuk menampilkan `norm_group.norm_name` dan `percentile_scores.source_provenance`.
* [ ] **Refactor**: `src/pages/ReportPage.tsx` - Tambahkan `ProvenancePanel` ke halaman laporan.
* [ ] **Implementasi**: `src/components/report/DeltaChangesCard.tsx` - (Jika `report.delta` ada) Tampilkan visualisasi perubahan skor ACCE/AERO/LFI.
* [ ] **Implementasi**: `src/components/report/EnhancedAnalyticsPanel.tsx` (Baru) - Buat komponen *wrapper* (mungkin `Tabs`) *hanya* untuk Mediator.
* [ ] **Refactor**: `src/pages/ReportPage.tsx` - Render `<EnhancedAnalyticsPanel />` jika `report.enhanced_analytics` ada (hanya untuk Mediator).
* [ ] **Implementasi**: `src/components/report/analytics/ContextualProfile.tsx` (Baru) - Visualisasikan `enhanced_analytics.contextual_profile` (gaya belajar per konteks) (per `report.py`).
* [ ] **Implementasi**: `src/components/report/analytics/FlexibilityHeatmap.tsx` (Baru) - Implementasikan *heatmap* 9-kotak (per `frontend_blueprint.md`) berdasarkan `enhanced_analytics.heatmap` (per `report.py`).
* [ ] **Implementasi**: `src/components/report/analytics/IntegrativeDev.tsx` (Baru) - Tampilkan `enhanced_analytics.integrative_development` (Fase Acquisition/Specialization/Integration).
* [ ] **Implementasi**: `src/components/report/analytics/FlexibilityNarrative.tsx` (Baru) - Tampilkan `enhanced_analytics.flexibility_narrative` (narasi "Mark vs Jason", hlm. 85-88 PDF).
* [ ] **Implementasi**: `src/components/report/analytics/EducatorRoles.tsx` (Baru) - Tampilkan `enhanced_analytics.educator_role_suggestions` (Facilitator, Expert, Evaluator, Coach).
* [ ] **Implementasi**: `src/components/report/ActionPlan.tsx` (Baru) - Tampilkan `report.learning_space.meta_learning` dan `report.session_designs` (rekomendasi aktivitas).
* [ ] **Refactor**: `src/pages/ReportPage.tsx` - Tambahkan `ActionPlan.tsx` ke laporan.
* [ ] **Audit**: `src/pages/ReportPage.tsx` - Uji skenario **Varian Clear Glass** (`§4.2.5`): jika laporan dibuka di atas *background* yang ramai (cth: gambar), pastikan lapisan *dimming* (`§8.5.2`) ada di *header*.
* [ ] **Audit**: `src/pages/ReportPage.tsx` - Pastikan *font* di-render dengan `VibrantText` dan kontrasnya 100% lolos WCAG di atas *glass*.
* [ ] **React Query**: `src/pages/MyReportsPage.tsx` - Gunakan `useQuery` untuk `GET /reports/self`. Tampilkan daftar laporan menggunakan `AnimatedListItem` dan `GlassPanel` (per `§2.2.3`).

---

## Phase 7: Alur Kerja Iterasi & Storybook (12 Tugas)

Membangun lingkungan *prototyping* (per `Guidelines.md §7`) untuk iterasi desain *real-time* dan pengujian visual.

* [ ] **Implementasi**: `src/stories/Materials.stories.tsx` - Buat *story* untuk `GlassPanel` dengan *controls* untuk `material`, `density`, `emphasis`, dan `tintColor`.
* [ ] **Implementasi**: `src/stories/Vibrancy.stories.tsx` - Buat *story* yang menempatkan `VibrantText` di atas `GlassPanel` dengan *background* gambar yang "ramai" untuk menguji *vibrancy*.
* [ ] **Implementasi**: `src/stories/Motion.stories.tsx` - Buat *story* untuk mendemonstrasikan *Flexing* (Button `whileTap`), *Morphing* (`MorphingIcon`), dan *Fusing* (PoC).
* [ ] **Implementasi**: `src/stories/Layout.stories.tsx` - Buat *story* yang mensimulasikan *Form Factor* (Seluler, Tablet, Desktop) untuk `AppShell`.
* [ ] **Implementasi**: `src/stories/Layout.stories.tsx` - Buat *story* yang mensimulasikan *Safe Area* (iPhone notch/pill) pada `BottomToolbar`.
* [ ] **Implementasi**: `src/stories/Accessibility.stories.tsx` - Buat *story* dengan *toolbar* global untuk *force-enable* `prefers-reduced-motion` (semua animasi harus *cross-fade*).
* [ ] **Implementasi**: `src/stories/Accessibility.stories.tsx` - Buat *story* dengan *toolbar* global untuk *force-enable* `prefers-reduced-transparency` (semua *glass* harus *opaque*).
* [ ] **Implementasi**: `src/stories/Accessibility.stories.tsx` - Buat *story* untuk menguji *Dynamic Type (XXXL+)* pada `ReportPage.tsx` (tidak boleh ada *clipping*).
* [ ] **Implementasi**: `src/stories/Interactions.stories.tsx` - Buat *story* untuk *Scroll-Edge Interaction* pada `LargeTitleHeader`.
* [ ] **Implementasi**: `src/stories/AntiPatterns.stories.tsx` - Buat *story* yang mendemonstrasikan *anti-pola* **Glass-on-Glass** (cth: `Popover` di atas `BottomToolbar`).
* [ ] **Implementasi**: `src/stories/AntiPatterns.stories.tsx` - Buat *story* *anti-pola* **Clear Glass tanpa Dimming** di atas video/gambar.
* [ ] **Implementasi**: `src/stories/Report.stories.tsx` - Buat *story* untuk `EnhancedAnalyticsPanel` dengan data *mock* untuk menguji *layout* analitik mediator.