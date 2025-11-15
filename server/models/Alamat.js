import mongoose from 'mongoose';

const alamatSchema = new mongoose.Schema({
  id_pengguna: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pengguna', 
    required: true 
  },
  label_alamat: { type: String }, // "Rumah", "Kantor", dll
  nama_penerima: { type: String, required: true },
  no_telepon: { type: String, required: true },
  alamat_lengkap: { type: String, required: true },
  
  // Untuk kompatibilitas dengan API wilayah
  provinsiId: { type: String },
  kabupatenId: { type: String },
  kecamatanId: { type: String },
  kelurahanId: { type: String },

  // Nama wilayah (untuk display, opsional)
  provinsi: { type: String },
  kota: { type: String },
  kecamatan: { type: String },
  kelurahan: { type: String },

  kode_pos: { type: String },
  catatan: { type: String },
  
  // ✅ Ubah dari is_default ke is_utama (sesuai frontend)
  is_utama: { type: Boolean, default: false },
  
  // Alias untuk backward compatibility
  is_default: { type: Boolean, default: false }
}, { timestamps: true });

// Virtual untuk sinkronisasi is_default dan is_utama
alamatSchema.pre('save', function(next) {
  this.is_default = this.is_utama;
  next();
});

export default mongoose.model('Alamat', alamatSchema);