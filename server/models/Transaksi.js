const transaksiSchema = new mongoose.Schema({
  id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  id_pesanan: { type: mongoose.Schema.Types.ObjectId, ref: 'Pesanan', required: true },
  id_payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  tipe_transaksi: { type: String, enum: ['pemasukan', 'pengeluaran'], required: true },

  jumlah: { type: Number, required: true },
  deskripsi: { type: String },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Transaksi', transaksiSchema);