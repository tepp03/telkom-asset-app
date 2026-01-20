const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireTeknisi } = require('../../middleware/auth');
const { listReports, getReportById, updateReportStatus, updateReportImages, deleteReport } = require('../../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage for uploads
const uploadDir = path.join(__dirname, '..', '..', 'data', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const name = `${Date.now()}_${safeName}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

const router = express.Router();

// List reports (teknisi view)
router.get('/reports', authenticateToken, requireTeknisi, async (req, res) => {
  try {
    const { search } = req.query;
    let rows = await listReports();

    if (search) {
      const term = search.toLowerCase();
      rows = rows.filter(r => {
        const id = (r.id || '').toLowerCase();
        const namaPelapor = (r.email_pelapor || '').toLowerCase();
        const namaBarang = (r.nama_barang || '').toLowerCase();
        const unit = (r.unit || '').toLowerCase();
        const deskripsi = (r.deskripsi || '').toLowerCase();
        const status = (r.status || '').toLowerCase();
        const tanggal = (r.tanggal || '').toLowerCase();

        return id.includes(term) ||
               namaPelapor.includes(term) ||
               namaBarang.includes(term) ||
               unit.includes(term) ||
               deskripsi.includes(term) ||
               status.includes(term) ||
               tanggal.includes(term);
      });
    }

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

// Get single report (teknisi view)
router.get('/reports/:id', authenticateToken, requireTeknisi, async (req, res) => {
  try {
    const row = await getReportById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Report not found' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get report' });
  }
});

// Delete report (teknisi)
router.delete('/reports/:id', authenticateToken, requireTeknisi, async (req, res) => {
  try {
    await deleteReport(req.params.id);
    res.json({ ok: true, message: 'Report deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Update report status (teknisi only)
router.put('/reports/:id/status',
  authenticateToken,
  requireTeknisi,
  [
    body('status').isIn(['To-Do', 'In Progress', 'Done']).withMessage('Invalid status value')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const { status } = req.body;
      await updateReportStatus(req.params.id, status);
      res.json({ ok: true, message: 'Status updated successfully' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
);

// Upload images for a report (teknisi only)
router.post('/reports/:id/images', authenticateToken, requireTeknisi, upload.array('images', 3), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const urls = files.map(f => `/uploads/${f.filename}`).slice(0, 3);
    await updateReportImages(req.params.id, urls);
    res.json({ ok: true, message: 'Images uploaded', urls });
  } catch (e) {
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

module.exports = router;
