import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface Produk {
  _id: string;
  nama_produk: string;
  harga: number;
  stok: number;
  status: string;
  media: MediaItem[];
  kategori: { nama_kategori: string };
}

const ProdukList: React.FC = () => {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduk();
  }, []);

  const fetchProduk = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/produk', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProduk(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching produk:', error);
      alert('Gagal memuat produk');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/produk/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Produk berhasil dihapus');
      fetchProduk();
    } catch (error) {
      console.error('Error deleting produk:', error);
      alert('Gagal menghapus produk');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Kelola Produk Saya</h1>
            <Link
              to="/produk/create"
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Tambah Produk
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Produk</th>
                  <th className="px-6 py-3 text-left">Kategori</th>
                  <th className="px-6 py-3 text-left">Harga</th>
                  <th className="px-6 py-3 text-left">Stok</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {produk.map((item) => {
                  const firstMedia = item.media[0];
                  return (
                    <tr key={item._id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {firstMedia ? (
                            firstMedia.type === 'image' ? (
                              <img
                                src={firstMedia.url}
                                alt={item.nama_produk}
                                className="w-16 h-16 object-contain rounded bg-gray-50"
                              />
                            ) : (
                              <div className="relative w-16 h-16 bg-gray-50 rounded flex items-center justify-center">
                                <video
                                  src={firstMedia.url}
                                  className="max-w-full max-h-full object-contain rounded"
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-white text-lg bg-black bg-opacity-40 rounded">
                                  ▶️
                                </span>
                              </div>
                            )
                          ) : (
                            <img
                              src="https://via.placeholder.com/50"
                              alt="No media"
                              className="w-16 h-16 object-contain rounded bg-gray-50"
                            />
                          )}
                          <span className="font-medium">{item.nama_produk}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{item.kategori?.nama_kategori}</td>
                      <td className="px-6 py-4">Rp {item.harga.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4">{item.stok}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.status === 'aktif'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/produk/edit/${item._id}`)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {produk.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Belum ada produk. Tambahkan produk pertama Anda!
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default ProdukList;