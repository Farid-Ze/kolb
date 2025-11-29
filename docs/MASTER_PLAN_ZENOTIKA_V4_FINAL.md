# MASTER PLAN ZENOTIKA V4.0: FROM CODEBASE TO LEGACY

**Doc ID:** ZN-MP-V4.0-FINAL-COMPREHENSIVE
**Status:** APPROVED FOR EXECUTION
**Target Runtime:** Python 3.14 (No-GIL Prepared)
**Scale Target:** 10,000+ Concurrent Users (High-Frequency Assessment)
**Architecture Style:** Event-Driven, Stateless, Atomic Persistence
**Authors:** Project Manager 2025 & Lead Architect

## 1. VISION & MANDATE (THE "WHY")

Zenotika sedang mengalami metamorfosis fundamental. Kami bertransformasi dari sekadar aplikasi web standar menjadi **Infrastruktur Riset Psikometrik Berkinerja Tinggi (*High-Performance Psychometric Infrastructure*)**. Pergeseran ini bukan sekadar ganti kulit, melainkan perombakan DNA sistem. Kita menuntut standar reliabilitas yang biasa ditemukan pada sistem perbankan untuk menangani aset yang tak ternilai: data kognitif manusia.

Pergeseran ini menuntut kita meninggalkan paradigma "E-Commerce" (Jualan Tes) yang transaksional menuju paradigma "Academic Grant System" (Distribusi Akses Riset) yang berfokus pada integritas data absolut, aksesibilitas ilmiah, dan auditabilitas tanpa kompromi.

### Core Pillars & Strategic Implications:

1. **Semantic Precision (Academic View):**
    - **Filosofi:** Kode program adalah representasi hidup dari domain masalah. Jika kode menggunakan istilah "Harga", "Diskon", dan "Toko" untuk sebuah instrumen ilmiah, maka mental model tim pengembang akan secara tidak sadar bias ke arah profitabilitas, bukan validitas data. Ini adalah *ontological mismatch* yang berbahaya.
    - **Mandat:** Hapus total istilah "Store", "Price", "Order", "Cart", atau "Checkout". Gunakan terminologi yang mencerminkan realitas akademis: "Grant" (Hibah), "Quota" (Jatah Partisipasi), "Allocation" (Alokasi Hak Akses), dan "Redemption" (Penukaran Kuota). Perubahan ini harus bersifat holistik, tercermin dari nama tabel database, endpoint API, hingga nama variabel di Frontend State Management.
    - **Implikasi File:** Penghapusan modul `store` harus diikuti dengan *search-and-replace* cerdas di seluruh codebase untuk memastikan tidak ada variabel yatim piatu. Referensi pada `backend/app/models/klsi/store.py` harus dihapus total dan digantikan oleh `grant.py`.
2. **Concurrency Safety (Engineering View):**
    - **Tantangan:** Dalam skenario *mass-testing* (misal: 1.000 mahasiswa baru dari sebuah universitas melakukan login dan memulai tes secara serentak dalam jendela waktu 5 menit), *race condition* adalah musuh utama. Jika dua *request* masuk bersamaan untuk menggunakan 1 kuota tersisa, sistem yang naif akan mengizinkan keduanya. Dalam konteks finansial, ini adalah *double-spending*. Dalam konteks riset, ini adalah data korup.
    - **Solusi:** Sistem harus dirancang *stateless* di level aplikasi agar dapat diskalakan secara horizontal (menambah worker/container). Mutasi saldo/kuota harus bersifat atomik dan terkunci secara pesimis (*pessimistic locking*) di level database (`SELECT ... FOR UPDATE`). Kita mempersiapkan kode untuk Python 3.14 (No-GIL) di mana *thread safety* menjadi tanggung jawab eksplisit pengembang, bukan lagi dilindungi oleh GIL. Implementasi pada `backend/app/services/grant_service.py` harus menggunakan teknik ini secara ketat.
3. **Scientific Validity (Psychometric View):**
    - **Standar:** Algoritma penilaian dalam psikometrika bukan sekadar logika "benar/salah", melainkan interpretasi psikologis yang kompleks dan berlapis. Implementasi harus patuh 100% pada *KLSI 4.0 Technical Manual*.
    - **Implementasi:** Ini mencakup penggunaan topologi "Kite" 9-Gaya (meninggalkan model 4 kuadran klasik yang kurang nuansa), perhitungan *Learning Flexibility Index* (LFI) berbasis varians peringkat (bukan korelasi), dan penanganan *edge-cases* statistik (misal: skor mentah nol atau skor sempurna). Setiap penyimpangan 0.01 poin dari standar manual adalah cacat produk. Logic ini terpusat di `backend/app/assessments/klsi_v4/logic.py`.

## FASE 1: THE SEMANTIC PIVOT (MINGGU 1-2)

**Objective:** Mengganti fondasi "Toko" dengan "Sistem Hibah" menggunakan *Strangler Fig Pattern*. Strategi ini memungkinkan kita membangun sistem baru (Grant) di samping sistem lama (Store), memigrasikan data secara bertahap, dan baru mematikan sistem lama setelah verifikasi total. Ini adalah satu-satunya cara menjamin *Zero Data Loss*.

### 1.1. Data Layer Transformation (Database & Models)

Kita tidak akan melakukan *drop table* sembarangan. Kita membangun struktur paralel untuk menjamin keamanan data selama transisi.

- **File Baru:** `backend/app/models/klsi/grant.py`
    - **Tujuan:** Mendefinisikan kontrak data yang kaku untuk hak akses instrumen.
    - **Definisi Model:** Class `AccessGrant` harus memiliki struktur berikut:
        - `id`: UUID (Primary Key) - Menggunakan UUIDv4 untuk keamanan ID yang tidak bisa ditebak (*non-enumerable*).
        - `grantor_id`: Integer (FK ke `users.id`), nullable (untuk grant yang diterbitkan otomatis oleh sistem/admin).
        - `grantee_id`: Integer (FK ke `users.id`), dengan indeks wajib (`ix_grantee_instrument`) untuk pencarian O(log n).
        - `instrument_id`: Integer (FK ke `instruments.id` atau tabel referensi engine). *Catatan: Pastikan ini merujuk ke tabel `engine_instruments` jika migrasi engine sudah selesai.*
        - `credits_total`: Integer (Immutable setelah pembuatan untuk keperluan audit - jangan pernah di-update).
        - `credits_consumed`: Integer (Atomic Counter, default 0).
        - `expiry_date`: Timestamp (Nullable, memungkinkan grant abadi atau berjangka waktu).
        - `source_ref`: String (Critical), menyimpan jejak asal grant untuk *traceability*. Contoh format: `legacy_order_1234`, `admin_alloc_batch_2025_01`.
        - `is_active`: Properti hibrida/computed (`credits_consumed < credits_total AND (expiry_date IS NULL OR now < expiry_date)`).
        - **Constraint:** Tambahkan Check Constraint `credits_consumed <= credits_total` di level database sebagai pertahanan terakhir.
- **File Migrasi:** `backend/app/migrations/versions/xxxx_init_grants.py`
    - **Action:** Create table `access_grants`.
    - **Optimization:** Tambahkan *partial composite index* pada `(grantee_id, instrument_id)` dengan kondisi `WHERE credits_consumed < credits_total` untuk memastikan query validasi hak akses berjalan di bawah 1ms bahkan dengan jutaan baris data historis (completed grants).
- **File Migrasi:** `backend/app/migrations/versions/yyyy_migrate_legacy_data.py`
    - **Logic:** Script Python robust untuk memindahkan data. Hindari SQL raw yang sulit di-debug.
    - **Strategi:** "Whitewashing". Kita asumsikan data konsumsi kredit lama mungkin tidak akurat atau tercampur. Untuk keamanan kepuasan pengguna, migrasikan kuota lama sebagai kuota penuh di sistem baru.
        
        ```
        # Pseudocode Migrasi Data yang Aman
        conn = op.get_bind()
        # 1. Fetch data legacy dengan status 'paid' saja
        orders = conn.execute(text("SELECT id, user_id, quantity, created_at FROM store_orders WHERE status='paid'"))
        
        grants_to_insert = []
        for order in orders:
            # Generate UUID di aplikasi, bukan di DB untuk kontrol lebih baik
            new_id = uuid.uuid4()
            grants_to_insert.append({
                "id": new_id,
                "grantee_id": order.user_id,
                "instrument_id": DEFAULT_KLSI_ID, # Hardcode ID instrumen KLSI untuk legacy
                "credits_total": order.quantity,
                "credits_consumed": 0, # Reset konsumsi sebagai kompensasi migrasi
                "source_ref": f"MIGRATION_LEGACY_ORDER_{order.id}",
                "created_at": order.created_at or datetime.now(),
                "updated_at": datetime.now()
            })
        
        # 2. Bulk Insert menggunakan SQLAlchemy Core untuk performa tinggi
        if grants_to_insert:
            op.bulk_insert(table_access_grants, grants_to_insert)
        
        ```
        

### 1.2. Thread-Safe Grant Service

Mencegah "Double Spending" kuota tes adalah prioritas utama integritas transaksional. Logika ini harus diisolasi dalam `backend/app/services/grant_service.py`.

- **File Baru:** `backend/app/services/grant_service.py`
    - **Metode Kritis:** `redeem_credit(user_id, instrument_id)`
    - **Implementasi Wajib (The Golden Flow):**
        1. **Start Transaction:** Gunakan `with transaction():` atau dependency injection session yang dikelola.
        2. **Row Locking (Pessimistic):** Lakukan query `SELECT * FROM access_grants WHERE user_id=... AND ... FOR UPDATE`.
            - *Penjelasan:* `FOR UPDATE` memberitahu database untuk mengunci baris-baris terpilih. Transaksi lain yang mencoba membaca baris ini akan dipaksa menunggu (*block*) hingga transaksi kita selesai (commit/rollback). Ini satu-satunya cara garansi 100% anti-race condition di level aplikasi.
        3. **Validation:** Cek logika bisnis (`credits_consumed < credits_total`). Jika salah, `raise InsufficientCreditsError`.
        4. **Mutation:** Lakukan update in-memory `grant.credits_consumed += 1`.
        5. **Audit Trail:** (Wajib di fase ini) Catat penggunaan ke tabel `grant_usage_log` atau `audit_logs` dengan referensi ke `session_id` yang akan dibuat.
        6. **Commit:** Transaksi selesai, lock dilepas, data tersimpan permanen.
    - **Engineering Standard:** Gunakan dekorator kustom `@retry_on_deadlock` untuk menangani potensi *deadlock* database secara otomatis dengan *exponential backoff* (coba ulang setelah 0.1s, 0.2s, 0.4s).

### 1.3. User & Router Refactoring

- **File:** `backend/app/services/users.py`
    - **Refactor:** Hapus properti atau method `wallet_balance`. Ganti dengan `get_available_grants(user_id)`.
    - **Output:** Mengembalikan struktur data yang lebih kaya informasi, misal: `[{instrument: "KLSI 4.0", remaining: 5, expiry: "2025-12-31", source: "Dosen Wali"}]`.
- **File:** `backend/app/routers/assessments.py`
    - **Endpoint:** `POST /start`
    - **Logic Change:** Pola "Check-then-Act" tidak cukup. Kita butuh "Redeem-then-Act".
        1. Panggil `grant_service.redeem_credit()`.
        2. Jika sukses, *lanjutkan* pembuatan `AssessmentSession`.
        3. Jika gagal (exception `InsufficientCredits`), tangkap dan return HTTP 402 (Payment Required) atau 403 (Forbidden) dengan pesan yang jelas bagi UI.

### 1.4. Demolition (Pembersihan Akhir)

Hanya dilakukan setelah migrasi sukses berjalan minimal 1 minggu di Production tanpa isu ("Burn-in Period").

- **Hapus:** `backend/app/routers/store.py`, `backend/app/models/klsi/store.py`, `backend/app/services/store_service.py`.
- **Migrasi:** `backend/app/migrations/versions/zzzz_drop_store_tables.py`.
    - Pastikan script ini memuat perintah `op.drop_table(...)` untuk tabel-tabel legacy (`store_orders`, `store_products`, `store_order_items`).

## FASE 2: SCIENTIFIC ENGINE HARDENING (MINGGU 3)

**Objective:** Menjamin validitas output KLSI 4.0 sesuai standar jurnal ilmiah, reproduktifitas data, dan auditability penuh. Data hasil asesmen harus bisa dipertanggungjawabkan di sidang akademik.

### 2.1. LFI Variance Logic (Matematika Presisi)

- **File:** `backend/app/assessments/klsi_v4/calculations.py`
    - **Task:** Deprecate/Hapus implementasi *Kendall's W* yang tidak sesuai spesifikasi baru (atau simpan hanya untuk backward compatibility laporan lama).
    - **Implementasi Baru:** Fungsi `calculate_lfi_variance(ranks)` harus menghitung varians murni dari peringkat lintas konteks.
    - **Formula:** $\sigma^2 = \frac{\sum (X - \mu)^2}{N}$. Pastikan input diratakan (*flattened*) dengan benar dari struktur matriks [Context x Mode].
    - **Testing:** Tambahkan unit test di `backend/app/tests/test_lfi_computation.py` dengan kasus ekstrem:
        - *Perfect Consistency:* User memilih ranking yang sama persis di setiap konteks (Varians mendekati 0, LFI = 1.0).
        - *Maximum Inconsistency:* User memilih ranking acak/berlawanan (Varians tinggi, LFI mendekati 0.0).

### 2.2. Norms Provider & Kite Topology (Logika Bisnis)

- **File:** `backend/app/data/norms.py`
    - **Struktur Data:** Pastikan JSON/Dict norma mendukung lookup bertingkat (Nested Dictionary) untuk performa O(1): `Norms[Scale][Gender][AgeGroup] -> PercentileTable`. Jangan lakukan iterasi array (O(n)) untuk mencari norma.
    - **Version Control:** Tambahkan field `meta_version` di root file norma untuk pelacakan provenance (misal: "norm_v2_2025_update").
- **File:** `backend/app/assessments/klsi_v4/logic.py`
    - **Refactor:** Fungsi `assign_learning_style` tidak boleh lagi menggunakan *hardcoded raw scores* (misal: `AC-CE > 4`).
    - **Flow Baru:**
        1. **Compute Raw:** Hitung Raw Score (AC, CE, AE, RO) & Kombinasi (AC-CE, AE-RO).
        2. **Normalize:** Lookup Norms berdasarkan profil user (Umur, Gender, Pendidikan) -> Dapatkan Percentile Score (0-100).
        3. **Plotting:** Plot Percentile ke dalam **9-Grid Kite Topology**. Gunakan batas (cut-off) persentil, misal: <20% (Low), 20-80% (Mid), >80% (High).
        4. **Derivasi:** Tentukan *Primary Style*, *Backup Style* (menggunakan jarak Euclidean terdekat kedua ke centroid masing-masing gaya), dan *Cycle Phase* (tahapan siklus belajar: Experiencing, Reflecting, Thinking, atau Acting).

### 2.3. Async Provenance (Audit & Reproducibility)

- **File:** `backend/app/services/provenance.py`
    - **Upgrade:** Ubah semua fungsi pencatatan log menjadi `async def`. Operasi I/O (menulis log) tidak boleh memblokir thread komputasi utama.
    - **Integrasi:** Gunakan `FastAPI BackgroundTasks` pada router `finalize`. Ini memisahkan latensi penulisan log audit dari latensi respons ke user. User tidak perlu menunggu DB insert log untuk melihat hasil mereka.
    - **Data Point Kritis:** Simpan `algorithm_sha` (hash dari konten file `logic.py` saat runtime) dan `norms_version` ke dalam setiap record hasil tes. Ini menjamin *reproducibility*: kita bisa merekonstruksi kenapa User A mendapat hasil X lima tahun dari sekarang, meskipun algoritma telah diperbarui 10 kali.

## FASE 3: CONCURRENCY UPGRADE (MINGGU 4)

**Objective:** Migrasi total ke Async I/O untuk mempersiapkan backend menangani ribuan koneksi konkuren dan kompatibilitas Python 3.14 No-GIL. Ini adalah "Heavy Lifting" teknis.

### 3.1. Async Database Layer

Ini adalah perubahan arsitektural terbesar dan paling berisiko. Memerlukan ketelitian tinggi agar tidak memecah fitur yang ada.

- **File:** `backend/app/db/database.py`
    - **Engine:** Ganti `create_engine` dengan `sqlalchemy.ext.asyncio.create_async_engine`.
    - **Driver:** Ganti driver koneksi string dari `postgresql://...` (psycopg2) ke `postgresql+asyncpg://...`. `asyncpg` terbukti 3-5x lebih cepat daripada driver sync dalam benchmark high-concurrency.
    - **Session:** Gunakan `AsyncSession` dan `async_sessionmaker`.
- **File:** `backend/app/db/repositories/*.py` (Semua Repo)
    - **Async Methods:** Ubah semua metode kelas menjadi `async def`.
    - **Query Syntax:** Ganti ORM style lama `db.query(User).filter(...)` dengan sintaks SQLAlchemy 2.0 `await db.execute(select(User).where(...))`.
    - **Fetching:** Ganti `result.scalars().first()` dengan metode async yang sesuai. Hapus semua properti lazy loading (`relationship(lazy='select')`) dan ganti dengan *Eager Loading* eksplisit (`options(selectinload(...))`) karena lazy load implisit akan memicu error di event loop async.

### 3.2. Caching Strategy (Redis)

- **File Baru:** `backend/app/core/cache.py`
    - **Client:** Implementasi Redis Client menggunakan `redis-py` (asyncio mode).
    - **Interface:** Buat abstraksi fungsi `get_cached(key)`, `set_cached(key, val, ttl)`.
- **Implementasi Strategis:**
    - **Norms Cache:** Cache data norma di Redis (TTL: 24 jam) karena jarang berubah tapi dibaca setiap detik. Kunci: `norms:v{ver}:{scale}`. Gunakan *Stale-While-Revalidate* pattern jika memungkinkan.
    - **Session State:** Cache status sesi aktif di Redis untuk validasi cepat middleware/router tanpa memukul DB utama. Kunci: `session:{session_id}:state`.

## FASE 4: FRONTEND SYNCHRONIZATION (MINGGU 5)

**Objective:** Menjamin sinkronisasi sempurna antara Frontend dan Backend, menghilangkan bug tipe data, dan meningkatkan UX menjadi "app-like".

### 4.1. Codegen Contract (Type Safety)

- **File:** `frontend/package.json`
    - **Script:** Tambahkan script otomatisasi: `"gen:api": "openapi-ts -i http://localhost:8000/openapi.json -o src/shared/api/generated --client axios"`.
    - **Workflow:** Wajibkan running script ini di CI/CD pipeline setiap kali ada perubahan di Backend PR. Frontend build harus *fail* jika API contract berubah.
- **File:** `frontend/src/features/future-tunnel/model.ts`
    - **Refactor:** Hapus definisi interface manual (`interface Session { ... }`). Import tipe data langsung dari `src/shared/api/generated`. Ini mencegah *silent bugs* akibat ketidakcocokan nama field (misal: backend kirim `snake_case`, frontend baca `camelCase`).

### 4.2. Robust Tunnel Experience (Resiliency)

- **File:** `frontend/src/features/future-tunnel/hooks/useTunnelSession.ts`
    - **Local Persistence:** Implementasikan penyimpanan jawaban sementara di `localStorage` (`key: tunnel_answers_{sessionId}`) setiap kali user memilih ranking. Ini menyelamatkan data jika browser crash atau user tidak sengaja refresh.
    - **State Recovery:** Saat komponen dimuat (`useEffect`), cek `localStorage`. Jika ada sesi tertunda yang valid (dan belum expired), pulihkan state secara transparan ke user.
    - **Telemetry Beacon:** Gunakan API browser `navigator.sendBeacon()` pada event `onUnload` atau `visibilitychange` untuk mengirim data telemetri terakhir secara andal (misal: user menutup tab karena frustrasi/rage quit).

## FASE 5: DEPLOYMENT & PRODUCTION READINESS (MINGGU 6)

**Objective:** Membangun artifak produksi yang aman, efisien, dan terpantau secara ketat.

### 5.1. Docker Optimization

- **File:** `backend/Dockerfile`
    - **Base Image:** Gunakan `python:3.12-slim` (atau 3.13 jika library pendukung sudah stabil). Hindari image `alpine` untuk Python data science karena isu kompatibilitas wheel `musl` yang lambat dalam kompilasi numpy/pandas.
    - **Multi-stage Build:**
        - *Builder Stage:* Install compiler (gcc), build wheels.
        - *Final Stage:* Copy wheels, install runtime deps saja. Ini bisa mengurangi ukuran image dari 800MB+ menjadi <200MB, mempercepat deployment dan rollback.
    - **Security:** Buat user non-root (`USER appuser`) dan jalankan aplikasi dengan user tersebut. Jangan pernah jalankan container sebagai root.

### 5.2. Web Server Configuration

- **File:** `docker-compose.yml` atau Kubernetes Helm Chart
    - **Command:** Jangan gunakan `uvicorn` langsung untuk produksi. Gunakan Gunicorn sebagai process manager: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`.
    - **Worker Config:** Rumus baku: `(2 x CPU Cores) + 1`. Untuk server standar 2 core, gunakan 5 worker.
    - **Resiliency:** Konfigurasi `timeout` (misal 60s) dan `keep-alive` yang sesuai di belakang Load Balancer (misal: Nginx/AWS ALB) untuk menghindari 502/504 error.

### 5.3. Observability & Logging

- **File:** `backend/app/core/logging.py`
    - **Structured Logging:** Format log sebagai JSON (gunakan library `structlog` atau konfigurasi standar library `logging`). Log teks biasa sulit diparsing mesin.
    - **Tracing:** Pastikan setiap log request memuat `request_id` (correlation ID) dan `user_id`. Ini memungkinkan kita menelusuri satu request spesifik di antara jutaan log ("needle in a haystack").
- **Integrasi:** Setup SDK Sentry untuk *Error Tracking* realtime dan ekspos endpoint `/metrics` (Prometheus format) untuk monitoring kesehatan aplikasi (RPS, Latency, Error Rate).

## PROTOKOL QA & SIGN-OFF (THE IRON GATE)

Bagian ini mendefinisikan "Gerbang Besi" yang harus dilalui kode sebelum menyentuh environment Production. Kita tidak mengandalkan "firasat" bahwa kode sudah aman; kita membuktikannya dengan data keras. Setiap protokol di bawah ini dirancang untuk mengungkap kelemahan spesifik yang sering terlewatkan dalam pengujian fungsional standar.

### A. Integritas Transaksional (The Bank Vault Test)

Protokol ini memastikan integritas aset digital pengguna (kuota tes) setara dengan standar perbankan. Dalam konteks sistem hibah akademik, kehilangan satu kredit atau membiarkan satu kredit digunakan dua kali adalah kegagalan integritas yang tidak dapat diterima.

1. **Race Condition & Idempotency Simulation:**
    - **Objective:** Memastikan mekanisme *row locking* berfungsi di bawah tekanan konkurensi ekstrem.
    - **Metodologi:** Gunakan alat uji beban seperti `k6` atau `Locust`. Buat skrip khusus yang menembakkan 100 *request* `redeem_credit` secara serentak (paralel) dalam jendela waktu < 1 detik untuk 1 User ID yang hanya memiliki saldo `1` kredit.
    - **Advanced Scenario:** Sertakan header `X-Idempotency-Key` yang sama untuk setengah request, dan berbeda untuk sisanya, untuk menguji logika idempotensi API layer.
    - **Pass Criteria:**
        - Database hanya mencatat **tepat 1 transaksi sukses** di tabel `grant_usage_logs` atau pengurangan saldo.
        - 99 request lainnya harus mengembalikan kode error yang sesuai dan informatif: HTTP 409 Conflict (untuk request duplikat/konflik), 402 Payment Required (saldo habis), atau 429 Too Many Requests (rate limit).
        - Saldo akhir pengguna adalah `0`. Saldo negatif (`1`, `99`) adalah tanda kegagalan locking dan *rejection*.
    - **Diagnostic Tools:** Gunakan query `pg_locks` pada PostgreSQL saat tes berjalan untuk memverifikasi bahwa *exclusive locks* (`RowExclusiveLock`) benar-benar terbentuk pada baris `access_grants`.
2. **Deadlock & Transaction Isolation Resilience:**
    - **Objective:** Memastikan sistem dapat pulih dari kondisi deadlock yang tak terhindarkan dalam database relasional dengan isolasi tinggi.
    - **Metodologi:** Simulasikan beban tinggi di mana dua transaksi kompleks mencoba mengunci resource yang saling berlawanan (Circular Wait). Misal: Transaksi A mengunci Grant X lalu butuh User Y; Transaksi B mengunci User Y lalu butuh Grant X.
    - **Configuration:** Set level isolasi transaksi database ke `READ COMMITTED` (standar Postgres) atau `REPEATABLE READ` jika logika bisnis menuntut konsistensi snapshot yang lebih ketat.
    - **Pass Criteria:**
        - Database (PostgreSQL) mendeteksi deadlock dan secara proaktif membatalkan ("kill") salah satu transaksi untuk membebaskan lock.
        - Aplikasi menangani exception `DeadlockDetected` atau `SerializationFailure` dengan mekanisme *automatic retry* (maksimal 3x dengan *exponential backoff*) secara transparan. User tidak boleh melihat error 500 "Internal Server Error".
        - Tidak ada *zombie connection* yang tertinggal di pool koneksi database.
3. **Data Consistency Verification:**
    - **Objective:** Memastikan data agregat konsisten dengan data detail (ledger integrity).
    - **Metodologi:** Jalankan script rekonsiliasi data secara berkala (atau post-test).
    - **Pass Criteria:** Jumlah `credits_consumed` pada tabel `access_grants` harus sama persis dengan jumlah baris di tabel `grant_usage_logs` (atau `assessment_sessions` yang link ke grant tersebut). Selisih > 0 menandakan kebocoran logika.

### B. Validitas Ilmiah (The Professor Test)

Protokol ini menjamin bahwa setiap angka yang dihasilkan oleh mesin memiliki dasar matematika yang kuat dan dapat dipertanggungjawabkan secara akademis. Mesin ini adalah instrumen riset, bukan sekadar kuis online.

1. **Algorithmic Integrity & Regression Verification:**
    - **Objective:** Memastikan logika backend menghasilkan skor yang identik dengan model referensi manual.
    - **Metodologi:** Gunakan teknik *Property-Based Testing* (misal: library `Hypothesis` di Python) untuk men-generate ribuan variasi input acak, termasuk kasus ekstrem (semua jawaban '1', pola zig-zag, pola acak sempurna).
    - **Skenario:** Bandingkan output JSON dari API dengan "Gold Standard" (kalkulator Excel KLSI 4.0 resmi atau implementasi referensi terpisah dalam bahasa R/Julia).
    - **Pass Criteria:**
        - Untuk 10.000 dataset input yang berbeda, deviasi hasil skor (LFI, AC, CE, AE, RO, ACCE, AERO) harus tepat **0.00** (presisi desimal). Toleransi floating point (`epsilon`) diperbolehkan hanya di digit ke-15.
        - Kategori Gaya Belajar harus identik 100%. Tidak boleh ada kasus "Edge Case" di mana Excel mengatakan "Acting" tapi API mengatakan "Thinking" karena perbedaan pembulatan.
    - **Konsekuensi Kegagalan:** Validitas riset runtuh. Makalah akademik yang menggunakan data ini berisiko ditarik kembali (*retracted*).
2. **Norms Boundary & Versioning Consistency:**
    - **Objective:** Memverifikasi bahwa logika pemilihan norma demografis dan penentuan batas kategori berjalan deterministik.
    - **Metodologi:** Teknik *Boundary Value Analysis*. Uji input skor mentah yang berada tepat di perbatasan persentil kritis (misal: persentil 20.0, 80.0, dan mean).
    - **Skenario:**
        - Lakukan tes dengan profil demografi yang berbeda (Pria vs Wanita, S1 vs S2, Umur 20 vs 50) untuk memastikan *NormProvider* memuat tabel lookup yang benar.
        - Lakukan tes regresi versi: Ubah versi norma di database (misal ke norma tahun lalu) dan pastikan kalkulasi ulang (re-scoring) menghasilkan angka yang sesuai dengan norma lama tersebut.
    - **Pass Criteria:**
        - Sistem menangani *boundary value* secara deterministik (misal: $\ge 80.0$ selalu High, $< 80.0$ selalu Mid, tidak random).
        - Log provenance mencatat versi norma yang tepat (misal `norms_v2_2025`) untuk setiap sesi, bukan sekadar "default".
3. **Psychometric Distribution Analysis:**
    - **Objective:** Mendeteksi anomali sistemik pada algoritma scoring.
    - **Metodologi:** Generate 50.000 sesi simulasi dengan input acak yang terdistribusi normal. Plot hasil *Learning Style* yang dihasilkan.
    - **Pass Criteria:** Distribusi gaya belajar tidak boleh menunjukkan *skewness* ekstrim ke satu gaya tertentu (kecuali memang properti instrumennya demikian). Jika 90% hasil simulasi random menghasilkan "Balancing", ada bug di logika *cut-off*.

### C. Keamanan & Kepatuhan (The Hacker Test)

Protokol ini menguji ketahanan sistem terhadap serangan siber dan pelanggaran privasi data sesuai standar OWASP dan regulasi privasi (misal UU PDP).

1. **Authorization & IDOR (Insecure Direct Object Reference) Breach:**
    - **Objective:** Memastikan isolasi data antar pengguna (Multi-tenancy safety).
    - **Metodologi:** Gunakan skrip otomatis atau tool DAST seperti OWASP ZAP/Burp Suite untuk mencoba mengakses resource lintas pengguna.
    - **Skenario:** User A (login sah) mencoba memanipulasi parameter URL/Body untuk memanggil endpoint `GET /api/v1/sessions/{session_id_milik_user_B}/results` atau `POST /api/v1/sessions/{session_id_milik_user_B}/finalize`.
    - **Pass Criteria:**
        - Sistem menolak secara tegas dengan HTTP 403 Forbidden (atau 404 Not Found untuk mencegah *enumeration*).
        - Log keamanan sistem mencatat upaya akses ilegal tersebut dengan User ID pelakunya untuk forensik.
    - **Specific Check:** Pastikan endpoint "Print Report" yang menggunakan token publik/share link tidak membocorkan data pribadi (PII) user selain nama.
2. **Audit Trail & Provenance Verification:**
    - **Objective:** Menjamin *Non-Repudiation* (penyangkalan) data.
    - **Metodologi:** Lakukan audit *End-to-End* pada satu siklus hidup data lengkap.
    - **Skenario:** User mendaftar -> Mendapat Grant (oleh Admin) -> Mengerjakan Tes -> Finalisasi -> Melihat Hasil.
    - **Pass Criteria:**
        - Rantai data (*Data Lineage*) tidak terputus: ID di `access_grants` refer ke `users` (pemberi & penerima), `assessment_sessions` refer ke `access_grants` (via source), dan `provenance_logs` refer ke `assessment_sessions`.
        - Hash algoritma (`algorithm_sha`) tersimpan dan valid. Jika file kode berubah 1 byte, hash harus berubah.
        - Tidak ada "Orphan Data" (data sesi tanpa pemilik atau data nilai tanpa referensi norma/versi).
3. **Vulnerability Scanning (Automated):**
    - **Objective:** Mendeteksi celah keamanan pada dependensi pihak ketiga.
    - **Metodologi:** Integrasikan tool SCA (Software Composition Analysis) seperti `Safety` atau `Snyk` di pipeline CI/CD.
    - **Pass Criteria:** Build pipeline harus gagal (*block*) jika ditemukan dependensi dengan CVE (Common Vulnerabilities and Exposures) level High/Critical.

### D. Performa & Stabilitas (The Stress Test)

Protokol ini memastikan sistem tidak runtuh di bawah tekanan beban puncak saat musim ujian atau penerimaan mahasiswa baru, serta mampu pulih dari bencana.

1. **High-Throughput Load & Soak Testing:**
    - **Objective:** Mengukur batas kapasitas dan stabilitas jangka panjang.
    - **Metodologi:** Bedakan antara *Spike Test* (lonjakan tiba-tiba) dan *Soak Test* (beban moderat durasi panjang). Gunakan infrastruktur terpisah untuk *load generator* agar tidak menjadi *bottleneck*.
    - **Skenario:**
        - *Spike:* Tembak endpoint `/start` dan `/finalize` dengan beban 1.000 - 5.000 RPS (Request Per Second) selama 5 menit (simulasi jam masuk kelas).
        - *Soak:* Jalankan beban 500 RPS selama 4 jam terus menerus untuk mendeteksi *Memory Leak* atau *Connection Pool Exhaustion*.
    - **Pass Criteria:**
        - Latensi API p95 (95% request) tetap stabil di bawah 200ms. Latensi p99 di bawah 1 detik.
        - Error rate global < 0.01% (hampir nol). Error 5xx tidak dapat diterima.
        - Penggunaan memori Container/Pod stabil (datar), grafik tidak menanjak terus (indikasi *Memory Leak* di Python).
2. **Disaster Recovery & Data Reversibility:**
    - **Objective:** Memastikan sistem dapat dikembalikan ke keadaan aman jika deployment gagal total.
    - **Metodologi:** Simulasikan kegagalan migrasi dan korupsi data di lingkungan Staging.
    - **Skenario:** Jalankan migrasi database `alembic upgrade head`, verifikasi data masuk, lalu paksa `alembic downgrade base` (atau revisi sebelumnya).
    - **Pass Criteria:**
        - Database kembali ke struktur schema awal tanpa error.
        - Tidak ada data yang tertinggal (dangling tables/sequences) atau *partial state* yang membingungkan.
        - Dokumen "Rollback Plan" terbukti bisa dieksekusi oleh engineer dalam waktu < 15 menit.
3. **Resilience Testing (Chaos Engineering Light):**
    - **Objective:** Menguji ketahanan aplikasi terhadap kegagalan komponen eksternal.
    - **Skenario:** Putuskan koneksi ke Redis atau Database Slave secara paksa saat load test berjalan.
    - **Pass Criteria:**
        - Jika Redis mati, sistem harus *failover* ke database utama (dengan performa menurun tapi tetap jalan) atau memberikan pesan error yang sopan, bukan crash/hang.
        - Sistem pulih otomatis (self-healing) begitu koneksi tersambung kembali.

*Master Plan ini disusun dengan presisi tinggi untuk memastikan Zenotika V4.0 tidak hanya "berjalan", tetapi berdiri kokoh sebagai standar emas infrastruktur riset digital yang berintegritas, aman, dan terpercaya.*