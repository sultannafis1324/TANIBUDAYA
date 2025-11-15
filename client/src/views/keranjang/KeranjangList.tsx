import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface KeranjangItem {
  _id: string;
  id_produk: {
    _id: string;
    nama_produk: string;
    harga: number;
    stok: number;
    media: { url: string; type: string }[];
    status: string;
    slug: string;
    id_penjual: string;
  };
  id_penjual: {
    _id: string;
    nama_usaha: string;
    foto_profil?: string;
  };
  jumlah: number;
  subtotal: number;
  checked: boolean;
}

interface GroupedKeranjang {
  id_penjual: string;
  nama_usaha: string;
  foto_profil?: string;
  items: KeranjangItem[];
}

const KeranjangList: React.FC = () => {
  const navigate = useNavigate();
  const [keranjang, setKeranjang] = useState<GroupedKeranjang[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  // ✅ Set default values untuk menghindari undefined
  const [summary, setSummary] = useState({ 
    totalItems: 0, 
    totalHarga: 0, 
    jumlahProduk: 0 
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchKeranjang();
    fetchSummary();
  }, []);

  const fetchKeranjang = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await axios.get('http://localhost:5000/api/keranjang', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Keranjang Response:", res.data);
      
      // ✅ Pastikan data adalah array
      const data = Array.isArray(res.data) ? res.data : [];
      setKeranjang(data);
      
    } catch (error: any) {
      console.error('Error fetching keranjang:', error);
      setError(error.response?.data?.message || 'Gagal memuat keranjang');
      setKeranjang([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/keranjang/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Summary Response:", res.data);
      
      // ✅ Set dengan fallback values
      setSummary({
        totalItems: res.data?.totalItems || 0,
        totalHarga: res.data?.totalHarga || 0,
        jumlahProduk: res.data?.jumlahProduk || 0
      });
      
    } catch (error: any) {
      console.error('Error fetching summary:', error);
      // Keep default values if error
      setSummary({ totalItems: 0, totalHarga: 0, jumlahProduk: 0 });
    }
  };

  const handleUpdateJumlah = async (itemId: string, newJumlah: number) => {
    if (newJumlah < 1) return;
    
    try {
      await axios.put(
        `http://localhost:5000/api/keranjang/${itemId}/jumlah`,
        { jumlah: newJumlah },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh both keranjang and summary
      await Promise.all([fetchKeranjang(), fetchSummary()]);
      
    } catch (error: any) {
      console.error('Error update jumlah:', error);
      alert(error.response?.data?.message || 'Gagal update jumlah');
    }
  };

  const handleToggleCheck = async (itemId: string) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/keranjang/${itemId}/check`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh both
      await Promise.all([fetchKeranjang(), fetchSummary()]);
      
    } catch (error) {
      console.error('Error toggle check:', error);
    }
  };

  const handleToggleAllPenjual = async (penjualId: string) => {
    try {
      await axios.patch(
        'http://localhost:5000/api/keranjang/check-all-penjual',
        { id_penjual: penjualId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh both
      await Promise.all([fetchKeranjang(), fetchSummary()]);
      
    } catch (error) {
      console.error('Error toggle all penjual:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Hapus produk dari keranjang?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/keranjang/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh both
      await Promise.all([fetchKeranjang(), fetchSummary()]);
      
    } catch (error) {
      console.error('Error delete item:', error);
      alert('Gagal menghapus item');
    }
  };

  const handleCheckout = () => {
    if (summary.jumlahProduk === 0) {
      alert('Pilih produk yang ingin dibeli');
      return;
    }

    // Get checked items
    const checkedItems = keranjang.flatMap(group => 
      group.items.filter(item => item.checked)
    );

    if (checkedItems.length === 0) {
      alert('Pilih produk yang ingin dibeli');
      return;
    }

    // Validasi: semua item harus dari penjual yang sama
    const firstSellerId = checkedItems[0].id_produk.id_penjual;
    const sameSeller = checkedItems.every(item => 
      item.id_produk.id_penjual === firstSellerId
    );

    if (!sameSeller) {
      alert('Anda hanya bisa checkout produk dari 1 penjual yang sama. Silakan pilih produk dari penjual yang sama.');
      return;
    }

    // Validasi: cek stok dan status produk
    const invalidItems = checkedItems.filter(item => 
      item.id_produk.status !== 'aktif' || item.jumlah > item.id_produk.stok
    );

    if (invalidItems.length > 0) {
      alert('Ada produk yang tidak tersedia atau stok tidak mencukupi. Mohon periksa kembali.');
      return;
    }

    // Navigate ke checkout dengan item yang dipilih
    const selectedItemIds = checkedItems.map(item => item._id);
    navigate('/checkout', {
      state: {
        selectedItems: selectedItemIds,
        id_penjual: firstSellerId
      }
    });
  };

  // ✅ Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat keranjang...</p>
        </div>
      </div>
    );
  }

  // ✅ Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Gagal Memuat Keranjang
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError("");
              fetchKeranjang();
              fetchSummary();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ✅ Empty State
  if (keranjang.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
            <svg
              className="w-24 h-24 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Keranjang Kosong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Belum ada produk di keranjang Anda
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Mulai Belanja
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">
          Keranjang Belanja
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* List Produk */}
          <div className="lg:col-span-2 space-y-4">
            {keranjang.map((group) => (
              <div
                key={group.id_penjual}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                {/* Header Penjual */}
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={group.items.every((item) => item.checked)}
                      onChange={() => handleToggleAllPenjual(group.id_penjual)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex items-center gap-2">
                      {group.foto_profil && (
                        <img
                          src={group.foto_profil}
                          alt={group.nama_usaha}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {group.nama_usaha}
                      </span>
                    </div>
                  </div>
                </div>

                {/* List Item */}
                <div className="divide-y dark:divide-gray-700">
                  {group.items.map((item) => (
                    <div key={item._id} className="p-4 flex gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleCheck(item._id)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mt-2"
                      />

                      {/* Image */}
                      <img
                        src={item.id_produk.media[0]?.url || 'https://via.placeholder.com/100'}
                        alt={item.id_produk.nama_produk}
                        className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                        onClick={() => navigate(`/produk/${item.id_produk.slug}`)}
                      />

                      {/* Info */}
                      <div className="flex-1">
                        <h3
                          className="font-semibold text-gray-800 dark:text-gray-200 mb-1 cursor-pointer hover:text-green-600"
                          onClick={() => navigate(`/produk/${item.id_produk.slug}`)}
                        >
                          {item.id_produk.nama_produk}
                        </h3>
                        <p className="text-lg font-bold text-green-600 mb-2">
                          Rp {(item.id_produk.harga || 0).toLocaleString('id-ID')}
                        </p>

                        {/* Stock Info */}
                        {item.id_produk.status !== 'aktif' && (
                          <span className="text-sm text-red-600">Produk tidak tersedia</span>
                        )}
                        {item.jumlah > item.id_produk.stok && (
                          <span className="text-sm text-red-600">Stok tidak mencukupi</span>
                        )}

                        {/* Subtotal */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Subtotal: <span className="font-semibold text-gray-800 dark:text-gray-200">
                            Rp {(item.subtotal || 0).toLocaleString('id-ID')}
                          </span>
                        </p>
                      </div>

                      {/* Quantity & Delete */}
                      <div className="flex flex-col justify-between items-end">
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>

                        <div className="flex items-center gap-2 border dark:border-gray-600 rounded-lg">
                          <button
                            onClick={() => handleUpdateJumlah(item._id, item.jumlah - 1)}
                            disabled={item.jumlah <= 1}
                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <span className="px-3 text-gray-800 dark:text-gray-200">
                            {item.jumlah}
                          </span>
                          <button
                            onClick={() => handleUpdateJumlah(item._id, item.jumlah + 1)}
                            disabled={item.jumlah >= item.id_produk.stok}
                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Checkout - Desktop */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-20">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Ringkasan Belanja
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Total Item</span>
                  <span className="font-semibold">{summary.totalItems || 0}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Produk Dipilih</span>
                  <span className="font-semibold">{summary.jumlahProduk || 0}</span>
                </div>
                <div className="border-t dark:border-gray-600 pt-3 flex justify-between">
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Total Harga
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    Rp {(summary.totalHarga || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={summary.jumlahProduk === 0}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Checkout ({summary.jumlahProduk || 0})
              </button>

              <button
                onClick={() => navigate('/marketplace')}
                className="w-full mt-3 py-3 border border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
              >
                Lanjut Belanja
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg p-4 z-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total ({summary.jumlahProduk || 0} item)
            </p>
            <p className="text-lg font-bold text-green-600">
              Rp {(summary.totalHarga || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={summary.jumlahProduk === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeranjangList;