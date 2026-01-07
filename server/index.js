const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { 
  init, 
  getAdminByUsername, 
  listReports, 
  getReportById, 
  deleteReport, 
  updateReportStatus,
  listVerifikasiUsers,
  getVerifikasiUserByEmail,
  approveVerifikasiUser,
  rejectVerifikasiUser
} = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'very-secret-key-change-me';


app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const admin = await getAdminByUsername(username);
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const match = bcrypt.compareSync(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ sub: username, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Example protected route (optional)
app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ user: { username: payload.sub, role: payload.role } });
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Reports API
app.get('/api/reports', async (req, res) => {
  try {
    const { search } = req.query;
    let rows = await listReports();
    
    if (search) {
      const term = search.toLowerCase();
      rows = rows.filter(r => {
        const email = (r.email_pelapor || '').toLowerCase();
        const jenis = (r.jenis || '').toLowerCase();
        const status = r.status === 'Selesai' ? 'selesai' : 'diproses';
        return email.includes(term) || jenis.includes(term) || status.includes(term);
      });
    }
    
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

app.get('/api/reports/:id', async (req, res) => {
  try {
    const row = await getReportById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    await deleteReport(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

app.put('/api/reports/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'status required' });
    await updateReportStatus(req.params.id, status);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Dashboard summary API
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const reports = await listReports();
    const totalReports = reports.length;
    const selesai = reports.filter(r => (r.status || '').toLowerCase().trim() === 'selesai').length;
    // Diproses = semua laporan yang belum selesai (apapun statusnya selain 'Selesai')
    const dalamProses = totalReports - selesai;

    const approvedUsers = await listVerifikasiUsers('approved');
    const pendingVerifikasi = await listVerifikasiUsers('pending');

    res.json({
      totalReports,
      selesai,
      dalamProses,
      totalUsersApproved: approvedUsers.length,
      verifikasiPending: pendingVerifikasi.length
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

// Verifikasi API
app.get('/api/verifikasi', async (req, res) => {
  try {
    const rows = await listVerifikasiUsers('pending');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list verifikasi users' });
  }
});

app.get('/api/verifikasi/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const row = await getVerifikasiUserByEmail(email);
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

app.put('/api/verifikasi/:email/terima', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    await approveVerifikasiUser(email);
    res.json({ ok: true, message: 'User approved' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

app.put('/api/verifikasi/:email/tolak', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    await rejectVerifikasiUser(email);
    res.json({ ok: true, message: 'User rejected' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

init().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to init DB', err);
  process.exit(1);
});
