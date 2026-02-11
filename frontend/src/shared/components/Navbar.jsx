import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useState, useEffect, useRef } from 'react';
import ConfirmModal from './ConfirmModal';
import logoTelkom from '../assets/telkom-logo2.png';

// API URL dari environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';


function Navbar({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange }) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    if (!showStatusDropdown) return;
    const handleClick = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showStatusDropdown]);
  const navigate = useNavigate();
  const location = useLocation();
  const [roleLabel, setRoleLabel] = useState('Admin 1');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    // Deteksi role dari localStorage atau path
    const role = localStorage.getItem('role');
    if (role === 'pelapor') {
      // Ambil unit dari localStorage dan ambil singkatan/username
      const unit = localStorage.getItem('unit');
      const username = localStorage.getItem('userName');
      // Jika unit ada, ambil singkatan (contoh: "BS (Business Service)" → "BS")
      if (unit) {
        const abbrev = unit.split(' ')[0]; // Ambil bagian pertama
        setRoleLabel(abbrev);
      } else {
        setRoleLabel(username?.toUpperCase() || 'Pelapor');
      }
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const role = data?.user?.role;
        setRoleLabel(role === 'teknisi' ? 'Teknisi' : 'Admin 1');
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  
  const confirmLogout = () => {
    // Hapus semua data dari localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('role');
    
    // Hard redirect ke login dengan reload
    window.location.href = '/login';
  };

  // Tampilkan search/filter juga untuk pelapor/daftar-laporan
  const showSearch = location.pathname.startsWith('/laporan-aset') || location.pathname.startsWith('/teknisi/laporan-aset') || location.pathname.startsWith('/pelapor/daftar-laporan');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showProfileMenu]);

  return (
    <nav className="navbar">
      <div className="navbar-header-row">
        <div className="navbar-left">
          <div className="navbar-brand">
            <img src={logoTelkom} alt="Telkom Logo" className="navbar-logo" />
            <div className="navbar-brand-text">
              <div className="navbar-brand-title">PT.Telkom</div>
              <div className="navbar-brand-subtitle">Witel Jakarta Centrum</div>
            </div>
          </div>
        </div>
        
        <div className="navbar-right">
          <div className="admin-info">
            <span className="admin-label">{roleLabel}</span>
            <div className="profile-dropdown" ref={profileDropdownRef}>
              <button 
                className="admin-pill" 
                aria-label="Buka profil"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <span className="profile-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-4.41 0-8 1.79-8 4v2h16v-2c0-2.21-3.59-4-8-4z"/>
                  </svg>
                </span>
              </button>
              {showProfileMenu && (
                <div className="profile-menu profile-menu-compact">
                  <button 
                    className="menu-item logout-item"
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                  >
                    <span className="logout-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                      </svg>
                    </span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showSearch && (
        <div className="navbar-search-filter-row">
          <div className="navbar-search">
            <input 
              className="navbar-searchbar-input"
              type="text" 
              placeholder="Cari berdasarkan Pelapor, Lokasi, Tanggal, Aset, Deskripsi" 
              value={searchTerm || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              autoFocus={window.location.pathname.startsWith('/pelapor/daftar-laporan')}
            />
            <span className="search-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </span>
          </div>
          <div className="navbar-status-filter-group-outside" ref={statusDropdownRef}>
            <button
              className="navbar-status-filter-btn-outside"
              aria-label="Filter Status"
              onClick={() => setShowStatusDropdown((v) => !v)}
              type="button"
            >
              Filter <span className="navbar-status-filter-caret">▼</span>
            </button>
            {showStatusDropdown && (
              <div className="navbar-status-filter-dropdown navbar-status-filter-dropdown-outside">
                <div
                  className={`navbar-status-filter-item${statusFilter === '' ? ' selected' : ''}`}
                  onClick={() => { onStatusFilterChange && onStatusFilterChange(''); setShowStatusDropdown(false); }}
                >Semua</div>
                <div
                  className={`navbar-status-filter-item${statusFilter === 'To-Do' ? ' selected' : ''}`}
                  onClick={() => { onStatusFilterChange && onStatusFilterChange('To-Do'); setShowStatusDropdown(false); }}
                >To-Do</div>
                <div
                  className={`navbar-status-filter-item${statusFilter === 'Processed' ? ' selected' : ''}`}
                  onClick={() => { onStatusFilterChange && onStatusFilterChange('Processed'); setShowStatusDropdown(false); }}
                >Processed</div>
                <div
                  className={`navbar-status-filter-item${statusFilter === 'Done' ? ' selected' : ''}`}
                  onClick={() => { onStatusFilterChange && onStatusFilterChange('Done'); setShowStatusDropdown(false); }}
                >Done</div>
              </div>
            )}
          </div>
        </div>
      )}
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
