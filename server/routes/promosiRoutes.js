import express from 'express';

// 1. Impor controller
import {
  createPromosi,
  getAllPromosiForAdmin,
  updatePromosi,
  deletePromosi,
  getPublicPromosi,
  validatePromo
} from '../controller/PromosiController.js';

// 2. Impor middleware "satpam"
import { authAdmin } from '../middleware/authAdmin.js';
import { authPengguna } from '../middleware/authPengguna.js';

// 3. Inisialisasi router
const router = express.Router();

// --- Rute Publik ---
// @desc    (Publik) Mendapatkan daftar promosi yang sedang aktif
// @route   GET /api/promosi
router.get('/', getPublicPromosi);

// --- Rute Pengguna (Login) ---
// @desc    (Pengguna) Memvalidasi kode promo saat checkout
// @route   POST /api/promosi/validate
router.post('/validate', authPengguna, validatePromo);


// --- Rute Khusus Admin ---
// @desc    (Admin) Membuat promosi baru
// @route   POST /api/promosi/admin
router.post('/admin', authAdmin, createPromosi);

// @desc    (Admin) Mendapatkan semua promosi
// @route   GET /api/promosi/admin
router.get('/admin', authAdmin, getAllPromosiForAdmin);

// @desc    (Admin) Update promosi
// @route   PUT /api/promosi/admin/:id
router.put('/admin/:id', authAdmin, updatePromosi);

// @desc    (Admin) Hapus promosi
// @route   DELETE /api/promosi/admin/:id
router.delete('/admin/:id', authAdmin, deletePromosi);


export default router;