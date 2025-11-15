import express from 'express';
import {
  createPesanan,
  getAllPesanan,
  getPesananById,
  getPesananPenjual,
  updateStatusPesanan,
  cancelPesanan
} from '../controller/PesananController.js';
import { verifyToken, isPengguna, isPenjual } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes untuk PEMBELI
router.post('/', verifyToken, isPengguna, createPesanan);
router.get('/', verifyToken, isPengguna, getAllPesanan);
router.get('/:id', verifyToken, isPengguna, getPesananById);
router.post('/:id/cancel', verifyToken, isPengguna, cancelPesanan);

// ✅ Routes untuk PENJUAL - Gunakan isPenjual middleware
router.get('/penjual/orders', verifyToken, isPenjual, getPesananPenjual);
router.put('/:id/status', verifyToken, isPenjual, updateStatusPesanan);

export default router;