# Database Seeding

## Dummy Login Credentials

Credentials tidak lagi di-hardcode di `db.js`. Gunakan script seeding untuk membuat akun dummy.

### Cara Seed Database

Jalankan dari folder `backend`:

```bash
node scripts/seed.js
```

### Akun yang Dibuat

**Admin:**
- Username: `admin`
- Password: `admin123`

**Teknisi:**
- Username: `teknisi`
- Password: `TeknisiBaru2026!`

**Pelapor (4 akun):**
1. Username: `pelapor_bs`, Password: `PelaporBS2026!`, Unit: BS (Business Service)
2. Username: `pelapor_lgs`, Password: `PelaporLGS2026!`, Unit: LGS (Local Government Service)
3. Username: `pelapor_prq`, Password: `PelaporPRQ2026!`, Unit: PRQ (Performance, Risk & Quality)
4. Username: `pelapor_ssgs`, Password: `PelaporSSGS2026!`, Unit: SSGS (Shared Service General Support)

### Reset Database

Untuk reset seluruh database dan seed ulang:

```bash
# Hapus database
rm data/app.sqlite

# Inisialisasi struktur tabel
node -e "require('./db').init()"

# Seed akun dummy
node scripts/seed.js
```

### File SQL (Opsional)

Alternatif, gunakan file SQL langsung (untuk sqlite3 CLI):

```bash
sqlite3 data/app.sqlite < data/seed.sql
```

**Note:** File `seed.sql` berisi hash password yang sudah di-generate. Lebih disarankan menggunakan `node seed.js` untuk generate hash fresh.
