# Model Entitas Relasional KLSI 4.0 (Rasional Akademis)

Dokumen ini memetakan struktur data untuk implementasi Kolb Learning Style Inventory (KLSI) versi 4.0 secara ketat berdasarkan Guide to Theory, Psychometrics, Research & Applications (Kolb & Kolb) dan Lampiran resminya (Appendices 1–11) yang tersedia pada berkas di repo ini. Prinsip perancangan mengikuti standar pengukuran pendidikan/psikologi (AERA/APA/NCME): keterlacakan (auditability), validitas konstruk, reliabilitas internal, dan transparansi transformasi skor.

Appendix mapping (acuannya di dokumen sumber):
- Appendix 1: Tabel konversi Raw→Percentile untuk CE, RO, AC, AE dan distribusi dialektika ACCE (=AC−CE), AERO (=AE−RO).
- Appendix 2–5: Statistik deskriptif per kelompok (Age, Gender, Education, Educational Specialization) — opsional untuk konteks laporan.
- Appendix 7: Distribusi Learning Flexibility Index (LFI) untuk pemetaan ke persentil.
- Appendix 8: Pola skor konteks-region (untuk LFI item contexts).
- Appendix 9: Deskripsi 9 gaya belajar (narasi laporan, tanpa menyalin teks berhak cipta).
- Appendix 10–11: Desain sesi dan tugas PAA (mengarahkan UX/HCI, tidak memengaruhi scoring).

Kesesuaian implementasi (concordance dengan kode):
- Skema dan layanan skor direalisasikan pada:
  - Models: `app/models/klsi.py`
  - Scoring & Laporan: `app/services/scoring.py`, `app/services/report.py`
  - Norma lokal (fallback) dari Appendix: `app/data/norms.py` (file ini memuat dict Raw→Percentile dari Appendix 1 & 7; DB norm akan mengoverride jika tersedia)
  - Dokumentasi ER yang lebih rinci juga tersedia di `docs/01-entity-relationship-model.md`. Dokumen saat ini menekankan ikatan ke Appendix dan penyelarasan dengan implementasi kode terkini untuk menghindari redundansi.

## Prinsip Desain
1. Ipsatif vs Normatif: Respons item gaya belajar bersifat ipsatif (ranking 1–4 unik per item). Konversi ke skor CE/RO/AC/AE adalah agregasi terstruktur; percentiles bersifat norm-referenced (Appendix 1).
2. Dialektika: Dua dialektika utama (AC vs CE, AE vs RO) + dua kombinasi (Assimilation vs Accommodation, Converging vs Diverging) direpresentasikan dengan skor kontinu (ACCE = AC − CE, AERO = AE − RO).
3. Tipe Gaya Belajar 9-Piksel: Penentuan tipe utama memakai cutpoint raw di grid dua dimensi (ACCE, AERO) sesuai deskripsi Fig. 4 & 5.
4. Learning Flexibility Index (LFI): Dibangun dari 8 konteks (situasi belajar) → Kendall's W menghitung konsistensi preferensi; LFI = 1 − W (ref. Bab 6). Disimpan terpisah agar analitik longitudinal dapat dilakukan.
5. Audit dan Reproses: Semua transformasi skor tersimpan (raw tabel → scale_score → combination_score → style → percentiles → report) untuk reproducibility.

## Entitas Inti
- User
- AssessmentSession
- AssessmentItem, ItemChoice
- UserResponse (ipsative ranks)
- ScaleScore (CE, RO, AC, AE)
- CombinationScore (ACCE, AERO, assimilation_accommodation, converging_diverging)
- LearningStyleType (9 tipe + metadata Indonesia)
- UserLearningStyle (primary & optional backup)
- LFIContextScore (8 konteks x 4 mode)
- LearningFlexibilityIndex (W, skor, kategori)
- NormativeConversionTable (raw → percentile per kelompok norm)
- PercentileScore (per scale + dialectic)
- ReportCache (snapshot untuk kecepatan akses)
- AuditLog (opsional, peristiwa penting)

## Diagram Konseptual (Deskripsi Tekstual)
User (1) -- (n) AssessmentSession
AssessmentSession (1) -- (n) UserResponse -> AssessmentItem (n) -- (4) ItemChoice
AssessmentSession (1) -- (1) ScaleScore
AssessmentSession (1) -- (1) CombinationScore
AssessmentSession (1) -- (1) UserLearningStyle
AssessmentSession (1) -- (n) LFIContextScore -> (aggregated) LearningFlexibilityIndex (1)
ScaleScore/CombinationScore -> PercentileScore (0..n)
NormativeConversionTable digunakan lookup saat finalisasi. Jika baris tidak tersedia, fallback menggunakan data Appendix lokal (`app/data/norms.py`).

## Relasional (Skema DDL Konseptual Ringkas)
```
USERS(
  id PK,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role ENUM('MAHASISWA','MEDIATOR') NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  gender ENUM OPTIONAL,
  age_group ENUM OPTIONAL,
  education_level ENUM OPTIONAL
)

ASSESSMENT_SESSIONS(
  id PK,
  user_id FK USERS.id,
  status ENUM('IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL,
  version VARCHAR(10) DEFAULT '4.0',
  started_at TIMESTAMP,
  completed_at TIMESTAMP NULL
)

ASSESSMENT_ITEMS(
  id PK,
  code VARCHAR UNIQUE,
  prompt TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
)

ITEM_CHOICES(
  id PK,
  item_id FK ASSESSMENT_ITEMS.id,
  mode ENUM('CE','RO','AC','AE') NOT NULL,
  statement TEXT NOT NULL,
  position SMALLINT CHECK (position BETWEEN 1 AND 4)
)

USER_RESPONSES(
  id PK,
  session_id FK ASSESSMENT_SESSIONS.id,
  item_id FK ASSESSMENT_ITEMS.id,
  choice_id FK ITEM_CHOICES.id,
  rank SMALLINT CHECK (rank BETWEEN 1 AND 4),
  UNIQUE(session_id, item_id, rank),
  UNIQUE(session_id, choice_id)
)

SCALE_SCORES(
  session_id PK/FK ASSESSMENT_SESSIONS.id,
  ce SMALLINT NOT NULL,
  ro SMALLINT NOT NULL,
  ac SMALLINT NOT NULL,
  ae SMALLINT NOT NULL
)

COMBINATION_SCORES(
  session_id PK/FK,
  acce SMALLINT NOT NULL, -- AC - CE
  aero SMALLINT NOT NULL, -- AE - RO
  assimilation_accommodation SMALLINT, -- (AC+RO) - (CE+AE)
  converging_diverging SMALLINT -- (AC+AE) - (CE+RO)
)

LEARNING_STYLE_TYPES(
  id PK,
  code VARCHAR UNIQUE,  -- IMAGINING, ANALYZING, etc
  name_id TEXT,          -- Nama Indonesia
  description_id TEXT,
  dominant_modes TEXT,   -- e.g. 'CE+RO'
  kite_pattern JSONB     -- koordinat relatif
)

USER_LEARNING_STYLE(
  session_id PK/FK,
  primary_style_id FK LEARNING_STYLE_TYPES.id,
  backup_style_id FK LEARNING_STYLE_TYPES.id NULL,
  intensity_smallint SMALLINT, -- opsional
  kite_coordinates JSONB
)

LFI_CONTEXT_SCORES(
  id PK,
  session_id FK,
  context_code VARCHAR,  -- standardized 8 contexts
  ce SMALLINT NOT NULL,
  ro SMALLINT NOT NULL,
  ac SMALLINT NOT NULL,
  ae SMALLINT NOT NULL
)

LEARNING_FLEXIBILITY_INDEX(
  session_id PK/FK,
  kendalls_w NUMERIC(6,4) NOT NULL,
  lfi_score NUMERIC(6,4) NOT NULL, -- 1 - W
  category VARCHAR -- Low/Moderate/High (norm-based)
)

NORMATIVE_CONVERSION_TABLE(
  id PK,
  norm_group VARCHAR, -- e.g. 'Global_Adult'
  scale_name VARCHAR, -- 'CE','RO','AC','AE','ACCE','AERO','LFI'
  raw_score SMALLINT,
  percentile NUMERIC(5,2)
)

PERCENTILE_SCORES(
  id PK,
  session_id FK,
  scale_name VARCHAR,
  raw SMALLINT,
  percentile NUMERIC(5,2)
)

REPORT_CACHE(
  session_id PK/FK,
  generated_at TIMESTAMP,
  payload JSONB
)
```

## Justifikasi Akademis per Entitas
- User demografis memungkinkan analisis eksternal validitas (Bab 5: hubungan dengan umur, gender, specialization).
- AssessmentSession memisahkan siklus pengambilan dari identitas user (mendukung test-retest reliability Bab 4).
- Ipsative ranking enforced oleh constraints UNIQUE(session_id, item_id, rank) & rank range memastikan kualitas data (menghindari double ranking).
- ScaleScore menyimpan agregasi primary modes (CE/RO/AC/AE) sesuai formula penjumlahan ranking per mode; diperlukan sebelum transformasi dialektik.
- CombinationScore memuat ACCE, AERO dan dua kombinasi tambahan untuk memetakan posisi individual di learning space dan spiral (Fig. 5).
- LearningStyleType memfasilitasi resolusi 9 piksel klasifikasi baru mengurangi ambiguity borderline (Kolb & Kolb 2005a,b).
- LFIContextScore + LFI memisahkan data mentah vs indeks agregat agar bisa menghitung Kendall's W ulang untuk reliability audit.
- NormativeConversionTable memuat mapping raw→percentile mendukung interpretasi normatif lintas kelompok (Appendix 1 & 7).
- ReportCache menjaga versioning laporan (traceability, reproducibility) untuk memenuhi standar dokumentasi hasil asesmen psikologis.

## Edge Cases & Penanganan
1. Item incomplete: Session tidak boleh difinalisasi jika jumlah item < 12 (raise error). 
2. Ranking duplikat: Violasi constraint → HTTP 400.
3. Missing norm row: PercentileScore fallback `NULL` percentile; laporan memberi label "Norma belum tersedia".
4. Kendall's W degenerate (semua baris identik): W=1 ⇒ LFI=0 (flexibility sangat rendah). Simpan tetap.
5. Negative dialectic values: Diperbolehkan; digunakan untuk posisi di grid (balance). 

## Mental Model Interaksi Manusia–Komputer
Aktor: Mahasiswa (mengisi inventory), Mediator/Admin (mengelola item, norma, memantau agregat). 
Alur Mahasiswa:
1. Registrasi (email domain validasi) → Login JWT.
2. Mulai sesi → Mendapat 12 item; untuk tiap item pilih urutan 1–4 (drag/drop ranking UI).
3. Mengisi 8 konteks LFI (ranking serupa).
4. Finalisasi → Sistem hitung skor, tipe gaya belajar, LFI, percentiles (jika tersedia) → Laporan.
5. Laporan menampilkan kite visual, penjelasan style (Indonesia), rekomendasi strategi belajar.

Alur Mediator:
1. Login → Dashboard agregat (distribusi gaya, rentang LFI).
2. Upload/ubah item (non-proprietary placeholder jika hak cipta asli dilindungi).
3. Impor tabel norma (CSV).
4. Ekspor data anonim untuk analisis reliabilitas/validitas internal.

## Privasi & Kepatuhan
- Simpan hanya hash password (argon2 / bcrypt).
- Pisahkan data demografis minimal sesuai tujuan validitas eksternal; hindari data sensitif lain.
- AuditLog (opsional) untuk tindakan admin kritis (impor norma, update item).

## Referensi
Kolb, D. A. (1984). Experiential Learning.
Kolb, A. & Kolb, D. (2013). The Kolb Learning Style Inventory 4.0 Guide.
AERA, APA, NCME (1999). Standards for Educational and Psychological Testing.

Lampiran yang dirujuk (dari berkas sumber di repo):
- Appendix 1: Raw→Percentile CE/RO/AC/AE, distribusi ACCE & AERO.
- Appendix 2–5: Statistik deskriptif (Age, Gender, Education, Specialization).
- Appendix 7: LFI percentiles.
- Appendix 8: Region/context scoring patterns.
- Appendix 9–11: Deskripsi gaya, desain sesi, PAA (untuk isi laporan & UX).

---
Dokumen ini menjadi sumber acuan implementasi kode (SQLAlchemy & service scoring).