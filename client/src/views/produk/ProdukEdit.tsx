import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

interface Kategori {
  _id: string;
  nama_kategori: string;
}

interface Spesifikasi {
  nama: string;
  nilai: string;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

const ProdukEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [formData, setFormData] = useState({
    nama_produk: '',
    deskripsi: '',
    harga: '',
    harga_modal: '',
    stok: '',
    berat: '',
    kategori: '',
    tags: '',
    tanggal_kadaluarsa: '',
  });
  const [media, setMedia] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<MediaItem[]>([]);
  const [spesifikasi, setSpesifikasi] = useState<Spesifikasi[]>([{ nama: '', nilai: '' }]);

  useEffect(() => {
    fetchKategori();
    fetchProduk();
  }, [id]);

  const fetchKategori = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/kategori');
      setKategori(res.data);
    } catch (error) {
      console.error('Error fetching kategori:', error);
    }
  };

  const fetchProduk = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/produk/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const produk = res.data;
      setFormData({
        nama_produk: produk.nama_produk,
        deskripsi: produk.deskripsi || '',
        harga: produk.harga?.toString() || '',
        harga_modal: produk.harga_modal?.toString() || '',
        stok: produk.stok?.toString() || '',
        berat: produk.berat?.toString() || '',
        kategori: produk.kategori?._id || '',
        tags: produk.tags?.join(', ') || '',
        tanggal_kadaluarsa: produk.tanggal_kadaluarsa
          ? new Date(produk.tanggal_kadaluarsa).toISOString().split('T')[0]
          : '',
      });
      setSpesifikasi(produk.spesifikasi?.length ? produk.spesifikasi : [{ nama: '', nilai: '' }]);
      setExistingMedia(produk.media || []);
    } catch (error) {
      console.error('Error fetching produk:', error);
      alert('Gagal memuat data produk');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setMedia(files);

      // Generate previews
      const previews = files.map(file => URL.createObjectURL(file));
      setMediaPreviews(previews);
    }
  };

  const handleSpesifikasiChange = (index: number, field: 'nama' | 'nilai', value: string) => {
    const newSpesifikasi = [...spesifikasi];
    newSpesifikasi[index][field] = value;
    setSpesifikasi(newSpesifikasi);
  };

  const addSpesifikasi = () => setSpesifikasi([...spesifikasi, { nama: '', nilai: '' }]);
  const removeSpesifikasi = (index: number) =>
    setSpesifikasi(spesifikasi.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const data = new FormData();

      data.append('nama_produk', formData.nama_produk);
      data.append('deskripsi', formData.deskripsi);
      data.append('harga', Number(formData.harga).toString());
      if (formData.harga_modal) data.append('harga_modal', Number(formData.harga_modal).toString());
      data.append('stok', Number(formData.stok).toString());
      if (formData.berat) data.append('berat', Number(formData.berat).toString());
      data.append('kategori', formData.kategori);
      if (formData.tanggal_kadaluarsa)
        data.append('tanggal_kadaluarsa', formData.tanggal_kadaluarsa);

      data.append('spesifikasi', JSON.stringify(spesifikasi.filter((sp) => sp.nama && sp.nilai)));

      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map((t) => t.trim()).filter((t) => t);
        data.append('tags', JSON.stringify(tagsArray));
      }

      if (media.length > 0) {
        media.forEach((file) => data.append('media', file));
      }

      await axios.put(`http://localhost:5000/api/produk/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Produk berhasil diupdate!');
      navigate('/produk/list');
    } catch (error: any) {
      console.error('Error updating produk:', error);
      alert(error.response?.data?.message || 'Gagal mengupdate produk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Edit Produk</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nama Produk */}
            <div>
              <label className="block text-sm font-medium mb-2">Nama Produk *</label>
              <input
                type="text"
                name="nama_produk"
                value={formData.nama_produk}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium mb-2">Deskripsi</label>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Harga, Modal, Stok, Berat */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Harga *</label>
                <input
                  type="number"
                  name="harga"
                  value={formData.harga}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Harga Modal</label>
                <input
                  type="number"
                  name="harga_modal"
                  value={formData.harga_modal}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stok *</label>
                <input
                  type="number"
                  name="stok"
                  value={formData.stok}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Berat (gram)</label>
                <input
                  type="number"
                  name="berat"
                  value={formData.berat}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-medium mb-2">Kategori *</label>
              <select
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-green-500"
              >
                <option value="">Pilih Kategori</option>
                {kategori.map((kat) => (
                  <option key={kat._id} value={kat._id}>
                    {kat.nama_kategori}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags (pisah koma)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Tanggal Kadaluarsa */}
            <div>
              <label className="block text-sm font-medium mb-2">Tanggal Kadaluarsa</label>
              <input
                type="date"
                name="tanggal_kadaluarsa"
                value={formData.tanggal_kadaluarsa}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Spesifikasi */}
            <div>
              <label className="block text-sm font-medium mb-2">Spesifikasi</label>
              {spesifikasi.map((sp, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nama"
                    value={sp.nama}
                    onChange={(e) => handleSpesifikasiChange(idx, 'nama', e.target.value)}
                    className="flex-1 px-2 py-1 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Nilai"
                    value={sp.nilai}
                    onChange={(e) => handleSpesifikasiChange(idx, 'nilai', e.target.value)}
                    className="flex-1 px-2 py-1 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpesifikasi(idx)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    X
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSpesifikasi}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Tambah Spesifikasi
              </button>
            </div>

            {/* Media Saat Ini */}
            {existingMedia.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Foto/Video Saat Ini</label>
                <div className="grid grid-cols-5 gap-2">
                  {existingMedia.map((item, idx) => (
                    <div key={idx} className="relative">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={`Media ${idx + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-20 object-cover rounded"
                          controls
                        />
                      )}
                      <span className="absolute top-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {item.type === 'video' ? '🎬' : '🖼️'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Media Baru */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Ganti Foto/Video Produk (opsional, maks 5)
              </label>
              <p className="text-xs text-gray-500 mb-2">Format: JPG, PNG, GIF, WEBP, MP4, AVI, MOV, MKV, WEBM (Max 50MB)</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded"
              />
              {media.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">{media.length} file baru dipilih</p>
                  <div className="grid grid-cols-5 gap-2">
                    {media.map((file, idx) => (
                      <div key={idx} className="relative">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={mediaPreviews[idx]}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                        ) : (
                          <video
                            src={mediaPreviews[idx]}
                            className="w-full h-20 object-cover rounded"
                            controls
                          />
                        )}
                        <span className="absolute top-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {file.type.startsWith('video/') ? '🎬' : '🖼️'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Menyimpan...' : 'Update Produk'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/produk/list')}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ProdukEdit;