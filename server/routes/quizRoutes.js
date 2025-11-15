import express from 'express';

// 1. Impor controller
import {
  createQuiz,
  getAllQuizForAdmin,
  updateQuiz,
  deleteQuiz,
  getQuizBatch,
  submitQuizAnswer
} from '../controller/QuizController.js';

// 2. Impor middleware "satpam"
import { authAdmin } from '../middleware/authAdmin.js';
import { authPengguna } from '../middleware/authPengguna.js';

// 3. Inisialisasi router
const router = express.Router();

// --- Rute Pengguna (Game Play) ---
// @desc    (Pengguna) Mengambil batch soal kuis untuk dimainkan
// @route   GET /api/quiz/play
router.get('/play', authPengguna, getQuizBatch);

// @desc    (Pengguna) Mensubmit jawaban kuis (untuk 1 soal)
// @route   POST /api/quiz/submit
router.post('/submit', authPengguna, submitQuizAnswer);


// --- Rute Khusus Admin (CRUD) ---
// @desc    (Admin) Membuat pertanyaan kuis baru
// @route   POST /api/quiz/admin
router.post('/admin', authAdmin, createQuiz);

// @desc    (Admin) Mendapatkan semua kuis (termasuk nonaktif)
// @route   GET /api/quiz/admin
router.get('/admin', authAdmin, getAllQuizForAdmin);

// @desc    (Admin) Update kuis
// @route   PUT /api/quiz/admin/:id
router.put('/admin/:id', authAdmin, updateQuiz);

// @desc    (Admin) Menghapus kuis (Soft Delete)
// @route   DELETE /api/quiz/admin/:id
router.delete('/admin/:id', authAdmin, deleteQuiz);


export default router;