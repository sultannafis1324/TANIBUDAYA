import express from 'express';
import {
  getAllProfileUsaha,
  getMyProfileUsaha, // ✅ Tambah ini
  getProfileUsahaByUserId,
  getProfileUsahaById,
  getProfileUsahaBySlug,
  createProfileUsaha,
  updateProfileUsaha,
  updateStatusVerifikasi,
  deleteProfileUsaha
} from '../controller/ProfileUsahaController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../utils/cloudinary.js';

const router = express.Router();

// Public routes
router.get('/slug/:slug', getProfileUsahaBySlug);

// Protected routes
router.get('/', verifyToken, getAllProfileUsaha);
router.get('/my-usaha', verifyToken, getMyProfileUsaha); // ✅ Endpoint baru untuk ambil usaha sendiri
router.get('/user/:userId', verifyToken, getProfileUsahaByUserId);
router.get('/:id', verifyToken, getProfileUsahaById);

// Create/Update (multi-file upload)
router.post('/', 
  verifyToken, 
  uploadMiddleware.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'dokumen', maxCount: 5 }
  ]), 
  createProfileUsaha
);

router.put('/:id', 
  verifyToken, 
  uploadMiddleware.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'dokumen', maxCount: 5 }
  ]), 
  updateProfileUsaha
);

// Admin only
router.patch('/:id/status', verifyToken, isAdmin, updateStatusVerifikasi);
router.delete('/:id', verifyToken, isAdmin, deleteProfileUsaha);

export default router;