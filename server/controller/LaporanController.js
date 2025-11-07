const Laporan = require('../models/Laporan.js'); // Sesuaikan path jika perlu
const mongoose = require('mongoose');

// --- CATATAN PENTING ---
// Fungsi Pengguna berasumsi 'req.user.id' tersedia dari middleware auth
// Fungsi Admin berasumsi 'req.admin.id' tersedia dari middleware auth admin

// --- FUNGSI PENGGUNA ---

/**
 * @desc    Membuat laporan baru
 * @route   POST /api/laporan
 * @access  Private (Pengguna)
 */
const createLaporan = async (req, res) => {
  try {
    const id_pelapor = req.user.id;
    const { terlapor, tipe_laporan, id_pesanan, id_produk, deskripsi, bukti } = req.body;

    if (!terlapor || !tipe_laporan || !deskripsi) {
      return res.status(400).json({ message: 'Terlapor, tipe laporan, dan deskripsi wajib diisi' });
    }

    // Validasi agar tidak melaporkan diri sendiri
    if (terlapor === id_pelapor) {
      return res.status(400).json({ message: 'Anda tidak bisa melaporkan diri sendiri' });
    }

    // Asumsi 'bukti' adalah array of URL dari Cloudinary
    const newLaporan = new Laporan({
      pelapor: id_pelapor,
      terlapor,
      tipe_laporan,
      id_pesanan,
      id_produk,
      deskripsi,
      bukti,
      status: 'pending' // Status di-set otomatis, user tdk bisa set
    });

    const savedLaporan = await newLaporan.save();
    res.status(201).json({ message: 'Laporan berhasil dikirim dan akan segera diproses', data: savedLaporan });

  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Mendapatkan daftar laporan yang dibuat oleh pengguna
 * @route   GET /api/laporan/saya
 * @access  Private (Pengguna)
 */
const getMyLaporan = async (req, res) => {
  try {
    const id_pelapor = req.user.id;

    const laporanList = await Laporan.find({ pelapor: id_pelapor })
      .populate('terlapor', 'nama')
      .populate('ditangani_oleh', 'nama')
      .sort({ createdAt: -1 });

    res.status(200).json(laporanList);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Mendapatkan detail satu laporan (milik pengguna)
 * @route   GET /api/laporan/:id
 * @access  Private (Pengguna)
 */
const getMyLaporanById = async (req, res) => {
  try {
    const id_pelapor = req.user.id;
    const { id: id_laporan } = req.params;

    const laporan = await Laporan.findById(id_laporan)
      .populate('terlapor', 'nama foto_profil')
      .populate('ditangani_oleh', 'nama')
      .populate('id_produk', 'nama_produk slug')
      .populate('id_pesanan', 'kode_pesanan');
      
    if (!laporan) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    // Validasi kepemilikan
    if (laporan.pelapor.toString() !== id_pelapor) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    res.status(200).json(laporan);
  } catch (error) {
    if (error.kind === 'ObjectId') {
       return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};


// --- FUNGSI ADMIN ---

/**
 * @desc    (Admin) Mendapatkan semua laporan (untuk dashboard)
 * @route   GET /api/admin/laporan
 * @access  Private (Admin)
 */
const getAllLaporanForAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (status) filter.status = status; // Filter by pending, proses, etc.
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const laporanList = await Laporan.find(filter)
      .populate('pelapor', 'nama email')
      .populate('terlapor', 'nama email')
      .sort({ status: 1, createdAt: -1 }) // Tampilkan 'pending' di atas
      .skip(skip)
      .limit(parseInt(limit));
      
    const totalLaporan = await Laporan.countDocuments(filter);
    const totalPages = Math.ceil(totalLaporan / limit);
    
     res.status(200).json({
      data: laporanList,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalLaporan,
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    (Admin) Update status atau tindakan laporan
 * @route   PUT /api/admin/laporan/:id
 * @access  Private (Admin)
 */
const updateLaporanByAdmin = async (req, res) => {
  try {
    const id_admin = req.admin.id;
    const { id: id_laporan } = req.params;
    const { status, tindakan_admin } = req.body;

    if (!status && !tindakan_admin) {
      return res.status(400).json({ message: 'Status atau tindakan admin harus diisi' });
    }

    let updateData = {
      ...req.body,
      ditangani_oleh: id_admin // Otomatis catat siapa admin yg menangani
    };
    
    const updatedLaporan = await Laporan.findByIdAndUpdate(
      id_laporan,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedLaporan) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    
    res.status(200).json({ message: 'Laporan berhasil diupdate', data: updatedLaporan });

  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    (Admin) Menghapus laporan (jika diperlukan)
 * @route   DELETE /api/admin/laporan/:id
 * @access  Private (Admin)
 */
const deleteLaporan = async (req, res) => {
  try {
    const deletedLaporan = await Laporan.findByIdAndDelete(req.params.id);
    
    if (!deletedLaporan) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    
    res.status(200).json({ message: 'Laporan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};


module.exports = {
  // Rute Pengguna
  createLaporan,
  getMyLaporan,
  getMyLaporanById,
  
  // Rute Admin
  getAllLaporanForAdmin,
  updateLaporanByAdmin,
  deleteLaporan
};