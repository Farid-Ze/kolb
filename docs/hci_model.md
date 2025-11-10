# Model Mental & HCI (Interaksi Pengguna) – KLSI 4.0

Dokumen ini memformalkan desain antarmuka dan alur kognitif pengguna untuk asesmen KLSI 4.0 dengan dasar akademis dari teori Experiential Learning (Kolb 1984) dan struktur item KLSI versi 4.0.

## Prinsip HCI Akademis
1. Ipsative Consistency: Format forced-choice (ranking 1–4) mengurangi social desirability bias dan acquiescence (literatur forced-choice; selaras dengan desain KLSI historis).
2. Cognitive Load Minimization: Tampilkan satu item (4 pernyataan) per layar atau batch kecil (misal 3 berturut) dengan progress bar → menghindari overload memori kerja.
3. Error Prevention: Validasi langsung mencegah duplikasi angka 1..4 di item yang sama (selaras constraint DB). Pengguna diberi highlight jika angka belum unik.
4. Immediate Feedback (Process, not Outcome): Menampilkan progress (%) bukan skor supaya menjaga fokus proses belajar (Proposisi ELT #1: learning as process).
5. Accessibility & Localization: Terminologi gaya & mode diterjemahkan (Appendix 9 style descriptions) agar bermakna secara budaya; hindari jargon langsung AC/CE/RO/AE tanpa glosarium.
6. Psychological Safety: Antarmuka netral, menghindari framing bahwa gaya tertentu "lebih baik" (ELT: semua gaya adaptif dalam konteks berbeda).

## Alur Pengguna
| Tahap | Tujuan Psikometrik | Komponen UI | Validasi |
|-------|--------------------|------------|----------|
| Registrasi/Login | Identitas & kontrol akses domain | Form email, password | Domain suffix check + hash password |
| Mulai Sesi | Pembuatan container data | Tombol "Mulai" + penjelasan | Konfirmasi versi KLSI 4.0 |
| Pengisian 12 Item Gaya | Mengumpulkan preferensi empat mode | Widget ranking (drag/drop atau input angka 1–4) | Unik 1..4 sebelum lanjut |
| Pengisian 8 Konteks LFI | Variasi preferensi kontekstual | Matriks konteks × empat mode (ranking per baris) | Unik 1..4 setiap baris |
| Finalisasi | Hitung skor & hasil | Tombol finalisasi + spinner progres | Cek semua item terisi |
| Laporan | Komunikasi hasil + edukasi | Panel skor, kite chart, dialektika, tabel percentiles, gaya utama & cadangan | Sumber norma ditampilkan (DB vs Appendix fallback) |

## Komponen Visual
1. Kite Chart: Empat sumbu radial (CE, RO, AC, AE) → memvisualkan profil unik (Fig. 4 pola gaya).
2. Dialectic Axes Overlay: Garis horizontal/vertikal menunjukkan ACCE & AERO; mempermudah pemahaman posisi relatif.
3. Style Region Overlay: Heat map ringan di area window gaya (9 tipe) agar posisi numerik mudah dipetakan tanpa memori manual cutpoints.
4. Flexibility Indicator: Bilah skala (Low–Moderate–High) memetakan LFI_percentile (Appendix 7) dengan demarkasi 33.34% & 66.67%.

## Interaksi Ranking
- Input Metode: Preferensi drag-and-drop (urutan otomatis memberi nilai 1..4) atau numeric spinner masing-masing dengan pemeriksaan otomatis.
- Constraint Feedback: Jika pengguna mengulang nilai → highlight merah + tooltip "Ranking harus 1,2,3,4".
- Partial Save: State tetap di sisi klien (localStorage) untuk pencegahan kehilangan data sebelum submit.

## Mekanisme Finalisasi
Saat finalisasi:
1. Lock sesi (status → Completed) agar tidak ada mutasi tambahan.
2. Jalankan pipeline `finalize_session` (lihat `app/services/scoring.py`).
3. Simpan snapshot hasil (ScaleScore, CombinationScore, PercentileScore, LearningFlexibilityIndex, UserLearningStyle).
4. Audit entry ditulis: action="FINALIZE_SESSION" + hash payload aggregate JSON.
5. UI menampilkan hasil `run_session_validations()` bila ada kegagalan (mis. `ITEMS_INCOMPLETE`, `LFI_CONTEXT_COUNT`) melalui panel peringatan yang menautkan langsung ke item/konteks bermasalah.
6. Jika mediator melakukan override (force finalize), UI meminta alasan tertulis, menampilkan isu yang masih terbuka, dan memberi badge "Override" pada ringkasan hasil.

Panel validasi menampilkan kode/penjelasan isu, status fatal, dan tautan tindakan (scroll ke item atau membuka matriks konteks). Pesan harus tetap dalam bahasa Indonesia yang konsisten dengan kode server.

## Representasi Data di UI
| Data | Format Tampilan | Rasional |
|------|-----------------|----------|
| Raw CE/RO/AC/AE | Angka + posisi radar | Transparansi sumber sebelum konversi percentile. |
| Percentile | Badge angka + label kuartil | Memudahkan interpretasi relatif populasi. |
| ACCE/AERO | Angka + arah (+/-) | Menunjukkan polaritas abstraksi vs konkret & aktif vs reflektif. |
| Primary Style | Nama gaya + ikon metafora | Mempercepat asosiasi konten (Appendix 9 naratif ringkas). |
| Backup Style | Tooltip "Cadangan dekat" | Mengurangi overinterpretasi borderline. |
| LFI | Skor (0–1) + percentile + kategori | Menjelaskan fleksibilitas lintas konteks. |

## Internasionalisasi (Bahasa Indonesia)
- File `app/i18n/id_styles.py` menyimpan ringkas deskripsi gaya.
- Strategi: short phrase (<120 karakter) + link/kode referensi Appendix 9 untuk studi lanjut.
- Menyediakan glosarium: CE = Pengalaman Konkret, RO = Observasi Reflektif, AC = Konseptualisasi Abstrak, AE = Eksperimen Aktif.

## Keputusan HCI yang DiRasionalisasi
| Keputusan | Rasional Teoritis |
|-----------|-------------------|
| Forced-choice ranking | Memaksa trade-off preferensi (dialektika pengalaman vs konsep; aksi vs refleksi). |
| Progress bar bukan timer | ELT memandang belajar sebagai spiral; tekanan waktu dapat menurunkan refleksi. |
| Penundaan menampilkan percentile sampai finalisasi | Menghindari shaping jawaban ke arah hasil (reduksi bias adaptasi). |
| Menampilkan sumber norma | Transparansi epistemik; pengguna tahu apakah data populasi penuh atau fallback. |
| Backup style tampilan sekunder | Menghindari labeling sempit; menekankan potensi adaptasi. |

## Error & Edge Cases
| Skenario | Penanganan |
|----------|------------|
| Item belum lengkap | Tombol finalisasi disabled + daftar item belum lengkap. |
| Hilang koneksi saat finalisasi | Retry idempotent; jika status sudah Completed, tidak memproses ulang. |
| Data norm belum diimpor | Badge "Norma fallback Appendix" + penjelasan dampak. |
| Out-of-range raw (tidak terjadi) | Guard server: perhitungan dialektika menggunakan hanya data valid. |
| Duplikasi submit | Audit log mendeteksi hash sama; sistem tidak menambah entri skor baru. |
| Mediator force finalize | Form modal meminta alasan, menampilkan isu tersisa, dan memberi badge override di laporan; audit hash baru dengan `FORCE_FINALIZE_SESSION`. |

## Mediator Override Workflow

1. Mediator membuka sesi mahasiswa dari dashboard laporan.
2. Klik tombol `Force finalize` (hanya terlihat jika validasi gagal dan pengguna memiliki peran MEDIATOR).
3. Modal menampilkan daftar `validation.issues`, kolom fatal, serta input alasan (wajib diisi).
4. Setelah konfirmasi, UI memanggil `POST /engine/sessions/{id}/force-finalize` atau `/sessions/{id}/force_finalize`.
5. Layar hasil menampilkan badge override dan alasan yang dimasukkan; pengguna non-mediator melihat catatan "Laporan ini difinalisasi oleh mediator meski ada isu terbuka".
6. Layar audit/riwayat menambahkan entri baru dengan hash payload sesuai respons backend.

## Privasi & Etika
- Tidak menampilkan label evaluatif ("tinggi/rendah" kualitas) untuk gaya; fokus adaptasi.
- Percentile ditampilkan sebagai posisi statistik bukan penilaian nilai diri.
- Pengguna bisa meminta anonymization (menghapus data identitas memisahkan `users` & skor).

## Roadmap Penyempurnaan
1. Mode latihan (sandbox) sebelum sesi real untuk mengurangi kesalahan pertama kali.
2. Visual pergerakan spiral (iterasi sesi berbeda) menampilkan perubahan gaya & LFI.
3. Aksesibilitas ARIA untuk kontrol drag ranking.
4. Export PDF laporan bilingual.

## Ringkasan
Model mental & HCI ini menerjemahkan struktur teoritis KLSI 4.0 ke antarmuka yang menjaga validitas psikometrik, mengurangi bias, dan mengedepankan proses belajar sebagai pengalaman adaptif berulang (spiral). Semua keputusan UI dapat ditelusuri ke proposisi ELT dan Appendix 1 & 7 (norma) serta Appendix 9 (narasi gaya).
