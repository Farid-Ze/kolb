# Panduan Dosen/Mediator: Penggunaan KLSI 4.0 yang Bertanggung Jawab

Dokumen ini ditujukan bagi dosen, fasilitator, dan mediator yang memanfaatkan KLSI 4.0 untuk mendesain pengalaman belajar. Gunakan panduan ini bersama referensi teknis `docs/frontend_readiness.md`, `docs/03-klsi-overview.md`, dan `docs/04-learning-space.md`.

## 1. Prinsip Inti

1. **Formatif, bukan seleksi** – Sampaikan kepada peserta bahwa skor digunakan untuk refleksi dan perancangan aktivitas, bukan menilai kemampuan atau menetapkan label tetap.
2. **Transparansi norm** – Sebutkan versi norm/kelompok yang dipakai (lihat metadata `norm_group_used` di laporan) agar peserta memahami konteks perbandingan.
3. **Fleksibilitas ELT** – Tekankan bahwa gaya belajar dapat bergeser sesuai pengalaman. Tujuan fasilitator adalah membantu rotasi CE→RO→AC→AE.

## 2. Workflow Kelas yang Dianjurkan

1. **Pra-sesi**
   - Kirimkan teks consent mahasiswa (lihat `docs/frontend_readiness.md §6.2`).
   - Buat tim atau kelas di `/teams` jika diperlukan.
   - Pastikan semua peserta menyelesaikan sesi dan status validasi `ready`.
2. **Saat sesi**
   - Gunakan panel laporan untuk memicu diskusi reflektif, bukan mempresentasikan skor mentah tanpa konteks.
   - Tunjukkan learning space untuk membahas keragaman gaya di kelas.
3. **Pasca sesi**
   - Catat insight tim/peserta dalam log pembelajaran.
   - Rencanakan aktivitas yang menyeimbangkan mode dominan dengan mode yang kurang terlatih.

## 3. Privasi & Kepatuhan

- Hanya share laporan individual dengan pemiliknya. Untuk diskusi kelas, gunakan agregasi (≥10 responden) atau data anonim.
- Simpan data sesuai retensi (`<=5 tahun` atau sampai lulus). Jika ada permintaan hapus, koordinasikan dengan admin untuk menjalankan job purge.
- Hindari mengunduh data mentah ke perangkat pribadi tanpa enkripsi.

## 4. Pedoman Desain Aktivitas

| Mode | Strategi Kelas | Contoh Aktivitas |
|------|----------------|------------------|
| CE | Bangun pengalaman langsung | Field trip mini, simulasi, studi kasus personal |
| RO | Fasilitasi refleksi | Jurnal, diskusi post-activity, gallery walk |
| AC | Hubungkan teori | Mini lecture interaktif, framing konsep, mind map |
| AE | Uji ide | Prototype sederhana, eksperimen laboratorium, role-play keputusan |

Gunakan hasil gaya belajar tim untuk memastikan jadwal pertemuan mencakup keempat mode.

## 5. Menggunakan Fitur Sistem

- **Dashboard Mediator**: pantau status sesi, jalankan force finalize hanya dalam keadaan darurat dan dokumentasikan alasannya.
- **Teams & Rollup**: jalankan `/teams/{id}/rollup/run` untuk mendapatkan distribusi gaya kolektif dan rata-rata LFI.
- **Research Mode**: sebelum mengekspor data, pastikan flag consent riset aktif dan dataset dianonimkan.

## 6. Panduan Komunikasi

- Gunakan bahasa positif: "preferensi saat ini", "kekuatan belajar", "peluang latihan".
- Hindari istilah deterministik seperti "tipe tetap" atau "profil sempurna".
- Sisipkan disclaimer heuristik saat menampilkan balance percentiles.

## 7. Checklist Sebelum Membagikan Hasil

- [ ] Consent mahasiswa sudah terkumpul dan tersimpan.
- [ ] Semua peserta melihat hasil pribadi sebelum dibahas di kelas.
- [ ] Bahan presentasi mencantumkan versi norm serta sumber (Kolb 4.0 Guide).
- [ ] Rencana aktivitas menyeimbangkan mode CE/RO/AC/AE.
- [ ] Data agregat untuk diskusi kelas sudah dianonimkan.

## 8. Eskalasi & Dukungan

- **Scientific Lead**: konsultasi perubahan interpretasi atau update norm/style window.
- **Engineering Lead**: bantuan teknis, error pipeline, atau audit log.
- **Data Protection Officer**: pertanyaan seputar privasi, retensi, dan permintaan penghapusan.

Gunakan panduan ini sebagai bagian onboarding mediator dan update secara berkala ketika ada perubahan pada norm, laporan, atau kebijakan privasi.
