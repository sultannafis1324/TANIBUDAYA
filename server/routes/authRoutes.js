import express from 'express';
import AuthController from '../controller/AuthController.js';

const router = express.Router();

// Login universal
router.post('/login', AuthController.login);

// Register pengguna (user biasa)
router.post('/register-pengguna', AuthController.registerPengguna);

// Register admin (sementara)
router.post('/register-admin', AuthController.registerAdmin);

export default router;
