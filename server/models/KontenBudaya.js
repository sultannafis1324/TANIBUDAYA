import mongoose from 'mongoose';

const kontenBudayaSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  kategori: { type: mongoose.Schema.Types.ObjectId, ref: 'Kategori', required: true },

  // pakai id dari indonesian-area
  provinsiId: { type: String, required: true },
  kabupatenId: { type: String },
  kecamatanId: { type: String },

  deskripsi: { type: String },
  media_konten: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image','video','audio'], required: true }
  }],
  koordinat_peta: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  tags: [{ type: String }],
  sumber_referensi: [{ type: String }],
  status: { type: String, enum: ['published','draft','pending','rejected'], default: 'pending' },
  dibuat_oleh: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna' },
  jumlah_views: { type: Number, default: 0 },
  jumlah_likes: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('KontenBudaya', kontenBudayaSchema);
