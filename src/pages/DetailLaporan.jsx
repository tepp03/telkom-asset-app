import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './DetailLaporan.css';
import { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

function DetailLaporan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', action: null });
  const [allIds, setAllIds] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/reports/${id}`);
        const data = await res.json();
        setReport(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]);

  // Fetch list of all report IDs to enable "Berikutnya" navigation
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/reports');
        const data = await res.json();
        if (Array.isArray(data)) {
          const ids = data.map(r => r.id).sort();
          setAllIds(ids);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const currentIndex = allIds.indexOf(id);
  const nextId = currentIndex >= 0 && currentIndex < allIds.length - 1 ? allIds[currentIndex + 1] : null;

  const handleToggleComplete = () => {
    if (!report) return;
    const next = report.status === 'Selesai' ? 'Pending' : 'Selesai';
    setModal({
      isOpen: true,
      title: 'Konfirmasi',
      message: report.status === 'Selesai' ? 'Batalkan status selesai?' : 'Tandai laporan sebagai selesai?',
      action: async () => {
        try {
          const res = await fetch(`/api/reports/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: next })
          });
          if (res.ok) setReport({ ...report, status: next });
        } catch (e) {
          console.error(e);
        }
        setModal({ isOpen: false, title: '', message: '', action: null });
      }
    });
  };

  const handleDelete = () => {
    setModal({
      isOpen: true,
      title: 'Hapus Laporan',
      message: 'Yakin ingin menghapus laporan ini? Data tidak dapat dikembalikan.',
      action: async () => {
        try {
          const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
          if (res.ok) navigate('/laporan-aset');
        } catch (e) {
          console.error(e);
        }
        setModal({ isOpen: false, title: '', message: '', action: null });
      }
    });
  };

  return (
    <div className="detail-page">
      <Navbar />
      <div className="detail-main">
        <h1 className="detail-title">Detail Laporan {id}</h1>
        <div className="detail-layout">
          <div className="detail-left">
            <div className="detail-line"><b>Email Pelapor :</b> {report?.email_pelapor}</div>
            <div className="detail-line"><b>Jenis Pengaduan :</b> {report?.jenis}</div>
            <div className="detail-line"><b>Nama barang :</b> {report?.nama_barang}</div>
            <div className="detail-line"><b>Tanggal Kejadian :</b> {report?.tanggal}</div>
            <div className="detail-line"><b>Unit :</b> {report?.unit}</div>
            <div className="detail-line"><b>Deskripsi :</b> {report?.deskripsi}</div>

            <div className="detail-actions">
              <button
                className="btn-accept"
                onClick={handleToggleComplete}
              >
                {report?.status === 'Selesai' ? 'Batal' : 'Selesai'}
              </button>
              <button className="btn-decline" onClick={handleDelete}>Hapus</button>
            </div>
          </div>
          <div className="detail-right">
            <div className="detail-photo-frame">
              <img src={report?.image_url || 'https://via.placeholder.com/520x620.png?text=Foto'} alt="Lampiran" />
            </div>
          </div>
        </div>
        <button className="btn-back" onClick={() => navigate(-1)}>← Kembali</button>
        {nextId && (
          <button className="btn-next" onClick={() => navigate(`/laporan/${nextId}`)}>
            Berikutnya →
          </button>
        )}
      </div>
      <ConfirmModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.action}
        onCancel={() => setModal({ isOpen: false, title: '', message: '', action: null })}
      />
    </div>
  );
}

export default DetailLaporan;
