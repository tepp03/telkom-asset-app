const express = require('express');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const { listReports } = require('../../db');

const router = express.Router();

// Dashboard summary
router.get('/dashboard/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const reports = await listReports();
    const totalReports = reports.length;
    const selesai = reports.filter(r => (r.status || '').toLowerCase().trim() === 'selesai').length;
    const dalamProses = totalReports - selesai;

    res.json({
      totalReports,
      selesai,
      dalamProses,
      verifikasiPending: 0
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

module.exports = router;
