# KLSI 4.0 Frontend UI Design Specification

Status: Draft v1 (Academically grounded)
Scope: Web application frontend consuming existing FastAPI backend (`/sessions`, `/reports`, `/admin`, `/teams`, `/research`).
Source Fidelity: All psychometric representations trace to Kolb & Kolb (2013) Guide (Figures 4–5, Appendix 1 & 7, Chapter LFI pages 1443–1466).

## 1. User Mental Model (Hierarki Konseptual)

Pengguna berinteraksi dengan sistem sebagai proses transformasi pengalaman → skor → interpretasi → refleksi lanjutan. Mereka tidak “mengisi tes” untuk label tunggal, tetapi memetakan pola preferensi belajar (empat mode) dan fleksibilitas kontekstual.

### Personas
1. Mahasiswa (Student)
   - Tujuan: Memahami gaya utama & fleksibilitas; mempersiapkan strategi belajar adaptif.
   - Fokus: Proses spiral (pengalaman → refleksi → konsep → eksperimen) bukan hasil statis.
2. Mediator (Admin/Facilitator)
   - Tujuan: Menganalisis distribusi gaya dalam cohort, memastikan kualitas data (ipsative valid).
   - Fokus: Import norma, audit finalisasi, agregasi tim/kelas.
3. Peneliti (Research Extension)
   - Tujuan: Mengevaluasi hubungan intensitas gaya ↔ LFI, invariance demografis.
4. Team Lead / Dosen
   - Tujuan: Mengobservasi komposisi gaya tim untuk perancangan aktivitas heterogen.

### Konsep Inti & Relasi Mental
| Konsep | Persepsi Pengguna | Backend Entity |
|--------|-------------------|----------------|
| Sesi Asesmen | “Kontainer percobaan belajar saya sekarang” | `assessment_sessions` |
| Item Gaya (12) | Set pilihan 4 pernyataan harus diurutkan | `assessment_items`, `item_choices`, `user_responses` |
| Ranking Ipsatif | Keputusan trade-off preferensi | `user_responses.rank_value` (1–4 unik) |
| Skor Mode | Ringkas akumulasi preferensi (CE/RO/AC/AE) | `scale_scores` |
| Dialektika | Koordinat posisi ruang belajar (ACCE, AERO, dlsb) | `combination_scores` |
| Grid 9 Gaya | Wilayah interpretasi (Imagining … Deciding) | `learning_style_types` |
| Gaya Utama | Region tempat koordinat jatuh | `user_learning_styles.primary_style_type_id` |
| Gaya Cadangan | Region terdekat kedua (“potensi adaptasi”) | `backup_learning_styles` |
| Konteks LFI (8) | Situasi berbeda tempat preferensi mungkin berubah | `lfi_context_scores` |
| LFI (0–1 + percentile) | Derajat variasi ranking antar konteks (fleksibilitas) | `learning_flexibility_index` |
| Percentile | Posisi relatif populasi (norm sourced) | `percentile_scores` / fallback Appendix |
| Norm Group Provenance | Sumber referensi (EDU, COUNTRY, AGE, GENDER, Total, AppendixFallback) | `percentile_scores.norm_group_used` |
| Laporan | Narasi terintegrasi gaya + fleksibilitas + rekomendasi | Built via `/reports/{session_id}` |
| Audit Log | Bukti integritas finalisasi | `audit_log` |

### Hierarki Mental Pengguna (Urutan Fokus)
1. Mengerti tugas (ranking item) → 2. Memastikan semua item & konteks lengkap → 3. Menunggu finalisasi → 4. Menjelajah visual gaya (kite, grid) → 5. Memahami fleksibilitas (LFI) → 6. Merenungkan implikasi belajar/tim → 7. (Opsional) Bandingkan sesi sebelumnya (spiral).

## 2. Information Architecture & Navigasi

Top-Level Sections (Fluent/iOS tabbed or left rail):
1. Dashboard
2. Assessment (12 Style Items)
3. Flexibility Contexts (8 LFI contexts)
4. Results
5. Teams (RBAC: Mediator/Team Lead)
6. Admin (RBAC: Mediator)
7. Research (RBAC: Mediator/Researcher)
8. Designs (Experiential session recommendations)

Route Mapping:
- `/dashboard` – status sesi aktif, cards untuk memulai/lanjutkan.
- `/assessment/:sessionId/item/:number` – single forced-choice item view.
- `/flexibility/:sessionId/context/:name` – context ranking form.
- `/results/:sessionId` – hasil terintegrasi (kite, grid, percentiles, LFI bar, provenance badge).
- `/teams` – distribusi gaya & LFI aggregate, style diversity index.
- `/admin/norms` – CSV import UI + audit list.
- `/research/analytics` – curve (style intensity ↔ LFI), heatmaps.
 - `/designs` – rekomendasi aktivitas belajar berbasis gaya utama/cadangan.

Navigation Pattern:
- Desktop: Left rail (Fluent 2) with collapsing icons; active route highlighted (accent color). Secondary top bar shows session progress (items done / contexts done).
- Mobile: Bottom tab bar (iOS 17 aesthetic) with contextual overflow menu for RBAC-specific sections.

## 3. Key User Flows

### 3.1 Start & Continue Assessment
1. User login → JWT stored → Dashboard shows “Active Session” card or “Start New Session” button.
2. Start: POST `/sessions/start` → returns `session_id`.
3. Redirect to first item route.

### 3.2 Forced-Choice Item Ranking
1. Fetch items: GET `/sessions/{session_id}/items`.
2. Display item stem + four choice cards in neutral order.
3. User assigns ranks (drag vertically; top becomes 1). Real-time validation ensures set {1,2,3,4}.
4. Submit: POST `/sessions/{session_id}/submit_item` with `{ choice_id: rank }`.
5. On success advance; progress bar updates (n/12 completed) & subtle celebration micro-animation every 3 items (keeps engagement, low cognitive load).

### 3.3 LFI Context Ranking
1. After 12 items complete, UI prompts: “Tahap fleksibilitas – 8 konteks”.
2. Context list shows all 8; each navigates to context form with four mode tokens (CE/RO/AC/AE) requiring unique ranks.
3. Submit: POST `/sessions/{session_id}/submit_context`.
4. Progress ring (0–8) + tooltip definisi konteks (accessible icon).

### 3.4 Validation & Finalization
1. GET `/sessions/{session_id}/validation` – check `ready_to_complete` & `lfi_contexts_complete`.
2. If all ready → enable “Finalize Session” (primary button with confirmation modal explaining snapshot & immutability).
3. POST `/sessions/{session_id}/finalize`.
4. Transition loader → results route.

### 3.5 Viewing Results
1. GET `/reports/{session_id}`.
2. Display sections: Overview | Style Profile | Flexibility | Percentiles & Provenance | Interpretation & Recommendations | Data Export.
3. Mediator sees additional analytics (heatmap, context style mapping, regression curve preview).

### 3.6 Admin Norm Import
1. Navigate Admin → Norms.
2. Upload CSV with required headers (scale_name, raw_score, percentile) + input norm_group.
3. POST `/admin/norms/import` – show monotonic check result; display provenance list.

### 3.7 Teams Analytics
1. GET team sessions aggregated; present style distribution bar (9 categories), LFI spread density, diversity index (Shannon-like, derived client-side from style frequencies).

## 4. Component Library (Psychometric-Oriented Fluent/iOS Hybrid)

| Component | Purpose | Key States | Validation & Notes |
|-----------|---------|------------|--------------------|
| `RankChoiceCard` | Represent a single statement choice | Neutral, Dragging, Assigned(rank), Error(duplicate) | Shows assigned number badge; color-coded subtle accent per rank (1 strong → 4 faint) but neutral semantics. |
| `RankGroup` | Container for 4 `RankChoiceCard` | Ready, Incomplete, Complete | Provides aria-live announcement when a duplicate attempted. |
| `ContextRankMatrix` | LFI context ranking (CE/RO/AC/AE) | Editing, Valid, Invalid | Grid with four pills each with rank picker (segmented control 1–4). |
| `ProgressStepper` | Show item/context completion | Items vs contexts | Uses Fluent 2 subtle track tokens; accessible text “8/12 item selesai”. |
| `KiteChart` | Raw CE/RO/AC/AE polygon | Hover mode highlight | Axes labeled localized; provides screen-reader alt summary. |
| `StyleGridMap` | 3×3 style region visualization | Primary style highlighted, Backup bordered | Regions tinted gradient; coordinates (ACCE,AERO) dot animated entrance. |
| `FlexibilityBar` | LFI percentile category | Low, Moderate, High | Tertile markers at 33.34% & 66.67%; tooltip formula LFI=1-W. |
| `PercentileTable` | CE/RO/AC/AE/ACCE/AERO percentiles | Loading, Fallback(Appendix), DB Norm | Each cell includes provenance icon if different groups. |
| `NormProvenanceBadge` | Display `norm_group_used` | AppendixFallback or Group string | On click open modal explaining precedence order. |
| `AuditHashPanel` | Show truncated SHA-256 of finalization | Collapsed/Expanded | Reinforces integrity & immutability. |
| `HeatmapContexts` | 8×4 matrix of ranks | Hover cell details | Color scale reversed (1 darkest to 4 lightest) to avoid value judgment. |
| `RegressionCurveCard` | Style intensity vs LFI plot | Interactive hover nodes | For researchers; optional lazy-loaded. |
| `CSVImportDropzone` | Norm import | Drag-over, Validating, Error, Success | Performs client-side header check before upload. |
| `RoleGuard` | Conditional render wrapper | Allowed, Blocked | Displays pedagogy rationale when blocked. |
| `SessionStatusCard` | Dashboard summary | In Progress, Ready to Finalize, Completed | CTA changes accordingly. |
| `SessionDesignCard` | Rekomendasi aktivitas belajar | Collapsed/Expanded, Bookmarked | Menampilkan `title`, `summary`, waktu (`duration_min`), dan gaya yang diaktifkan. |
| `WhatIfScoringPanel` | Simulator stateless “what‑if” | Editing, Result | Masukkan skor CE/RO/AC/AE atau ACCE/AERO lalu tampilkan gaya & koordinat tanpa menyimpan. |

## 5. Interaction & Validation Rules

Forced-choice Guarantee:
- UI prevents assigning same rank twice; if attempted, previous assignment must be re-selected first (enforced by state machine).
- “Complete” state only when `set(ranks) == {1,2,3,4}`.

Context Ranking Integrity:
- Each context persists only after valid permutation; partial invalid states never POST.

Finalization Safeguards:
- Button disabled until validation endpoint returns `all_ready=true`.
- Post-finalization views become read-only; attempts to revisit item routes show toast “Sesi telah selesai (read-only snapshot).”.

Provenance Transparency:
- Percentile cells display small badge (e.g., EDU:, AGE:) or “Appendix” tag; hover reveals order attempted & chosen source.

Balance Percentile Disclaimer:
- Tampilkan badge “Derived” pada kolom/section percentil BALANCE (ACCE/AERO) dengan tooltip: “Persentil keseimbangan ini adalah transformasi turunan yang mengindikasikan kedekatan ke pusat; bukan norma empiris populasi.”

Error Handling Patterns:
- Network failure on submit: optimistic UI rollback + inline retry button.
- JWT expiry: intercept 401 → re-auth modal without losing form state.

## 6. Visual Language & Tokens (Fluent 2 + iOS Harmony)

Design Principles:
1. Neutral Academic Tone – Avoid evaluative colors (e.g., red/green for better/worse). Use cool neutrals and balanced accent.
2. Mode Color Mapping (Subtle): CE (#0078D4 blue), RO (#6B4FBB indigo), AC (#B4009E magenta), AE (#FF8C00 orange). Applied only as small indicators (icons, axis labels) not fill backgrounds.
3. Elevation minimal; rely on stroke (1px) and soft radius (8px) for containment. Modal radius 20px (iOS inspiration).
4. Typography: Fluent 2 “Segoe UI Variable” fallback to system-ui; hierarchy: Title (24/semibold), Subtitle (18/medium), Body (14/regular), Caption (12). Line height 1.4.
5. Spacing Scale: 4,8,12,16,24,32,40 px.
6. Semantic Shadows: `shadow-level-1` subtle y=2 blur=4, `shadow-level-2` y=4 blur=12.
7. Focus Ring: 2px #0F6CBD outer + 1px inner white offset (WCAG AA).
8. Dark Mode: Background #1C1C1C, cards #2A2A2A, text high-emphasis #FFFFFF, low-emphasis #B3B3B3, color tokens adjusted for contrast.
9. Localization: Indonesian default; style names bilingual toggle “Imagining (Memayangkan)”.

Accessibility:
- Minimum contrast 4.5:1 for text <18px, 3:1 for >=18px semibold.
- Drag handles keyboard accessible via up/down to reorder; live region announces new rank.

## 7. Psychometric Safeguards in UI

| Safeguard | UI Mechanism | Rationale |
|-----------|--------------|-----------|
| Ipsative Integrity | RankSet must be permutation; disabled next until valid | Maintains forced-choice measurement fidelity. |
| Non-reactive Scoring | Hide percentiles until finalization | Prevents strategic responding. |
| Provenance Disclosure | NormProvenanceBadge + modal explanation | Transparency per AERA/APA Standards. |
| Backup Style Contextualization | Tooltip framing “Alternatif terdekat – bukan label tambahan” | Avoids essentialist interpretation. |
| LFI Explanation | Info icon linking formula (LFI=1−W) & interpretation examples | Supports informed reflection. |
| Neutral Color Semantics | Avoid green=good/red=bad mapping in percentiles | Prevents value bias. |
| Audit Visibility | Hash panel & timestamp | Reinforces immutability, deters tampering suspicion. |

### 7.1 Balance Percentile Disclaimer
Untuk skor keseimbangan (BALANCE_ACCE, BALANCE_AERO), tampilan percentil diberi label “Derived” dan disertai keterangan bahwa metrik ini bukan norma empiris dari populasi, melainkan penskalaan jarak ke pusat. Lihat `docs/psychometrics_spec.md §5.2`.

## 8. Data Contracts (Frontend ↔ Backend)

| UI Need | Endpoint | Response Fields Used | Notes |
|---------|----------|----------------------|-------|
| Items list | GET `/sessions/{id}/items` | `[{id, number, type, stem}]` | `type` differentiates style vs LFI contexts by item form style. |
| Submit item ranks | POST `/sessions/{id}/submit_item` | `{ok}` | Provide body: item_id, ranks map (choice_id→rank). |
| Submit context ranks | POST `/sessions/{id}/submit_context` | `{ok}` | Query/body includes context_name & CE/RO/AC/AE ints. |
| Validation status | GET `/sessions/{id}/validation` | `ready_to_complete`, `lfi_contexts_complete`, `all_ready` | Drives finalize button enablement. |
| Finalize session | POST `/sessions/{id}/finalize` | `result.{ACCE,AERO,style_primary_id,LFI}` | After success trigger report fetch. |
| Report data | GET `/reports/{id}` | Composite dict (style, kite, percentiles, LFI, provenance) | Extend spec to include backup style & context heatmap (backend already prepared via `build_report`). |
| Norm import | POST `/admin/norms/import` | `rows_inserted`, `hash` | Show toast and add to audit log list. |
| Team rollups | GET `/teams/{team_id}/rollup` | `{date, total_sessions, avg_lfi, style_counts, acce_aero_centroid}` | Digunakan untuk kartu ringkasan dan grafik distribusi. |
| Team list | GET `/teams` | `[{id, team_name, members}]` | Tautan ke halaman rollup per tim. |
| Research curve | GET `/research/lfi-regression-curve` | `{curve:[{intensity,predicted_lfi}], r2, method}` | Menampilkan `RegressionCurveCard` (inverted‑U). |
| What‑If Scoring | POST `/score/sandbox` | `{style_primary, acce, aero, kite_coordinates}` | Tidak menyimpan ke DB; untuk edukasi dan eksplorasi.
| Session designs | GET `/designs/recommendations?primary=Balancing&backup=Reflecting` | `[{code,title,summary,activates,duration_min}]` | Backed by `app/data/session_designs.py::recommend_for_primary`.

Client MUST treat 400/401/403/409 per semantics defined in routers (e.g., 409 = already completed).

## 9. Wireframe Annotations (Textual)

### Assessment Item Screen
Layout: Title bar (Item X of 12) | Statement Cards (vertical list with drag handles) | Rank validation banner (hidden until error) | Footer Next button.
Kite/score hidden.

### Context Ranking Screen
Header: Context Name + description tooltip.
Matrix: 4 mode tokens each with rank segmented control (1–4). Subtext clarifies mode labels (CE=Pengalaman Konkret).
Footer: Save & Next.

### Results Overview
Top: Session summary (timestamp, hash truncated).
Left Column: KiteChart + raw scores table.
Right Column: StyleGridMap with legend & backup style tag.
Below: FlexibilityBar + percentile breakdown table with NormProvenanceBadge.
Sidebar (Mediator only): HeatmapContexts, RegressionCurveCard.

### Team Analytics Screen
Header: Pilih tim (dropdown) → tanggal (opsional).
Cards: Total sessions, rata‑rata LFI (+ percentile), centroid ACCE/AERO.
Charts: Distribusi 9 gaya (bar), sebaran LFI (violin/density), peta grid 3×3 dengan titik anggota.

### Research Analytics & What‑If
Left: RegressionCurveCard (intensity ↔ LFI) dengan keterangan inverted‑U.
Right: WhatIfScoringPanel untuk simulasi koordinat dan gaya tanpa menyimpan.

### Designs Screen
Grid `SessionDesignCard` hasil rekomendasi berdasarkan gaya utama/cadangan; filter berdasarkan gaya yang ingin diaktifkan. Klik kartu membuka rincian outline langkah (jika tersedia) dan daftar bahan.

### Admin Norm Import
Panel: Dropzone + norm_group input (text) + recent imports list (hash, date, group).
Validation: Preflight header check.

## 10. Design Tokens (Reference File `docs/ui_tokens.json`)
See separate JSON file for consumable tokens (colors, spacing, radii, elevations, typography scale, semantic states).

## 11. Future Enhancements (Non-blocking)
1. Session Spiral Timeline: Multi-session overlay showing change vectors (ΔACCE, ΔAERO, ΔLFI).
2. Adaptive Coaching Panel: Uses style + backup + LFI to suggest next experiential loop activities (refer HCI roadmap).
3. Offline Mode: Local caching of ranking steps with eventual sync.
4. Team Style Diversity Metric: Shannon entropy → UI explanation card.
5. Cohort Compare: Bandingkan dua tim/kelas pada grid gaya & distribusi LFI.
6. PDF Export: Cetak laporan individual dan ringkasan tim (EN/ID).

## 12. Academic References (Inline Citations)
- Kolb, A.Y. & Kolb, D.A. (2013) – KLSI 4.0 Guide (scoring formulas, style grid, LFI computation).
- Forced-choice measurement reliability discussions (cited generically; ensure not reproducing proprietary text).
- AERA/APA/NCME Standards – Justification for provenance & transparency components.

## 13. Accessibility & Internationalization Checklist
| Item | Status | Notes |
|------|--------|-------|
| Keyboard ranking reorder | Planned | Arrow keys reorder list; announce new rank ARIA. |
| Screen reader alt for charts | Planned | Provide textual summary of kite (e.g., “AC 38 highest, CE 21 lowest”). |
| Indonesian & English toggle | Planned | Language switcher top-right; caches preference. |
| High contrast mode | Planned | Token set alternate (increases text color vs background). |

## 14. Risk & Mitigation Summary
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Misinterpretation of percentiles as performance | Reduces psychological safety | Neutral wording & help tooltips clarifying descriptive intent. |
| Drag interaction inaccessible | Excludes keyboard-only users | Provide alternative rank selectors (numeric segmented control). |
| Overload analytics for students | Cognitive load | RoleGuard hides advanced analytics unless mediator. |
| Backup style misused as dual labeling | Identity rigidity | Tooltip framing & collapsed secondary emphasis. |

## 15. Completion & Quality Gates
This specification adds documentation only. No code paths altered.
- Build: PASS (no build changes)
- Lint/Typecheck: PASS (docs unaffected)
- Tests: PASS (existing 55 tests unchanged)

Security/Auth & Seeding Notes:
- Auth: JWT HS256 dengan `sub=user.id`; domain mahasiswa diverifikasi via `settings.allowed_student_domain`.
- RBAC: Admin/Mediator diperlukan untuk import norma, tim, research analytics.
- Seeding: Pada startup (`app.main` lifespan) memanggil `seed_learning_styles()` dan `seed_assessment_items()`; aman untuk idempotent lokal/dev.

## 16. Summary
Dokumen ini mendefinisikan desain UI berbasis model mental pengguna yang mencerminkan pipeline psikometrik KLSI 4.0 secara transparan, mengintegrasikan prinsip Fluent 2 & iOS modern dalam visual, dan menjaga fidelity akademis melalui komponen yang memaparkan proses (ranking, dialektika, fleksibilitas) secara netral. Implementasi mengikuti pemisahan konseptual entitas backend sehingga setiap representasi frontend dapat ditelusuri ke satu sumber data terverifikasi.

## 17. Learning Session Designs (Recommendations)
Seksi ini mengangkat rekomendasi aktivitas berbasis gaya dari `app/data/session_designs.py`.

- Sumber data: `designs[]` (kode, judul, ringkasan, gaya yang diaktifkan, durasi) dan `recommend_for_primary(primary, backup, limit)`.
- UI: Halaman `/designs` menampilkan hasil rekomendasi berdasar gaya utama dan (opsional) gaya cadangan; sertakan filter “stretch targets” untuk menstimulasi zona kurang dominan (lihat `STRETCH_SUGGESTIONS`).
- Akses: Terbuka untuk semua peran; konten ditulis ulang orisinal sehingga aman hak cipta.

## 18. Team Rollups & Research Analytics (Details)
### Team Rollups
- Endpoint: `GET /teams/{team_id}/rollup` → ringkasan harian: `total_sessions`, `avg_lfi`, `style_counts`, centroid `ACCE/AERO`, dan statistik provenance norma.
- Gunakan sampel `docs/sample_api_payloads/team_rollup.sample.json` sebagai pedoman struktur.

### Research Analytics
- Endpoint: `GET /research/lfi-regression-curve` → kurva terprediksi hubungan intensitas gaya (|ACCE|+|AERO|) vs LFI (inverted‑U), lengkap dengan `r2` dan `method`.
- Gunakan sampel `docs/sample_api_payloads/research_curve.sample.json`.

### What‑If Scoring Sandbox
- Endpoint: `POST /score/sandbox` → hitung koordinat dan tipe gaya tanpa menyimpan. Cocok untuk edukasi dan demonstrasi perubahan skor.
