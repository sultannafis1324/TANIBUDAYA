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
// ✅ TAMBAHKAN ROUTE INI - Get alamat user yang sedang login
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // dari token JWT
    const Alamat = (await import('../models/Alamat.js')).default;
    
    const alamat = await Alamat.find({ id_pengguna: userId })
      .sort({ is_default: -1, createdAt: -1 });

    res.json({ success: true, data: alamat });
  } catch (err) {
    console.error('Error get alamat:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil alamat', 
      error: err.message 
    });
  }
});

router.get('/user/:userId', verifyToken, getAlamatByUser);
router.get('/:id', verifyToken, getAlamatById);
router.post('/', verifyToken, createAlamat);
router.put('/:id', verifyToken, updateAlamat);
router.patch('/:id/set-default', verifyToken, setDefaultAlamat);
router.delete('/:id', verifyToken, deleteAlamat);

export default router;