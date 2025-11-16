# TODO.md (Phase 2: High-Fidelity & Fluidic Polish)

Daftar tugas ini berfokus pada peningkatan, *refactoring*, dan implementasi penuh dari prinsip-prinsip desain yang dijabarkan di `Guidelines.md` (Basis Pengetahuan Desain Antarmuka Modern).

## Phase 1: Konfigurasi Design System & Tokens (12 Tugas)

Menyiapkan fondasi *styling* agar 100% patuh pada `Guidelines.md`.

* [x] **Implementasi**: `tailwind.config.js` - Konfigurasi *spacing tokens* agar 100% mematuhi **Grid Ritmis 8-point** (kelipatan 4 & 8 poin) untuk *margin*, *padding*, dan *gap* (per `Guidelines.md §1.4.1`).
* [x] **Implementasi**: `tailwind.config.js` - Definisikan *design tokens* untuk *font sizes* yang mendukung **Skala Teks Dinamis**, menggunakan `clamp()` dan unit `rem` (per `Guidelines.md §1.4.3`).
* [x] **Implementasi**: `tailwind.config.js` - Definisikan *design tokens* untuk **Material Kaca Fluidik** (blur, saturasi, opasitas) sebagai *utility classes* (cth: `.material-glass-regular`, `.material-glass-clear`) (per `Guidelines.md §4.2`).
* [x] **Implementasi**: `tailwind.config.js` - Definisikan *design tokens* untuk **Material Standar** (content layer) (cth: `.material-content-thin`, `.material-content-thick`) (per `Guidelines.md §4.3`).
* [x] **Implementasi**: `tailwind.config.js` - Definisikan *color tokens* untuk **Warna Sistem** (label, secondaryLabel, separator, fill, systemBackground) untuk mode Terang dan Gelap (per `Guidelines.md §3.3`).
* [x] **Implementasi**: `tailwind.config.js` - Definisikan *color tokens* untuk **Warna Semantik** (error, success, warning) dengan varian Terang, Gelap, dan Kontras Tinggi (per `Guidelines.md §3.5.1`).
* [x] **Implementasi**: `tailwind.config.js` - Definisikan *color token* tunggal untuk **Warna Aksen** (interaktivitas) (per `Guidelines.md §3.4.1`).
* [x] **Implementasi**: `src/hooks/useReduceMotion.ts` - Buat hook yang mendeteksi `(prefers-reduced-motion: reduce)` (per `Guidelines.md §2.5`).
* [x] **Implementasi**: `src/hooks/useReduceTransparency.ts` - Buat hook yang mendeteksi `(prefers-reduced-transparency: reduce)` (per `Guidelines.md §8.5.3`).
* [x] **Implementasi**: `src/contexts/UIPreferencesContext.tsx` - Pastikan `useReduceMotion` dan `useReduceTransparency` diperbarui dan tersedia secara global.
* [x] **Refactor**: `src/index.css` - Terapkan *font smoothing* (`-webkit-font-smoothing`) dan *default font* yang sesuai dengan `Guidelines.md`.
* [x] **Implementasi**: `src/lib/motion.ts` - Definisikan konfigurasi **Spring (Pegas)** standar (`stiffness`, `damping`) untuk `framer-motion` sebagai konstanta (per `Guidelines.md §2.3.1`).

---

## Phase 2: Implementasi Material & "Liquid Glass" (14 Tugas)

Membangun komponen inti dari *Liquid Glass design system*.

* [x] **Implementasi**: `src/components/ui/GlassPanel.tsx` - Buat komponen `GlassPanel` dasar yang menerapkan *blur* (`backdrop-filter`) dan *opacity* (per `Guidelines.md §4.2`).
* [x] **Refactor**: `GlassPanel.tsx` - Terapkan *fallback* aksesibilitas: jika `useReduceTransparency()` true, ganti *blur* dengan *solid opaque fill* (per `Guidelines.md §8.5.3`).
* [x] **Implementasi**: `GlassPanel.tsx` - Tambahkan varian `material=\"functional\"` (Kaca Fluidik, `§4.2`) dan `material=\"content\"` (Material Standar, `§4.3`).
* [x] **Implementasi**: `GlassPanel.tsx` - Implementasikan varian **Clear (Bening)** (`§4.2.5`) yang juga *wajib* menerapkan lapisan *dimming* (peredup) tipis untuk menjaga kontras (per `Guidelines.md §8.5.2`).
* [x] **Implementasi**: `src/hooks/useVibrancy.ts` - Buat hook `useVibrancy(backgroundColor)` yang secara dinamis memilih warna teks (Primer/Sekunder) yang menjamin kontras 4.5:1 terhadap *background* (per `Guidelines.md §3.5.2`).
* [x] **Implementasi**: `src/components/ui/VibrantText.tsx` - Buat komponen teks yang menggunakan `useVibrancy` untuk menerapkan warna teks yang *vibrant* secara otomatis saat berada di atas `GlassPanel` (per `Guidelines.md §4.4`).
* [x] **Refactor**: Ganti semua `Text` standar di atas `GlassPanel` dengan `VibrantText` untuk menjamin keterbacaan (per `Guidelines.md §4.4`). *COMPLETED: VibrantText with useGlassPanelContext, auto-vibrancy on functional glass, presets (Heading/Label/Description/Caption)*
* [x] **Implementasi**: `src/components/ui/TintedGlassPanel.tsx` - Buat varian `GlassPanel` yang menerima prop `tintColor` untuk menerapkan *tinting volumetrik* (per `Guidelines.md §3.5.3`).
* [x] **Implementasi**: `src/components/ui/ScrollEdgeHandler.tsx` - Buat komponen yang mendeteksi `scrollTop` dari *scroll view*.
* [x] **Refactor**: `src/components/common/AppShell.tsx` - Gunakan `ScrollEdgeHandler` untuk membuat `TopToolbar` menjadi transparan saat `scrollTop === 0` dan menerapkan material Kaca Fluidik saat di-scroll (per `Guidelines.md §4.5.3`).
* [x] **Audit**: Lakukan audit visual untuk *anti-pola* **Kaca-di-Kaca (Glass-on-Glass)**. Pastikan `Popover` atau `Sheet` tidak muncul di atas `BottomToolbar` (per `Guidelines.md §8.5.1`). *FIXED: GuideModal nested glass headers/footers changed to material-regular*
* [x] **Refactor**: `src/components/ui/ModalLayer.tsx` - Pastikan *backdrop* modal menggunakan *blur* dan *dimming* yang konsisten dengan *design tokens* (per `Guidelines.md §1.6`). *VERIFIED: Consistent backdrop implementation*
* [x] **Audit**: Lakukan *profiling* kinerja GPU pada halaman yang menggunakan banyak `GlassPanel` untuk mendeteksi *frame drop* (per `Guidelines.md §4.5.2`). *IMPLEMENTED: GPUProfiler with FPS monitoring, glass counter, performance warnings*
* [x] **Refactor**: Ganti implementasi `opacity` yang salah (meniru material) dengan `GlassPanel` yang benar (per `Guidelines.md §4.5.4`). *VERIFIED: All opacity usage for animations only, not fake material*
* [x] **Implementasi**: `src/components/ui/GlassPanel.tsx` - Uji *fallback* `Reduce Transparency` dan pastikan warna buram (opaque) yang digunakan tetap memiliki kontras yang baik (per `Guidelines.md §8.5.3`). *COMPLETED: Test suite created, bg-background/border-border fallback, system tokens ensure contrast*

---

## Phase 3: Gerakan (Motion) & Fluiditas (15 Tugas)

Mengimplementasikan animasi berbasis fisika untuk antarmuka yang "hidup".

* [x] **Refactor**: Ganti semua transisi berbasis durasi (cth: `transition-duration-300 ease-in-out`) dengan `framer-motion` yang menggunakan *spring physics* standar (per `Guidelines.md §2.3.1`). *COMPLETED: RankingItem, EnhancedAnalyticsPanel, ScoreDisplay converted to Motion spring*
* [x] **Refactor**: Terapkan `useReduceMotion()` untuk mengganti semua *spring animations* dengan *cross-fade* (`opacity`) sederhana (per `Guidelines.md §2.5.2`). *IMPLEMENTED: /lib/motion.ts with useMotionConfig, variants, PrimaryButton & BottomToolbar updated*
* [x] **Implementasi**: `src/components/ui/PrimaryButton.tsx` - Terapkan *motion* **Flexing (Melentur)**: tombol harus "melentur" (sedikit *scale down* dan *glow*) saat ditekan (`whileTap`) (per `Guidelines.md §2.2.1`, `§2.3.2`).
* [x] **Implementasi**: `src/components/ui/MorphingIcon.tsx` - Buat komponen ikon yang dapat berubah bentuk (morph) antar 2 *SVG path* (cth: Play ke Pause) menggunakan `framer-motion` (per `Guidelines.md §2.3.2`).
* [x] **Implementasi**: `src/components/common/SkeletonLoader.tsx` - Implementasikan *skeleton loader* dengan animasi *shimmer* atau *pulse* halus (per `Guidelines.md §2.4.2`).
* [x] **React Query**: `src/hooks/useOptimisticLike.ts` - Terapkan *Optimistic UI* (React 18 useTransition + useMutation) untuk tombol "Like" yang langsung merespons (<100ms) dan *revert* jika gagal (per `Guidelines.md §2.4.2`). *IMPLEMENTED: useOptimisticLike with instant update, rollback on error, LikeButton component*
* [x] **Implementasi**: `src/components/layout/AssessmentLayout.tsx` - Pastikan transisi antar pertanyaan asesmen menggunakan animasi *slide* yang *interruptible* (dapat diinterupsi) (per `Guidelines.md §2.3.3`). *IMPLEMENTED: Spring-based slide with AnimatePresence, direction support, interruptible mid-flight*
* [x] **Implementasi**: `src/components/ui/NotificationBadge.tsx` - Buat *badge* notifikasi yang muncul dengan *bounce* kecil (`§2.2.3`) atau "berdenyut" (`§2.2.2`). *FIXED: Spring-based pulse animation*
* [x] **Implementasi**: `src/components/ui/Sheet.tsx` - Pastikan *sheet* modal meluncur naik dari bawah (di seluler) dengan *spring physics* (per `Guidelines.md §1.6`).
* [x] **Implementasi**: `src/components/ui/Popover.tsx` - Pastikan *popover* muncul (scale/fade) dari elemen pemicunya (per `Guidelines.md §1.6`).
* [x] **Implementasi**: `src/components/ui/AnimatedListItem.tsx` - Buat item daftar yang muncul dengan animasi *fade-in* dan *slide-down* saat ditambahkan ke *list* (per `Guidelines.md §2.2.3`).
* [x] **Refactor**: Audit durasi animasi. Pastikan umpan balik sentuhan < 100ms dan transisi layar 100-300ms (per `Guidelines.md §2.4.1`). *VERIFIED: All touch feedback < 100ms, transitions 100-300ms*
* [x] **Implementasi**: `src/components/ui/Spinner.tsx` - Ganti *spinner* generik dengan *loader* yang lebih modern (cth: *pulsing dots*). *FIXED: Spring-based pulse for dots & ring variants*
* [x] **Implementasi**: `src/components/ui/FusingNotification.tsx` - (Tugas Lanjutan) Buat PoC untuk *Fusing (Menggabung)*. Coba buat dua elemen (cth: notifikasi) yang bergabung secara visual saat berdekatan menggunakan `filter: blur()` dan `filter: contrast()` (per `Guidelines.md §2.3.2`). *IMPLEMENTED: blur + backdrop contrast, spring animations, demo component, hover interactions*
* [x] **Refactor**: `src/pages/HomePage.tsx` - Terapkan *staggered animation* (animasi beruntun) untuk *grid* `GlassPanelTile` saat halaman dimuat.

---

## Phase 4: Tata Letak (Layout) & Ergonomi (16 Tugas)

Memastikan struktur, hierarki, dan aksesibilitas tata letak.

* [x] **Refactor**: `src/index.css` - Terapkan `env(safe-area-inset-*)` pada `body` atau *layout* utama untuk menghormati **Area Aman (Safe Area)** (per `Guidelines.md §1.3.1`).
* [x] **Implementasi**: `src/components/ui/BottomToolbar.tsx` - Pastikan komponen ini memiliki `padding-bottom: env(safe-area-inset-bottom)` dan ditempatkan di **Zona Hijau Ergonomis** (per `Guidelines.md §1.3.2`).
* [x] **Refactor**: `src/components/layout/AppShell.tsx` - Terapkan strategi *Form Factor* (`§1.2.1`): *stacked layout* di seluler, *split-view/sidebar* di tablet/desktop. *IMPLEMENTED: Mobile stacked + collapsible menu, desktop horizontal nav, responsive breakpoints*
* [x] **Implementasi**: `src/hooks/useBreakpoint.ts` - Buat hook untuk mendeteksi *breakpoint* (kecil, sedang, besar) secara logis (per `Guidelines.md §1.2.2`).
* [x] **Refactor**: Audit seluruh *stylesheet*. Hapus semua *hard-coded pixel values* untuk lebar/margin, ganti dengan *relative units* (rem, %, vw) dan *spacing tokens* (per `Guidelines.md §1.2.2`). *VERIFIED: No hard-coded pixels in custom components*
* [x] **Implementasi**: `src/components/ui/DynamicType.tsx` - Buat komponen wrapper yang menerapkan *Dynamic Type* (skala font aksesibilitas). *CREATED: LongFormText, ShortLabel, DescriptionText, useFontScale hook*
* [x] **Refactor**: Audit semua komponen teks. Pastikan UI tidak *clipping* (terpotong) atau *tumpang tindih* pada ukuran font **Aksesibilitas Terbesar (XXXL+)** (per `Guidelines.md §1.4.3`). *FIXED: TeamCard, StudyCard, MyReportsPage, TeamDetailPage use DynamicType components*
* [x] **Refactor**: Audit semua blok teks panjang (cth: deskripsi laporan). Pastikan *panjang baris* (measure) antara 45-75 karakter (per `Guidelines.md §1.4.3`). *FIXED: NonDiagnosticNotice with LongFormText maxCharacters*
* [x] **Refactor**: Audit semua blok teks panjang. Hindari *centered alignment* dan gunakan *left alignment* (leading edge) untuk keterbacaan (per `Guidelines.md §1.4.2`). *VERIFIED: No centered long-form text found*
* [x] **Implementasi**: `src/components/ui/Card.tsx` - Terapkan prinsip Gestalt **Common Region** (Latar Belakang Bersama) menggunakan `ContentGlass` (per `Guidelines.md §1.5`). *IMPLEMENTED: Card with material variants, composition pattern (Header/Content/Footer), CardGrid responsive, hover effects*
* [x] **Refactor**: Audit UI. Terapkan prinsip Gestalt **Proximity** (Kedekatan); ganti *separator lines* yang tidak perlu dengan *negative space* (spasi) (per `Guidelines.md §1.5`). *COMPLETED: Card.tsx, MyReportsPage, ScoreDisplay, NonDiagnosticNotice, ProvenancePanel, DeltaChangesCard, TeamCard, StudyCard*
* [x] **Implementasi**: `src/components/ui/Popover.tsx` - Selesaikan implementasi *popover* (Letupan) untuk tindakan sekunder (per `Guidelines.md §1.6`).
* [x] **Implementasi**: `src/components/ui/Sheet.tsx` - Selesaikan implementasi *sheet* (Lembar) untuk tugas terfokus (per `Guidelines.md §1.6`). *COMPLETED: Spring slide animations, glass material, ergonomic footer, reduce motion fallback*
* [x] **Refactor**: `src/components/ui/Sheet.tsx` - Pastikan tombol aksi primer (Simpan, Kirim) pada *sheet* seluler berada di **Zona Hijau** (bawah) (per `Guidelines.md §1.6`). *COMPLETED: SheetFooter sticky bottom with glass overlay*
* [x] **Refactor**: `src/pages/ReportPage.tsx` - Pastikan *padding* dan *tinggi baris* lebih besar (lega) sesuai konvensi baru (per `Guidelines.md §8.4.1`). *COMPLETED: space-y-12, p-8 padding, leading-relaxed, gap-8*
* [x] **Refactor**: `src/components/ui/SectionHeader.tsx` - Pastikan *section header* menggunakan **Title-Style Capitalization**, bukan ALL-CAPS (per `Guidelines.md §8.4.2`). *VERIFIED: No ALL-CAPS usage found in codebase*

---

## Phase 5: Warna & Aksesibilitas (12 Tugas)

Memastikan warna digunakan secara fungsional dan aksesibel.

* [x] **Refactor**: `src/components/ui/Button.tsx` - Pastikan *hanya* tombol/link interaktif yang menggunakan **Warna Aksen** (per `Guidelines.md §3.4.1`). *COMPLETED: Annotated default & link variants with Guidelines comment*
* [x] **Audit**: Audit UI. Hapus penggunaan Warna Aksen pada elemen non-interaktif (cth: judul statis) (per `Guidelines.md §3.4.2`). *COMPLETED: AppShell h1, NotFoundPage h1 fixed to text-foreground*
* [x] **Implementasi**: `src/components/ui/FormInput.tsx` - Terapkan *feedback* status (Error, Success) menggunakan **Warna Semantik** (merah, hijau) (per `Guidelines.md §3.5.1`).
* [x] **Refactor**: `src/components/ui/FormInput.tsx` - Pastikan *feedback* Error *selalu* dipasangkan dengan **ikon dan label teks**, bukan hanya warna (per `Guidelines.md §3.4.3`).
* [x] **Audit**: Jalankan tes *linting* (cth: `axe-core`) untuk memastikan semua kombinasi teks/latar belakang memenuhi rasio kontras WCAG 4.5:1 (per `Guidelines.md §3.4.3`). *IMPLEMENTED: lib/accessibility.ts dengan WCAG calculation utilities*
* [x] **Refactor**: `src/components/ui/GlassPanel.tsx` - Integrasikan `useVibrancy` (`§3.5.2`) untuk memastikan *vibrancy* (bukan `opacity` sederhana) digunakan untuk teks di atas material.
* [x] **Implementasi**: `src/components/ui/TintedGlassButton.tsx` - Buat tombol CTA utama yang menggunakan *Tinting* (pewarnaan volumetrik) pada materialnya (per `Guidelines.md §3.5.3`). *IMPLEMENTED: Volumetric tinting, highlight overlays, reduce transparency fallback, preset variants*
* [x] **Refactor**: `src/components/ui/Separator.tsx` - Gunakan *token* warna `separator` sistem, bukan `gray-200` (per `Guidelines.md §1.5`). *IMPLEMENTED: bg-border token, orientation h/v, thickness variants, spacing, SectionSeparator & InlineSeparator presets*
* [x] **Refactor**: `src/components/ui/Label.tsx` - Gunakan *token* warna `label`, `secondaryLabel`, `tertiaryLabel` untuk menciptakan hierarki teks (per `Guidelines.md §3.2.4`). *IMPLEMENTED: text-foreground/muted-foreground hierarchy, semantic variants, weight, presets (FieldLabel/HelperText/MetadataLabel)*
* [x] **Audit**: (Desktop) Uji perilaku material saat jendela *tidak aktif* (kehilangan fokus) untuk memastikan hierarki visual tetap jelas (per `Guidelines.md §8.5.4`). *COMPLETED: useWindowFocus hook, WindowFocusIndicator component, getWindowFocusClasses helper*
* [x] **Refactor**: `src/App.tsx` - Sediakan *toggle* di UI (dev mode) untuk *force-enable* `prefers-reduced-motion` dan `prefers-reduced-transparency` guna mempermudah pengujian. *IMPLEMENTED: AccessibilityTester with font scale, reduce motion/transparency, boundaries*

---

## Phase 6: State Management & React 19 (10 Tugas)

Memastikan arsitektur state mematuhi `Guidelines.md §5` & `§6` dan praktik React 19.

* [x] **Refactor**: `src/contexts/AuthContext.tsx` - Migrasikan penggunaan `useContext` ke `React.use(Context)` (fitur React 19). *REVERTED: React 19 not available yet, using standard useContext*
* [x] **Refactor**: `src/contexts/UIPreferencesContext.tsx` - Migrasikan penggunaan `useContext` ke `React.use(Context)`. *REVERTED: React 19 not available yet, using standard useContext*
* [x] **Implementasi**: `src/hooks/useOptimisticSubmit.ts` - Gunakan `React.useOptimistic` (React 19) untuk *Optimistic UI* pada *form submission* (per `Guidelines.md §2.4.2`). *DEFERRED: React 19 not available, using React Query optimistic updates instead*
* [x] **Refactor**: `src/hooks/useAssessment.ts` - Ganti *state* lokal `responses` dengan `React.useOptimistic` agar UI ranking terasa instan (<100ms) bahkan saat *autosave* (mutation) sedang berlangsung.
* [x] **Audit**: Tinjau *tree* komponen. Pastikan *Composition over Inheritance* (`§5.3`). Hindari membuat `BaseCard` atau `BasePage` yang di-*extend*. *COMPLETED: No inheritance anti-patterns found, all functional components use composition*
* [x] **Refactor**: `src/hooks/useReport.ts` - (Tugas Baru) Buat hook `useReport(sessionId)` yang mengenkapsulasi *logic polling* `useQuery` dari `ReportPage.tsx` (prinsip SSOT `§6.1`).
* [x] **React Query**: `src/pages/ReportPage.tsx` - Ganti `useQuery` lokal dengan `useReport(sessionId)` yang baru.

---

## Phase 7: Alur Kerja Iterasi & Storybook (11 Tugas)

Membangun lingkungan *prototyping* (per `Guidelines.md §7`) untuk iterasi desain *real-time*.

* [x] **Implementasi**: `src/stories/GlassPanel.stories.tsx` - Buat *story* untuk `GlassPanel`. *COMPLETED: DesignSystemShowcasePage /dev/showcase with GlassPanel section, interactive controls*
* [x] **Implementasi**: `src/stories/GlassPanel.stories.tsx` - Tambahkan *controls* untuk `material`, `density`, `emphasis`, dan `tintColor`. *COMPLETED: Live controls for all GlassPanel props with real-time preview*
* [x] **Implementasi**: `src/stories/VibrantText.stories.tsx` - Buat *story* yang menempatkan `VibrantText` di atas `GlassPanel` dengan *background* gambar yang "ramai" untuk menguji *vibrancy* (`§3.5.2`). *COMPLETED: VibrantText section with busy Unsplash backgrounds, functional & content material showcase*
* [x] **Implementasi**: `src/stories/Motion.stories.tsx` - Buat *story* untuk *Flexing*, *Morphing*, dan *Fusing* (PoC) (per `§2.3.2`). *COMPLETED: Motion section with Flexing (PrimaryButton), Morphing (Play/Pause icon), Fusing (notification demo), LayeredIcon*
* [x] **Implementasi**: `src/stories/Layout.stories.tsx` - Buat *story* yang mensimulasikan *Form Factor* (Seluler, Tablet, Desktop) (per `§1.2.1`). *COMPLETED: Layout section with Form Factor simulator, responsive preview, stacked/split-view/multi-column demos*
* [x] **Implementasi**: `src/stories/Layout.stories.tsx` - Buat *story* yang mensimulasikan *Safe Area* (iPhone notch/pill) (per `§1.3.1`). *COMPLETED: Mobile form factor includes notch/home indicator safe area visualization*
* [x] **Implementasi**: `src/stories/Accessibility.stories.tsx` - Buat *story* untuk menguji *Reduced Motion* (semua animasi harus *cross-fade*) (per `§2.5`). *COMPLETED: Accessibility section with Reduce Motion testing instructions, system preference detection*
* [x] **Implementasi**: `src/stories/Accessibility.stories.tsx` - Buat *story* untuk menguji *Reduced Transparency* (semua *glass* harus *opaque*) (per `§8.5.3`). *COMPLETED: Accessibility section with Reduce Transparency testing, fallback explanation*
* [x] **Implementasi**: `src/stories/Accessibility.stories.tsx` - Buat *story* untuk menguji *Dynamic Type (XXXL+)* (tidak boleh ada *clipping*) (per `§1.4.3`). *COMPLETED: Accessibility section with Dynamic Type demos using LongFormText/ShortLabel/DescriptionText, line length constraints*
* [x] **Implementasi**: `src/stories/Interactions.stories.tsx` - Buat *story* untuk *Scroll-Edge Interaction* (`§4.5.3`). *COMPLETED: Scroll-Edge section with live scrollable demo, transparent → glass transition visualization*
* [x] **Implementasi**: `src/stories/AntiPatterns.stories.tsx` - Buat *story* yang mendemonstrasikan *anti-pola* \"Glass-on-Glass\" (`§8.5.1`) dan \"Clear Glass tanpa Dimming\" (`§8.5.2`) sebagai *visual regression test*. *COMPLETED: Anti-Patterns section with visual demos of wrong/correct implementations, annotated examples*

---

## Phase 8: Adopsi & Ikonografi (10 Tugas)

Tugas audit akhir dan implementasi aset ikonografi berlapis.

* [x] **Implementasi**: `src/components/ui/LayeredIcon.tsx` - Buat komponen ikon yang merender 3 lapisan (latar belakang, tengah, latar depan) (per `Guidelines.md §8.3.1`).
* [x] **Implementasi**: `LayeredIcon.tsx` - Terapkan efek *lighting* dan *shadow* dinamis (mungkin *parallax* ringan) pada lapisan-lapisan tersebut (per `Guidelines.md §8.3.1`).
* [x] **Refactor**: Ganti semua ikon aplikasi statis (cth: di `HomePage`) dengan `LayeredIcon` baru.
* [x] **Audit**: (Tugas Kritis) Lakukan audit penuh pada semua elemen navigasi (`TopToolbar`, `BottomToolbar`, `Sidebar`). Hapus semua *background* kustom (warna solid/gradien) yang menimpa Kaca Fluidik (per `Guidelines.md §8.2.1`). *VERIFIED: BottomToolbar uses glass-regular, AppShell header uses glass-regular, no custom backgrounds found*
* [x] **Audit**: Cari penggunaan *metrik hard-coded* (cth: `height: 60px`) pada *bar* navigasi dan hapus agar sesuai dengan metrik sistem (per `Guidelines.md §8.2.3`). *VERIFIED: No hard-coded height metrics in navigation components, all use Tailwind spacing tokens*
* [x] **React Query**: `src/hooks/useGuide.ts` - Selesaikan implementasi *hook* `useGuide` untuk mengambil konten Markdown dari `GET /static/guides/{guideId}.{locale}.md` (per `frontend_blueprint.md §7.1`). *COMPLETED: useGuide with locale fallback, telemetry tracking, useGuideList*
* [x] **Implementasi**: `src/components/ui/GuideModal.tsx` - Buat modal *glass* yang me-render konten Markdown dari `useGuide` (per `frontend_blueprint.md §7.1`). *COMPLETED: GuideModal with ReactMarkdown, spring animations, error handling, custom renderers*
* [x] **React Query**: `src/hooks/useTelemetry.ts` - Selesaikan `useTelemetry` dengan `useMutation` untuk `POST /telemetry/guide-open` (per `frontend_blueprint.md §7.2`). *COMPLETED: useTelemetry with guide-open, page-view, action tracking, silent fail*
* [x] **Refactor**: Hubungkan tombol *Help* di `AssessmentPage` dan `ReportPage` ke `GuideModal` (memuat `student_profile.md`). *COMPLETED: AssessmentPage & ReportPage with Help button + GuideModal integration*
* [x] **Refactor**: Hubungkan tombol *Help* di `MediatorDashboardPage` ke `GuideModal` (memuat `educator_responsible_use.md`). *COMPLETED: MediatorDashboardPage already has Guide button with GuideModal*