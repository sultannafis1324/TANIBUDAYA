const quizSchema = new mongoose.Schema({
  pertanyaan: { type: String, required: true },
  kategori_budaya: { type: mongoose.Schema.Types.ObjectId, ref: 'Kategori' },
  tingkat_kesulitan: { type: String, enum: ['mudah', 'sedang', 'sulit'], default: 'mudah' },
  opsi_jawaban: [{
    teks: { type: String, required: true },
    is_correct: { type: Boolean, required: true }
  }],
  penjelasan: { type: String },
  gambar_soal: { type: String },
  poin: { type: Number, default: 10 },
  status: { type: String, enum: ['aktif', 'nonaktif'], default: 'aktif' }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);