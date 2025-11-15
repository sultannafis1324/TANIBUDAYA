import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    _id: string;
    nama_lengkap: string;
    email: string;
  };
  jumlah_views: number;
  jumlah_likes: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  media_konten?: Array<{ url: string; type: string }>;
  koordinat_peta?: {
    latitude: number;
    longitude: number;
  };
  tags?: string[];
  sumber_referensi?: string[];
}

const KontenBudayaShow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [konten, setKonten] = useState<Konten | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchKonten();
  }, [id]);

  const fetchKonten = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/konten-budaya/${id}`, { headers });
      
      // Check if user can access this content
      const data = res.data;
      if (data.status === 'pending' || data.status === 'rejected') {
        // Only creator and admin can see pending/rejected content
        if (!token || (data.dibuat_oleh?._id !== userId && localStorage.getItem('userType') !== 'admin')) {
          alert('Konten ini belum dipublikasikan atau tidak dapat diakses');
          navigate('/budaya');
          return;
        }
      }
      
      setKonten(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching konten:', err);
      alert('Konten tidak ditemukan');
      navigate('/budaya');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      draft: '#999',
      pending: '#ff9800',
      published: '#4CAF50',
      rejected: '#f44336'
    };
    return (
      <span
        style={{
          backgroundColor: colors[status] || '#999',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!konten) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Konten tidak ditemukan</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ddd',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            marginBottom: '15px'
          }}
        >
          ← Kembali
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <h1 style={{ margin: '0', fontSize: '32px' }}>{konten.judul}</h1>
          {getStatusBadge(konten.status)}
        </div>

        <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
          <span style={{ marginRight: '15px' }}>
            👤 {konten.dibuat_oleh?.nama_lengkap || 'Anonim'}
          </span>
          <span style={{ marginRight: '15px' }}>
            👁️ {konten.jumlah_views} views
          </span>
          <span>
            ❤️ {konten.jumlah_likes} likes
          </span>
        </div>

        <div style={{ fontSize: '14px', color: '#888' }}>
          📅 {new Date(konten.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Media Gallery */}
      {konten.media_konten && konten.media_konten.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
            {konten.media_konten[currentMediaIndex].type === 'image' && (
              <img
                src={konten.media_konten[currentMediaIndex].url}
                alt="media"
                style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
              />
            )}
            {konten.media_konten[currentMediaIndex].type === 'video' && (
              <video
                src={konten.media_konten[currentMediaIndex].url}
                controls
                style={{ width: '100%', maxHeight: '500px' }}
              />
            )}
            {konten.media_konten[currentMediaIndex].type === 'audio' && (
              <div style={{ padding: '100px 20px', textAlign: 'center', backgroundColor: '#333' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎵</div>
                <audio
                  src={konten.media_konten[currentMediaIndex].url}
                  controls
                  style={{ width: '100%', maxWidth: '500px' }}
                />
              </div>
            )}
          </div>

          {/* Media Thumbnails */}
          {konten.media_konten.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
              {konten.media_konten.map((media, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentMediaIndex(index)}
                  style={{
                    minWidth: '80px',
                    height: '60px',
                    border: currentMediaIndex === index ? '3px solid #2196F3' : '1px solid #ddd',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: '#f0f0f0'
                  }}
                >
                  {media.type === 'image' && (
                    <img src={media.url} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  {media.type === 'video' && (
                    <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  {media.type === 'audio' && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      🎵
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kategori & Lokasi */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <strong>Kategori:</strong>{' '}
          <span
            style={{
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            {konten.kategori?.nama_kategori || 'Uncategorized'}
          </span>
        </div>
        <div>
          <strong>Lokasi:</strong> 📍 {konten.provinsiNama}
          {konten.kabupatenNama !== '-' && `, ${konten.kabupatenNama}`}
          {konten.kecamatanNama !== '-' && `, ${konten.kecamatanNama}`}
        </div>
      </div>

      {/* Koordinat */}
      {konten.koordinat_peta && (konten.koordinat_peta.latitude || konten.koordinat_peta.longitude) && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <strong>Koordinat:</strong> Lat: {konten.koordinat_peta.latitude}, Long: {konten.koordinat_peta.longitude}
        </div>
      )}

      {/* Deskripsi */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Deskripsi</h2>
        <p style={{ lineHeight: '1.8', fontSize: '16px', color: '#333', whiteSpace: 'pre-wrap' }}>
          {konten.deskripsi || 'Tidak ada deskripsi'}
        </p>
      </div>

      {/* Tags */}
      {konten.tags && konten.tags.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Tags</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {konten.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: '#f0f0f0',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: '#555'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sumber Referensi */}
      {konten.sumber_referensi && konten.sumber_referensi.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Sumber Referensi</h3>
          <ul style={{ paddingLeft: '20px' }}>
            {konten.sumber_referensi.map((sumber, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                {sumber.startsWith('http') ? (
                  <a href={sumber} target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3' }}>
                    {sumber}
                  </a>
                ) : (
                  <span>{sumber}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons (untuk creator) */}
      {token && konten.dibuat_oleh?._id === userId && (
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #eee' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate(`/konten-budaya/edit/${konten._id}`)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Edit Konten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KontenBudayaShow;