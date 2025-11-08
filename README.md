# KLSI 4.0 API – Implementasi Berbasis Dokumen Resmi

## 1. Tujuan
Platform ini mengeksekusi asesmen Kolb Learning Style Inventory versi 4.0 secara ketat sesuai teori dan spesifikasi psikometrik resmi: pengumpulan data ipsatif (ranking 1–4), perhitungan skor dasar (CE, RO, AC, AE), dialektika (ACCE = AC−CE; AERO = AE−RO; tambahan kombinasi klasik), klasifikasi 9 gaya (Fig. 4–5), Learning Flexibility Index (LFI = 1 − Kendall’s W; Appendix 7), serta konversi raw→percentile (Appendix 1) dengan provenance (Database vs Appendix fallback).

## 2. Rasional Akademis (Tidak Dapat Diperdebatkan)
| Dimensi | Implementasi | Sumber Dokumen |
|---------|--------------|----------------|
| Empat mode ELT | Tabel `scale_scores` (CE, RO, AC, AE) | Teori ELT Kolb 1984 (Experiencing, Reflecting, Thinking, Acting) |
| Dialektika perbedaan | `combination_scores` menyimpan ACCE, AERO, assimilation_accommodation, converging_diverging | KLSI Guide halaman formula (page 41), Figures 4–5 |
| 9 gaya belajar | Window numerik `learning_style_types` (ACCE & AERO band: Low/Mid/High) | Refinement KLSI 4.0 (Eickmann, Kolb & Kolb 2004) |
| Fleksibilitas belajar | Kendall’s W → LFI = 1 − W | Chapter 6 + Appendix 7 |
| Konversi percentiles | Preferensi DB (`normative_conversion_table`) → fallback `app/data/norms.py` | Appendix 1, Appendix 7 |
| Provenance norma | Kolom `norm_group_used` (Database vs AppendixFallback) | Standar transparansi AERA/APA/NCME |
| Auditabilitas | Tabel `audit_log` (hash payload finalisasi & impor norma) | Standards for Educational & Psychological Testing (1999) |
| Ipsative integrity | Constraint UNIQUE + CHECK di `user_responses` | Format KLSI forced-choice |
| HCI proses bukan hasil | Laporan menunda interpretasi sampai finalisasi | Proposisi ELT #1 (learning as process) |

Semua formula, cutpoint, dan transformasi dipecah menjadi tahap tersendiri untuk memfasilitasi studi reliabilitas (test–retest, konsistensi internal difference score) dan validitas eksternal (demografi Appendix 2–5 dapat ditambah melalui subgroup norms).

## 3. Arsitektur Data
Dokumentasi lengkap ada di `docs/02-relational-model.md` dan `docs/psychometrics_spec.md`. Setiap tingkat transformasi: Responses → Mode → Dialektika → Style → Percentiles → LFI direkam. Ini memenuhi prinsip reproducibility dan memungkinkan verifikasi ulang algoritmik vs stored snapshot.

## 4. Alur Pengguna
1. Registrasi (role otomatis: MAHASISWA jika domain cocok; else MEDIATOR).
2. Start session (JWT, audit jejak).
3. Isi 12 item gaya (ranking 1–4 unik per item).
4. Isi 8 konteks LFI (ranking 1–4 per konteks; variasi preferensi).
5. Finalisasi → hitung raw, dialektika, gaya utama & cadangan, LFI, percentiles, audit hash.
6. Ambil report JSON (kite + dialectic + provenance norma + intensitas gaya + fleksibilitas).

## 5. Komponen Kode
| File | Fungsi Utama |
|------|--------------|
| `app/models/klsi.py` | Definisi skema ORM terpisah per tahap transformasi |
| `app/services/scoring.py` | Pipeline finalisasi, klasifikasi gaya, LFI, provenance norma |
| `app/data/norms.py` | Fallback Appendix 1 & 7 percentile dictionaries |
| `app/services/report.py` | Kompilasi laporan (kite, backup, sumber norma) |
| `app/routers/admin.py` | Import norma dengan validasi monotonic, idempotent upsert, audit |
| `app/routers/sessions.py` | Operasi sesi terproteksi JWT (RBAC & audit) |
| `docs/psychometrics_spec.md` | Kontrak matematis resmi |
| `docs/hci_model.md` | Model mental & HCI berlandaskan ELT |

## 5.1 Konvensi Label Subgroup Norms (Appendix 2–5)
Gunakan label berikut saat impor CSV ke `normative_conversion_table` (kolom `norm_group`):

- Education Level: `EDU:<label Appendix>` (contoh: `EDU:University Degree`, `EDU:Master's Degree`)
- Age band: `AGE:<band Appendix>` (contoh: `AGE:19-24`, `AGE:35-44`)
- Gender: `GENDER:<Male|Female|Other|Prefer not to say>`
- Global: `Total`

Pipeline akan mencoba EDU → AGE → GENDER → Total sebelum fallback Appendix lokal. Sumber yang dipakai dicatat di `percentile_scores.norm_group_used`.

## 6. HCI Ringkas (Lihat `docs/hci_model.md`)
- Format forced-choice menjaga dialektika preferensi (experience vs conceptualization; action vs reflection).
- Progress bar & keterlambatan hasil mencegah shaping jawaban (mengurangi bias adaptasi).
- Visualisasi: kite chart + overlay ACCE/AERO + intensitas + kategori fleksibilitas.
- Provenance norma jelas agar interpretasi percentile kontekstual.

## 7. Keamanan & Audit
- JWT HS256; sub → user id; domain mahasiswa diverifikasi terhadap `allowed_student_domain`.
- RBAC: Import norma dibatasi MEDIATOR; sesi hanya owner.
- Audit hash (SHA-256) finalisasi & import untuk integritas sumber.

## 8. Validasi & Tes
Tes unit (pytest) mencakup:
- Kendall’s W ekstrem (identik vs terdispersi) → LFI batas.
- Boundary ACCE (5/6, 14/15) & AERO (0/1, 11/12) → transisi gaya.
- Fallback percentile (raw di bawah/atas range & key hilang) → nearest-lower konservatif.
Rencana lanjutan: uji deterministik backup style jarak L1 & reliabilitas test–retest.

## 8.1 Dokumentasi Tambahan
- `docs/03-klsi-overview.md` — Ringkasan tujuan, sejarah versi (LSI 1→KLSI 4.0), penambahan kunci 4.0 (9 gaya, fleksibilitas, laporan interpretatif, psikometrik), dan etika penggunaan.
- `docs/05-learning-styles-theory.md` — Teori gaya belajar ELT (9 gaya), dialektika dan indeks kombinasi (ACCE, AERO, Assim−Acc, Conv‑Div) beserta metrik keseimbangan (BALANCE_ACCE, BALANCE_AERO).
- `docs/06-enhanced-lfi-analytics.md` — Analitik fleksibilitas (profil konteks, heatmap, prediksi perkembangan integratif) untuk MEDIATOR.
- `docs/04-learning-space.md` — Dimensi ruang belajar ELT (fisik, kultural, institusional, sosial, psikologis) dan prinsip desain ruang yang mendukung siklus pengalaman.
- `docs/07-learning-spiral-development.md` — Spiral belajar & perkembangan dewasa (akuisisi–spesialisasi–integrasi), level deep learning, dan heuristik klasifikasi di laporan.
- `docs/08-learning-flexibility-deliberate-practice.md` — Fleksibilitas belajar, identitas belajar, mindfulness, dan deliberate practice + cara sistem memberi rekomendasi meta-learning.
- `docs/09-educator-roles.md` — Peran pendidik (Facilitator/Expert/Evaluator/Coach) & pola sequencing untuk mengajar mengelilingi siklus belajar.

## 9. Ekstensi Akademis (Roadmap)
| Rencana | Rasional |
|---------|---------|
| Subgroup norms (Age/Gender/Education) | Mengaktifkan analisis invariance sesuai Appendix 2–5 |
| Statistik reliabilitas (Cronbach α difference pattern) | Mendukung bukti internal consistency (Chapter 4) |
| Analisis validitas eksternal (korelasi LFI vs intensitas gaya) | Memetakan adaptasi fleksibilitas terhadap diferensiasi |
| PDF bilingual report (EN/ID) | Aksesibilitas & diseminasi hasil |
| Z-score & effect size modul | Dukungan riset lanjut per band demografis |

## 10. Menjalankan Secara Lokal
```powershell
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Swagger: http://localhost:8000/docs

## 11. Docker
```powershell
docker compose up --build
```

## 12. Seed Awal (Jika Belum Otomatis)
```python
from app.db.database import SessionLocal, Base, engine
from app.services.seeds import seed_learning_styles, seed_assessment_items
Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    seed_learning_styles(db)
    seed_assessment_items(db)
```

## 13. Referensi
- Kolb, D. A. (1984). Experiential Learning.
- Kolb, A. Y., & Kolb, D. A. (2013). KLSI 4.0 Guide (Appendix 1, 7; Figures 4–5).
- AERA/APA/NCME (1999). Standards for Educational and Psychological Testing.
- Kendall, M. G. (1948). Rank Correlation Methods.

## 14. Sumber Akademis & Keterbukaan
Implementasi ini didasarkan pada publikasi ilmiah open-source "The Kolb Learning Style Inventory 4.0 - Guide to Theory, Psychometrics, Research & Applications" oleh Alice Y. Kolb & David A. Kolb (2013), yang tersedia secara publik untuk tujuan penelitian dan pendidikan.

Dokumen sumber tersedia di: https://www.researchgate.net/publication/303446688

Semua konten KLSI 4.0, formula, dan spesifikasi psikometrik diambil langsung dari karya akademis yang dipublikasikan ini, memastikan kesetiaan penuh terhadap penelitian asli.

## 15. Pernyataan Epistemik
Semua keputusan implementasi merujuk langsung pada sumber primer; tidak ada interpolasi percentile kecuali strategi konservatif nearest-lower saat data hilang (ditandai sebagai fallback). Provenance norma dicatat guna menghindari kesalahan inferensi statistik.

---
Status pengembangan lanjutan fokus pada penambahan subgroup norms dan analisis reliabilitas lanjutan. Silakan lihat dokumen spesifikasi di folder `docs/` untuk penelusuran penuh.
