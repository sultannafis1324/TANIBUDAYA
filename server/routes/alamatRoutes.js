import express from 'express';
import {
  getProvinces,
  getRegencies,
  getDistricts,
  getVillages,
  getAlamatByUser,
  getAlamatById,
  createAlamat,
  updateAlamat,
  setDefaultAlamat,
  deleteAlamat
} from '../controller/AlamatController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 📍 Area routes (public - tidak perlu auth)
router.get('/provinces', getProvinces);
router.get('/regencies/:provinceId', getRegencies);
router.get('/districts/:regencyId', getDistricts);
router.get('/villages/:districtId', getVillages);

// 📦 Alamat routes (protected)
router.get('/user/:userId', verifyToken, getAlamatByUser);
router.get('/:id', verifyToken, getAlamatById);
router.post('/', verifyToken, createAlamat);
router.put('/:id', verifyToken, updateAlamat);
router.patch('/:id/set-default', verifyToken, setDefaultAlamat);
router.delete('/:id', verifyToken, deleteAlamat);

export default router;