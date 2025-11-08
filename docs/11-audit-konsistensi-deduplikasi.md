# Audit Konsistensi & Deduplikasi (docs/ ↔ KLSI 4.0 Guide)

Tanggal: 2025-11-08  
Ruang lingkup: 15 dokumen di `docs/` (01..10 + 5 lainnya) dibandingkan dengan file sumber utama: 
`The Kolb Learning Style Inventory 4.0 - Guide to Theory, Psychometrics, Research & Applications.md`.

## Ringkasan Eksekutif
- Konsistensi formula inti: OK (ACCE=AC−CE, AERO=AE−RO; LFI=1−W; balance sesuai definisi Guide).
- Cut‑bands gaya 3×3: OK setelah harmonisasi notasi ke ACCE <6/6–14/>14 dan AERO <1/1–11/>11.
- Duplikasi angka/rumus: Dipusatkan ke `docs/psychometrics_spec.md` dan dirujuk dari dokumen lain; sisa pengulangan dibiarkan minimal sebagai konteks naratif, bukan sumber angka.
- Koreksi informasi: Klaim “NON‑IPSATIVE (independent scales)” direvisi menjadi “difference scores mengurangi artefak ipsatif; korelasi rendah (≈ −0.09)”.

## Dokumen yang Diaudit
- 01-entity-relationship-model.md — ER konseptual, aturan, checklist (Diperbarui: klaim ipsativitas, catatan band).
- 02-relational-model.md — Pemetaan logis 3NF (Konsisten).
- 03-klsi-overview.md — Ringkasan teori & alur (Diperbarui: kesetaraan rumus balance dengan Guide, rujuk spec).
- 04-learning-space.md — Ruang belajar & implikasi (Konsisten; tidak menyimpan angka band).
- 05-learning-styles-theory.md — 9 gaya, kombinasi (Konsisten; band tertulis sudah <6/<1 notasi kanonik).
- 06-enhanced-lfi-analytics.md — LFI lanjutan & akses (Konsisten; tidak ada angka band baru).
- 07-learning-spiral-development.md — Tahap/level pembelajaran (Konsisten; angka ambang contoh bersifat heuristik, diberi label jelas).
- 08-learning-flexibility-deliberate-practice.md — Latihan fleksibilitas (Konsisten; tabel ringkas memakai nilai band yang sesuai).
- 09-educator-roles.md — Peran pendidik (Konsisten; rujuk indeks, tidak mendefinisikan ulang rumus).
- 10-model-data-klsi.md — Dokumen integrasi (Diperbarui: harmonisasi band, edge cases, anti-duplikasi).
- er_model.md — Alternatif ER/rationalization (Konsisten; tidak menyalahi angka kanonik).
- hci_model.md — Model HCI/UX (Tidak memuat angka kritis).
- psychometrics_spec.md — Spesifikasi kanonik (Sumber angka/rumus utama; konsisten dengan Guide).
- rationalization_matrix.md — Jejak rasionalisasi (Tidak memuat angka kritis bertentangan).
- ui_ux_model.md — Model UI/UX (Tidak memuat angka kritis).

## Validasi terhadap Guide (Butir Kritis)
1) Cut‑bands 9 Gaya  
- Guide mendefinisikan rentang gaya menggunakan ambang ekivalen: ACCE <6 / 6–14 / >14; AERO <1 / 1–11 / >11.  
- v_style_grid dan mv_class_style_stats telah memakai logika band konsisten; notasi di dokumen lain yang sebelumnya ditulis “≤5/≥15; ≤0/≥12” diselaraskan secara semantik.

2) Balance Scores  
- Guide: BALANCE ACCE = ABS[AC − (CE + 9)], BALANCE AERO = ABS[AE − (RO + 6)].  
- Spec: |ACCE − 9|, |AERO − 6| (ekuivalen secara aljabar).  
- Status: Konsisten; catatan kesetaraan ditambahkan di overview.

3) LFI  
- Guide: LFI = 1 − W; W berbasis ranking 4 mode × 8 konteks.  
- Spec & kode: konsisten; persentil LFI berasal dari Appendix 7 saat tersedia; fallback tercatat sebagai logika implementasi (bukan isi Guide).

4) Ipsativitas  
- Data primer (item) bersifat ipsatif (forced‑choice).  
- Difference scores (ACCE/AERO) mengurangi efek ipsatif; empiris korelasi rendah (≈ −0.09) di KLSI 4.0.  
- Status: Redaksi direvisi agar tidak mengklaim “non‑ipsative absolut”.

## Deduplikasi yang Dilakukan
- Menetapkan `docs/psychometrics_spec.md` sebagai sumber kanonik angka/rumus.  
- `10-model-data-klsi.md`: menambahkan bagian “Harmonisasi & Anti‑Duplikasi” + memperjelas edge cases.  
- `03-klsi-overview.md`: merujuk ke spec, tidak menggandakan angka.  
- `01-entity-relationship-model.md`: koreksi klaim ipsativitas; tetap merujuk ke band tanpa mengulang tabel lengkap.

## Rekomendasi Lanjutan (Opsional)
- Tambahkan banner ringan di bagian atas 04,06,07,08,09: “Angka & rumus kanonik → `psychometrics_spec.md`” (non‑breaking, untuk cegah penyalinan angka di masa depan).
- Jika ingin “zero duplication”, ganti potongan angka di dokumen non‑spesifikasi dengan tautan ke bagian spesifik di `psychometrics_spec.md`.

## Kesimpulan
Tidak ditemukan konflik substansial setelah harmonisasi notasi band dan koreksi klaim ipsativitas. Semua butir kunci (cut‑bands, LFI, balance) sekarang eksplisit konsisten dengan Guide. Duplikasi angka telah dipusatkan; dokumen lain merujuk ke spesifikasi kanonik.