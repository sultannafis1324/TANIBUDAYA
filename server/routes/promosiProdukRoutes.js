import express from 'express';

// 1. Impor controller
import {
  addProdukToPromo,
  removeProdukFromPromo,
  getProdukByPromo,
  getPromoByProduk
} from '../controller/PromosiProdukController.js';

// 2. Impor middleware "satpam"
import { authAdmin } from '../middleware/authAdmin.js'; // Pastikan path ini benar

// 3. Inisialisasi router
const router = express.Router();

// --- Rute Khusus Admin ---
// Di server.js, ini akan dipanggil sebagai '/api/promo-produk'

// @desc    (Admin) Menambahkan/mendaftarkan produk ke promosi
// @route   POST /api/promo-produk
router.post('/', authAdmin, addProdukToPromo);

// @desc    (Admin) Menghapus produk dari promosi (berdasarkan ID link)
// @route   DELETE /api/promo-produk/:id
router.delete('/:id', authAdmin, removeProdukFromPromo);

// @desc    (Admin) Melihat semua produk dalam satu promosi
// @route   GET /api/promo-produk/by-promo/:id_promo
router.get('/by-promo/:id_promo', authAdmin, getProdukByPromo);

// @desc    (Admin) Melihat semua promosi yang diikuti satu produk
// @route   GET /api/promo-produk/by-produk/:id_produk
router.get('/by-produk/:id_produk', authAdmin, getPromoByProduk);


export default router;