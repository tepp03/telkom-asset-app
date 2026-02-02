const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'app.sqlite');

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

  // Ensure additional columns exist (image_url2, image_url3, created_at)
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
    if (!cols.includes('created_at')) {
      await run(db, "ALTER TABLE reports ADD COLUMN created_at TEXT DEFAULT (datetime('now'))");
    }
  } catch (_) {
    // ignore migration errors if columns already exist
  }


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
  unit TEXT NOT NULL,
  password_changed_at INTEGER DEFAULT 0
)`);

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
  openDb,
  getAdminByUsername,
    getTeknisiByUsername,
    // helpers for reports
  listReports: () => {
    const db = openDb();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM reports ORDER BY created_at ASC, id ASC', (err, rows) => {
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
  getPelaporByUsername: (username) => {
    const db = openDb();
    return get(db, 'SELECT * FROM pelapor WHERE username = ?', [username]);
  }
};
