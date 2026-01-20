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
    password_hash TEXT NOT NULL,
    password_changed_at INTEGER DEFAULT 0
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    email_pelapor TEXT,
    nama_barang TEXT,
    tanggal TEXT,
    unit TEXT,
    deskripsi TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'Pending'
  )`);

  // Ensure additional image columns exist
  try {
    const info = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info('reports')", (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
    const cols = info.map(r => r.name);
    if (!cols.includes('image_url2')) {
      await run(db, 'ALTER TABLE reports ADD COLUMN image_url2 TEXT');
    }
    if (!cols.includes('image_url3')) {
      await run(db, 'ALTER TABLE reports ADD COLUMN image_url3 TEXT');
    }
  } catch (_) {
    // ignore migration errors if columns already exist
  }

  await run(db, `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS teknisi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_changed_at INTEGER DEFAULT 0
)`);


  const existing = await get(db, 'SELECT COUNT(1) as c FROM admins');
  if (!existing || existing.c === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 12);
    await run(db, 'INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', passwordHash]);
  }

  const existingTeknisi = await get(db, 'SELECT COUNT(1) as c FROM teknisi');
   if (!existingTeknisi || existingTeknisi.c === 0) {
    const passwordHash = bcrypt.hashSync('TeknisiBaru2026!', 12);
    await run(db, 'INSERT INTO teknisi (username, password_hash) VALUES (?, ?)', ['teknisi', passwordHash]);
}


  const countReports = await get(db, 'SELECT COUNT(1) as c FROM reports');
  if (!countReports || countReports.c === 0) {
    const reports = [
      // Shared Service & General Support (SSGS)
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 1, nama: 'Shafwan Raihan', barang: 'Atap', tanggal: '01/08/24', deskripsi: 'Atap bocor di ruang rapat', status: 'Done' },
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 2, nama: 'Ahmad Subagyo', barang: 'AC', tanggal: '05/08/24', deskripsi: 'AC tidak dingin, butuh service', status: 'Done' },
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 3, nama: 'Rina Kusuma', barang: 'Kursi', tanggal: '08/08/24', deskripsi: 'Kursi kantor hilang dari ruang meeting', status: 'In Progress' },
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 4, nama: 'Budi Santoso', barang: 'Lampu', tanggal: '10/08/24', deskripsi: 'Lampu neon mati tidak menyala', status: 'In Progress' },
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 5, nama: 'Shafwan Raihan', barang: 'Pintu', tanggal: '12/08/24', deskripsi: 'Pintu ruang server susah ditutup', status: 'To-Do' },
      { unit: 'Shared Service & General Support', code: 'SSGS', num: 6, nama: 'Ahmad Subagyo', barang: 'Kabel', tanggal: '15/08/24', deskripsi: 'Kabel HDMI hilang dari ruang presentasi', status: 'To-Do' },
      
      // IT Department (ITD)
      { unit: 'IT Department', code: 'ITD', num: 1, nama: 'Rina Kusuma', barang: 'Komputer', tanggal: '02/08/24', deskripsi: 'Komputer tidak bisa booting, layar hitam', status: 'Done' },
      { unit: 'IT Department', code: 'ITD', num: 2, nama: 'Budi Santoso', barang: 'Printer', tanggal: '06/08/24', deskripsi: 'Printer paper jam terus menerus', status: 'In Progress' },
      { unit: 'IT Department', code: 'ITD', num: 3, nama: 'Shafwan Raihan', barang: 'Mouse', tanggal: '09/08/24', deskripsi: 'Mouse wireless tidak konek', status: 'In Progress' },
      { unit: 'IT Department', code: 'ITD', num: 4, nama: 'Ahmad Subagyo', barang: 'Keyboard', tanggal: '13/08/24', deskripsi: 'Keyboard mechanical hilang dari meja', status: 'To-Do' },
      { unit: 'IT Department', code: 'ITD', num: 5, nama: 'Rina Kusuma', barang: 'Monitor', tanggal: '16/08/24', deskripsi: 'Monitor bergaris, layar rusak', status: 'To-Do' },
      { unit: 'IT Department', code: 'ITD', num: 6, nama: 'Budi Santoso', barang: 'UPS', tanggal: '18/08/24', deskripsi: 'UPS bunyi beep terus, baterai drop', status: 'To-Do' },
      
      // Finance (FIN)
      { unit: 'Finance', code: 'FIN', num: 1, nama: 'Shafwan Raihan', barang: 'Meja', tanggal: '03/08/24', deskripsi: 'Meja kerja kakinya patah', status: 'Done' },
      { unit: 'Finance', code: 'FIN', num: 2, nama: 'Ahmad Subagyo', barang: 'Kursi', tanggal: '07/08/24', deskripsi: 'Kursi roda macet tidak bisa berputar', status: 'In Progress' },
      { unit: 'Finance', code: 'FIN', num: 3, nama: 'Rina Kusuma', barang: 'Kalkulator', tanggal: '11/08/24', deskripsi: 'Kalkulator mati, baterai habis', status: 'In Progress' },
      { unit: 'Finance', code: 'FIN', num: 4, nama: 'Budi Santoso', barang: 'Stapler', tanggal: '14/08/24', deskripsi: 'Stapler besar hilang dari meja kasir', status: 'To-Do' },
      { unit: 'Finance', code: 'FIN', num: 5, nama: 'Shafwan Raihan', barang: 'Lemari', tanggal: '17/08/24', deskripsi: 'Lemari arsip pintu patah', status: 'To-Do' },
      
      // HR (HRD)
      { unit: 'HR', code: 'HRD', num: 1, nama: 'Ahmad Subagyo', barang: 'AC', tanggal: '04/08/24', deskripsi: 'AC bocor menetes air', status: 'Done' },
      { unit: 'HR', code: 'HRD', num: 2, nama: 'Rina Kusuma', barang: 'Telepon', tanggal: '08/08/24', deskripsi: 'Telepon kantor suara tidak jelas', status: 'In Progress' },
      { unit: 'HR', code: 'HRD', num: 3, nama: 'Budi Santoso', barang: 'Whiteboard Marker', tanggal: '12/08/24', deskripsi: 'Marker whiteboard set lengkap hilang', status: 'To-Do' },
      { unit: 'HR', code: 'HRD', num: 4, nama: 'Shafwan Raihan', barang: 'Proyektor', tanggal: '15/08/24', deskripsi: 'Proyektor tidak fokus, gambar blur', status: 'To-Do' },
      { unit: 'HR', code: 'HRD', num: 5, nama: 'Ahmad Subagyo', barang: 'Scanner', tanggal: '19/08/24', deskripsi: 'Scanner tidak terdeteksi komputer', status: 'To-Do' }
    ];

    for (const r of reports) {
      const id = `${r.code}${r.num.toString().padStart(3, '0')}`;
      // Generate dummy image URL based on report type
      const dummyImages = [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop'
      ];
      const randomImage = dummyImages[Math.floor(Math.random() * dummyImages.length)];
      await run(db,
        'INSERT INTO reports (id, email_pelapor, nama_barang, tanggal, unit, deskripsi, image_url, status) VALUES (?,?,?,?,?,?,?,?)',
        [id, r.nama, r.barang, r.tanggal, r.unit, r.deskripsi, randomImage, r.status]
      );
    }

  }
  return db;
}

async function getAdminByUsername(username) {
  const db = openDb();
  return await get(db, 'SELECT * FROM admins WHERE username = ?', [username]);
}

async function getTeknisiByUsername(username) {
  const db = openDb();
  return await get(db, 'SELECT * FROM teknisi WHERE username = ?', [username]);
}
  

module.exports = {
  init,
  getAdminByUsername,
  getTeknisiByUsername,
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
  updateReportImages: (id, urls) => {
    const db = openDb();
    const [u1 = null, u2 = null, u3 = null] = urls || [];
    return run(db, 'UPDATE reports SET image_url = ?, image_url2 = ?, image_url3 = ? WHERE id = ?', [u1, u2, u3, id]);
  },
  // helpers for users management
  listUsers: () => {
    const db = openDb();
    return new Promise((resolve, reject) => {
      db.all('SELECT id, nama, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },
  createUser: (nama) => {
    const db = openDb();
    return run(db, 'INSERT INTO users (nama) VALUES (?)', [nama]);
  },
  deleteUser: (id) => {
    const db = openDb();
    return run(db, 'DELETE FROM users WHERE id = ?', [id]);
  }
};
