import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    no_telepon: '',
    tanggal_lahir: '',
    jenis_kelamin: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      const res = await axios.get(`http://localhost:5000/api/pengguna/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data;
      setFormData({
        nama_lengkap: data.nama_lengkap || '',
        email: data.email || '',
        no_telepon: data.no_telepon || '',
        tanggal_lahir: data.tanggal_lahir ? data.tanggal_lahir.split('T')[0] : '',
        jenis_kelamin: data.jenis_kelamin || ''
      });

      if (data.foto_profil) {
        setPreviewUrl(data.foto_profil);
      }

      setLoadingData(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      alert('Gagal memuat data profil');
      navigate('/profile');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const data = new FormData();
      
      // Tambahkan semua field form
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key as keyof typeof formData]);
      });

      // Tambahkan file foto jika ada
      if (fotoFile) {
        data.append('foto', fotoFile);
      }

      await axios.put(`http://localhost:5000/api/pengguna/${userId}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Profil berhasil diupdate!');
      navigate('/profile');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert(err.response?.data?.message || 'Gagal update profil');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
    );
  }

  return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Edit Profil</h1>
        
        <form onSubmit={handleSubmit}>
          {/* Preview Foto */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview"
                style={{ 
                  width: '150px', 
                  height: '150px', 
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #ddd'
                }}
              />
            ) : (
              <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                backgroundColor: '#ddd',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: 'white'
              }}>
                {formData.nama_lengkap.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Foto Profil</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
            <small style={{ color: '#666' }}>Format: JPG, PNG (Max 2MB)</small>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Nama Lengkap *</label>
            <input
              type="text"
              value={formData.nama_lengkap}
              onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled
              style={{ width: '100%', padding: '8px', marginTop: '5px', backgroundColor: '#f5f5f5' }}
            />
            <small style={{ color: '#666' }}>Email tidak bisa diubah</small>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>No Telepon</label>
            <input
              type="tel"
              value={formData.no_telepon}
              onChange={(e) => setFormData({ ...formData, no_telepon: e.target.value })}
              placeholder="08xxxxxxxxxx"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Tanggal Lahir</label>
            <input
              type="date"
              value={formData.tanggal_lahir}
              onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Jenis Kelamin</label>
            <select
              value={formData.jenis_kelamin}
              onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="">Pilih Jenis Kelamin</option>
              <option value="laki-laki">Laki-laki</option>
              <option value="perempuan">Perempuan</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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

        {/* Ubah Password */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <h3>Keamanan Akun</h3>
          <p style={{ color: '#666' }}>
            Untuk mengubah password, silakan hubungi administrator atau gunakan fitur lupa password.
          </p>
        </div>
      </div>
  );
};

export default EditProfile;