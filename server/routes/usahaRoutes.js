// routes/usahaRoutes.js
import express from 'express';
import { verifyToken, isAdmin, isPengguna } from '../middleware/authMiddleware.js';
import {
  createProfileUsaha,
  getMyProfileUsaha,
  updateMyProfileUsaha,
  getAllProfileUsaha,
  getProfileUsahaById,
  verifyProfileUsaha,
  deleteProfileUsaha,
  getAllApprovedUsaha,
  getPublicProfileUsahaBySlug
} from '../controller/ProfileUsahaController.js';

const router = express.Router();

/**
 * =========================
 * 🔹 ROUTE PENJUAL / PENGGUNA
 * =========================
 */
// Hanya pengguna yang bisa daftar usaha (nanti otomatis jadi penjual)
router.post('/daftar', verifyToken, isPengguna, createProfileUsaha);
router.get('/saya', verifyToken, isPengguna, getMyProfileUsaha);
router.put('/saya', verifyToken, isPengguna, updateMyProfileUsaha);

/**
 * =========================
 * 🔹 ROUTE ADMIN
 * =========================
 */
router.get('/admin/all', verifyToken, isAdmin, getAllProfileUsaha);
router.get('/admin/:id', verifyToken, isAdmin, getProfileUsahaById);
router.patch('/admin/:id/status', verifyToken, isAdmin, verifyProfileUsaha);
router.delete('/admin/:id', verifyToken, isAdmin, deleteProfileUsaha);

/**
 * =========================
 * 🔹 ROUTE PUBLIK
 * =========================
 */
router.get('/public', getAllApprovedUsaha);
router.get('/by-slug/:slug', getPublicProfileUsahaBySlug);

export default router;