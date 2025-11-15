import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Konten {
  _id: string;
  judul: string;
  kategori: {
    _id: string;
    nama_kategori: string;
  };
  provinsiNama: string;
  kabupatenNama: string;
  kecamatanNama: string;
  deskripsi: string;
  dibuat_oleh: {
    nama_lengkap: string;
  };
  jumlah_views: number;
  jumlah_likes: number;
  createdAt: string;
  media_konten?: Array<{ url: string; type: string }>;
  tags?: string[];
}

const KontenBudayaPublik: React.FC = () => {
  const navigate = useNavigate();
  const [kontenList, setKontenList] = useState<Konten[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchKontenPublik();
  }, []);

  const fetchKontenPublik = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/konten-budaya/publik');
      setKontenList(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching konten publik:', err);
      setLoading(false);
    }
  };

  const filteredKonten = kontenList.filter(konten =>
    konten.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
    konten.kategori?.nama_kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
    konten.provinsiNama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '10px' }}>Jelajahi Budaya Indonesia</h1>
        <p style={{ color: '#666' }}>Kumpulan konten budaya nusantara dari berbagai daerah</p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Cari berdasarkan judul, kategori, atau lokasi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 20px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '25px',
            outline: 'none'
          }}
        />
      </div>

      {filteredKonten.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>
          {searchTerm ? 'Tidak ada konten yang sesuai dengan pencarian.' : 'Belum ada konten budaya yang dipublikasikan.'}
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredKonten.map((konten) => (
            <div
              key={konten._id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                backgroundColor: 'white'
              }}
              onClick={() => navigate(`/budaya/${konten._id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Thumbnail */}
              <div style={{ width: '100%', height: '200px', backgroundColor: '#f0f0f0', position: 'relative' }}>
                {konten.media_konten && konten.media_konten.length > 0 ? (
                  konten.media_konten[0].type === 'image' ? (
                    <img
                      src={konten.media_konten[0].url}
                      alt={konten.judul}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : konten.media_konten[0].type === 'video' ? (
                    <video
                      src={konten.media_konten[0].url}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px'
                      }}
                    >
                      🎵
                    </div>
                  )
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999'
                    }}
                  >
                    No Image
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
                  {konten.judul}
                </h3>
                
                <p
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '14px',
                    color: '#666',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {konten.deskripsi || 'Tidak ada deskripsi'}
                </p>

                <div style={{ marginBottom: '10px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {konten.kategori?.nama_kategori || 'Uncategorized'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
                  📍 {konten.provinsiNama}
                  {konten.kabupatenNama !== '-' && `, ${konten.kabupatenNama}`}
                </div>

                {konten.tags && konten.tags.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                    {konten.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          marginRight: '5px',
                          backgroundColor: '#f5f5f5',
                          padding: '2px 6px',
                          borderRadius: '3px'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid #eee',
                    fontSize: '13px',
                    color: '#666'
                  }}
                >
                  <span>👁️ {konten.jumlah_views} views</span>
                  <span>❤️ {konten.jumlah_likes} likes</span>
                </div>

                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>
                  Oleh: {konten.dibuat_oleh?.nama_lengkap || 'Anonim'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KontenBudayaPublik;