const mongoose = require('mongoose');

const profileUsahaSchema = new mongoose.Schema({
  id_pengguna: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pengguna', 
    required: true, 
    unique: true // <-- DITAMBAHKAN: 1 pengguna = 1 toko
  },
  nama_usaha: { 
    type: String, 
    required: true, 
    unique: true // <-- DITAMBAHKAN: Nama toko tidak boleh sama
  },
  slug: { 
    type: String, 
    unique: true, 
    index: true // <-- DITAMBAHKAN: Untuk URL (contoh: /toko/batik-jaya)
  },
  deskripsi_usaha: { type: String },
  bidang_usaha: { type: String },
  logo_usaha: { type: String }, // Asumsi URL dari Cloudinary
  alamat_usaha: { type: mongoose.Schema.Types.ObjectId, ref: 'Alamat' },
  no_telepon_usaha: { type: String },
  email_usaha: { type: String },
  npwp: { type: String },
  dokumen_verifikasi: [{ type: String }], // Asumsi array URL dari Cloudinary
  status_verifikasi: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  alasan_reject: { type: String },
  tanggal_verifikasi: { type: Date },
  rating_toko: { type: Number, default: 0 },
  jumlah_produk_terjual: { type: Number, default: 0 },
  total_transaksi: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ProfileUsaha', profileUsahaSchema);