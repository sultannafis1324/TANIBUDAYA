import mongoose from 'mongoose';

const alamatSchema = new mongoose.Schema({
  id_pengguna: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pengguna', 
    required: true 
  },
  label_alamat: { type: String }, // contoh: "Rumah", "Kantor", "Orang Tua"
  nama_penerima: { type: String, required: true },
  no_telepon: { type: String, required: true },
  alamat_lengkap: { type: String, required: true },
  
  // pakai ID dari indonesian-area
  provinsiId: { type: String, required: true },
  kabupatenId: { type: String },
  kecamatanId: { type: String },
  kelurahanId: { type: String },

  kode_pos: { type: String },
  catatan: { type: String },
  is_default: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Alamat', alamatSchema);
