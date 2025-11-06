const kategoriSchema = new mongoose.Schema({
  nama_kategori: { type: String, required: true },
  tipe_kategori: { type: String, enum: ['produk', 'budaya'], required: true },
  deskripsi: { type: String },
  icon: { type: String },
  status: { type: String, enum: ['aktif', 'nonaktif'], default: 'aktif' }
}, { timestamps: true });

module.exports = mongoose.model('Kategori', kategoriSchema);