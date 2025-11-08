# Matriks Rasionalisasi Akademis KLSI 4.0

Dokumen ini memetakan setiap elemen arsitektur data dan proses ke sumber teoretis KLSI 4.0 Guide (Bab, Appendix, Figur) atau literatur psikometrik yang relevan. Tujuan: menunjukkan bahwa desain implementasi tidak mengandung asumsi spekulatif.

## Legend Referensi
- Ch = Chapter dalam KLSI 4.0 Guide
- App = Appendix dalam KLSI 4.0 Guide
- Fig = Figure dalam KLSI 4.0 Guide
- Std = Standards for Educational and Psychological Testing (AERA/APA/NCME, 1999)
- Lit = Literatur eksternal yang dikutip di Guide (contoh Kendall 1948)

## 1. Entitas Inti
| Entitas | Fungsi | Referensi Primer | Rasional Akademis | Potensi Analisis |
|---------|--------|------------------|-------------------|------------------|
| `users` | Metadata demografis | Ch5 (External Validity: Age/Gender/Education), App 2–5 | Dibutuhkan untuk studi perbedaan gaya & penyusunan subgroup norms | Invariance, subgroup percentile selection |
| `assessment_sessions` | Unit pengukuran longitudinal | Ch4 (Test–Retest Reliability) | Memungkinkan interval retest (5–8 minggu) & audit jejak waktu | Stability vs change; learning spiral efek. |
| `assessment_items` | Definisi item gaya & LFI | Ch2 (Format), Ch6 (Learning Flexibility) | Memisahkan 12 + 8 konteks; menjaga konsistensi forced-choice | Analisis kesetaraan konten & readability. |
| `item_choices` | Pilihan CE/RO/AC/AE per item | Ch2 (Format); Fig 2 (Cycle Modes) | Representasi empat mode pengalaman & transformasi | Social desirability balancing checks. |
| `user_responses` | Data mentah ranking ipsatif | Ch2 (Format); Lit (Forced-choice method-induced correlation) | Mempertahankan struktur trade-off preferensi | Simulasi korelasi -0.33 antar mode. |
| `scale_scores` | Agregasi raw CE, RO, AC, AE | App 1 (Raw distributions) | Transparansi; memisah level transformasi item→mode | Reliabilitas internal (Cronbach α). |
| `combination_scores` | Difference & kombinasi dialektik | Fig 4–5 (Learning Space & Cycle), Ch1 (Dual dialectics) | ACCE & AERO model konflik adaptif abstrak vs konkret, aktif vs reflektif | Independence test ACCE vs AERO (korelasi ~0). |
| `learning_style_types` | Definisi 9 tipe gaya | Fig 4–5; Ch1 (Refinement); App 9 (Descriptions) | Grid resolusi 3×3 mengurangi borderline style ambiguity | Distribusi style populasi; cluster validation. |
| `user_learning_styles` | Assignment gaya + intensitas | Ch1 (Individual Style state) | Memetakan preferensi unik; intensitas = diferensiasi | Hubungan intensitas vs LFI. |
| `backup_learning_styles` | Gaya sekunder kontekstual | Ch6 (Flexibility), App 8 (Item patterns) | Menangkap adaptasi gaya dalam konteks berbeda | Analisis pola adaptasi per konteks. |
| `lfi_context_scores` | Ranking 8 konteks | Ch6; App 8 | Bahan perhitungan W (variasi lintas situasi) | Context-specific specialization indices. |
| `learning_flexibility_index` | W & LFI | Ch6; App 7 (Percentiles); Lit (Kendall 1948) | Mengukur fleksibilitas adaptif (state, bukan trait tetap) | Korelasi LFI vs style transitions. |
| `normative_conversion_table` | Raw→Percentile mode & dialektika | App 1; App 7 | Standarisasi interpretasi antar mode (comparability) | Subgroup norm overlays. |
| `percentile_scores` | Materialisasi percentiles | Std (Transparency) | Memastikan report reproducible & provenance tercatat | Longitudinal percentile drift. |
| `normative_statistics` | Mean/Stdev sample | Ch3 (Norms) | Mendukung QC import & z-score analisis | Outlier detection; normative shifts. |
| `audit_log` | Jejak operasi kritis | Std (Data integrity & fairness) | Menjamin integritas transformasi & impor norma | Forensik perubahan versi. |

## 2. Kolom & Constraint Utama
| Kolom / Constraint | Referensi | Alasan Non-Debatable |
|--------------------|-----------|----------------------|
| `rank_value` ∈ {1,2,3,4} & uniqueness per item | Ch2 (Format) | Format resmi forced-choice 4 pernyataan; menjaga ipsative sum tetap konstan. |
| Range raw (11–44 observed) | App 1 | Validasi terhadap out-of-scope nilai; <11 atau >44 indikasi data korup/inkonsisten. |
| ACCE bands (≤5, 6–14, ≥15) | Fig 4–5 (difference distribution tercermin) | Penggambaran grid 9 gaya; cutpoint tercermin dari terciles difference normative sample. |
| AERO bands (≤0, 1–11, ≥12) | Fig 4–5; App 1 difference range | Memisahkan preferensi transformasi reflektif vs aktif. |
| LFI = 1 − W | Ch6 | Definisi resmi; tidak ada variasi alternatif dalam Guide. |
| Percentile fallback nearest-lower | Std (Conservatism) | Menghindari over-estimasi posisi relatif saat data incomplete. |
| `norm_group_used` label | Std (Interpretation clarity) | Pengguna tidak mengira percentile berasal dari full normative jika fallback. |
| Audit hash SHA-256 | Std (Security best practice) | Algoritma hash modern yang umum; deterministik, kolisi sangat kecil. |

## 3. Proses Algoritmik → Sumber
| Tahap | Formula / Langkah | Referensi | Rasional |
|-------|-------------------|-----------|----------|
| Item → Mode | Σ ranking per mode | App 1 | Menyusun preferensi kumulatif empat mode. |
| Mode → Difference | AC−CE; AE−RO | Fig 4–5 | Memetakan koordinat dalam ruang gaya (grasping vs transforming). |
| Difference → Style | Lookup band ACCE/AERO | Fig 4–5; App 9 | Memastikan deterministik tanpa heuristik tambahan. |
| Context ranks → W | Kendall’s formula | Ch6; Lit (Kendall 1948) | Ukur homogenitas ranking; switch ke fleksibilitas melalui transformasi. |
| W → LFI | 1 − W | Ch6 | Membalik konsistensi menjadi fleksibilitas adaptif. |
| Raw → Percentile | Tabel lookup | App 1; App 7 | Standardisasi interpretasi antar mode/dialektika. |
| Primary → Backup style | Minimal L1 distance di grid | Ch1 (Dynamic state) | Menangkap gaya potensial kedua yang dekat secara struktural. |

## 4. Validasi Psikometrik ↔ Struktur Data
| Aspek Psikometrik | Implementasi | Referensi | Catatan |
|--------------------|-------------|-----------|---------|
| Internal Consistency | Simpan raw per mode untuk α | Ch4 | α dapat dihitung ulang tanpa rekonstruksi item text. |
| Test–Retest | Multi sessions + days_since_last_session | Ch4 | Interval analisis stabilitas vs perkembangan. |
| Construct Validity | Presence of dual dialectics & 9 styles | Ch1 | Struktur data mencerminkan teori pengalaman ↔ konsep; aksi ↔ refleksi. |
| External Validity | Demografi lengkap (age_group, gender, education_level) | Ch5; App 2–5 | Siap untuk analisis perbedaan grup. |
| Content Validity | 4 choices per item balanced | Ch2 | Struktur memaksa exactly 4 mode choices. |
| Score Interpretability | Percentile + provenance | App 1; Std | Pengguna memahami posisi relatif & sumber norma. |
| Fairness | Fallback flagged | Std | Mencegah misinterpretasi normative representativeness. |
| Response Process | Ipsative forced-choice + audit modifications | Ch2; Std | Memungkinkan studi perubahan keputusan (modified_count). |

## 5. Justifikasi Penggunaan Difference Scores
Difference scores (ACCE, AERO) dipertahankan eksplisit walau dapat dihitung ulang karena:
1. Mempercepat query segmentasi gaya (tanpa join & kalkulasi runtime).
2. Audit konsistensi (cek: stored == recomputed) → indikasi data integrity.
3. Memfasilitasi indeks khusus untuk eksplorasi distribusi teoretis (misal analisis densitas pada grid 3×3).

## 6. Risiko Teoretis dan Mitigasi Implementasi
| Risiko | Potensi Perdebatan | Mitigasi | Referensi |
|--------|--------------------|----------|-----------|
| Borderline style classification | Titik cutpoint bisa diperdebatkan secara mikro-statistik | Gunakan grid terciles sebagaimana ditunjukkan (bukan heuristik baru) | Fig 4–5 |
| Interpolasi percentile hilang | Metode interpolasi alternatif | Konservatif nearest-lower; dokumentasikan fallback | Std |
| Pengaruh ipsative pada korelasi | Distorsi matrix antar mode | Laporkan & bandingkan ekspektasi teoritis -0.33 (Johnson et al.) | Lit |
| LFI interpretasi mislabel | LFI tinggi = “lebih baik” | Edukasikan bahwa fleksibilitas ≠ superioritas, hanya adaptif | Ch6 |
| Privacy demografis | Data sensitif di analisis | Pisahkan data identitas & skor; opsional anonim view | Std |

## 7. Ekstensi Rasionalisasi (Roadmap)
| Ekstensi | Rasional | Referensi |
|----------|----------|-----------|
| Subgroup norms otomatis | Meningkatkan presisi interpretasi percentile | App 2–5 |
| Longitudinal style trajectory (spiral) | Menguji hipotesis perkembangan menuju integrasi | Ch1 (Spiral of Learning) |
| Balance metrics (affective/symbolic/behavioral/perceptual) | Memetakan kompleksitas adaptasi | Ch1 (Developmental model) |
| Reliability dashboard (α, test–retest r, κ) | Transparansi kualitas pengukuran | Ch4 |
| Conversational Learning team norms integration | Memperluas penerapan ELT ke dinamika tim | Ch7; Conversational Learning literature |

## 8. Checklist Non-Debatable Execution
- Tidak ada perubahan formula LFI (hanya 1 − W).
- Tidak ada agregasi heuristik di style classification selain terciles grid resmi.
- Semua difference scores murni selisih linear (tanpa transformasi non-linier).
- Percentile selalu bersumber dari tabel normatif atau fallback terlabel.
- Audit setiap finalisasi & impor norma direkam dengan hash.

## 9. Referensi Singkat
Kolb, D. A. (1984). Experiential Learning.
Kolb, A. Y., & Kolb, D. A. (2013). KLSI 4.0 Guide.
Kendall, M. G. (1948). Rank Correlation Methods.
Standards for Educational and Psychological Testing (AERA/APA/NCME, 1999).
Johnson et al. (1988) – ipsative scaling correlation property.

---
Dokumen ini melengkapi `01-entity-relationship-model.md`, `02-relational-model.md`, `psychometrics_spec.md`, dan `hci_model.md` dengan matriks pencitraan langsung teori → implementasi.