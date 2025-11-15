import express from 'express';

// 1. Impor controller
import {
  sendMessage,
  getMyConversations,
  getConversationMessages,
  markAsRead
} from '../controller/RiwayatChatController.js';

// 2. Impor middleware "satpam"
import { authPengguna } from '../middleware/authPengguna.js';

// 3. Inisialisasi router
const router = express.Router();

// SEMUA rute chat harus login, jadi kita pakai middleware di awal
router.use(authPengguna);

// @desc    Mengirim pesan baru
// @route   POST /api/riwayat-chat
router.post('/', sendMessage);

// @desc    Mendapatkan daftar (inbox) semua percakapan pengguna
// @route   GET /api/riwayat-chat
router.get('/', getMyConversations);

// @desc    Mendapatkan semua pesan dari satu thread percakapan
// @route   GET /api/riwayat-chat/:id
router.get('/:id', getConversationMessages);

// @desc    Menandai pesan dalam thread sebagai telah dibaca
// @route   PATCH /api/riwayat-chat/:id/read
router.patch('/:id/read', markAsRead);


export default router;