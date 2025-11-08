# UI/UX Model Mental – KLSI 4.0

Tujuan: memetakan alur kognitif pengguna dan struktur antarmuka sehingga logika ipsatif, kalkulasi skor, dan pelaporan dapat dirasakan konsisten tanpa membebani pengguna.

## 1) Sesi Penilaian (Ipsatif 12 item)
- Satuan interaksi: 1 item dengan 4 pilihan (CE, RO, AC, AE) diranking 1–4 (tanpa ties).
- Constraint UX: tidak bisa lanjut jika duplikasi rank atau rank tidak lengkap.
- Aksesibilitas: keyboard-only ranking (↑/↓ untuk memindah peringkat), SR-friendly label.
- Umpan balik: progress 1/12, validasi per item, dan tombol "lanjut" aktif hanya saat 1–4 lengkap.

## 2) Progres & Kelengkapan
- Indikator status sesi: Started → In Progress → Completed.
- Panel "Kelengkapan" menyorot: item belum lengkap, konflik rank, konteks LFI (8) belum terisi.
- Aksi cepat: "Perbaiki" melompat ke item/konteks yang belum lengkap.

## 3) Hasil Inti (Ringkas)
- Raw: CE, RO, AC, AE; Dialektik: ACCE, AERO; Intensitas = |ACCE| + |AERO|.
- Persentil: CE/RO/AC/AE, ACCE, AERO (sesuai precedence norma).
- Band: ACCE (≤5/6–14/≥15), AERO (≤0/1–11/≥12).
- Gaya: nama dan kode gaya utama + backup (jika ada), intensitas.

## 4) Diagnostic (Mediator)
- LFI + konteks: radar/heatmap 8 konteks; narasi pola fleksibilitas (tinggi/moderat/rendah).
- Indeks dialektik tambahan: Assim−Acc, Conv−Div; kurva prediksi LFI.
- Rekomendasi peran pendidik (urutan kuadran) dan meta-learning heuristik.

## 5) Pelaporan
- Grid gaya (v_style_grid): kolom ACCE/AERO, band, dan nama gaya untuk agregasi cepat.
- Filter umum: status Completed, rentang tanggal, kelas, gaya, band.

## 6) Prinsip HCI
- Kognisi eksternal: peta konsep kuadran, warna konsisten (CE-blue, RO-green, AC-orange, AE-red).
- Minim beban memori kerja: validasi langsung di tempat, ringkasan tetap.
- Transparansi psikometrik: istilah dibiarkan dalam EN, label interpretatif dalam ID.
- Privasi: anonimisasi default pada daftar; detail hanya dengan hak akses.
