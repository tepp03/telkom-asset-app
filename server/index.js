const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { 
  init, 
  getAdminByUsername, 
  getTeknisiByUsername,
  listReports, 
  getReportById, 
  deleteReport, 
  updateReportStatus,
  listUsers,
  createUser,
  deleteUser
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
    if (admin) {
      const match = bcrypt.compareSync(password, admin.password_hash);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ sub: username, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
      return res.json({ token });
    }

    const teknisi = await getTeknisiByUsername(username);
    if (teknisi) {
      const match = bcrypt.compareSync(password, teknisi.password_hash);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ sub: username, role: 'teknisi' }, JWT_SECRET, { expiresIn: '2h' });
      return res.json({ token });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
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
        const id = (r.id || '').toLowerCase();
        const namaPelapor = (r.email_pelapor || '').toLowerCase(); // now contains nama directly
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

    const users = await listUsers();

    res.json({
      totalReports,
      selesai,
      dalamProses,
      totalUsersApproved: users.length,
      verifikasiPending: 0
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

// Users Management API
app.get('/api/users', async (req, res) => {
  try {
    const rows = await listUsers();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { nama } = req.body || {};
    if (!nama) {
      return res.status(400).json({ error: 'Nama required' });
    }

    await createUser(nama);
    res.json({ ok: true, message: 'User created successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ ok: true, message: 'User deleted successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete user' });
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
