const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getAdminByUsername, getTeknisiByUsername } = require('../../db');
const { authenticateToken } = require('../../middleware/auth');
const { loginLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Login endpoint with strict rate limiting and validation
router.post('/login',
  loginLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET missing' });
    }
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const { username, password } = req.body;

      // Check admin first
      const admin = await getAdminByUsername(username);
      if (admin) {
        const match = await bcrypt.compare(password, admin.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        // Set session
        req.session.user = { username, role: 'admin' };

        const token = jwt.sign(
          { sub: username, role: 'admin' },
          JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRY || '2h' }
        );
        return res.json({ token, user: { username, role: 'admin' } });
      }

      // Check teknisi
      const teknisi = await getTeknisiByUsername(username);
      if (teknisi) {
        const match = await bcrypt.compare(password, teknisi.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        // Set session
        req.session.user = { username, role: 'teknisi' };

        const token = jwt.sign(
          { sub: username, role: 'teknisi' },
          JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRY || '2h' }
        );
        return res.json({ token, user: { username, role: 'teknisi' } });
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    } catch (err) {
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }
);

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
