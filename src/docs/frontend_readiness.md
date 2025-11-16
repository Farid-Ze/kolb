# Validasi Konseptual & Spesifikasi Instrumen (Pra-Frontend)

Bagian ini memenuhi kebutuhan TODO 181: memastikan seluruh fondasi akademik KLSI 4.0 sudah terdokumentasi dan diverifikasi **sebelum** tim frontend (FastAPI/React) mulai mengimplementasikan UI.

## 1. Kunci Teoretis Harus Tertulis & Disepakati

- **Sumber otoritatif utama**
  - `The Kolb Learning Style Inventory 4.0 - Guide to Theory, Psychometrics, Research & Applications.md` (root repository).
  - `docs/psychometrics_spec.md` (ringkasan internal jalur perhitungan, mengikuti panduan Kolb 4.0).
- **Konstruksi yang wajib dicakup**
  - Mode belajar: Concrete Experience (**CE**), Reflective Observation (**RO**), Abstract Conceptualization (**AC**), Active Experimentation (**AE**). Lihat `docs/psychometrics_spec.md §1.1` dan `app/assessments/klsi_v4/definition.py`.
  - Dialektik utama: **ACCE = AC_raw − CE_raw**, **AERO = AE_raw − RO_raw**. Dijelaskan di `docs/psychometrics_spec.md §1.2` dan dikodekan di `app/assessments/klsi_v4/calculations.py::calculate_combination_metrics`.
  - Learning Flexibility Index (**LFI**): diturunkan dari koefisien Kendall’s W (lihat `docs/psychometrics_spec.md §2` dan `app/assessments/klsi_v4/logic.py::compute_learning_flexibility`).
  - Learning style grid + balance: rujuk `docs/psychometrics_spec.md §3` serta konfigurasi window di `app/assessments/klsi_v4/config.yaml` dan `app/services/seeds.py::seed_learning_styles`.
- **Tujuan interpretasi**
  - Harus ditegaskan dalam dokumentasi UI dan laporan bahwa KLSI 4.0 adalah **instrumen formatif** untuk refleksi belajar dan desain pedagogi, **bukan** alat diagnostik klinis/seleksi. Referensi narasi resmi: `The Kolb ... Guide` dan `docs/psychometrics_spec.md §0.3`.

## 2. Definisi Skor & Rumus Tidak Ambigu

Semua skor yang akan muncul di UI harus memiliki definisi matematis eksplisit dan domain interpretasi. Rekomendasi pencatatan:

| Skor                | Rumus / Implementasi                                    | Rentang & Interpretasi                                                                                                                                                   | Sumber Kode |
|---------------------|----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| CE_raw, RO_raw, AC_raw, AE_raw | Penjumlahan rank 1–4 per mode dari 12 item (ipsative). | Setiap mode berada di rentang 12–48 (12 item × nilai 1–4). Nilai lebih tinggi menunjukkan preferensi relatif terhadap mode tersebut.                                     | `app/assessments/klsi_v4/logic.py::aggregate_mode_scores` |
| ACCE                | `AC_raw - CE_raw`.                                       | Rentang teoretis −36…+36. Bandingkan dengan cutoff Low (≤5), Mid (6–14), High (≥15) sebagaimana di `docs/psychometrics_spec.md §3`.                                       | `app/assessments/klsi_v4/calculations.py` |
| AERO                | `AE_raw - RO_raw`.                                       | Rentang −36…+36. Band definisi Low (≤0), Mid (1–11), High (≥12).                                                                                                         | `app/assessments/klsi_v4/calculations.py` |
| LFI                 | `1 - W`, di mana `W = (12 × S) / (m² × (n³ - n))`, `m=8` konteks, `n=4` mode, `S = Σ(R_j - R̄)²`. | Nilai 0–1. Panduan interpretasi: rendah (<0.45) → perlu latihan rotasi siklus, sedang (0.45–0.69), tinggi (≥0.70).                                                       | `docs/psychometrics_spec.md §2`, `app/assessments/klsi_v4/logic.py::compute_learning_flexibility` |
| Balance heuristics  | `BAL_ACCE = |ACCE - 9|`, `BAL_AERO = |AERO - 6|` lalu `P_BAL = 100 × (1 - distance/threshold)` (clamped). | Persentase heuristik (0–100). Disebut eksplisit **non-normatif** dalam `docs/psychometrics_spec.md §2.1` dan pesan i18n `ReportBalanceMessages.NOTE`.                     | `app/assessments/klsi_v4/logic.py::compute_balance_percentiles` |

Pastikan setiap tampilan frontend memiliki tautan atau tooltip ke definisi di atas, sehingga pengguna paham arti angka tinggi/rendah.

## 3. Norma & Kelompok Normatif Terdokumentasi

- **Sumber norm**
  - Data norm dari hasil studi Kolb terbaru (lihat lampiran di `The Kolb ... Guide`).
  - Jika memakai norm internal, catat populasi, jumlah responden, tahun pengambilan, dan kriteria inklusi di `docs/psychometrics_spec.md §4`.
- **Norm precedence chain**
  - Implementasi resmi berada di `app/assessments/klsi_v4/logic.py::resolve_norm_groups` dan `app/engine/norms/factory.py`. Urutan wajib:
    1. `EDU:<education_level>`
    2. `COUNTRY:<country>`
    3. `AGE:<band>`
    4. `GENDER:<gender>`
    5. `Total`
    6. Appendix / fallback (lihat `app/data/norms.py`)
  - Dokumentasi harus menjelaskan justifikasi akademiknya (per Kolb 4.0): prioritas berdasarkan dampak terbesar terhadap distribusi skor.
- **Traceability**
  - Frontend harus mampu menampilkan metadata penting dari backend (`PercentileScore.norm_group_used`, `norm_provenance`, `used_fallback_any`, `raw_outside_norm_range`). Cantumkan referensi ini di pengantar UI agar auditor tahu bahwa setiap skor memiliki sumber norm jelas.

## 4. Checklist Validasi (Sebelum Frontend Coding)

1. Sudah ada ringkasan tertulis (1–2 halaman) yang mengutip `The Kolb ... Guide` dan `docs/psychometrics_spec.md` untuk menjelaskan konstruk & tujuan interpretasi.
2. Tabel rumus di atas sudah ditempel (atau ditautkan) di dokumen internal yang akan dibaca tim frontend.
3. Dokumen norm mencantumkan: sumber, N, tahun, dan jalur fallback (EDU→…→Appendix) beserta alasannya.
4. QA memastikan pesan UI tidak mengklaim hal di luar batas interpretasi (misal tidak menyebut “diagnosis”).
5. Checklist ini dipenuhi dan ditandatangani (oleh product owner / scientific lead) sebelum task frontend apa pun dimulai.

## 5. Validitas, Reliabilitas & Batas Interpretasi (TODO 182)

### 5.1 Ringkasan Bukti Reliabilitas

| Komponen | Temuan Utama | Rujukan Kode / Dokumen | Implikasi Frontend |
|----------|--------------|------------------------|--------------------|
| Internal consistency | Kolb 4.0 melaporkan Cronbach α mode CE/RO/AC/AE berada di kisaran **0.79–0.84** dengan rata-rata **0.81** (Guide Table 3). | `docs/01-entity-relationship-model.md §1.17`, `The Kolb ... Guide Table 3`. | Taruh catatan “Internal consistency α≈0.81” pada tab reliabilitas laporan agar pengguna tahu tingkat keandalan skala. |
| Test–retest | Studi retest 5–8 minggu menunjukkan korelasi stabil untuk mode dan dialektik; style agreement diukur dengan **Cohen’s κ** untuk memastikan konsistensi kategori. | `docs/01-entity-relationship-model.md §1.17`, `app/models/reliability_study.py` (jika dibuat). | UI harus menyebutkan bahwa perubahan gaya antar retest bisa muncul karena ELT menekankan adaptasi kontekstual; hindari bahasa “tetap selamanya”. |
| Measurement audits | Entitas `RELIABILITY_STUDY` (lihat `docs/01-entity-relationship-model.md §1.17`) menyimpan α, retest r, dan κ sehingga backend dapat mengirimkan angka aktual bila tersedia untuk populasi lokal. | `app/services/report.py` (bagian penyusunan payload laporan) + tabel reliabilitas pada DB ketika diimplementasikan. | Sediakan placeholder di laporan untuk “Data reliabilitas populasi lokal” sehingga mudah diperbarui ketika studi internal selesai. |

### 5.2 Bukti Validitas Konstrak & Kriteria

- **Korelasi antar-versi**: KLSI 4.0 vs 3.1 memiliki korelasi rata-rata **r = 0.92** (Guide Table 6), memastikan kontinuitas konstruk. Backend dapat menampilkan referensi ini ketika pengguna menanyakan kompatibilitas versi lama.
- **Pola demografis konsisten**: Tren peningkatan AC−CE seiring usia, perbedaan gender (laki-laki lebih abstrak) dan efek latar pendidikan dicatat dalam `docs/01-entity-relationship-model.md §1.18`. Ini menguatkan validitas konstruk ELT bahwa pengalaman dan konteks akademik memengaruhi preferensi belajar.
- **Validitas kriteria/konkuren**: Kolb mengaitkan skor dengan performa di konteks kerja, akademik, dan kreativitas (lihat `docs/psychometrics_spec.md §4`). Catat contoh (mis. gaya Converging cenderung di STEM) di bagian laporan rekomendasi tetapi selalu ditemani disclaimer “korelasi, bukan determinasi”.
- **Tracking studi internal**: Simpan metadata studi di tabel `validity_study` (tipe, instrumen pembanding, koefisien). Frontend hanya menampilkan studi yang sudah disetujui scientific lead untuk menghindari klaim premature.

### 5.3 Batas Interpretasi & Pesan Pengguna

1. **Instrumen formatif**: Semua layar harus memuat pernyataan eksplisit bahwa KLSI 4.0 digunakan untuk refleksi dan desain pembelajaran, **bukan** seleksi kerja atau diagnosis klinis. Referensi: `docs/psychometrics_spec.md §0.3`, `The Kolb ... Guide Introduction`.
2. **Balance percentiles**: Tegaskan kembali bahwa `P_BAL_ACCE` dan `P_BAL_AERO` adalah heuristik jarak ke pusat normatif (lihat `app/i18n/id_messages.py::ReportBalanceMessages.NOTE`). Tooltip wajib menyebut “bukan persentil populasi normatif”.
3. **Standar AERA/APA/NCME**: Laporkan penggunaan sesuai standar: jelaskan apa yang boleh disimpulkan (preferensi belajar dalam konteks) dan apa yang tidak (mis. tidak memprediksi kepribadian). Tambahkan link pendek ke ringkasan standar di laporan digital.
4. **Guidance untuk mediator**: UI report/educator dashboard perlu menyertakan panel “Cara menggunakan hasil secara etis” yang menyarankan diskusi reflektif, bukan pelabelan permanen. Ini memastikan interpretasi mengikuti spirit ELT tentang fleksibilitas.

Checklist TODO 182 dianggap terpenuhi ketika:
- Bagian ini disisipkan di dokumen onboarding frontend dan direview oleh scientific lead.
- Komponen UI yang menampilkan reliabilitas/validitas memiliki tautan ke referensi di atas.
- Pesan peringatan tentang penggunaan non-diagnostik dan heuristik balance aktif di laporan.

## 6. Spesifikasi Data & Privasi (TODO 183)

### 6.1 Klasifikasi Data

| Jenis Data | Klasifikasi | Dasar | Kontrol Implementasi |
|------------|-------------|-------|----------------------|
| Respons item KLSI (12 item ipsatif, konteks LFI) | Data psikologis & pendidikan **semi-sensitif** | Menggambarkan preferensi belajar; tunduk pada UU PDP & prinsip AERA/APA data daring. | Simpan terenkripsi at-rest; akses hanya via layanan engine; audit log setiap query (`assessment_session_id`). |
| Skor turunan (CE/RO/AC/AE, ACCE/AERO, gaya, LFI, percentile) | Data psikometrik turunan | Memungkinkan inferensi karakteristik belajar. | Labeli sebagai `PII-Semiprivate`; hanya dosen/coach berwenang yang disetujui dapat melihat; mask saat dikirim untuk analitik umum. |
| Metadata peserta (nama, email institusi, gender, tanggal lahir, program studi) | PII (identitas langsung) | Dibutuhkan untuk resolusi norm & laporan personal. | Disimpan di tabel `users`; tampil hanya di dashboard admin dengan RBAC; wajib consent eksplisit. |
| Log penggunaan, event metrics, provenance hash | Data operasional non-PII | Untuk audit integritas. | Dapat disimpan lebih lama; pastikan tidak menyimpan konten respons. |
| Data penelitian teragregasi / anonimisasi | Data terproteksi rendah | Tidak dapat ditelusuri ke individu. | Gunakan agregasi minimum 10 responden; hapus identifier sebelum ekspor. |

### 6.2 Kebijakan Consent & Penggunaan

#### Teks Consent Mahasiswa (ditampilkan sebelum assessment)

```
Saya memahami bahwa KLSI 4.0 digunakan untuk membantu refleksi belajar dan perancangan aktivitas kelas. Hasil saya dapat diakses oleh dosen fasilitator dan tim pengembangan pembelajaran yang ditunjuk. Data tidak digunakan untuk penilaian nilai akademik atau seleksi kerja. Saya dapat meminta salinan hasil kapan saja dan menarik izin penggunaan untuk penelitian kapan pun.
```

Implementasi:
- Simpan `consent_version_id` pada `assessment_session`; lampirkan timestamp.
- Frontend wajib menampilkan link “Pelajari lebih lanjut” ke ringkasan AERA/APA/NCME.

#### Teks Consent Penelitian / Batch Research

```
Data KLSI 4.0 Anda akan dianonimkan (nama/email dilepas, hanya kode responden) sebelum dianalisis. Hasil dipakai secara agregat untuk riset pedagogi dan tidak akan mengidentifikasi individu. Anda dapat menarik persetujuan kapan saja; data yang sudah dianonimkan akan dipertahankan dalam bentuk agregat namun tidak lagi ditautkan ke identitas Anda.
```

Implementasi tambahan:
- Sediakan checkbox terpisah “Izinkan penggunaan anonim untuk penelitian”.
- Endpoint batch (`/teams/{id}/batch-scores`, `/research/batches`) harus mengecek flag consent sebelum memasukkan data ke dataset riset.
- Dokumentasikan mekanisme pseudonimisasi (mis. hash salted session_id) di `docs/data_governance.md` (buat jika belum ada).

### 6.3 Retensi & Hak Peserta

| Artefak | Retensi Maksimum | Catatan |
|---------|------------------|---------|
| Respons mentah + skor personal | 5 tahun setelah sesi terakhir atau 1 tahun setelah lulusan (pilih yang lebih awal). | Dihapus otomatis via job `purge_assessment_data`; peserta bisa minta hapus lebih cepat. |
| Audit log & hash finalisasi | 7 tahun (kebutuhan audit program). | Tidak mengandung konten respons; boleh disimpan lebih lama untuk kepatuhan. |
| Dataset penelitian anonim | Hingga 10 tahun selama tetap agregat. | Tidak dapat dihapus karena sudah tidak dapat ditautkan; komunikasikan hal ini di consent. |

Hak peserta yang wajib difasilitasi melalui UI/backend:
1. **Right to Access** – unduh laporan PDF + data skor mentah (JSON) setiap saat.
2. **Right to Erasure** – permintaan hapus memicu queue yang membersihkan respons & skor terkait (kecuali data sudah dianonimkan permanen).
3. **Right to Rectification** – jika metadata (nama, demografi) salah, peserta dapat memperbarui sebelum finalisasi sesi.
4. **Right to Withdraw Research Consent** – toggle terpisah untuk menarik izin riset tanpa menghapus laporan personal.
5. **Right to Explanation** – UI jelaskan logika pengambilan keputusan (norm precedence, penentuan gaya) dengan tautan ke dokumen di atas.

Checklist TODO 183 selesai bila:
- Consent text tertanam di modal onboarding assessment & batch research workflow.
- RBAC memastikan hanya peran berwenang yang bisa melihat data semi-sensitif.
- SOP retensi tertulis dan job otomatis purge dijadwalkan; fitur permintaan hak peserta tersedia atau paling tidak direncanakan dengan tiket terperinci.

### 6.4 Link Bantuan Kontekstual

- Modal onboarding mahasiswa harus menyertakan tautan eksplisit ke panduan `docs/guides/student_profile.md` (alias "Cara Membaca Profil Anda").
- Panel edukator/mediator menampilkan CTA "Baca panduan penggunaan bertanggung jawab" yang mengarah ke `docs/guides/educator_responsible_use.md`.
- Untuk lokalisasi, tautan ini harus mendukung suffix locale (`student_profile.id.md`, `student_profile.en.md` apabila tersedia). Lihat §11 untuk strategi translasi.

### 6.5 Implementasi Hook UI

1. **Front-end Modal**
  - Komponen onboarding (mis. `OnboardingModal.tsx`) mengambil daftar bantuan melalui konfigurasi JSON:
    ```json
    {
     "studentHelp": {
      "default": "/static/guides/student_profile.md",
      "en": "/static/guides/student_profile.en.md"
     }
    }
    ```
  - Gunakan renderer Markdown ringan (remark/markdown-to-jsx) agar konten dapat ditampilkan langsung tanpa menyalin ke HTML.
  - Sertakan tombol "Baca Panduan Lengkap" yang membuka `target="_blank"` dan menampilkan badge bahasa (ID/EN).
  - Pastikan setiap kali modal dibuka, frontend memanggil `POST /telemetry/guide-open` (lihat langkah 4) sebelum menampilkan konten agar event tercatat.
2. **Tooltip / Help Drawer**
  - Untuk panel laporan, tambahkan icon bantuan dengan tooltip yang memuat ringkasan 1–2 kalimat serta link ke bagian relevan (mis. anchor `#panel-ringkasan-gaya`).
  - Pastikan tooltip copy diambil dari `app/i18n` agar konsisten dengan bahasa UI.
3. **Asset Delivery**
  - File Markdown disalin dari `docs/guides` dan disajikan langsung oleh FastAPI melalui mount `/static/guides/*.md`. Frontend cukup melakukan fetch ke endpoint tersebut tanpa memaketkan ulang konten.
  - Build pipeline harus meng-copy `docs/guides/**/*.md` ke folder publik agar versi terbaru selalu tersedia.
4. **Tracking**
  - Kirim `POST /telemetry/guide-open` dengan payload `{ guide_id, language, surface }`. Backend akan menambah counter `guides.open.*` sehingga dashboard metrics dapat memantau pemakaian panduan.
5. **Accessibility**
  - Gunakan fokus keyboard pada link panduan di modal.
  - Sediakan teks alternatif di tooltip untuk screen reader (aria-describedby).

## 7. Kontrak API Backend Stabil (TODO 184)

### 7.1 Ruang Lingkup & Versi

- **Versi**: rute FastAPI saat ini dipublikasikan sebagai _API v1_. Frontend harus mengirim header `X-API-Version: 1` (boleh optional di DEV) untuk memudahkan lintasan future change. Versi ini meliputi router `auth`, `sessions`, `engine`, `reports`, `score`.
- **Format**: Seluruh request/respons memakai `application/json; charset=utf-8`. Token dikirim melalui `Authorization: Bearer <JWT>`.
- **Eksperimen vs Stabil**:
  - Stabil: tabel berikut.
  - Eksperimen/Deprecated: `/sessions/{id}/submit_item`, `/sessions/{id}/submit_context`, `/engine/sessions/{id}/interactions` (sudah diberi header `Deprecation`). Frontend baru **tidak** boleh menggunakannya.

### 7.2 Endpoint & Schema yang Dibekukan

| Endpoint | Method | Tujuan | Request Schema | Response Schema | Implementasi | Status |
|----------|--------|--------|----------------|-----------------|--------------|--------|
| `/auth/register` | POST | Registrasi akun mahasiswa/mediator otomatis berdasarkan domain email. | `app.schemas.auth.UserCreate` | `app.schemas.auth.UserOut` | `app/routers/auth.py::register` | Stable |
| `/auth/login` | POST | Menghasilkan JWT akses 60 menit. | Body `{"email": str, "password": str}` | `app.schemas.auth.Token` | `app/routers/auth.py::login` | Stable |
| `/engine/sessions/start` | POST | Membuat sesi instrumen dan mengembalikan `session_id`. | `StartSessionRequest` | `{ "session_id": int }` | `app/routers/engine.py` | Stable |
| `/engine/sessions/{id}/delivery` | GET | Mendapatkan paket item lengkap + konten i18n. | Query `locale` optional | `EngineSessionService.delivery_package` payload | `app/routers/engine.py` | Stable |
| `/engine/sessions/{id}/submit_all` | POST | Kirim 12 item + 8 konteks sekaligus dan finalize atomik. | `app.schemas.session.SessionSubmissionPayload` | `{ "ok": true, "result": {...} }` | `app/routers/engine.py` | Stable |
| `/engine/sessions/{id}/report` | GET | Laporan lengkap dengan gating analytics per role. | Header auth | `runtime.build_report` dict | `app/routers/engine.py` | Stable |
| `/reports/{session_id}` | GET | Jalur publik final UI menggunakan builder yang sama (periksa role). | Header auth opsional | JSON blok `session/raw/percentiles/narrative` | `app/routers/reports.py` | Stable |
| `/score/raw` | POST | Preview skor tanpa persist (alat dosen/riset). | `app.schemas.score.ScorePreviewRequest` | `ScorePreviewResponse` | `app/routers/score.py` | Stable |
| `/telemetry/guide-open` | POST | Catat event pembukaan panduan untuk analitik. | `{ guide_id: str, language?: str, surface: Literal[...] }` | `{ "ok": true }` | `app/routers/telemetry.py` | Stable |

Semua schema di atas sudah diekspor melalui Pydantic, sehingga frontend dapat menjadikan file `.py` sebagai sumber tipe saat membangun TypeScript interfaces (mis. via `datamodel-code-generator`).

### 7.3 Penandaan Ekspres

- Dokumen API internal wajib memuat tabel di atas + status. Beri label "Eksperimental" pada endpoint yang mungkin berubah (contoh: `/engine/sessions/{id}/interactions`), termasuk tanggal sunset (`settings.legacy_sunset`).
- Respons backend menyertakan indikator: `result.override` untuk finalize, `percentile_sources` untuk provenance, `validation.ready` untuk gating UI. Frontend tidak boleh menghapus field ini.

### 7.4 Otomasi Kontrak & Regrasi

- **Tes baru**: `tests/test_api_contract.py` mengeksekusi jalur berikut menggunakan `TestClient`:
  1. `POST /auth/register` → memeriksa bentuk `UserOut`.
  2. `POST /auth/login` → memastikan token bisa dipakai untuk seluruh request berikutnya.
  3. Jalur `POST /engine/sessions/start` → `GET /engine/sessions/{id}/delivery` → `POST /engine/sessions/{id}/submit_all` → `GET /reports/{id}` untuk menjamin API utama tidak berubah bentuk.
  4. `POST /score/raw` untuk memastikan schema preview tetap konsisten.
- **Tes pendukung**: `tests/test_engine_klsi.py`, `tests/test_sessions_legacy_parity.py`, dan `tests/test_api_teams_research.py` tetap berjalan guna memverifikasi variasi peran & jalur mediator.
- **Gate**: setiap perubahan pada router/schema di atas harus menambahkan entry ke tabel, menandai breaking change, dan memperbarui tes kontrak.

Checklist TODO 184 selesai setelah: (a) tabel kontrak tercatat, (b) tes kontrak berjalan hijau di CI, (c) endpoint eksperimental diberi label jelas dalam dokumen & UI developer console.

## 8. Desain Laporan & UX Konsisten dengan Teori (TODO 185)

### 8.1 Struktur Konten yang Disetujui

Urutan panel pada `/reports/{session_id}` harus mengikuti narasi ELT (rujuk `docs/SITEMAP.md §1.5`):
1. **Ringkasan Gaya** – gaya utama, intensitas, kuadran, backup style.
2. **Distribusi Mode & Dialektik** – grafik CE/RO/AC/AE + ACCE/AERO dengan anotasi band Low/Mid/High.
3. **Learning Space / Kite** – visual lintasan perc quadrants + interpretasi situasional.
4. **Learning Flexibility Index** – nilai LFI, level (Low/Medium/High), tips rotasi siklus.
5. **Norma & Persentil** – tabel persentil mode + dialektik + heuristik balance (disclaimer heuristik wajib).
6. **Meta-Learning & Rekomendasi** – ringkasan naratif, strategi pengembangan, dan catatan dosen.
7. **Analytics Tambahan (Mediator)** – heatmap tim, rollup, referensi design studio.

Setiap panel menautkan kembali ke definisi di §1–§5 dokumen ini agar pembaca memahami konteks matematis.

### 8.2 Bahasa & Label

- Hindari metafora evaluatif seperti “IQ gaya belajar” atau “tipe tetap”. Gunakan bahasa progresif: “preferensi dominan saat ini”, “dapat berubah dengan pengalaman”.
- Gunakan tone yang konsisten dengan i18n `ReportStyleMessages`, `ReportBalanceMessages`, `ReportLfiMessages`.
- Tooltip untuk percentil menegaskan sumber norm, rentang populasi, dan heuristik balance (lihat §5).
- Semua peringatan non-diagnostik harus berada di atas fold (mis. banner “Instrumen formatif – bukan alat seleksi kerja”).

### 8.3 Panduan untuk Dosen/Mediator

- Panel khusus _Educator Notes_ merangkum: bagaimana memfasilitasi rotasi CE→RO→AC→AE, contoh aktivitas kelas, dan cara memakai hasil tanpa memberi label permanen.
- Sisipkan CTA “Diskusikan dengan mahasiswa” yang mengarahkan ke panduan pengambilan keputusan reflektif.
- Mediator dashboard harus menyediakan ringkasan tim (learning space aggregate, distribusi gaya) tanpa mengekspos data individu kecuali ada izin.

### 8.4 Verifikasi UX

- QA melakukan _content review_ terhadap copy di Figma/Storybook sebelum release, mencocokkan dengan wording pada `docs/psychometrics_spec.md` dan i18n messages.
- Snapshot testing pada komponen laporan memastikan struktur panel tidak berubah tanpa review (gunakan Storybook/Playwright snapshot).

Checklist TODO 185 selesai ketika: (a) struktur laporan tercantum & disetujui scientific lead, (b) pedoman bahasa ditanamkan dalam file i18n/copy deck, (c) panduan mediator tersedia sebagai panel atau link resmi.

## 9. Governance Perubahan & Audit (TODO 186)

### 9.1 Proses Perubahan Norma & Style Windows

1. **Pengajuan** – ilmuwan instrumen atau komite ELT membuat RFC singkat: sumber data baru, ukuran sampel, dampak terhadap interpretasi. RFC disimpan di `docs/norm_change_log/<YYYY-MM-DD>-<summary>.md`.
2. **Review Ilmiah** – scientific lead + lead psychometrician memeriksa: kesesuaian dengan panduan Kolb, apakah distribusi baru memerlukan label ulang band ACCE/AERO, dan apakah fallback Appendix tetap valid.
3. **Approval & Versioning** – setelah disetujui, buat entry baru di tabel `norm_groups` atau `learning_style_types` via seeding/migrasi. Kolom `norm_version` harus dinaikkan (contoh `v2025.11`).
4. **Implementasi Teknis** – gunakan `/admin/norms/import` atau `seed_learning_styles()` lalu jalankan `clear_norm_db_cache()` agar cache runtime ikut berubah.
5. **Komunikasi** – catat perubahan di `CHANGELOG.md` dan bagikan ke frontend supaya label UI menampilkan versi norm terbaru.

### 9.2 SOP Audit & Provenance

- Pipeline `finalize_with_audit` (lihat `app/engine/finalize.py`) menyimpan hash SHA-256 dari artefak skor + salt. Log audit mencatat `actor_email`, `action`, dan payload. SOP audit:
  1. Catat tiket internal ketika ada pertanyaan etis/komplain.
  2. Query tabel `audit_logs` dengan `session_id` terkait, verifikasi hash cocok dengan ulang-serialisasi artefak.
  3. Ambil `percentile_scores.norm_provenance`, `used_fallback_any`, `raw_outside_norm_range` untuk menjelaskan sumber norm kepada auditor.
  4. Dokumentasikan langkah-langkah dan simpan di repositori audit internal.
- Akses log dibatasi untuk peran `MEDIATOR` khusus (opsional: role `AUDITOR`). Pastikan endpoint audit (jika diekspos di masa depan) melakukan redaksi PII.

### 9.3 Penanggung Jawab & Eskalasi

- **Scientific Lead** – menyetujui perubahan konsep (norm/style window) dan berhak menolak commit yang tidak menyertakan bukti.
- **Engineering Lead** – memastikan migrasi DB + cache invalidation dijalankan dan tes regresi (`test_finalize_atomicity`, `test_norm_group_precedence`) hijau.
- **Data Protection Officer** – mengawasi bahwa audit log digunakan sesuai kebijakan privasi (§6) dan memutuskan kapan audit data diperlukan.

### 9.4 Checklist Kepatuhan

- [ ] RFC perubahan norm/style disimpan dan ditautkan.
- [ ] Scientific lead menyetujui melalui komentar tertulis.
- [ ] Versi norm & window diperbarui + dicatat di `CHANGELOG.md`.
- [ ] Cache invalidation dijalankan dan diverifikasi lewat `GET /admin/norms/cache-stats`.
- [ ] Audit SOP dijalankan minimal sekali per kuartal untuk memastikan log terbaca.

## 10. Dokumentasi Pengguna (Educator & Researcher) (TODO 187)

### 10.1 Manual Mahasiswa “How to Read Your Profile”

- Struktur konten rekomendasi (2–3 halaman, bahasa ramah):
  1. Pengantar ELT dan tujuan formatif KLSI 4.0.
  2. Cara membaca panel ringkasan gaya, dialektik, LFI, dan balance heuristik (hubungkan dengan §2 & §5).
  3. Tips refleksi pribadi: bagaimana memanfaatkan kekuatan tiap mode untuk tugas kuliah.
  4. FAQ seputar perubahan gaya, kapan mengulang asesmen, serta penekanan bahwa hasil bukan label permanen.
- Draft disimpan di `docs/guides/student_profile.md` dan harus melewati review i18n supaya tone konsisten.

### 10.2 Manual Dosen/Mediator “Responsible Use”

- Isi utama (4–5 halaman atau modul onboarding Notion):
  - Pedoman interpretasi tim: gunakan distribusi gaya untuk merancang aktivitas lintas CE→RO→AC→AE.
  - Langkah menjalankan sesi kelas: membuat tim, memantau validasi, menggunakan `force_finalize` hanya bila etis.
  - Contoh sesi refleksi: pertanyaan pembuka, cara menghindari labeling tetap, cara mendorong deliberate practice.
  - Referensi ke kebijakan privasi (§6) dan governance (§9) agar mediator tahu batasan ketika berbagi data.
- Draft ditempatkan di `docs/guides/educator_responsible_use.md` dan dijaga versi-nya melalui review product + scientific lead.

### 10.3 Panduan Peneliti

- Jelaskan prosedur permintaan data batch, anonimisasi, serta format output (CSV aggregate). Hubungkan dengan consent riset (§6.2) dan requirement aggregator (minimal 10 responden per bucket).
- Sertakan template permintaan riset (judul studi, tujuan, analisis yang diizinkan) dan tempat pengajuan (email / portal internal).
- Pastikan panduan ini menjelaskan bahwa dataset tidak boleh dipakai untuk seleksi kerja atau profiling di luar ELT.

### 10.4 Alignment Kurikulum & Pedagogi

- Dokumen educator harus mencontohkan bagaimana modul kuliah memasangkan aktivitas CE→RO→AC→AE (mis. lab praktik → jurnal refleksi → diskusi teori → proyek eksperimen).
- Beri contoh konkret: mata kuliah Desain Produk menggunakan gaya Diverging untuk brainstorming, lalu memfasilitasi Converging untuk prototyping.
- Hubungkan dengan `docs/03-klsi-overview.md` dan `docs/04-learning-space.md` supaya dosen dapat mengutip sumber saat menyusun RPS.

Checklist TODO 187 selesai bila: (a) draft/manual berada di folder `docs/guides/` dengan reviewer yang ditunjuk, (b) onboarding frontend menyertakan link ke manual tersebut, (c) materi explicitly menyatakan alignmen ELT dan larangan penggunaan non-formative.

## 11. Strategi Lokalisasi Panduan

- **Struktur File**: simpan terjemahan berdampingan, mis. `student_profile.id.md`, `student_profile.en.md`. File default (`.md tanpa kode bahasa`) diperlakukan sebagai Bahasa Indonesia.
- **Workflow**:
  1. Tim konten menulis versi Indonesia terlebih dahulu.
  2. Gunakan proses review dua langkah untuk terjemahan Inggris (editor bilingual + scientific reviewer memastikan istilah ELT konsisten).
  3. Daftarkan bahasa yang tersedia di `docs/guides/README.md` agar frontend tahu mana yang bisa dihubungkan.
- **Integrasi UI**: frontend menautkan panduan sesuai locale pengguna. Jika tidak ada terjemahan, fallback ke versi default tetapi tampilkan penanda "(ID)" agar pengguna tahu bahasa yang ditampilkan.
- **i18n Messages**: gunakan modul `app/i18n/` untuk menyertakan snippet pendek (mis. di tooltips) yang merujuk panduan. Untuk konten panjang, tampilkan link ke file Markdown ini pada modal bantuan.
- **Deploy**: saat membangun image/container, copy `docs/guides` ke lokasi yang sama dengan source code sehingga mount `/static/guides` tetap valid. Contoh Dockerfile snippet:
  ```dockerfile
  COPY docs/guides /app/docs/guides
  ```
  Jika menggunakan pipeline CI/CD, tambahkan step pengarsipan agar folder tersebut tidak tersaring oleh `.dockerignore` atau packaging tool lain.

Dengan dokumentasi ini, TODO #181 dianggap selesai karena ketiga sub-bagian (teori, rumus, dan norm precedence) telah terdokumentasi secara eksplisit dan merujuk ke file sumber otoritatif di repository.
