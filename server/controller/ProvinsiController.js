import Provinsi from '../models/Provinsi.js'; // Sesuaikan path jika perlu
import mongoose from 'mongoose';

// --- 1. FUNGSI PUBLIK (Read-Only) ---

/**
 * @desc    Mendapatkan semua data provinsi (diurutkan A-Z)
 * @route   GET /api/provinsi
 * @access  Public
 */
export const getAllProvinsi = async (req, res) => {
  try {
    // Selalu urutkan berdasarkan nama A-Z untuk dropdown
    const provinsiList = await Provinsi.find({}).sort({ nama_provinsi: 1 });
    res.status(200).json(provinsiList);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data provinsi', error: error.message });
  }
};

/**
 * @desc    Mendapatkan detail satu provinsi
 * @route   GET /api/provinsi/:id
 * @access  Public
 */
export const getProvinsiById = async (req, res) => {
  try {
    const provinsi = await Provinsi.findById(req.params.id);
    
    if (!provinsi) {
      return res.status(404).json({ message: 'Provinsi tidak ditemukan' });
    }
    
    res.status(200).json(provinsi);
  } catch (error) {
    if (error.kind === 'ObjectId') {
       return res.status(404).json({ message: 'Provinsi tidak ditemukan' });
    }
    res.status(500).json({ message: 'Gagal mengambil data provinsi', error: error.message });
  }
};

// --- 2. FUNGSI ADMIN (CRUD) ---
// (Semua rute ini harus dilindungi oleh middleware auth Admin)

/**
 * @desc    (Admin) Menambahkan provinsi baru
 * @route   POST /api/provinsi/admin
 * @access  Private (Admin)
 */
export const createProvinsi = async (req, res) => {
  try {
    const { nama_provinsi, kode_provinsi } = req.body;

    if (!nama_provinsi) {
      return res.status(400).json({ message: 'Nama provinsi wajib diisi' });
    }

    // Cek duplikat nama
    const existingNama = await Provinsi.findOne({ nama_provinsi });
    if (existingNama) {
      return res.status(400).json({ message: 'Nama provinsi sudah ada' });
    }
    
    // Cek duplikat kode (jika diisi)
    if (kode_provinsi) {
       const existingKode = await Provinsi.findOne({ kode_provinsi });
       if (existingKode) {
         return res.status(400).json({ message: 'Kode provinsi sudah ada' });
       }
    }

    // Asumsi 'gambar_peta' adalah URL dari Cloudinary
    const newProvinsi = new Provinsi(req.body);
    await newProvinsi.save();
    
    res.status(201).json(newProvinsi);
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat provinsi', error: error.message });
  }
};

/**
 * @desc    (Admin) Update data provinsi
 * @route   PUT /api/provinsi/admin/:id
 * @access  Private (Admin)
 */
export const updateProvinsi = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_provinsi, kode_provinsi } = req.body;

    // Cek duplikat jika nama/kode diubah
    if (nama_provinsi) {
      const existing = await Provinsi.findOne({ nama_provinsi, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Nama provinsi sudah digunakan' });
      }
    }
    if (kode_provinsi) {
      const existingKode = await Provinsi.findOne({ kode_provinsi, _id: { $ne: id } });
      if (existingKode) {
        return res.status(400).json({ message: 'Kode provinsi sudah digunakan' });
      }
    }

    const updated = await Provinsi.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ message: 'Provinsi tidak ditemukan' });
    }
    
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengupdate provinsi', error: error.message });
  }
};

/**
 * @desc    (Admin) Menghapus provinsi
 * @route   DELETE /api/provinsi/admin/:id
 * @access  Private (Admin)
 */
export const deleteProvinsi = async (req, res) => {
  try {
    // --- PERINGATAN PENTING ---
    // Menghapus provinsi (hard delete) dapat merusak data lain
    // (Produk, Alamat, KontenBudaya) yang me-referensi ID ini.
    // Pertimbangkan untuk 'soft delete' (menambah field status).
    
    const deleted = await Provinsi.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Provinsi tidak ditemukan' });
    }
    
    res.status(200).json({ message: 'Provinsi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus provinsi', error: error.message });
  }
};