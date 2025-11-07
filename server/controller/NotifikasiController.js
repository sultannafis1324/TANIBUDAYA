const Notifikasi = require('../models/Notifikasi.js'); // Sesuaikan path
const Pengguna = require('../models/Pengguna.js'); // Diperlukan untuk kirim massal
const mongoose = require('mongoose');

// --- CATATAN PENTING ---
// Sebagian besar notifikasi (pesanan, chat) akan dibuat
// oleh controller LAIN (misal: pesananController, chatController).
// Controller ini fokus untuk MENGELOLA dan MENGIRIM notifikasi.

// --- FUNGSI PENGGUNA ---
// Berasumsi 'req.user.id' tersedia dari middleware auth

/**
 * @desc    Mendapatkan semua notifikasi milik pengguna (dengan pagination)
 * @route   GET /api/notifikasi
 * @access  Private (Pengguna)
 */
const getNotifikasiSaya = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { page = 1, limit = 15 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifikasiList = await Notifikasi.find({ id_pengguna: id_pengguna })
      .sort({ createdAt: -1 }) // Tampilkan terbaru di atas
      .skip(skip)
      .limit(parseInt(limit));
      
    const totalNotifikasi = await Notifikasi.countDocuments({ id_pengguna: id_pengguna });
    const totalPages = Math.ceil(totalNotifikasi / limit);

    res.status(200).json({
      data: notifikasiList,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalNotifikasi,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Menandai satu notifikasi sebagai 'sudah dibaca'
 * @route   PATCH /api/notifikasi/:id/read
 * @access  Private (Pengguna)
 */
const markAsRead = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id: id_notifikasi } = req.params;

    const notifikasi = await Notifikasi.findOneAndUpdate(
      { _id: id_notifikasi, id_pengguna: id_pengguna },
      { is_read: true },
      { new: true }
    );

    if (!notifikasi) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan atau akses ditolak' });
    }

    res.status(200).json(notifikasi);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Menandai SEMUA notifikasi pengguna sebagai 'sudah dibaca'
 * @route   POST /api/notifikasi/read-all
 * @access  Private (Pengguna)
 */
const markAllAsRead = async (req, res) => {
  try {
    const id_pengguna = req.user.id;

    await Notifikasi.updateMany(
      { id_pengguna: id_pengguna, is_read: false },
      { is_read: true }
    );

    res.status(200).json({ message: 'Semua notifikasi telah ditandai terbaca' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Mendapatkan jumlah notifikasi yang BELUM dibaca
 * @route   GET /api/notifikasi/unread-count
 * @access  Private (Pengguna)
 */
const getUnreadCount = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const count = await Notifikasi.countDocuments({
      id_pengguna: id_pengguna,
      is_read: false
    });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Menghapus satu notifikasi
 * @route   DELETE /api/notifikasi/:id
 * @access  Private (Pengguna)
 */
const deleteNotifikasi = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id: id_notifikasi } = req.params;

    const deleted = await Notifikasi.findOneAndDelete({
      _id: id_notifikasi,
      id_pengguna: id_pengguna
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan atau akses ditolak' });
    }

    res.status(200).json({ message: 'Notifikasi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};


// --- FUNGSI ADMIN ---
// Berasumsi 'req.admin.id' tersedia dari middleware auth admin

/**
 * @desc    (Admin) Mengirim notifikasi ke satu pengguna spesifik
 * @route   POST /api/admin/notifikasi/send-single
 * @access  Private (Admin)
 */
const sendSingleNotifikasi = async (req, res) => {
  try {
    const { id_pengguna, judul, pesan, tipe, link, icon } = req.body;

    if (!id_pengguna || !judul || !pesan || !tipe) {
      return res.status(400).json({ message: 'ID Pengguna, judul, pesan, dan tipe wajib diisi' });
    }

    const newNotifikasi = new Notifikasi({
      id_pengguna,
      judul,
      pesan,
      tipe: tipe || 'sistem',
      link,
      icon
    });

    await newNotifikasi.save();
    res.status(201).json({ message: 'Notifikasi berhasil dikirim', data: newNotifikasi });

  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    (Admin) Mengirim notifikasi ke SEMUA pengguna (Promosi/Sistem)
 * @route   POST /api/admin/notifikasi/send-mass
 * @access  Private (Admin)
 */
const sendMassNotifikasi = async (req, res) => {
  try {
    const { judul, pesan, tipe, link, icon } = req.body;

    if (!judul || !pesan || !tipe) {
      return res.status(400).json({ message: 'Judul, pesan, dan tipe wajib diisi' });
    }

    // 1. Ambil SEMUA ID pengguna
    const allPengguna = await Pengguna.find({ status: 'aktif' }).select('_id');
    
    if (allPengguna.length === 0) {
       return res.status(404).json({ message: 'Tidak ada pengguna aktif ditemukan' });
    }

    // 2. Buat array dokumen notifikasi
    const notifikasiDocs = allPengguna.map(user => ({
      id_pengguna: user._id,
      judul,
      pesan,
      tipe: tipe || 'promosi',
      link,
      icon
    }));

    // 3. Masukkan semua sekaligus (jauh lebih cepat)
    await Notifikasi.insertMany(notifikasiDocs);

    res.status(200).json({ message: `Notifikasi massal berhasil dikirim ke ${allPengguna.length} pengguna` });
    
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};


module.exports = {
  // Rute Pengguna
  getNotifikasiSaya,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotifikasi,
  
  // Rute Admin
  sendSingleNotifikasi,
  sendMassNotifikasi
};