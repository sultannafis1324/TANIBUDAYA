import express from 'express';
import {
  getAllPengguna,
  getPenggunaById,
  updatePengguna,
  updatePassword,
  updateStatusAkun,
  updateRole,
  deletePengguna,
  updatePoinGame
} from '../controller/PenggunaController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../utils/cloudinary.js';

const router = express.Router();

// Admin only routes
router.get('/', verifyToken, isAdmin, getAllPengguna);
router.patch('/:id/status', verifyToken, isAdmin, updateStatusAkun);
router.delete('/:id', verifyToken, isAdmin, deletePengguna);

// User routes
router.get('/:id', verifyToken, getPenggunaById);
router.put('/:id', verifyToken, uploadMiddleware.single('foto'), updatePengguna);
router.patch('/:id/password', verifyToken, updatePassword);
router.patch('/:id/role', verifyToken, updateRole);
router.patch('/:id/poin', verifyToken, updatePoinGame);

export default router;