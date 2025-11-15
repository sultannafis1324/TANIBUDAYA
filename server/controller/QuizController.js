import Quiz from '../models/Quiz.js'; // Sesuaikan path
import Pengguna from '../models/Pengguna.js'; // Dibutuhkan untuk update poin
import mongoose from 'mongoose';

// --- 1. FUNGSI ADMIN (CRUD) ---
// (Semua rute ini harus dilindungi oleh middleware auth Admin)

/**
 * @desc    (Admin) Membuat pertanyaan kuis baru
 * @route   POST /api/quiz/admin
 * @access  Private (Admin)
 */
export const createQuiz = async (req, res) => {
  try {
    const { pertanyaan, opsi_jawaban, ...data } = req.body;

    if (!pertanyaan || !opsi_jawaban || opsi_jawaban.length < 2) {
      return res.status(400).json({ message: 'Pertanyaan dan minimal 2 opsi jawaban wajib diisi' });
    }

    // Validasi: Pastikan ada setidaknya satu jawaban benar
    const oneCorrect = opsi_jawaban.some(opt => opt.is_correct === true);
    if (!oneCorrect) {
      return res.status(400).json({ message: 'Harus ada minimal satu jawaban yang benar' });
    }

    // Asumsi 'gambar_soal' adalah URL dari Cloudinary
    const newQuiz = new Quiz({
      ...data,
      pertanyaan,
      opsi_jawaban
    });

    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat kuis', error: error.message });
  }
};

/**
 * @desc    (Admin) Mendapatkan semua kuis (termasuk nonaktif)
 * @route   GET /api/quiz/admin
 * @access  Private (Admin)
 */
export const getAllQuizForAdmin = async (req, res) => {
  try {
    const quizzes = await Quiz.find({})
      .populate('kategori_budaya', 'nama_kategori')
      .sort({ createdAt: -1 });
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data kuis', error: error.message });
  }
};

/**
 * @desc    (Admin) Update kuis
 * @route   PUT /api/quiz/admin/:id
 * @access  Private (Admin)
 */
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validasi lagi jika opsi jawaban diupdate
    if (req.body.opsi_jawaban) {
       const oneCorrect = req.body.opsi_jawaban.some(opt => opt.is_correct === true);
       if (!oneCorrect) {
         return res.status(400).json({ message: 'Harus ada minimal satu jawaban yang benar' });
       }
    }

    const updated = await Quiz.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!updated) {
      return res.status(404).json({ message: 'Kuis tidak ditemukan' });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengupdate kuis', error: error.message });
  }
};

/**
 * @desc    (Admin) Menghapus kuis (Soft Delete)
 * @route   DELETE /api/quiz/admin/:id
 * @access  Private (Admin)
 */
export const deleteQuiz = async (req, res) => {
  try {
    // Gunakan soft delete (nonaktifkan) agar tidak merusak data
    const deleted = await Quiz.findByIdAndUpdate(
      req.params.id, 
      { status: 'nonaktif' },
      { new: true }
    );
    
    if (!deleted) {
      return res.status(404).json({ message: 'Kuis tidak ditemukan' });
    }
    res.status(200).json({ message: 'Kuis telah dinonaktifkan' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus kuis', error: error.message });
  }
};

// --- 2. FUNGSI PENGGUNA (Game Play) ---
// (Rute ini harus dilindungi middleware auth Pengguna)

/**
 * @desc    (Pengguna) Mengambil batch soal kuis untuk dimainkan
 * @route   GET /api/quiz/play
 * @access  Private (Pengguna)
 */
export const getQuizBatch = async (req, res) => {
  try {
    const { kesulitan, kategori, limit = 10 } = req.query;
    
    let filter = { status: 'aktif' };
    if (kesulitan) filter.tingkat_kesulitan = kesulitan;
    if (kategori) filter.kategori_budaya = kategori;
    
    // Ambil 'limit' soal secara acak
    const questions = await Quiz.aggregate([
      { $match: filter },
      { $sample: { size: parseInt(limit) } }
    ]);

    // --- SANGAT PENTING: SANITASI DATA ---
    // Hapus 'is_correct', 'penjelasan', dan 'poin' dari respons
    const safeQuestions = questions.map(q => ({
      _id: q._id,
      pertanyaan: q.pertanyaan,
      kategori_budaya: q.kategori_budaya,
      tingkat_kesulitan: q.tingkat_kesulitan,
      opsi_jawaban: q.opsi_jawaban.map(opt => ({
        _id: opt._id,
        teks: opt.teks // HANYA kirim teks jawaban
        // 'is_correct' TIDAK DIKIRIM
      })),
      gambar_soal: q.gambar_soal
    }));

    res.status(200).json(safeQuestions);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil soal kuis', error: error.message });
  }
};

/**
 * @desc    (Pengguna) Mensubmit jawaban kuis (untuk 1 soal)
 * @route   POST /api/quiz/submit
 * @access  Private (Pengguna)
 */
export const submitQuizAnswer = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id_pertanyaan, jawaban_teks } = req.body;

    if (!id_pertanyaan || !jawaban_teks) {
      return res.status(400).json({ message: 'ID Pertanyaan dan Teks Jawaban wajib diisi' });
    }

    // 1. Ambil soal kuis dari DB (termasuk data jawaban)
    const question = await Quiz.findById(id_pertanyaan)
      .select('+opsi_jawaban.is_correct +penjelasan +poin'); // Ambil field tersembunyi

    if (!question) {
      return res.status(404).json({ message: 'Pertanyaan tidak ditemukan' });
    }

    // 2. Cari jawaban yang benar dan jawaban pilihan pengguna
    const correctOption = question.opsi_jawaban.find(opt => opt.is_correct === true);
    const selectedOption = question.opsi_jawaban.find(opt => opt.teks === jawaban_teks);

    if (!selectedOption) {
      return res.status(400).json({ message: 'Opsi jawaban tidak valid' });
    }

    // 3. Cek jawaban
    if (selectedOption.is_correct === true) {
      // JAWABAN BENAR
      
      // 4. Update poin pengguna (PENTING)
      const poin_didapat = question.poin;
      await Pengguna.findByIdAndUpdate(id_pengguna, {
        $inc: { poin_game: poin_didapat }
      });

      res.status(200).json({
        is_correct: true,
        penjelasan: question.penjelasan,
        poin_didapat: poin_didapat
      });
    } else {
      // JAWABAN SALAH
      res.status(200).json({
        is_correct: false,
        penjelasan: question.penjelasan,
        poin_didapat: 0,
        jawaban_benar: correctOption ? correctOption.teks : 'N/A' // Beri tahu jawaban yang benar
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses jawaban', error: error.message });
  }
};