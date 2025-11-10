import express from "express";
import {
  getPublicProduk,
  getProdukBySlug } from "../controller/MarketplaceController.js";

const router = express.Router();

// Public routes (untuk marketplace & detail produk)
router.get('/public', getPublicProduk); // Semua produk aktif
router.get('/slug/:slug', getProdukBySlug); // Detail produk by slug

export default router;
