const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
}

function openDb() {
  ensureDir();
  return new sqlite3.Database(DB_PATH);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function init() {
  const db = openDb();
  await run(db, `CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    email_pelapor TEXT,
    jenis TEXT,
    nama_barang TEXT,
    tanggal TEXT,
    unit TEXT,
    deskripsi TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'Pending'
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS verifikasi_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    nama TEXT,
    no_pegawai TEXT,
    alamat_kantor TEXT,
    unit TEXT,
    status TEXT DEFAULT 'pending',
    verified_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  const existing = await get(db, 'SELECT COUNT(1) as c FROM admins');
  if (!existing || existing.c === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await run(db, 'INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', passwordHash]);
    console.log('Seeded admin user: username="admin" password="admin123"');
  }

  const countReports = await get(db, 'SELECT COUNT(1) as c FROM reports');
  if (!countReports || countReports.c === 0) {
    const reports = [
      // Shared Service & General Support (SSGS)
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 1, email: 'casishafwanraihan@gmail.com', jenis: 'Aset Rusak', barang: 'Atap', tanggal: '01/08/24', deskripsi: 'Atap bocor di ruang rapat', status: 'Selesai' },
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 2, email: 'user2@telkom.co.id', jenis: 'Aset Rusak', barang: 'AC', tanggal: '05/08/24', deskripsi: 'AC tidak dingin, butuh service', status: 'Selesai' },
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 3, email: 'admin@telkom.co.id', jenis: 'Aset Hilang', barang: 'Kursi', tanggal: '08/08/24', deskripsi: 'Kursi kantor hilang dari ruang meeting', status: 'Dalam Proses' },
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 4, email: 'staff@telkom.co.id', jenis: 'Aset Rusak', barang: 'Lampu', tanggal: '10/08/24', deskripsi: 'Lampu neon mati tidak menyala', status: 'Dalam Proses' },
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 5, email: 'casishafwanraihan@gmail.com', jenis: 'Aset Rusak', barang: 'Pintu', tanggal: '12/08/24', deskripsi: 'Pintu ruang server susah ditutup', status: 'Pending' },
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 6, email: 'user2@telkom.co.id', jenis: 'Aset Hilang', barang: 'Kabel', tanggal: '15/08/24', deskripsi: 'Kabel HDMI hilang dari ruang presentasi', status: 'Pending' },
      
      // IT Department (ITD)
      { unit: 'IT Department', code: 'ITD', num: 1, email: 'admin@telkom.co.id', jenis: 'Aset Rusak', barang: 'Komputer', tanggal: '02/08/24', deskripsi: 'Komputer tidak bisa booting, layar hitam', status: 'Selesai' },
      { unit: 'IT Department', code: 'ITD', num: 2, email: 'staff@telkom.co.id', jenis: 'Aset Rusak', barang: 'Printer', tanggal: '06/08/24', deskripsi: 'Printer paper jam terus menerus', status: 'Dalam Proses' },
      { unit: 'IT Department', code: 'ITD', num: 3, email: 'casishafwanraihan@gmail.com', jenis: 'Aset Rusak', barang: 'Mouse', tanggal: '09/08/24', deskripsi: 'Mouse wireless tidak konek', status: 'Dalam Proses' },
      { unit: 'IT Department', code: 'ITD', num: 4, email: 'user2@telkom.co.id', jenis: 'Aset Hilang', barang: 'Keyboard', tanggal: '13/08/24', deskripsi: 'Keyboard mechanical hilang dari meja', status: 'Pending' },
      { unit: 'IT Department', code: 'ITD', num: 5, email: 'admin@telkom.co.id', jenis: 'Aset Rusak', barang: 'Monitor', tanggal: '16/08/24', deskripsi: 'Monitor bergaris, layar rusak', status: 'Pending' },
      { unit: 'IT Department', code: 'ITD', num: 6, email: 'staff@telkom.co.id', jenis: 'Aset Rusak', barang: 'UPS', tanggal: '18/08/24', deskripsi: 'UPS bunyi beep terus, baterai drop', status: 'Pending' },
      
      // Finance (FIN)
      { unit: 'Finance', code: 'FIN', num: 1, email: 'casishafwanraihan@gmail.com', jenis: 'Aset Rusak', barang: 'Meja', tanggal: '03/08/24', deskripsi: 'Meja kerja kakinya patah', status: 'Selesai' },
      { unit: 'Finance', code: 'FIN', num: 2, email: 'user2@telkom.co.id', jenis: 'Aset Rusak', barang: 'Kursi', tanggal: '07/08/24', deskripsi: 'Kursi roda macet tidak bisa berputar', status: 'Dalam Proses' },
      { unit: 'Finance', code: 'FIN', num: 3, email: 'admin@telkom.co.id', jenis: 'Aset Rusak', barang: 'Kalkulator', tanggal: '11/08/24', deskripsi: 'Kalkulator mati, baterai habis', status: 'Dalam Proses' },
      { unit: 'Finance', code: 'FIN', num: 4, email: 'staff@telkom.co.id', jenis: 'Aset Hilang', barang: 'Stapler', tanggal: '14/08/24', deskripsi: 'Stapler besar hilang dari meja kasir', status: 'Pending' },
      { unit: 'Finance', code: 'FIN', num: 5, email: 'casishafwanraihan@gmail.com', jenis: 'Aset Rusak', barang: 'Lemari', tanggal: '17/08/24', deskripsi: 'Lemari arsip pintu patah', status: 'Pending' },
      
      // HR (HRD)
      { unit: 'HR', code: 'HRD', num: 1, email: 'user2@telkom.co.id', jenis: 'Aset Rusak', barang: 'AC', tanggal: '04/08/24', deskripsi: 'AC bocor menetes air', status: 'Selesai' },
      { unit: 'HR', code: 'HRD', num: 2, email: 'admin@telkom.co.id', jenis: 'Aset Rusak', barang: 'Telepon', tanggal: '08/08/24', deskripsi: 'Telepon kantor suara tidak jelas', status: 'Dalam Proses' },
      { unit: 'HR', code: 'HRD', num: 3, email: 'staff@telkom.co.id', jenis: 'Aset Hilang', barang: 'Whiteboard Marker', tanggal: '12/08/24', deskripsi: 'Marker whiteboard set lengkap hilang', status: 'Pending' },
      { unit: 'HR', code: 'HRD', num: 4, email: 'casishafwanraihan@gmail.com', jenis: 'Aset Rusak', barang: 'Proyektor', tanggal: '15/08/24', deskripsi: 'Proyektor tidak fokus, gambar blur', status: 'Pending' },
      { unit: 'HR', code: 'HRD', num: 5, email: 'user2@telkom.co.id', jenis: 'Aset Rusak', barang: 'Scanner', tanggal: '19/08/24', deskripsi: 'Scanner tidak terdeteksi komputer', status: 'Pending' }
    ];

    for (const r of reports) {
      const id = `${r.code}${r.num.toString().padStart(3, '0')}`;
      await run(db,
        'INSERT INTO reports (id, email_pelapor, jenis, nama_barang, tanggal, unit, deskripsi, image_url, status) VALUES (?,?,?,?,?,?,?,?,?)',
        [id, r.email, r.jenis, r.barang, r.tanggal, r.unit, r.deskripsi, '', r.status]
      );
    }
    console.log(`Seeded ${reports.length} sample reports with varied data`);
  }

  const countVerifikasi = await get(db, 'SELECT COUNT(1) as c FROM verifikasi_users');
  if (!countVerifikasi || countVerifikasi.c === 0) {
    const verifikasiUsers = [
      {
        email: 'tephenndrewpakpahan@gmail.com',
        nama: 'Stephen Andrew Pakpahan',
        no_pegawai: '240601231401901',
        alamat_kantor: 'Telkom Witel Jakarta Utara, 16, Jl. Yos Sudarso No.23-24, RT.16/RW.6 14320 Tanjung Priok Daerah Khusus ibukota Jakarta',
        unit: 'Shared Service & General Support'
      },
      {
        email: 'michaelsirait@gmail.com',
        nama: 'Michael Sirait',
        no_pegawai: '240601231401902',
        alamat_kantor: 'Telkom Witel Jakarta Selatan, Jl. Gatot Subroto No.52, Jakarta Selatan 12950',
        unit: 'IT Department'
      },
      {
        email: 'zakyambadar@gmail.com',
        nama: 'Zaky Ambadar',
        no_pegawai: '240601231401903',
        alamat_kantor: 'Telkom Witel Jakarta Barat, Jl. S. Parman Kav.8, Jakarta Barat 11480',
        unit: 'Finance'
      },
      {
        email: 'rifqiavaldi@gmail.com',
        nama: 'Rifqi Avaldi',
        no_pegawai: '240601231401904',
        alamat_kantor: 'Telkom Witel Jakarta Timur, Jl. Ahmad Yani, Jakarta Timur 13210',
        unit: 'HR'
      },
      {
        email: 'fauzanhadi@gmail.com',
        nama: 'Fauzan Hadi',
        no_pegawai: '240601231401905',
        alamat_kantor: 'Telkom Witel Jakarta Pusat, Jl. MH Thamrin No.10, Jakarta Pusat 10230',
        unit: 'Shared Service & General Support'
      },
      {
        email: 'elangnukmi@gmail.com',
        nama: 'Elang Nukmi',
        no_pegawai: '240601231401906',
        alamat_kantor: 'Telkom Witel Bekasi, Jl. Ir. H. Juanda No.180, Bekasi 17121',
        unit: 'IT Department'
      },
      {
        email: 'muhzakyanwar@gmail.com',
        nama: 'Muhammad Zaky Anwar',
        no_pegawai: '240601231401907',
        alamat_kantor: 'Telkom Witel Tangerang, Jl. Daan Mogot Km.11, Tangerang 15119',
        unit: 'Finance'
      }
    ];
    for (const user of verifikasiUsers) {
      await run(db,
        'INSERT INTO verifikasi_users (email, nama, no_pegawai, alamat_kantor, unit) VALUES (?,?,?,?,?)',
        [user.email, user.nama, user.no_pegawai, user.alamat_kantor, user.unit]
      );
    }
    console.log('Seeded 7 verifikasi users');
  }
  return db;
}

async function getAdminByUsername(username) {
  const db = openDb();
  return await get(db, 'SELECT * FROM admins WHERE username = ?', [username]);
}

module.exports = {
  init,
  getAdminByUsername,
  // helpers for reports
  listReports: () => {
    const db = openDb();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM reports ORDER BY id', (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },
  getReportById: (id) => {
    const db = openDb();
    return get(db, 'SELECT * FROM reports WHERE id = ?', [id]);
  },
  deleteReport: (id) => {
    const db = openDb();
    return run(db, 'DELETE FROM reports WHERE id = ?', [id]);
  },
  updateReportStatus: (id, status) => {
    const db = openDb();
    return run(db, 'UPDATE reports SET status = ? WHERE id = ?', [status, id]);
  },
  // helpers for verifikasi users
  listVerifikasiUsers: (status = 'pending') => {
    const db = openDb();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM verifikasi_users WHERE status = ? ORDER BY created_at DESC', [status], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },
  getVerifikasiUserByEmail: (email) => {
    const db = openDb();
    return get(db, 'SELECT * FROM verifikasi_users WHERE email = ?', [email]);
  },
  approveVerifikasiUser: (email) => {
    const db = openDb();
    return run(db, 'UPDATE verifikasi_users SET status = ?, verified_at = CURRENT_TIMESTAMP WHERE email = ?', ['approved', email]);
  },
  rejectVerifikasiUser: (email) => {
    const db = openDb();
    return run(db, 'UPDATE verifikasi_users SET status = ?, verified_at = CURRENT_TIMESTAMP WHERE email = ?', ['rejected', email]);
  }
};
