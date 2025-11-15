import express from 'express';

// 1. Impor controller
import {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
  checkWishlistStatus
} from '../controller/WishlistController.js';

// 2. Impor middleware "satpam"
import { authPengguna } from '../middleware/authPengguna.js'; // Pastikan path ini benar

// 3. Inisialisasi router
const router = express.Router();

// --- Rute Pengguna (Login) ---
// Semua rute di sini akan otomatis diawali dengan '/api/wishlist'
// (sesuai pengaturan di server.js Anda)

// @desc    Menambahkan item ke wishlist
// @route   POST /api/wishlist
router.post('/', authPengguna, addToWishlist);

// @desc    Mendapatkan semua item wishlist milik pengguna
// @route   GET /api/wishlist
router.get('/', authPengguna, getMyWishlist);

// @desc    (Utility) Cek status wishlist untuk satu item
// @route   GET /api/wishlist/check/:id_item
router.get('/check/:id_item', authPengguna, checkWishlistStatus);

// @desc    Menghapus item dari wishlist (berdasarkan ID Item)
// @route   DELETE /api/wishlist/:id_item
router.delete('/:id_item', authPengguna, removeFromWishlist);


export default router;