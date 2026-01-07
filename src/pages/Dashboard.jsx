import Navbar from '../components/Navbar';
import './Dashboard.css';
import { useEffect, useMemo, useState } from 'react';

function Dashboard() {
  const [summary, setSummary] = useState({
    totalUsersApproved: 0,
    totalReports: 0,
    dalamProses: 0,
    selesai: 0,
    pending: 0,
    verifikasiPending: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) throw new Error('Gagal memuat ringkasan');
      const data = await res.json();
      setSummary(data);
      setError('');
    } catch (e) {
      console.error(e);
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const id = setInterval(fetchSummary, 5000); // polling tiap 5 detik
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => ([
    { title: 'Total Pengguna', value: `${summary.totalUsersApproved} Pengguna` },
    { title: 'Total Laporan', value: `${summary.totalReports} Laporan` },
    { title: 'Diproses', value: `${summary.dalamProses} Diproses` },
    { title: 'Selesai', value: `${summary.selesai} Selesai` }
  ]), [summary]);

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-main">
        <div className="dashboard-hero">
          <h1 className="dashboard-title">Selamat datang Admin 1</h1>
          <p className="dashboard-subtitle">Berikut adalah dashboard anda hari ini</p>
        </div>

        {loading && (
          <div style={{textAlign:'center', color:'#666', padding:'20px'}}>Memuat ringkasan…</div>
        )}
        {!loading && error && (
          <div style={{textAlign:'center', color:'#b00000', padding:'20px'}}>{error}</div>
        )}
        {!loading && !error && (
          <div className="dashboard-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-badge">{stat.title}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
