import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

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
  status: string;
  dibuat_oleh: {
    _id: string;
    nama_lengkap: string;
    email: string;
  };
  jumlah_views: number;
  jumlah_likes: number;
  createdAt: string;
  media_konten?: Array<{ url: string; type: string }>;
}

const KontenBudayaList: React.FC = () => {
  const navigate = useNavigate();
  const [kontenList, setKontenList] = useState<Konten[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  
  const userId = localStorage.getItem('userId');
  const userType = localStorage.getItem('userType');
  const isAdmin = userType === 'admin';

  useEffect(() => {
    fetchKonten();
  }, [filterStatus]);

  const fetchKonten = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Build URL dengan parameter yang benar
      const params = new URLSearchParams();
      
      // Tambahkan filter status jika ada
      if (filterStatus) {
        params.append('status', filterStatus);
      }
      
      // Tambahkan userId untuk user biasa
      if (userId) {
        params.append('userId', userId);
      }
      
      // Tambahkan flag isAdmin
      params.append('isAdmin', isAdmin ? 'true' : 'false');
      
      const url = `http://localhost:5000/api/konten-budaya?${params.toString()}`;
      
      console.log('=== FETCHING KONTEN ===');
      console.log('URL:', url);
      console.log('isAdmin:', isAdmin);
      console.log('userId:', userId);

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Konten loaded:', res.data.length, 'items');
      setKontenList(res.data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching konten:', err);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus konten ini?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/konten-budaya/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Konten berhasil dihapus');
      fetchKonten();
    } catch (err) {
      console.error('Error deleting konten:', err);
      alert('Gagal menghapus konten');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/konten-budaya/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Status berhasil diubah ke ${newStatus}`);
      fetchKonten();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Gagal mengubah status');
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
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <Layout>
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{isAdmin ? 'Kelola Konten Budaya' : 'Konten Budaya Saya'}</h1>
        <button
          onClick={() => navigate('/konten-budaya/create')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          + Buat Konten Baru
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Filter Status: </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '8px', marginLeft: '10px' }}
        >
          <option value="">Semua</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {kontenList.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px' 
        }}>
          <p style={{ fontSize: '16px', color: '#666' }}>
            {filterStatus 
              ? `Tidak ada konten dengan status "${filterStatus}"`
              : 'Belum ada konten budaya. Buat konten pertama Anda!'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Thumbnail</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Judul</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Kategori</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Lokasi</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                {isAdmin && (
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Pembuat</th>
                )}
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Views</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {kontenList.map((konten) => (
                <tr key={konten._id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {konten.media_konten && konten.media_konten.length > 0 ? (
                      konten.media_konten[0].type === 'image' ? (
                        <img
                          src={konten.media_konten[0].url}
                          alt="thumbnail"
                          style={{ width: '80px', height: '60px', objectFit: 'cover' }}
                        />
                      ) : konten.media_konten[0].type === 'video' ? (
                        <video
                          src={konten.media_konten[0].url}
                          style={{ width: '80px', height: '60px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '80px', height: '60px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          🎵
                        </div>
                      )
                    ) : (
                      <div style={{ width: '80px', height: '60px', backgroundColor: '#eee' }}></div>
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{konten.judul}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {konten.kategori?.nama_kategori || '-'}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {konten.provinsiNama}
                    {konten.kabupatenNama !== '-' && `, ${konten.kabupatenNama}`}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {getStatusBadge(konten.status)}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {konten.dibuat_oleh?.nama_lengkap || 'N/A'}
                    </td>
                  )}
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{konten.jumlah_views}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <button
                        onClick={() => navigate(`/konten-budaya/${konten._id}`)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '3px'
                        }}
                      >
                        Lihat
                      </button>
                      
                      {/* User biasa bisa edit/hapus konten miliknya */}
                      {!isAdmin && konten.dibuat_oleh?._id === userId && (
                        <>
                          <button
                            onClick={() => navigate(`/konten-budaya/edit/${konten._id}`)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#ff9800',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '3px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(konten._id)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '3px'
                            }}
                          >
                            Hapus
                          </button>
                        </>
                      )}

                      {/* Admin bisa approve/reject pending content */}
                      {isAdmin && konten.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => handleUpdateStatus(konten._id, 'published')}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '3px',
                              fontSize: '11px'
                            }}
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(konten._id, 'rejected')}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '3px',
                              fontSize: '11px'
                            }}
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                      
                      {/* Admin bisa edit dan hapus semua konten */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => navigate(`/konten-budaya/edit/${konten._id}`)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#ff9800',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '3px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(konten._id)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '3px'
                            }}
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default KontenBudayaList;