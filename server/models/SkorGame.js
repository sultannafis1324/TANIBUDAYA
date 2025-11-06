const skorGameSchema = new mongoose.Schema({
  id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  id_quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  skor: { type: Number, required: true },
  total_soal: { type: Number },
  jawaban_benar: { type: Number },
  waktu_selesai: { type: Number },
  level: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('SkorGame', skorGameSchema);