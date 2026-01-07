import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './LaporanAset.css';

import { useEffect, useState } from 'react';

function useReports(searchTerm) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const url = searchTerm ? `/api/reports?search=${encodeURIComponent(searchTerm)}` : '/api/reports';
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
        else setError('Format data tidak valid');
      } catch (e) {
        console.error(e);
        setError('Gagal memuat data dari server');
      }
      setLoading(false);
    })();
  }, [searchTerm]);
  return { items, loading, error };
}

function LaporanAset() {
  const [searchTerm, setSearchTerm] = useState('');
  const { items: all, loading, error } = useReports(searchTerm);
  const items = all.map(r => ({ id: r.id, title: r.id, img: r.image_url || 'https://via.placeholder.com/200x180.png?text=Foto' }));
  
  return (
    <div className="laporan-page">
      <Navbar />
      <div className="laporan-wrap">
        <div className="laporan-search">
          <input 
            type="text" 
            placeholder="Cari berdasarkan Email Pelapor, Jenis, Status" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </span>
        </div>

        {loading && <div style={{textAlign:'center', color:'#666', padding:'20px'}}>Memuat data…</div>}
        {!loading && error && (
          <div style={{textAlign:'center', color:'#b00000', padding:'20px'}}>
            {error}. Pastikan backend berjalan (npm start di folder server).
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={{textAlign:'center', color:'#666', padding:'20px'}}>Tidak ada laporan.</div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="laporan-grid">
            {items.map((item) => (
              <Link key={item.id} to={`/laporan/${item.id}`} className="laporan-card">
                <div className="laporan-img" style={{ backgroundImage: `url(${item.img})` }} />
                <div className="laporan-title">{item.title}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LaporanAset;
