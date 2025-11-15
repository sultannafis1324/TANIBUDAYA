import express from "express";
import {
  getKeranjang,
  addToKeranjang,
  updateJumlahKeranjang,
  toggleCheckKeranjang,
  toggleCheckAllPenjual,
  deleteKeranjangItem,
  deleteMultipleKeranjang,
  getKeranjangSummary,
  clearKeranjang,
} from "../controller/KeranjangController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Semua route keranjang harus login
router.use(verifyToken);

// GET keranjang user (grouped by penjual)
router.get("/", getKeranjang);

// GET summary (total item & harga yang di-check)
router.get("/summary", getKeranjangSummary);

// ADD produk ke keranjang
router.post("/", addToKeranjang);

// UPDATE jumlah produk
router.put("/:id/jumlah", updateJumlahKeranjang);

// TOGGLE checkbox single item
router.patch("/:id/check", toggleCheckKeranjang);

// TOGGLE checkbox all items per penjual
router.patch("/check-all-penjual", toggleCheckAllPenjual);

// DELETE single item
router.delete("/:id", deleteKeranjangItem);

// DELETE multiple items
router.delete("/", deleteMultipleKeranjang);

// CLEAR semua keranjang
router.delete("/clear/all", clearKeranjang);

export default router;