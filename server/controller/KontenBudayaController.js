const KontenBudaya = require('../models/KontenBudaya.js'); // Sesuaikan path
const mongoose = require('mongoose');

// --- 1. FUNGSI PUBLIK (Read-Only, untuk semua pengunjung) ---

/**
 * @desc    Mendapatkan semua konten yang sudah 'published' (dengan filter & pagination)
 * @route   GET /api/konten
 * @access  Public
 */
const getPublishedKonten = async (req, res) => {
  try {
    const { kategori, provinsi, search, sort, page = 1, limit = 12 } = req.query;

    let filter = { status: 'published' };
    if (kategori) filter.kategori = kategori;
    if (provinsi) filter.provinsi = provinsi;
    if (search) {
      // Cari di judul, tags, atau deskripsi
      filter.$or = [
        { judul: { $regex: search, $options: 'i' } },
        { deskripsi: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let sortOptions = {};
    if (sort === 'populer') {
      sortOptions = { jumlah_views: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating_konten: -1 };
    } else {
      sortOptions = { createdAt: -1 }; // Terbaru
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const kontenList = await KontenBudaya.find(filter)
      .populate('kategori', 'nama_kategori icon')
      .populate('provinsi', 'nama_provinsi')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalKonten = await KontenBudaya.countDocuments(filter);
    const totalPages = Math.ceil(totalKonten / limit);

    res.status(200).json({
      data: kontenList,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalKonten,
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Mendapatkan detail satu konten 'published' (dan +1 view)
 * @route   GET /api/konten/:id
 * @access  Public
 */
const getPublishedKontenById = async (req, res) => {
  try {
    const { id } = req.params;

    // Gunakan findOneAndUpdate untuk mencari sekaligus menambah view (atomik)
    const konten = await KontenBudaya.findOneAndUpdate(
      { _id: id, status: 'published' },
      { $inc: { jumlah_views: 1 } },
      { new: true } // Mengembalikan dokumen yang sudah diupdate
    )
    .populate('kategori', 'nama_kategori')
    .populate('provinsi', 'nama_provinsi')
    .populate('dibuat_oleh', 'nama foto_profil'); // Tampilkan info kontributor

    if (!konten) {
      return res.status(404).json({ message: 'Konten tidak ditemukan atau belum dipublikasi' });
    }
    
    res.status(200).json(konten);
  } catch (error) {
     if (error.kind === 'ObjectId') {
       return res.status(404).json({ message: 'Konten tidak ditemukan' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};


// --- 2. FUNGSI PENGGUNA (Auth 'User' diperlukan) ---
// Berasumsi 'req.user.id' tersedia dari middleware auth

/**
 * @desc    Pengguna mengirimkan usulan konten baru
 * @route   POST /api/konten/usulkan
 * @access  Private (Pengguna)
 */
const submitKonten = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    // Ambil semua data KECUALI status (yg akan di-set manual)
    const { status, ...dataKonten } = req.body;
    
    if (!dataKonten.judul || !dataKonten.kategori || !dataKonten.provinsi || !dataKonten.deskripsi || !dataKonten.media_konten) {
        return res.status(400).json({ message: 'Data wajib (judul, kategori, provinsi, deskripsi, media) harus diisi' });
    }

    // PENTING: Asumsi 'media_konten' berisi URL dari Cloudinary
    // setelah diupload oleh frontend React.

    const newKonten = new KontenBudaya({
      ...dataKonten,
      dibuat_oleh: id_pengguna,
      status: 'pending' // Status otomatis 'pending' menunggu review Admin
    });
    
    const savedKonten = await newKonten.save();
    res.status(201).json({ message: 'Usulan konten berhasil dikirim dan sedang direview', data: savedKonten });
    
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Pengguna mendapatkan daftar konten yang pernah mereka submit
 * @route   GET /api/konten/saya
 * @access  Private (Pengguna)
 */
const getMySubmissions = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const myKonten = await KontenBudaya.find({ dibuat_oleh: id_pengguna })
      .sort({ createdAt: -1 })
      .select('judul status createdAt status'); // Hanya field yg relevan
      
    res.status(200).json(myKonten);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// ... Fungsi untuk 'Like' dan 'Ulasan' sebaiknya ada di controller terpisah ...
// (Misal: 'ulasanController.js' yang mengelola model 'Ulasan')


// --- 3. FUNGSI ADMIN (Auth 'Admin' diperlukan) ---
// Berasumsi 'req.admin.id' tersedia dari middleware auth admin

/**
 * @desc    (Admin) Mendapatkan semua konten (untuk dashboard review)
 * @route   GET /api/admin/konten
 * @access  Private (Admin)
 */
const getAllKontenForAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (status) filter.status = status; // Filter by pending, published, etc.

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const kontenList = await KontenBudaya.find(filter)
      .populate('kategori', 'nama_kategori')
      .populate('dibuat_oleh', 'nama email')
      .sort({ status: 1, createdAt: -1 }) // Tampilkan 'pending' di atas
      .skip(skip)
      .limit(parseInt(limit));
      
    const totalKonten = await KontenBudaya.countDocuments(filter);
    const totalPages = Math.ceil(totalKonten / limit);

     res.status(200).json({
      data: kontenList,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalKonten,
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    (Admin) Mengubah status konten (Approve/Reject usulan)
 * @route   PATCH /api/admin/konten/:id/status
 * @access  Private (Admin)
 */
const setKontenStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Misal: "published" atau "rejected"

    if (!['published', 'draft', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const updatedKonten = await KontenBudaya.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    );
    
    if (!updatedKonten) {
      return res.status(404).json({ message: 'Konten tidak ditemukan' });
    }
    
    res.status(200).json({ message: `Status konten diupdate ke ${status}`, data: updatedKonten });

  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    (Admin) Mengedit detail konten apapun
 * @route   PUT /api/admin/konten/:id
 * @access  Private (Admin)
 */
const updateKontenByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedKonten = await KontenBudaya.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedKonten) {
      return res.status(404).json({ message: 'Konten tidak ditemukan' });
    }
    
    res.status(200).json(updatedKonten);
  } catch (error) {
     res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    (Admin) Menghapus konten apapun
 * @route   DELETE /api/admin/konten/:id
 * @access  Private (Admin)
 */
const deleteKontenByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Tambahkan logika untuk menghapus media (gambar/video)
    // dari Cloudinary di sini jika perlu.
    
    const deletedKonten = await KontenBudaya.findByIdAndDelete(id);
    
    if (!deletedKonten) {
      return res.status(404).json({ message: 'Konten tidak ditemukan' });
    }
    
    res.status(200).json({ message: 'Konten berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};


module.exports = {
  // --- Rute Publik ---
  getPublishedKonten,
  getPublishedKontenById,
  
  // --- Rute Pengguna ---
  submitKonten,
  getMySubmissions,
  
  // --- Rute Admin ---
  getAllKontenForAdmin,
  setKontenStatus,
  updateKontenByAdmin,
  deleteKontenByAdmin
};