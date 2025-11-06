const promosiSchema = new mongoose.Schema({
  kode_promo: { type: String, required: true, unique: true },
  nama_promo: { type: String, required: true },
  deskripsi: { type: String },
  
  tipe_diskon: { type: String, enum: ['persen', 'nominal', 'beli_x_gratis_y'], required: true },
  nilai_diskon: { type: Number, required: true },
  
  beli_jumlah: { type: Number },
  gratis_jumlah: { type: Number },
  
  min_pembelian: { type: Number, default: 0 },
  max_diskon: { type: Number },
  kuota: { type: Number },
  kuota_terpakai: { type: Number, default: 0 },
  tanggal_mulai: { type: Date, required: true },
  tanggal_selesai: { type: Date, required: true },
  
  produk_berlaku: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Produk' }],
  kategori_produk: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Kategori' }],
  
  status: { type: String, enum: ['aktif', 'nonaktif', 'expired'], default: 'aktif' }
}, { timestamps: true });

module.exports = mongoose.model('Promosi', promosiSchema);