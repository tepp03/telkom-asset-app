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

  await run(db, `CREATE TABLE IF NOT EXISTS pelapor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  bound_unit TEXT NOT NULL,
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

  // Seed 4 pelapor accounts
  const existingPelapor = await get(db, 'SELECT COUNT(1) as c FROM pelapor');
  if (!existingPelapor || existingPelapor.c === 0) {
    const pelaporAccounts = [
      { username: 'pelapor1', password: 'Pelapor1@2026!', bound_unit: 'BS (Business Service)' },
      { username: 'pelapor2', password: 'Pelapor2@2026!', bound_unit: 'LGS (Local Government Service)' },
      { username: 'pelapor3', password: 'Pelapor3@2026!', bound_unit: 'PRQ (Performance, Risk & Quality)' },
      { username: 'pelapor4', password: 'Pelapor4@2026!', bound_unit: 'SSGS (Shared Service General Support)' }
    ];

    for (const account of pelaporAccounts) {
      const passwordHash = bcrypt.hashSync(account.password, 12);
      await run(db, 'INSERT INTO pelapor (username, password_hash, bound_unit) VALUES (?, ?, ?)', 
        [account.username, passwordHash, account.bound_unit]);
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

async function getPelaporByUsername(username) {
  const db = openDb();
  return await get(db, 'SELECT * FROM pelapor WHERE username = ?', [username]);
}
  

module.exports = {
  init,
  openDb,
  getAdminByUsername,
  getTeknisiByUsername,
  getPelaporByUsername,
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
