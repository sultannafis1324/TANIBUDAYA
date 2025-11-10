import express from 'express';
import {
  getPublicKategori,
  getPublicKategoriById,
  createKategori,
  getAllKategoriForAdmin,
  updateKategori,
  deleteKategori
} from '../controller/KategoriController.js';

const router = express.Router();

// List kategori (semua bisa)
router.get('/', getAllKategoriForAdmin); // tampilkan semua kategori

// CRUD (sementara tanpa middleware, bisa semua)
router.post('/', createKategori);
router.put('/:id', updateKategori);
router.delete('/:id', deleteKategori);

export default router;
