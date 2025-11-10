import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Layout";

const PenggunaList: React.FC = () => {
  const [penggunaList, setPenggunaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPengguna();
  }, []);

  const fetchPengguna = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/pengguna', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPenggunaList(res.data);
    } catch (err) {
      console.error('Error fetching pengguna:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/pengguna/${id}/status`,
        { status_akun: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Status berhasil diubah');
      fetchPengguna();
    } catch (err) {
      alert('Gagal mengubah status');
    }
  };

  return (
    <Layout>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Daftar Pengguna</h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Nama</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {penggunaList.map(p => (
                <tr key={p._id}>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.nama_lengkap}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.email}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.role}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.status_akun}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <select
                      value={p.status_akun}
                      onChange={(e) => handleStatusChange(p._id, e.target.value)}
                      style={{ padding: '6px' }}
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                      <option value="banned">Banned</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default PenggunaList;
