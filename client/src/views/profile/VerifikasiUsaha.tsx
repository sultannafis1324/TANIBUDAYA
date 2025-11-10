import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

const VerifikasiUsaha: React.FC = () => {
  const [usahaList, setUsahaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchUsaha();
  }, [filter]);

  const fetchUsaha = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/profile-usaha?status_verifikasi=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsahaList(res.data);
    } catch (err) {
      console.error('Error fetching usaha:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifikasi = async (id: string, status: string) => {
    const alasan = status === 'rejected' ? prompt('Alasan penolakan:') : '';
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/profile-usaha/${id}/status`,
        { status_verifikasi: status, alasan_reject: alasan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Status berhasil diupdate');
      fetchUsaha();
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal update status');
    }
  };

  return (
    <Layout>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Verifikasi Usaha</h1>

        <div style={{ marginBottom: '20px' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '8px', fontSize: '16px' }}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : usahaList.length === 0 ? (
          <div>Tidak ada data</div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {usahaList.map(usaha => (
              <div key={usaha._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
                <h3>{usaha.nama_usaha}</h3>
                <p><strong>Pemilik:</strong> {usaha.id_pengguna?.nama_lengkap}</p>
                <p><strong>Email:</strong> {usaha.id_pengguna?.email}</p>
                <p><strong>Bidang:</strong> {usaha.bidang_usaha}</p>
                <p><strong>NPWP:</strong> {usaha.npwp || '-'}</p>
                <p><strong>Status:</strong> {usaha.status_verifikasi}</p>

                {usaha.status_verifikasi === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleVerifikasi(usaha._id, 'approved')}
                      style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerifikasi(usaha._id, 'rejected')}
                      style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VerifikasiUsaha;