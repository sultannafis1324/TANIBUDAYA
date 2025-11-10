import express from 'express';
import {
  getAllProduk,
  getProdukById,
  createProduk,
  updateProduk,
  deleteProduk
} from '../controller/ProdukController.js';
import { verifyToken, isPenjual } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../utils/cloudinary.js';

const router = express.Router();

// Protected routes (perlu login sebagai penjual)
router.get('/', verifyToken, isPenjual, getAllProduk);
router.get('/:id', verifyToken, isPenjual, getProdukById);

// ✅ Upload langsung ke Cloudinary (max 5 files)
router.post('/', verifyToken, isPenjual, uploadMiddleware.array('media', 5), createProduk);
router.put('/:id', verifyToken, isPenjual, uploadMiddleware.array('media', 5), updateProduk);

router.delete('/:id', verifyToken, isPenjual, deleteProduk);

export default router;