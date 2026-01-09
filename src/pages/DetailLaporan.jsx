import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './DetailLaporan.css';
import { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const statusMap = {
  'Pending': 'To-Do',
  'Dalam Proses': 'Processed',
  'Selesai': 'Done',
  'To-Do': 'To-Do',
  'In Progress': 'Processed',
  'Processed': 'Processed',
  'Done': 'Done'
};

const getStatusClass = (status) => {
  if (status === 'Selesai' || status === 'Done') return 'status-done';
  if (status === 'Dalam Proses' || status === 'In Progress' || status === 'Processed') return 'status-in-progress';
  return 'status-to-do';
};

const getNextStatusClass = (status) => {
  const currentMapped = statusMap[status];
  if (currentMapped === 'To-Do') return 'status-in-progress'; // Next is Processed
  if (currentMapped === 'Processed') return 'status-done'; // Next is Done
  return 'status-to-do'; // Next is To-Do (reset)
};

function DetailLaporan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', action: null });
  const [imageModal, setImageModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [allIds, setAllIds] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [similarReports, setSimilarReports] = useState([]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [report]);

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
          setAllReports(data);
          const ids = data.map(r => r.id).sort();
          setAllIds(ids);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Filter similar reports by unit
  useEffect(() => {
    if (report && allReports.length > 0) {
      const similar = allReports.filter(
        r => r.unit === report.unit && r.id !== report.id
      );
      setSimilarReports(similar);
    }
  }, [report, allReports]);

  const currentIndex = allIds.indexOf(id);
  const nextId = currentIndex >= 0 && currentIndex < allIds.length - 1 ? allIds[currentIndex + 1] : null;

  const handleStatusCycle = () => {
    if (!report) return;
    const currentMapped = statusMap[report.status];
    const statusFlow = {
      'To-Do': { next: 'Processed', db: 'Dalam Proses', msg: 'Mulai proses pengerjaan?' },
      'Processed': { next: 'Done', db: 'Selesai', msg: 'Tandai laporan sebagai selesai?' },
      'Done': { next: 'To-Do', db: 'Pending', msg: 'Reset status ke To-Do?' }
    };
    const flow = statusFlow[currentMapped];
    
    setModal({
      isOpen: true,
      title: 'Konfirmasi',
      message: flow.msg,
      action: async () => {
        try {
          const res = await fetch(`/api/reports/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: flow.db })
          });
          if (res.ok) setReport({ ...report, status: flow.db });
        } catch (e) {
          console.error(e);
        }
        setModal({ isOpen: false, title: '', message: '', action: null });
      }
    });
  };

  const baseImages = [report?.image_url, report?.image_url2, report?.image_url3].filter(Boolean);
  const imageSources = (() => {
    if (baseImages.length === 0) {
      return [
        'https://placehold.co/300x300?text=Foto+1',
        'https://placehold.co/300x300?text=Foto+2',
        'https://placehold.co/300x300?text=Foto+3'
      ];
    }
    const filled = [...baseImages];
    while (filled.length < 3) {
      const dummyImages = [
        'https://placehold.co/300x300?text=Foto+1',
        'https://placehold.co/300x300?text=Foto+2',
        'https://placehold.co/300x300?text=Foto+3'
      ];
      filled.push(dummyImages[filled.length % dummyImages.length]);
    }
    return filled.slice(0, 3);
  })();

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? imageSources.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === imageSources.length - 1 ? 0 : prev + 1));
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
        <h1 className="detail-title">Detail Laporan</h1>
        <div className="detail-wrapper">
          <div className="detail-container">
            <div className="detail-card">
              <div className="detail-header">
              <span className="detail-id">{id}</span>
              <span className={`detail-status ${getStatusClass(report?.status)}`}>
                {statusMap[report?.status] || report?.status || 'To-Do'}
              </span>
            </div>
            
            <div className="detail-content">
              <div className="detail-info">
                <div className="info-section">
                  <div className="info-row">
                    <span className="info-label">Nama Pelapor</span>
                    <span className="info-value">{report?.email_pelapor || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Lokasi Unit</span>
                    <span className="info-value">{report?.unit || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tanggal Kejadian</span>
                    <span className="info-value">{report?.tanggal || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Nama Aset</span>
                    <span className="info-value">{report?.nama_barang || '-'}</span>
                  </div>
                  <div className="info-row full-width">
                    <span className="info-label">Deskripsi</span>
                    <span className="info-value">{report?.deskripsi || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-image">
                <div className="image-slider">
                  <div
                    className="image-track"
                    style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                  >
                    {imageSources.map((src, idx) => (
                      <div className="image-slide" key={idx} onClick={() => { setActiveImageIndex(idx); setImageModal(true); }}>
                        <div className="image-wrapper">
                          <img src={src} alt={`Lampiran ${idx + 1}`} />
                          <div className="image-overlay">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="#fff">
                              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                            <span>Klik untuk memperbesar</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {imageSources.length > 1 && (
                    <>
                      <button className="slider-arrow prev" onClick={handlePrevImage} aria-label="Sebelumnya">
                        ‹
                      </button>
                      <button className="slider-arrow next" onClick={handleNextImage} aria-label="Berikutnya">
                        ›
                      </button>
                      <div className="slider-dots">
                        {imageSources.map((_, idx) => (
                          <button
                            key={idx}
                            className={`slider-dot ${idx === activeImageIndex ? 'active' : ''}`}
                            onClick={() => setActiveImageIndex(idx)}
                            aria-label={`Pilih gambar ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="detail-actions">
              <button className="btn-back" onClick={() => navigate('/laporan-aset')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
                Kembali
              </button>
              <div className="action-buttons">
                <button 
                  className={`btn-cycle ${getNextStatusClass(report?.status)}`}
                  onClick={handleStatusCycle}
                >
                  {statusMap[report?.status] === 'To-Do' && 'Mulai Progress'}
                  {statusMap[report?.status] === 'Processed' && 'Tandai Selesai'}
                  {statusMap[report?.status] === 'Done' && 'Reset Status'}
                </button>
                <button className="btn-delete" onClick={handleDelete}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  Hapus
                </button>
              </div>
              </div>
            </div>
          </div>

          <div className="similar-reports">
            <div className="similar-reports-inner">
              <h2 className="similar-reports-title">Laporan Serupa</h2>
              <div className="similar-reports-list">
                {similarReports.length > 0 ? (
                  similarReports.map((simReport) => (
                    <div 
                      key={simReport.id} 
                      className="similar-report-item"
                      onClick={() => navigate(`/laporan/${simReport.id}`)}
                    >
                      <div className="similar-report-header">
                        <span className="similar-report-id">{simReport.id}</span>
                        <span className={`similar-report-status ${getStatusClass(simReport.status)}`}>
                          {statusMap[simReport.status] || simReport.status || 'To-Do'}
                        </span>
                      </div>
                      <div className="similar-report-info">
                        <div className="similar-info-row">
                          <span className="similar-info-label">Nama Pelapor:</span>
                          <span className="similar-info-value">{simReport.email_pelapor || '-'}</span>
                        </div>
                        <div className="similar-info-row">
                          <span className="similar-info-label">Tanggal Kejadian:</span>
                          <span className="similar-info-value">{simReport.tanggal || '-'}</span>
                        </div>
                        <div className="similar-info-row">
                          <span className="similar-info-label">Nama Aset:</span>
                          <span className="similar-info-value">{simReport.nama_barang || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="similar-report-empty">
                    <p>Tidak ada laporan serupa</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {imageModal && (
        <div className="image-modal" onClick={() => setImageModal(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setImageModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
            <img src={imageSources[activeImageIndex] || 'https://via.placeholder.com/400x500.png?text=Foto'} alt="Lampiran Besar" />
            {imageSources.length > 1 && (
              <>
                <button className="image-modal-arrow prev" onClick={handlePrevImage} aria-label="Sebelumnya">
                  ‹
                </button>
                <button className="image-modal-arrow next" onClick={handleNextImage} aria-label="Berikutnya">
                  ›
                </button>
                <div className="image-modal-dots">
                  {imageSources.map((_, idx) => (
                    <button
                      key={idx}
                      className={`image-modal-dot ${idx === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`Pilih gambar ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
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
