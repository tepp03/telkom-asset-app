const express = require('express');
const router = express.Router();
const { authenticateToken, requirePelapor } = require('../../middleware/auth');
const apiLimiter = require('../../middleware/rateLimiter').apiLimiter;

// Custom rate limiter untuk pelapor: 500 request per 15 menit
const rateLimit = require('express-rate-limit');
const pelaporLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 500, // 500 request per IP
  message: {
    error: 'Terlalu banyak permintaan, coba lagi nanti.'
  }
});

// Import Cloudinary upload
const { upload } = require('../../config/cloudinary');

const { openDb } = require('../../db');

// Mapping unit/lokasi ke kode singkat
const unitCodeMap = {
  'BS (Business Service)': 'BS',
  'LGS (Local Government Service)': 'LGS',
  'PRQ (Performance, Risk & Quality)': 'PRQ',
  'SSGS (Shared Service General Support)': 'SSGS'
};

// Fungsi untuk generate ID berdasarkan unit dengan nomor urut
async function generateReportId(unit) {
  const db = openDb();
  const code = unitCodeMap[unit] || 'LR'; // Default LR jika unit tidak dikenali
  
  // Ambil nomor urut terbesar agar tidak bentrok saat ada data yang terhapus
  const result = await new Promise((resolve, reject) => {
    const startIndex = code.length + 2; // 1-based index setelah "CODE-"
    db.get(
      'SELECT MAX(CAST(SUBSTR(id, ?) AS INTEGER)) as maxNum FROM reports WHERE id LIKE ?',
      [startIndex, `${code}-%`],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.maxNum : 0);
      }
    );
  });
  
  const nextNumber = (Number(result) || 0) + 1;
  const paddedNumber = String(nextNumber).padStart(3, '0');
  return `${code}-${paddedNumber}`;
}

// POST /api/pelapor/laporan - tambah laporan ke DB (max 3 foto)
router.post('/laporan', authenticateToken, requirePelapor, pelaporLimiter, upload.array('foto', 3), async (req, res) => {
  const { nama, tanggal, aset, deskripsi } = req.body;
  // Ambil unit dari token JWT, bukan dari form
  const unit = req.user.unit;
  
  const files = req.files || [];
  // Cloudinary returns file.path as secure URL
  const fotoUrls = files.map(f => f.path);
  // Pastikan minimal 1 foto, maksimal 3
  if (!nama || !tanggal || !aset || !deskripsi || fotoUrls.length === 0) {
    return res.status(400).json({ error: 'Semua field wajib diisi dan minimal 1 foto' });
  }
  // Siapkan 3 kolom image_url, image_url2, image_url3
  const [foto1, foto2, foto3] = [fotoUrls[0] || null, fotoUrls[1] || null, fotoUrls[2] || null];
  const db = openDb();
  try {
    const id = await generateReportId(unit);
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO reports (id, email_pelapor, nama_barang, tanggal, unit, deskripsi, image_url, image_url2, image_url3, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, nama, aset, tanggal, unit, deskripsi, foto1, foto2, foto3, 'Pending'],
        function (err) {
          if (err) return reject(err);
          resolve();
        }
      );
    });
    res.json({ success: true, laporan: { id, nama, unit, tanggal, aset, deskripsi, foto: fotoUrls, status: 'Pending' } });
  } catch (e) {
    res.status(500).json({ error: 'Gagal menyimpan laporan' });
  }
});

// GET /api/pelapor/laporan - list laporan dari DB (hanya laporan dari unit sendiri)
router.get('/laporan', authenticateToken, requirePelapor, async (req, res) => {
  const unit = req.user.unit; // Ambil unit dari token
  const db = openDb();
  db.all('SELECT * FROM reports WHERE unit = ? ORDER BY created_at ASC, id ASC', [unit], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data laporan' });
    // Map agar frontend tetap dapat field yang diharapkan
    const mapped = rows.map(r => ({
      id: r.id,
      nama: r.email_pelapor,
      unit: r.unit,
      tanggal: r.tanggal,
      aset: r.nama_barang,
      nama_barang: r.nama_barang,
      email_pelapor: r.email_pelapor,
      deskripsi: r.deskripsi,
      foto: r.image_url,
      image_url: r.image_url,
      image_url2: r.image_url2,
      image_url3: r.image_url3,
      status: r.status || 'Pending'
    }));
    res.json(mapped);
  });
});

module.exports = router;
