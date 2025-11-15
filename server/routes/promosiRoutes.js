// routes/promosiRoutes.js
import express from 'express';
// Impor middleware yang relevan
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

// Impor controller yang sudah kita buat sebelumnya
import {
  createPromosi,
  getAllPromosi,
  getPromosiById,
  getPromosiByKode,
  updatePromosi,
  deletePromosi
} from '../controllers/promosiController.js'; // Pastikan path ini benar

const router = express.Router();

/**
 * =========================
 * 🔹 ROUTE ADMIN
 * (Memerlukan token & status admin)
 * =========================
 */

// [Admin] Membuat promosi baru
// POST /api/promosi/
router.post('/', verifyToken, isAdmin, createPromosi);

// [Admin] Mendapatkan SEMUA promosi (untuk dashboard admin, bisa filter)
// GET /api/promosi/admin/all
router.get('/admin/all', verifyToken, isAdmin, getAllPromosi);

// [Admin] Mendapatkan detail satu promosi berdasarkan ID (untuk form edit)
// GET /api/promosi/admin/:id
router.get('/admin/:id', verifyToken, isAdmin, getPromosiById);

// [Admin] Mengupdate promosi
// PUT /api/promosi/admin/:id
router.put('/admin/:id', verifyToken, isAdmin, updatePromosi);

// [Admin] Menghapus promosi
// DELETE /api/promosi/admin/:id
router.delete('/admin/:id', verifyToken, isAdmin, deletePromosi);


/**
 * =========================
 * 🔹 ROUTE PUBLIK / PENGGUNA
 * (Terbuka untuk semua)
 * =========================
 */

// [Publik] Mendapatkan semua promosi (frontend bisa filter ?status=aktif)
// GET /api/promosi/
router.get('/', getAllPromosi);

// [Publik] Mendapatkan promosi berdasarkan KODE (untuk validasi di keranjang)
// GET /api/promosi/kode/:kode
router.get('/kode/:kode', getPromosiByKode);


export default router;// routes/promosiRoutes.js
import express from 'express';
// Impor middleware yang relevan
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

// Impor controller yang sudah kita buat sebelumnya
import {
  createPromosi,
  getAllPromosi,
  getPromosiById,
  getPromosiByKode,
  updatePromosi,
  deletePromosi
} from '../controllers/promosiController.js'; // Pastikan path ini benar

const router = express.Router();

/**
 * =========================
 * 🔹 ROUTE ADMIN
 * (Memerlukan token & status admin)
 * =========================
 */

// [Admin] Membuat promosi baru
// POST /api/promosi/
router.post('/', verifyToken, isAdmin, createPromosi);

// [Admin] Mendapatkan SEMUA promosi (untuk dashboard admin, bisa filter)
// GET /api/promosi/admin/all
router.get('/admin/all', verifyToken, isAdmin, getAllPromosi);

// [Admin] Mendapatkan detail satu promosi berdasarkan ID (untuk form edit)
// GET /api/promosi/admin/:id
router.get('/admin/:id', verifyToken, isAdmin, getPromosiById);

// [Admin] Mengupdate promosi
// PUT /api/promosi/admin/:id
router.put('/admin/:id', verifyToken, isAdmin, updatePromosi);

// [Admin] Menghapus promosi
// DELETE /api/promosi/admin/:id
router.delete('/admin/:id', verifyToken, isAdmin, deletePromosi);


/**
 * =========================
 * 🔹 ROUTE PUBLIK / PENGGUNA
 * (Terbuka untuk semua)
 * =========================
 */

// [Publik] Mendapatkan semua promosi (frontend bisa filter ?status=aktif)
// GET /api/promosi/
router.get('/', getAllPromosi);

// [Publik] Mendapatkan promosi berdasarkan KODE (untuk validasi di keranjang)
// GET /api/promosi/kode/:kode
router.get('/kode/:kode', getPromosiByKode);


export default router;