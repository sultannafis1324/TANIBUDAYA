import express from 'express';
import {
  checkPaymentStatus,
  getPaymentByPesananId,
  changePaymentMethod
} from '../controller/PaymentController.js';
import { verifyToken, isPengguna } from '../middleware/authMiddleware.js';

const router = express.Router();

// Check payment status (manual check)
router.get('/:id/check', verifyToken, isPengguna, checkPaymentStatus);

// Get payment by pesanan ID
router.get('/pesanan/:pesanan_id', verifyToken, isPengguna, getPaymentByPesananId);

// Change payment method
router.post('/:id/change-method', verifyToken, isPengguna, changePaymentMethod);

export default router;