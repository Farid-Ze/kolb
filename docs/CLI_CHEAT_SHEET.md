# Zenotika / Kolb Project - CLI Cheat Sheet

Dokumen ini berisi kumpulan perintah CLI (Command Line Interface) yang valid dan teruji untuk menjalankan, membangun, dan memelihara proyek ini. Gunakan perintah ini di terminal (PowerShell atau Bash).

## 1. Backend (Docker & Python 3.13t)

### Membangun Ulang Container (Build)
Jika ada perubahan pada `Dockerfile`, `requirements.txt`, atau struktur folder backend.

```powershell
docker build -t klsi-nogil:latest -f backend/Dockerfile.experimental backend
```

### Menjalankan Layanan (Up)
Menjalankan database dan API di background.

```powershell
docker-compose up -d
```

### Melihat Logs
Melihat output log dari container API untuk debugging.

```powershell
docker logs -f kolb-api-1
```

### Menjalankan Migrasi Database (Alembic)
**PENTING:** Perintah ini wajib dijalankan saat pertama kali setup atau setelah ada perubahan skema database.

```powershell
docker-compose run --rm api alembic upgrade head
```

### Membuat File Migrasi Baru
Jika Anda mengubah model SQLAlchemy (`backend/app/models/`), buat file migrasi baru secara otomatis.

```powershell
docker-compose run --rm api alembic revision --autogenerate -m "deskripsi perubahan"
```

### Downgrade Migrasi (Undo)
Membatalkan migrasi terakhir (mundur 1 langkah).

```powershell
docker-compose run --rm api alembic downgrade -1
```

### Menjalankan Unit Test (Pytest)
Menjalankan semua test case yang ada di folder `tests`.

```powershell
docker-compose run --rm api pytest
```

### Cek Kualitas Kode (Linting)
Menggunakan `ruff` untuk linting dan formatting check.

```powershell
docker-compose run --rm api ruff check .
```

### Cek Tipe Data (Type Checking)
Menggunakan `mypy` untuk static type checking.

```powershell
docker-compose run --rm api mypy .
```

### Masuk ke Shell Container (SSH-like)
Untuk debugging langsung di dalam container.

```powershell
docker exec -it kolb-api-1 /bin/bash
```

### Restart API Saja
Jika ingin restart backend tanpa mematikan database.

```powershell
docker-compose restart api
```

### Membersihkan Container (Down)
Mematikan dan menghapus container (data database tetap aman di volume).

```powershell
docker-compose down
```

### Verifikasi Status No-GIL (Python 3.13t)
Memastikan bahwa fitur Free-Threading (No-GIL) benar-benar aktif di dalam container.

```powershell
docker exec kolb-api-1 python3.13t -c "import sys; print(f' No-GIL Active: {not sys._is_gil_enabled()}')"
```

## 2. Frontend (Vite + React)

Pastikan Anda berada di folder `frontend`.

### Install Dependencies

```powershell
cd frontend
npm install
```

### Menjalankan Development Server

```powershell
npm run dev
```

### Build untuk Produksi

```powershell
npm run build
```

## 3. Troubleshooting Umum

### Masalah Database "Relation does not exist"
Jika error muncul saat startup API, jalankan migrasi ulang:

```powershell
docker-compose run --rm api alembic upgrade head
```

### Masalah "Duplicate Column" saat Migrasi
Jika migrasi gagal karena kolom sudah ada, edit file migrasi terkait di `backend/app/migrations/versions/` untuk menambahkan pengecekan kondisi, lalu jalankan build ulang dan migrasi lagi.

### Cek Status Container

```powershell
docker-compose ps
```

### Cek Koneksi Database
Masuk ke container database:

```powershell
docker exec -it kolb-db-1 psql -U klsi -d klsi
```
(Ketik `\dt` untuk melihat tabel, `\q` untuk keluar)

## 4. Catatan Arsitektur No-GIL (Python 3.13t)

### Filosofi Threading
Karena kita menggunakan Python 3.13t (Free-Threaded), Global Interpreter Lock (GIL) tidak lagi membatasi konkurensi CPU-bound pada thread.

- **Thread tidak lagi "jahat":** Anda tidak perlu takut menggunakan thread standar untuk tugas CPU-bound.
- **Asyncio vs Threading:** `asyncio` tetap berguna untuk I/O-bound (network/db) yang masif, tetapi untuk komputasi berat (seperti scoring psikometrik kompleks), Anda bisa menjalankannya di thread terpisah tanpa memblokir event loop utama, dan thread tersebut akan berjalan secara paralel di core CPU yang berbeda.
- **Penyederhanaan Kode:** Pola `asyncio.to_thread()` untuk membungkus fungsi sinkronus masih valid, tetapi di masa depan kita bisa mempertimbangkan arsitektur yang lebih sederhana jika bottleneck utama adalah CPU.
