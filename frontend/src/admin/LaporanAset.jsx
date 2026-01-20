import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../shared/components/Navbar';
import './LaporanAset.css';

import { useEffect, useState } from 'react';
import { useEffect as useEffectTitle } from 'react';

function useSetAdminListTitle() {
  useEffectTitle(() => {
    document.title = 'Daftar Laporan Aset | Admin';
    return () => { document.title = 'Aplikasi Pengaduan Aset'; };
  }, []);
}

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

function useReports(searchTerm) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Sesi berakhir, silakan login kembali');
          window.location.href = '/login';
          return;
        }
        const url = searchTerm ? `/api/reports?search=${encodeURIComponent(searchTerm)}` : '/api/reports';
        const res = await fetch(url, {
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
          setError(`Gagal memuat data (${res.status}). ${txt || ''}`.trim());
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
        else setError('Format data tidak valid');
      } catch (e) {
        setError('Gagal memuat data dari server');
      }
      setLoading(false);
    })();
  }, [searchTerm]);
  return { items, loading, error };
}


function LaporanAset() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  useSetAdminListTitle();
  const { items, loading, error } = useReports(searchTerm);
  const navigate = useNavigate();

  // Tidak perlu blokir back browser di sini. Biarkan user bisa kembali ke halaman lain (misal login, dashboard, dsb),
  // tapi pastikan navigasi ke detail sudah SPA (navigate) agar tidak ada entry history baru ke detail.

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
        {loading && <div style={{textAlign:'center', color:'#666', padding:'20px'}}>Memuat data…</div>}
        {!loading && error && (
          <div style={{textAlign:'center', color:'#b00000', padding:'20px'}}>
            {error}. Pastikan backend berjalan (npm start di folder server).
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
                {filteredItems.map((item, index) => (
                  <tr key={item.id} onClick={() => window.open(`/laporan/${item.id}`, '_blank')} style={{cursor: 'pointer'}}>
                    <td>
                      <span className="table-code">{item.id}</span>
                    </td>
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

export default LaporanAset;
