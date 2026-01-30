const jwt = require('jsonwebtoken');
const { getAdminByUsername, getTeknisiByUsername, getPelaporByUsername } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware untuk memverifikasi JWT token
 * Menambahkan user info ke req.user jika token valid
 * Check jika password sudah diganti setelah token issued (auto logout)
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Server JWT secret not configured' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Check if password was changed after token was issued
    // Token issued at (iat) vs password_changed_at
    let user;
    if (payload.role === 'admin') {
      user = await getAdminByUsername(payload.sub);
    } else if (payload.role === 'teknisi') {
      user = await getTeknisiByUsername(payload.sub);
    } else if (payload.role === 'pelapor') {
      user = await getPelaporByUsername(payload.sub);
    }
    
    if (user && user.password_changed_at) {
      // Jika password diganti setelah token di-issue, invalidate token
      if (user.password_changed_at > payload.iat) {
        return res.status(401).json({ 
          error: 'Password has been changed. Please login again.',
          reason: 'password_changed'
        });
      }
    }
    
    req.user = {
      username: payload.sub,
      role: payload.role,
      unit: payload.unit // untuk pelapor, simpan unit dari token
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please login again' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware untuk membatasi akses hanya untuk admin
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Middleware untuk membatasi akses admin atau teknisi
 */
function requireAdminOrTeknisi(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'teknisi')) {
    return res.status(403).json({ error: 'Unauthorized access' });
  }
  next();
}

/**
 * Middleware untuk membatasi akses hanya untuk teknisi
 */
function requireTeknisi(req, res, next) {
  if (!req.user || req.user.role !== 'teknisi') {
    return res.status(403).json({ error: 'Teknisi access required' });
  }
  next();
}

/**
 * Middleware untuk membatasi akses hanya untuk pelapor
 */
function requirePelapor(req, res, next) {
  if (!req.user || req.user.role !== 'pelapor') {
    return res.status(403).json({ error: 'Pelapor access required' });
  }
  next();
}

/**
 * Middleware untuk autentikasi session
 * Menggunakan informasi user yang disimpan di session
 */
function authenticateSession(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  return res.status(401).json({ error: 'Authentication required (session)' });
}

module.exports = {
  authenticateToken,
  authenticateSession,
  requireAdmin,
  requireAdminOrTeknisi,
  requireTeknisi,
  requirePelapor
};
