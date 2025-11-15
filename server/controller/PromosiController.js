import Promosi from '../models/promosiModel.js'; // Pastikan path benar & tambahkan .js
import mongoose from 'mongoose';

// ### 1. Membuat Promosi Baru
export const createPromosi = async (req, res) => {
  try {
    const promosi = new Promosi(req.body);
    await promosi.save();

    res.status(201).json({
      message: 'Promosi baru berhasil dibuat',
      data: promosi,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Validasi gagal', errors: error.errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        message: `Kode promo '${req.body.kode_promo}' sudah digunakan.`,
      });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ### 2. Mendapatkan Semua Promosi (dengan Filter & Pagination)
export const getAllPromosi = async (req, res) => {
  try {
    const { status, tipe_diskon, search } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (tipe_diskon) {
      query.tipe_diskon = tipe_diskon;
    }
    if (search) {
      query.$or = [
        { nama_promo: { $regex: search, $options: 'i' } },
        { kode_promo: { $regex: search, $options: 'i' } },
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const promosi = await Promosi.find(query)
      .populate('produk_berlaku', 'nama_produk')
      .populate('kategori_produk', 'nama_kategori')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Promosi.countDocuments(query);

    res.status(200).json({
      message: 'Semua promosi berhasil diambil',
      data: promosi,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ### 3. Mendapatkan Promosi Spesifik (berdasarkan ID)
export const getPromosiById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID promosi tidak valid' });
    }

    const promosi = await Promosi.findById(id)
      .populate('produk_berlaku')
      .populate('kategori_produk');

    if (!promosi) {
      return res.status(404).json({ message: 'Promosi tidak ditemukan' });
    }

    res.status(200).json({ message: 'Promosi ditemukan', data: promosi });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ### 4. Mendapatkan Promosi Spesifik (berdasarkan Kode Promo)
export const getPromosiByKode = async (req, res) => {
  try {
    const { kode } = req.params;
    const promosi = await Promosi.findOne({ kode_promo: kode })
      .populate('produk_berlaku')
      .populate('kategori_produk');

    if (!promosi) {
      return res
        .status(404)
        .json({ message: 'Promosi dengan kode tersebut tidak ditemukan' });
    }

    res.status(200).json({ message: 'Promosi ditemukan', data: promosi });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ### 5. Mengupdate Promosi (berdasarkan ID)
export const updatePromosi = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID promosi tidak valid' });
    }

    const promosi = await Promosi.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!promosi) {
      return res.status(404).json({ message: 'Promosi tidak ditemukan' });
    }

    res
      .status(200)
      .json({ message: 'Promosi berhasil diupdate', data: promosi });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Validasi gagal', errors: error.errors });
    }
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: `Kode promo sudah digunakan.` });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ### 6. Menghapus Promosi (berdasarkan ID)
export const deletePromosi = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID promosi tidak valid' });
    }

    const promosi = await Promosi.findByIdAndDelete(id);

    if (!promosi) {
      return res.status(404).json({ message: 'Promosi tidak ditemukan' });
    }

    res.status(200).json({ message: 'Promosi berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};