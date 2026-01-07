import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import './Verifikasi.css';

function Verifikasi() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchVerifikasiUsers();
  }, []);

  const fetchVerifikasiUsers = async () => {
    try {
      const res = await fetch('/api/verifikasi');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAccounts(data.map(u => u.email));
      } else {
        setError('Format data tidak valid');
      }
    } catch (e) {
      console.error(e);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleTerima = (email) => {
    setModalState({
      isOpen: true,
      title: 'Konfirmasi Terima',
      message: `Apakah Anda yakin ingin menerima akun ${email}?`,
      onConfirm: () => confirmTerima(email)
    });
  };

  const handleTolak = (email) => {
    setModalState({
      isOpen: true,
      title: 'Konfirmasi Tolak',
      message: `Apakah Anda yakin ingin menolak akun ${email}?`,
      onConfirm: () => confirmTolak(email)
    });
  };

  const confirmTerima = async (email) => {
    try {
      const res = await fetch(`/api/verifikasi/${encodeURIComponent(email)}/terima`, {
        method: 'PUT'
      });
      if (res.ok) {
        setAccounts(accounts.filter(acc => acc !== email));
      }
    } catch (e) {
      console.error(e);
    }
    setModalState({ ...modalState, isOpen: false });
  };

  const confirmTolak = async (email) => {
    try {
      const res = await fetch(`/api/verifikasi/${encodeURIComponent(email)}/tolak`, {
        method: 'PUT'
      });
      if (res.ok) {
        setAccounts(accounts.filter(acc => acc !== email));
      }
    } catch (e) {
      console.error(e);
    }
    setModalState({ ...modalState, isOpen: false });
  };

  const handleCancel = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  return (
    <div className="verif-page">
      <Navbar />
      <div className="verif-body">
        <div className="verif-card">
          {loading && <div style={{textAlign:'center', padding:'20px', color:'#666'}}>Memuat data...</div>}
          {!loading && error && <div style={{textAlign:'center', padding:'20px', color:'#b00000'}}>{error}</div>}
          {!loading && !error && accounts.length === 0 && (
            <div style={{textAlign:'center', padding:'20px', color:'#666'}}>Tidak ada data verifikasi pending.</div>
          )}
          {!loading && !error && accounts.map((email) => (
            <div key={email} className="verif-row">
              <div className="verif-email">{email}</div>
              <div className="verif-actions">
                <button className="btn-detail" onClick={() => navigate(`/verifikasi/${encodeURIComponent(email)}`)}>Detail</button>
                <button className="btn-accept" onClick={() => handleTerima(email)}>Terima</button>
                <button className="btn-decline" onClick={() => handleTolak(email)}>Tolak</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default Verifikasi;
