const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const { listReports, getReportById, deleteReport, updateReportStatus } = require('../../db');

const router = express.Router();

// List reports
router.get('/reports', authenticateToken, requireAdmin, async (req, res) => {
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

// Get single report
router.get('/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const row = await getReportById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Report not found' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get report' });
  }
});

// Delete report
router.delete('/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await deleteReport(req.params.id);
    res.json({ ok: true, message: 'Report deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Update report status
router.put('/reports/:id/status',
  authenticateToken,
  requireAdmin,
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

module.exports = router;
