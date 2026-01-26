const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Storage untuk upload foto laporan
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../data/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const { openDb } = require('../../db');

// Mapping unit/lokasi ke kode singkat
const unitCodeMap = {
  'Lantai 1 - Front Office': 'FO',
  'Lantai 1 - Customer Service': 'CS',
  'Lantai 2 - Ruang Rapat': 'RR',
  'Lantai 2 - Kantor Manager': 'KM',
  'Lantai 3 - IT Support': 'IT',
  'Lantai 3 - Gudang': 'GD',
  'Lantai 4 - Pantry': 'PT',
  'Lantai 4 - Ruang Meeting': 'RM',
  'Basement - Parkir': 'BP',
  'Lobby Utama': 'LB',
  'Ruang Server': 'SV',
  'Kantin': 'KT',
  'Toilet Pria': 'TP',
  'Toilet Wanita': 'TW',
  'Area Luar Gedung': 'AG'
};

// Fungsi untuk generate ID berdasarkan unit dengan nomor urut
async function generateReportId(unit) {
  const db = openDb();
  const code = unitCodeMap[unit] || 'LR'; // Default LR jika unit tidak dikenali
  
  // Hitung laporan dengan kode yang sama untuk mendapat nomor urut
  const result = await new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM reports WHERE id LIKE ?',
      [`${code}-%`],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.count : 0);
      }
    );
  });
  
  const nextNumber = result + 1;
  const paddedNumber = String(nextNumber).padStart(3, '0');
  return `${code}-${paddedNumber}`;
}

// POST /api/pelapor/laporan - tambah laporan ke DB
router.post('/laporan', upload.single('foto'), async (req, res) => {
  const { nama, unit, tanggal, aset, deskripsi } = req.body;
  // Simpan URL sesuai static route di server: '/uploads/*'
  const foto = req.file ? '/uploads/' + req.file.filename : null;
  if (!nama || !unit || !tanggal || !aset || !deskripsi || !foto) {
    return res.status(400).json({ error: 'Semua field wajib diisi' });
  }
  const db = openDb();
  try {
    const id = await generateReportId(unit);
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO reports (id, email_pelapor, nama_barang, tanggal, unit, deskripsi, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, nama, aset, tanggal, unit, deskripsi, foto, 'Pending'],
        function (err) {
          if (err) return reject(err);
          resolve();
        }
      );
    });
    res.json({ success: true, laporan: { id, nama, unit, tanggal, aset, deskripsi, foto, status: 'Pending' } });
  } catch (e) {
    res.status(500).json({ error: 'Gagal menyimpan laporan' });
  }
});

// GET /api/pelapor/laporan - list laporan dari DB
router.get('/laporan', async (req, res) => {
  const db = openDb();
  db.all('SELECT * FROM reports ORDER BY tanggal DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data laporan' });
    // Map agar frontend tetap dapat field yang diharapkan
    const mapped = rows.map(r => ({
      id: r.id,
      nama: r.email_pelapor,
      unit: r.unit,
      tanggal: r.tanggal,
      aset: r.nama_barang,
      deskripsi: r.deskripsi,
      foto: (r.image_url || '').replace(/^\/api\/uploads\//, '/uploads/'),
      status: r.status || 'Pending'
    }));
    res.json(mapped);
  });
});

module.exports = router;
