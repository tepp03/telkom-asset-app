import React, { useState, useEffect, useRef } from 'react';
import './PelaporLaporanForm.css';
import './NotificationGlass.css';
import './FabMenu.css';
import Navbar from '../shared/components/Navbar';
import { useNavigate } from 'react-router-dom';

// API URL dari environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

const WA_ADMIN = '6285195003001'; // Nomor: 0851-9500-3001
const WA_MESSAGE = encodeURIComponent('Halo Admin, saya ingin bertanya tentang laporan pengaduan.');

const PelaporLaporanForm = ({ onSuccess }) => {
  const lokasiUnitOptions = [
    'BS (Business Service)',
    'LGS (Local Government Service)',
    'PRQ (Performance, Risk & Quality)',
    'SSGS (Shared Service General Support)'
  ];
  
  // Ambil unit dari localStorage (dari token saat login)
  const userUnit = localStorage.getItem('unit') || lokasiUnitOptions[0];
  
  // Tanggal hari ini otomatis (format YYYY-MM-DD untuk input type="date")
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [form, setForm] = useState({
    nama: '',
    unit: userUnit, // Set dari localStorage
    tanggal: getTodayDate(),
    aset: '',
    deskripsi: '',
    foto: []
  });

  const [fotoPreview, setFotoPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [laporanId, setLaporanId] = useState('');
  const [laporan, setLaporan] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  const [showFabMenu, setShowFabMenu] = useState(false);

  // Handle file add (append, not replace)
  const handleFiles = files => {
    let arr = Array.from(files);
    let newFiles = form.foto.concat(arr).slice(0, 3);
    setFotoPreview(newFiles.map(f => URL.createObjectURL(f)));
    setForm(f => ({ ...f, foto: newFiles }));
    if (newFiles.length > 0) {
      setFieldErrors(prev => {
        if (!prev.foto) return prev;
        const next = { ...prev };
        delete next.foto;
        return next;
      });
    }
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

  useEffect(() => {
    document.title = 'Buat Laporan | Pelapor';
    return () => { document.title = 'Aplikasi Pengaduan Aset'; };
  }, []);

  const [popupFade, setPopupFade] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dateInputRef = useRef(null);

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

  // Toggle calendar
  const handleCalendarToggle = () => {
    setShowCalendar(!showCalendar);
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
      setFieldErrors(prev => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    const namaTrim = form.nama.trim();
    const asetTrim = form.aset.trim();
    const deskripsiTrim = form.deskripsi.trim();

    if (!namaTrim) {
      errors.nama = 'Nama pelapor wajib diisi.';
    }

    if (!form.tanggal) {
      errors.tanggal = 'Tanggal kejadian wajib diisi.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.tanggal)) {
      errors.tanggal = 'Format tanggal harus YYYY-MM-DD.';
    }

    if (!asetTrim) {
      errors.aset = 'Nama aset wajib diisi.';
    }

    if (!deskripsiTrim) {
      errors.deskripsi = 'Deskripsi wajib diisi.';
    }

    if (!form.foto || form.foto.length === 0) {
      errors.foto = 'Minimal 1 foto harus diunggah.';
    }

    return errors;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'foto' && Array.isArray(v)) {
        v.forEach(file => data.append('foto', file));
      } else if (k !== 'unit') { // Jangan kirim unit, backend ambil dari token
        data.append(k, v);
      }
    });
    
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/pelapor/laporan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: data
    });
    setLoading(false);
    if (res.ok) {
      const result = await res.json();
      setForm({ nama: '', unit: userUnit, tanggal: getTodayDate(), aset: '', deskripsi: '', foto: [] });
      setFieldErrors({});
      setLaporanId(result.laporan.id);
      setShowPopup(true);
      setPopupFade(false);
      setTimeout(() => setPopupFade(true), 2200);
      setTimeout(() => setShowPopup(false), 3000);
      fetchLaporan();
      if (onSuccess) onSuccess();
    } else {
      setError('Gagal mengirim laporan');
    }
  };

  const fetchLaporan = async () => {
    setLoadingInbox(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/pelapor/laporan`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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
      {showPopup && (
        <div className="notification-glass-overlay">
          <div className={"notification-glass-container" + (popupFade ? " fade-out" : "")}>
            <div className="notification-glass-content">
              {/* Minimal icon */}
              <div className="notification-icon" aria-hidden="true">✓</div>

              {/* Text content */}
              <div className="notification-text-content">
                <h2 className="notification-title">Laporan terkirim</h2>
                <p className="notification-subtitle">Terimakasih telah melapor!!</p>
                <div className="notification-id-badge">
                  ID Laporan: <span className="id-value">{laporanId}</span>
                </div>
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
          <input id="nama" name="nama" placeholder="Masukkan nama lengkap Anda" value={form.nama} onChange={handleChange} />
          {fieldErrors.nama && <div className="field-note">{fieldErrors.nama}</div>}
        </div>
        <div className="form-group unit">
          <label htmlFor="unit">Nama Unit</label>
          <select id="unit" name="unit" value={form.unit} onChange={handleChange} disabled style={{cursor: 'not-allowed', opacity: 1}}>
            {lokasiUnitOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="form-group tanggal">
          <label htmlFor="tanggal">Tanggal Kejadian</label>
          <div className="custom-date-picker">
            <div className="date-input-display" ref={dateInputRef} onClick={handleCalendarToggle}>
              <span>{formatDisplayDate(form.tanggal)}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            {showCalendar && (
              <>
                <div className="calendar-backdrop" onClick={() => setShowCalendar(false)}></div>
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
              </>
            )}
          </div>
          {fieldErrors.tanggal && <div className="field-note">{fieldErrors.tanggal}</div>}
        </div>
        <div className="form-group aset">
          <label htmlFor="aset">Nama Aset</label>
          <input id="aset" name="aset" placeholder="Contoh: Laptop, Printer, AC" value={form.aset} onChange={handleChange} />
          {fieldErrors.aset && <div className="field-note">{fieldErrors.aset}</div>}
        </div>
        <div className="form-group deskripsi">
          <label htmlFor="deskripsi">Deskripsi</label>
          <textarea
            id="deskripsi"
            name="deskripsi"
            value={form.deskripsi}
            onChange={handleChange}
          />
          {fieldErrors.deskripsi && <div className="field-note">{fieldErrors.deskripsi}</div>}
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
          {fieldErrors.foto && <div className="field-note">{fieldErrors.foto}</div>}
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
      
      {/* FAB Menu untuk pelapor only */}
      {isPelapor && (
        <div className="fab-menu-container">
          {/* Backdrop untuk close menu - HARUS SEBELUM MENU ITEMS */}
          {showFabMenu && (
            <div 
              className="fab-menu-backdrop" 
              onClick={() => setShowFabMenu(false)}
            ></div>
          )}
          
          {/* Menu items - muncul ketika showFabMenu true */}
          <div className={`fab-menu-items ${showFabMenu ? 'show' : ''}`}>
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${WA_ADMIN}?text=${WA_MESSAGE}`}
              className="fab-menu-item fab-menu-whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              title="Chat Admin via WhatsApp"
              onClick={() => setShowFabMenu(false)}
            >
              <svg width="24" height="24" viewBox="0 0 32 32" fill="currentColor">
                <circle cx="16" cy="16" r="16" fill="#25D366"/>
                <path d="M23.472 19.615c-.355-.177-2.096-1.034-2.42-1.153-.324-.118-.56-.177-.797.178-.237.355-.914 1.153-1.12 1.39-.207.237-.412.266-.767.089-.355-.178-1.5-.553-2.86-1.763-1.057-.944-1.77-2.108-1.98-2.463-.207-.355-.022-.546.155-.723.159-.158.355-.412.532-.619.178-.207.237-.355.355-.59.118-.237.06-.443-.03-.62-.089-.178-.797-1.92-1.09-2.63-.287-.69-.58-.595-.797-.606-.207-.009-.443-.011-.68-.011-.237 0-.62.089-.944.443-.324.355-1.24 1.21-1.24 2.95 0 1.74 1.27 3.42 1.447 3.66.178.237 2.5 3.82 6.06 5.21.847.292 1.507.466 2.022.595.849.203 1.624.174 2.236.106.682-.075 2.096-.857 2.393-1.687.296-.83.296-1.54.207-1.687-.089-.148-.324-.237-.68-.414z" fill="#fff"/>
              </svg>
            </a>
            
            {/* Email */}
            <a
              href="/pelapor/daftar-laporan"
              className="fab-menu-item fab-menu-email"
              title="Lihat Detail Laporan"
              onClick={() => setShowFabMenu(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M2 6l10 7 10-7"/>
              </svg>
            </a>
          </div>

          {/* Main FAB button */}
          <button
            className={`fab-menu-main ${showFabMenu ? 'active' : ''}`}
            onClick={() => setShowFabMenu(!showFabMenu)}
            title="Hubungi Admin"
            type="button"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7M3 7c0-1.1.9-2 2-2h2l2-3h6l2 3h2c1.1 0 2 .9 2 2" fill="white" stroke="white"/>
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default PelaporLaporanForm;
