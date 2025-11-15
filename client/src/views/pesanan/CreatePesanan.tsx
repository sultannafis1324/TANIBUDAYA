import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

interface CartItem {
  _id: string;
  id_produk: {
    _id: string;
    nama_produk: string;
    harga: number;
    media?: { url: string; type: string }[];
    stok: number;
    status: string;
  };
  jumlah: number;
  subtotal: number; // ✅ Sekarang dihitung di backend
}

interface Alamat {
  _id: string;
  nama_penerima: string;
  no_telepon: string;
  alamat_lengkap: string;
  kota: string;
  provinsi: string;
  kode_pos: string;
  is_utama: boolean;
}

const CreatePesanan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [alamatList, setAlamatList] = useState<Alamat[]>([]);
  const [selectedAlamat, setSelectedAlamat] = useState<string>("");
  const [metodePembayaran, setMetodePembayaran] = useState<string>("cash");
  const [kurir, setKurir] = useState<string>("JNE");
  const [ongkir, setOngkir] = useState<number>(15000);
  const [catatanPembeli, setCatatanPembeli] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dari state navigation
  const selectedItems = location.state?.selectedItems || [];
  const id_penjual = location.state?.id_penjual;

  useEffect(() => {
    console.log("Selected Items from state:", selectedItems);
    console.log("ID Penjual from state:", id_penjual);
    
    if (!selectedItems || selectedItems.length === 0) {
      alert("Tidak ada item yang dipilih");
      navigate("/keranjang");
      return;
    }
    
    if (!id_penjual) {
      alert("ID Penjual tidak ditemukan");
      navigate("/keranjang");
      return;
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // ✅ Fetch keranjang
      const cartRes = await axios.get("http://localhost:5000/api/keranjang", {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Cart Response:", cartRes.data);

      // Filter items yang dipilih
      const allItems: CartItem[] = [];
      if (Array.isArray(cartRes.data)) {
        cartRes.data.forEach((group: any) => {
          if (group.items && Array.isArray(group.items)) {
            group.items.forEach((item: any) => {
              if (selectedItems.includes(item._id)) {
                // ✅ Hitung subtotal jika belum ada dari backend
                const subtotal = item.subtotal || (item.id_produk.harga * item.jumlah);
                allItems.push({
                  ...item,
                  subtotal
                });
              }
            });
          }
        });
      }

      console.log("Filtered Items with Subtotals:", allItems);
      
      if (allItems.length === 0) {
        alert("Item tidak ditemukan di keranjang");
        navigate("/keranjang");
        return;
      }

      setCartItems(allItems);

      // ✅ Fetch alamat
      const alamatRes = await axios.get("http://localhost:5000/api/alamat", {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Alamat Response:", alamatRes.data);

      // ✅ Handle berbagai format response
      let alamatData = [];
      if (alamatRes.data.success && alamatRes.data.data) {
        alamatData = alamatRes.data.data;
      } else if (Array.isArray(alamatRes.data)) {
        alamatData = alamatRes.data;
      } else if (alamatRes.data.data && Array.isArray(alamatRes.data.data)) {
        alamatData = alamatRes.data.data;
      }

      console.log("Processed Alamat Data:", alamatData);

      setAlamatList(Array.isArray(alamatData) ? alamatData : []);
      
      // Set alamat utama sebagai default
      if (Array.isArray(alamatData) && alamatData.length > 0) {
        const alamatUtama = alamatData.find((a: Alamat) => a.is_utama);
        if (alamatUtama) {
          setSelectedAlamat(alamatUtama._id);
        } else {
          setSelectedAlamat(alamatData[0]._id);
        }
      }

    } catch (error: any) {
      console.error("Error fetching data:", error);
      const errorMsg = error.response?.data?.message || "Gagal memuat data";
      alert(errorMsg);
      
      // Jangan langsung navigate jika error alamat saja
      if (error.config?.url?.includes('/keranjang')) {
        navigate("/keranjang");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    // ✅ Hitung subtotal dengan benar
    const subtotal = cartItems.reduce((sum, item) => {
      const itemSubtotal = item.subtotal || (item.id_produk.harga * item.jumlah);
      return sum + itemSubtotal;
    }, 0);
    
    const biayaAdmin = metodePembayaran === "cash" ? 0 : 2000;
    const totalBayar = subtotal + ongkir + biayaAdmin;

    console.log("Calculate Totals:", { subtotal, ongkir, biayaAdmin, totalBayar });

    return { subtotal, biayaAdmin, totalBayar };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAlamat) {
      alert("Pilih alamat pengiriman");
      return;
    }

    if (!metodePembayaran) {
      alert("Pilih metode pembayaran");
      return;
    }

    try {
      setSubmitting(true);

      const { subtotal, biayaAdmin, totalBayar } = calculateTotals();

      // ✅ Prepare items dengan subtotal yang sudah dihitung
      const items = cartItems.map(item => {
        const itemSubtotal = item.subtotal || (item.id_produk.harga * item.jumlah);
        return {
          id_produk: item.id_produk._id,
          nama_produk: item.id_produk.nama_produk,
          harga_satuan: item.id_produk.harga,
          jumlah: item.jumlah,
          subtotal: itemSubtotal
        };
      });

      const payload = {
        id_penjual,
        items,
        total_harga_produk: subtotal,
        ongkir,
        biaya_admin: biayaAdmin,
        diskon: 0,
        total_bayar: totalBayar,
        alamat_pengiriman: selectedAlamat,
        kurir,
        catatan_pembeli: catatanPembeli,
        metode_pembayaran: metodePembayaran
      };

      console.log("Creating pesanan with payload:", payload);

      const res = await axios.post(
        "http://localhost:5000/api/pesanan",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Pesanan Response:", res.data);

      const pesananId = res.data.data.pesanan._id;
      const paymentData = res.data.data.payment;

      // Hapus item dari keranjang
      for (const itemId of selectedItems) {
        try {
          await axios.delete(`http://localhost:5000/api/keranjang/${itemId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (delErr) {
          console.error("Error deleting cart item:", delErr);
        }
      }

      // Jika cash, langsung ke halaman pesanan
      if (metodePembayaran === "cash") {
        alert("Pesanan berhasil dibuat!");
        navigate(`/pesanan/${pesananId}`);
      } else {
        // Jika online payment, redirect ke Midtrans
        if (paymentData.snap_token && (window as any).snap) {
          (window as any).snap.pay(paymentData.snap_token, {
            onSuccess: function() {
              navigate(`/pesanan/${pesananId}`);
            },
            onPending: function() {
              navigate(`/pesanan/${pesananId}`);
            },
            onError: function() {
              alert("Pembayaran gagal");
              navigate(`/pesanan/${pesananId}`);
            },
            onClose: function() {
              navigate(`/pesanan/${pesananId}`);
            }
          });
        } else {
          navigate(`/pesanan/${pesananId}`);
        }
      }

    } catch (error: any) {
      console.error("Error creating pesanan:", error);
      const errorMsg = error.response?.data?.message || "Gagal membuat pesanan";
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const { subtotal, biayaAdmin, totalBayar } = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/keranjang")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Keranjang
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Checkout
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Lengkapi informasi untuk menyelesaikan pesanan
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Alamat Pengiriman */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Alamat Pengiriman
            </h2>
            
            {alamatList.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Anda belum memiliki alamat pengiriman
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/alamat/create")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Tambah Alamat
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {alamatList.map((alamat) => (
                  <div
                    key={alamat._id}
                    onClick={() => setSelectedAlamat(alamat._id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAlamat === alamat._id
                        ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {alamat.nama_penerima}
                          </p>
                          {alamat.is_utama && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">
                              Utama
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {alamat.no_telepon}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                          {alamat.alamat_lengkap}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {alamat.kota}, {alamat.provinsi} - {alamat.kode_pos}
                        </p>
                      </div>
                      {selectedAlamat === alamat._id && (
                        <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Produk */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Produk yang Dipesan ({cartItems.length} item)
            </h2>
            <div className="space-y-4">
              {cartItems.map((item, idx) => {
                const itemSubtotal = item.subtotal || (item.id_produk.harga * item.jumlah);
                return (
                  <div key={idx} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    {item.id_produk.media && item.id_produk.media.length > 0 ? (
                      <img
                        src={item.id_produk.media[0].url}
                        alt={item.id_produk.nama_produk}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.id_produk.nama_produk}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {item.jumlah} x Rp {item.id_produk.harga.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Rp {itemSubtotal.toLocaleString("id-ID")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pengiriman */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pengiriman
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pilih Kurir
                </label>
                <select
                  value={kurir}
                  onChange={(e) => setKurir(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="JNE">JNE</option>
                  <option value="J&T">J&T Express</option>
                  <option value="SiCepat">SiCepat</option>
                  <option value="AnterAja">AnterAja</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ongkos Kirim
                </label>
                <input
                  type="number"
                  value={ongkir}
                  onChange={(e) => setOngkir(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Metode Pembayaran
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { value: "cash", label: "Cash on Delivery (COD)", icon: "💵" },
                { value: "card", label: "Kartu Kredit/Debit", icon: "💳" },
                { value: "qris", label: "QRIS", icon: "📱" },
                { value: "transfer", label: "Transfer Bank", icon: "🏦" },
                { value: "ewallet", label: "E-Wallet", icon: "💰" }
              ].map((metode) => (
                <div
                  key={metode.value}
                  onClick={() => setMetodePembayaran(metode.value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    metodePembayaran === metode.value
                      ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{metode.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {metode.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Catatan */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Catatan untuk Penjual (Opsional)
            </h2>
            <textarea
              value={catatanPembeli}
              onChange={(e) => setCatatanPembeli(e.target.value)}
              placeholder="Tulis catatan Anda..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Ringkasan */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ringkasan Pembayaran
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Ongkir</span>
                <span className="text-gray-900 dark:text-white">Rp {ongkir.toLocaleString("id-ID")}</span>
              </div>
              {biayaAdmin > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Biaya Admin</span>
                  <span className="text-gray-900 dark:text-white">Rp {biayaAdmin.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-xl text-green-600 dark:text-green-500">
                    Rp {totalBayar.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedAlamat}
              className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Memproses..." : "Buat Pesanan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePesanan;