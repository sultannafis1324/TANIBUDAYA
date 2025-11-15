import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditPesanan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<any>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPaymentData();
  }, [id]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/payment/pesanan/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayment(res.data.data);
      setNewPaymentMethod(res.data.data.metode_pembayaran);
    } catch (error: any) {
      console.error("Error fetching payment:", error);
      alert(error.response?.data?.message || "Gagal memuat data pembayaran");
      navigate(`/pesanan/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeMethod = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPaymentMethod === payment.metode_pembayaran) {
      alert("Pilih metode pembayaran yang berbeda");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        `http://localhost:5000/api/payment/${payment._id}/change-method`,
        { new_payment_method: newPaymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Metode pembayaran berhasil diubah!");
      
      // Jika ada snap token baru, redirect ke Midtrans
      if (res.data.data.snap_token) {
        window.snap.pay(res.data.data.snap_token, {
          onSuccess: function() {
            navigate(`/pesanan/${id}`);
          },
          onPending: function() {
            navigate(`/pesanan/${id}`);
          },
          onError: function() {
            navigate(`/pesanan/${id}`);
          },
          onClose: function() {
            navigate(`/pesanan/${id}`);
          }
        });
      } else {
        navigate(`/pesanan/${id}`);
      }

    } catch (error: any) {
      console.error("Error changing payment method:", error);
      alert(error.response?.data?.message || "Gagal mengubah metode pembayaran");
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

  if (!payment) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-6">
          <button
            onClick={() => navigate(`/pesanan/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ganti Metode Pembayaran
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Pilih metode pembayaran yang baru
          </p>
        </div>

        <form onSubmit={handleChangeMethod}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            
            {/* Current Method */}
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Metode Saat Ini:
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {payment.metode_pembayaran.toUpperCase()}
                {payment.saluran_pembayaran && ` - ${payment.saluran_pembayaran}`}
              </p>
            </div>

            {/* New Method Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Pilih Metode Baru:
              </label>

              {[
                { value: "card", label: "Kartu Kredit/Debit", icon: "💳" },
                { value: "qris", label: "QRIS", icon: "📱" },
                { value: "transfer", label: "Transfer Bank", icon: "🏦" },
                { value: "ewallet", label: "E-Wallet", icon: "💰" }
              ].map((metode) => (
                <div
                  key={metode.value}
                  onClick={() => setNewPaymentMethod(metode.value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    newPaymentMethod === metode.value
                      ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{metode.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {metode.label}
                    </span>
                    {newPaymentMethod === metode.value && (
                      <svg className="w-5 h-5 text-green-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Perhatian:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Metode pembayaran hanya bisa diubah untuk status pending</li>
                    <li>Setelah diubah, Anda akan mendapatkan nomor pembayaran baru</li>
                    <li>Batas waktu pembayaran akan direset ke 24 jam</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => navigate(`/pesanan/${id}`)}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || newPaymentMethod === payment.metode_pembayaran}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Memproses..." : "Ubah Metode"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPesanan;