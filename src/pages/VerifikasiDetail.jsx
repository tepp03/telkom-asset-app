import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import './Verifikasi.css';

function VerifikasiDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const fetchUserDetail = async () => {
    try {
      const res = await fetch(`/api/verifikasi/${encodeURIComponent(id)}`);
      if (res.ok) {
        const userData = await res.json();
        setData(userData);
      } else {
        setError('User tidak ditemukan');
      }
    } catch (e) {
      console.error(e);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleTerima = () => {
    setModalState({
      isOpen: true,
      title: 'Konfirmasi Terima',
      message: `Apakah Anda yakin ingin menerima akun ${id}?`,
      onConfirm: () => confirmTerima()
    });
  };

  const handleTolak = () => {
    setModalState({
      isOpen: true,
      title: 'Konfirmasi Tolak',
      message: `Apakah Anda yakin ingin menolak akun ${id}?`,
      onConfirm: () => confirmTolak()
    });
  };

  const confirmTerima = async () => {
    try {
      await fetch(`/api/verifikasi/${encodeURIComponent(id)}/terima`, {
        method: 'PUT'
      });
    } catch (e) {
      console.error(e);
    }
    setModalState({ ...modalState, isOpen: false });
    navigate(-1);
  };

  const confirmTolak = async () => {
    try {
      await fetch(`/api/verifikasi/${encodeURIComponent(id)}/tolak`, {
        method: 'PUT'
      });
    } catch (e) {
      console.error(e);
    }
    setModalState({ ...modalState, isOpen: false });
    navigate(-1);
  };

  const handleCancel = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  return (
    <div className="verif-page">
      <Navbar />
      <div className="verif-body">
        {loading && <div style={{textAlign:'center', padding:'40px', color:'#666'}}>Memuat data...</div>}
        {!loading && error && <div style={{textAlign:'center', padding:'40px', color:'#b00000'}}>{error}</div>}
        {!loading && !error && data && (
          <>
            <h2 className="verif-title">Detail Kredensial</h2>
            <div className="verif-detail-card">
              <div className="verif-detail-email">{data.email}</div>
              <div className="verif-detail-text">Nama : {data.nama}</div>
              <div className="verif-detail-text">No. Pegawai : {data.no_pegawai}</div>
              <div className="verif-detail-text">Alamat Kantor : {data.alamat_kantor}</div>
              <div className="verif-detail-text">Unit : {data.unit}</div>
              <div className="verif-detail-actions">
                <button className="btn-accept" onClick={handleTerima}>Terima</button>
                <button className="btn-decline" onClick={handleTolak}>Tolak</button>
              </div>
            </div>
            <button className="btn-back" onClick={() => navigate(-1)}>Kembali</button>
          </>
        )}
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

export default VerifikasiDetail;
