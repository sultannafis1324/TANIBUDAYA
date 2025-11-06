const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'moderator'], default: 'moderator' },
  foto_profil: { type: String },
  status: { type: String, enum: ['aktif', 'nonaktif'], default: 'aktif' },
  terakhir_login: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);