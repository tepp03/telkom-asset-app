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


const { v4: uuidv4 } = require('uuid');
const { openDb } = require('../../db');

// POST /api/pelapor/laporan - tambah laporan ke DB
router.post('/laporan', upload.single('foto'), async (req, res) => {
  const { nama, unit, tanggal, aset, deskripsi } = req.body;
  const foto = req.file ? '/api/uploads/' + req.file.filename : null;
  if (!nama || !unit || !tanggal || !aset || !deskripsi || !foto) {
    return res.status(400).json({ error: 'Semua field wajib diisi' });
  }
  const db = openDb();
  const id = uuidv4();
  try {
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
      foto: r.image_url,
      status: r.status || 'Pending'
    }));
    res.json(mapped);
  });
});

module.exports = router;
