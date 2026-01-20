const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const { listUsers, createUser, deleteUser, listReports } = require('../../db');

const router = express.Router();

// Dashboard summary
router.get('/dashboard/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const reports = await listReports();
    const totalReports = reports.length;
    const selesai = reports.filter(r => (r.status || '').toLowerCase().trim() === 'selesai').length;
    const dalamProses = totalReports - selesai;

    const users = await listUsers();

    res.json({
      totalReports,
      selesai,
      dalamProses,
      totalUsersApproved: users.length,
      verifikasiPending: 0
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

// Users Management - Admin only
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await listUsers();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

router.post('/users',
  authenticateToken,
  requireAdmin,
  [
    body('nama').trim().isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const { nama } = req.body;
      await createUser(nama);
      res.json({ ok: true, message: 'User created successfully' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ ok: true, message: 'User deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
