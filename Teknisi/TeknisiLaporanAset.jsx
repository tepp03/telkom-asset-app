import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './LaporanAset.css';

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
  const mappedStatus = statusMap[status] || status;
  switch (mappedStatus) {
    case 'To-Do': return 'status-todo';
    case 'Processed': return 'status-processed';
    case 'Done': return 'status-done';
    default: return '';
  }
};

export default function TeknisiLaporanAset() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/reports');
        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
        else setError('Format data tidak valid');
      } catch (e) {
        setError('Gagal memuat data dari server');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="laporan-page">
      <Navbar />
      <div className="laporan-wrap">
        {loading && <div style={{ textAlign:'center', color:'#666', padding:'20px' }}>Memuat data...</div>}
        {!loading && error && <div style={{ textAlign:'center', color:'#b00000', padding:'20px' }}>{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign:'center', color:'#666', padding:'20px' }}>Tidak ada laporan.</div>
        )}

        {!loading && !error && items.length > 0 && (
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
                {items.map((item) => (
                  <tr key={item.id} style={{ cursor:'pointer' }} onClick={() => navigate(`/teknisi/laporan/${item.id}`)}>
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
