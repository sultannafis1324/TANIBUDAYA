const Keranjang = require('../models/Keranjang.js'); // Sesuaikan path
const mongoose = require('mongoose');

// --- CATATAN PENTING ---
// Semua fungsi di controller ini berasumsi Anda memiliki
// middleware otentikasi (cek JWT) yang menempatkan
// ID pengguna yang login ke `req.user.id`.

/**
 * @desc    Menambahkan item ke keranjang (atau update jumlah jika sudah ada)
 * @route   POST /api/keranjang
 * @access  Private (Pengguna ybs)
 */
const addItemToKeranjang = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id_produk, id_penjual, jumlah } = req.body;
    const qty = parseInt(jumlah) || 1;

    if (!id_produk || !id_penjual) {
      return res.status(400).json({ message: 'ID Produk dan ID Penjual wajib diisi' });
    }

    // 1. Cek apakah item sudah ada di keranjang pengguna
    let itemKeranjang = await Keranjang.findOne({
      id_pengguna: id_pengguna,
      id_produk: id_produk
    });

    if (itemKeranjang) {
      // 2. Jika SUDAH ADA: Update jumlah (quantity)
      itemKeranjang.jumlah += qty;
      await itemKeranjang.save();
      res.status(200).json({ message: 'Jumlah item di keranjang diupdate', item: itemKeranjang });
    } else {
      // 3. Jika BELUM ADA: Buat item keranjang baru
      const newItem = new Keranjang({
        id_pengguna,
        id_produk,
        id_penjual,
        jumlah: qty,
        checked: true // Otomatis tercentang saat ditambah
      });
      await newItem.save();
      res.status(201).json({ message: 'Item ditambahkan ke keranjang', item: newItem });
    }
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Mendapatkan semua item keranjang milik pengguna
 * @route   GET /api/keranjang
 * @access  Private (Pengguna ybs)
 */
const getKeranjang = async (req, res) => {
  try {
    const id_pengguna = req.user.id;

    // Ambil semua item, populate data produk dan penjual
    const items = await Keranjang.find({ id_pengguna: id_pengguna })
      .populate({
        path: 'id_produk',
        select: 'nama_produk harga gambar_produk slug stok' // Ambil field yg relevan
      })
      .populate({
        path: 'id_penjual',
        select: 'nama_usaha domisili' // Ambil field yg relevan
      })
      .sort({ createdAt: -1 });

    // --- Logika Grouping berdasarkan Penjual ---
    // Ini mengubah [item1, item2, item3]
    // menjadi:
    // [
    //   { penjual: {...}, items: [item1, item2] },
    //   { penjual: {...}, items: [item3] }
    // ]
    
    const grouped = new Map();

    items.forEach(item => {
      // Jika produk atau penjualnya sudah terhapus, lewati
      if (!item.id_produk || !item.id_penjual) {
        return;
      }
      
      const sellerId = item.id_penjual._id.toString();

      if (!grouped.has(sellerId)) {
        grouped.set(sellerId, {
          penjual: item.id_penjual,
          items: []
        });
      }
      grouped.get(sellerId).items.push(item);
    });

    const groupedResult = Array.from(grouped.values());

    res.status(200).json(groupedResult);

  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Update jumlah item di keranjang
 * @route   PUT /api/keranjang/:id
 * @access  Private (Pengguna ybs)
 */
const updateItemQuantity = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id: id_item_keranjang } = req.params;
    const { jumlah } = req.body;
    
    const qty = parseInt(jumlah);
    
    // Kuantitas minimal 1
    if (!qty || qty < 1) {
      return res.status(400).json({ message: 'Jumlah minimal 1' });
    }

    // Cari dan update, sekaligus cek kepemilikan
    const updatedItem = await Keranjang.findOneAndUpdate(
      { _id: id_item_keranjang, id_pengguna: id_pengguna },
      { jumlah: qty },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item keranjang tidak ditemukan atau Anda tidak punya akses' });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Update status checked (centang) item
 * @route   PATCH /api/keranjang/:id/toggle
 * @access  Private (Pengguna ybs)
 */
const toggleItemChecked = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id: id_item_keranjang } = req.params;
    const { checked } = req.body; // Kirim { "checked": true } atau { "checked": false }

    if (typeof checked !== 'boolean') {
      return res.status(400).json({ message: 'Status "checked" (boolean) wajib diisi' });
    }
    
    const updatedItem = await Keranjang.findOneAndUpdate(
      { _id: id_item_keranjang, id_pengguna: id_pengguna },
      { checked: checked },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item keranjang tidak ditemukan' });
    }
    
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Menghapus item dari keranjang
 * @route   DELETE /api/keranjang/:id
 * @access  Private (Pengguna ybs)
 */
const deleteItemFromKeranjang = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id: id_item_keranjang } = req.params;

    // Cari dan hapus, sekaligus cek kepemilikan
    const deletedItem = await Keranjang.findOneAndDelete({
      _id: id_item_keranjang,
      id_pengguna: id_pengguna
    });

    if (!deletedItem) {
      return res.status(404).json({ message: 'Item keranjang tidak ditemukan atau Anda tidak punya akses' });
    }

    res.status(200).json({ message: 'Item berhasil dihapus dari keranjang' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Mendapatkan jumlah item di keranjang (untuk ikon notifikasi)
 * @route   GET /api/keranjang/count
 * @access  Private (Pengguna ybs)
 */
const getKeranjangCount = async (req, res) => {
   try {
    const id_pengguna = req.user.id;
    const count = await Keranjang.countDocuments({ id_pengguna: id_pengguna });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

module.exports = {
  addItemToKeranjang,
  getKeranjang,
  updateItemQuantity,
  toggleItemChecked,
  deleteItemFromKeranjang,
  getKeranjangCount
};