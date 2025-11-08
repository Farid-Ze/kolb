# Kolb Learning Style Inventory (KLSI) – Ringkasan Tujuan, Sejarah, dan Fokus Versi 4.0

Dokumen ini merangkum poin-poin kunci dari referensi utama “The Kolb Learning Style Inventory 4.0: Guide to Theory, Psychometrics, Research & Applications” tanpa mengutip teks berhak cipta secara langsung. Tujuannya adalah memberi konteks konseptual bagi implementasi KLSI 4.0 di repositori ini.

## 1) Untuk Apa KLSI Digunakan
- Pencerahan diri tentang cara belajar dari pengalaman. KLSI menyediakan bahasa bersama bagi peserta didik dan pendidik untuk membicarakan preferensi belajar di sepanjang siklus pengalaman–refleksi–konseptualisasi–aksi, sehingga memicu meta‑kognisi (memantau dan menyesuaikan pendekatan belajar).
- Alat riset untuk memeriksa dan memvalidasi kerangka Experiential Learning Theory (ELT). Penekanan pada validitas konstruk—apakah pola hubungan antar variabel sesuai prediksi teori—bukan pada validitas prediktif untuk seleksi/penempatan.
- Bukan tes kriteria untuk seleksi/penugasan. Menggunakan satu skor untuk “melabeli” atau “menyortir” orang ke perlakuan berbeda tidak sejalan dengan ELT yang menekankan keunikan dan dinamika individu.

Implikasi praktis di aplikasi ini: laporan menekankan pemahaman dan perencanaan belajar, bukan klasifikasi kaku; fitur “Learning Flexibility” menyorot kemampuan beradaptasi lintas konteks.

## 2) Apa yang Diukur KLSI (Versi 4.0)
- Empat mode belajar ELT: Concrete Experience (CE), Reflective Observation (RO), Abstract Conceptualization (AC), Active Experimentation (AE).
- Dua dialektika inti sebagai selisih berpasangan: ACCE = AC − CE, AERO = AE − RO. Tambahan kombinasi klasik: (AC+RO)−(AE+CE) [Assim−Acc] dan (AC+AE)−(CE+RO) [Conv−Div].
- Tipologi sembilan gaya (initiating, experiencing, imagining, reflecting, analyzing, thinking, deciding, acting, balancing) yang memperhalus tipologi empat gaya klasik.
- Learning Flexibility Index (LFI) yang mencerminkan seberapa jauh preferensi berubah antar konteks (berbasis Kendall’s W → LFI = 1 − W).
- Skor keseimbangan kontinu: BALANCE_ACCE = |ACCE − 9| dan BALANCE_AERO = |AERO − 6| (ekuivalen dengan definisi Guide: |AC − (CE + 9)| dan |AE − (RO + 6)|) untuk menunjukkan kedekatan ke pusat normatif; tersedia band High/Moderate/Low dan persentil turunan (non‑normatif) di laporan. Rumus kanonik tersentral di `psychometrics_spec.md`.
- Konversi raw→percentile menggunakan norma demografis; di sistem ini digunakan urutan prioritas norma sesuai kelompok (pendidikan → usia → gender → total) sebelum fallback lampiran.

Detail formula dan cut-band gaya dibahas di `docs/05-learning-styles-theory.md` dan `docs/psychometrics_spec.md`.

## 3) Sejarah Singkat Instrumen
- LSI 1 (1971/1976): Alat pengalaman belajar awal; memicu riset luas lintas bidang; ditemukan tantangan reliabilitas (konsistensi internal dan test–retest) pada beberapa studi.
- LSI 2 (1985): Menambah item untuk tiap skala sehingga reliabilitas internal meningkat; menjaga keterhubungan dengan versi sebelumnya; norma baru yang lebih beragam.
- LSI 2a (1993): Format acak untuk meningkatkan stabilitas test–retest dalam studi reliabilitas.
- KLSI 3 (1999): Mengadopsi format acak dalam buku panduan swaskor; fokus pada pengalaman “belajar tentang cara belajar”.
- KLSI 3.1 (2005): Memperbarui norma berbasis sampel yang lebih besar; alat dan item tetap sama.
- KLSI 3.2 (2013): Menjelaskan tipologi sembilan gaya dalam buku kertas menggunakan instrumen dan norma KLSI 3.1.
- KLSI 4.0 (2011): Revisi besar dengan empat penambahan kunci (lihat di bawah) dan norma yang lebih representatif.

## 4) Apa yang Baru di KLSI 4.0
- Tipologi 9 gaya yang mengurangi kasus borderline dari tipologi 4 gaya.
- Penilaian fleksibilitas belajar lintas konteks, memperlihatkan gaya dominan dan gaya tambahan yang dipakai.
- Laporan interpretatif yang berfokus pada efektivitas belajar: kekuatan–kelemahan dan panduan rencana belajar.
- Psikometrik yang ditingkatkan: norma lebih besar/beragam dengan reliabilitas skala setara/lebih baik, sembari mempertahankan validitas eksternal antar versi.

Repositori ini memanfaatkan penambahan tersebut melalui: klasifikasi 9 gaya, kalkulasi indeks kombinasi, LFI berbasis Kendall’s W, serta laporan yang menekankan strategi belajar dan peran pendidik.

## 5) Validitas: Konstruk vs Prediksi
- Validitas konstruk: fokus pada kesesuaian pola empiris dengan teori ELT (konvergen/ diskriminan), termasuk hubungan dialektika, gaya, dan fleksibilitas.
- Validitas prediktif: bukan fokus utama; korelasi dengan hasil kinerja biasanya moderat pada instrumen psikologis dan tidak menjadi dasar penggunaan KLSI untuk seleksi.

Karena itu, sistem ini memposisikan skor sebagai titik awal refleksi, dilengkapi narasi fleksibilitas, rekomendasi meta‑learning, dan “educator roles” untuk mendukung siklus belajar.

## 6) Etika dan Penggunaan yang Tepat
- Hindari pelabelan kaku atau “tracking” berbasis satu angka. Gunakan hasil untuk dialog dan desain pengalaman.
- Tekankan dinamika: gaya adalah keadaan yang dapat berubah sesuai tuntutan situasi dan dapat dikembangkan melalui praktik sadar.
- Transparansi norma: setiap konversi raw→percentile menyertakan sumber norma (basis data vs fallback lampiran) di laporan.

## 7) Kaitan ke Implementasi di Repositori
- Pipeline perhitungan: CE/RO/AC/AE → ACCE/AERO + kombinasi → 9 gaya + cadangan → LFI → percentiles (provenance).
- Laporan: indeks dialektika, gaya dominan & cadangan, fleksibilitas, saran keseimbangan, meta‑learning, penahapan perkembangan, dan urutan peran pendidik.
- Rujukan cepat:
  - `docs/05-learning-styles-theory.md` — definisi 9 gaya dan cut-band ACCE/AERO.
  - `docs/06-enhanced-lfi-analytics.md` — detail fleksibilitas dan analitik lanjutan.
  - `docs/04-learning-space.md` — prinsip desain ruang belajar.
  - `docs/09-educator-roles.md` — sequencing peran pendidik untuk “mengajar mengelilingi siklus”.

## 8) Sumber Primer
- Kolb, A. Y., & Kolb, D. A. (2011/2013). The Kolb Learning Style Inventory 4.0: Guide to Theory, Psychometrics, Research & Applications. File rujukan tersedia di akar repositori untuk keperluan validasi internal.

Catatan: Dokumen ini adalah ringkasan yang disusun ulang dengan kalimat sendiri untuk kepatuhan hak cipta. Silakan merujuk dokumen primer untuk redaksi resmi, data norma rinci, dan spesifikasi psikometrik lengkap.
