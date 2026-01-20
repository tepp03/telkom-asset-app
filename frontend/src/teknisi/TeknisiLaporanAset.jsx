import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/components/Navbar';
import './TeknisiLaporanAset.css';

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

function useTeknisiReports(searchTerm, navigate) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const url = searchTerm ? `/api/teknisi/reports?search=${encodeURIComponent(searchTerm)}` : '/api/teknisi/reports';
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) {
          localStorage.clear();
          navigate('/login');
          return;
        }
        if (res.status === 429) {
          setError('Terlalu banyak permintaan. Coba lagi sebentar lagi.');
          return;
        }
        if (!res.ok) {
          const t = await res.text();
          setError(`Gagal memuat data (${res.status}). ${t}`.trim());
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
        else setError('Format data tidak valid');
      } catch (_) {
        setError('Gagal memuat data dari server');
      } finally {
        setLoading(false);
      }
    })();
  }, [searchTerm, navigate]);

  return { items, loading, error };
}
import { useEffect as useEffectTitle } from 'react';

function useSetTeknisiListTitle() {
  useEffectTitle(() => {
    document.title = 'Laporan Aset | Teknisi';
    return () => { document.title = 'Aplikasi Pengaduan Aset'; };
  }, []);
}

export default function TeknisiLaporanAset() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { items, loading, error } = useTeknisiReports(searchTerm, navigate);
  useSetTeknisiListTitle();

  // Filter items berdasarkan status jika statusFilter dipilih
  const filteredItems = statusFilter
    ? items.filter(item => (statusMap[item.status] || item.status) === statusFilter)
    : items;

  return (
    <div className="laporan-page">
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <div className="laporan-wrap">
        {loading && <div style={{ textAlign:'center', color:'#666', padding:'20px' }}>Memuat data...</div>}
        {!loading && error && <div style={{ textAlign:'center', color:'#b00000', padding:'20px' }}>{error}</div>}

        {!loading && !error && filteredItems.length === 0 && (
          <div style={{ textAlign:'center', color:'#666', padding:'20px' }}>Tidak ada laporan.</div>
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
                  <tr key={item.id} style={{ cursor:'pointer' }} onClick={() => window.open(`/teknisi/laporan/${item.id}`, '_blank')}>
                    <td><span className="table-code">{item.id}</span></td>
                    <td>{item.email_pelapor || '-'}</td>
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
    </div>
  );
}
