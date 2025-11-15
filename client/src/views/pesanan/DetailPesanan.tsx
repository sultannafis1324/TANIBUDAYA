import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface Payment {
  _id: string;
  metode_pembayaran: string;
  saluran_pembayaran?: string;
  status_payment: string;
  jumlah: number;
  midtrans_snap_token?: string;
  midtrans_payment_url?: string;
  expired_at?: string;
  paid_at?: string;
}

interface Pesanan {
  _id: string;
  kode_pesanan: string;
  id_penjual: {
    nama_usaha: string;
    logo_usaha?: string;
    alamat?: string;
    no_telepon?: string;
  };
  items: Array<{
    id_produk: { nama_produk: string; media?: string[]; harga: number };
    nama_produk: string;
    harga_satuan: number;
    jumlah: number;
    subtotal: number;
  }>;
  total_harga_produk: number;
  ongkir: number;
  biaya_admin: number;
  diskon: number;
  total_bayar: number;
  alamat_pengiriman?: {
    nama_penerima: string;
    no_telepon: string;
    alamat_lengkap: string;
    kota: string;
    provinsi: string;
    kode_pos: string;
  };
  kurir?: string;
  resi?: string;
  status_pesanan: string;
  catatan_pembeli?: string;
  alasan_batal?: string;
  createdAt: string;
  tanggal_bayar?: string;
  tanggal_kirim?: string;
  tanggal_selesai?: string;
}

declare global {
  interface Window {
    snap: any;
  }
}

const DetailPesanan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pesanan, setPesanan] = useState<Pesanan | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [alasanBatal, setAlasanBatal] = useState("");
  const [autoCheckCount, setAutoCheckCount] = useState(0);

  // ✅ Refs untuk polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingActiveRef = useRef(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPesananDetail();

    // Cleanup saat component unmount
    return () => {
      stopAutoCheck();
    };
  }, [id]);

  // ✅ AUTO-CHECK: Start polling jika payment pending
  useEffect(() => {
    if (payment && pesanan) {
      const needsAutoCheck = 
        pesanan.status_pesanan === "menunggu_pembayaran" && 
        payment.status_payment === "pending" &&
        payment.metode_pembayaran !== "cash";

      if (needsAutoCheck && !isPollingActiveRef.current) {
        startAutoCheck();
      } else if (!needsAutoCheck && isPollingActiveRef.current) {
        stopAutoCheck();
      }
    }
  }, [payment, pesanan]);

  const startAutoCheck = () => {
    if (isPollingActiveRef.current) return;

    console.log("🔄 Starting auto-check payment status...");
    isPollingActiveRef.current = true;
    setAutoCheckCount(0);

    // Check immediately
    checkPaymentStatusSilent();

    // Then check every 10 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkPaymentStatusSilent();
    }, 10000); // 10 detik
  };

  const stopAutoCheck = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingActiveRef.current = false;
    console.log("⏹️ Auto-check stopped");
  };

  const checkPaymentStatusSilent = async () => {
    if (!payment) return;

    try {
      setAutoCheckCount(prev => prev + 1);
      
      const res = await axios.get(
        `http://localhost:5000/api/payment/${payment._id}/check`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedPayment = res.data.data.payment;
      
      console.log(`✅ Auto-check #${autoCheckCount + 1}:`, updatedPayment.status_payment);

      // Update state
      setPayment(updatedPayment);

      // Jika status berubah jadi success atau failed, stop polling dan refresh
      if (['success', 'failed', 'expired'].includes(updatedPayment.status_payment)) {
        stopAutoCheck();
        
        // Show notification
        if (updatedPayment.status_payment === 'success') {
          showNotification("✅ Pembayaran Berhasil!", "Pesanan Anda sedang diproses");
        } else if (updatedPayment.status_payment === 'expired') {
          showNotification("⏰ Pembayaran Kadaluarsa", "Silakan buat pesanan baru");
        } else {
          showNotification("❌ Pembayaran Gagal", "Mohon coba lagi");
        }

        // Refresh full data
        await fetchPesananDetail();
      }

      // Stop after 60 checks (10 menit)
      if (autoCheckCount >= 60) {
        stopAutoCheck();
        console.log("⏰ Auto-check timeout after 10 minutes");
      }

    } catch (error: any) {
      console.error("Error auto-checking payment:", error);
      // Don't stop on error, akan retry di interval berikutnya
    }
  };

  const showNotification = (title: string, message: string) => {
    // Simple browser notification (bisa diganti dengan toast library)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
    // Also show alert
    alert(`${title}\n${message}`);
  };

  const fetchPesananDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/pesanan/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPesanan(res.data.data.pesanan);
      setPayment(res.data.data.payment);
    } catch (error: any) {
      console.error("Error fetching pesanan:", error);
      alert(error.response?.data?.message || "Gagal memuat detail pesanan");
      navigate("/pesanan");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!payment) return;

    try {
      setChecking(true);
      const res = await axios.get(
        `http://localhost:5000/api/payment/${payment._id}/check`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(res.data.message);
      
      // Refresh data
      await fetchPesananDetail();
    } catch (error: any) {
      console.error("Error checking payment:", error);
      alert(error.response?.data?.message || "Gagal mengecek status pembayaran");
    } finally {
      setChecking(false);
    }
  };

  const handlePayNow = () => {
    if (!payment?.midtrans_snap_token) {
      alert("Token pembayaran tidak tersedia");
      return;
    }

    window.snap.pay(payment.midtrans_snap_token, {
      onSuccess: function() {
        alert("Pembayaran berhasil!");
        stopAutoCheck(); // Stop manual polling karena akan refresh
        fetchPesananDetail();
      },
      onPending: function() {
        alert("Menunggu pembayaran...");
        // Restart auto-check
        stopAutoCheck();
        setTimeout(() => fetchPesananDetail(), 1000);
      },
      onError: function() {
        alert("Pembayaran gagal!");
      },
      onClose: function() {
        console.log("Payment popup closed");
        // Check status setelah popup ditutup
        setTimeout(() => checkPaymentStatusSilent(), 2000);
      }
    });
  };

  const handleCancelPesanan = async () => {
    if (!alasanBatal.trim()) {
      alert("Mohon masukkan alasan pembatalan");
      return;
    }

    try {
      setCancelling(true);
      await axios.post(
        `http://localhost:5000/api/pesanan/${id}/cancel`,
        { alasan_batal: alasanBatal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Pesanan berhasil dibatalkan");
      setShowCancelModal(false);
      stopAutoCheck(); // Stop polling
      await fetchPesananDetail();
    } catch (error: any) {
      console.error("Error cancelling pesanan:", error);
      alert(error.response?.data?.message || "Gagal membatalkan pesanan");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      menunggu_pembayaran: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Menunggu Pembayaran" },
      diproses: { bg: "bg-blue-100", text: "text-blue-800", label: "Diproses" },
      dikirim: { bg: "bg-purple-100", text: "text-purple-800", label: "Dikirim" },
      selesai: { bg: "bg-green-100", text: "text-green-800", label: "Selesai" },
      dibatalkan: { bg: "bg-red-100", text: "text-red-800", label: "Dibatalkan" }
    };
    const c = config[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!pesanan) return null;

  const canCancel = ["menunggu_pembayaran", "diproses"].includes(pesanan.status_pesanan);
  const needsPayment = pesanan.status_pesanan === "menunggu_pembayaran" && payment?.status_payment === "pending";
  const isAutoChecking = isPollingActiveRef.current;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/pesanan")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          {getStatusBadge(pesanan.status_pesanan)}
        </div>

        {/* Kode Pesanan */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Detail Pesanan
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Kode Pesanan:</span> {pesanan.kode_pesanan}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dibuat: {new Date(pesanan.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>

        {/* Alert untuk Pembayaran Pending dengan Auto-Check Status */}
        {needsPayment && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                    Menunggu Pembayaran
                  </h3>
                  {isAutoChecking && (
                    <span className="flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400">
                      <span className="animate-pulse">🔄</span>
                      Auto-checking... ({autoCheckCount})
                    </span>
                  )}
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Silakan selesaikan pembayaran Anda. Status pembayaran akan dicek otomatis setiap 10 detik.
                </p>
                {payment?.expired_at && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                    Batas waktu: {new Date(payment.expired_at).toLocaleString("id-ID")}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handlePayNow}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                  >
                    Bayar Sekarang
                  </button>
                  <button
                    onClick={handleCheckPayment}
                    disabled={checking}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
                  >
                    {checking ? "Mengecek..." : "Cek Status Manual"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Penjual */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informasi Penjual
          </h2>
          <div className="flex items-center gap-3">
            {pesanan.id_penjual.logo_usaha ? (
              <img
                src={pesanan.id_penjual.logo_usaha}
                alt={pesanan.id_penjual.nama_usaha}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-xl">
                  {pesanan.id_penjual.nama_usaha.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {pesanan.id_penjual.nama_usaha}
              </p>
              {pesanan.id_penjual.no_telepon && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pesanan.id_penjual.no_telepon}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Produk yang Dipesan
          </h2>
          <div className="space-y-4">
            {pesanan.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                {item.id_produk.media && item.id_produk.media[0] ? (
                  <img
                    src={item.id_produk.media[0]}
                    alt={item.nama_produk}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.nama_produk}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.jumlah} x Rp {item.harga_satuan.toLocaleString("id-ID")}
                  </p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Rp {item.subtotal.toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Alamat Pengiriman */}
        {pesanan.alamat_pengiriman && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Alamat Pengiriman
            </h2>
            <div className="space-y-2">
              <p className="font-medium text-gray-900 dark:text-white">
                {pesanan.alamat_pengiriman.nama_penerima}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {pesanan.alamat_pengiriman.no_telepon}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {pesanan.alamat_pengiriman.alamat_lengkap}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {pesanan.alamat_pengiriman.kota}, {pesanan.alamat_pengiriman.provinsi} - {pesanan.alamat_pengiriman.kode_pos}
              </p>
            </div>
            {pesanan.resi && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm"><span className="font-semibold text-blue-800 dark:text-blue-300">No. Resi:</span> <span className="text-blue-700 dark:text-blue-400">{pesanan.resi}</span></p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Kurir: {pesanan.kurir}</p>
              </div>
            )}
          </div>
        )}

        {/* Ringkasan Pembayaran */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ringkasan Pembayaran
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal Produk</span>
              <span className="text-gray-900 dark:text-white">Rp {pesanan.total_harga_produk.toLocaleString("id-ID")}</span>
            </div>
            {pesanan.ongkir > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Ongkir</span>
                <span className="text-gray-900 dark:text-white">Rp {pesanan.ongkir.toLocaleString("id-ID")}</span>
              </div>
            )}
            {pesanan.biaya_admin > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Biaya Admin</span>
                <span className="text-gray-900 dark:text-white">Rp {pesanan.biaya_admin.toLocaleString("id-ID")}</span>
              </div>
            )}
            {pesanan.diskon > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Diskon</span>
                <span className="text-green-600 dark:text-green-400">- Rp {pesanan.diskon.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Total Pembayaran</span>
                <span className="font-bold text-lg text-green-600 dark:text-green-500">
                  Rp {pesanan.total_bayar.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            {payment && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Metode: <span className="font-medium text-gray-900 dark:text-white">{payment.metode_pembayaran.toUpperCase()}</span>
                  {payment.saluran_pembayaran && ` - ${payment.saluran_pembayaran}`}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Status Payment: <span className={`font-medium ${payment.status_payment === 'success' ? 'text-green-600' : payment.status_payment === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {payment.status_payment.toUpperCase()}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cancel Button */}
        {canCancel && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Batalkan Pesanan
            </button>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Batalkan Pesanan
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Mohon berikan alasan pembatalan pesanan
              </p>
              <textarea
                value={alasanBatal}
                onChange={(e) => setAlasanBatal(e.target.value)}
                placeholder="Tulis alasan pembatalan..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={4}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Batal
                </button>
                <button
                  onClick={handleCancelPesanan}
                  disabled={cancelling || !alasanBatal.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? "Membatalkan..." : "Ya, Batalkan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPesanan;