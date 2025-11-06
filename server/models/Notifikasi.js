const notifikasiSchema = new mongoose.Schema({
  id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  judul: { type: String, required: true },
  pesan: { type: String, required: true },
  tipe: { type: String, enum: ['pesanan', 'promosi', 'sistem', 'chat', 'game'], required: true },
  link: { type: String },
  is_read: { type: Boolean, default: false },
  icon: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Notifikasi', notifikasiSchema);