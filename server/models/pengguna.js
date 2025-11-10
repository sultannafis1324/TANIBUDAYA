import mongoose from 'mongoose';

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

  poin_game: { type: Number, default: 0 },
  level_user: { type: Number, default: 1 },
  email_verified: { type: Boolean, default: false },
  terakhir_login: { type: Date },
}, { timestamps: true });

export default mongoose.model('Pengguna', penggunaSchema);
