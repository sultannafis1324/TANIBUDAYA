import express from 'express';

// 1. Impor controller
import {
  createUlasan,
  getUlasanForItem,
  replyToUlasan,
  deleteUlasan
} from '../controller/UlasanController.js';

// 2. Impor middleware "satpam"
import { authPengguna } from '../middleware/authPengguna.js';
import { authAdmin } from '../middleware/authAdmin.js';
import { authPenjual } from '../middleware/authPenjual.js'; // Dibutuhkan untuk membalas

// 3. Inisialisasi router
const router = express.Router();

// --- Rute Publik ---
// @desc    Mendapatkan semua ulasan untuk satu item (Produk/Budaya)
// @route   GET /api/ulasan?id_produk=...
router.get('/', getUlasanForItem);

// --- Rute Pengguna (Login) ---
// @desc    Membuat ulasan baru
// @route   POST /api/ulasan
router.post('/', authPengguna, createUlasan);

// --- Rute Penjual (Login & Terverifikasi) ---
// @desc    Membalas ulasan
// @route   POST /api/ulasan/:id/reply
// authPenjual WAJIB dijalankan setelah authPengguna
router.post('/:id/reply', authPengguna, authPenjual, replyToUlasan);

// --- Rute Khusus Admin ---
// @desc    (Admin) Menghapus ulasan (Moderasi)
// @route   DELETE /api/ulasan/admin/:id
router.delete('/admin/:id', authAdmin, deleteUlasan);


export default router;