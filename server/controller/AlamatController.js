const Alamat = require('../models/Alamat.js'); // Sesuaikan path jika perlu
const mongoose = require('mongoose');

// --- CATATAN PENTING ---
// Semua fungsi di controller ini berasumsi Anda memiliki
// middleware otentikasi (misal: cek JWT) yang menempatkan
// ID pengguna yang login ke `req.user.id`.

/**
 * @desc    Membuat alamat baru
 * @route   POST /api/alamat
 * @access  Private (Pengguna ybs)
 */
const createAlamat = async (req, res) => {
  try {
    const id_pengguna = req.user.id; // Diambil dari middleware auth
    const { is_default, ...dataAlamat } = req.body;

    // Logika 1: Jika user mencentang 'is_default' saat buat alamat baru
    if (is_default) {
      // Set semua alamat LAMA milik user ini menjadi not-default
      await Alamat.updateMany(
        { id_pengguna: id_pengguna },
        { is_default: false }
      );
    }

    // Logika 2: Buat alamat baru
    const newAlamat = new Alamat({
      ...dataAlamat,
      id_pengguna: id_pengguna,
      is_default: is_default || false // Set is_default (atau false jika tidak diisi)
    });

    const savedAlamat = await newAlamat.save();
    res.status(201).json(savedAlamat);

  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Mendapatkan semua alamat milik pengguna yang login
 * @route   GET /api/alamat
 * @access  Private (Pengguna ybs)
 */
const getAllAlamatByPengguna = async (req, res) => {
  try {
    const id_pengguna = req.user.id; // Diambil dari middleware auth
    
    // Cari semua alamat milik pengguna tsb.
    // Urutkan agar alamat 'default' selalu di atas.
    const alamatList = await Alamat.find({ id_pengguna: id_pengguna })
      .sort({ is_default: -1, createdAt: -1 })
      .populate('provinsi', 'nama_provinsi'); // Asumsi field di model Provinsi

    res.status(200).json(alamatList);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Mendapatkan detail satu alamat
 * @route   GET /api/alamat/:id
 * @access  Private (Pengguna ybs)
 */
const getAlamatById = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id: id_alamat } = req.params;

    const alamat = await Alamat.findById(id_alamat).populate('provinsi');
    
    // Validasi 1: Alamat tidak ada
    if (!alamat) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }

    // Validasi 2: Alamat bukan milik pengguna yang login
    if (alamat.id_pengguna.toString() !== id_pengguna) {
      return res.status(403).json({ message: 'Akses ditolak. Ini bukan alamat Anda.' });
    }

    res.status(200).json(alamat);
  } catch (error) {
    if (error.kind === 'ObjectId') {
       return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Update alamat
 * @route   PUT /api/alamat/:id
 * @access  Private (Pengguna ybs)
 */
const updateAlamat = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id: id_alamat } = req.params;
    const { is_default, ...dataUpdate } = req.body;

    // Cek kepemilikan alamat dulu
    const alamat = await Alamat.findById(id_alamat);
    if (!alamat) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }
    if (alamat.id_pengguna.toString() !== id_pengguna) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    // Logika 'is_default' saat update
    if (is_default === true) {
      // Set semua alamat LAIN milik user ini menjadi not-default
      await Alamat.updateMany(
        { id_pengguna: id_pengguna, _id: { $ne: id_alamat } },
        { is_default: false }
      );
      // Set alamat ini sebagai default
      dataUpdate.is_default = true;
    } else if (is_default === false) {
       dataUpdate.is_default = false;
    }
    // Jika 'is_default' tidak di-pass, field itu tidak akan terupdate

    const updatedAlamat = await Alamat.findByIdAndUpdate(
      id_alamat,
      dataUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedAlamat);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Menghapus alamat
 * @route   DELETE /api/alamat/:id
 * @access  Private (Pengguna ybs)
 */
const deleteAlamat = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id: id_alamat } = req.params;

    // Cek kepemilikan
    const alamat = await Alamat.findById(id_alamat);
    if (!alamat) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }
    if (alamat.id_pengguna.toString() !== id_pengguna) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }
    
    // Hapus alamat
    await Alamat.findByIdAndDelete(id_alamat);
    
    // Logika tambahan: Jika yang dihapus adalah alamat default,
    // mungkin Anda ingin otomatis set alamat lain jadi default?
    // (Untuk saat ini, kita biarkan saja, user bisa set manual)
    
    res.status(200).json({ message: 'Alamat berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Set satu alamat sebagai default (cara yang lebih spesifik)
 * @route   PATCH /api/alamat/:id/set-default
 * @access  Private (Pengguna ybs)
 */
const setDefaultAlamat = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id: id_alamat } = req.params;

    // Cek kepemilikan
    const alamat = await Alamat.findById(id_alamat);
    if (!alamat) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }
    if (alamat.id_pengguna.toString() !== id_pengguna) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }
    
    // 1. Set semua alamat milik user ini ke false
    await Alamat.updateMany(
      { id_pengguna: id_pengguna },
      { is_default: false }
    );
    
    // 2. Set alamat yang dipilih ke true
    const newDefaultAlamat = await Alamat.findByIdAndUpdate(
      id_alamat,
      { is_default: true },
      { new: true }
    );
    
    res.status(200).json({ message: 'Alamat default berhasil diupdate', alamat: newDefaultAlamat });

  } catch (error) {
     res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};


module.exports = {
  createAlamat,
  getAllAlamatByPengguna,
  getAlamatById,
  updateAlamat,
  deleteAlamat,
  setDefaultAlamat
};