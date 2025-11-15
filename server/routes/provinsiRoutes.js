import express from 'express';

// 1. Impor controller
import {
  getAllProvinsi,
  getProvinsiById,
  createProvinsi,
  updateProvinsi,
  deleteProvinsi
} from '../controller/ProvinsiController.js';

// 2. Impor middleware "satpam"
import { authAdmin } from '../middleware/authAdmin.js'; // Pastikan path ini benar

// 3. Inisialisasi router
const router = express.Router();

// --- Rute Publik (Read-Only) ---
// @desc    Mendapatkan semua data provinsi
// @route   GET /api/provinsi
router.get('/', getAllProvinsi);

// @desc    Mendapatkan detail satu provinsi
// @route   GET /api/provinsi/:id
router.get('/:id', getProvinsiById);


// --- Rute Khusus Admin (CRUD) ---
// @desc    (Admin) Menambahkan provinsi baru
// @route   POST /api/provinsi/admin
router.post('/admin', authAdmin, createProvinsi);

// @desc    (Admin) Update data provinsi
// @route   PUT /api/provinsi/admin/:id
router.put('/admin/:id', authAdmin, updateProvinsi);

// @desc    (Admin) Menghapus provinsi
// @route   DELETE /api/provinsi/admin/:id
router.delete('/admin/:id', authAdmin, deleteProvinsi);


export default router;