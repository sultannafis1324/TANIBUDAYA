import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

interface Item {
  id_produk: string;
  nama_produk: string;
  harga_satuan: number;
  jumlah: number;
  subtotal: number;
}

interface Pesanan {
  _id: string;
  kode_pesanan: string;
  id_penjual: {
    nama_usaha: string;
    logo_usaha?: string;
  };
  items: Item[];
  total_bayar: number;
  status_pesanan: string;
  createdAt: string;
  tanggal_bayar?: string;
  tanggal_kirim?: string;
  resi?: string;
}

const PesananList = () => {
  const [pesananList, setPesananList] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("semua");
  const [autoCheckingCount, setAutoCheckingCount] = useState(0);

  // ✅ Ref untuk polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingActiveRef = useRef(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPesanan();

    // Cleanup on unmount
    return () => {
      stopAutoCheck();
    };
  }, [activeTab]);

  // ✅ AUTO-CHECK: Cek apakah ada pesanan pending yang perlu di-track
  useEffect(() => {
    const hasPendingPayment = pesananList.some(
      p => p.status_pesanan === "menunggu_pembayaran"
    );

    if (hasPendingPayment && !isPollingActiveRef.current) {
      startAutoCheck();
    } else if (!hasPendingPayment && isPollingActiveRef.current) {
      stopAutoCheck();
    }
  }, [pesananList]);

  const startAutoCheck = () => {
    if (isPollingActiveRef.current) return;

    console.log("🔄 Starting auto-check for pending payments...");
    isPollingActiveRef.current = true;
    setAutoCheckingCount(0);

    // Check every 15 seconds (lebih jarang karena ini list page)
    pollingIntervalRef.current = setInterval(() => {
      checkPendingPayments();
    }, 15000); // 15 detik
  };

  const stopAutoCheck = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingActiveRef.current = false;
    console.log("⏹️ Auto-check stopped");
  };

  const checkPendingPayments = async () => {
    const pendingPesanan = pesananList.filter(
      p => p.status_pesanan === "menunggu_pembayaran"
    );

    if (pendingPesanan.length === 0) {
      stopAutoCheck();
      return;
    }

    setAutoCheckingCount(prev => prev + 1);
    console.log(`🔍 Auto-checking ${pendingPesanan.length} pending payments...`);

    // Check each pending payment
    let hasUpdate = false;
    for (const pesanan of pendingPesanan) {
      try {
        // Get payment info
        const paymentRes = await axios.get(
          `http://localhost:5000/api/payment/pesanan/${pesanan._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const payment = paymentRes.data.data;

        // Check status if still pending
        if (payment && payment.status_payment === 'pending') {
          const checkRes = await axios.get(
            `http://localhost:5000/api/payment/${payment._id}/check`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (checkRes.data.data.payment.status_payment !== 'pending') {
            hasUpdate = true;
            console.log(`✅ Status changed for ${pesanan.kode_pesanan}`);
          }
        }
      } catch (error) {
        console.error(`Error checking ${pesanan.kode_pesanan}:`, error);
      }
    }

    // Refresh list if ada perubahan
    if (hasUpdate) {
      await fetchPesanan();
      showNotification("✅ Status Pembayaran Diperbarui", "Ada pesanan dengan status baru");
    }

    // Stop after 40 checks (~10 menit)
    if (autoCheckingCount >= 40) {
      stopAutoCheck();
      console.log("⏰ Auto-check timeout");
    }
  };

  const showNotification = (title: string, message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  };

  const fetchPesanan = async () => {
    try {
      setLoading(true);
      const params = activeTab !== "semua" ? { status: activeTab } : {};
      const res = await axios.get("http://localhost:5000/api/pesanan", {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setPesananList(res.data.data);
    } catch (error: any) {
      console.error("Error fetching pesanan:", error);
      alert(error.response?.data?.message || "Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      menunggu_pembayaran: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Menunggu Pembayaran" },
      diproses: { bg: "bg-blue-100", text: "text-blue-800", label: "Diproses" },
      dikirim: { bg: "bg-purple-100", text: "text-purple-800", label: "Dikirim" },
      selesai: { bg: "bg-green-100", text: "text-green-800", label: "Selesai" },
      dibatalkan: { bg: "bg-red-100", text: "text-red-800", label: "Dibatalkan" },
      dikembalikan: { bg: "bg-gray-100", text: "text-gray-800", label: "Dikembalikan" }
    };

    const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const tabs = [
    { key: "semua", label: "Semua" },
    { key: "menunggu_pembayaran", label: "Menunggu Pembayaran" },
    { key: "diproses", label: "Diproses" },
    { key: "dikirim", label: "Dikirim" },
    { key: "selesai", label: "Selesai" },
    { key: "dibatalkan", label: "Dibatalkan" }
  ];

  const pendingCount = pesananList.filter(p => p.status_pesanan === "menunggu_pembayaran").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Pesanan Saya
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Kelola dan pantau semua pesanan Anda
              </p>
            </div>
            
            {/* Auto-check indicator */}
            {isPollingActiveRef.current && pendingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <span className="animate-pulse text-yellow-600">🔄</span>
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-300">
                    Auto-checking {pendingCount} pembayaran
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Check #{autoCheckingCount}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-green-600 text-green-600 dark:border-green-500 dark:text-green-500"
                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
                {tab.key === "menunggu_pembayaran" && pendingCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat pesanan...</p>
          </div>
        ) : pesananList.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Belum Ada Pesanan
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Anda belum memiliki pesanan di kategori ini
            </p>
            <Link
              to="/marketplace"
              className="mt-6 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          /* Pesanan List */
          <div className="space-y-4">
            {pesananList.map((pesanan) => (
              <div
                key={pesanan._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header Card */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {pesanan.id_penjual.logo_usaha ? (
                      <img
                        src={pesanan.id_penjual.logo_usaha}
                        alt={pesanan.id_penjual.nama_usaha}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                          {pesanan.id_penjual.nama_usaha.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {pesanan.id_penjual.nama_usaha}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {pesanan.kode_pesanan}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(pesanan.status_pesanan)}
                </div>

                {/* Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {pesanan.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.nama_produk}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.jumlah} x Rp {item.harga_satuan.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Rp {item.subtotal.toLocaleString("id-ID")}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Resi Info */}
                  {pesanan.resi && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <span className="font-semibold">No. Resi:</span> {pesanan.resi}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Pembayaran</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      Rp {pesanan.total_bayar.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Link
                    to={`/pesanan/${pesanan._id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PesananList;