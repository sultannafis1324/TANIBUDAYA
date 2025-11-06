const pesananSchema = new mongoose.Schema({
  kode_pesanan: { type: String, required: true, unique: true },
  id_pembeli: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  id_penjual: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfileUsaha', required: true },
  
  items: [{
    id_produk: { type: mongoose.Schema.Types.ObjectId, ref: 'Produk' },
    nama_produk: { type: String },
    harga_satuan: { type: Number },
    jumlah: { type: Number },
    subtotal: { type: Number }
  }],
  
  total_harga_produk: { type: Number, required: true },
  ongkir: { type: Number, default: 0 },
  biaya_admin: { type: Number, default: 0 },
  
  id_promosi: { type: mongoose.Schema.Types.ObjectId, ref: 'Promosi' },
  diskon: { type: Number, default: 0 },
  
  total_bayar: { type: Number, required: true },
  alamat_pengiriman: { type: mongoose.Schema.Types.ObjectId, ref: 'Alamat' },
  kurir: { type: String },
  resi: { type: String },
  status_pesanan: { 
    type: String, 
    enum: ['menunggu_pembayaran', 'diproses', 'dikirim', 'selesai', 'dibatalkan', 'dikembalikan'],
    default: 'menunggu_pembayaran'
  },
  catatan_pembeli: { type: String },
  alasan_batal: { type: String },
  tanggal_bayar: { type: Date },
  tanggal_kirim: { type: Date },
  tanggal_selesai: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Pesanan', pesananSchema);