import mongoose from 'mongoose';

const laporanSchema = new mongoose.Schema({
  pelapor: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  terlapor: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  tipe_laporan: { type: String, enum: ['penipuan_penjual', 'penipuan_pembeli', 'produk_palsu', 'spam', 'lainnya'], required: true },
  id_pesanan: { type: mongoose.Schema.Types.ObjectId, ref: 'Pesanan' },
  id_produk: { type: mongoose.Schema.Types.ObjectId, ref: 'Produk' },
  deskripsi: { type: String, required: true },
  bukti: [{ type: String }],
  status: { type: String, enum: ['pending', 'proses', 'selesai', 'ditolak'], default: 'pending' },
  tindakan_admin: { type: String },
  ditangani_oleh: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

// Menggunakan 'export default' untuk ES Modules
export default mongoose.model('Laporan', laporanSchema);