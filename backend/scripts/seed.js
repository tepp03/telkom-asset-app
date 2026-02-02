const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'app.sqlite');

async function seed() {
  const db = new sqlite3.Database(DB_PATH);

  const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve(this);
      });
    });
  };

  const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  };

  try {
    console.log('[INFO] Seeding database with dummy accounts...\n');

    // Admin
    const adminExists = await get('SELECT 1 FROM admins WHERE username = ?', ['admin']);
    if (!adminExists) {
      const hash = bcrypt.hashSync('admin123', 12);
      await run('INSERT INTO admins (username, password_hash, password_changed_at) VALUES (?, ?, ?)', 
        ['admin', hash, 0]);
      console.log('[SUCCESS] Admin created: username=admin, password=admin123');
    } else {
      console.log('[INFO] Admin already exists');
    }

    // Teknisi
    const teknisiExists = await get('SELECT 1 FROM teknisi WHERE username = ?', ['teknisi']);
    if (!teknisiExists) {
      const hash = bcrypt.hashSync('TeknisiBaru2026!', 12);
      await run('INSERT INTO teknisi (username, password_hash, password_changed_at) VALUES (?, ?, ?)', 
        ['teknisi', hash, 0]);
      console.log('[SUCCESS] Teknisi created: username=teknisi, password=TeknisiBaru2026!');
    } else {
      console.log('[INFO] Teknisi already exists');
    }

    // Pelapor accounts
    const pelapors = [
      { username: 'pelapor_bs', password: 'PelaporBS2026!', unit: 'BS (Business Service)' },
      { username: 'pelapor_lgs', password: 'PelaporLGS2026!', unit: 'LGS (Local Government Service)' },
      { username: 'pelapor_prq', password: 'PelaporPRQ2026!', unit: 'PRQ (Performance, Risk & Quality)' },
      { username: 'pelapor_ssgs', password: 'PelaporSSGS2026!', unit: 'SSGS (Shared Service General Support)' }
    ];

    for (const p of pelapors) {
      const exists = await get('SELECT 1 FROM pelapor WHERE username = ?', [p.username]);
      if (!exists) {
        const hash = bcrypt.hashSync(p.password, 12);
        await run('INSERT INTO pelapor (username, password_hash, unit, password_changed_at) VALUES (?, ?, ?, ?)', 
          [p.username, hash, p.unit, 0]);
        console.log(`[SUCCESS] Pelapor created: username=${p.username}, password=${p.password}, unit=${p.unit}`);
      } else {
        console.log(`[INFO] Pelapor ${p.username} already exists`);
      }
    }

    console.log('\n[DONE] Seeding completed successfully!');
  } catch (error) {
    console.error('[ERROR] Seeding error:', error);
  } finally {
    db.close();
  }
}

// Export fungsi agar bisa dipanggil dari file lain
module.exports = seed;

// Jika dijalankan langsung (node seed.js)
if (require.main === module) {
  seed();
}
