# Relational Model (KLSI 4.0)

Dokumen ini merinci pemetaan konseptual ER (lihat `01-entity-relationship-model.md` & `er_model.md`) ke model relasional konkret, dengan justifikasi akademis dan prinsip normalisasi berbasis kebutuhan analitik psikometrik KLSI 4.0.

## Prinsip Desain yang Digunakan
1. First Normal Form (1NF): Semua kolom atomik (skor, rank, kode gaya). Ipsative ranking 1..4 dipaksa oleh constraint `CHECK` dan `UNIQUE` pasangan (session_id, item_id, rank_value).
2. Second Normal Form (2NF): Tabel fakt (responses, context ranks) hanya memuat atribut bergantung penuh pada PK (id). Agregasi (raw totals) dipindahkan ke tabel turunan terpisah (ScaleScore, CombinationScore) untuk audit transformasi.
3. Third Normal Form (3NF): Atribut derivatif (ACCE_raw = AC - CE) disimpan terpisah di `combination_scores` agar bisa divalidasi ulang (recompute vs stored) dan mencegah anomali update ketika raw berubah.
4. Referential Integrity: Semua fk mengarah ke entitas induk untuk melacak lineage penghitungan (Session → Responses → ScaleScore → CombinationScore → UserLearningStyle → PercentileScore → LearningFlexibilityIndex).
5. Psychometric Traceability: Setiap tahap transformasi skor berada pada tabel tersendiri sehingga pemeriksaan reliabilitas (misal split-half atau test–retest) dapat direplikasi tanpa kehilangan jejak.

## Tabel Inti & Justifikasi
| Tabel | Tujuan | Justifikasi Akademis |
|-------|--------|----------------------|
| users | Metadata responden | Demografi diperlukan untuk studi validitas eksternal (Appendix 2–5: Age, Gender, Education). |
| assessment_sessions | Unit waktu pengukuran | Memungkinkan analisis retest, learning flexibility longitudinal. |
| assessment_items / item_choices | Definisi ipsative item | Memisahkan stem dan pilihan memfasilitasi lokalisasi & penggantian konten berlisensi. |
| user_responses | Data mentah ranking | Bentuk ipsative (forced-choice) menjaga struktur preferensi; diperlukan untuk menghitung CE/RO/AC/AE. |
| scale_scores | Agregasi mode (CE, RO, AC, AE) | Transparansi transformasi item→skala; mendukung audit. |
| combination_scores | Dialektika (ACCE, AERO, lainnya) | Mewujudkan definisi teoretis gaya (posisi dalam ruang belajar). |
| learning_style_types | Definisi window gaya (cutpoints ACCE & AERO) | Menyandikan grid 9 gaya (Fig. 4 & 5) agar algoritma tidak hard-coded. |
| user_learning_styles | Hasil klasifikasi utama | Menyimpan intensitas & koordinat "kite" untuk visualisasi & analisis cluster. |
| backup_learning_styles | Gaya cadangan objektif | Mengurangi ambiguitas borderline; berguna untuk robust reporting. |
| lfi_context_scores | Ranking per konteks (8) | Data granular untuk menghitung Kendall's W (LFI). |
| learning_flexibility_index | W, LFI, percentile | Memisahkan metrik fleksibilitas untuk analisis korelasional. |
| normative_conversion_table | Raw→Percentile (norm group) | Tempat impor Appendix 1 & 7; fleksibel mendukung subgroup norms. |
| percentile_scores | Percentile per skala & dialektika | Materialisasi agar laporan cepat & sumber (DB vs fallback) dapat dilacak melalui kolom `norm_group_used`. |
| normative_statistics | Mean/Stdev normative | Analisis z-score tambahan atau QC terhadap seeding. |
| audit_log | Catat event sensitif | Memenuhi asas auditabilitas (import norma, finalisasi sesi). |

## Integritas & Constraint
- `user_responses`:
  - `UNIQUE(session_id, item_id, rank_value)` mencegah duplikasi rank untuk item yang sama.
  - `UNIQUE(session_id, choice_id)` memastikan tiap pilihan hanya dirank sekali per sesi.
  - `CHECK rank_value BETWEEN 1 AND 4` menegakkan ipsative empat pilihan.
- `learning_style_types`: Window numerik ACCE/AERO memungkinkan validasi jarak & konsistensi saat klasifikasi.
- `percentile_scores`: `session_id` unik → satu set konversi per finalisasi sesi (idempotent reporting).
- `normative_conversion_table`: (norm_group, scale_name, raw_score) secara implisit harus unik (dapat ditambahkan constraint untuk enforcement) guna mencegah tumpang tindih nilai.

## Alur Transformasi Data
1. Raw ranking (user_responses) → agregasi mode (scale_scores).
2. Mode → dialektika (`combination_scores`):
   - ACCE = AC_raw − CE_raw
   - AERO = AE_raw − RO_raw
   - Assimilation/Accommodation = (AC+RO) − (AE+CE)
   - Converging/Diverging = (AC+AE) − (CE+RO)
3. Dialektika → klasifikasi gaya (user_learning_styles) melalui pencocokan ke rentang ACCE/AERO dari `learning_style_types` + penentuan backup via jarak L1 ke window lain.
4. Konteks fleksibilitas (lfi_context_scores) → Kendall's W → LFI = 1 − W → percentile (normative_conversion_table atau fallback Appendix 7).
5. Percentile per skala & per dialektika (percentile_scores) dari normative DB atau fallback `app/data/norms.py`.

## Alasan Menyimpan Nilai Derivatif
Walaupun ACCE/AERO dapat dihitung ulang dari `scale_scores`, penyimpanan di `combination_scores` memberikan:
- Kemudahan query analitik tanpa join tambahan.
- Audit snapshot (membuktikan tidak ada perubahan pasca perhitungan).
- Potensi indexing khusus dialektika untuk segmentasi populasi (misal distribusi gaya di cohort).

## Ekstensi Norm Group
Struktur `norm_group` (varchar) memungkinkan:
- "Total" (global sample Appendix 1) default.
- Subgroup: Age band, Gender, Education Level sesuai Appendix 2–5.
Penambahan baris baru tidak memerlukan migrasi skema.

## Justifikasi Akademis Tambahan
- Ipsative format mengurangi respon set dan bias skala (dibahas dalam literatur forced-choice & normative referencing).
- Pemisahan normative conversion dari skor mentah memfasilitasi adaptasi terhadap update studi normatif.
- Kendall's W dipilih karena mengukur kesepakatan ranking antar konteks; transformasi LFI = 1 − W konsisten dengan konsep fleksibilitas (tinggi jika variasi preferensi konteks besar).

## Pertimbangan Privasi & Audit
- Data sensitif (email, demographic) dipisah dari hasil psikometrik untuk mempermudah pseudonymization jika diperlukan.
- `audit_log` menyimpan `payload_hash` (mis. SHA-256) dari batch impor normatif guna validasi integritas sumber.

## Index & Performance (Rencana)
| Index | Tabel | Alasan |
|-------|-------|-------|
| users.email (UNIQUE) | users | Login cepat & integritas identitas. |
| assessment_sessions.user_id | assessment_sessions | Query riwayat per pengguna. |
| user_responses.session_id | user_responses | Rekonstruksi skor cepat. |
| scale_scores.session_id | scale_scores | Join deterministik. |
| combination_scores.ACCE_raw, AERO_raw | combination_scores | Analisis distribusi gaya & window boundary queries. |
| learning_flexibility_index.LFI_score | learning_flexibility_index | Segmentasi fleksibilitas. |

## Potensi Normalisasi Lebih Lanjut
- Memecah demografi ke tabel referensi (country, occupation) bila diperlukan analisis lintas referensi / kebutuhan referential integrity yang lebih kuat.
- Menambah tabel `style_descriptions` untuk lokalisasi multi-bahasa agar tidak menambahkan kolom panjang ke `learning_style_types`.

## Risiko Desain Jika Tidak Dipisah
| Risiko | Dampak |
|--------|--------|
| Menyimpan semua skor di satu tabel | Sulit audit; perubahan raw tak mudah dilacak. |
| Tidak menyimpan dialektika terpisah | Klasifikasi gaya harus menghitung ulang di runtime; overhead & potensi inkonsistensi. |
| Percentile dihitung on-the-fly | Latensi tinggi & potensi perubahan metode tanpa jejak. |

## Ringkasan
Model relasional ini memastikan setiap langkah transformasi sesuai dengan prinsip transparansi psikometrik dan memudahkan verifikasi akademis terhadap implementasi KLSI 4.0 (Appendix 1 & 7 + Figures 4–5). Semua keputusan skema dapat ditelusuri ke kebutuhan replikasi validitas, reliabilitas, dan audit integritas data.
