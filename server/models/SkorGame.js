const mongoose = require('mongoose');

const skorGameSchema = new mongoose.Schema({
  id_pengguna: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pengguna', 
    required: true,
    index: true // Ditambahkan index untuk pencarian leaderboard
  },
  
  // 'id_quiz' (tunggal) diganti dengan konteks sesi game:
  tingkat_kesulitan: { 
    type: String, 
    enum: ['mudah', 'sedang', 'sulit'], 
    default: 'mudah' 
  },
  kategori_budaya: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Kategori' // Menunjuk ke Kategori 'budaya'
  },
  
  skor: { type: Number, required: true }, // Total poin yang didapat di sesi ini
  total_soal: { type: Number, default: 0 },
  jawaban_benar: { type: Number, default: 0 },
  waktu_selesai: { type: Number, default: 0 }, // Waktu pengerjaan dalam detik
  
  // 'level' diganti menjadi 'level_saat_main'
  level_saat_main: { type: Number, default: 1 } // Level pengguna saat game ini dimainkan
}, { timestamps: true });

module.exports = mongoose.model('SkorGame', skorGameSchema);