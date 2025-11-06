const alamatSchema = new mongoose.Schema({
  id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  label_alamat: { type: String },
  nama_penerima: { type: String, required: true },
  no_telepon: { type: String, required: true },
  alamat_lengkap: { type: String, required: true },
  provinsi: { type: mongoose.Schema.Types.ObjectId, ref: 'Provinsi' },
  kota: { type: String },
  kecamatan: { type: String },
  kelurahan: { type: String },
  kode_pos: { type: String },
  catatan: { type: String },
  is_default: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Alamat', alamatSchema);