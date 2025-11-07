const SkorGame = require('../models/SkorGame.js');
const Pengguna = require('../models/Pengguna.js'); // Untuk leaderboard
const Quiz = require('../models/Quiz.js'); // Untuk validasi skor
const mongoose = require('mongoose');

// --- FUNGSI PENGGUNA ---

/**
 * @desc    (Pengguna) Mensubmit hasil satu sesi game
 * @route   POST /api/game/submit
 * @access  Private (Pengguna)
 */
const submitGameSession = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    // Frontend mengirim hasil sesi game
    const { 
      level, 
      waktu_selesai, 
      answers, // Array: [{ id_pertanyaan: "...", jawaban_teks: "..." }]
      tingkat_kesulitan, // Data konteks dari model baru
      kategori_budaya // Data konteks dari model baru
    } = req.body; 

    if (!answers || answers.length === 0) {
      return res.status(400).json({ message: 'Jawaban tidak boleh kosong' });
    }

    // --- VALIDASI SKOR DI SERVER (Sangat Penting) ---
    const questionIds = answers.map(a => a.id_pertanyaan);
    const questionsInDB = await Quiz.find({ _id: { $in: questionIds } });

    let skor_didapat = 0;
    let jawaban_benar = 0;
    const total_soal = answers.length;

    for (const answer of answers) {
      const question = questionsInDB.find(q => q._id.toString() === answer.id_pertanyaan);
      if (!question) continue; // Lewati jika pertanyaan tidak ditemukan

      const correctOption = question.opsi_jawaban.find(opt => opt.is_correct === true);
      
      if (correctOption && correctOption.teks === answer.jawaban_teks) {
        skor_didapat += question.poin;
        jawaban_benar++;
      }
    }
    // ---------------------------------------------

    // 1. Simpan Log Sesi Game (sesuai model baru)
    const newSkor = new SkorGame({
      id_pengguna,
      skor: skor_didapat,
      total_soal,
      jawaban_benar,
      waktu_selesai: waktu_selesai || 0,
      level_saat_main: level || 1,
      tingkat_kesulitan, // Simpan konteks
      kategori_budaya: kategori_budaya || null // Simpan konteks
    });
    
    await newSkor.save();
    
    // 2. Update Poin Total Pengguna
    if (skor_didapat > 0) {
      await Pengguna.findByIdAndUpdate(id_pengguna, {
        $inc: { poin_game: skor_didapat }
      });
    }

    res.status(201).json({ 
      message: 'Sesi game berhasil disimpan', 
      data: newSkor 
    });

  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan skor', error: error.message });
  }
};

/**
 * @desc    (Pengguna) Mendapatkan riwayat game miliknya
 * @route   GET /api/game/history
 * @access  Private (Pengguna)
 */
const getMyGameHistory = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const history = await SkorGame.find({ id_pengguna: id_pengguna })
      .populate('kategori_budaya', 'nama_kategori') // Tampilkan nama kategori
      .sort({ createdAt: -1 }) // Tampilkan terbaru
      .skip(skip)
      .limit(parseInt(limit));
      
    const totalItems = await SkorGame.countDocuments({ id_pengguna: id_pengguna });
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: history,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil riwayat game', error: error.message });
  }
};


// --- FUNGSI PUBLIK (Leaderboard) ---

/**
 * @desc    (Publik) Mendapatkan Leaderboard Total Poin (Leaderboard Utama)
 * @route   GET /api/game/leaderboard/total
 * @access  Public
 */
const getLeaderboardTotal = async (req, res) => {
  try {
    // Ini mengambil dari model Pengguna (yang poinnya di-update server-side)
    const topUsers = await Pengguna.find({ status_akun: 'aktif' })
      .sort({ poin_game: -1 }) // Sort Poin Tertinggi
      .limit(20)
      .select('nama_lengkap foto_profil poin_game level_user');
      
    res.status(200).json(topUsers);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil leaderboard', error: error.message });
  }
};

/**
 * @desc    (Publik) Mendapatkan Leaderboard Sesi Terbaik (High Score)
 * @route   GET /api/game/leaderboard/session
 * @access  Public
 */
const getLeaderboardSession = async (req, res) => {
  try {
    // Ini mengambil dari model SkorGame (sesi game individu)
    const topSessions = await SkorGame.find({})
      .sort({ skor: -1 }) // Sort Skor Sesi Tertinggi
      .limit(20)
      .populate('id_pengguna', 'nama_lengkap foto_profil')
      .populate('kategori_budaya', 'nama_kategori');
      
    res.status(200).json(topSessions);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil leaderboard sesi', error: error.message });
  }
};


module.exports = {
  submitGameSession,
  getMyGameHistory,
  getLeaderboardTotal,
  getLeaderboardSession
};