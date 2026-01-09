import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import './Verifikasi.css'; 

export default function TeknisiLaporanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalState, setModalState] = useState({ isOpen:false, title:'', message:'', onConfirm:null });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/reports/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error('Laporan tidak ditemukan');
        const json = await res.json();
        setData(json);
        setStatus(json.status || 'Pending');
      } catch (e) {
        setError(e.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const saveStatus = async () => {
    setModalState({
      isOpen: true,
      title: 'Konfirmasi Ubah Status',
      message: `Ubah status laporan ${id} menjadi "${status}"?`,
      onConfirm: async () => {
        try {
          await fetch(`/api/teknisi/reports/${encodeURIComponent(id)}/status`, {
            method: 'PUT',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ status })
          });
        } finally {
          setModalState(s => ({ ...s, isOpen:false }));
        }
      }
    });
  };

  const uploadImage = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('image', file);

    await fetch(`/api/teknisi/reports/${encodeURIComponent(id)}/image`, {
      method: 'POST',
      body: form
    });
  };

  return (
    <div className="verif-page">
      <Navbar />
      <div className="verif-body">
        {loading && <div style={{ textAlign:'center', padding:'40px', color:'#666' }}>Memuat data...</div>}
        {!loading && error && <div style={{ textAlign:'center', padding:'40px', color:'#b00000' }}>{error}</div>}

        {!loading && !error && data && (
          <>
            <h2 className="verif-title">Detail Laporan</h2>
            <div className="verif-detail-card">
              <div className="verif-detail-text">Kode: {data.id}</div>
              <div className="verif-detail-text">Pelapor: {data.email_pelapor || '-'}</div>
              <div className="verif-detail-text">Unit: {data.unit || '-'}</div>

              <div className="verif-detail-text">
                Status:
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginLeft: 10 }}>
                  <option value="Pending">Pending</option>
                  <option value="Dalam Proses">Dalam Proses</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <div className="verif-detail-text">
                Upload gambar:
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ marginLeft: 10 }} />
                <button className="btn-accept" onClick={uploadImage} style={{ marginLeft: 10 }}>Upload</button>
              </div>

              <div className="verif-detail-actions">
                <button className="btn-accept" onClick={saveStatus}>Simpan Status</button>
                <button className="btn-back" onClick={() => navigate(-1)}>Kembali</button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={() => setModalState(s => ({ ...s, isOpen:false }))}
      />
    </div>
  );
}
