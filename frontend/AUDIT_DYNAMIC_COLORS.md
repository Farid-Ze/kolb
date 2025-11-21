# Audit Logika Warna Dinamis & Tema Kaca (Glass Theme)

## Ringkasan
Aplikasi saat ini memiliki infrastruktur untuk tema dinamis (Light/Dark mode) melalui `UIPreferencesContext` dan `globals.css`, namun implementasi komponen UI utama (`PageShell`, `Typography`, `GlassMaterial`) memaksakan tampilan "Dark Mode" secara hardcoded. Hal ini menyebabkan inkonsistensi dan potensi masalah keterbacaan jika pengguna memilih "Light Mode".

## Temuan Utama

### 1. PageShell Memaksakan Dark Mode
Komponen `PageShell` (`frontend/src/core/design-system/Layout.tsx`) menggunakan kelas hardcoded yang mengabaikan preferensi tema sistem:
```tsx
// Current
className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white ..."
```
Ini menyebabkan latar belakang selalu gelap dan teks selalu putih, bahkan saat `html` tidak memiliki class `dark`.

### 2. Typography Tidak Responsif
Komponen tipografi (`DisplayTitle`, `SectionTitle`, `BodyText`) menggunakan warna statis:
```tsx
// Current
default: 'text-white',
muted: 'text-white/80',
```
Jika background diubah menjadi terang (Light Mode yang benar), teks ini akan menjadi tidak terbaca (Putih di atas Putih).

### 3. GlassMaterial Tidak Terlihat pada Light Mode
Logika `GlassMaterial` saat ini:
```tsx
// Current
low: 'backdrop-blur-sm bg-white/5 dark:bg-black/5 border-white/5',
```
- **Dark Mode**: `bg-black/5` di atas `slate-900` = Terbaca (Subtle tint).
- **Light Mode (Hipotesis)**: `bg-white/5` di atas `white` (atau `slate-100`) = Hampir tidak terlihat. Border `border-white/5` juga tidak akan terlihat.

## Rekomendasi Perbaikan

### 1. Perbarui PageShell
Gunakan variabel CSS atau utility classes yang responsif terhadap dark mode.
```tsx
// Recommended
className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-foreground ..."
```

### 2. Perbarui Typography
Gunakan semantic colors dari `globals.css` atau utility `dark:` variant.
```tsx
// Recommended
default: 'text-slate-900 dark:text-white', // atau text-foreground
muted: 'text-slate-600 dark:text-slate-300', // atau text-muted-foreground
```

### 3. Perbarui GlassMaterial
Sesuaikan opacity dan warna untuk Light Mode agar efek kaca tetap terlihat dan memiliki kontras yang cukup.
```tsx
// Recommended
low: 'backdrop-blur-sm bg-white/60 dark:bg-black/20 border-black/5 dark:border-white/10',
```
- **Light Mode**: Menggunakan `bg-white/60` (frosted) dengan `border-black/5` untuk definisi batas yang halus.
- **Dark Mode**: Menggunakan `bg-black/20` dengan `border-white/10`.

## Rencana Implementasi
1.  Refactor `PageShell` untuk mendukung dynamic background.
2.  Refactor `Typography` untuk mendukung dynamic text colors.
3.  Refactor `GlassMaterial` untuk visibilitas yang lebih baik di Light Mode.
