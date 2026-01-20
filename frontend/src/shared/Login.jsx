// Import library
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import TelkomLogo from './components/TelkomLogo';

// Komponen Login
function Login({ setAuth, setRole }) {
    // Set judul
    useEffect(() => {
      document.title = 'Login | Sistem Laporan Pengaduan';
      return () => { document.title = 'Sistem Laporan Pengaduan'; };
    }, []);

    // State form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Redirect jika sudah login
    useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
        const role = localStorage.getItem('role');
        if (role === 'teknisi') {
          navigate('/teknisi/laporan-aset', { replace: true });
        } else {
          navigate('/laporan-aset', { replace: true });
        }
      }
    }, [navigate]);

    // Render halaman
    return (
      <div className="login-page">
        {/* Header */}
        <header className="login-header">
          <div className="login-header-brand">
            <TelkomLogo size="small" />
            <span className="login-header-text">PT. Telkom Witel Jakarta Centrum</span>
          </div>
          <p className="login-header-address">
            Jl. Yos Sudarso No.23-24, RT.16/RW.6 14320 Tanjung Priok Daerah Khusus Ibukota Jakarta
          </p>
        </header>

        {/* Layout utama */}
        <div className="login-main">
          {/* Hero */}
          <div className="login-hero">
            <h1 className="login-hero-title">
              LAPORAN<br />
              PENGADUAN
            </h1>
            <p className="login-hero-subtitle">
              Selamat datang di sistem laporan pengaduan PT. Telkom Witel Jakarta Centrum. Silakan masuk untuk melanjutkan.
            </p>
          </div>

          {/* Form login */}
          <div className="login-panel">
            <div className="login-card">
              <h2 className="login-card-title">Login</h2>
              <form
              className="login-form"
                // Submit login
                onSubmit={async (e) => {
                  e.preventDefault(); // Stop reload
                  setError(''); // Reset error
                  setLoading(true); // Loading
                  try {
                    // Kirim login
                    const res = await fetch('/api/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      // Error login
                      throw new Error(data?.error || 'Login gagal');
                    }
                    // Validasi role
                    const role = data.user?.role;
                    if (role !== 'admin' && role !== 'teknisi') {
                      throw new Error('Role tidak valid. Hubungi admin.');
                    }
                    // Simpan token dan role
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userName', username);
                    localStorage.setItem('role', role);
                    if (setAuth) setAuth(true);
                    if (setRole) setRole(role);
                    // Redirect sesuai role
                    if (role === 'teknisi') navigate('/teknisi/laporan-aset');
                    else navigate('/laporan-aset');
                  } catch (err) {
                    // Tampilkan error
                    setError(err.message);
                  } finally {
                    // Selesai loading
                    setLoading(false);
                  }
                }}
            >

                {/* Username */}
                <label className="login-label" htmlFor="username">Username:</label>
                <input
                  id="username"
                  type="text"
                  className="login-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                />

                {/* Password */}
                <label className="login-label" htmlFor="password">Password:</label>
                <input
                  id="password"
                  type="password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                />

                {/* Error */}
                {error && <p className="login-error">{error}</p>}
                {/* Tombol login */}
                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? 'Memproses…' : 'Masuk'}
                </button>
              </form> 
            </div>
          </div>
        </div>

        {/* Footer global */}
      </div>
    );
}

// Export Login
export default Login;
