import express from 'express';

// 1. Impor controller
import {
  submitGameSession,
  getMyGameHistory,
  getLeaderboardTotal,
  getLeaderboardSession
} from '../controller/SkorGameController.js';

// 2. Impor middleware "satpam"
import { authPengguna } from '../middleware/authPengguna.js';

// 3. Inisialisasi router
const router = express.Router();

// --- Rute Pengguna (Login) ---
// @desc    (Pengguna) Mensubmit hasil satu sesi game
// @route   POST /api/game/submit
router.post('/submit', authPengguna, submitGameSession);

// @desc    (Pengguna) Mendapatkan riwayat game miliknya
// @route   GET /api/game/history
router.get('/history', authPengguna, getMyGameHistory);


// --- Rute Publik (Leaderboard) ---
// @desc    (Publik) Mendapatkan Leaderboard Total Poin (Leaderboard Utama)
// @route   GET /api/game/leaderboard/total
router.get('/leaderboard/total', getLeaderboardTotal);

// @desc    (Publik) Mendapatkan Leaderboard Sesi Terbaik (High Score)
// @route   GET /api/game/leaderboard/session
router.get('/leaderboard/session', getLeaderboardSession);


export default router;