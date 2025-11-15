# **Basis Pengetahuan Desain Antarmuka Modern: Prinsip & Adopsi (Risalah Teknis Pakar)**

## **Pendahuluan: Tujuan Dokumen**

Dokumen ini merangkum fondasi, strategi adopsi, dan pertimbangan teknis lanjutan untuk sistem desain antarmuka yang modern, adaptif, dan fluidik.

Ini ditujukan sebagai rujukan teknis definitif ("sumber kebenaran") bagi pengembang dan desainer UI/UX ahli. Fokusnya adalah pada *mengapa* (filosofi dan fisika terapan), *bagaimana* (implementasi teknis dan arsitektur perangkat lunak), dan *apa-jika* (skenario tepi & anti-pola).

Dokumen ini mengintegrasikan pilar-pilar desain fundamental, yang ditinjau dari perspektif teknis:

1. **Tata Letak (Layout):** Fondasi struktur, ergonomi matematis, dan kejelasan.  
2. **Gerakan (Motion):** Bahasa komunikasi non-statis dan mekanika klasik terapan.  
3. **Warna (Color):** Alat untuk komunikasi, psikofisika persepsi, dan interaktivitas.  
4. **Material (Material):** Sistem hierarki visual, fisika optik, dan kinerja komputasi.  
5. **Arsitektur UI Deklaratif:** Inti teknis dari *rendering* dan komposisi.  
6. **Manajemen State:** Arsitektur untuk *Single Source of Truth* (SSOT) dan aliran data.  
7. **Alur Kerja Iterasi:** Metodologi *prototyping* dan pengujian *real-time*.  
8. **Adopsi (Adoption):** Checklist audit teknis dan mitigasi risiko.

## **Bagian 1: Fondasi Tata Letak (Layout)**

Tata letak adalah fondasi kejelasan. Ini mengatur konten, memandu pengguna, dan menciptakan rasa hierarki dan ketertiban. Tata letak yang pakar bukanlah tentang "membuatnya pas", tetapi tentang "membuatnya benar" di setiap konteks.

### **1.1. Filosofi Inti: Kejelasan Melalui Struktur**

Tata letak yang sukses adalah yang tidak terlihat. Ia secara diam-diam memandu fokus pengguna, membuat informasi kompleks terasa sederhana, dan memprioritaskan konten di atas krom (chrome) antarmuka.

### **1.2. Prinsip Adaptivitas (Responsive)**

Tata letak **wajib** bersifat adaptif. Antarmuka harus terlihat dan berfungsi dengan baik di semua ukuran layar dan orientasi.

* **1.2.1. Strategi Form Factor:**  
  * **Seluler (Kecil):** Prioritaskan ergonomi (lihat 1.3) dan fokus pada satu tugas. Gunakan tata letak tumpuk (stacked) dan navigasi tab di bagian bawah.  
  * **Tablet (Sedang):** Manfaatkan lebar layar. Gunakan tata letak *split-view*, *sidebar*, dan *grid* multi-kolom. Ini adalah titik transisi dari UI yang *touch-centric* ke *pointer-centric*.  
  * **Desktop (Besar):** Rangkul kepadatan informasi. Gunakan panel multi-kolom, *inspector* kontekstual, dan navigasi *sidebar* yang persisten.  
* **1.2.2. Implementasi Teknis:**  
  * Hindari lebar, tinggi, atau margin yang *fixed* (hard-coded) dengan nilai piksel absolut.  
  * Gunakan *grid* yang fleksibel (misalnya, sistem 12-kolom) dan unit relatif (persentase, *viewport units*).  
  * Tentukan *breakpoints* tata letak yang logis (bukan berdasarkan perangkat tertentu) di mana tata letak beradaptasi secara signifikan untuk mengoptimalkan presentasi konten.

### **1.3. Area Aman (Safe Area) & Ergonomi Matematis**

Ini adalah pertimbangan teknis non-negosiabel.

* **1.3.1. Area Aman (Safe Area):**  
  * **Definisi:** Area *viewport* yang dijamin tidak terhalang oleh elemen perangkat keras atau perangkat lunak sistem.  
  * **Obstruksi Perangkat Keras:** Sudut layar yang membulat, *notch*, *pill*, atau modul kamera.  
  * **Obstruksi Perangkat Lunak:** *Status bar* yang persisten, *home indicator*, atau *toolbar* sistem.  
  * **Aturan Pakar:** Selalu tempatkan kontrol interaktif dan konten penting *di dalam* area aman. Latar belakang visual (seperti gambar atau material) harus *melebar hingga ke tepi* layar (full bleed) untuk menciptakan pengalaman imersif.  
* **1.3.2. Ergonomi (Utama di Seluler) & Hukum Fitts:**  
  * **Zona Interaksi:** Peta panas ergonomis dari jangkauan ibu jari bukanlah preferensi, melainkan didasarkan pada **Hukum Fitts (Fitts's Law)**.  
  * **Model Matematis:** $T \= a \+ b \\log\_2(1 \+ D/W)$  
  * **Justifikasi Teknis:** Waktu ($T$) untuk mencapai target adalah fungsi logaritmik dari jarak ($D$) ke target dan lebar ($W$) target.  
  * **Aplikasi Pakar:**  
    * **Zona Hijau (Mudah):** Bagian bawah layar. Jarak ($D$) dari ibu jari minimal, Lebar ($W$) dari *tab bar* maksimal. Ini menghasilkan $T$ terendah. Tempatkan tindakan primer (CTA, *tab bar*) di sini.  
    * **Zona Kuning (Regangan):** Bagian atas layar. $D$ tinggi, $W$ kecil. $T$ tinggi. Cadangan untuk navigasi sekunder (mis-"Search").  
    * **Zona Merah (Sulit):** Sudut atas yang jauh (misalnya, "Done" di sudut kanan atas untuk pengguna kidal). $D$ maksimal. Hindari tindakan penting di sini.

### **1.4. Hierarki & Keterbacaan (Alignment & Spacing)**

Struktur visual diciptakan oleh spasi dan penyelarasan yang disengaja.

* **1.4.1. Konsistensi Spasi (Grid Ritmis):**  
  * Gunakan sistem spasi yang konsisten (misalnya, kelipatan 4 atau 8 poin) untuk semua *padding*, *margin*, dan jarak antar elemen.  
  * **Justifikasi Matematis:** Ini disebut **skala modular** (misalnya, $y \= 8 \\times n$). Ini bukan arbitrer; ini menciptakan prediktabilitas matematis. Otak manusia sangat pandai mendeteksi pola; skala yang konsisten mengurangi beban kognitif (cognitive load) karena otak tidak perlu memproses puluhan nilai acak, melainkan mengenali satu pola yang berulang.  
  * *Negative space* adalah alat desain yang aktif, bukan sisa.  
* **1.4.2. Penyelarasan (Alignment):**  
  * Selaraskan elemen secara horizontal dan vertikal. Mata manusia secara alami mencari pola; penyelarasan menciptakan garis-garis implisit yang menenangkan dan memandu mata.  
  * Hindari penyelarasan tengah (*centered alignment*) untuk blok teks yang panjang. Ini menghancurkan *leading edge* (tepi kiri) yang konsisten, yang sangat penting bagi mata untuk menemukan titik awal baris berikutnya, sehingga secara signifikan mengurangi kecepatan membaca (reading speed).  
* **1.4.3. Keterbacaan Teks & Skala Teks Dinamis (Dynamic Type):**  
  * Tata letak harus secara fundamental mendukung keterbacaan.  
  * **Panjang Baris (Measure):** Jaga agar baris teks memiliki panjang optimal (sekitar 45-75 karakter). Terlalu pendek menyebabkan mata "melompat" terlalu sering; terlalu panjang menyebabkan mata "tersesat" saat kembali ke baris berikutnya.  
  * **Skala Teks Dinamis (Justifikasi Psikofisika):**  
    * Ini adalah persyaratan aksesibilitas inti. Ini bukan sekadar "memperbesar font"; ini tentang menghormati **ketajaman visual (visual acuity)** pengguna yang berbeda.  
    * **Implementasi:** Tata letak harus beradaptasi dengan mulus saat pengguna mengubah ukuran font di tingkat sistem.  
    * **Uji Skenario Tepi (Blind Spot Umum):**  
      * **Ukuran Terkecil:** Pastikan elemen tidak terlihat terlalu kosong atau "hilang".  
      * **Ukuran Aksesibilitas Terbesar (XXXL+):** Teks tidak boleh terpotong (*clipping*) atau tumpang tindih. Elemen UI (seperti tombol atau sel *list*) harus tumbuh secara vertikal untuk mengakomodasi teks. Jika teks terlalu panjang, gunakan *truncation* (pemotongan) dengan *ellipsis* (...) sebagai upaya terakhir.

### **1.5. Organisasi Konten (Grouping & Composition)**

Gunakan prinsip-prinsip Gestalt untuk mengelompokkan elemen terkait secara visual.

* **Kedekatan (Proximity):** Elemen yang berdekatan secara fisik dianggap sebagai satu kelompok.  
* **Latar Belakang Bersama (Common Region):** Elemen di dalam batas visual yang sama (seperti *card* atau *section* dengan material latar belakang standar) dianggap terkait.  
  * **Implementasi Teknis:** Ini dicapai melalui **Komposisi Tampilan (View Composition)**. Komponen UI kustom (misalnya, ProfileCard) dibuat dengan membungkus elemen-elemen (Avatar, Nama, Judul) di dalam satu kontainer induk. (Lihat Bagian 5.3).  
* **Pemisah (Separators):** Gunakan pemisah garis tipis (menggunakan warna separator sistem) untuk memisahkan item *list* atau area fungsional yang berbeda, tetapi jangan gunakan secara berlebihan. Spasi seringkali merupakan pemisah yang lebih baik.

### **1.6. Model Presentasi Kontekstual (Modal)**

Presentasi modal (seperti *sheets* dan *popover*) adalah alat tata letak yang kritis untuk mengelola fokus dan konteks.

* **Tujuan:** Menyajikan informasi atau tindakan kontekstual yang bersifat sementara tanpa membuat pengguna kehilangan alur utamanya.  
* **Pola Utama:**  
  * ***Sheet*** **(Lembar):** Meluncur naik dari bagian bawah (seluler) atau muncul di tengah (desktop) untuk menyajikan tugas mandiri yang terfokus (misalnya, membuat email baru, pengaturan). Ini secara sengaja menginterupsi alur utama.  
  * ***Popover*** **(Letupan):** Muncul sebagai "gelembung" kecil yang menunjuk ke elemen pemicunya. Digunakan untuk tindakan sekunder atau informasi non-kritis (misalnya, menu "Filter", detail tambahan). Ini *tidak* boleh menginterupsi alur utama.  
* **Justifikasi Ergonomis:** *Sheets* di seluler muncul dari bawah, menempatkan tindakan utama (seperti "Simpan" atau "Kirim") langsung di Zona Hijau ergonomis (lihat 1.3.2).

## **Bagian 2: Fondasi Gerakan (Motion)**

Gerakan (Motion) bukanlah dekorasi; ini adalah **mekanika klasik terapan**. Gerakan yang dirancang dengan baik membuat antarmuka terasa hidup, responsif, dan intuitif karena ia mematuhi hukum fisika yang diharapkan pengguna secara tidak sadar.

### **2.1. Filosofi Inti: Gerakan sebagai Fisika Terapan, Bukan Keyframing**

Setiap transisi menceritakan sebuah kisah. Gerakan yang pakar akan menjawab pertanyaan pengguna secara instan: "Apa yang baru saja terjadi?", "Dari mana saya berasal?", dan "Ke mana saya bisa pergi selanjutnya?". Ini adalah tentang menyampaikan informasi melalui perubahan status berbasis fisika.

Ini dimungkinkan secara komputasi oleh arsitektur UI-sebagai-fungsi-dari-state ($UI \= f(State)$), di mana transisi adalah interpolasi yang dihitung secara *real-time* antara dua status (lihat Bagian 5 & 6).

### **2.2. Tujuan Fungsional Gerakan**

Gerakan harus selalu memiliki tujuan yang jelas:

* **2.2.1. Memberikan Umpan Balik (Feedback):**  
  * Mengonfirmasi tindakan pengguna secara instan (lihat 2.4.1).  
  * Contoh: Tombol yang "melentur" (flexing) atau bersinar (glow) saat ditekan, memberikan konfirmasi taktil (bahkan jika visual) sebelum tindakan selesai.  
* **2.2.2. Menunjukkan Status (Status):**  
  * Mengomunikasikan aktivitas latar belakang atau perubahan status yang sedang berlangsung.  
  * Contoh: *Spinner*/*loader* (menunjukkan proses), *progress bar* (menunjukkan durasi), *badge* yang "berdenyut" (menunjukkan notifikasi baru).  
* **2.2.3. Memandu Fokus (Guidance):**  
  * Mengarahkan perhatian pengguna ke elemen penting atau perubahan kontekstual.  
  * Contoh: Elemen baru yang muncul dalam *list* (animasi *fade-in* dan *slide-down*), *badge* notifikasi yang muncul dengan *bounce* kecil.  
* **2.2.4. Menunjukkan Hubungan (Konteks & Hierarki):**  
  * Menampilkan hierarki atau hubungan spasial antar *view*.  
  * Contoh: *Sheet* modal yang meluncur naik dari tombol yang memicunya (secara visual menghubungkan pemicu dan hasil). *Drill-down* dalam navigasi yang meluncur dari kanan-ke-kiri (menciptakan model mental tumpukan).

### **2.3. Realisme & Fisika (Physics-Based)**

Animasi harus terasa realistis, memuaskan, dan selaras dengan sifat "fluidik" dari material baru.

* **2.3.1. Model Fisika: Osilasi Harmonik Teredam (Damped Harmonic Oscillation):**  
  * **Anti-Pola:** Hindari transisi *keyframe* statis (misalnya, kurva Bézier, ease-in-out). Kurva ini memiliki durasi tetap dan jalur tetap. Mereka terasa "mati" dan "robotik".  
  * **Model Pakar:** Gunakan sistem animasi berbasis fisika **"Spring" (Pegas)**.  
  * **Justifikasi Teknis:** Animasi "Spring" didasarkan pada **Osilasi Harmonik Teredam**. Ia mensimulasikan **Hukum Hooke (**$F \= \-kx$**)** ditambah koefisien redaman (*damping coefficient*).  
  * **Mengapa Ini Superior:**  
    1. **Stateful:** Tidak seperti kurva Bézier, *spring* memiliki status saat ini (posisi, kecepatan). Ia menghitung jalurnya secara *real-time* (misalnya, 60-120 kali per detik) berdasarkan target barunya.  
    2. **Interruptible (Dapat Diinterupsi):** Karena *stateful*, ia dapat diinterupsi kapan saja. Jika pengguna "melempar" objek yang sedang bergerak, *spring* akan dengan mulus mengubah target dan kecepatannya tanpa *jank*. Ini adalah inti dari nuansa responsif.  
* **2.3.2. Sifat Fluidik (dari Video):**  
  * Gerakan material itu sendiri adalah inti dari pengalaman.  
  * **Flexing (Melentur):** Reaksi instan (berbasis *spring*) terhadap sentuhan.  
  * **Fusing (Menggabung):** Elemen yang berdekatan dapat bergabung sementara, seperti dua tetes air, untuk menunjukkan hubungan (misalnya, elemen notifikasi "Pulau Dinamis" yang bergabung dengan elemen lain).  
  * **Morphing (Berubah Bentuk):** Transisi mulus antara status fungsional (misalnya, tombol "Play" yang berubah bentuk menjadi tombol "Pause"). Ini sering dicapai dengan menginterpolasi *path* atau *corner radius* dari *shape*.  
* **2.3.3. Interuptibilitas (Interruptibility):**  
  * Animasi yang sedang berlangsung (terutama yang dipicu pengguna, seperti *scrolling* atau *dragging*) harus dapat diinterupsi di tengah jalan tanpa *jank* atau penundaan. Ini hanya mungkin dilakukan dengan model berbasis fisika (2.3.1).

### **2.4. Kinerja Persepsian (Perceived Performance)**

Gunakan gerakan untuk meningkatkan persepsi kecepatan (perceived speed) dan menutupi latensi (latency).

* **2.4.1. Ambang Batas Persepsi (Perceptual Thresholds):**  
  * **\< 100md:** Dipersepsikan sebagai **instan**. Gunakan untuk umpan balik sentuhan (misalnya, tombol *flexing*).  
  * **100-300md:** Dipersepsikan sebagai **responsif** dan mulus. Durasi ideal untuk transisi layar.  
  * **\> 500md:** Mulai terasa **lambat** atau tertunda.  
  * **\> 1000md (1 detik):** Dipersepsikan sebagai **penundaan**. Wajib menggunakan *loader* atau *progress indicator* untuk mengelola ekspektasi.  
* **2.4.2. Manajemen Ekspektasi:**  
  * **Optimistic UI:** Asumsikan operasi berhasil secara instan (misalnya, tombol "Like" langsung terisi) dan lakukan *revert* hanya jika operasi gagal.  
  * **Skeleton Loaders:** Gunakan *placeholder* tata letak (skeleton UI) yang dianimasikan dengan *shimmer* atau *pulse* halus. Ini mengelola ekspektasi dengan menunjukkan *struktur* yang akan datang, yang secara psikologis terasa lebih cepat daripada *proses* abstrak (*spinner*).

### **2.5. Aksesibilitas Gerakan (Reduce Motion)**

Ini adalah persyaratan wajib untuk tingkat pakar. Pengguna dapat mengaktifkan **Reduce Motion** di pengaturan sistem karena alasan preferensi atau sensitivitas vestibular.

* **2.5.1. Fallback Wajib:** Semua gerakan dinamis, fisika *spring*, efek paralaks, dan transisi 3D yang kompleks **harus** memiliki *fallback*.  
* **2.5.2. Implementasi Teknis:**  
  * Secara komputasi, ini berarti mengganti kalkulasi **sistem berbasis fisika** (mahal) dengan transisi **kurva Bézier** (murah dan tetap).  
  * **Pilihan Utama:** **Cross-fade** (larut) sederhana.  
  * **Pilihan Kedua:** *Slide* arah yang sederhana (tanpa *bounce* atau *spring*).  
* **2.5.3. Transparansi Terkait:** *Reduce Motion* sering diaktifkan bersamaan dengan **Reduce Transparency** (lihat 8.5.3). Sistem Anda harus menghormati keduanya secara bersamaan.

## **Bagian 3: Fondasi Inti \- Penggunaan Warna**

Warna dalam sistem ini berfungsi sebagai alat komunikasi fungsional. Tujuannya adalah untuk memberikan kejelasan, menunjukkan interaktivitas, dan memperkuat hierarki informasi.

### **3.1. Filosofi Inti: Warna sebagai Psikofisika Persepsi**

Warna bukanlah dekorasi. Setiap warna harus memiliki pekerjaan. Jika sebuah warna tidak melayani tujuan fungsional (status, interaktivitas, hierarki), itu adalah kebisingan. Warna tidak absolut; ia dipersepsikan secara relatif terhadap konteksnya.

### **3.2. Prinsip Utama: Tujuan di atas Estetika**

* **3.2.1. Menunjukkan Interaktivitas:** Memberi tahu pengguna elemen mana yang dapat ditindaklanjuti.  
* **3.2.2. Memberikan Umpan Balik:** Mengonfirmasi status (misalnya, sukses, error, peringatan).  
* **3.2.3. Memandu Navigasi:** Membantu pengguna memahami posisi mereka dalam aplikasi (misalnya, warna aksen pada tab yang aktif).  
* **3.2.4. Menciptakan Hierarki:** Membedakan antara tingkat informasi (misalnya, label primer vs. label sekunder).

### **3.3. Strategi Kunci: Prioritaskan Warna Sistem**

Sangat direkomendasikan untuk menggunakan palet warna yang telah ditentukan oleh sistem (misalnya, label, secondaryLabel, separator, fill, systemBackground).

* **3.3.1. Manfaat Utama:** Warna-warna ini dirancang untuk **beradaptasi secara otomatis** terhadap berbagai konteks.  
  * **Prediktabilitas Pengguna:** Pengguna sudah tahu bahwa label dapat dibaca dan link (biru/aksen) dapat diklik.  
  * **Pemeliharaan Pengembang:** Anda tidak perlu mengelola *token* warna kustom untuk setiap skenario.  
* **3.3.2. Adaptasi Otomatis (Gratis):**  
  * **Mode Tampilan:** Transisi mulus antara Terang & Gelap.  
  * **Aksesibilitas:** Menyesuaikan diri secara otomatis untuk *Increase Contrast* dan *Reduce Transparency*.  
  * **Status Tampilan:** Menyesuaikan diri untuk *vibrancy* (lihat 3.5.2) dan status non-aktif.

### **3.4. Mandat Aksesibilitas & Interaktivitas**

* **3.4.1. Warna Aksen (Accent Color):**  
  * Tentukan satu warna aksen utama (seringkali warna merek) yang **secara konsisten** menunjukkan interaktivitas.  
  * Gunakan warna ini untuk semua elemen yang dapat ditindaklanjuti: tombol, tautan, *toggle*, *slider* aktif, dsb.  
* **3.4.2. Blind Spot Kritis:**  
  * **Jangan** menggunakan warna aksen interaktif yang sama untuk elemen non-interaktif (seperti judul atau teks statis). Ini menghancurkan kepercayaan pengguna pada bahasa visual Anda.  
* **3.4.3. Mandat Aksesibilitas (W3C/WCAG) & Formula Teknis:**  
  * **Kontras:** Pastikan rasio kontras minimal 4.5:1 (AA) untuk teks normal dan 3:1 (AA) untuk teks besar.  
  * **Justifikasi Teknis:** Ini bukan subjektif. Ini adalah **perhitungan matematis** dari luminans relatif (L) berdasarkan spesifikasi WCAG 2.1:  
    * Rasio \= $(L\_1 \+ 0.05) / (L\_2 \+ 0.05)$  
    * Di mana $L\_1$ adalah luminans warna yang lebih terang dan $L\_2$ adalah yang lebih gelap. $L$ sendiri dihitung dari nilai sRGB yang telah digamma-koreksi.  
  * **Solusi:** **Jangan Andalkan Warna Saja:** Ini adalah kegagalan aksesibilitas yang umum. Selalu pasangkan warna (misalnya, status error merah) dengan indikator non-warna (ikon, label teks, pola).

### **3.5. Strategi Warna Semantik & Dinamis (Untuk Pakar)**

* **3.5.1. Warna Semantik (Fungsional):**  
  * Tetapkan palet semantik di luar warna aksen: error, success, warning.  
  * **Penting:** Warna-warna semantik ini juga **wajib** memiliki varian untuk Terang, Gelap, dan Kontras Tinggi, dan harus diuji menggunakan formula di 3.4.3.  
* **3.5.2. Memahami *Vibrancy* (Model Fisika: Persepsi Warna Kontekstual):**  
  * *Vibrancy* **bukanlah warna**; ini adalah **efek** yang diterapkan pada warna fungsional sistem (label, fill) ketika dirender di atas material tembus pandang.  
  * **Justifikasi Psikofisika:** Warna tidak dipersepsikan secara absolut; mereka dipersepsikan relatif terhadap latar belakangnya (fenomena *simultaneous contrast*).  
  * **Anti-Pola Teknis:** Menggunakan *opacity* sederhana (misalnya, alpha: 0.7) adalah *blend* matematis linier di ruang sRGB: $Color\_{final} \= 0.7 \\times Color\_{fg} \+ 0.3 \\times Color\_{bg}$. Ini **gagal total** dalam menjaga persepsi warna atau kontras.  
  * **Cara Kerja *Vibrancy*:** Vibrancy adalah *blend* perseptual. Ia kemungkinan beroperasi di ruang warna yang seragam secara perseptual (seperti CIELAB atau Oklab) untuk menemukan warna baru yang (a) secara perseptual *terasa* seperti warna aslinya, namun (b) secara matematis *menjamin* target kontras minimum terhadap konten latar belakang yang baru (yang diambil sampelnya secara *real-time*).  
* **3.5.3. *Tinting* (Pewarnaan) pada Material (dari Video):**  
  * Material baru memperkenalkan *tinting* "volumetrik". Ini bukan *overlay* warna datar.  
  * **Cara Kerja:** *Tinting* diterapkan seolah-olah warna itu dicampur ke dalam "kaca" itu sendiri. Ia bereaksi terhadap properti optik material, berinteraksi dengan cahaya, dan memengaruhi sorotan (highlights) dan bayangan.  
  * **Tujuan:** Gunakan secara hemat untuk penekanan (emphasis) pada elemen interaktif utama (misalnya, tombol CTA utama).

## **Bagian 4: Sistem Material Hierarkis Dua Lapis**

Arsitektur visual ini didasarkan pada sistem dua lapisan yang jelas untuk memisahkan **fungsi** (kontrol) dari **konten** (informasi). Ini adalah inti dari sistem desain baru.

### **4.1. Filosofi Inti: Hierarki melalui Fisika Optik**

Antarmuka tidak lagi datar. Ia memiliki kedalaman (axis-Z). Lapisan fungsional (kontrol) mengambang "di atas" lapisan konten. Pemisahan ini tidak lagi dicapai dengan bayangan palsu (drop-shadow), tetapi oleh **simulasi fisika optik** yang otentik.

### **4.2. Lapisan Fungsional: Material Kaca Fluidik**

Ini adalah material dinamis baru yang membentuk lapisan fungsional teratas untuk elemen navigasi dan kontrol. Ini adalah "meta-material" digital.

* **4.2.1. Perilaku Optik: Lensing & Refraksi (Optics: Lensing & Refraction)**  
  * Ini bukan sekadar *blur* statis (seperti *Gaussian blur*); ini adalah material optik dinamis.  
  * **Refraksi (Pembiasan):** Material ini secara aktif **membengkokkan cahaya** dari konten di bawahnya. Secara komputasi, ini adalah *shader* yang menerapkan peta distorsi (*distortion map*) ke *texture fetch* dari *framebuffer* di bawahnya.  
  * **Refleksi (Pantulan):** Ia juga menangkap cahaya lingkungan virtual, menciptakan **sorotan (highlights) spekular** realistis yang bergerak saat perangkat dimiringkan.  
  * **Justifikasi Teknis:** Material ini berperilaku seolah-olah memiliki **Indeks Bias (Index of Refraction \- IOR)** spesifik yang mensimulasikan kaca, membedakannya dari *blur* buram sederhana.  
* **4.2.2. Perilaku Interaktif: Fluiditas (Fluidity)**  
  * Material ini bersifat "cair" dan hidup, merespons input (seperti yang dijelaskan di Bagian 2.3.2).  
  * **Flexing (Melentur):** Reaksi instan (berbasis *spring*) terhadap sentuhan; material "mengalah" dan bersinar (*glow*).  
  * **Fusing (Menggabung):** Elemen yang berdekatan dapat bergabung sementara untuk menunjukkan hubungan kontekstual.  
  * **Morphing (Berubah Bentuk):** Transisi mulus antara status fungsional (misalnya, tombol yang berubah menjadi menu).  
* **4.2.3. Tujuan Penggunaan:**  
  * Digunakan **secara eksklusif** untuk elemen navigasi dan kontrol utama.  
  * Contoh: *Tab bar*, *sidebar*, *toolbar*, *navigation bar*, *popover*, dan *sheet* (presentasi modal).  
* **4.2.4. Aturan Penggunaan Kritis:**  
  * **Jangan Berlebihan:** Gunakan hanya untuk elemen fungsional yang ditentukan.  
  * **Bukan untuk Konten:** **Jangan** gunakan material ini di dalam area konten utama aplikasi (misalnya, *background* dari *feed*). Ini akan merusak hierarki visual dan membingungkan pengguna tentang apa yang interaktif.  
* **4.2.5. Varian Kaca Fluidik:**  
  * **Regular (Default):** Ini adalah opsi utama. Ia **adaptif**, secara dinamis menyesuaikan *blur*, luminositas, dan saturasi berdasarkan konten di bawahnya (baik terang maupun gelap) untuk menjaga keterbacaan teks di atasnya (lihat 3.5.2).  
  * **Clear (Bening):** Varian yang sangat transparan dan kurang adaptif.  
    * **Kasus Penggunaan:** *Hanya* untuk digunakan di atas latar belakang yang sangat kaya visual (media-rich), seperti foto, video, atau *gameplay*, di mana tujuannya adalah pengalaman imersif maksimal.  
    * **Risiko Pakar:** Varian *clear* memiliki risiko kegagalan kontras yang tinggi. (Lihat 8.5.2 untuk mitigasi).

### **4.3. Lapisan Konten: Material Standar**

Material ini digunakan **di dalam lapisan konten** (di bawah Kaca Fluidik) untuk menciptakan struktur dan pemisahan visual.

* **4.3.1. Tujuan:** Membantu mengatur area konten.  
  * Contoh: Latar belakang *list* yang dikelompokkan, *card* individual, atau panel pemisah dalam *split-view*.  
* **4.3.2. Varian & Tujuan Semantik:**  
  * Varian ini dibedakan berdasarkan ketebalan/opasitas.  
  * ultra-thin: Paling transparan.  
  * thin: Sedikit lebih buram.  
  * regular: Default. Keseimbangan baik.  
  * thick: Paling buram.  
* **4.3.3. Prinsip Pemilihan:**  
  * Pilih material berdasarkan **fungsi semantiknya** dan kebutuhan kontras, bukan hanya berdasarkan tampilannya dalam satu skenario. Ingat bahwa *Reduce Transparency* akan membuatnya buram (opaque).

### **4.4. Prinsip Keterbacaan Material**

Saat menempatkan teks atau simbol di atas *material apa pun* (baik Fluidik maupun Standar), **wajib** menggunakan warna "vibrant" yang ditentukan sistem (lihat 3.5.2). Ini menjamin bahwa teks akan tetap kontras dan terbaca.

### **4.5. Implementasi Lanjutan & Pertimbangan Kinerja (Untuk Pakar)**

* **4.5.1. Material pada *Custom View*:** Menerapkan material Kaca Fluidik pada *view* kustom bukan sekadar mengatur backgroundColor. Ini melibatkan penerapan efek visual sistem yang juga harus mendefinisikan *shape* (bentuk) material tersebut (misalnya, *rounded rectangle*).  
* **4.5.2. Pertimbangan Kinerja (Biaya Komputasi GPU):**  
  * **Justifikasi Teknis:** Efek material ini (blur, lensing, highlight) tidak "murah". Efek ini dijalankan pada GPU sebagai **fragment/pixel shader**.  
  * *Real-time blur* (seperti *Gaussian blur*) sudah mahal (memerlukan banyak *texture fetches* per piksel). Menambahkan *lensing* (distorsi matematis) dan *highlight* (kalkulasi pencahayaan) di atasnya akan melipatgandakan **beban shader (shader load)**.  
  * **Risiko:** Menggunakan puluhan *view* kustom dengan material ini secara bersamaan (terutama selama animasi atau *scrolling* cepat) dapat menyebabkan *frame drop* (penurunan frame rate) pada perangkat yang lebih tua.  
  * **Tindakan:** Lakukan *profiling* kinerja GPU secara agresif.  
* **4.5.3. Interaksi *Scroll-Edge* (Kritis):**  
  * Ini adalah perilaku inti dari Kaca Fluidik pada *bar* navigasi.  
  * **Perilaku:** Saat *bar* (misalnya, *toolbar*) berada di atas latar belakang kosong, ia mungkin transparan. Saat konten (dari *scroll view*) mulai *scroll* di bawahnya, *bar* tersebut secara dinamis menerapkan material Kaca Fluidik untuk menjaga kejelasan dan kontras.  
  * **Justifikasi Teknis:** Ini adalah *event listener* yang memetakan variabel **scroll offset (Y-position)** ke fungsi yang mengubah opasitas material.  
  * **Implementasi:** Ini *otomatis* untuk komponen *bar* standar yang dipasangkan dengan *scroll view* standar. Jika Anda menggunakan *header* kustom, Anda mungkin perlu mendaftarkan *listener* ini secara manual.  
* **4.5.4. Material vs. Opacity (Anti-Pola):**  
  * Meniru "material" dengan hanya menurunkan *alpha/opacity* adalah **praktik yang salah**. Ini hanya membuat *view* transparan dan tidak menerapkan *blur*, *lensing*, atau *vibrancy* yang diperlukan, menghasilkan teks yang tidak terbaca dan tampilan yang "murah".

## **Bagian 5: Arsitektur UI Deklaratif (Inti Teknis)**

Prinsip-prinsip desain di atas (Layout, Motion, Material) hanya dapat dieksekusi secara efisien melalui pergeseran paradigma dari *imperatif* ke *deklaratif*.

### **5.1. Filosofi Inti: UI sebagai Fungsi dari State ($UI \= f(State)$)**

* **Paradigma Imperatif (Lama):** "Buat tombol. Pindahkan tombol ke (x, y). Saat diklik, cari label dan ubah teksnya." Anda secara manual memanipulasi (mutate) objek UI yang *stateful*. Ini rapuh dan sulit diskalakan.  
* **Paradigma Deklaratif (Baru):** "Inilah *state* saya. Jika *state* adalah A, UI *adalah* Teks 'Halo'. Jika *state* adalah B, UI *adalah* Tombol 'Kirim'."  
* **Justifikasi Teknis:** Anda tidak lagi memanipulasi *view* secara langsung. Anda hanya **mendeklarasikan** seperti apa UI seharusnya untuk *state* tertentu. *Framework* sistem kemudian menghitung cara paling efisien untuk beralih dari UI lama ke UI baru (*diffing*). Gerakan (Bagian 2\) menjadi interpolasi otomatis antara dua *state*.

### **5.2. Anatomi Komponen (View) & Lifecycle**

* **Definisi:** Komponen UI (selanjutnya disebut "Tampilan" atau "View") dalam sistem deklaratif adalah **snapshot** yang ringan, *stateless*, dan bernilai (*value types*).  
* **Sifat:**  
  * **Ringan:** Mereka adalah deskripsi struct sederhana dari UI, bukan objek class yang berat dengan *state* internal yang persisten.  
  * **Cepat Dibuat & Dibuang:** Sistem dapat membuat dan menghancurkan ribuan *deskripsi view* ini per detik tanpa overhead kinerja.  
  * **Stateless:** *View* itu sendiri tidak "memiliki" data. Ia hanya *menerima* data (state) dan merendernya. (Lihat Bagian 6).  
* **Lifecycle & Identitas:**  
  * Sistem mengelola *lifecycle* *view*. Ia melacak *identitas* *view* di antara pembaruan *render*.  
  * Jika *identitas* *view* tetap sama tetapi *state*\-nya berubah, sistem akan memperbarui *view* tersebut di tempat (seringkali dengan animasi).  
  * Jika *identitas* *view* berubah (misalnya, tipe *view* berbeda dalam pernyataan if/else), sistem akan menghancurkan *view* lama dan membuat yang baru (seringkali dengan transisi *fade*).

### **5.3. Komposisi di atas Pewarisan (Composition over Inheritance)**

* **Arsitektur:** Komponen UI kustom **tidak** dibuat dengan *mewarisi* (inheritance) dari *base class* yang besar (misalnya, UIView, NSView).  
* **Model Komposisi:** Komponen baru dibuat dengan **menggabungkan (composing)** komponen yang lebih kecil, seperti balok Lego.  
* **Implementasi Teknis:** Komponen kustom (CustomView) mendeklarasikan properti body yang berisi *deskripsi* dari komponen lain yang menyusunnya.  
* **Manfaat:**  
  * **Enkapsulasi:** *Internal layout* dari CustomView adalah *black box* bagi *parent*\-nya.  
  * **Reusabilitas:** Komponen kecil yang terdefinisi dengan baik (misalnya, AvatarView) dapat digunakan kembali di mana saja.  
  * **Testabilitas:** Jauh lebih mudah untuk menguji *output* dari *view* komposisi yang kecil daripada *state* internal dari *superclass* yang besar.

## **Bagian 6: Arsitektur Manajemen State (Source of Truth)**

Jika $UI \= f(State)$, maka *manajemen state* adalah disiplin arsitektur yang paling penting.

### **6.1. Prinsip Inti: Satu Sumber Kebenaran (Single Source of Truth \- SSOT)**

* **Definisi:** Untuk setiap bagian data (state) dalam aplikasi, harus ada *satu, dan hanya satu, "pemilik"*.  
* **Aliran Data (Data Flow):**  
  1. **Data Mengalir ke Bawah:** *State* (SSOT) diteruskan ke *view* anak (child views) sebagai dependensi *read-only*.  
  2. **Event Mengalir ke Atas:** *Child views* tidak mengubah *state* secara langsung. Mereka mengirim *event* atau *callback* (misalnya, onButtonTap) ke atas, yang diterima oleh *pemilik state* (SSOT).  
  3. **Siklus:** Pemilik memperbarui *state*\-nya. Karena $UI \= f(State)$, *framework* secara otomatis menghitung ulang dan merender ulang semua *view* turunan yang bergantung pada *state* tersebut.

### **6.2. Taksonomi State (Kepemilikan Data & Pembungkus Properti)**

Untuk mengelola SSOT secara efektif, *framework* menyediakan *property wrapper* untuk menentukan kepemilikan dan dependensi *state*.

* **@State (Lokal, Dimiliki):**  
  * **Tujuan:** Untuk *state* yang **private**, **sederhana**, dan **dimiliki** oleh *view* itu sendiri.  
  * **Kasus Penggunaan:** *State* UI sementara, seperti isToggleOn, currentSliderValue, atau teks dalam TextField.  
  * **Aturan:** Selalu tandai sebagai private. Jika *view* lain perlu mengetahuinya, Anda mungkin salah memilih *wrapper*.  
* **@Binding (Didelegasikan, Referensi Mutasi):**  
  * **Tujuan:** Untuk **referensi yang dapat dimutasi** ke *state* yang *dimiliki oleh orang lain* (biasanya @State di *parent view*).  
  * **Kasus Penggunaan:** Membuat komponen *reusable* yang perlu mengubah *state* di *parent*. Contoh: *View* Toggle kustom menerima @Binding ke isToggleOn yang dimiliki oleh *parent*.  
  * **Justifikasi Teknis:** Ini adalah implementasi dari aliran "Event Mengalir ke Atas" (6.1). Ini adalah *two-way binding* yang aman.  
* **ObservableObject / @StateObject / @ObservedObject (Eksternal, Dimiliki Bersama):**  
  * **Tujuan:** Untuk *state* yang **kompleks**, memiliki **logika bisnis**, atau **dibagikan (shared)** di antara banyak *view* yang tidak terkait secara langsung.  
  * **Arsitektur:** Ini adalah *reference type* (class, bukan struct).  
  * **Mekanisme:** *Object* ini "menerbitkan" (@Published) perubahannya, dan *view* "berlangganan" (@ObservedObject atau @StateObject) ke perubahan tersebut. Ketika *object* menerbitkan perubahan, *view* yang berlangganan akan di-*render* ulang.  
  * **Kasus Penggunaan:** Model data (misalnya, UserProfile), *view model* (misalnya, LoginViewModel), atau *service* (misalnya, LocationManager).

## **Bagian 7: Alur Kerja Prototyping & Iterasi Real-Time**

Paradigma deklaratif memungkinkan alur kerja pengembangan yang revolusioner: *prototyping* secara *real-time*.

### **7.1. Filosofi: Desain sebagai Kode, Kode sebagai Desain**

Secara historis, ada pemisahan: Desainer membuat gambar statis (Figma, Sketch), dan Pengembang "menerjemahkannya" ke kode. Paradigma baru ini memungkinkan desain dan pengembangan terjadi secara bersamaan.

### **7.2. Lingkungan Pratinjau Interaktif**

* **Konsep:** *Framework* menyediakan kemampuan untuk merender *preview* (pratinjau) komponen UI secara *live* dan *interaktif* langsung di samping editor kode.  
* **Cara Kerja:** Pengembang menulis kode untuk *view* (Bagian 5\) dan secara bersamaan menulis kode *preview* yang menginisialisasi *view* tersebut dengan data *mock* (dummy).  
* **Perubahan Real-Time:** Mengubah kode *view* (misalnya, mengubah *padding* atau warna) akan secara instan (hot reload) memperbarui pratinjau tanpa perlu *rebuild* dan *re-run* seluruh aplikasi.

### **7.3. Manfaat Teknis & Strategis**

* **Iterasi Desain Berkecepatan Tinggi:** Menyesuaikan spasi (1.4.1), kurva animasi (2.3.1), atau warna (3.4.1) dapat dilakukan dalam hitungan detik, bukan menit.  
* **Uji Kontekstual & State Tepi:**  
  * Alih-alih menjalankan aplikasi dan mengklik 5 layar untuk sampai ke status *error*, Anda dapat langsung **mem-*"mock"* (mensimulasikan) *state* tersebut** di *preview*.  
  * Anda dapat membuat beberapa *preview* secara bersamaan untuk menguji *view* yang sama dalam berbagai konteks:  
    * Mode Terang vs. Mode Gelap (3.3.2)  
    * Berbagai Skala Teks Dinamis (1.4.3)  
    * Berbagai *Form Factor* Perangkat (1.2.1)  
    * Berbagai *State* Data (Loading, Error, Data Penuh, Data Kosong).  
* **Pengembangan Berbasis Komponen (Component-Driven Development):**  
  * Mendorong praktik terbaik (5.3) dengan memungkinkan pengembang membangun dan menguji komponen secara terisolasi sebelum mengintegrasikannya ke dalam aplikasi yang lebih besar.

## **Bagian 8: Checklist Audit & Mitigasi Risiko Untuk Pakar**

Mengadopsi sistem desain baru ini memerlukan audit teknis dan desain yang ditargetkan.

### **8.1. Langkah 1: Adopsi Otomatis (Via SDK)**

Membangun ulang (rebuild) aplikasi dengan SDK dan *framework* UI terbaru akan secara otomatis menerapkan tampilan baru ke sebagian besar komponen standar. Kontrol, *bar*, *sheet*, dan *menu* akan otomatis mengadopsi material Kaca Fluidik dan perilaku gerakan baru.

### **8.2. Langkah 2: Audit & Mitigasi Kustomisasi (Kritis)**

Risiko terbesar terletak pada kustomisasi yang ada. Audit area berikut:

* **8.2.1. Tindakan Wajib: Hapus Latar Belakang Kustom**  
  * Audit semua elemen navigasi dan kontrol (termasuk *toolbars*, *navigation bars*, *tab bars*, *sidebars*).  
  * **Risiko:** **Latar belakang kustom** (gambar, warna solid, gradien) atau efek tampilan kustom pada komponen-komponen ini **harus dihapus**. Kustomisasi tersebut akan menimpa atau berkonflik dengan material Kaca Fluidik yang baru.  
* **8.2.2. Pitfall 1: Custom Drawing (drawRect:)**  
  * **Justifikasi Teknis:** drawRect: adalah *rasterisasi* CPU/GPU ke *bitmap*. Material Kaca Fluidik *bukanlah bitmap*; ini adalah **efek shader live** yang berjalan *di atas* konten lain dalam *compositor* grafis. Anda tidak bisa "menggambar" di atasnya dengan cara yang sama. Refaktor untuk menggunakan komponen standar.  
* **8.2.3. Pitfall 2: Metrik Hard-coded**  
  * Hapus ketinggian, *padding*, atau margin yang di-hardcode pada elemen *bar* standar. Sistem baru memiliki metrik spasi yang berbeda (lebih besar) dan harus dihormati (lihat 8.4.1).  
* **8.2.4. Pitfall 3: Hierarki *View* Kustom**  
  * Berhati-hatilah jika Anda secara manual memasukkan *subview* kustom ke dalam hierarki *view* komponen sistem (misalnya, menambahkan *badge* kustom ke dalam *view* internal UITabBar). Ini rapuh dan kemungkinan akan rusak oleh pembaruan sistem.

### **8.3. Langkah 3: Desain Ulang Aset Ikon**

Ikon aplikasi kini memerlukan desain ulang fundamental untuk mendukung tampilan dinamis.

* **8.3.1. Persyaratan Baru: Ikon Berlapis (Layered)**  
  * Ikon tidak lagi "datar". Ikon harus dirancang dalam **lapisan-lapisan** terpisah (misalnya, latar belakang, tengah, latar depan).  
  * **Mengapa?** Sistem menggunakan lapisan-lapisan ini untuk menerapkan efek pencahayaan, bayangan, dan pantulan dinamis yang selaras dengan material Kaca Fluidik.  
* **8.3.2. Proses Desain & Implementasi:**  
  * Ini bukan hanya tentang mengekspor 3 file PNG.  
  * Anda harus menggunakan **alat *composer* ikon khusus** dari sistem.  
  * Di dalam alat ini, Anda mengimpor lapisan-lapisan vektor atau raster dan, yang terpenting, **mengatur atribut lapisan** (seperti *opacity*, *grouping*, dan *offset*). Sistem kemudian menggunakan metadata ini untuk merender ikon secara dinamis.

### **8.4. Langkah 4: Tinjau Layout dan Tipografi**

Sistem baru ini juga memengaruhi spasi dan tipografi.

* **8.4.1. Layout & Spasi (Whitespace):**  
  * Komponen organisasi (seperti *list*, *table*, dan *form*) kini memiliki **padding dan tinggi baris yang lebih besar** secara default.  
  * **Tindakan:** Periksa layar yang "padat" (data-dense). Terima spasi baru ini—tujuannya adalah untuk memberi "ruang bernapas" pada konten. Pastikan tidak ada pemotongan (*clipping*) atau tata letak yang rusak.  
* **8.4.2. Tipografi (Kapitalisasi):**  
  * Audit *section header* dalam *list* atau *table*.  
  * **Perubahan:** Konvensi sistem tidak lagi merendernya sebagai huruf kapital semua (all-caps) secara otomatis.  
  * **Tindakan:** Teks header harus diperbarui secara manual dalam *string* Anda ke **title-style capitalization** (Huruf Besar di Awal Setiap Kata) agar konsisten.

### **8.5. Blind Spots & Skenario Tepi (Edge Cases Wajib Uji)**

* **8.5.1. Aturan Kritis: Hindari Kaca-di-Kaca (Glass-on-Glass)**  
  * **Anti-Pola:** Jangan pernah menumpuk satu elemen Kaca Fluidik di atas elemen Kaca Fluidik lainnya (misalnya, *popover* di atas *sidebar*, atau *sheet* di atas *tab bar*).  
  * **Mengapa?** Ini menciptakan kebisingan visual (*visual noise*) yang parah, memecah hierarki kedalaman (mana yang di atas?), dan merupakan anti-pola desain fundamental dalam sistem ini.  
* **8.5.2. Kegagalan Kontras Material *Clear***  
  * Varian *Clear* dari Kaca Fluidik (4.2.5) sangat berisiko. Saat digunakan di atas konten yang "ramai" atau dinamis (misalnya, video), teks atau tombol di atasnya dapat kehilangan kontras dan gagal dalam pengujian aksesibilitas.  
  * **Mitigasi Wajib:** **Wajib** tambahkan lapisan **dimming (peredup)** tipis (misalnya, hitam 35%) di antara material *clear* dan konten media di bawahnya. Ini memberikan "lantai" kontras minimum.  
* **8.5.3. Fallback Aksesibilitas (Wajib Uji):**  
  1. **Reduce Transparency:** Pengguna dapat mengaktifkan ini. Dalam mode ini, semua material tembus pandang (Fluidik dan Standar) akan menjadi **buram (opaque)** solid.  
     * **Justifikasi Teknis:** Ini mengganti *shader* GPU yang mahal (blur/lensing) dengan *fill* buram solid. Ini secara drastis **menghemat daya GPU** dan masa pakai baterai, selain sebagai fitur aksesibilitas.  
     * **Tindakan:** **UJI SKENARIO INI.** Pastikan warna *fallback* yang buram memberikan kontras yang tepat.  
  2. **Reduce Motion:** Pengguna dapat mengaktifkan ini.  
     * **Justifikasi Teknis:** Ini mengganti kalkulasi fisika *spring* (berbasis *state*) dengan transisi *Bézier curve* (berbasis *keyframe*) yang lebih sederhana dan tetap (seperti *cross-fade*).  
     * **Tindakan:** Uji untuk memastikan transisi *fallback* ini bersih dan tidak *janky*.  
* **8.5.4. Status Jendela (Khusus Desktop OS):**  
  * Pada OS desktop, material sering berperilaku berbeda saat jendela aktif (fokus) vs. tidak aktif (di latar belakang).  
  * **Tindakan:** Uji bagaimana material dan *vibrancy* Anda beradaptasi saat jendela kehilangan fokus; mereka biasanya menjadi kurang jenuh atau sedikit lebih buram. Pastikan hierarki visual antara jendela aktif dan tidak aktif tetap jelas.

## **Kesimpulan**

Sistem desain ini mewakili pergeseran dari antarmuka datar ke antarmuka volumetrik, fluidik, dan berbasis fisika. Sukses dalam mengadopsi sistem ini bergantung pada penerimaan penuh terhadap filosofi intinya: hierarki lapisan yang ketat (fungsi di atas konten), penghormatan terhadap aksesibilitas (adaptivitas warna dan gerakan), dan kemauan untuk melepaskan kustomisasi lama demi perilaku sistem yang lebih cerdas dan adaptif.

Arsitektur perangkat lunak deklaratif (Bagian 5 & 6\) bukanlah pilihan, melainkan *prasyarat* teknis untuk mencapai desain berbasis fisika dan optik ini secara efisien.