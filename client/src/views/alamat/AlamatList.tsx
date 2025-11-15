import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Alamat {
  _id: string;
  label_alamat: string;
  nama_penerima: string;
  no_telepon: string;
  alamat_lengkap: string;
  provinsiNama: string;
  kabupatenNama: string;
  kecamatanNama: string;
  kelurahanNama: string;
  kode_pos: string;
  catatan: string;
  is_default: boolean;
}

const AlamatList: React.FC = () => {
  const navigate = useNavigate();
  const [alamatList, setAlamatList] = useState<Alamat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlamat();
  }, []);

  const fetchAlamat = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      const res = await axios.get(`http://localhost:5000/api/alamat/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlamatList(res.data);
    } catch (err) {
      console.error('Error fetching alamat:', err);
      alert('Gagal memuat daftar alamat');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/alamat/${id}/set-default`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Alamat default berhasil diubah');
      fetchAlamat();
    } catch (err) {
      console.error('Error setting default:', err);
      alert('Gagal mengubah alamat default');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus alamat ini?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/alamat/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Alamat berhasil dihapus');
      fetchAlamat();
    } catch (err) {
      console.error('Error deleting alamat:', err);
      alert('Gagal menghapus alamat');
    }
  };

  if (loading) {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
    );
  }

  return (
      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1>Daftar Alamat</h1>
          <button
            onClick={() => navigate('/alamat/create')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            + Tambah Alamat
          </button>
        </div>

        {alamatList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <p>Belum ada alamat tersimpan</p>
            <button
              onClick={() => navigate('/alamat/create')}
              style={{
                marginTop: '20px',
                padding: '10px 30px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Tambah Alamat Pertama
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {alamatList.map(alamat => (
              <div
                key={alamat._id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: alamat.is_default ? '#f0f8ff' : 'white',
                  position: 'relative'
                }}
              >
                {alamat.is_default && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    DEFAULT
                  </div>
                )}

                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ fontSize: '18px' }}>
                    {alamat.label_alamat || 'Alamat'}
                  </strong>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <strong>{alamat.nama_penerima}</strong> | {alamat.no_telepon}
                </div>

                <div style={{ marginBottom: '8px', color: '#555' }}>
                  {alamat.alamat_lengkap}
                </div>

                <div style={{ marginBottom: '8px', color: '#777', fontSize: '14px' }}>
                  {alamat.kelurahanNama !== '-' && `${alamat.kelurahanNama}, `}
                  {alamat.kecamatanNama !== '-' && `${alamat.kecamatanNama}, `}
                  {alamat.kabupatenNama !== '-' && `${alamat.kabupatenNama}, `}
                  {alamat.provinsiNama}
                  {alamat.kode_pos && ` - ${alamat.kode_pos}`}
                </div>

                {alamat.catatan && (
                  <div style={{ marginBottom: '8px', fontSize: '14px', fontStyle: 'italic', color: '#888' }}>
                    Catatan: {alamat.catatan}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  {!alamat.is_default && (
                    <button
                      onClick={() => handleSetDefault(alamat._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      Jadikan Default
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate(`/alamat/edit/${alamat._id}`)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#FF9800',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDelete(alamat._id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
};

export default AlamatList;