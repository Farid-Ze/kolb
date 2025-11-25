**Dokumen Strategis Arsitektur & Roadmap Pengembangan**

| **Metadata** | **Detail** |
| --- | --- |
| **Versi** | 4.0 (Final Draft) |
| **Status** | **APPROVED FOR EXECUTION** |
| **Fokus Utama** | Research Integrity, Concurrency Safety, Semantic Pivot |
| **Target Runtime** | Python 3.13+ (Prepared for 3.14 No-GIL) |
| **Arsitektur** | Event-Driven, Stateless Compute, Atomic Persistence |
| **Basis Audit** | 160+ Files (Backend/Frontend Repositories) |

## BAGIAN I: EXECUTIVE SUMMARY & MANDAT STRATEGIS

### 1.1. Visi "The Giant Standard"

Zenotika tidak dibangun sekadar sebagai aplikasi web standar. Zenotika direkayasa ulang untuk menjadi **Mesin Riset Psikometrik Berkinerja Tinggi**. Standar "Raksasa Digital" yang kita adopsi bukanlah tentang profitabilitas, melainkan tentang:

1. **Massive Scale Integrity:** Data tetap valid meski diakses oleh ribuan mahasiswa/responden secara bersamaan (Concurrency).
2. **Auditability:** Setiap bit perubahan data memiliki jejak digital yang tidak bisa disangkal (Provenance).
3. **Semantic Precision:** Kode program mencerminkan realitas riset akademik, bukan transaksi dagang.

### 1.2. Temuan Audit & Pivot Strategis

Berdasarkan pembacaan mendalam terhadap repositori (khususnya `backend/app/models/klsi/store.py` dan `engine/dsl/evaluator.py`), ditemukan dua *Technical Debt* fundamental yang harus dibayar lunas di V4 ini:

- **The Semantic Debt (Hutang Makna):** Sistem saat ini menggunakan terminologi *E-Commerce* (`Store`, `Order`, `Funds`, `Checkout`) untuk mengelola akses tes. Ini berbahaya bagi mental model tim pengembang dan tidak selaras dengan misi non-profit.
    - **Mandat V4:** Transformasi total menjadi **Sistem Hibah & Alokasi (Grant & Allocation System)**.
- **The Concurrency Debt (Hutang Konkurensi):** Kode Python saat ini mengandung *stateful logic* dan *implicit mutation* yang akan memicu *Race Condition* fatal (data korup/hilang) saat kita beralih ke Python 3.14 (No-GIL environment).
    - **Mandat V4:** Penegakan arsitektur **Stateless** dan **Atomic Database Locks**.

## BAGIAN II: TRANSFORMASI ARSITEKTUR (PYTHON 3.14 READY)

Bagian ini mengatur standar pengkodean baru. Setiap *Pull Request* (PR) ke depan harus mematuhi aturan ini.

### 2.1. Protokol "No-GIL" (Thread Safety)

Mengingat keberadaan `requirements-nogil.txt` dan `Dockerfile.experimental`, backend dipersiapkan untuk *Free-Threading*.

1. **Stateless Services:**
    - **Aturan:** Service class (misal: `AssessmentService`) tidak boleh memiliki properti instan (`self.counter`) yang berubah selama request berjalan.
    - **Target:** `backend/app/services/`.
    - **Validasi:** Semua data context harus dipassing via argumen fungsi, bukan disimpan di `self`.
2. **Atomic Grants (Pengganti Store Logic):**
    - **Masalah:** `user.credits -= 1; user.save()` adalah kode "bunuh diri" di environment multi-thread. Dua request bersamaan akan membaca saldo yang sama, dan satu pengurangan akan hilang.
    - **Solusi:** Gunakan `UPDATE ... SET credits = credits - 1` langsung di database atau `SELECT ... FOR UPDATE` (Row Locking).
3. **Immutable Data Structures:**
    - **Aturan:** Object yang dipassing antar layer (terutama hasil kalkulasi Engine) harus *Read-Only*.
    - **Implementasi:** Gunakan `pydantic.BaseModel` dengan `model_config = {'frozen': True}`.

### 2.2. Protokol Integritas Riset

1. **Strict Provenance:**
    - Setiap kali skor KLSI dihitung atau diubah, sistem WAJIB mencatat:
        - `snapshot_id`: ID unik kalkulasi.
        - `inputs_hash`: Hash SHA-256 dari jawaban user.
        - `algorithm_version`: Versi kode `evaluator` saat itu.
        - `norms_version`: Versi norma statistik yang dipakai.
    - Ini menjamin jika kita mengubah algoritma di masa depan, kita tahu persis mana data lama dan mana data baru.

## BAGIAN III: SEMANTIC PIVOT (DICTIONARY BARU)

Sebelum masuk ke backlog, kita harus menyepakati kamus baru untuk menggantikan modul `Store`.

| **Istilah Lama (Sales)** | **Istilah Baru (Research)** | **Definisi Konseptual** |
| --- | --- | --- |
| **Store / Shop** | **Registry / Catalog** | Daftar instrumen riset yang tersedia (misal: KLSI 4.0, Team Role). |
| **Product** | **Instrument** | Alat ukur psikometrik spesifik. |
| **Order** | **Access Grant** | Hak yang diberikan kepada Institusi/User untuk mengakses instrumen. |
| **Funds / Wallet** | **Research Credits** | Satuan kuota partisipasi. Bukan uang, tapi hak akses. |
| **Payment** | **Allocation** | Proses pendistribusian kredit dari Admin -> Institusi -> Subjek. |
| **Checkout** | **Redemption** | Proses user menggunakan kredit untuk memulai sesi. |

## BAGIAN IV: AGILE BACKLOG (DETAILED ROADMAP)

### EPIC A: THE CORE ENGINE (Refactor & Hardening)

*Tujuan: Membangun "Jantung" sistem yang deterministik, stateless, dan aman.*

### [A-01] Evaluator Hygiene & Isolation (COMPLETED)

- **Target File:** `backend/app/engine/dsl/evaluator.py`
- **Status:** **DONE** (Refactored to Pure Function, Globals Removed, Timeout Implemented)
- **Tasks:**
    1. [x] Ubah fungsi `evaluate()` menjadi *Pure Function*: Input `(Context, Rules)` -> Output `(Score)`.
    2. [x] Hapus semua dependensi global variable.
    3. [x] Implementasikan `Timeout` (misal: 2 detik) pada eksekusi DSL untuk mencegah *Infinite Loop* dari input jahat.
- **Definition of Done:** Unit test berjalan paralel (100 threads) tanpa error dan hasil konsisten.

### [A-02] Mathematical Edge-Case Defense (COMPLETED)

- **Target File:** `backend/app/assessments/klsi_v4/calculations.py`
- **Status:** **DONE** (Strict Types Enforced, Edge Case Tests Added)
- **Tasks:**
    1. [x] Buat Test Suite baru yang khusus menyuntikkan angka-angka "neraka": `NaN`, `Infinity`, `0`, `1`, dan `Null`.
    2. [x] Pastikan pembagian dengan nol (division by zero) dihandle dengan *graceful fallback* (misal: return 0.0), bukan crash 500.
    3. [x] Validasi tipe data input secara ketat menggunakan Pydantic V2 (`StrictFloat`, `StrictInt`).

### [A-03] Immutable Norms System (COMPLETED)

- **Target File:** `backend/app/data/norms.py`
- **Status:** **DONE** (Versioned Fallback Norms, Provenance Tracking Updated)
- **Tasks:**
    1. [x] Tambahkan kolom `version` pada tabel/file norma (Added `APPENDIX_VERSION`).
    2. [x] Saat user selesai tes, simpan `norm_version_used` di tabel `Results` (Logic updated to capture version).
    3. [x] Saat menampilkan report lama, load norma sesuai versi yang tersimpan, bukan norma terbaru (Provenance parsing updated).

### EPIC B: SEMANTIC PIVOT (Store to Grant System)

*Tujuan: Mengubah mental model sistem dari "Jualan" menjadi "Distribusi Ilmu".*

### [B-01] Database Schema Migration (Strangler Pattern) (COMPLETED)

- **Strategi:** Jangan langsung hapus tabel `store_orders`. Buat tabel baru di sampingnya.
- **Status:** **DONE** (Table `access_grants` created, Model consolidated in `app/models/klsi/grant.py`)
- **Note:** Currently `access_grants` links to `store_products` (legacy) to match existing migration `d9b2c3747197`. Future migration to `instruments` is planned.
- **Tasks:**
    1. [x] Buat tabel `access_grants`:
        - `id` (UUID)
        - `grantor_id` (User ID pemberi, misal: Dosen)
        - `grantee_id` (User ID penerima, atau NULL jika berupa kode token)
        - `instrument_id` (FK ke Instrument/StoreProduct)
        - `credits_allocated` (int)
        - `credits_consumed` (int)
        - `expiry_date` (timestamp)
    2. [x] Buat script migrasi data dari `store_orders` ke `access_grants` (jika ada data legacy yang perlu diselamatkan). (Skipped: No legacy data migration requested yet, table ready).

### [B-02] Grant Service Implementation (Thread-Safe) (COMPLETED)

- **Target File:** `backend/app/services/grant_service.py` (New File)
- **Status:** **DONE** (Implemented with Row Locking and Tests)
- **Tasks:**
    1. [x] Implementasi fungsi `allocate_credits()` dengan *Database Transaction*.
    2. [x] Implementasi fungsi `redeem_credit()` dengan mekanisme *Row Locking* (`SELECT ... FOR UPDATE`) untuk mencegah *double-spending* kuota.
    3. [x] Hapus logika integrasi *Payment Gateway* (jika ada sisa-sisa di `store_service.py`). (Service is pure grant logic).

### [B-03] Cleanup Legacy "Store" Artifacts

- **Target File:** `backend/app/routers/store.py`, `backend/app/models/klsi/store.py`
- **Tasks:**
    1. Setelah B-01 dan B-02 stabil, hapus router dan model lama.
    2. Bersihkan `migrations/versions/0025...` dan file terkait yang berbau komersial.

### EPIC C: SCIENTIFIC VALIDITY UPGRADE (The "Kite" Pivot)

*Tujuan: Menyelaraskan logika backend dengan topologi "Nine-Style Typology" KLSI 4.0 dan memperbaiki algoritma statistik.*

### [C-01] LFI Algorithm Correction

- **Target File:** `backend/app/assessments/klsi_v4/calculations.py` & `logic.py`
- **Status:** **DONE** (Variance-based formula implemented and verified)
- **Issue:** Current implementation uses Kendall's W (normalized 0-1). KLSI 4.0 specifies a raw variance-based formula: $LFI = \frac{\sum (R_i - \bar{R})^2}{N}$.
- **Tasks:**
    1. [x] Implement `calculate_lfi_variance(context_ranks)` in `calculations.py`.
    2. [x] Update `logic.py` to use this new formula for `LearningFlexibilityIndex`.
    3. [x] Ensure `score_preview.py` (if exists) or frontend receives the correct LFI value.

### [C-02] Norms-Based Style Determination

- **Target File:** `backend/app/assessments/klsi_v4/logic.py`
- **Status:** **DONE** (Kite Topology and Percentile Lookup implemented)
- **Issue:** Current logic uses Raw Scores against Cartesian quadrants. KLSI 4.0 requires Percentiles against a "Kite" topology.
- **Tasks:**
    1. [x] Inject `NormProvider` into `assign_learning_style`.
    2. [x] Convert Raw Scores (AC-CE, AE-RO) to Percentiles using demographic norms (Gender, Age, Education).
    3. [x] Implement "Nine-Style Typology" logic (Experiencing, Reflecting, Thinking, Acting, Balancing, + 4 Mixed) based on Percentile boundaries (e.g., <20th, >80th).
    4. [x] Deprecate/Update `StyleWindow` DB model to support Percentile bounds instead of Raw Score bounds.

### [C-03] Cycle of Learning & Feedback

- **Target:** Frontend / Report Logic
- **Status:** **DONE** (API updated with Cycle Phase and Backup Style)
- **Tasks:**
    1. [x] Update API response to include "Cycle Phase" analysis based on LFI and Style.
    2. [x] Implement Backup Style calculation using Centroid Distance in Percentile Space.

### EPIC D: IDENTITY, TELEMETRY & PROVENANCE (Renamed from C)

*Tujuan: Menjamin validitas data untuk kebutuhan audit riset masa depan.*

### [D-01] Unified Identity (Zen ID)

- **Target File:** `backend/app/models/klsi/user.py`
- **Status:** **DONE** (Guest Access & Lazy Registration Merge implemented)
- **Tasks:**
    1. [x] Audit tabel `User`. Pastikan tidak ada "Guest User" tanpa ID yang jelas.
    2. [x] Untuk kebutuhan "Future Tunnel" (yang mungkin anonim di awal), buat mekanisme *Lazy Registration*: User dapat `session_id` dulu, baru nanti di-merge ke `user_id` saat selesai.
    3. [x] Pastikan semua tabel (Results, Telemetry, Grants) merujuk ke `Zen ID` yang sama.

### [D-02] Async Provenance Logging

- **Target File:** `backend/app/services/provenance.py`
- **Status:** **DONE** (BackgroundTasks implemented)
- **Tasks:**
    1. [x] Ubah mekanisme logging provenance menjadi *Asynchronous* (`async def`).
    2. [x] Gunakan `asyncio.create_task` atau *Background Tasks* FastAPI agar user tidak perlu menunggu proses pencatatan log selesai untuk melihat hasil.
    3. [x] Pastikan log disimpan di tabel yang di-indeks berdasarkan `timestamp` dan `user_id`.

### [D-03] Telemetry Sanitization

- **Target File:** `backend/app/schemas/telemetry.py`
- **Status:** **DONE** (Strict Schemas & Filtering API implemented)
- **Tasks:**
    1. [x] Definisikan schema ketat untuk event: `TimeOnPage`, `ItemChanged`, `MouseMovement`.
    2. [x] Filter data di level API: Jangan simpan data telemetri yang corrupt atau terlalu berisik (spam).

### EPIC D: FRONTEND SYNCHRONIZATION (Future Tunnel)

*Tujuan: UX yang seamless dengan jaminan data valid.*

### [D-01] Type-Safe Contract (Codegen)

- **Target:** `frontend/src/features/future-tunnel/model.ts`
- **Status:** **DONE** (Client generated & integrated)
- **Masalah:** Sering terjadi ketidakcocokan tipe data antara Backend (Python) dan Frontend (TS).
- **Tasks:**
    1. [x] Setup script di `package.json` untuk menjalankan `openapi-typescript-codegen`.
    2. [x] Generate otomatis interface TypeScript dari `openapi.json` FastAPI setiap kali ada perubahan di Backend.
    3. [x] Refactor kode Frontend untuk menggunakan tipe data hasil generate ini.

### [D-02] Defensive Validation Layer

- **Target:** `backend/app/routers/engine.py`
- **Status:** **DONE** (Implemented in `engine.py` service layer)
- **Tasks:**
    1. [x] Jangan percaya input Frontend. Lakukan validasi ulang logic di Backend.
    2. [x] Contoh: Jika Frontend mengirim `duration: 5s` untuk tes 50 soal, Backend harus menolak (mustahil/bot). Buat aturan validasi "Manusiawi".

## BAGIAN V: RISIKO & MITIGASI (BLIND SPOTS)

Sebagai partner strategis, saya mengidentifikasi risiko berikut yang mungkin belum terlihat:

| **Risiko** | **Dampak** | **Strategi Mitigasi** |
| --- | --- | --- |
| **Complexity of Simplification** | Menghapus modul `Store` bisa mematahkan fitur registrasi user yang terlanjur terikat (coupled). | Gunakan **Strangler Fig Pattern**. Bangun `Grant` di samping `Store`, migrasi pelan-pelan, baru hapus `Store`. |
| **Performance Overhead** | Provenance logging yang terlalu detail bisa memenuhkan database dengan cepat. | Implementasikan **Log Rotation** atau pindahkan log tua ke Cold Storage (S3/CSV) secara berkala. |
| **Legacy Data Loss** | Migrasi schema norma/skor bisa membuat hasil tes lama tidak bisa dibuka. | Selalu simpan **Snapshot Statis** (JSON dump) dari hasil report saat generate pertama kali. |

## BAGIAN VI: TAHAPAN EKSEKUSI (IMMEDIATE NEXT STEPS)

Kita akan mengeksekusi ini dalam urutan prioritas untuk meminimalkan gangguan pada sistem yang sedang berjalan.

**FASE 1: THE CLEANUP (Minggu 1)**

1. Freeze fitur baru.
2. Lakukan audit `evaluator.py` dan `klsi4/calculations.py`.
3. Setup linter `ruff` dengan aturan *concurrency* yang ketat.

**FASE 2: THE PIVOT (Minggu 2-3)**

1. Buat tabel `access_grants` dan `access_registry`.
2. Implementasi `GrantService`.
3. Mulai alihkan endpoint pembuatan user baru untuk menggunakan sistem Grant.

**FASE 3: THE HARDENING (Minggu 4)**

1. [x] Aktifkan `provenance` logging secara penuh. (Done via D-02)
2. [x] Implementasi *Row Locking* pada transaksi kuota. (Done via B-02)
3. [x] Implementasi Static Snapshotting (`results_json`) untuk mitigasi *Legacy Data Loss*. (Done)
4. Finalisasi migrasi data lama.

**Penutup:**
Master Plan V4 ini adalah cetak biru untuk mengubah Zenotika dari sekadar aplikasi menjadi infrastruktur riset yang *Robust*, *Scalable*, dan *Ethical*. Tidak ada lagi ambiguitas bisnis. Fokus penuh pada keunggulan teknis dan integritas data.

*Siap untuk dieksekusi.*