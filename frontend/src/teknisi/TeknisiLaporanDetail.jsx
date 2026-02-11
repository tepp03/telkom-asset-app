import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../shared/components/Navbar';
import ConfirmModal from '../shared/components/ConfirmModal';
import './TeknisiLaporanDetail.css';

// API URL dari environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

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

const normalizeAssetName = (value) => {
  const cleaned = (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.split(' ').sort().join(' ');
};

const levenshteinDistance = (a, b) => {
  const s = a || '';
  const t = b || '';
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
};

const isSimilarAssetName = (a, b) => {
  const na = normalizeAssetName(a);
  const nb = normalizeAssetName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const dist = levenshteinDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  const similarity = maxLen === 0 ? 0 : (maxLen - dist) / maxLen;
  return dist <= 2 || similarity >= 0.8;
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
  const [uploading, setUploading] = useState(false);
  const [isPickingUpload, setIsPickingUpload] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [allReports, setAllReports] = useState([]);
  const [similarReports, setSimilarReports] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', action: null });
  const [imageModal, setImageModal] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

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
        const res = await fetch(`${API_URL}/api/teknisi/reports`, { headers: { 'Authorization': `Bearer ${token}` } });
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
      const similar = allReports.filter(
        r => isSimilarAssetName(r.nama_barang, report.nama_barang) && r.id !== report.id
      );
      setSimilarReports(similar);
    }
  }, [report, allReports]);

  const slotImages = [report?.image_url, report?.image_url2, report?.image_url3];
  const imageSources = slotImages
    .map((src, idx) => (src ? { src, slot: idx + 1 } : null))
    .filter(Boolean);

  useEffect(() => {
    if (activeImageIndex >= imageSources.length) {
      setActiveImageIndex(0);
    }
  }, [imageSources.length, activeImageIndex]);

  useEffect(() => {
    if (imageSources.length < 2) return undefined;
    if (uploading || modal.isOpen || isPickingUpload) return undefined;
    const intervalId = setInterval(() => {
      setActiveImageIndex((prev) => (prev === imageSources.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(intervalId);
  }, [imageSources.length, uploading, modal.isOpen, isPickingUpload]);

  const handleOpenUploadPicker = () => {
    if (uploading) return;
    setIsPickingUpload(true);
    const handleFocus = () => {
      setIsPickingUpload(false);
      window.removeEventListener('focus', handleFocus);
    };
    window.addEventListener('focus', handleFocus);
    const input = document.getElementById('upload-input');
    if (input) input.click();
  };

  const handleReplaceImageChange = async (e) => {
    setIsPickingUpload(false);
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;
    const file = files[0];
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      setUploading(true);
      const form = new FormData();
      form.append('image', file);

      const currentSlot = imageSources[activeImageIndex]?.slot;
      const emptySlotIndex = slotImages.findIndex((s) => !s);
      const hasEmptySlot = emptySlotIndex >= 0;
      const slotToReplace = hasEmptySlot ? emptySlotIndex + 1 : (currentSlot || 1);

      const res = await fetch(`/api/teknisi/reports/${id}/images/${slotToReplace}`, {
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
        e.target.value = '';
        return;
      }
      
      const data = await res.json();
      const [u1, u2, u3] = data.urls;

      setReport(prev => ({
        ...prev,
        image_url: u1 || null,
        image_url2: u2 || null,
        image_url3: u3 || null
      }));
      
      e.target.value = '';
    } catch (err) {
      setUploading(false);
      setError(`Terjadi kesalahan saat upload: ${err.message}`);
    }
  };

  const handleDeleteImage = async (slot) => {
    setModal({
      isOpen: true,
      title: 'Hapus Gambar',
      message: `Yakin ingin menghapus gambar slot ${slot}?`,
      action: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/login');
            return;
          }

          const res = await fetch(`/api/teknisi/reports/${id}/images/${slot}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.status === 401) {
            localStorage.clear();
            navigate('/login');
            return;
          }

          if (!res.ok) {
            const t = await res.text();
            setError(`Gagal menghapus gambar: ${t}`);
            return;
          }

          const data = await res.json();
          const [u1, u2, u3] = data.urls;

          setReport(prev => ({
            ...prev,
            image_url: u1 || null,
            image_url2: u2 || null,
            image_url3: u3 || null
          }));

          setModal({ isOpen: false });
        } catch (err) {
          setError(`Terjadi kesalahan: ${err.message}`);
        }
      }
    });
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

  const handlePrevImage = () => {
    if (imageSources.length === 0) return;
    setActiveImageIndex(prev => (prev === 0 ? imageSources.length - 1 : prev - 1));
  };
  
  const handleNextImage = () => {
    if (imageSources.length === 0) return;
    setActiveImageIndex(prev => (prev === imageSources.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  
  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    const distance = touchStart - e.changedTouches[0].clientX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) handleNextImage();
    if (isRightSwipe) handlePrevImage();
  };

  return (
    <div className="detail-page">
      <Navbar />
      <div className="detail-main">
        <h1 className="detail-title">Detail Laporan</h1>
        {!report ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Memuat…</div>
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
                    {imageSources.length === 0 ? (
                      <div style={{ color: '#777', padding: '24px', textAlign: 'center', width: '100%' }}>
                        Tidak ada foto
                      </div>
                    ) : (
                      <div className="image-slider">
                        <div
                          className="image-track"
                          style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                          onTouchStart={handleTouchStart}
                          onTouchEnd={handleTouchEnd}
                        >
                          {imageSources.map((img, idx) => (
                            <div className="image-slide" key={img.slot}>
                              <div 
                                className="image-wrapper"
                                onClick={() => { setActiveImageIndex(idx); setImageModal(true); }}
                                style={{ position: 'relative' }}
                              >
                                <img src={img.src} alt={`Lampiran ${idx + 1}`} />
                                <div className="image-overlay">
                                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#fff">
                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                  </svg>
                                  <span>Klik untuk memperbesar</span>
                                </div>
                                <button 
                                  className="btn-delete-image" 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteImage(img.slot);
                                  }}
                                  title="Hapus gambar ini"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {imageSources.length > 1 && (
                          <>
                            <button className="slider-arrow prev" type="button" onClick={handlePrevImage} aria-label="Foto sebelumnya">‹</button>
                            <button className="slider-arrow next" type="button" onClick={handleNextImage} aria-label="Foto berikutnya">›</button>
                            <div className="slider-dots">
                              {imageSources.map((img, idx) => (
                                <button
                                  key={img.slot}
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
                    )}
                  </div>
                </div>

                <div className="detail-actions">
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
                      onChange={handleReplaceImageChange}
                      style={{ display: 'none' }}
                      id="upload-input"
                      disabled={uploading}
                    />
                    <button
                      type="button"
                      className="btn-upload"
                      onClick={handleOpenUploadPicker}
                      disabled={uploading}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="13" r="4"/>
                        <path d="M5.5 7h13l-1.38-2.76A2 2 0 0 0 15.03 3H8.97a2 2 0 0 0-1.79 1.24L5.5 7z"/>
                        <rect x="3" y="7" width="18" height="13" rx="2"/>
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
            {imageSources.length === 0 ? (
              <div style={{ color: '#777', padding: '24px', textAlign: 'center' }}>Tidak ada foto</div>
            ) : (
              <img 
                src={imageSources[activeImageIndex]?.src} 
                alt="Lampiran Besar"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              />
            )}
            {imageSources.length > 1 && (
              <>
                <button className="image-modal-arrow prev" onClick={handlePrevImage} aria-label="Sebelumnya">‹</button>
                <button className="image-modal-arrow next" onClick={handleNextImage} aria-label="Berikutnya">›</button>
                <div className="image-modal-dots">
                  {imageSources.map((img, idx) => (
                    <button
                      key={img.slot}
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

