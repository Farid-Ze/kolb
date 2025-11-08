# Model Data KLSI 4.0: Konseptual → Logis → Fisik

Dokumen ini menjabarkan model data end‑to‑end untuk sistem KLSI 4.0 berdasarkan seluruh dokumen di folder `docs/`, skema ORM (`app/models/klsi.py`), serta migrasi database. Isi dan aturan psikometrik telah divalidasi selaras dengan The Kolb Learning Style Inventory 4.0 – Guide to Theory, Psychometrics, Research & Applications (khususnya Appendix 1 & 7) sebagaimana juga diringkas pada `docs/psychometrics_spec.md`.

Catatan singkat validasi terhadap KLSI 4.0 Guide:
- Mode: CE, RO, AC, AE; dialektika: ACCE = AC − CE, AERO = AE − RO.
- Grid 3×3 berdasarkan band ACCE (<6, 6–14, >14) dan AERO (<1, 1–11, >11) → 9 gaya. (Harmonisasi: notasi diseragamkan agar tidak ambigu pada titik batas.)
- LFI = 1 − Kendall’s W; konteks berbasis ranking 1..4 untuk 4 mode.
- Konversi persentil berbasis tabel norma; fallback konservatif nearest‑lower ketika exact row tidak tersedia.


## 1) Model Konseptual (ER) – Apa dan mengapa

Domain dibagi menjadi 5 kelompok agar mudah ditelusuri.

1) Core Assessment
- User: identitas responden (nama, email, NIM/kelas opsional, demografi ringkas).
- AssessmentSession: satu kesempatan pengisian; waktu mulai/akhir, status, versi inventori.
- AssessmentItem: butir; 12 item untuk gaya, 8 konteks untuk fleksibilitas (tipe item membedakan keduanya).
- ItemChoice: opsi pernyataan per item, tiap opsi memetakan ke satu mode (CE/RO/AC/AE).
- UserResponse: jawaban ipsatif berupa peringkat unik 1..4 per item.

2) Scoring & Style Typology
- ScaleScore: agregasi skor mentah per mode (CE, RO, AC, AE).
- CombinationScore: difference scores (ACCE, AERO) + kombinasi klasik (Assimilation/Accommodation, Converging/Diverging) dan skor keseimbangan (balance_acce/aero) non‑ipsatif.
- LearningStyleType: kamus 9 gaya (nama, kode, rentang ACCE/AERO, deskripsi).
- UserLearningStyle: hasil klasifikasi gaya utama per sesi termasuk koordinat “kite” dan intensitas.
- BackupLearningStyle: gaya cadangan (frekuensi/proporsi kemunculan logis dari jendela terdekat).
- PercentileScore: persentil CE/RO/AC/AE/ACCE/AERO per sesi + norm group dipakai.

3) Learning Flexibility
- LFIContextScore: ranking per konteks (8 konteks × 4 mode) sebagai bahan hitung Kendall’s W.
- LearningFlexibilityIndex: hasil W dan LFI serta kategorinya.

4) Norms & Statistics
- NormativeConversionTable: tabel konversi (norm_group, scale_name, raw_score → percentile) dari Appendix.
- NormativeStatistics: ringkasan statistik sampel normatif per grup.

5) Audit & Reporting
- AuditLog: jejak tindakan penting (aktor, aksi, hash payload, timestamp).
- v_style_grid (view): grid ACCE/AERO beserta band dan style_name.
- mv_class_style_stats (mat. view): agregasi statistik gaya per kelas dan tanggal (untuk PostgreSQL).

Relasi utama (ringkas):
- User 1—N AssessmentSession 1—N UserResponse N—1 ItemChoice N—1 AssessmentItem.
- AssessmentSession 1—1 ScaleScore, 1—1 CombinationScore, 1—1 UserLearningStyle, 1—1 LearningFlexibilityIndex.
- AssessmentSession 1—N LFIContextScore.
- LearningStyleType 1—N UserLearningStyle, 1—N BackupLearningStyle.

Aturan bisnis inti:
- Ipsatif unik: untuk setiap item dalam satu sesi, ranking berisi {1,2,3,4} tanpa duplikasi dan satu choice hanya boleh dipilih sekali per sesi.
- Skor mentah mode = jumlah rank per mode; difference scores dihitung deterministik; banding ACCE/AERO menentukan style (canonical bands: ACCE <6 / 6–14 / >14; AERO <1 / 1–11 / >11).
- LFI dihitung dari Kendall’s W pada 8 konteks; LFI = 1 − W.
- Persentil dikonversi dari tabel norma dengan precedence grup yang jelas (lihat bagian logis/fisik).


## 2) Model Logis (Relasional) – Bagaimana dipetakan

Tabel inti (PK → primary key, FK → foreign key; tipe data dibahas di bagian fisik):

- users (PK id)
  - Atribut: full_name, email (unik), nim (unik opsional), kelas, tahun_masuk, date_of_birth, gender, education_level, country, occupation, role, created_at, updated_at.

- assessment_sessions (PK id, FK user_id → users.id)
  - Atribut: start_time, end_time, status {Started/In Progress/Completed/Abandoned}, version, session_type, days_since_last_session.
  - Indeks parsial (fisik): untuk status Completed.

- assessment_items (PK id)
  - Atribut: item_number, item_type {Learning_Style/Learning_Flexibility}, item_stem, item_category, item_order_position, language.

- item_choices (PK id, FK item_id → assessment_items.id)
  - Atribut: learning_mode {CE/RO/AC/AE}, choice_text.

- user_responses (PK id, FK session_id → assessment_sessions.id, FK item_id → assessment_items.id, FK choice_id → item_choices.id)
  - Atribut: rank_value.
  - Constraints: UNIQUE(session_id, item_id, rank_value); UNIQUE(session_id, choice_id); CHECK rank_value BETWEEN 1 AND 4.

- scale_scores (PK id, FK session_id UNIQUE → assessment_sessions.id)
  - Atribut: CE_raw, RO_raw, AC_raw, AE_raw.

- combination_scores (PK id, FK session_id UNIQUE → assessment_sessions.id)
  - Atribut: ACCE_raw, AERO_raw, assimilation_accommodation, converging_diverging, balance_acce, balance_aero.

- learning_style_types (PK id)
  - Atribut: style_name (unik), style_code (unik), ACCE_min/max, AERO_min/max, quadrant, description.

- user_learning_styles (PK id, FK session_id UNIQUE → assessment_sessions.id, FK primary_style_type_id → learning_style_types.id)
  - Atribut: ACCE_raw, AERO_raw, kite_coordinates (JSON), style_intensity_score.

- lfi_context_scores (PK id, FK session_id → assessment_sessions.id)
  - Atribut: context_name, CE_rank, RO_rank, AC_rank, AE_rank.

- learning_flexibility_index (PK id, FK session_id UNIQUE → assessment_sessions.id)
  - Atribut: W_coefficient, LFI_score, LFI_percentile, flexibility_level.

- backup_learning_styles (PK id, FK session_id → assessment_sessions.id, FK style_type_id → learning_style_types.id)
  - Atribut: frequency_count, contexts_used (JSON), percentage.

- normative_conversion_table (PK id)
  - Atribut: norm_group, scale_name, raw_score, percentile.
  - UNIQUE(norm_group, scale_name, raw_score).

- percentile_scores (PK id, FK session_id UNIQUE → assessment_sessions.id)
  - Atribut: norm_group_used, CE_percentile, RO_percentile, AC_percentile, AE_percentile, ACCE_percentile, AERO_percentile.

- normative_statistics (PK id)
  - Atribut: norm_group, sample_size, mean/stdev untuk CE/RO/AC/AE/ACCE/AERO.

- audit_log (PK id)
  - Atribut: actor, action, payload_hash, created_at.

Struktur turunan (bukan tabel data primer):
- v_style_grid: SELECT join sessions + combination_scores + (opsional) user_learning_styles → band ACCE/AERO dan style_name.
- mv_class_style_stats: MATERIALIZED VIEW (PostgreSQL) agregasi per kelas, tanggal, band, style_name.

Normalisasi & ketergantungan:
- 1NF/2NF/3NF terpenuhi: data atomik; skor tersimpan 1‑to‑1 per sesi; kamus style terpisah; norma terpisah.
- user_responses menyimpan fakta granular ipsatif; semua agregasi (scale/combination/style/LFI/percentile) bergantung fungsional hanya pada session_id.

 Business rules sebagai integritas data:
- Ipsatif enforced via 2 UNIQUE + CHECK pada `user_responses`.
- Determinisme klasifikasi gaya: (ACCE_raw, AERO_raw) selalu berada pada satu window yang tidak tumpang tindih dari `learning_style_types`.
- Precedence norm group (disiplin implementasi): EDU → COUNTRY → AGE → GENDER → Total; direkam di `percentile_scores.norm_group_used`.


## 3) Model Fisik (PostgreSQL + SQLAlchemy) – Detail implementasi

Tipe & enum (ORM → SQL):
- Enum: Gender, AgeGroup, EducationLevel, SessionStatus, ItemType, LearningMode.
- Integer untuk identitas, rank, dan skor (mentah & difference & balance); Float untuk koefisien W, LFI, persentil.
- JSON: `user_learning_styles.kite_coordinates`, `backup_learning_styles.contexts_used`.

Indeks & constraints yang sudah ada:
- users: email (UNIQUE + INDEX), nim (UNIQUE), id (INDEX bawaan PK), created/updated (opsional tambahan bila diperlukan audit query).
- user_responses: UNIQUE(session_id, item_id, rank_value); UNIQUE(session_id, choice_id); CHECK rank_value 1..4.
- assessment_sessions: partial index `(user_id, end_time) WHERE status='Completed'` (migrasi 0001) untuk laporan/perhitungan.
- normative_conversion_table: UNIQUE(norm_group, scale_name, raw_score).
- mv_class_style_stats: index `(kelas, date)`.

View/Materialized View:
- v_style_grid: mengeluarkan session_id, user_id, ACCE_raw/AERO_raw, band, style_name (CREATE VIEW IF NOT EXISTS).
- mv_class_style_stats: hanya PostgreSQL; ringkas agregasi per kelas/tanggal/band/style (dapat di‑refresh terjadwal).

Kinerja & optimisasi yang disarankan (tanpa mengubah API):
- Tambah index komposit untuk foreign key yang sering difilter/join:
  - user_responses(session_id, item_id)
  - item_choices(item_id), assessment_items(item_number, item_type)
  - scale_scores(session_id), combination_scores(session_id), user_learning_styles(session_id)
  - percentile_scores(session_id)
- Tambah index untuk lookup norma jika volume besar:
  - normative_conversion_table(norm_group, scale_name, raw_score) sudah UNIQUE → otomatis terindeks.
- Strategi refresh `mv_class_style_stats`: on‑demand setelah batch scoring atau via job terjadwal.

Privasi & audit:
- PII: email, NIM, tanggal lahir; simpan minimal, gunakan hashing/alias untuk ekspor.
- AuditLog: catat impor norma, perhitungan massal, dan publikasi laporan kelas.

Partisi & retensi (opsional skala besar):
- Partisi `assessment_sessions` per bulan/semester untuk akselerasi laporan historis.
- Retensi `audit_log` dengan kebijakan TTL yang wajar.


## 4) Kontrak data singkat (input/output, error mode)

- Input utama: ranking ipsatif 1..4 per item (12 item gaya) dan 8× konteks untuk LFI.
- Output utama per sesi: CE/RO/AC/AE raw; ACCE/AERO; style utama + cadangan; LFI; persentil skala; grid posisi (v_style_grid); agregasi kelas (mv_class_style_stats).
- Error modes yang ditangani:
  - Duplikasi rank/choice per item → ditolak oleh UNIQUE/CK.
  - Sesi belum selesai → tidak masuk index parsial "Completed" dan tidak terbaca oleh laporan tertentu.
  - Baris norma hilang → fallback nearest‑lower/nearest (ditandai di `percentile_scores.norm_group_used`).


## 5) Edge cases penting

- Nilai tepat di ambang band (ACCE=5,6,14,15; AERO=0,1,11,12): gunakan konvensi—ACCE <6 artinya 0–5; 6–14 inklusif; >14 artinya ≥15. AERO <1 artinya ≤0; 1–11 inklusif; >11 artinya ≥12. Ini ditegaskan untuk mencegah interpretasi ganda.
- Sesi tanpa semua 12 item lengkap → skor tidak dihitung; status bukan "Completed".
- Distribusi konteks homogen (semua konteks sama) → W=1 → LFI=0 (fleksibilitas minimal); variasi maksimum → W≈0 → LFI≈1.
- Impor norma subset (mis. hanya Total) → sistem tetap berjalan; sumber group tercatat.


## 6) Selaras dengan KLSI 4.0 Guide (ringkas)

- Formula mode, difference, balance, dan LFI identik dengan Guide; grid 3×3 memakai band kanonik (<6 / 6–14 / >14 dan <1 / 1–11 / >11) telah diterapkan di view/matview. Semua rumus terpusat di `psychometrics_spec.md` untuk mengurangi duplikasi; file ini hanya merujuk.
- 9 gaya: Imagining/Experiencing/Initiating/Reflecting/Balancing/Acting/Analyzing/Thinking/Deciding tersedia di kamus gaya dan/atau dapat dipetakan dari band.
- Percentile menggunakan tabel normatif resmi ketika tersedia; fallback hanya ketika baris tidak ada (ditandai jelas dalam hasil).


## 7) Gap & Next Steps

- Entitas “Team/TeamMember/TeamPerformance” dan studi reliabilitas/validitas disebut di dokumen konseptual, namun belum diimplementasikan pada ORM saat ini. Rekomendasi:
  - Tambah tabel team, team_members (user_id, role_dalam_tim), team_assessment_rollup (agregasi style/LFI per tim).
  - Tabel research_study, reliability_result, validity_evidence untuk penelusuran bukti psikometrik.
- Indeks tambahan yang diusulkan pada bagian kinerja belum ada di migrasi—dapat ditambahkan bertahap.
 - Layer LOGIS kini diekstrak ke dokumen khusus `12-model-logis-relasional.md` untuk referensi skema terstruktur; dokumen ini tetap mempertahankan ringkasan end-to-end.


## 8) Referensi silang cepat

- ORM: `app/models/klsi.py`
- Migrasi: `migrations/versions/0001_initial.py`, `0002_materialized_class_stats.py`
- Spesifikasi rumus & aturan: `docs/psychometrics_spec.md`
- Tampilan dan agregasi: `v_style_grid`, `mv_class_style_stats`


Ringkasan: Arsitektur data memisahkan fakta granular ipsatif dari derivasi psikometrik (raw → difference → style/LFI → persentil) dengan integritas kuat melalui constraint, dukungan laporan via view/matview, serta kompatibel penuh dengan KLSI 4.0 Guide. Dokumentasi ini menjadi acuan tunggal untuk desain konseptual, skema logis, dan realisasi fisik sistem.

## 9) Harmonisasi & Anti-Duplikasi (Audit Singkat)
Perubahan harmonisasi dilakukan:
1. Notasi band ACCE/AERO diseragamkan ke <6 / 6–14 / >14 dan <1 / 1–11 / >11.
2. Penegasan bahwa definisi numerik berada di satu tempat kanonik: `psychometrics_spec.md`.
3. Klaim independensi ACCE/AERO di dokumen lama direvisi (lihat pembaruan di `01-entity-relationship-model.md`) menjadi "difference scores mengurangi efek ipsatif" bukan "NON-IPSATIVE absolut".
4. Penjelasan edge case batas diperinci agar tidak ada ambiguitas interpretasi antara simbol ≤/≥ vs < />.
5. Menandai bahwa range teoritis difference ±36 bisa lebih luas daripada constraint sampel historis (lihat revisi di ER model).

Audit ringkas menunjukkan tidak ada konflik angka kritis (cut-band, formula LFI, definisi balance) setelah penyeragaman ini.