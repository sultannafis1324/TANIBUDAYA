import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Kategori {
  _id: string;
  nama_kategori: string;
}

interface Province {
  id: string;
  name: string;
}

interface Regency {
  id: string;
  name: string;
  province_id: string;
}

interface District {
  id: string;
  name: string;
  regency_id: string;
}

const KontenBudayaCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [formData, setFormData] = useState({
    judul: '',
    kategori: '',
    provinsiId: '',
    kabupatenId: '',
    kecamatanId: '',
    deskripsi: '',
    latitude: '',
    longitude: '',
    tags: '',
    sumber_referensi: '',
    status: 'draft'
  });

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchKategori();
    fetchProvinces();
  }, []);

  const fetchKategori = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/kategori', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKategoriList(res.data);
    } catch (err) {
      console.error('Error fetching kategori:', err);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/konten-budaya/provinces');
      setProvinces(res.data);
    } catch (err) {
      console.error('Error fetching provinces:', err);
    }
  };

  const fetchRegencies = async (provinceId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/konten-budaya/regencies/${provinceId}`);
      setRegencies(res.data);
      setDistricts([]); // Reset districts saat regencies dimuat
    } catch (err) {
      console.error('Error fetching regencies:', err);
    }
  };

  const fetchDistricts = async (regencyId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/konten-budaya/districts/${regencyId}`);
      console.log('Districts loaded:', res.data); // Debug log
      setDistricts(res.data);
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value;
    setFormData({ 
      ...formData, 
      provinsiId: provinceId, 
      kabupatenId: '', 
      kecamatanId: '' 
    });
    setRegencies([]);
    setDistricts([]);
    if (provinceId) {
      fetchRegencies(provinceId);
    }
  };

  const handleRegencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regencyId = e.target.value;
    console.log('Regency selected:', regencyId); // Debug log
    setFormData({ 
      ...formData, 
      kabupatenId: regencyId, 
      kecamatanId: '' 
    });
    setDistricts([]); // Reset districts
    if (regencyId) {
      fetchDistricts(regencyId);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const data = new FormData();
      
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      const sumberArray = formData.sumber_referensi.split(',').map(s => s.trim()).filter(s => s);

      const payload = {
        ...formData,
        tags: tagsArray,
        sumber_referensi: sumberArray,
        koordinat_peta: {
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null
        },
        dibuat_oleh: userId
      };

      data.append('data', JSON.stringify(payload));
      data.append('userId', userId || ''); // Tambahkan userId

      mediaFiles.forEach(file => {
        data.append('media', file);
      });

      await axios.post('http://localhost:5000/api/konten-budaya', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Konten budaya berhasil dibuat!');
      navigate('/konten-budaya');
    } catch (err: any) {
      console.error('Error creating konten:', err);
      alert(err.response?.data?.message || 'Gagal membuat konten budaya');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Buat Konten Budaya Baru</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Judul *</label>
          <input
            type="text"
            value={formData.judul}
            onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Kategori *</label>
          <select
            value={formData.kategori}
            onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">Pilih Kategori</option>
            {kategoriList.map(k => (
              <option key={k._id} value={k._id}>{k.nama_kategori}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Provinsi *</label>
          <select
            value={formData.provinsiId}
            onChange={handleProvinceChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">Pilih Provinsi</option>
            {provinces.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Kabupaten/Kota</label>
          <select
            value={formData.kabupatenId}
            onChange={handleRegencyChange}
            disabled={!formData.provinsiId}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">Pilih Kabupaten/Kota</option>
            {regencies.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Kecamatan</label>
          <select
            value={formData.kecamatanId}
            onChange={(e) => setFormData({ ...formData, kecamatanId: e.target.value })}
            disabled={!formData.kabupatenId}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">Pilih Kecamatan</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {/* Debug info */}
          {formData.kabupatenId && districts.length === 0 && (
            <small style={{ color: '#999' }}>Loading kecamatan...</small>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Deskripsi</label>
          <textarea
            value={formData.deskripsi}
            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
            rows={5}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Latitude</label>
          <input
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Longitude</label>
          <input
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Media (Gambar/Video/Audio) - Max 10 files</label>
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleMediaChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {mediaFiles.length > 0 && (
            <small>{mediaFiles.length} file(s) selected</small>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Tags (pisahkan dengan koma)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="batik, wayang, keris"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Sumber Referensi (pisahkan dengan koma)</label>
          <input
            type="text"
            value={formData.sumber_referensi}
            onChange={(e) => setFormData({ ...formData, sumber_referensi: e.target.value })}
            placeholder="https://example.com, Buku ABC"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="draft">Draft</option>
            <option value="pending">Pending (Kirim ke Admin)</option>
          </select>
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
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/konten-budaya')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#999',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default KontenBudayaCreate;