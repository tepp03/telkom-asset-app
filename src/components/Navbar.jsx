import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useState } from 'react';
import ConfirmModal from './ConfirmModal';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isLaporan = location.pathname.startsWith('/laporan-aset') || location.pathname.startsWith('/laporan/');
  const isVerif = location.pathname.startsWith('/verifikasi');

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/verifikasi" className={`nav-item ${isVerif ? 'active' : ''}`}>Verifikasi</Link>
        <Link to="/dashboard" className={`nav-item ${isDashboard ? 'active' : ''}`}>Dashboard</Link>
        <Link to="/laporan-aset" className={`nav-item ${isLaporan ? 'active' : ''}`}>Laporan Aset</Link>
      </div>
      <div className="navbar-right">
        <button onClick={handleLogout} className="logout-link">Logout</button>
        <span className="admin-pill">
          <span className="profile-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-4.41 0-8 1.79-8 4v2h16v-2c0-2.21-3.59-4-8-4z"/>
            </svg>
          </span>
          <span className="admin-name">Admin 1</span>
        </span>
      </div>
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Logout"
        message="Yakin ingin keluar dari sistem?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </nav>
  );
}

export default Navbar;
