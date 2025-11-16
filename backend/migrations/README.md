# Migrasi Skema
Gunakan Alembic untuk mengelola versi skema. File `versions/0001_initial.py` memuat pembuatan tabel, constraint unik, view, dan indeks parsial.

Perintah dasar:
- Inisialisasi (sudah ada requirements): `alembic init migrations` (tidak perlu jika folder sudah terstruktur manual).
- Upgrade: `alembic upgrade head`
- Downgrade: `alembic downgrade -1`
