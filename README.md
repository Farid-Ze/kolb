# KLSI 4.0 API – Implementasi Berbasis Dokumen Resmi

## 1. Tujuan
Platform ini mengeksekusi asesmen Kolb Learning Style Inventory versi 4.0 secara ketat sesuai teori dan spesifikasi psikometrik resmi: pengumpulan data ipsatif (ranking 1–4), perhitungan skor dasar (CE, RO, AC, AE), dialektika (ACCE = AC−CE; AERO = AE−RO; tambahan kombinasi klasik), klasifikasi 9 gaya (Fig. 4–5), Learning Flexibility Index (LFI = 1 − Kendall’s W; Appendix 7), serta konversi raw→percentile (Appendix 1) dengan provenance (Database vs Appendix fallback).

## 2. Rasional Akademis (Tidak Dapat Diperdebatkan)
| Dimensi | Implementasi | Sumber Dokumen |
|---------|--------------|----------------|
| Empat mode ELT | Tabel `scale_scores` (CE, RO, AC, AE) | Teori ELT Kolb 1984 (Experiencing, Reflecting, Thinking, Acting) |
| Dialektika perbedaan | `combination_scores` menyimpan ACCE, AERO, assimilation_accommodation, converging_diverging | KLSI Guide halaman formula (page 41), Figures 4–5 |
| 9 gaya belajar | Window numerik `learning_style_types` (ACCE & AERO band: Low/Mid/High) | Refinement KLSI 4.0 (Eickmann, Kolb & Kolb 2004) |
| Fleksibilitas belajar | Kendall’s W → LFI = 1 − W | Chapter 6 + Appendix 7 |
| Konversi percentiles | Preferensi DB (`normative_conversion_table`) → fallback `app/data/norms.py` | Appendix 1, Appendix 7 |
| Provenance norma | Kolom `norm_group_used` (Database vs AppendixFallback) | Standar transparansi AERA/APA/NCME |
| Auditabilitas | Tabel `audit_log` (hash payload finalisasi & impor norma) | Standards for Educational & Psychological Testing (1999) |
| Ipsative integrity | Constraint UNIQUE + CHECK di `user_responses` | Format KLSI forced-choice |
| HCI proses bukan hasil | Laporan menunda interpretasi sampai finalisasi | Proposisi ELT #1 (learning as process) |

Semua formula, cutpoint, dan transformasi dipecah menjadi tahap tersendiri untuk memfasilitasi studi reliabilitas (test–retest, konsistensi internal difference score) dan validitas eksternal (demografi Appendix 2–5 dapat ditambah melalui subgroup norms).

## 3. Arsitektur Data
Dokumentasi lengkap ada di `docs/02-relational-model.md` dan `docs/psychometrics_spec.md`. Setiap tingkat transformasi: Responses → Mode → Dialektika → Style → Percentiles → LFI direkam. Ini memenuhi prinsip reproducibility dan memungkinkan verifikasi ulang algoritmik vs stored snapshot.

## 4. Alur Pengguna
1. Registrasi (role otomatis: MAHASISWA jika domain cocok; else MEDIATOR).
2. Start session (JWT, audit jejak).
3. Isi 12 item gaya (ranking 1–4 unik per item).
4. Isi 8 konteks LFI (ranking 1–4 per konteks; variasi preferensi).
5. Finalisasi → hitung raw, dialektika, gaya utama & cadangan, LFI, percentiles, audit hash.
6. Ambil report JSON (kite + dialectic + provenance norma + intensitas gaya + fleksibilitas).

## 5. Komponen Kode
| File | Fungsi Utama |
|------|--------------|
| `app/models/klsi.py` | Definisi skema ORM terpisah per tahap transformasi |
| `app/services/scoring.py` | Pipeline finalisasi, klasifikasi gaya, LFI, provenance norma |
| `app/data/norms.py` | Fallback Appendix 1 & 7 percentile dictionaries |
| `app/services/report.py` | Kompilasi laporan (kite, backup, sumber norma) |
| `app/routers/admin.py` | Import norma dengan validasi monotonic, idempotent upsert, audit |
| `app/routers/engine.py` | Operasi sesi generik berbasis instrumen (KLSI via Engine) |
| `docs/psychometrics_spec.md` | Kontrak matematis resmi |
| `docs/hci_model.md` | Model mental & HCI berlandaskan ELT |

## 5.1 Konvensi Label Subgroup Norms (Appendix 2–5)
Gunakan label berikut saat impor CSV ke `normative_conversion_table` (kolom `norm_group`):

- Education Level: `EDU:<label Appendix>` (contoh: `EDU:University Degree`, `EDU:Master's Degree`)
- Age band: `AGE:<band Appendix>` (contoh: `AGE:19-24`, `AGE:35-44`)
- Gender: `GENDER:<Male|Female|Other|Prefer not to say>`
- Global: `Total`

Pipeline akan mencoba EDU → AGE → GENDER → Total sebelum fallback Appendix lokal. Sumber yang dipakai dicatat di `percentile_scores.norm_group_used`.

## 6. HCI Ringkas (Lihat `docs/hci_model.md`)
- Format forced-choice menjaga dialektika preferensi (experience vs conceptualization; action vs reflection).
- Progress bar & keterlambatan hasil mencegah shaping jawaban (mengurangi bias adaptasi).
- Visualisasi: kite chart + overlay ACCE/AERO + intensitas + kategori fleksibilitas.
- Provenance norma jelas agar interpretasi percentile kontekstual.

## 7. Keamanan & Audit
- JWT HS256; sub → user id; domain mahasiswa diverifikasi terhadap `allowed_student_domain`.
- RBAC: Import norma dibatasi MEDIATOR; sesi hanya owner.
- Audit hash (SHA-256) finalisasi & import untuk integritas sumber.

### 7.1 Rotasi SECRET_KEY (Disarankan)
- Gunakan key acak minimal 32 byte.
- Rencanakan rotasi berkala (mis. triwulan) dengan grace period: jalankan dua key bersamaan (current + previous) lalu cabut previous.
- Dokumentasikan waktu rotasi dan dampaknya pada sesi aktif (token lama bisa kadaluwarsa lebih cepat selama jendela rotasi).

## 8. Validasi & Tes
Tes unit (pytest) mencakup:
- Kendall’s W ekstrem (identik vs terdispersi) → LFI batas.
- Boundary ACCE (5/6, 14/15) & AERO (0/1, 11/12) → transisi gaya.
- Fallback percentile (raw di bawah/atas range & key hilang) → nearest-lower konservatif.
Rencana lanjutan: uji deterministik backup style jarak L1 & reliabilitas test–retest.

### 8.2 Contoh CSV Import Norma
Lihat `docs/examples/norm_import.sample.csv` untuk format:
```
norm_group,scale_name,raw_score,percentile
Total,CE,12,5.2
EDU:University Degree,LFI,60,48.0
```
Catatan: Percentile harus non-decreasing terhadap `raw_score` per `(norm_group, scale_name)`.

## 8.1 Dokumentasi Tambahan
- `docs/03-klsi-overview.md` — Ringkasan tujuan, sejarah versi (LSI 1→KLSI 4.0), penambahan kunci 4.0 (9 gaya, fleksibilitas, laporan interpretatif, psikometrik), dan etika penggunaan.
- `docs/05-learning-styles-theory.md` — Teori gaya belajar ELT (9 gaya), dialektika dan indeks kombinasi (ACCE, AERO, Assim−Acc, Conv‑Div) beserta metrik keseimbangan (BALANCE_ACCE, BALANCE_AERO).
- `docs/06-enhanced-lfi-analytics.md` — Analitik fleksibilitas (profil konteks, heatmap, prediksi perkembangan integratif) untuk MEDIATOR.
- `docs/04-learning-space.md` — Dimensi ruang belajar ELT (fisik, kultural, institusional, sosial, psikologis) dan prinsip desain ruang yang mendukung siklus pengalaman.
- `docs/07-learning-spiral-development.md` — Spiral belajar & perkembangan dewasa (akuisisi–spesialisasi–integrasi), level deep learning, dan heuristik klasifikasi di laporan.
- `docs/08-learning-flexibility-deliberate-practice.md` — Fleksibilitas belajar, identitas belajar, mindfulness, dan deliberate practice + cara sistem memberi rekomendasi meta-learning.
- `docs/09-educator-roles.md` — Peran pendidik (Facilitator/Expert/Evaluator/Coach) & pola sequencing untuk mengajar mengelilingi siklus belajar.

## 9. Ekstensi Akademis (Roadmap)
| Rencana | Rasional |
|---------|---------|
| Subgroup norms (Age/Gender/Education) | Mengaktifkan analisis invariance sesuai Appendix 2–5 |
| Statistik reliabilitas (Cronbach α difference pattern) | Mendukung bukti internal consistency (Chapter 4) |
| Analisis validitas eksternal (korelasi LFI vs intensitas gaya) | Memetakan adaptasi fleksibilitas terhadap diferensiasi |
| PDF bilingual report (EN/ID) | Aksesibilitas & diseminasi hasil |
| Z-score & effect size modul | Dukungan riset lanjut per band demografis |

## 10. Menjalankan Secara Lokal
```powershell
# Install deps
pip install -r requirements.txt

# Terapkan migrasi skema (disarankan untuk dev & prod)
alembic upgrade head

# Jalankan server
uvicorn app.main:app --reload
```
Swagger: http://localhost:8000/docs
## 11.1 Contoh Alur Engine (Disarankan; Sessions legacy dihapus)

```http
POST /engine/sessions/start
Body: {"instrument_code":"KLSI","instrument_version":"4.0"}
→ {"session_id": 123}

GET /engine/sessions/{session_id}/delivery?locale=id
→ Paket item (12 gaya + 8 konteks LFI)

POST /engine/sessions/{session_id}/interactions
Body (item): {"kind":"item","item_id":1,"ranks":{"CE":4,"RO":2,"AC":1,"AE":3}}
Body (context): {"kind":"context","context_name":"Starting_Something_New","CE":4,"RO":2,"AC":1,"AE":3}

POST /engine/sessions/{session_id}/submit_all
Body: SessionSubmissionPayload (12 items + 8 contexts)
→ Atomic finalize: ACCE/AERO, gaya, LFI, percentiles, provenance

POST /engine/sessions/{session_id}/finalize
→ Alternatif finalize jika tidak menggunakan batch submit_all

GET /engine/sessions/{session_id}/report
→ Ringkasan laporan (kite, konteks LFI, dll.)
```


## 12. Docker
```powershell
docker compose up --build
```

## 13. Seed & Startup (Rekomendasi)
Gunakan Alembic untuk mengelola skema dan seed awal di lingkungan produksi. Untuk keperluan pengembangan cepat, aplikasi menyediakan toggle startup berikut (lihat `app/core/config.py`):

- `RUN_STARTUP_DDL` (default: 1) — `Base.metadata.create_all()` untuk dev; nonaktifkan di prod
- `RUN_STARTUP_SEED` (default: 1) — seed instrument KLSI 4.0 & item; nonaktifkan di prod

Rekomendasi:
- Dev: biarkan default (cepat dan idempotent)
- Prod/CI: set ke 0 dan jalankan Alembic

```powershell
# Contoh prod/CI
$Env:RUN_STARTUP_DDL = 0
$Env:RUN_STARTUP_SEED = 0
alembic upgrade head
```

Import norma lakukan via endpoint admin (`POST /admin/norms/import`) dengan CSV sesuai contoh pada `docs/examples/norm_import.sample.csv`.

## 14. Referensi
- Kolb, D. A. (1984). Experiential Learning.
- Kolb, A. Y., & Kolb, D. A. (2013). KLSI 4.0 Guide (Appendix 1, 7; Figures 4–5).
- AERA/APA/NCME (1999). Standards for Educational and Psychological Testing.
- Kendall, M. G. (1948). Rank Correlation Methods.

## 15. Sumber Akademis & Keterbukaan
Implementasi ini didasarkan pada publikasi ilmiah open-source "The Kolb Learning Style Inventory 4.0 - Guide to Theory, Psychometrics, Research & Applications" oleh Alice Y. Kolb & David A. Kolb (2013), yang tersedia secara publik untuk tujuan penelitian dan pendidikan.

Dokumen sumber tersedia di: https://www.researchgate.net/publication/303446688

Semua konten KLSI 4.0, formula, dan spesifikasi psikometrik diambil langsung dari karya akademis yang dipublikasikan ini, memastikan kesetiaan penuh terhadap penelitian asli.

## 16. Pernyataan Epistemik
Semua keputusan implementasi merujuk langsung pada sumber primer; tidak ada interpolasi percentile kecuali strategi konservatif nearest-lower saat data hilang (ditandai sebagai fallback). Provenance norma dicatat guna menghindari kesalahan inferensi statistik.

---
Status pengembangan lanjutan fokus pada penambahan subgroup norms dan analisis reliabilitas lanjutan. Silakan lihat dokumen spesifikasi di folder `docs/` untuk penelusuran penuh.

## 16. Limitations (Penting untuk Interpretasi)
- Skor bersifat ipsatif (forced-choice); perbandingan lintas individu harus hati-hati karena skala tidak aditif.
- Koefisien reliabilitas tradisional (mis. Cronbach’s α) pada difference scores memiliki keterbatasan; gunakan metrik yang sesuai konteks.
- Percentile fallback dari Appendix menggunakan nearest-lower; bila rentang raw tidak tercakup, interpretasi harus menyebutkan keterbatasan sumber norma.
- Alat ini bersifat non-diagnostik; gunakan sebagai dukungan refleksi dan perancangan pengalaman belajar, bukan pengkategorian deterministik.

### 16.1 Provenance & External Norm Provider
- Ketika tersedia, sistem dapat menggunakan penyedia norma eksternal (HTTP) setelah DB dan sebelum Appendix. Status ini dicatat per skala pada `percentile_scores.norm_provenance` dan diringkas di `norm_group_used`.
- Konfigurasi environment:
    - `EXTERNAL_NORMS_ENABLED` (0/1)
    - `EXTERNAL_NORMS_BASE_URL`
    - `EXTERNAL_NORMS_TIMEOUT_MS` (default 1500)
    - `EXTERNAL_NORMS_API_KEY` (opsional)
    - `EXTERNAL_NORMS_CACHE_SIZE` (default 512)
    - `EXTERNAL_NORMS_TTL_SEC` (default 60) — TTL cache untuk hasil positif/negatif dari penyedia eksternal

Perilaku kinerja:
- Pencarian eksternal bersifat non-blocking pada jalur request: ketika cache dingin, sistem segera melanjutkan ke fallback berikutnya (Appendix) sambil menjadwalkan fetch di background untuk menghangatkan cache.
- Hasil eksternal (include miss/404) disimpan sementara (TTL) agar tidak terjadi repeated calls.

Endpoint admin terkait:
- `GET /admin/norms/cache-stats` — Statistik LRU cache untuk lookup norma DB (in-process).
- `GET /admin/norms/external-cache-stats` — Statistik TTL cache penyedia norma eksternal (hits/misses, ukuran cache, TTL, metrik jaringan).

Catatan implementasi: Rantai penyedia norma dibangun melalui engine (DB → External [opsional] → Appendix). Provenance per skala tersedia di hasil finalisasi sebagai `DB:<group>|<version>`, `External:<group>|<version>`, atau `Appendix:<scale>`.

Anomali yang ditandai pada finalisasi (hanya informasi, tidak mengubah skor):
- RAW_OUTSIDE_NORM_RANGE, EXCESSIVE_TRUNCATION, MIXED_PROVENANCE
- LOW_W_PATTERN, HIGH_W_UNIFORMITY
- LFI_REPEATED_PATTERN_6PLUS / 7PLUS
- NEAR_STYLE_BOUNDARY

## 17. Performance Metrics (Eksperimental)
Sistem sekarang mengumpulkan timing sederhana untuk jalur panas penilaian dan lookup norma:

Label utama:
- `pipeline.klsi4.finalize` – durasi end-to-end finalisasi KLSI 4.0 (ms)
- `norms.db.percentile.<SCALE>` – waktu lookup percentile di cache DB
- `norms.appendix.percentile.<SCALE>` – waktu fallback Appendix
- `norms.external.fetch` – waktu HTTP fetch penyedia norma eksternal (termasuk network)
- `norms.external.percentile.<SCALE>` – waktu lapisan eksternal per skala

### 17.1 Cached Composite Norm Provider (Batch + LRU)

Untuk menghapus pola N+1 pada konversi persentil, sistem menambahkan provider cache berfitur:

- Batch lookup per precedence chain (EDU→COUNTRY→AGE→GENDER→Total) untuk semua kebutuhan skala sesi (CE, RO, AC, AE, ACCE, AERO)
- Pre-warm via `prime()` agar semua lookup downstream menjadi cache hit
- LRU cache per-proses, aman karena tabel norma bersifat read-only saat runtime

Feature flag:

```powershell
$Env:CACHED_NORM_PROVIDER_ENABLED = 1   # default; set 0 untuk mematikan saat troubleshooting
```

Label metrik tambahan:

- Timing: `norms.cached.batch.percentile_many`
- Counters: `norms.cached.prime`, `norms.cached.batch.query`, `norms.cached.cache_hit`, `norms.cached.single.lookup`, `norms.cached.appendix_fallback`

Interpretasi cepat:

- Rasio `cache_hit` tinggi → batch pre-warm efektif, N+1 dihilangkan
- `batch.query` ≈ jumlah group yang berhasil diselesaikan di rantai precedence
- `single.lookup` rendah → jalur non-batch jarang (edge cases)
- `appendix_fallback` tinggi → pertimbangkan menambah baris norma di DB

Endpoint:
```http
GET /admin/perf-metrics?reset=false
Authorization: Bearer <token MEDIATOR>
```
Response:
```json
{
    "timings": {
        "pipeline.klsi4.finalize": {"count": 12, "total_ms": 845.2, "max_ms": 96.7},
        "norms.db.percentile.CE": {"count": 12, "total_ms": 5.3, "max_ms": 1.2}
    },
    "norm_db_cache": {"hits": 120, "misses": 12, "currsize": 240, "maxsize": 4096},
    "external_norm_cache": {"hits": 18, "misses": 6, "network_success": 6, "network_error": 0}
}
```

Gunakan parameter `reset=true` untuk menghapus counter setelah dibaca (monitoring interval). Data disimpan in‑process; reset saat restart.

Catatan:
- Instrumentasi tidak memodifikasi logika skor psychometric.
- Overhead sangat rendah (perf_counter + dict update).
- Cocok untuk baseline tuning sebelum menambah observability lebih kaya (Prometheus dsb.).
