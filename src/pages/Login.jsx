import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import TelkomLogo from '../components/TelkomLogo';

function Login({ setAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const fillAdmin = () => {
  setUsername('admin');
  setPassword('admin123');
};

const fillTeknisi = () => {
  setUsername('teknisi');
  setPassword('teknisi123');
};


  return (
    <div className="login-page">
      {/* Top header with logo + title */}
      <header className="login-header">
        <div className="login-header-brand">
          <TelkomLogo size="small" />
          <span className="login-header-text">PT. Telkom Witel Jakarta Centrum</span>
        </div>
        <p className="login-header-address">
          Jl. Yos Sudarso No.23-24, RT.16/RW.6 14320 Tanjung Priok Daerah Khusus Ibukota Jakarta
        </p>
      </header>

      {/* Main layout */}
      <div className="login-main">
        {/* Left hero text */}
        <div className="login-hero">
          <h1 className="login-hero-title">
            LAPORAN<br />
            PENGADUAN
          </h1>
          <p className="login-hero-subtitle">
            Selamat datang di sistem laporan pengaduan PT. Telkom Witel Jakarta Centrum. Silakan masuk untuk melanjutkan.
          </p>
        </div>

        {/* Right side: login card */}
        <div className="login-panel">
          <div className="login-card">
            <h2 className="login-card-title">Login</h2>
            <form
              className="login-form"
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                setLoading(true);
                try {
                  const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data?.error || 'Login gagal');
                  }
                  localStorage.setItem('token', data.token);
                  localStorage.setItem('userName', username);
                  if (setAuth) setAuth(true);
                  navigate('/laporan-aset');
                } catch (err) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <label className="login-label" htmlFor="username">Username:</label>
              <input
                id="username"
                type="text"
                className="login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
              />

              <label className="login-label" htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
              />

              {error && <p className="login-error">{error}</p>}
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Memproses…' : 'Masuk'}
              </button>
            </form> 
          </div>
        </div>
      </div>

      {/* Footer is now global via App.jsx */}
    </div>
  );
}

export default Login;
