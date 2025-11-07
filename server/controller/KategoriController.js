const Kategori = require('../models/Kategori.js'); // Sesuaikan path jika perlu

// --- Fungsi untuk Publik ---

/**
 * @desc    Mendapatkan semua kategori yang AKTIF (untuk publik)
 * @route   GET /api/kategori
 * @access  Public
 */
const getPublicKategori = async (req, res) => {
  try {
    const { tipe_kategori } = req.query; // Filter ?tipe_kategori=produk atau ?tipe_kategori=budaya

    let filter = { status: 'aktif' };

    if (tipe_kategori) {
      if (!['produk', 'budaya'].includes(tipe_kategori)) {
        return res.status(400).json({ message: 'Tipe kategori tidak valid' });
      }
      filter.tipe_kategori = tipe_kategori;
    }

    const kategoriList = await Kategori.find(filter).sort({ nama_kategori: 1 });
    res.status(200).json(kategoriList);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Mendapatkan detail satu kategori (jika aktif)
 * @route   GET /api/kategori/:id
 * @access  Public
 */
const getPublicKategoriById = async (req, res) => {
  try {
    const kategori = await Kategori.findById(req.params.id);

    if (kategori && kategori.status === 'aktif') {
      res.status(200).json(kategori);
    } else {
      res.status(404).json({ message: 'Kategori tidak ditemukan atau tidak aktif' });
    }
  } catch (error) {
    if (error.kind === 'ObjectId') {
       return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};


// --- Fungsi untuk Admin ---
// Catatan: Rute untuk fungsi-fungsi di bawah ini harus
// dilindungi oleh middleware otentikasi Admin.

/**
 * @desc    Membuat kategori baru (Admin)
 * @route   POST /api/admin/kategori
 * @access  Private (Admin)
 */
const createKategori = async (req, res) => {
  try {
    const { nama_kategori, tipe_kategori, deskripsi, icon, status } = req.body;

    if (!nama_kategori || !tipe_kategori) {
      return res.status(400).json({ message: 'Nama dan Tipe Kategori wajib diisi' });
    }

    // Cek duplikat (berdasarkan nama DAN tipe)
    const kategoriExists = await Kategori.findOne({ nama_kategori, tipe_kategori });
    if (kategoriExists) {
      return res.status(400).json({ message: `Kategori '${nama_kategori}' untuk '${tipe_kategori}' sudah ada` });
    }

    const newKategori = new Kategori({
      nama_kategori,
      tipe_kategori,
      deskripsi,
      icon,
      status
    });

    const savedKategori = await newKategori.save();
    res.status(201).json(savedKategori);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Mendapatkan semua kategori (untuk Admin Dashboard)
 * @route   GET /api/admin/kategori
 * @access  Private (Admin)
 */
const getAllKategoriForAdmin = async (req, res) => {
  try {
    // Admin bisa melihat semua, termasuk nonaktif
    const kategoriList = await Kategori.find().sort({ tipe_kategori: 1, nama_kategori: 1 });
    res.status(200).json(kategoriList);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Update kategori (Admin)
 * @route   PUT /api/admin/kategori/:id
 * @access  Private (Admin)
 */
const updateKategori = async (req, res) => {
  try {
    const { nama_kategori, tipe_kategori } = req.body;

    // Cek duplikat jika nama atau tipe diubah
    if (nama_kategori || tipe_kategori) {
      const kategori = await Kategori.findById(req.params.id);
      const newNama = nama_kategori || kategori.nama_kategori;
      const newTipe = tipe_kategori || kategori.tipe_kategori;

      const kategoriExists = await Kategori.findOne({ nama_kategori: newNama, tipe_kategori: newTipe });
      
      // Jika ada, dan ID-nya BUKAN ID yang sedang di-edit
      if (kategoriExists && kategoriExists._id.toString() !== req.params.id) {
         return res.status(400).json({ message: 'Kombinasi nama dan tipe kategori sudah ada' });
      }
    }

    const updatedKategori = await Kategori.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (updatedKategori) {
      res.status(200).json(updatedKategori);
    } else {
      res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Menghapus kategori (Admin)
 * @route   DELETE /api/admin/kategori/:id
 * @access  Private (Admin)
 */
const deleteKategori = async (req, res) => {
  try {
    // Peringatan: Menghapus kategori bisa membuat produk
    // atau konten budaya 'yatim'.
    // Alternatifnya adalah set 'status: "nonaktif"' via rute Update.
    
    const deletedKategori = await Kategori.findByIdAndDelete(req.params.id);

    if (deletedKategori) {
      res.status(200).json({ message: 'Kategori berhasil dihapus' });
    } else {
      res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};


module.exports = {
  // Rute Publik
  getPublicKategori,
  getPublicKategoriById,
  // Rute Admin
  createKategori,
  getAllKategoriForAdmin,
  updateKategori,
  deleteKategori
};