import mongoose from 'mongoose';

const ulasanSchema = new mongoose.Schema({
  tipe_ulasan: { type: String, enum: ['produk', 'budaya'], required: true },
  
  id_produk: { type: mongoose.Schema.Types.ObjectId, ref: 'Produk' },
  id_penjual: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfileUsaha' },
  
  id_konten_budaya: { type: mongoose.Schema.Types.ObjectId, ref: 'KontenBudaya' },
  
  id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  
  rating: { type: Number, required: true, min: 1, max: 5 },
  komentar: { type: String },
  
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true }
  }],
  
  balasan: { type: String },
  id_pembalas: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna' },
  tanggal_balas: { type: Date },
  
  is_reported: { type: Boolean, default: false }
}, { timestamps: true });

// Menggunakan 'export default' untuk ES Modules
export default mongoose.model('Ulasan', ulasanSchema);