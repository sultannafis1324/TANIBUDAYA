import { useState, useEffect } from 'react';
import { ChevronDown, Package, Clock, Truck, CheckCircle, XCircle, Search, Filter, Eye } from 'lucide-react';

const KelolaPesanan = () => {
  const [pesanan, setPesanan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPesanan, setSelectedPesanan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [profileUsaha, setProfileUsaha] = useState(null);

  // State untuk update status
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    pesananId: '',
    status: '',
    resi: '',
    kurir: ''
  });

  const token = localStorage.getItem('token');

  const statusConfig = {
    menunggu_pembayaran: { 
      label: 'Menunggu Pembayaran', 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      icon: Clock 
    },
    diproses: { 
      label: 'Diproses', 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      icon: Package 
    },
    dikirim: { 
      label: 'Dikirim', 
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      icon: Truck 
    },
    selesai: { 
      label: 'Selesai', 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      icon: CheckCircle 
    },
    dibatalkan: { 
      label: 'Dibatalkan', 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      icon: XCircle 
    }
  };

  useEffect(() => {
    fetchProfileUsaha();
  }, []);

  useEffect(() => {
    if (profileUsaha) {
      fetchPesanan();
    }
  }, [filter, profileUsaha]);

  const fetchProfileUsaha = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/profile-usaha/my-usaha', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Gagal memuat profile usaha');
    }
    
    console.log('✅ Profile Usaha:', data);
    setProfileUsaha(data);
  } catch (err) {
    console.error('❌ Error fetching profile usaha:', err);
    setError('Anda harus memiliki Profile Usaha yang sudah diverifikasi untuk mengakses halaman ini');
    setLoading(false);
  }
};

const fetchPesanan = async () => {
  try {
    setLoading(true);
    console.log('🔍 Fetching pesanan for Profile Usaha:', profileUsaha._id);
    
    const params = new URLSearchParams();
    if (filter) params.append('status', filter);

    const response = await fetch(`http://localhost:5000/api/pesanan/penjual/orders?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Gagal memuat pesanan');
    }

    console.log('✅ Pesanan loaded:', result.data?.length || 0);
    setPesanan(result.data || []);
    setError('');
  } catch (err) {
    console.error('❌ Error fetching pesanan:', err);
    setError(err.message || 'Gagal memuat pesanan');
  } finally {
    setLoading(false);
  }
};

  const handleUpdateStatus = async () => {
    try {
      if (updateData.status === 'dikirim' && (!updateData.resi || !updateData.kurir)) {
        alert('Resi dan kurir harus diisi untuk status "Dikirim"');
        return;
      }

      const payload = {
        status_pesanan: updateData.status
      };

      if (updateData.status === 'dikirim') {
        payload.resi = updateData.resi;
        payload.kurir = updateData.kurir;
      }

      const response = await fetch(`http://localhost:5000/api/pesanan/${updateData.pesananId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Gagal update status pesanan');
      }

      alert('Status pesanan berhasil diupdate!');
      setShowUpdateModal(false);
      setUpdateData({ pesananId: '', status: '', resi: '', kurir: '' });
      fetchPesanan();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.message || 'Gagal update status pesanan');
    }
  };

  const openUpdateModal = (pesanan) => {
    setUpdateData({
      pesananId: pesanan._id,
      status: pesanan.status_pesanan,
      resi: pesanan.resi || '',
      kurir: pesanan.kurir || ''
    });
    setShowUpdateModal(true);
  };

  const openDetailModal = (pesanan) => {
    setSelectedPesanan(pesanan);
    setShowDetailModal(true);
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      menunggu_pembayaran: ['diproses', 'dibatalkan'],
      diproses: ['dikirim', 'dibatalkan'],
      dikirim: ['selesai'],
      selesai: [],
      dibatalkan: []
    };
    return statusFlow[currentStatus] || [];
  };

  const filteredPesanan = pesanan.filter(p => 
    p.kode_pesanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id_pembeli?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !profileUsaha) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Kelola Pesanan
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Kelola semua pesanan masuk untuk {profileUsaha?.nama_usaha}
        </p>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari kode pesanan atau nama pembeli..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
          >
            <option value="">Semua Status</option>
            <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
            <option value="diproses">Diproses</option>
            <option value="dikirim">Dikirim</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {['menunggu_pembayaran', 'diproses', 'dikirim', 'selesai'].map(status => {
          const count = pesanan.filter(p => p.status_pesanan === status).length;
          const config = statusConfig[status];
          const Icon = config.icon;
          
          return (
            <div key={status} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{config.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{count}</p>
                </div>
                <div className={`p-3 rounded-full ${config.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pesanan List */}
      {filteredPesanan.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Tidak ada pesanan
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'Tidak ada pesanan yang sesuai dengan pencarian' : 'Belum ada pesanan masuk'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPesanan.map((p) => {
            const config = statusConfig[p.status_pesanan];
            const Icon = config.icon;

            return (
              <div key={p._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {p.kode_pesanan}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                          <Icon className="w-4 h-4" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(p.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDetailModal(p)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </button>
                      {getNextStatus(p.status_pesanan).length > 0 && (
                        <button
                          onClick={() => openUpdateModal(p)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Update Status
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pembeli Info */}
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Pembeli</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {p.id_pembeli?.nama_lengkap || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {p.id_pembeli?.email || 'N/A'} | {p.id_pembeli?.no_telepon || 'N/A'}
                    </p>
                  </div>

                  {/* Items */}
                  <div className="space-y-3 mb-4">
                    {p.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        {item.id_produk?.media?.[0] && (
                          <img
                            src={item.id_produk.media[0].url}
                            alt={item.nama_produk}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.nama_produk}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.jumlah} x {formatRupiah(item.harga_satuan)}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatRupiah(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {p.resi && (
                        <p>Resi: <span className="font-medium text-gray-900 dark:text-white">{p.resi}</span> ({p.kurir})</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pembayaran</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatRupiah(p.total_bayar)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Update Status Pesanan
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status Baru
                </label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Pilih Status</option>
                  {getNextStatus(pesanan.find(p => p._id === updateData.pesananId)?.status_pesanan || '').map(status => (
                    <option key={status} value={status}>
                      {statusConfig[status].label}
                    </option>
                  ))}
                </select>
              </div>

              {updateData.status === 'dikirim' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kurir
                    </label>
                    <input
                      type="text"
                      value={updateData.kurir}
                      onChange={(e) => setUpdateData({ ...updateData, kurir: e.target.value })}
                      placeholder="Contoh: JNE, J&T, SiCepat"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nomor Resi
                    </label>
                    <input
                      type="text"
                      value={updateData.resi}
                      onChange={(e) => setUpdateData({ ...updateData, resi: e.target.value })}
                      placeholder="Masukkan nomor resi"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateStatus}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPesanan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Detail Pesanan
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Info Pesanan */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Informasi Pesanan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Kode Pesanan:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedPesanan.kode_pesanan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tanggal:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedPesanan.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedPesanan.status_pesanan].color}`}>
                      {statusConfig[selectedPesanan.status_pesanan].label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alamat Pengiriman */}
              {selectedPesanan.alamat_pengiriman && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Alamat Pengiriman</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      {selectedPesanan.alamat_pengiriman.nama_penerima}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedPesanan.alamat_pengiriman.no_telepon}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {selectedPesanan.alamat_pengiriman.alamat_lengkap}<br />
                      {selectedPesanan.alamat_pengiriman.kecamatan}, {selectedPesanan.alamat_pengiriman.kota}<br />
                      {selectedPesanan.alamat_pengiriman.provinsi} {selectedPesanan.alamat_pengiriman.kode_pos}
                    </p>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Produk</h4>
                <div className="space-y-3">
                  {selectedPesanan.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      {item.id_produk?.media?.[0] && (
                        <img
                          src={item.id_produk.media[0].url}
                          alt={item.nama_produk}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.nama_produk}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.jumlah} x {formatRupiah(item.harga_satuan)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatRupiah(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ringkasan Biaya */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Ringkasan Biaya</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal Produk:</span>
                    <span className="text-gray-900 dark:text-white">{formatRupiah(selectedPesanan.total_harga_produk)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ongkir:</span>
                    <span className="text-gray-900 dark:text-white">{formatRupiah(selectedPesanan.ongkir)}</span>
                  </div>
                  {selectedPesanan.biaya_admin > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Biaya Admin:</span>
                      <span className="text-gray-900 dark:text-white">{formatRupiah(selectedPesanan.biaya_admin)}</span>
                    </div>
                  )}
                  {selectedPesanan.diskon > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Diskon:</span>
                      <span>-{formatRupiah(selectedPesanan.diskon)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700 font-bold text-lg">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-green-600 dark:text-green-400">{formatRupiah(selectedPesanan.total_bayar)}</span>
                  </div>
                </div>
              </div>

              {selectedPesanan.catatan_pembeli && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Catatan Pembeli</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    {selectedPesanan.catatan_pembeli}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaPesanan;