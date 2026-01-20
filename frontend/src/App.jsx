import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useLayoutEffect } from 'react';
import Login from './shared/Login';
import LaporanAset from './admin/LaporanAset';
import DetailLaporan from './admin/DetailLaporan';
import TeknisiLaporanAset from './teknisi/TeknisiLaporanAset';
import TeknisiLaporanDetail from './teknisi/TeknisiLaporanDetail';
import './App.css';
import Footer from './shared/components/Footer';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);

  // Pastikan state sudah sinkron sebelum render pertama
  useLayoutEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    setIsAuthenticated(!!token);
    setUserRole(role || '');
    setLoading(false);
  }, []);

  // Sync state jika localStorage berubah (login/logout)
  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      setIsAuthenticated(!!token);
      setUserRole(role || '');
    };
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  // Prevent browser back to login page and detail pages only
  useEffect(() => {
    const handlePopState = (event) => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const currentPath = window.location.pathname;
      
      // Prevent going back to login if authenticated
      if (token && currentPath === '/login') {
        const redirectPath = role === 'teknisi' ? '/teknisi/laporan-aset' : '/laporan-aset';
        window.history.pushState(null, '', redirectPath);
        window.location.href = redirectPath;
        return;
      }
      
      // Prevent going back from detail pages
      if (currentPath.match(/\/laporan\/.+/)) {
        window.history.pushState(null, '', currentPath);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Jangan render <Routes> jika userRole belum valid saat sudah login
  if (loading || (isAuthenticated && userRole !== 'admin' && userRole !== 'teknisi')) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page: redirect sesuai role jika login */}
        <Route
          path="/"
          element={
            isAuthenticated
              ? (userRole === 'teknisi'
                  ? <Navigate to="/teknisi/laporan-aset" replace />
                  : <Navigate to="/laporan-aset" replace />)
              : <Navigate to="/login" replace />
          }
        />

        {/* Login page: redirect jika sudah login */}
        <Route
          path="/login"
          element={
            isAuthenticated
              ? (userRole === 'teknisi'
                  ? <Navigate to="/teknisi/laporan-aset" replace />
                  : <Navigate to="/laporan-aset" replace />)
              : <Login setAuth={setIsAuthenticated} setRole={setUserRole} />
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/laporan-aset"
          element={
            isAuthenticated && userRole === 'admin'
              ? <LaporanAset />
              : isAuthenticated
                ? <Navigate to={userRole === 'teknisi' ? "/teknisi/laporan-aset" : "/login"} replace />
                : <Navigate to="/login" />
          }
        />
        {/* Admin detail */}
        <Route
          path="/laporan/:id"
          element={
            isAuthenticated && userRole === 'admin'
              ? <DetailLaporan />
              : isAuthenticated
                ? <Navigate to={userRole === 'teknisi' ? "/teknisi/laporan-aset" : "/login"} replace />
                : <Navigate to="/login" />
          }
        />

        {/* Teknisi dashboard */}
        <Route
          path="/teknisi/laporan-aset"
          element={
            isAuthenticated && userRole === 'teknisi'
              ? <TeknisiLaporanAset />
              : isAuthenticated
                ? <Navigate to={userRole === 'admin' ? "/laporan-aset" : "/login"} replace />
                : <Navigate to="/login" />
          }
        />
        {/* Teknisi detail */}
        <Route
          path="/teknisi/laporan/:id"
          element={
            isAuthenticated && userRole === 'teknisi'
              ? <TeknisiLaporanDetail />
              : isAuthenticated
                ? <Navigate to={userRole === 'admin' ? "/laporan-aset" : "/login"} replace />
                : <Navigate to="/login" />
          }
        />

        {/* Fallback: 404 simple */}
        <Route
          path="*"
          element={<div style={{textAlign:'center',padding:'60px 0',color:'#b00',fontWeight:700}}>404 - Halaman tidak ditemukan</div>}
        />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
