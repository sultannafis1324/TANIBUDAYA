import express from 'express';
import {
  getAllKontenBudaya,
  getKontenBudayaPublik,
  getKontenBudayaById,
  createKontenBudaya,
  updateKontenBudaya,
  updateStatusKonten,
  deleteKontenBudaya,
  getProvinces,
  getRegencies,
  getDistricts
} from '../controller/KontenBudayaController.js';
import { uploadMiddleware } from '../utils/cloudinary.js';

const router = express.Router();

// 📍 Area routes
router.get('/provinces', getProvinces);
router.get('/regencies/:provinceId', getRegencies);
router.get('/districts/:regencyId', getDistricts);

// 📚 Konten Budaya routes
router.get('/', getAllKontenBudaya);
router.get('/publik', getKontenBudayaPublik);
router.get('/:id', getKontenBudayaById);
router.post('/', uploadMiddleware.array('media', 10), createKontenBudaya);
router.put('/:id', uploadMiddleware.array('media', 10), updateKontenBudaya);
router.patch('/:id/status', updateStatusKonten);
router.delete('/:id', deleteKontenBudaya);

export default router;
