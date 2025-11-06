const kontenBudayaSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  kategori: { type: mongoose.Schema.Types.ObjectId, ref: 'Kategori', required: true },
  provinsi: { type: mongoose.Schema.Types.ObjectId, ref: 'Provinsi', required: true },
  
  deskripsi: { type: String },
  
  media_konten: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'audio'], required: true }
  }],
  
  koordinat_peta: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  tags: [{ type: String }],
  sumber_referensi: [{ type: String }],
  status: { type: String, enum: ['published', 'draft', 'pending', 'rejected'], default: 'pending' },
  
  dibuat_oleh: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna' },
  
  jumlah_views: { type: Number, default: 0 },
  jumlah_likes: { type: Number, default: 0 },
  
  rating_konten: { type: Number, default: 0 },
  jumlah_ulasan: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('KontenBudaya', kontenBudayaSchema);