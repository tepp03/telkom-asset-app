import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../shared/components/Navbar';
import './DetailLaporan.css';
import { useEffect, useState } from 'react';
import ConfirmModal from '../shared/components/ConfirmModal';

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
  if (currentMapped === 'To-Do') return 'status-in-progress'; // Next is Processed
  if (currentMapped === 'Processed') return 'status-done'; // Next is Done
  return 'status-to-do'; // Next is To-Do (reset)
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

function DetailLaporan() {
    // Blokir tombol back browser agar tidak bisa kembali ke halaman sebelumnya
    useEffect(() => {
      // Push dummy state agar history tidak bisa di-back
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
  // Set judul tab browser
  useEffect(() => {
    if (report && report.nama_barang) {
      document.title = `Detail Laporan: ${report.nama_barang} (${id}) | Admin`;
    } else {
      document.title = 'Detail Laporan | Admin';
    }
    return () => { document.title = 'Aplikasi Pengaduan Aset'; };
  }, [report, id]);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', action: null });
  const [imageModal, setImageModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [allIds, setAllIds] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [similarReports, setSimilarReports] = useState([]);
  const [error, setError] = useState('');
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [report]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Sesi berakhir, silakan login kembali');
          window.location.href = '/login';
          return;
        }
        const res = await fetch(`/api/reports/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          if (data.reason === 'password_changed') alert('Password Anda telah diganti. Silakan login kembali.');
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
        
        if (res.status === 429) {
          setError('Terlalu banyak permintaan. Coba lagi sebentar lagi.');
          return;
        }

        if (!res.ok) {
          const txt = await res.text();
          setError(`Gagal memuat laporan (${res.status}). ${txt || ''}`.trim());
          return;
        }

        const data = await res.json();
        setReport(data);
      } catch (e) {
        // Error handled by alerts above
      }
    })();
  }, [id]);

  // Fetch list of all report IDs to enable "Berikutnya" navigation
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Sesi berakhir, silakan login kembali');
          window.location.href = '/login';
          return;
        }
        const res = await fetch(`${API_URL}/api/reports`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          if (data.reason === 'password_changed') alert('Password Anda telah diganti. Silakan login kembali.');
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
        
        if (res.status === 429) {
          setError('Terlalu banyak permintaan. Coba lagi sebentar lagi.');
          return;
        }

        if (!res.ok) {
          const txt = await res.text();
          setError(`Gagal memuat daftar laporan (${res.status}). ${txt || ''}`.trim());
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setAllReports(data);
          const ids = data.map(r => r.id).sort();
          setAllIds(ids);
        }
      } catch (e) {
        // Navigation error handled silently
      }
    })();
  }, [id]);

  // Filter similar reports by asset name (fuzzy)
  useEffect(() => {
    if (report && allReports.length > 0) {
      const similar = allReports.filter(
        r => isSimilarAssetName(r.nama_barang, report.nama_barang) && r.id !== report.id
      );
      setSimilarReports(similar);
    }
  }, [report, allReports]);

  const currentIndex = allIds.indexOf(id);
  const nextId = currentIndex >= 0 && currentIndex < allIds.length - 1 ? allIds[currentIndex + 1] : null;

  const handleStatusCycle = () => {
    if (!report) return;
    const currentMapped = statusMap[report.status];
    // Hanya kirim nilai: 'To-Do', 'In Progress', 'Done'
    const statusFlow = {
      'To-Do': { next: 'Processed', db: 'In Progress', msg: 'Mulai proses pengerjaan?' },
      'Processed': { next: 'Done', db: 'Done', msg: 'Tandai laporan sebagai selesai?' },
      'Done': { next: 'To-Do', db: 'To-Do', msg: 'Reset status ke To-Do?' }
    };
    const flow = statusFlow[currentMapped];
    
    setModal({
      isOpen: true,
      title: 'Konfirmasi',
      message: flow.msg,
      action: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            alert('Sesi berakhir, silakan login ulang.');
            window.location.href = '/login';
            return;
          }
          const res = await fetch(`/api/reports/${id}/status`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: flow.db })
          });
          
          if (res.status === 401) {
            const data = await res.json();
            if (data.reason === 'password_changed') {
              alert('Password Anda telah diganti. Silakan login kembali.');
            }
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            window.location.href = '/login';
            return;
          }
          
          if (!res.ok) {
            let errText = await res.text();
            try {
              const maybeJson = JSON.parse(errText);
              errText = maybeJson.error || errText;
            } catch (_) {}
            alert(`Gagal mengubah status (${res.status}): ${errText}`);
            return;
          }

          setReport({ ...report, status: flow.db });

          // Refresh allReports dan similarReports agar status laporan serupa ikut update
          const reportsRes = await fetch(`${API_URL}/api/reports`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (reportsRes.ok) {
            const data = await reportsRes.json();
            if (Array.isArray(data)) {
              setAllReports(data);
            }
          }
        } catch (e) {
          alert('Terjadi kesalahan saat mengubah status.');
        }
        setModal({ isOpen: false, title: '', message: '', action: null });
      }
    });
  };

  const baseImages = [report?.image_url, report?.image_url2, report?.image_url3].filter(Boolean);
  const imageSources = baseImages;

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

  useEffect(() => {
    if (imageSources.length < 2) return undefined;
    const intervalId = setInterval(() => {
      setActiveImageIndex((prev) => (prev === imageSources.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(intervalId);
  }, [imageSources.length]);

  const handleDelete = () => {
    setModal({
      isOpen: true,
      title: 'Hapus Laporan',
      message: 'Yakin ingin menghapus laporan ini? Data tidak dapat dikembalikan.',
      action: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            alert('Sesi berakhir, silakan login ulang.');
            window.location.href = '/login';
            return;
          }
          const res = await fetch(`/api/reports/${id}`, { 
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (res.status === 401) {
            const data = await res.json().catch(() => ({}));
            if (data.reason === 'password_changed') alert('Password Anda telah diganti. Silakan login kembali.');
            localStorage.clear();
            window.location.href = '/login';
            return;
          }
          
          if (res.status === 429) {
            alert('Terlalu banyak permintaan. Coba lagi sebentar lagi.');
            return;
          }

          if (!res.ok) {
            let errText = await res.text();
            try {
              const maybeJson = JSON.parse(errText);
              errText = maybeJson.error || errText;
            } catch (_) {}
            alert(`Gagal menghapus laporan (${res.status}): ${errText}`);
            return;
          }

          // Jika dibuka di tab baru, reload tab utama lalu tutup tab detail
          if (window.opener && !window.opener.closed) {
            window.opener.location.reload();
            window.close();
            return;
          }
          // Jika tidak, redirect ke daftar laporan
          navigate('/laporan-aset');
        } catch (e) {
          alert('Terjadi kesalahan saat menghapus laporan.');
        }
        setModal({ isOpen: false, title: '', message: '', action: null });
      }
    });
  };

  return (
    <div className="detail-page">
      <Navbar />
      {error && (
        <div style={{ textAlign: 'center', color: '#b00000', padding: '16px' }}>{error}</div>
      )}
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
                )}
              </div>
            </div>

            <div className="detail-actions">
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
            {imageSources.length === 0 ? (
              <div style={{ color: '#777', padding: '24px', textAlign: 'center' }}>Tidak ada foto</div>
            ) : (
              <img 
                src={imageSources[activeImageIndex]} 
                alt="Lampiran Besar"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              />
            )}
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
