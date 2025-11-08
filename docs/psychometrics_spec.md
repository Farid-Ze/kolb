# Spesifikasi Psikometrik – KLSI 4.0 Implementasi

Dokumen ini memformalkan rumus, algoritma, dan aturan konversi yang diimplementasikan dalam kode (`app/services/scoring.py`) dengan referensi eksplisit ke landasan teoretis Experiential Learning Theory (Kolb 1984) dan KLSI 4.0 Guide (Appendix 1 & 7).

## 1. Struktur Skor Mentah
Setiap dari 12 item gaya belajar berisi 4 pernyataan mewakili mode: CE (Concrete Experience), RO (Reflective Observation), AC (Abstract Conceptualization), AE (Active Experimentation). Pengguna melakukan ranking unik 1..4.

Rumus akumulasi skor mentah per mode:
\[
CE_{raw} = \sum_{i=1}^{12} r_{i,CE}\quad RO_{raw} = \sum_{i=1}^{12} r_{i,RO}\quad AC_{raw} = \sum_{i=1}^{12} r_{i,AC}\quad AE_{raw} = \sum_{i=1}^{12} r_{i,AE}
\]
Dengan \(r_{i,mode} \in \{1,2,3,4\}\) dan tiap item memenuhi permutasi {1,2,3,4}.

Range teoritis: Minimum 12, maksimum 48. (Appendix 1 tabel menunjukkan nilai efektif observasi populasi dalam range sempit ~11–44; nilai di luar range norma akan fallback nearest.)

## 2. Skor Dialektika
Definisi dialektika utama sesuai KLSI 4.0 (Fig. 4 & 5):
\[
ACCE = AC_{raw} - CE_{raw} \quad AERO = AE_{raw} - RO_{raw}
\]
Dua kombinasi tambahan untuk riset lanjutan (disediakan untuk keberlanjutan konsep empat gaya klasik):
\[
AssimilationAccommodation = (AC_{raw} + RO_{raw}) - (AE_{raw} + CE_{raw})
\]
\[
ConvergingDiverging = (AC_{raw} + AE_{raw}) - (CE_{raw} + RO_{raw})
\]

### 2.1 Skor Keseimbangan Kontinu (Balance Scores)
Untuk mengukur kedekatan terhadap pusat normatif (median perbedaan populasi) digunakan transformasi absolut:
\[
BAL\_ACCE = |(AC_{raw} - CE_{raw}) - 9| = |ACCE - 9| \quad ; \quad BAL\_AERO = |(AE_{raw} - RO_{raw}) - 6| = |AERO - 6|
\]
Semakin kecil nilai BALANCE semakin seimbang preferensi dialektika terkait.

Interpretation bands (heuristik):
- ACCE balance: High (≤3), Moderate (4–8), Low (≥9)
- AERO balance: High (≤2), Moderate (3–8), Low (≥9)

Skor ini non‑ipsatif (transformasi jarak), melengkapi difference scores untuk memprofilkan diferensiasi vs keseimbangan.

## 3. Klasifikasi 9 Gaya Belajar
Cutpoint empiris (windows) diturunkan dari distribusi difference scores (ACCE & AERO) pada sampel normatif KLSI 4.0:
- Band ACCE: Low (≤5), Mid (6–14), High (≥15)
- Band AERO: Low (≤0), Mid (1–11), High (≥12)

Tabel keputusan (Cartesian product) membentuk 9 tipe:
| ACCE Band | AERO Band | Style |
|-----------|-----------|-------|
| Low | Low | Imagining |
| Low | Mid | Experiencing |
| Low | High | Initiating |
| Mid | Low | Reflecting |
| Mid | Mid | Balancing |
| Mid | High | Acting |
| High | Low | Analyzing |
| High | Mid | Thinking |
| High | High | Deciding |

Algoritma:
1. Tentukan band ACCE & AERO → gaya utama (primary) dengan rule deterministik.
2. Gaya cadangan (backup) = window terdekat berdasarkan jarak Manhattan (L1) ke interval tiap gaya selain primary.
3. Intensitas gaya opsional = |ACCE| + |AERO| (indikator diferensiasi preferensi).

## 4. Indeks Fleksibilitas Belajar (LFI)
Data: 8 konteks (rank 1..4 untuk CE/RO/AC/AE), merepresentasikan variasi preferensi adaptif lintas situasi. 

Kendall's W (koefisien kesepakatan) untuk n = 4 objek (mode) dan m = 8 konteks:
\[
W = \frac{12 \sum_{j=1}^{n} (R_j - \bar{R})^2}{m^2 (n^3 - n)}
\]
Dengan \(R_j\) = total rank untuk mode j; \(\bar{R} = m (n+1) / 2\).

Transformasi LFI:
\[
LFI = 1 - W
\]
Interpretasi: Semakin tinggi LFI, semakin bervariasi (kurang konsisten) preferensi lintas konteks → fleksibilitas lebih tinggi.

Kategori (heuristik persentil):
- Low: < 33.34
- Moderate: 33.34 – 66.67
- High: > 66.67

## 5. Konversi Percentile (Normatif)
Sumber utama: `normative_conversion_table` (DB) berisi baris (norm_group, scale_name, raw_score, percentile) dari Appendix 1 (CE, RO, AC, AE, ACCE, AERO) & Appendix 7 (LFI). Fallback lokal `app/data/norms.py` dipakai apabila baris tidak tersedia.

Strategi lookup fallback:
- Skala mode & difference: nearest-lower jika exact missing (konservatif menghindari over-estimasi keberbedaan); jika tidak ada lower, nearest-higher.
- LFI: nearest absolute match (karena nilai kontinu dua decimal).

Pseudo-code fallback (disederhanakan):
```
if db_row_exists(raw): return db_row.percentile
else: return nearest_lower(raw) or nearest_higher(raw)
```

### 5.1 Subgroup Norms & Precedence (Appendix 2–5)
Ketika tersedia, konversi akan mencoba norm-group subkelompok berikut secara berurutan:

1. Education Level (label CSV: `EDU:<label Appendix>`, contoh: `EDU:University Degree`)
2. Country (label CSV: `COUNTRY:<CountryName>`, contoh: `COUNTRY:Germany`)
3. Age band (label CSV: `AGE:<band Appendix>`, contoh: `AGE:19-24`)
4. Gender (label CSV: `GENDER:<Male|Female|Other|Prefer not to say>`)
5. Total (label CSV: `Total`)

Catatan: Urutan ini adalah asumsi deterministik untuk pemilihan grup “terspesifik dulu”; memasukkan `COUNTRY:` memungkinkan analitik lintas budaya sebagaimana dibahas dalam literatur ELT. Penamaan harus konsisten dengan file impor CSV melalui endpoint admin. Jika tidak ada kecocokan untuk sebuah raw score pada semua kandidat, sistem jatuh ke fallback Appendix lokal.

### 5.2 Balance Percentiles (Turunan Teoretis)
Belum terdapat tabel normatif resmi untuk BALANCE; sistem menghitung persentil turunan (bukan persentil populasi) dengan penskalaan linear terhadap jarak maksimum teoritis yang mungkin diamati dalam range respon realistis:
\[
P_{BAL\_ACCE} = 100 \times \left(1 - \frac{BAL\_{ACCE}}{45}\right)_{[0,100]} ,\quad P_{BAL\_AERO} = 100 \times \left(1 - \frac{BAL\_{AERO}}{42}\right)_{[0,100]}
\]
Interpretasi: Semakin tinggi nilai P_BAL semakin dekat ke pusat (lebih seimbang). Gunakan bersamaan dengan band High/Moderate/Low pada Bagian 2.1. Label persentil BALANCE selalu diberi catatan bahwa ini bukan norma empiris.

## 6. Validasi & Konsistensi
| Aspek | Metode | Alasan |
|-------|--------|--------|
| Skor mentah | Recompute ulang terhadap responses untuk verifikasi integritas | Mencegah manipulasi manual. |
| Dialektika | Cross-check ACCE_raw = AC_raw - CE_raw | Deteksi korupsi penyimpanan. |
| Window gaya | Assert primary window mengandung (ACCE,AERO) | Konsistensi klasifikasi deterministik. |
| Kendall's W | Uji batas: semua konteks ranking identik → W=1 (LFI=0); konteks orthogonal → W mendekati 0 (LFI≈1) | Menguji implementasi formula. |
| Percentile fallback | Bandingkan beberapa raw acak dengan DB setelah impor | Mendeteksi mismatch transkripsi. |

## 7. Potensi Analisis Lanjut
- Reliabilitas internal difference scores: pemeriksaan distribusi varian ACCE/AERO.
- Partial correlation LFI vs intensitas gaya untuk eksplorasi adaptasi.
- Subgroup norms (Age, Gender, Edu) memperluas `norm_group` → analisis invariance.

## 8. Risiko & Mitigasi
| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Fallback norma berbeda sedikit dari tabel lengkap | Interpretasi percentile kurang presisi | Tandai sumber (`norm_group_used`) + anjurkan impor lengkap. |
| Ambiguitas borderline (nilai tepat di cutpoint) | Potensi multi-label | Aturan deterministik ≤/≥ menghindari overlap. |
| Manipulasi manual ranking | Distorsi gaya & LFI | Audit log + checksum finalisasi. |
| Kesalahan transkripsi Appendix | Bias percentile | Unit test verifikasi subset kunci vs contoh manual. |

## 9. Sumber & Sitasi
- Kolb, D. A. (1984). Experiential Learning: Experience as the Source of Learning and Development.
- Kolb, A. Y., & Kolb, D. A. (2013). KLSI 4.0 Guide (Appendix 1, Appendix 7, Figures 4–5).
- AERA/APA/NCME (1999). Standards for Educational and Psychological Testing.
- Kendall, M. G. (1948). Rank Correlation Methods (definisi W).

## 10. Ringkasan Implementasi
Semua formula di atas telah diterapkan langsung tanpa modifikasi spekulatif; tidak ada interpolasi percentile kecuali strategi nearest-lower konservatif saat data hilang (dibedakan jelas sebagai fallback). LFI mengikuti definisi resmi (LFI = 1 − W) dan window gaya menggambarkan resolusi 3×3 difference score grid KLSI 4.0.

## 11. Checklist Verifikasi (Engineer)
- [ ] Raw responses → sum mode = nilai di `scale_scores`.
- [ ] ACCE_raw & AERO_raw konsisten dengan formula difference.
- [ ] Primary style window contains (ACCE_raw, AERO_raw).
- [ ] Backup style ≠ primary & jarak minimal kedua.
- [ ] LFI ∈ [0,1] & W ∈ [0,1].
- [ ] Percentile sumber fallback ditandai ketika DB kosong.

Dokumen ini berfungsi sebagai kontrak psikometrik antara desain teoretis dan implementasi kode sehingga setiap perubahan mendatang dapat diaudit terhadap spesifikasi awal.
