import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Produk {
  _id: string;
  nama_produk: string;
  slug: string;
  deskripsi: string;
  harga: number;
  stok: number;
  media: { url: string; type: string }[];
  kategori: { nama_kategori: string };
  id_penjual: { _id: string; nama_usaha: string; alamat_usaha: string };
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
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

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

  const handleAddToCart = async () => {
    if (!token) {
      alert('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }

    if (userType !== 'pengguna') {
      alert('Hanya pengguna yang dapat menambahkan produk ke keranjang');
      return;
    }

    setAddingToCart(true);
    try {
      await axios.post(
        'http://localhost:5000/api/keranjang',
        {
          id_produk: produk?._id,
          jumlah: quantity
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Produk berhasil ditambahkan ke keranjang!');
      setQuantity(1);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menambahkan ke keranjang');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!token) {
      alert('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }

    if (userType !== 'pengguna') {
      alert('Hanya pengguna yang dapat melakukan pembelian');
      return;
    }

    if (!produk) return;

    setBuyingNow(true);
    try {
      // 1. Tambahkan ke keranjang dulu
      const cartRes = await axios.post(
        'http://localhost:5000/api/keranjang',
        {
          id_produk: produk._id,
          jumlah: quantity
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const cartItemId = cartRes.data.data._id;

      // 2. Langsung redirect ke checkout dengan item yang baru ditambahkan
      navigate('/checkout', {
        state: {
          selectedItems: [cartItemId],
          id_penjual: produk.id_penjual._id
        }
      });

    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal memproses pembelian');
      setBuyingNow(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!produk) return <div className="p-8 text-center">Produk tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <button
          onClick={() => navigate('/marketplace')}
          className="mb-4 text-green-600 hover:underline flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Marketplace
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div>
            <img
              src={produk.media[0]?.url || 'https://via.placeholder.com/500'}
              alt={produk.nama_produk}
              className="w-full h-96 object-cover rounded-lg"
            />

            {/* Thumbnail Gallery (if multiple images) */}
            {produk.media.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {produk.media.slice(0, 4).map((item, idx) => (
                  <img
                    key={idx}
                    src={item.url}
                    alt={`${produk.nama_produk} ${idx + 1}`}
                    className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-75 transition"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {produk.kategori.nama_kategori}
            </span>
            <h1 className="text-3xl font-bold mt-2 mb-4 text-gray-800 dark:text-gray-200">
              {produk.nama_produk}
            </h1>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-yellow-500">★ {produk.rating_produk}</span>
              <span className="text-gray-600 dark:text-gray-400">
                ({produk.jumlah_ulasan} ulasan)
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Terjual: {produk.jumlah_terjual}
              </span>
            </div>

            <p className="text-4xl font-bold text-green-600 mb-6">
              Rp {produk.harga.toLocaleString('id-ID')}
            </p>

            <div className="border-t dark:border-gray-700 pt-4 mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">{produk.deskripsi}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stok tersedia: <span className="font-semibold">{produk.stok}</span>
              </p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Jumlah:</span>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 border dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                -
              </button>
              <span className="px-4 text-gray-800 dark:text-gray-200">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(produk.stok, quantity + 1))}
                className="px-3 py-1 border dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                +
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={produk.stok === 0 || addingToCart}
                className={`flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                  produk.stok > 0
                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {addingToCart ? 'Menambahkan...' : '+ Keranjang'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={produk.stok === 0 || buyingNow}
                className={`flex-1 py-3 rounded-lg font-semibold ${
                  produk.stok > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {buyingNow ? 'Memproses...' : produk.stok > 0 ? 'Beli Sekarang' : 'Stok Habis'}
              </button>
            </div>

            {/* Link to Cart */}
            {token && userType === 'pengguna' && (
              <button
                onClick={() => navigate('/keranjang')}
                className="w-full py-2 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Lihat Keranjang →
              </button>
            )}

            {/* Seller Info */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Penjual</h3>
              <p className="text-gray-700 dark:text-gray-300">{produk.id_penjual.nama_usaha}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {produk.id_penjual.alamat_usaha}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProdukShow;