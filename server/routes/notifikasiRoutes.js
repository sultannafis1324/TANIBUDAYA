import express from 'express'
import {
  getNotifikasiSaya,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotifikasi,
  sendSingleNotifikasi,
  sendMassNotifikasi
} from '../controller/NotifikasiController.js'

const router = express.Router()

// Rute untuk pengguna
router.get('/', getNotifikasiSaya)
router.get('/unread-count', getUnreadCount)
router.patch('/:id/read', markAsRead)
router.post('/read-all', markAllAsRead)
router.delete('/:id', deleteNotifikasi)

// Rute untuk admin
router.post('/admin/send-single', sendSingleNotifikasi)
router.post('/admin/send-mass', sendMassNotifikasi)

export default router
