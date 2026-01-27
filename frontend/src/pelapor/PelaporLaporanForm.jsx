import React, { useState, useEffect } from 'react';
import './PelaporLaporanForm.css';
import Navbar from '../shared/components/Navbar';
import { useNavigate } from 'react-router-dom';

const WA_ADMIN = '6285195003001'; // Nomor: 0851-9500-3001
const WA_MESSAGE = encodeURIComponent('Halo Admin, saya ingin bertanya tentang laporan pengaduan.');

const PelaporLaporanForm = ({ onSuccess }) => {
  const lokasiUnitOptions = [
    'Lantai 1 - Front Office',
    'Lantai 1 - Customer Service',
    'Lantai 2 - Ruang Rapat',
    'Lantai 2 - Kantor Manager',
    'Lantai 3 - IT Support',
    'Lantai 3 - Gudang',
    'Lantai 4 - Pantry',
    'Lantai 4 - Ruang Meeting',
    'Basement - Parkir',
    'Lobby Utama',
    'Ruang Server',
    'Kantin',
    'Toilet Pria',
    'Toilet Wanita',
    'Area Luar Gedung'
  ];
  const today = new Date();
  const tanggalOptions = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return d.toISOString().slice(0,10);
  });
  const [form, setForm] = useState({
    nama: '',
    unit: lokasiUnitOptions[0],
    tanggal: tanggalOptions[0],
    aset: '',
    deskripsi: '',
    foto: []
  });

  const [fotoPreview, setFotoPreview] = useState([]);

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

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [laporan, setLaporan] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [laporanId, setLaporanId] = useState('');

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
      setForm({ nama: '', unit: lokasiUnitOptions[0], tanggal: tanggalOptions[0], aset: '', deskripsi: '', foto: [] });
      setLaporanId(result.laporan.id);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
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
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-modal">
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
          <select id="unit" name="unit" value={form.unit} onChange={handleChange} required>
            {lokasiUnitOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span className="select-arrow" />
        </div>
        <div className="form-group tanggal">
          <label htmlFor="tanggal">Tanggal Kejadian</label>
          <input
            id="tanggal"
            name="tanggal"
            type="date"
            value={form.tanggal}
            onChange={handleChange}
            required
            className="modern-date-input"
          />
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
          <label htmlFor="foto">Foto Bukti (maksimal 3)</label>
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
          <div className="foto-preview-row">
            {fotoPreview.map((src, i) => (
              <div key={i} style={{position:'relative', display:'inline-block', marginRight:12}}>
                <img src={src} alt={`Preview ${i+1}`} className="foto-preview" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: -12,
                    background: 'none',
                    border: 'none',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: '#fff',
                    boxShadow: 'none',
                    padding: 0,
                    lineHeight: 1,
                    fontSize: 20,
                    zIndex: 2
                  }}
                  aria-label="Hapus foto"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
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
      {/* Floating action buttons for pelapor only */}
      {isPelapor && (
        <>
          <a
            href={`https://wa.me/${WA_ADMIN}?text=${WA_MESSAGE}`}
            className="floating-wa-btn"
            style={{
              position: 'fixed',
              right: 32,
              bottom: 104, // 32 (inbox) + 56 (btn) + 16 (gap)
              zIndex: 10000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: '#25D366', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', color: '#fff', textDecoration: 'none', border: 'none', outline: 'none', cursor: 'pointer', transition: 'background 0.2s, box-shadow 0.2s',
            }}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat Admin via WhatsApp"
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#25D366"/><path d="M23.472 19.615c-.355-.177-2.096-1.034-2.42-1.153-.324-.118-.56-.177-.797.178-.237.355-.914 1.153-1.12 1.39-.207.237-.412.266-.767.089-.355-.178-1.5-.553-2.86-1.763-1.057-.944-1.77-2.108-1.98-2.463-.207-.355-.022-.546.155-.723.159-.158.355-.412.532-.619.178-.207.237-.355.355-.59.118-.237.06-.443-.03-.62-.089-.178-.797-1.92-1.09-2.63-.287-.69-.58-.595-.797-.606-.207-.009-.443-.011-.68-.011-.237 0-.62.089-.944.443-.324.355-1.24 1.21-1.24 2.95 0 1.74 1.27 3.42 1.447 3.66.178.237 2.5 3.82 6.06 5.21.847.292 1.507.466 2.022.595.849.203 1.624.174 2.236.106.682-.075 2.096-.857 2.393-1.687.296-.83.296-1.54.207-1.687-.089-.148-.324-.237-.68-.414z" fill="#fff"/></svg>
          </a>
          <a
            href="/pelapor/daftar-laporan"
            className="floating-inbox-btn"
            style={{
              position: 'fixed',
              right: 32,
              bottom: 32,
              zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: '#e00000', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', color: '#fff', textDecoration: 'none', border: 'none', outline: 'none', cursor: 'pointer', transition: 'background 0.2s, box-shadow 0.2s',
            }}
            title="Inbox Laporan"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
          </a>
        </>
      )}
    </>
  );
};

export default PelaporLaporanForm;
