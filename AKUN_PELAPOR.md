# Akun Pelapor - Sistem Laporan Pengaduan Telkom

## 4 Akun Pelapor dengan Unit Tetap

Setiap pelapor login dengan username dan password, dan unit mereka **sudah ditentukan secara otomatis** sesuai akun. Dropdown unit akan muncul tapi **disabled** (tidak bisa diubah).

### Akun 1: Business Service (BS)
- **Username:** `bs`
- **Password:** `Pelapor@26!`
- **Unit:** BS (Business Service)
- **Kode ID Laporan:** BS-001, BS-002, dst.

### Akun 2: Local Government Service (LGS)
- **Username:** `lgs`
- **Password:** `Pelapor@26!`
- **Unit:** LGS (Local Government Service)
- **Kode ID Laporan:** LGS-001, LGS-002, dst.

### Akun 3: Performance, Risk & Quality (PRQ)
- **Username:** `prq`
- **Password:** `Pelapor@26!`
- **Unit:** PRQ (Performance, Risk & Quality)
- **Kode ID Laporan:** PRQ-001, PRQ-002, dst.

### Akun 4: Shared Service General Support (SSGS)
- **Username:** `ssgs`
- **Password:** `Pelapor@26!`
- **Unit:** SSGS (Shared Service General Support)
- **Kode ID Laporan:** SSGS-001, SSGS-002, dst.

## Cara Login

1. Buka halaman login: http://localhost:5173/login
2. Masukkan username dan password sesuai unit Anda
3. Setelah login, Anda akan diarahkan ke halaman form laporan
4. Unit Anda akan **otomatis terisi** dan **tidak bisa diubah** (dropdown disabled)
5. Setiap pelapor **hanya bisa melihat laporan dari unit mereka sendiri**

## Fitur Pelapor

- ✅ Login dengan JWT authentication
- ✅ Unit otomatis sesuai akun (tidak bisa diubah)
- ✅ Buat laporan pengaduan dengan upload 1-3 foto
- ✅ Lihat daftar laporan (hanya dari unit sendiri)
- ✅ Lihat detail laporan
- ✅ Chat admin via WhatsApp
- ✅ ID laporan otomatis dengan kode unit (contoh: BS-001, LGS-002)

## Akun Admin & Teknisi

### Admin
- **Username:** `admin`
- **Password:** `admin123`
- **Akses:** Kelola semua laporan dari semua unit

### Teknisi
- **Username:** `teknisi`
- **Password:** `TeknisiBaru2026!`
- **Akses:** Lihat dan update status laporan

## Catatan Keamanan

⚠️ **PENTING:** Untuk production, segera ganti semua password default di atas!

## Technical Details

- **Backend:** Express.js + SQLite
- **Auth:** JWT (2 jam expiry)
- **Database Table:** `pelapor` (username, password_hash, unit, password_changed_at)
- **Unit dari Token:** Unit disimpan di JWT token dan tidak bisa diubah tanpa re-login
- **Middleware:** `requirePelapor` untuk validasi akses
