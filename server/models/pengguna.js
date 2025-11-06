const penggunaSchema = new mongoose.Schema({
  nama_lengkap: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  no_telepon: { type: String },
  foto_profil: { type: String },
  role: { type: String, enum: ['pembeli', 'penjual', 'keduanya'], default: 'pembeli' },
  status_akun: { type: String, enum: ['aktif', 'nonaktif', 'banned'], default: 'aktif' },
  tanggal_lahir: { type: Date },
  jenis_kelamin: { type: String, enum: ['laki-laki', 'perempuan', 'lainnya'] },
  
  alamat_lengkap: { type: String },
  provinsi: { type: mongoose.Schema.Types.ObjectId, ref: 'Provinsi' },
  kota: { type: String },
  kecamatan: { type: String },
  kelurahan: { type: String },
  kode_pos: { type: String },
  
  poin_game: { type: Number, default: 0 },
  level_user: { type: Number, default: 1 },
  email_verified: { type: Boolean, default: false },
  terakhir_login: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Pengguna', penggunaSchema);