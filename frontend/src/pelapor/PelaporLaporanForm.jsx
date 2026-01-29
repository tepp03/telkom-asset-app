import React, { useState, useEffect } from 'react';
import './PelaporLaporanForm.css';
import Navbar from '../shared/components/Navbar';
import { useNavigate } from 'react-router-dom';

const WA_ADMIN = '6285195003001'; // Nomor: 0851-9500-3001
const WA_MESSAGE = encodeURIComponent('Halo Admin, saya ingin bertanya tentang laporan pengaduan.');

const PelaporLaporanForm = ({ onSuccess }) => {
  // Get bound_unit dari localStorage (sudah di-set saat login)
  const boundUnit = localStorage.getItem('bound_unit') || 'BS (Business Service)';
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [form, setForm] = useState({
    nama: '',
    unit: boundUnit,
    tanggal: getTodayDate(),
    aset: '',
    deskripsi: '',
    foto: []
  });

  const [fotoPreview, setFotoPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [laporanId, setLaporanId] = useState('');
  const [laporan, setLaporan] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  // Handle file add (append, not replace)
  const handleFiles = files => {
    let arr = Array.from(files);
    let newFiles = form.foto.concat(arr).slice(0, 3);
    setFotoPreview(newFiles.map(f => URL.createObjectURL(f)));
    setForm(f => ({ ...f, foto: newFiles }));
  };

  // Remove file by index
  const removeFile = idx => {
    const newFiles = form.foto.filter((_, i) => i !== idx);
    setFotoPreview(newFiles.map(f => URL.createObjectURL(f)));
    setForm(f => ({ ...f, foto: newFiles }));
  };

  // Sync previews if value changes from parent
  useEffect(() => {
    setFotoPreview(form.foto.map(f => URL.createObjectURL(f)));
    // eslint-disable-next-line
  }, [form.foto]);
  useEffect(() => {
    document.body.classList.add('pelapor-bg');
    return () => document.body.classList.remove('pelapor-bg');
  }, []);

  const [popupFade, setPopupFade] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationFade, setNotificationFade] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Custom calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Pilih Tanggal';
    const [year, month, day] = dateStr.split('-');
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const selectDate = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    setForm({ ...form, tanggal: dateStr });
    setShowCalendar(false);
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === 'foto' && files) {
      handleFiles(files);
    } else {
      setForm(f => ({
        ...f,
        [name]: value
      }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'foto' && Array.isArray(v)) {
        v.forEach(file => data.append('foto', file));
      } else {
        data.append(k, v);
      }
    });
    const res = await fetch('/api/pelapor/laporan', {
      method: 'POST',
      body: data
    });
    setLoading(false);
    if (res.ok) {
      const result = await res.json();
      setForm({ nama: '', unit: boundUnit, tanggal: getTodayDate(), aset: '', deskripsi: '', foto: [] });
      setLaporanId(result.laporan.id);
      
      // Show notification
      setNotificationVisible(true);
      setNotificationFade(false);
      
      // Trigger fade-out and close after 3 seconds
      setTimeout(() => setNotificationFade(true), 2200);
      setTimeout(() => setNotificationVisible(false), 3000);
      
      fetchLaporan();
      if (onSuccess) onSuccess();
    } else {
      setError('Gagal mengirim laporan');
    }
  };

  const fetchLaporan = async () => {
    setLoadingInbox(true);
    const res = await fetch('/api/pelapor/laporan');
    if (res.ok) {
      setLaporan(await res.json());
    }
    setLoadingInbox(false);
  };

  useEffect(() => {
    fetchLaporan();
    const interval = setInterval(fetchLaporan, 5000);
    return () => clearInterval(interval);
  }, []);

  const navigate = useNavigate();
  const isPelapor = localStorage.getItem('role') === 'pelapor';

  return (
    <>
      <Navbar />
      
      {/* Glass Notification for Success Submit */}
      {notificationVisible && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: `translateX(-50%) translateY(${notificationFade ? '-150px' : '0'})`,
          zIndex: 10001,
          transition: 'all 0.5s ease-out',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#1fa84b',
            fontWeight: '600',
            fontSize: '15px',
            animation: notificationFade ? 'fadeOut 0.5s ease-in forwards' : 'slideInDown 0.5s ease-out forwards',
          }}>
            <style>{`
              @keyframes slideInDown {
                from {
                  opacity: 0;
                  transform: translateY(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes fadeOut {
                from {
                  opacity: 1;
                }
                to {
                  opacity: 0;
                }
              }
            `}</style>
            
            {/* Success Checkmark Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1fa84b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: '700', color: '#1fa84b' }}>Laporan Terkirim!</span>
              <span style={{ fontSize: '13px', color: '#1fa84b', opacity: 0.9 }}>ID: <strong>{laporanId.substring(0, 8).toUpperCase()}</strong></span>
            </div>
          </div>
        </div>
      )}
      
      {showPopup && (
        <div className={"popup-overlay" + (popupFade ? " fade-out" : "") }>
          <div className={"popup-modal" + (popupFade ? " fade-out" : "") }>
            <div className="popup-content-row">
              <span className="popup-icon" style={{background: '#1fa84b'}}>
                {/* Simple checkmark icon only */}
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="#1fa84b"/>
                  <path d="M10 17.5L14 21L22 13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <div className="popup-texts">
                <h3>Laporan Terkirim!</h3>
                <p>ID: <strong>{laporanId.substring(0, 8)}</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}
      <form className="pelapor-laporan-form" onSubmit={handleSubmit}>
        <h2>Buat Laporan Pengaduan</h2>
        {error && <div className="error">{error}</div>}
        <div className="form-group nama">
          <label htmlFor="nama">Nama Pelapor</label>
          <input id="nama" name="nama" placeholder="Masukkan nama lengkap Anda" value={form.nama} onChange={handleChange} required />
        </div>
        <div className="form-group unit">
          <label htmlFor="unit">Lokasi Unit</label>
          <select id="unit" name="unit" value={form.unit} disabled>
            <option value={form.unit}>{form.unit}</option>
          </select>
          <span className="select-arrow" />
        </div>
        <div className="form-group tanggal">
          <label htmlFor="tanggal">Tanggal Kejadian</label>
          <div className="custom-date-picker">
            <div className="date-input-display" onClick={() => setShowCalendar(!showCalendar)}>
              <span>{formatDisplayDate(form.tanggal)}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            {showCalendar && (
              <div className="calendar-popup">
                <div className="calendar-header">
                  <button type="button" onClick={() => changeMonth(-1)}>‹</button>
                  <span>{currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                  <button type="button" onClick={() => changeMonth(1)}>›</button>
                </div>
                <div className="calendar-weekdays">
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                    <div key={day} className="weekday">{day}</div>
                  ))}
                </div>
                <div className="calendar-days">
                  {(() => {
                    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
                    const days = [];
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
                    }
                    for (let day = 1; day <= daysInMonth; day++) {
                      const isToday = day === new Date().getDate() && 
                                      currentMonth.getMonth() === new Date().getMonth() &&
                                      currentMonth.getFullYear() === new Date().getFullYear();
                      const isSelected = form.tanggal === `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      days.push(
                        <div 
                          key={day} 
                          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => selectDate(day)}
                        >
                          {day}
                        </div>
                      );
                    }
                    return days;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="form-group aset">
          <label htmlFor="aset">Nama Aset</label>
          <input id="aset" name="aset" placeholder="Contoh: Laptop, Printer, AC" value={form.aset} onChange={handleChange} required />
        </div>
        <div className="form-group deskripsi">
          <label htmlFor="deskripsi">Deskripsi</label>
          <textarea
            id="deskripsi"
            name="deskripsi"
            value={form.deskripsi}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group foto">
          <label htmlFor="foto" style={{ display: 'flex', alignItems: 'center' }}>
            Foto Bukti (maksimal 3)
            {form.foto.length > 0 && (
              <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center' }} aria-label="Sudah terisi">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="10" fill="#1fa84b"/>
                  <path d="M6 10.5L9 13.5L14 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            id="multi-image-upload"
            onChange={e => handleFiles(e.target.files)}
            disabled={form.foto.length >= 3}
          />
          <label htmlFor="multi-image-upload" className="custom-file-label" style={{marginBottom:8, cursor: form.foto.length>=3?'not-allowed':'pointer'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e00000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="4"/><path d="M5.5 7h13l-1.38-2.76A2 2 0 0 0 15.03 3H8.97a2 2 0 0 0-1.79 1.24L5.5 7z"/><rect x="3" y="7" width="18" height="13" rx="2"/></svg>
            {form.foto.length < 3 ? 'Tambah Foto' : 'Maksimal 3 Foto'}
          </label>
          {/* Foto preview dihilangkan sesuai permintaan */}
        </div>
        <button
          type="submit"
          className="modern-submit-btn"
          style={{ color: '#e00000' }}
          disabled={loading}
        >
          {loading ? 'Mengirim...' : 'Kirim Laporan'}
        </button>
      </form>
      {/* Spacer untuk jarak ekstra dari footer */}
      <div style={{ width: '100%', height: '80px' }} />
      {/* Floating menu button for pelapor only */}
      {isPelapor && (
        <div style={{ position: 'fixed', right: 32, bottom: 32, zIndex: 9999 }}>
          <button
            onClick={() => {
              setIsAnimating(true);
              setShowFloatingMenu(!showFloatingMenu);
              setTimeout(() => setIsAnimating(false), 600);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: '#e00000', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', color: '#fff', border: 'none', outline: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
              transform: isAnimating ? 'rotate(90deg) scale(1.1)' : 'rotate(0deg) scale(1)',
            }}
            title="Menu"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </button>
          
          {showFloatingMenu && (
            <div style={{
              position: 'absolute', bottom: 72, right: 0, background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden', minWidth: '200px', zIndex: 10000,
              animation: 'slideUp 0.3s ease-out',
              animationFillMode: 'forwards',
            }}>
              <style>{`
                @keyframes slideUp {
                  from {
                    opacity: 0;
                    transform: translateY(10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              <a
                href="/pelapor/daftar-laporan"
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#333', textDecoration: 'none', borderBottom: '1px solid #eee', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f5f5f5';
                  e.target.style.transform = 'translateX(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.transform = 'translateX(0)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e00000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                <span>Detail Laporan</span>
              </a>
              
              <a
                href={`https://wa.me/${WA_ADMIN}?text=${WA_MESSAGE}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#333', textDecoration: 'none', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f5f5f5';
                  e.target.style.transform = 'translateX(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.transform = 'translateX(0)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#25D366"/><path d="M23.472 19.615c-.355-.177-2.096-1.034-2.42-1.153-.324-.118-.56-.177-.797.178-.237.355-.914 1.153-1.12 1.39-.207.237-.412.266-.767.089-.355-.178-1.5-.553-2.86-1.763-1.057-.944-1.77-2.108-1.98-2.463-.207-.355-.022-.546.155-.723.159-.158.355-.412.532-.619.178-.207.237-.355.355-.59.118-.237.06-.443-.03-.62-.089-.178-.797-1.92-1.09-2.63-.287-.69-.58-.595-.797-.606-.207-.009-.443-.011-.68-.011-.237 0-.62.089-.944.443-.324.355-1.24 1.21-1.24 2.95 0 1.74 1.27 3.42 1.447 3.66.178.237 2.5 3.82 6.06 5.21.847.292 1.507.466 2.022.595.849.203 1.624.174 2.236.106.682-.075 2.096-.857 2.393-1.687.296-.83.296-1.54.207-1.687-.089-.148-.324-.237-.68-.414z" fill="#fff"/></svg>
                <span>Hubungi Admin</span>
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PelaporLaporanForm;
