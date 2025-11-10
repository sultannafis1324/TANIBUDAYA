import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

interface Produk {
  _id: string;
  nama_produk: string;
  slug: string;
  deskripsi: string;
  harga: number;
  stok: number;
  media: { url: string; type: string }[];
  kategori: { nama_kategori: string };
  id_penjual: { nama_usaha: string; alamat_usaha: string };
  rating_produk: number;
  jumlah_ulasan: number;
  jumlah_terjual: number;
}

const ProdukShow: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [produk, setProduk] = useState<Produk | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduk();
  }, [slug]);

  const fetchProduk = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/marketplace/slug/${slug}`);
      setProduk(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching produk:', error);
      setLoading(false);
    }
  };

  const handleBuy = () => {
    alert(`Membeli ${quantity} ${produk?.nama_produk}`);
    // Implementasi keranjang/checkout bisa ditambah di sini
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!produk) return <div className="p-8 text-center">Produk tidak ditemukan</div>;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <button
            onClick={() => navigate('/marketplace')}
            className="mb-4 text-green-600 hover:underline"
          >
            ← Kembali ke Marketplace
          </button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Image */}
            <div>
              <img
                src={produk.media[0]?.url || 'https://via.placeholder.com/500'}
                alt={produk.nama_produk}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>

            {/* Info */}
            <div>
              <span className="text-sm text-gray-600">{produk.kategori.nama_kategori}</span>
              <h1 className="text-3xl font-bold mt-2 mb-4">{produk.nama_produk}</h1>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-yellow-500">★ {produk.rating_produk}</span>
                <span className="text-gray-600">({produk.jumlah_ulasan} ulasan)</span>
                <span className="text-gray-600">Terjual: {produk.jumlah_terjual}</span>
              </div>

              <p className="text-4xl font-bold text-green-600 mb-6">
                Rp {produk.harga.toLocaleString('id-ID')}
              </p>

              <div className="border-t pt-4 mb-4">
                <p className="text-gray-700 mb-4">{produk.deskripsi}</p>
                <p className="text-sm text-gray-600">Stok tersedia: {produk.stok}</p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="font-semibold">Jumlah:</span>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 border rounded"
                >
                  -
                </button>
                <span className="px-4">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(produk.stok, quantity + 1))}
                  className="px-3 py-1 border rounded"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleBuy}
                disabled={produk.stok === 0}
                className={`w-full py-3 rounded-lg font-semibold ${
                  produk.stok > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {produk.stok > 0 ? 'Beli Sekarang' : 'Stok Habis'}
              </button>

              {/* Seller Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Penjual</h3>
                <p className="text-gray-700">{produk.id_penjual.nama_usaha}</p>
                <p className="text-sm text-gray-600">{produk.id_penjual.alamat_usaha}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProdukShow;
