import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

interface Province {
  id: string;
  name: string;
}

interface Regency {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
}

interface Village {
  id: string;
  name: string;
}

const AlamatCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [formData, setFormData] = useState({
    label_alamat: '',
    nama_penerima: '',
    no_telepon: '',
    alamat_lengkap: '',
    provinsiId: '',
    kabupatenId: '',
    kecamatanId: '',
    kelurahanId: '',
    kode_pos: '',
    catatan: '',
    is_default: false
  });

  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/alamat/provinces');
      setProvinces(res.data);
    } catch (err) {
      console.error('Error fetching provinces:', err);
    }
  };

  const fetchRegencies = async (provinceId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/alamat/regencies/${provinceId}`);
      setRegencies(res.data);
      setDistricts([]);
      setVillages([]);
    } catch (err) {
      console.error('Error fetching regencies:', err);
    }
  };

  const fetchDistricts = async (regencyId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/alamat/districts/${regencyId}`);
      setDistricts(res.data);
      setVillages([]);
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const fetchVillages = async (districtId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/alamat/villages/${districtId}`);
      setVillages(res.data);
    } catch (err) {
      console.error('Error fetching villages:', err);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value;
    setFormData({ 
      ...formData, 
      provinsiId: provinceId, 
      kabupatenId: '', 
      kecamatanId: '',
      kelurahanId: ''
    });
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    if (provinceId) {
      fetchRegencies(provinceId);
    }
  };

  const handleRegencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regencyId = e.target.value;
    setFormData({ 
      ...formData, 
      kabupatenId: regencyId, 
      kecamatanId: '',
      kelurahanId: ''
    });
    setDistricts([]);
    setVillages([]);
    if (regencyId) {
      fetchDistricts(regencyId);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value;
    setFormData({ 
      ...formData, 
      kecamatanId: districtId,
      kelurahanId: ''
    });
    setVillages([]);
    if (districtId) {
      fetchVillages(districtId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const payload = {
        ...formData,
        id_pengguna: userId
      };

      await axios.post('http://localhost:5000/api/alamat', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Alamat berhasil ditambahkan!');
      navigate('/alamat');
    } catch (err: any) {
      console.error('Error creating alamat:', err);
      alert(err.response?.data?.message || 'Gagal menambahkan alamat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Tambah Alamat Baru</h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>Label Alamat (opsional)</label>
            <input
              type="text"
              value={formData.label_alamat}
              onChange={(e) => setFormData({ ...formData, label_alamat: e.target.value })}
              placeholder="Rumah, Kantor, Orang Tua, dll"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Nama Penerima *</label>
            <input
              type="text"
              value={formData.nama_penerima}
              onChange={(e) => setFormData({ ...formData, nama_penerima: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>No Telepon *</label>
            <input
              type="tel"
              value={formData.no_telepon}
              onChange={(e) => setFormData({ ...formData, no_telepon: e.target.value })}
              required
              placeholder="08xxxxxxxxxx"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
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
              onChange={handleDistrictChange}
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
            <label>Kelurahan/Desa</label>
            <select
              value={formData.kelurahanId}
              onChange={(e) => setFormData({ ...formData, kelurahanId: e.target.value })}
              disabled={!formData.kecamatanId}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="">Pilih Kelurahan/Desa</option>
              {villages.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Alamat Lengkap *</label>
            <textarea
              value={formData.alamat_lengkap}
              onChange={(e) => setFormData({ ...formData, alamat_lengkap: e.target.value })}
              required
              rows={4}
              placeholder="Nama jalan, nomor rumah, RT/RW, dll"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Kode Pos</label>
            <input
              type="text"
              value={formData.kode_pos}
              onChange={(e) => setFormData({ ...formData, kode_pos: e.target.value })}
              placeholder="12345"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Catatan (opsional)</label>
            <textarea
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              rows={3}
              placeholder="Patokan, warna rumah, dll"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              />
              Jadikan sebagai alamat default
            </label>
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
              onClick={() => navigate('/alamat')}
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

export default AlamatCreate;