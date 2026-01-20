import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../shared/components/Navbar';
import ConfirmModal from '../shared/components/ConfirmModal';
import './TeknisiLaporanDetail.css';

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
  if (currentMapped === 'To-Do') return 'status-in-progress';
  if (currentMapped === 'Processed') return 'status-done';
  return 'status-to-do';
};

export default function TeknisiLaporanDetail() {
    // Blokir tombol back browser agar tidak bisa kembali ke halaman sebelumnya
    useEffect(() => {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = (e) => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }, []);
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [allReports, setAllReports] = useState([]);
  const [similarReports, setSimilarReports] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', action: null });
  const [imageModal, setImageModal] = useState(false);

  // Set judul tab browser sesuai format
  useEffect(() => {
    if (report && report.nama_barang && id) {
      document.title = `Detail Laporan: ${report.nama_barang} (${id}) | Teknisi`;
    } else {
      document.title = 'Detail Laporan | Teknisi';
    }
    return () => { document.title = 'Aplikasi Pengaduan Aset'; };
  }, [report, id]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const res = await fetch(`/api/teknisi/reports/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          localStorage.clear();
          navigate('/login');
          return;
        }
        if (!res.ok) {
          setError('Gagal memuat detail laporan');
          return;
        }
        const data = await res.json();
        setReport(data);
      } catch (_) {
        setError('Gagal memuat detail laporan');
      }
    })();
  }, [id, navigate]);

  // Fetch list for similar cards
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/teknisi/reports', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) {
          localStorage.clear();
          navigate('/login');
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setAllReports(data);
      } catch (_) {
        // ignore list errors here
      }
    })();
  }, [id, navigate]);

  useEffect(() => {
    if (report && allReports.length > 0) {
      const similar = allReports.filter(r => r.unit === report.unit && r.id !== report.id);
      setSimilarReports(similar);
    }
  }, [report, allReports]);

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
      const dummy = ['https://placehold.co/300x300?text=Foto+1','https://placehold.co/300x300?text=Foto+2','https://placehold.co/300x300?text=Foto+3'];
      filled.push(dummy[filled.length % dummy.length]);
    }
    return filled.slice(0,3);
  })();

  const handleFileChange = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setError('');
    setFiles(selectedFiles);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const form = new FormData();
      Array.from(selectedFiles).slice(0,3).forEach(f => form.append('images', f));
      setUploading(true);
      const res = await fetch(`/api/teknisi/reports/${id}/images`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      setUploading(false);
      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      if (!res.ok) {
        const t = await res.text();
        setError(`Gagal mengunggah gambar (${res.status}). ${t}`);
        return;
      }
      const data = await res.json();
      const [u1, u2, u3] = data.urls || [];
      setReport({ ...report, image_url: u1 || report?.image_url, image_url2: u2 || report?.image_url2, image_url3: u3 || report?.image_url3 });
      
      // Reset input file
      e.target.value = '';
    } catch (_) {
      setUploading(false);
      setError('Terjadi kesalahan saat upload');
    }
  };

  const handleStatusCycle = () => {
    if (!report) return;
    const currentMapped = statusMap[report.status];
    const statusFlow = {
      'To-Do': { next: 'Processed', db: 'In Progress', msg: 'Mulai Progress?' },
      'Processed': { next: 'Done', db: 'Done', msg: 'Tandai selesai?' },
      'Done': { next: 'To-Do', db: 'To-Do', msg: 'Reset status ke To-Do?' }
    };
    const flow = statusFlow[currentMapped] || statusFlow['To-Do'];
    setModal({
      isOpen: true,
      title: 'Konfirmasi',
      message: flow.msg,
      action: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/login');
            return;
          }
          const res = await fetch(`/api/teknisi/reports/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: flow.db })
          });
          if (res.status === 401) {
            localStorage.clear();
            navigate('/login');
            return;
          }
          if (!res.ok) {
            const txt = await res.text();
            alert(`Gagal mengubah status (${res.status}). ${txt}`);
            return;
          }
          setReport({ ...report, status: flow.db });
        } catch (_) {
          alert('Terjadi kesalahan saat mengubah status');
        }
        setModal({ isOpen: false, title: '', message: '', action: null });
      }
    });
  };

  const handlePrevImage = () => setActiveImageIndex((prev) => (prev === 0 ? imageSources.length - 1 : prev - 1));
  const handleNextImage = () => setActiveImageIndex((prev) => (prev === imageSources.length - 1 ? 0 : prev + 1));

  return (
    <div className="detail-page">
      <Navbar />
      <div className="detail-main">
        <h1 className="detail-title">Detail Laporan</h1>
        {error && <div style={{color:'#b00000', padding:'8px', textAlign:'center'}}>{error}</div>}
        {!report ? (
          <div style={{textAlign:'center', padding:'20px'}}>Memuat…</div>
        ) : (
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
                          <button className="slider-arrow prev" type="button" onClick={handlePrevImage} aria-label="Foto sebelumnya">‹</button>
                          <button className="slider-arrow next" type="button" onClick={handleNextImage} aria-label="Foto berikutnya">›</button>
                          <div className="slider-dots">
                            {imageSources.map((_, idx) => (
                              <button
                                key={idx}
                                className={`slider-dot ${activeImageIndex === idx ? 'active' : ''}`}
                                type="button"
                                onClick={() => setActiveImageIndex(idx)}
                                aria-label={`Ke foto ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="detail-actions">
                  <button
                    className="btn-next"
                    type="button"
                    onClick={() => {
                      if (!allReports || allReports.length === 0) return;
                      const idx = allReports.findIndex(r => r.id === id);
                      if (idx !== -1) {
                        const nextIdx = (idx < allReports.length - 1) ? idx + 1 : 0;
                        navigate(`/teknisi/laporan/${allReports[nextIdx].id}`);
                      }
                    }}
                    disabled={!allReports || allReports.length === 0}
                  >
                    Berikutnya →
                  </button>
                  <div className="action-buttons">
                    <button 
                      className={`btn-cycle ${getNextStatusClass(report?.status)}`}
                      type="button"
                      onClick={handleStatusCycle}
                    >
                      {statusMap[report?.status] === 'To-Do' && 'Mulai Progress'}
                      {statusMap[report?.status] === 'Processed' && 'Tandai Selesai'}
                      {statusMap[report?.status] === 'Done' && 'Reset Status'}
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="upload-input"
                      disabled={uploading}
                    />
                    <button 
                      type="button"
                      className="btn-upload"
                      onClick={() => document.getElementById('upload-input').click()}
                      disabled={uploading}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                      {uploading ? 'Mengunggah…' : 'Unggah Gambar'}
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
                        onClick={() => navigate(`/teknisi/laporan/${simReport.id}`)}
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
        )}
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
                <button className="image-modal-arrow prev" onClick={handlePrevImage} aria-label="Sebelumnya">‹</button>
                <button className="image-modal-arrow next" onClick={handleNextImage} aria-label="Berikutnya">›</button>
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

