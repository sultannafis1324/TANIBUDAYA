import Wishlist from '../models/Wishlist.js';
import Produk from '../models/Produk.js'; // Dibutuhkan untuk populate
import KontenBudaya from '../models/KontenBudaya.js'; // Dibutuhkan untuk populate
import mongoose from 'mongoose';

// --- FUNGSI PENGGUNA ---
// (Semua rute ini harus dilindungi middleware auth Pengguna)

/**
 * @desc    Menambahkan item ke wishlist
 * @route   POST /api/wishlist
 * @access  Private (Pengguna)
 */
export const addToWishlist = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id_item, tipe_item, catatan } = req.body;

    if (!id_item || !tipe_item) {
      return res.status(400).json({ message: 'ID Item dan Tipe Item wajib diisi' });
    }

    // 1. Cek duplikat
    const existing = await Wishlist.findOne({
      id_pengguna,
      id_item,
      tipe_item
    });

    if (existing) {
      return res.status(400).json({ message: 'Item ini sudah ada di wishlist Anda' });
    }

    // 2. Buat item baru
    const newItem = new Wishlist({
      id_pengguna,
      id_item,
      tipe_item,
      catatan
    });

    await newItem.save();
    res.status(201).json({ message: 'Berhasil ditambahkan ke wishlist', data: newItem });

  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan ke wishlist', error: error.message });
  }
};

/**
 * @desc    Menghapus item dari wishlist (berdasarkan ID Item)
 * @route   DELETE /api/wishlist/:id_item
 * @access  Private (Pengguna)
 */
export const removeFromWishlist = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id_item } = req.params; // ID Produk atau KontenBudaya

    const deleted = await Wishlist.findOneAndDelete({
      id_pengguna: id_pengguna,
      id_item: id_item
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Item tidak ditemukan di wishlist' });
    }

    res.status(200).json({ message: 'Berhasil dihapus dari wishlist' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus dari wishlist', error: error.message });
  }
};

/**
 * @desc    Mendapatkan semua item wishlist milik pengguna (Populasi Manual)
 * @route   GET /api/wishlist
 * @access  Private (Pengguna)
 */
export const getMyWishlist = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { tipe } = req.query; // Filter ?tipe=produk atau ?tipe=budaya

    let filter = { id_pengguna: id_pengguna };
    if (tipe) {
      filter.tipe_item = tipe;
    }

    const wishlistItems = await Wishlist.find(filter).sort({ createdAt: -1 });

    // --- Logika Populasi Manual (Karena 'ref' dinamis) ---
    
    // 1. Pisahkan ID berdasarkan tipenya
    const produkIds = [];
    const budayaIds = [];
    wishlistItems.forEach(item => {
      if (item.tipe_item === 'produk') {
        produkIds.push(item.id_item);
      } else {
        budayaIds.push(item.id_item);
      }
    });

    // 2. Ambil data detailnya secara paralel
    const [produks, budayas] = await Promise.all([
      Produk.find({ _id: { $in: produkIds } })
            .select('nama_produk slug media harga status'), // Hanya ambil data yg perlu
      KontenBudaya.find({ _id: { $in: budayaIds } })
                    .select('judul slug media status') // Hanya ambil data yg perlu
    ]);

    // 3. "Jahit" (Stitch) data kembali
    const populatedItems = wishlistItems.map(item => {
      let itemDetail = null;
      if (item.tipe_item === 'produk') {
        itemDetail = produks.find(p => p._id.equals(item.id_item));
      } else {
        itemDetail = budayas.find(b => b._id.equals(item.id_item));
      }
      
      // Jika item aslinya sudah dihapus (null), jangan tampilkan
      if (itemDetail) {
        // Gabungkan data wishlist (catatan) dengan data item (detail)
        return {
          ...item.toObject(), // Mengubah mongoose doc jadi plain object
          item_detail: itemDetail 
        };
      }
      return null;
    }).filter(item => item !== null); // Hapus item yang 'null'

    res.status(200).json(populatedItems);

  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil wishlist', error: error.message });
  }
};

/**
 * @desc    (Utility) Cek status wishlist untuk satu item
 * @route   GET /api/wishlist/check/:id_item
 * @access  Private (Pengguna)
 */
export const checkWishlistStatus = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id_item } = req.params;

    const item = await Wishlist.findOne({
      id_pengguna: id_pengguna,
      id_item: id_item
    });

    if (item) {
      res.status(200).json({ isWishlisted: true, data: item });
    } else {
      res.status(200).json({ isWishlisted: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengecek status wishlist', error: error.message });
  }
};