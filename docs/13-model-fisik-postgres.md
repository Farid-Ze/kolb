# Model Fisik – PostgreSQL Implementation

Dokumen ini merinci aspek fisik untuk implementasi PostgreSQL yang melengkapi `10-model-data-klsi.md` dan `12-model-logis-relasional.md`. Semua angka dan rumus psikometrik tetap terpusat di `psychometrics_spec.md`.

## 1. Tipe Data & Enums
- Identitas: `INTEGER` PK autoincrement (SQLAlchemy Integer + PK).
- Waktu: `TIMESTAMP WITHOUT TIME ZONE` (gunakan UTC; pertimbangkan migrasi ke timestamptz di masa depan).
- Enum: `Gender`, `AgeGroup`, `EducationLevel`, `SessionStatus`, `ItemType`, `LearningMode` disimpan via `ENUM` PostgreSQL.
- Angka: skor mentah/difference/balance `INTEGER`; koefisien W, LFI, persentil `DOUBLE PRECISION`/`FLOAT`.
- JSON: `kite_coordinates`, `contexts_used` → `JSONB` (untuk indeks GIN jika diperlukan).

## 2. Indeks & Constraint (Di luar PK/FK bawaan)
- Ipsatif enforcement (di level skema):
  - UNIQUE(session_id, item_id, rank_value)
  - UNIQUE(session_id, choice_id)
  - CHECK rank_value BETWEEN 1 AND 4
- Norma: UNIQUE(norm_group, scale_name, raw_score)
- Partial index: `assessment_sessions (user_id, end_time) WHERE status='Completed'` untuk laporan.
- Rekomendasi tambahan (diterapkan di migrasi 0003):
  - `user_responses(session_id, item_id)`
  - `item_choices(item_id)`
  - `assessment_items(item_number, item_type)`
  - `scale_scores(session_id)`, `combination_scores(session_id)`, `user_learning_styles(session_id)`, `percentile_scores(session_id)`, `lfi_context_scores(session_id)`, `backup_learning_styles(session_id)`

## 3. View & Materialized View
- `v_style_grid` (CREATE VIEW IF NOT EXISTS): menyajikan band ACCE/AERO dan style.
- `mv_class_style_stats` (CREATE MATERIALIZED VIEW IF NOT EXISTS): agregasi kelas/tanggal; indeks `(kelas, date)`.
- Refresh: `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_class_style_stats` (tambahkan unique index ON ROWS jika dipilih concurrent refresh).

## 4. Partisi & Skala
- `assessment_sessions` dapat dipartisi RANGE by month/semester berbasis `end_time::date` untuk volume besar.
- `user_responses` dapat dipartisi HASH by `session_id` jika ingest sangat tinggi.
- Gunakan `pg_partman` atau native declarative partitioning jika dibutuhkan.

## 5. Privasi & Keamanan
- PII minim: hash/alias untuk ekspor; audit akses dibukukan di `audit_log`.
- Gunakan kolom `role` untuk kontrol akses aplikasi (bukan DB-row level security, kecuali dibutuhkan).
- Cadangkan data norma sebagai artefak yang terpisah (mencegah modifikasi tak sengaja) dan log impor.

## 6. Operasi & Pemeliharaan
- Jadwalkan job untuk:
  - Refresh `mv_class_style_stats` pasca batch scoring.
  - Konsistensi: job audit untuk memverifikasi kalkulasi derivatif dari `user_responses` sampling.
- Vacuum/Analyze rutin pada tabel heavy-write (`user_responses`).

## 7. Migrasi yang Ditambahkan
- `0003_add_recommended_indexes.py`: menambahkan indeks kinerja yang disarankan.

## 8. Catatan kompatibilitas SQLite (unit test)
- Partial index dan materialized view diabaikan otomatis bila bukan PostgreSQL (lihat migrasi 0001/0002 yang memeriksa `conn.dialect.name`).
- Indeks `IF NOT EXISTS` ditangani defensif (try/except) untuk SQLite.

## 9. Keterkaitan Psikometrik
- Tidak ada formula numerik di level fisik—semua mengacu ke `psychometrics_spec.md`. Constraint hanya menjaga validitas struktural (ipsatif, domain rank, unik norma).

## 10. Next
- Bila beban query JSON meningkat, tambahkan GIN index pada `user_learning_styles.kite_coordinates`/`backup_learning_styles.contexts_used`.
- Pertimbangkan promosi `timestamptz` & migrasi UTC secara eksplisit.
