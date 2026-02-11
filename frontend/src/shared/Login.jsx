// Import library
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import TelkomLogo from './components/TelkomLogo';

// API URL dari environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

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
    const [showPassword, setShowPassword] = useState(false);
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
        } else if (role === 'pelapor') {
          navigate('/pelapor/inbox', { replace: true });
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
                  e.preventDefault();
                  setError('');
                  setLoading(true);
                  try {
                    // Login via backend (admin/teknisi/pelapor)
                    const res = await fetch(`${API_URL}/api/login`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data?.error || 'Login gagal');
                    }
                    const role = data.user?.role;
                    const unit = data.user?.unit; // untuk pelapor
                    
                    if (role !== 'admin' && role !== 'teknisi' && role !== 'pelapor') {
                      throw new Error('Role tidak valid. Hubungi admin.');
                    }
                    
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userName', username);
                    localStorage.setItem('role', role);
                    
                    // Simpan unit untuk pelapor
                    if (role === 'pelapor' && unit) {
                      localStorage.setItem('unit', unit);
                    }
                    
                    if (setAuth) setAuth(true);
                    if (setRole) setRole(role);
                    
                    if (role === 'teknisi') navigate('/teknisi/laporan-aset');
                    else if (role === 'pelapor') navigate('/pelapor/inbox');
                    else navigate('/laporan-aset');
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
            >

                {/* Username */}
                <label className="login-label" htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  className="login-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                />

                {/* Password */}
                <label className="login-label" htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </button>
                </div>

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
