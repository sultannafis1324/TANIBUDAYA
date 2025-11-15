// routes/promosiProdukRoutes.js
import express from 'express';

// Impor middleware otentikasi
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

// Impor fungsi controller yang baru Anda buat
import {
  addProdukToPromo,
  removeProdukFromPromo,
  getProdukByPromo,
  getPromoByProduk
} from '../controllers/PromosiProdukController.js'; // Sesuaikan path jika perlu

const router = express.Router();

// -----------------------------------------------------------------
// 🔒 Semua rute di file ini dilindungi (Admin Only)
// -----------------------------------------------------------------
// Kita terapkan middleware di sini agar berlaku untuk semua rute di bawah
router.use(verifyToken, isAdmin);


/**
 * @desc    Menambahkan produk ke promosi
 * @route   POST /api/admin/promo-produk
 */
router.post('/promo-produk', addProdukToPromo);

/**
 * @desc    Menghapus produk dari promosi (berdasarkan ID link)
 * @route   DELETE /api/admin/promo-produk/:id
 */
router.delete('/promo-produk/:id', removeProdukFromPromo);

/**
 * @desc    Melihat semua produk dalam satu promosi
 * @route   GET /api/admin/promosi/:id_promo/produk
 */
router.get('/promosi/:id_promo/produk', getProdukByPromo);

/**
 * @desc    Melihat semua promosi yang diikuti satu produk
 * @route   GET /api/admin/produk/:id_produk/promosi
 */
router.get('/produk/:id_produk/promosi', getPromoByProduk);


export default router;