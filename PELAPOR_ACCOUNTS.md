# Pelapor (Reporter) Accounts

Database sudah di-setup dengan 4 akun pelapor sesuai unit bisnis. Setiap akun terikat ke unit spesifik dan tidak bisa mengganti unit saat membuat laporan.

## Akun Pelapor Tersedia

| Username | Password | Unit Binding |
|----------|----------|--------------|
| pelapor1 | Pelapor1@2026! | Business Service (BS) |
| pelapor2 | Pelapor2@2026! | Local Government Service (LGS) |
| pelapor3 | Pelapor3@2026! | Performance, Risk & Quality (PRQ) |
| pelapor4 | Pelapor4@2026! | Shared Service & General Support (SSGS) |

## Fitur Pelapor

- **Login**: Gunakan salah satu akun di atas dengan password yang sesuai
- **Unit Terikat**: Setiap pelapor memiliki unit yang sudah ditentukan dan tidak bisa diubah
- **Buat Laporan**: Form laporan akan auto-fill unit sesuai dengan unit binding pelapor
- **Lihat Laporan**: Lihat semua laporan yang pernah dibuat di inbox
- **Multi-foto**: Dapat upload hingga 3 foto per laporan

## Halaman Pelapor

- `/` - Login page
- `/pelapor/daftar-laporan` - Inbox/list laporan yang dibuat
- `/pelapor/buat-laporan` - Form untuk membuat laporan baru
- `/pelapor/laporan/{id}` - Detail laporan

## Catatan Teknis

- Pelapor tidak bisa mengakses laporan dari pelapor lain
- Setiap laporan tersimpan dengan `email_pelapor`, `unit`, dan `bound_unit`
- Backend melakukan validasi bahwa `unit` laporan match dengan `bound_unit` pelapor
- JWT token pelapor include `bound_unit` claim untuk validasi server-side
