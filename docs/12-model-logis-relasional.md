# Model Logis Relasional – KLSI 4.0

Dokumen ini mengekstrak lapisan LOGIS (relational mapping) secara terpusat agar terpisah dari narasi konseptual (`10-model-data-klsi.md`) dan spesifikasi psikometrik (`psychometrics_spec.md`). Tujuan: menjadi referensi tunggal untuk desain skema relasional (tabel, kunci, normalisasi, view) yang dapat dicek cepat saat menambah fitur.

## 1. Prinsip Desain
- Pisahkan fakta granular (ipsatif ranking per item) dari derivasi (skor, difference, style, LFI, percentile) → mengurangi redundansi & memudahkan audit.
- Pastikan normalisasi 3NF: setiap fakta bergantung fungsional pada PK tabelnya; kalkulasi disimpan hanya jika mahal untuk dihitung ulang (mis. difference & balance tidak harus, tapi dipersist utk efisiensi laporan).
- Hindari duplikasi definisi angka: rujuk `psychometrics_spec.md`.

## 2. Diagram Teks Entitas → Tabel
```
User (users)
  PK id
  email UNIQUE
  -> AssessmentSession (assessment_sessions)
AssessmentSession
  PK id, FK user_id -> users.id
  1:1 ScaleScore (scale_scores)
  1:1 CombinationScore (combination_scores)
  1:1 UserLearningStyle (user_learning_styles)
  1:1 LearningFlexibilityIndex (learning_flexibility_index)
  1:N UserResponse (user_responses)
  1:N LFIContextScore (lfi_context_scores)
AssessmentItem (assessment_items)
  1:N ItemChoice (item_choices)
ItemChoice
  1:N UserResponse (user_responses)
LearningStyleType (learning_style_types)
  1:N UserLearningStyle
  1:N BackupLearningStyle (backup_learning_styles)
NormativeConversionTable (normative_conversion_table)
  -> PercentileScore (percentile_scores) 1:1 per session
NormativeStatistics (normative_statistics)
AuditLog (audit_log)
Views: v_style_grid (window + style), mv_class_style_stats (agregasi kelas)
```

## 3. Definisi Tabel (Ringkas)
| Tabel | Tujuan | PK | Dependensi (FK) | Catatan Integritas |
|-------|--------|----|-----------------|--------------------|
| users | Identitas responden | id | – | UNIQUE(email), OPTIONAL(nim) |
| assessment_sessions | Sesi pengisian | id | user_id→users.id | status partial index Completed |
| assessment_items | Butir inventori | id | – | item_type enum memisah gaya vs fleksibilitas |
| item_choices | Opsi pernyataan | id | item_id→assessment_items.id | learning_mode enum |
| user_responses | Ranking ipsatif | id | session_id, item_id, choice_id | UNIQUE(session_id,item_id,rank_value) + UNIQUE(session_id,choice_id) + CHECK rank 1..4 |
| scale_scores | Skor mentah mode | id | session_id→assessment_sessions.id | 1:1 sesi |
| combination_scores | Difference & balance | id | session_id | Persist untuk efisiensi report |
| learning_style_types | Kamus 9 gaya | id | – | Range ACCE/AERO window |
| user_learning_styles | Hasil klasifikasi | id | session_id, primary_style_type_id | Menyimpan intensitas + koordinat |
| backup_learning_styles | Style cadangan | id | session_id, style_type_id | Daftar jendela tambahan |
| lfi_context_scores | Ranking per konteks | id | session_id | 8 baris per sesi |
| learning_flexibility_index | LFI & W | id | session_id | 1:1 sesi |
| normative_conversion_table | Norma raw→percentile | id | – | UNIQUE(norm_group,scale_name,raw_score) |
| percentile_scores | Persentil sesi | id | session_id | norm_group_used log precedence |
| normative_statistics | Statistik per group | id | – | Mean/stdev dokumenter |
| audit_log | Jejak operasi | id | – | Hash payload untuk verifikasi |

## 4. Normalisasi & Ketergantungan
- 1NF: semua kolom atomic (JSON hanya untuk struktur koordinat/gaya cadangan – bukan fakta terhubung antar entitas). 
- 2NF: tabel fakta (user_responses) bergantung pada seluruh PK (id) dan FKs; tidak ada partial dependency.
- 3NF: tidak ada transitive dependency (contoh: style_name tidak disimpan di user_learning_styles melainkan di learning_style_types).

## 5. Fakta vs Dimensi
- Fakta granular: `user_responses`, `lfi_context_scores`.
- Dimensi/kamus: `learning_style_types`, `normative_conversion_table`, `normative_statistics`.
- Derivatif/persisted metrics: `scale_scores`, `combination_scores`, `learning_flexibility_index`, `percentile_scores`, `user_learning_styles`, `backup_learning_styles`.

## 6. Aturan Derivatif
| Derivasi | Sumber | Persist? | Alasan |
|----------|--------|----------|--------|
| CE/RO/AC/AE raw | user_responses | Ya (scale_scores) | Hindari re-scan 48 ranking setiap query |
| ACCE/AERO | scale_scores | Ya (combination_scores) | Digunakan di banyak laporan & klasifikasi |
| Balance | combination_scores | Ya | Mempermudah analitik seimbang vs spesialis |
| Style utama | ACCE/AERO bands | Ya (user_learning_styles) | Presentasi & join cepat |
| Backup styles | Window/perhitungan jarak | Ya | Dibutuhkan visualisasi fleksibilitas gaya |
| LFI (1-W) | lfi_context_scores | Ya | Perhitungan statistik W cukup mahal |
| Percentiles | raw scores + normative_conversion_table | Ya | Tampilkan langsung tanpa lookups ulang |

## 7. View & Materialized View
- `v_style_grid`: Band & style_name per sesi memudahkan front-end heatmap.
- `mv_class_style_stats` (PostgreSQL): Agregasi per kelas & tanggal untuk dashboard historis; di-refresh manual/event-driven.

## 8. Precedence Norma (Implementasi Logis)
Urutan pencarian (deterministik): EDU → COUNTRY → AGE → GENDER → Total. Pertama ditemukan yang mendukung semua raw yang diperlukan. Dicatat di `percentile_scores.norm_group_used`. Fallback nearest-lower (mode/difference) atau nearest (LFI) – spesifik di `psychometrics_spec.md`.

## 9. Constraints Penting & Justifikasi
| Constraint | Justifikasi |
|------------|------------|
| UNIQUE(session_id,item_id,rank_value) | Menjamin ipsatif (1..4 unik) per item |
| UNIQUE(session_id,choice_id) | Mencegah pemilihan opsi dua kali |
| CHECK rank_value BETWEEN 1 AND 4 | Validasi domain ranking |
| UNIQUE(norm_group,scale_name,raw_score) | Eliminasi duplikasi baris norma |
| Partial index Completed | Mempercepat query laporan selesai vs in-progress |

## 10. Rekomendasi Indeks Tambahan
| Tabel | Indeks | Alasan |
|-------|--------|--------|
| user_responses | (session_id,item_id) | Ekstraksi jawaban per sesi cepat |
| item_choices | (item_id) | Pengambilan opsi per item |
| assessment_items | (item_number,item_type) | Ordering & filtering jenis |
| scale_scores | (session_id) | Join cepat (FK lookups) |
| combination_scores | (session_id) | Join cepat |
| user_learning_styles | (session_id) | Join cepat |
| percentile_scores | (session_id) | Join cepat |
| lfi_context_scores | (session_id) | Hitung W cepat |
| backup_learning_styles | (session_id) | Enumerasi gaya cadangan |

## 11. Integritas Psikometrik (Pointer)
Semua rumus dan definisi numerik → `psychometrics_spec.md`. Tabel menyimpan hasil akhir bukan duplikasi definisi.

## 12. Migrasi Tambahan (Opsional)
Buat file migrasi yang menambahkan indeks rekomendasi di atas + NOT NULL refinements bila data sudah matang.

## 13. Risiko & Mitigasi
| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Over-persist derivation | Update kompleks saat re-skor | Tetapkan garis: hanya derivasi mahal disimpan |
| Fallback norma bias | Persentil kurang presisi | Audit flag + dorong impor lengkap |
| JSON koordinat tanpa validasi | Inkonsistensi visualisasi | Validasi skema (pydantic) sebelum simpan |
| Style cadangan ambigu | Interpretasi keliru | Dokumentasikan algoritma jarak (Manhattan) terpusat |

## 14. Status
Dokumen ini melengkapi `10-model-data-klsi.md` (konseptual + fisik ringkas) dengan fokus layer logis. Perubahan struktur harus memperbarui dokumen ini + migrasi.
