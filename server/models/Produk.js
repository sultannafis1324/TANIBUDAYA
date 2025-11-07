const mongoose = require('mongoose');

const produkSchema = new mongoose.Schema({
  id_penjual: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfileUsaha', required: true },
  nama_produk: { type: String, required: true },
  
  // --- INI PERUBAHANNYA ---
  slug: { type: String, unique: true, index: true },
  // -------------------------

  deskripsi: { type: String },
  kategori: { type: mongoose.Schema.Types.ObjectId, ref: 'Kategori', required: true },
  harga_modal: { type: Number },
  harga: { type: Number, required: true },
  stok: { type: Number, required: true, default: 0 },
  berat: { type: Number },
  
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true }
  }],
  
  spesifikasi: [{
    nama: { type: String },
    nilai: { type: String }
  }],
  
  tanggal_kadaluarsa: { type: Date },
  
  asal_budaya: { type: mongoose.Schema.Types.ObjectId, ref: 'KontenBudaya' },
  provinsi: { type: mongoose.Schema.Types.ObjectId, ref: 'Provinsi' },
  tags: [{ type: String }],
  rating_produk: { type: Number, default: 0 },
  jumlah_ulasan: { type: Number, default: 0 },
  jumlah_terjual: { type: Number, default: 0 },
  status: { type: String, enum: ['aktif', 'nonaktif', 'sold_out'], default: 'aktif' }
}, { timestamps: true });

module.exports = mongoose.model('Produk', produkSchema);