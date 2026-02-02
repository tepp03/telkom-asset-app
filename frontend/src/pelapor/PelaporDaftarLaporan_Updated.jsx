
import { useState, useEffect } from 'react';
import Navbar from '../shared/components/Navbar';
import '../admin/LaporanAset.css';
import { useNavigate } from 'react-router-dom';

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

function PelaporDaftarLaporan() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // Custom back: jika user tekan back dari daftar laporan, langsung ke form laporan tanpa melewati page lain
  useEffect(() => {
    // Ganti state history agar daftar-laporan jadi root, tidak ada page penghalang
    window.history.replaceState({ daftarLaporan: true }, '', window.location.href);
    const handlePopState = (e) => {
      // Selalu arahkan ke form laporan jika user tekan back dari daftar laporan
      if (window.location.pathname === '/pelapor/daftar-laporan') {
        navigate('/pelapor/form-laporan', { replace: true });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  useEffect(() => {
    document.title = 'Daftar Laporan | Pelapor';
    return () => { document.title = 'Aplikasi Pengaduan Aset'; };
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const url = '/api/pelapor/laporan';
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          setError('Gagal memuat data laporan');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setItems(data);
      } catch (e) {
        setError('Gagal memuat data dari server');
      }
      setLoading(false);
    })();
  }, []);

  // Filter items: search dan status, urutan backend (ASC)
  const filteredItems = items.filter(item => {
    const term = searchTerm.toLowerCase();
    const match =
      item.id.toLowerCase().includes(term) ||
      (item.nama || '').toLowerCase().includes(term) ||
      (item.unit || '').toLowerCase().includes(term) ||
      (item.aset || '').toLowerCase().includes(term) ||
      (item.deskripsi || '').toLowerCase().includes(term) ||
      (item.status || '').toLowerCase().includes(term) ||
      (item.tanggal || '').toLowerCase().includes(term);
    const statusOk = !statusFilter || (statusMap[item.status] || item.status) === statusFilter;
    return match && statusOk;
  });

  return (
    <div className="laporan-page">
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <div className="laporan-wrap">
        {loading && <div style={{textAlign:'center', color:'#666', padding:'20px'}}>Memuat data…</div>}
        {!loading && error && (
          <div style={{textAlign:'center', color:'#b00000', padding:'20px'}}>
            {error}. Pastikan backend berjalan.
          </div>
        )}
        {!loading && !error && filteredItems.length === 0 && (
          <div style={{textAlign:'center', color:'#666', padding:'20px'}}>Tidak ada laporan.</div>
        )}
        {!loading && !error && filteredItems.length > 0 && (
          <div className="laporan-table-container">
            <table className="laporan-table">
              <thead>
                <tr>
                  <th>Kode Laporan</th>
                  <th>Nama Pelapor</th>
                  <th>Lokasi Unit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} onClick={e => {
                    e.preventDefault();
                    window.open(`/pelapor/laporan/${item.id}`, '_blank');
                  }} style={{cursor: 'pointer'}}>
                    <td>
                      <span className="table-code">{item.id}</span>
                    </td>
                    <td>{item.nama || '-'}</td>
                    <td>{item.unit || '-'}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(item.status)}`}>
                        {statusMap[item.status] || item.status || 'To-Do'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        className="fab-add-report"
        onClick={() => navigate('/pelapor/form-laporan')}
        title="Buat Laporan Baru"
        type="button"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    </div>
  );
}

export default PelaporDaftarLaporan;
