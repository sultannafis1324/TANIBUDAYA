import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

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

interface Media {
  url: string;
  type: string;
  _id?: string;
}

const KontenBudayaEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [existingMedia, setExistingMedia] = useState<Media[]>([]);

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

  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchKategori();
    fetchProvinces();
    fetchKontenData();
  }, [id]);

  const fetchKontenData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/konten-budaya/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const konten = res.data;
      setFormData({
        judul: konten.judul || '',
        kategori: konten.kategori?._id || '',
        provinsiId: konten.provinsiId || '',
        kabupatenId: konten.kabupatenId || '',
        kecamatanId: konten.kecamatanId || '',
        deskripsi: konten.deskripsi || '',
        latitude: konten.koordinat_peta?.latitude?.toString() || '',
        longitude: konten.koordinat_peta?.longitude?.toString() || '',
        tags: konten.tags?.join(', ') || '',
        sumber_referensi: konten.sumber_referensi?.join(', ') || '',
        status: konten.status || 'draft'
      });

      setExistingMedia(konten.media_konten || []);

      // Fetch regencies and districts based on existing data
      if (konten.provinsiId) {
        fetchRegencies(konten.provinsiId);
      }
      if (konten.kabupatenId) {
        fetchDistricts(konten.kabupatenId);
      }

      setLoadingData(false);
    } catch (err) {
      console.error('Error fetching konten:', err);
      alert('Gagal memuat data konten');
      setLoadingData(false);
    }
  };

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
    } catch (err) {
      console.error('Error fetching regencies:', err);
    }
  };

  const fetchDistricts = async (regencyId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/konten-budaya/districts/${regencyId}`);
      setDistricts(res.data);
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value;
    setFormData({ ...formData, provinsiId: provinceId, kabupatenId: '', kecamatanId: '' });
    setRegencies([]);
    setDistricts([]);
    if (provinceId) {
      fetchRegencies(provinceId);
    }
  };

  const handleRegencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regencyId = e.target.value;
    setFormData({ ...formData, kabupatenId: regencyId, kecamatanId: '' });
    setDistricts([]);
    if (regencyId) {
      fetchDistricts(regencyId);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewMediaFiles(Array.from(e.target.files));
    }
  };

  const removeExistingMedia = (index: number) => {
    const newMedia = existingMedia.filter((_, i) => i !== index);
    setExistingMedia(newMedia);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

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
        media_konten: existingMedia
      };

      data.append('data', JSON.stringify(payload));

      // Append new media files
      newMediaFiles.forEach(file => {
        data.append('media', file);
      });

      await axios.put(`http://localhost:5000/api/konten-budaya/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Konten budaya berhasil diupdate!');
      navigate('/konten-budaya');
    } catch (err: any) {
      console.error('Error updating konten:', err);
      alert(err.response?.data?.message || 'Gagal update konten budaya');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <Layout>
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Edit Konten Budaya</h1>
      
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

        {existingMedia.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <label>Media yang Ada</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {existingMedia.map((media, index) => (
                <div key={index} style={{ position: 'relative', border: '1px solid #ccc', padding: '5px' }}>
                  {media.type === 'image' && (
                    <img src={media.url} alt="media" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                  )}
                  {media.type === 'video' && (
                    <video src={media.url} style={{ width: '100px', height: '100px' }} controls />
                  )}
                  {media.type === 'audio' && (
                    <audio src={media.url} controls style={{ width: '100px' }} />
                  )}
                  <button
                    type="button"
                    onClick={() => removeExistingMedia(index)}
                    style={{
                      position: 'absolute',
                      top: '0',
                      right: '0',
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      padding: '2px 6px',
                      cursor: 'pointer'
                    }}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label>Tambah Media Baru (Gambar/Video/Audio)</label>
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleMediaChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {newMediaFiles.length > 0 && (
            <small>{newMediaFiles.length} file(s) baru akan ditambahkan</small>
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
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
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
            {loading ? 'Menyimpan...' : 'Update'}
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
  </Layout>
  );
};

export default KontenBudayaEdit;