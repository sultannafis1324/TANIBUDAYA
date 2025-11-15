import express from 'express';

// 1. Impor controller
import {
  createLaporan,
  getMyLaporan,
  getAllLaporan,
  getLaporanById,
  updateLaporanStatus
} from '../controller/LaporanController.js';

// 2. Impor middleware "satpam"
import { authPengguna } from '../middleware/authPengguna.js';
import { authAdmin } from '../middleware/authAdmin.js';

// 3. Inisialisasi router
const router = express.Router();

// --- Rute Pengguna (Login) ---
// @desc    Membuat laporan baru
// @route   POST /api/laporan
router.post('/', authPengguna, createLaporan);

// @desc    Melihat riwayat laporan milik sendiri
// @route   GET /api/laporan/saya
router.get('/saya', authPengguna, getMyLaporan);


// --- Rute Khusus Admin ---
// @desc    (Admin) Mendapatkan semua laporan (bisa difilter by status)
// @route   GET /api/laporan/admin
router.get('/admin', authAdmin, getAllLaporan);

// @desc    (Admin) Mendapatkan detail satu laporan
// @route   GET /api/laporan/admin/:id
router.get('/admin/:id', authAdmin, getLaporanById);

// @desc    (Admin) Update status laporan (menangani laporan)
// @route   PUT /api/laporan/admin/:id
router.put('/admin/:id', authAdmin, updateLaporanStatus);


export default router;