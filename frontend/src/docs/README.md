# Dokumentasi KOLB-LSI 4.0

Direktori ini berisi semua dokumentasi teknis dan desain untuk proyek KOLB-LSI 4.0.

## 📚 Daftar Dokumen

### 1. **Guidelines.md** ✅
**Basis Pengetahuan Desain Antarmuka Modern**

Dokumen master yang WAJIB dipatuhi 100% oleh semua pengembangan frontend. Mencakup:
- **Bagian 1:** Layout (Ergonomi Matematis, Safe Area, Hukum Fitts)
- **Bagian 2:** Motion (Fisika Spring, Osilasi Harmonik Teredam)
- **Bagian 3:** Color (Psikofisika Persepsi, Vibrancy, Aksesibilitas WCAG)
- **Bagian 4:** Material (Hierarki 2-Lapis: Kaca Fluidik + Standar)
- **Bagian 5:** Arsitektur UI Deklaratif (UI = f(State))
- **Bagian 6:** Manajemen State (SSOT, Data Flow)
- **Bagian 7:** Prototyping Real-Time
- **Bagian 8:** Audit & Mitigasi Risiko

**Status:** ✅ Lengkap & Implementasi dalam `tailwind.config.js` & `globals.css`

---

### 2. **SITEMAP.md** (Planned)
**Peta Endpoint API Backend**

Akan berisi mapping lengkap endpoint API yang harus cocok dengan service layer di frontend:
- `/auth/token` → `authService.ts`
- `/auth/me` → `authService.ts`
- `/engine/sessions/start` → `sessionService.ts`
- `/engine/sessions/:id` → `sessionService.ts`
- `/engine/sessions/:id/items` → `assessmentService.ts`
- `/reports/sessions/:id` → `reportService.ts`
- `/teams/` → `teamService.ts`
- `/research/studies` → `researchService.ts`

**Status:** ⏳ Belum dibuat (diperlukan untuk Phase 1+)

---

### 3. **frontend_blueprint.md** (Planned)
**Blueprint Arsitektur Frontend**

Akan berisi:
- Arsitektur komponen "Liquid Glass"
- Struktur direktori detail
- Pattern komunikasi service-layer
- State management strategy
- Error handling patterns
- Testing strategy

**Status:** ⏳ Belum dibuat

---

### 4. **psychometrics_spec.md** (Planned)
**Spesifikasi Psikometrik KLSI 4.0**

Akan berisi:
- Model teoretis Kolb Learning Styles
- Algoritma scoring (CE, RO, AC, AE)
- Perhitungan skor dialektik (AC-CE, AE-RO)
- Learning Space Grid mathematics
- Learning Flexibility Index (LFI)
- Norm group specifications
- Panduan interpretasi hasil

**Status:** ⏳ Belum dibuat (diperlukan untuk implementasi ReportPage)

---

## 🎯 Konvensi Dokumentasi

### Naming
- **PascalCase** untuk dokumen utama: `Guidelines.md`, `SITEMAP.md`
- **snake_case** untuk spesifikasi: `frontend_blueprint.md`, `psychometrics_spec.md`
- **UPPERCASE** untuk meta-dokumentasi: `README.md`, `CHANGELOG.md`

### Format
- Gunakan Markdown dengan heading hierarkis (`#`, `##`, `###`)
- Sertakan **Table of Contents** untuk dokumen >100 baris
- Gunakan code blocks dengan syntax highlighting
- Sertakan diagram (Mermaid) jika diperlukan
- Tambahkan emoji untuk quick scanning: ✅ (done), ⏳ (pending), ⚠️ (warning), 🔴 (critical)

### Update Policy
- Setiap perubahan signifikan dalam sistem desain → Update `Guidelines.md`
- Setiap endpoint API baru → Update `SITEMAP.md`
- Setiap pattern arsitektur baru → Update `frontend_blueprint.md`

---

## 🔗 Referensi Eksternal

### Design System
- [W3C WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Standar aksesibilitas
- [Inter Font Family](https://fonts.google.com/specimen/Inter) - Tipografi default

### React Ecosystem
- [React 19 Docs](https://react.dev/) - Framework UI
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [React Router v6](https://reactrouter.com/) - Routing
- [Tailwind CSS v4](https://tailwindcss.com/) - Styling

### Testing
- [Vitest](https://vitest.dev/) - Unit testing
- [React Testing Library](https://testing-library.com/react) - Integration testing

---

**Last Updated:** 2025-11-15  
**Maintainer:** Frontend Dev Expert AI  
**Project:** KOLB-LSI 4.0
