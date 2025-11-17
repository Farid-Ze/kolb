# TODO 4.0 – Engine & DB Architecture Audit

> Catatan: daftar ini hanya mencakup temuan yang berkaitan langsung dengan engine, DB/session management, KLSI 4.0 logic, dan arsitektur layer. Hal-hal non‑kritis (naming, cosmetic style) sengaja diabaikan.

## A. Engine Runtime & Finalization

- [ ] **Finalize: strategi vs deklaratif – dead branch & kontrol alur**  
  `engine/finalize.py::finalize_assessment` memiliki dua jalur: (1) jalur `strategy` (pipeline declarative + `strategy.finalize`), (2) jalur fallback berbasis `assessment.steps`. Perlu audit menyeluruh bahwa kedua jalur ini tidak menghasilkan perbedaan perilaku yang tidak diinginkan (khususnya untuk KLSI 4.0) dan bahwa boundary dengan `EngineRuntime.finalize_with_audit` konsisten. Tambahan boundary tests untuk parity antara jalur strategi dan jalur langkah manual.

- [x] **Finalize: penanganan `issues` saat ada validation rules**  
  Di `finalize_assessment`, ketika `assessment.validation_rules()` mengembalikan `issues`, ada blok:
  ```python
  fatal = [i for i in issues if i.fatal]
  if strategy:
      return {"ok": False, "issues": [i.as_dict() for i in issues]}
  ```
  Namun variabel `strategy` baru didefinisikan setelah pemanggilan `ensure_default_strategies_loaded()` dan loop kandidat, sementara potongan kode ini dieksekusi sebelumnya. Perlu review untuk memastikan tidak ada `NameError` dan alur logika `ok=False` konsisten dengan kontrak `EngineRuntime` dan tests.

- [x] **Finalize: konsistensi penggunaan `ValidationResult` vs `issues`**  
  `ValidationResult` digunakan untuk menyimpan provenance dan hasil `check_session_complete`, sementara `issues` dari validation rules dikembalikan sebagai list dict. Perlu konsolidasi/standarisasi interface (mis. semua validation output melalui `ValidationResult`) agar audit dan observability lebih mudah.

- [ ] **Finalize: snapshot artefak & audit hash – cakupan field**  
  `artifact_snapshots` menyimpan subset field dari `scale`, `combo`, `style`, `lfi`, dan `percentiles` (tanpa `entity`). Perlu review bahwa:
  - Semua field yang dibutuhkan untuk rekonstruksi audit (termasuk BAL_ACCE/BAL_AERO, heuristik, dan provenance norm) sudah tercakup.
  - SHA-256 hash konsisten antara versi dengan dan tanpa strategi/pipeline deklaratif.

- [ ] **Finalize: dependency check untuk declarative steps**  
  Di cabang non-strategy, tiap `step.run` dipanggil setelah mengecek bahwa setiap `dep` ada di `artifact_snapshots` atau `ctx`. Perlu pastikan bahwa definisi dep di `assessments/klsi_v4/definition.py` konsisten dengan realitas fungsi `logic.py` (raw → combination → style → LFI → percentiles → delta) dan menambah tests untuk dependency yang salah/ordering error.

- [ ] **Finalize: anomali & provenance LFI/konteks – konsistensi lintas jalur**  
  Bagian akhir `finalize_assessment` menambah anomaly tags (`RAW_OUTSIDE_NORM_RANGE`, `EXCESSIVE_TRUNCATION`, `MIXED_PROVENANCE`, `LOW_W_PATTERN`, `HIGH_W_UNIFORMITY`, `LFI_REPEATED_PATTERN_*`, `NEAR_STYLE_BOUNDARY`) ke `ValidationResult`. Pastikan semua anomaly ini juga terefleksi di payload yang dikembalikan ke klien (via services/engine) dan didokumentasikan di schema/report, serta jalur finalize via `EngineRuntime.finalize_with_audit` menghasilkan konteks/anomali yang setara.

## B. Engine Runtime & Session Handling

- [ ] **EngineRuntime: path `_components_enabled` vs non-components**  
  `EngineRuntime._resolve_session` punya dua jalur: ketika runtime components aktif, ia memanfaatkan `RuntimeScheduler`; jika tidak, ia langsung memakai `RepositoryProvider.sessions`. Perlu tests tambahan yang memverifikasi kedua jalur ini bekerja identik untuk kasus umum (session not found, session completed, dsb.).

- [ ] **EngineRuntime: integrasi `run_session_validations`**  
  `_phase_validate` memanggil `run_session_validations(context.db, session.id)` dan membungkus hasilnya ke `ValidationReport`. Pastikan bahwa subset validation yang sama juga dijalankan ketika `finalize_assessment` melalui jalur strategi (agar tidak ada perbedaan antara finalize via EngineRuntime vs finalize langsung).

- [ ] **EngineRuntime: error reporting metadata parity**  
  `_log_runtime_error` mengirim structured metadata ke `RuntimeErrorReporter` atau logger langsung. Pastikan semua event (`scorer_issue_event`, `runtime_error_event`, dsb.) di seluruh pipeline selalu menyertakan `correlation_id`, `session_id`, `user_id`, dan info pipeline yang cukup, lalu tambahkan tests untuk mem-verifikasi bentuk struktur log (smoke test).

## C. DB Engine, Session, dan Repository Scope

- [ ] **DatabaseGateway: konfigurasi pool untuk Postgres – monitoring**  
  `_build_engine()` mengatur `QueuePool` dengan `db_pool_size`, `db_max_overflow`, `db_pool_timeout`, `db_pool_recycle`, dan `db_pool_pre_ping`. Tambahkan diagnostics/metrics (atau log sekali di startup) yang menyimpan snapshot `ENGINE_CONFIG_SNAPSHOT` ke log sehingga konfigurasi koneksi dapat diaudit dari luar tanpa introspeksi kode.

- [ ] **DatabaseGateway: `hyperatomic_session` contract enforcement**  
  `hyperatomic_session` adalah transactional scope ketat dengan `flush_before_commit=True`. Perlu memastikan tidak ada kode yang memanggil `session.commit()` secara manual di dalam scope ini (di luar lapisan DB). Tambah greps/tests atau lint rule sederhana untuk mencegah commit manual di luar helper-lapisan DB.

- [ ] **Norm session & main session separation**  
  `norm_session_scope` menggunakan `SessionLocal()` terpisah dari `database_gateway.session()`. Perlu audit bahwa session untuk norm lookup tidak pernah digunakan untuk menulis entitas lain (hanya read-only) agar tidak ada write yang lolos di luar transaksi utama.

- [ ] **RepositoryProvider vs direct Session usage**  
  Di `engine`, `services`, dan `routers`, pastikan akses ke DB hanya dilakukan via `RepositoryProvider` atau helper session official (`get_db`, `get_session`, `transactional_session`, `hyperatomic_session`, `norm_session_scope`). Tambahkan tests atau static check untuk mendeteksi pola `Session(...)` atau `session.query()` yang bocor ke layer yang tidak semestinya.

- [ ] **EngineSessionService: mixing Repository dan direct ORM**  
  `services/engine.EngineSessionService` menggunakan `SessionRepository` untuk pembacaan session, tetapi menulis `UserResponse` dan `LFIContextScore` langsung dengan `db.add(...)` di `_persist_batch_payload`. Pertimbangkan menyatukan penulisan ini ke repository khusus (mis. `UserResponseRepository`/`LFIContextRepository`) agar pola akses data konsisten dan lapisan services tetap bebas dari ORM.

## D. Norms, Cache, dan Provenance

- [x] **Percentile cache: ukuran & invalidation**  
  `_PERCENTILE_CACHE` di `assessments/klsi_v4/logic.py` menggunakan `cachetools.LRUCache` dengan ukuran `settings.norm_percentile_cache_size` (default 8192). Pastikan bahwa `clear_percentile_cache()` selalu dipanggil setelah impor norm (berdampingan dengan `clear_norm_db_cache`) untuk menghindari stale data pada jalur logic tingkat assessment.

- [x] **Percentile cache: key normalisation**  
  `_lookup_percentile_cached` meng-cast `raw` menjadi `int` ketika membuat key. Untuk skala yang potensial menggunakan nilai float (mis. LFI dua desimal), perlu verifikasi bahwa normalisasi ke int tidak merusak presisi (atau gunakan key `Decimal`/`tuple` yang memelihara presisi LFI). Tambahkan tests batas `raw` untuk LFI dan mode.

- [ ] **Norm provenance: konsistensi antara model dan payload**  
  `PercentileScore` menyimpan `norm_provenance`, `truncated_scales`, `raw_outside_norm_range`, `used_fallback_any` di DB, sementara payload percentiles di `finalize_assessment` memetakan kembali ke struktur dict. Pastikan bahwa setiap perubahan schema/provenance di DB punya test yang menjamin payload tetap sinkron.

- [ ] **ExternalNormProvider: TTL cache & background fetch safety**  
  `engine/norms/composite.ExternalNormProvider` mengelola TTL cache dan background fetch dengan thread terpisah. Tambahkan tests yang memverifikasi: (1) key cache selalu memakai `int(raw)`, (2) TTL dan ukuran cache (`external_norms_ttl_sec`, `external_norms_cache_size`) dihormati, (3) thread background tidak melempar exception yang bocor ke caller, dan (4) statistik `cache_stats()` konsisten dengan penghitungan internal.

## E. KLSI 4.0 Logic & Style Assignment

- [ ] **STYLE_CUTS closure bug potensial (`_build_style_cuts`)**  
  `_build_style_cuts` mendefinisikan fungsi `rule` dalam loop untuk tiap `style_name, window`, tetapi menggunakan `w: StyleWindow = window` sebagai default argumen untuk menghindari late-binding. Perlu tests tambahan di `tests/test_style_boundaries.py` atau sejenis yang memverifikasi semua 9 fungsi `STYLE_CUTS` benar-benar memakai window masing-masing (bukan semuanya memakai window terakhir).

- [ ] **Balance percentiles – komunikasi heuristik**  
  Walau sudah ada tests untuk label non-normatif, pastikan seluruh titik konsumsi (report builder, API payload) menandai field ini sebagai heuristik, bukan persentil normatif, terutama dalam metadata i18n atau schema OpenAPI.

- [ ] **Age band mapping edge cases**  
  `_age_to_band` mengonversi `User.date_of_birth` ke band. Perlu tests untuk edge case tanggal lahir tepat di batas (19, 24, 25, 34, dsb.) dan kasus timezone/tanggal `datetime` vs `date` untuk menghindari off-by-one bug.

- [ ] **Longitudinal delta: toleransi missing relationships**  
  `compute_longitudinal_delta` mengasumsikan bahwa `previous.learning_style` dan `previous.lfi_index` tersedia untuk menghitung `delta_intensity` dan `delta_lfi`. Pastikan ada tests / guard yang menangani kasus ketika session sebelumnya ada tetapi relasi ini belum terisi (mis. migrasi lama), sehingga finalize tidak gagal secara runtime.

## F. Engine Authoring & DSL Migrasi

- [ ] **Seeder KLSI → engine authoring tables**  
  Implementasi seeding dari konfigurasi KLSI ke tabel engine (`EngineInstrument`, `EngineForm`, `EngineItem`, `EngineItemOption`, `EngineScale`, `EngineScoringRule`) perlu audit bahwa:
  - Semua item dan opsi forced-choice terwakili dengan benar,
  - `learning_mode` dan `value` konsisten dengan logic `aggregate_mode_scores`.

- [ ] **Adapter runtime: sumber item tunggal**  
  Saat feature flag diaktifkan, runtime harus membaca item dan skala KLSI hanya dari tabel engine authoring, tetapi masih memanggil fungsi scoring KLSI yang sama. Perlu tests parity untuk memastikan perubahan sumber data tidak mengubah skor.

- [ ] **DSL coverage & safety**  
  Saat memindahkan perhitungan ke DSL (SUM, DIFF, PERCENTILE, CLASSIFY, CUSTOM), pastikan: 
  - Semua operasi tetap pure dan deterministik,
  - Tidak ada akses langsung ke DB atau side effect di expression evaluator.

## G. Tests, Observability, dan Tooling

- [ ] **Tambah smoke test untuk `get_engine_config_snapshot()`**  
  Pastikan helper ini dipanggil setidaknya sekali di tests untuk memverifikasi struktur snapshot dan menjaga agar future refaktor tidak memecahkan observability.

- [x] **Tambahan tests untuk `repository_scope()` dan `hyperatomic_session()`**  
  `test_database_session_helper` sudah menguji `get_session`. Tambahkan tests serupa untuk `repository_scope()` dan `hyperatomic_session()` (termasuk kasus exception di dalam blok) agar kontrak rollback/commit teruji dengan baik.

- [ ] **Static checks/grep guard untuk pelanggaran arsitektur**  
  Pertimbangkan menambah check sederhana (mis. script pytest/CI ringan) yang memastikan:
  - Tidak ada `from sqlalchemy.orm import Session` di `routers/`,
  - Tidak ada akses langsung ke model di `routers/` tanpa melalui `services`.

- [ ] **End-to-end parity tests antara engine router dan legacy**  
  Tambahkan tests E2E yang membandingkan hasil `submit_all` + `engine.finalize_with_audit` dengan jalur finalize legacy (jika masih ada) untuk beberapa profil boundary (near style boundaries, norm truncation, extreme LFI) guna memastikan migrasi ke engine runtime tidak mengubah hasil psikometrik.

- [ ] **Report heuristics vs normative data – dokumentasi & tests**  
  Beberapa heuristik di `services/report.py` dan `services/regression.py` (mis. _derive_learning_space_suggestions, _classify_development, prediksi LFI berbasis regresi) bersifat non-diagnostik dan tidak normatif. Pastikan semua output ini jelas diberi label sebagai heuristik di payload dan dokumentasi (README, docs), serta tambahkan tests yang memverifikasi bahwa perubahan konfigurasi regresi tidak mempengaruhi core skor KLSI (raw modes, ACCE/AERO, LFI resmi).

- [ ] **Security & research access – konsistensi role/JWT & logging**  
  Audit `services/security.py`, `routers/auth.py`, `routers/admin.py`, dan `routers/research.py` untuk memastikan: (1) `get_current_user` hanya dipakai di layer router/service (bukan di engine/assessments), (2) semua endpoint sensitif (import norms, research CRUD, perf-metrics) selalu memeriksa role `MEDIATOR` melalui helper tunggal (mis. `_require_mediator`), (3) JWT `aud/iss` di-config konsisten antara create/decode/token usage di tests, dan (4) failure-path DB (commit/rollback) selalu tercatat via structured logging dengan field minimal `user_id`, `email`, dan `operation`.

---

Ini adalah backlog engineering fokus engine/DB/assessment. Setiap poin sebaiknya dibuatkan ticket/issue terpisah dengan detail lebih lanjut dan dikaitkan dengan referensi dokumen di `docs/` dan/atau `tests/` yang relevan.
