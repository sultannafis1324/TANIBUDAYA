import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

const ProfileUsaha: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasUsaha, setHasUsaha] = useState(false);
  const [usaha, setUsaha] = useState<any>(null);
  const [alamatList, setAlamatList] = useState<any[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [dokumenFiles, setDokumenFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    nama_usaha: '',
    deskripsi_usaha: '',
    bidang_usaha: '',
    email_usaha: '',
    no_telepon_usaha: '',
    id_alamat_usaha: '',
    npwp: ''
  });

  useEffect(() => {
    checkExistingUsaha();
    fetchAlamat();
  }, []);

  const checkExistingUsaha = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      const res = await axios.get(`http://localhost:5000/api/profile-usaha/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsaha(res.data);
      setHasUsaha(true);
      setFormData({
        nama_usaha: res.data.nama_usaha || '',
        deskripsi_usaha: res.data.deskripsi_usaha || '',
        bidang_usaha: res.data.bidang_usaha || '',
        email_usaha: res.data.email_usaha || '',
        no_telepon_usaha: res.data.no_telepon_usaha || '',
        id_alamat_usaha: res.data.id_alamat_usaha?._id || '',
        npwp: res.data.npwp || ''
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setHasUsaha(false);
      }
    }
  };

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const data = new FormData();
      data.append('data', JSON.stringify({
        ...formData,
        id_pengguna: userId
      }));

      if (logoFile) {
        data.append('logo', logoFile);
      }

      dokumenFiles.forEach(file => {
        data.append('dokumen', file);
      });

      if (hasUsaha && usaha) {
        await axios.put(`http://localhost:5000/api/profile-usaha/${usaha._id}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert('Profile usaha berhasil diupdate!');
      } else {
        await axios.post('http://localhost:5000/api/profile-usaha', data, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert('Profile usaha berhasil dibuat! Menunggu verifikasi admin.');
      }

      navigate('/profile');
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.response?.data?.message || 'Gagal menyimpan profile usaha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>{hasUsaha ? 'Edit Profile Usaha' : 'Daftar Usaha Baru'}</h1>
        
        {hasUsaha && usaha && (
          <div style={{
            padding: '15px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <strong>Status Verifikasi: </strong>
            <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              {usaha.status_verifikasi}
            </span>
            {usaha.status_verifikasi === 'rejected' && usaha.alasan_reject && (
              <div style={{ marginTop: '10px', color: '#d32f2f' }}>
                <strong>Alasan Ditolak:</strong> {usaha.alasan_reject}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>Nama Usaha *</label>
            <input
              type="text"
              value={formData.nama_usaha}
              onChange={(e) => setFormData({ ...formData, nama_usaha: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Bidang Usaha</label>
            <input
              type="text"
              value={formData.bidang_usaha}
              onChange={(e) => setFormData({ ...formData, bidang_usaha: e.target.value })}
              placeholder="Pertanian, Kerajinan, dll"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Deskripsi Usaha</label>
            <textarea
              value={formData.deskripsi_usaha}
              onChange={(e) => setFormData({ ...formData, deskripsi_usaha: e.target.value })}
              rows={5}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Logo Usaha</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && setLogoFile(e.target.files[0])}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Email Usaha</label>
            <input
              type="email"
              value={formData.email_usaha}
              onChange={(e) => setFormData({ ...formData, email_usaha: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>No Telepon Usaha</label>
            <input
              type="tel"
              value={formData.no_telepon_usaha}
              onChange={(e) => setFormData({ ...formData, no_telepon_usaha: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Alamat Usaha *</label>
            <select
              value={formData.id_alamat_usaha}
              onChange={(e) => setFormData({ ...formData, id_alamat_usaha: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="">Pilih Alamat</option>
              {alamatList.map(a => (
                <option key={a._id} value={a._id}>
                  {a.label_alamat || 'Alamat'} - {a.nama_penerima}
                </option>
              ))}
            </select>
            {alamatList.length === 0 && (
              <small style={{ color: '#d32f2f' }}>
                Belum ada alamat. <a href="/alamat/create">Tambah alamat</a>
              </small>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>NPWP (opsional)</label>
            <input
              type="text"
              value={formData.npwp}
              onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
              placeholder="00.000.000.0-000.000"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Dokumen Verifikasi (KTP, Surat Usaha, dll)</label>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files && setDokumenFiles(Array.from(e.target.files))}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: '4px'
              }}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#999',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ProfileUsaha;