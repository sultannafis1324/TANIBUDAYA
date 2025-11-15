import PromosiProduk from '../models/PromosiProduk.js'; // Sesuaikan path jika perlu
import mongoose from 'mongoose';

// --- FUNGSI ADMIN ---
// (Semua rute ini harus dilindungi oleh middleware auth Admin)

/**
 * @desc    (Admin) Menambahkan/mendaftarkan produk ke promosi
 * @route   POST /api/promo-produk
 * @access  Private (Admin)
 */
export const addProdukToPromo = async (req, res) => {
  try {
    const { id_produk, id_promosi } = req.body;

    if (!id_produk || !id_promosi) {
      return res.status(400).json({ message: 'ID Produk dan ID Promosi wajib diisi' });
    }

    // 1. Cek apakah link ini sudah ada
    const existingLink = await PromosiProduk.findOne({ id_produk, id_promosi });
    if (existingLink) {
      return res.status(400).json({ message: 'Produk ini sudah terdaftar di promosi tersebut' });
    }

    // 2. Buat link baru
    const newLink = new PromosiProduk({
      id_produk,
      id_promosi
    });

    await newLink.save();
    res.status(201).json({ message: 'Produk berhasil ditambahkan ke promosi', data: newLink });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan produk ke promosi', error: error.message });
  }
};

/**
 * @desc    (Admin) Menghapus produk dari promosi
 * @route   DELETE /api/promo-produk/:id
 * @access  Private (Admin)
 */
export const removeProdukFromPromo = async (req, res) => {
  try {
    const { id } = req.params; // Ini adalah ID dari dokumen PromosiProduk

    const deletedLink = await PromosiProduk.findByIdAndDelete(id);

    if (!deletedLink) {
      return res.status(404).json({ message: 'Data promosi produk tidak ditemukan' });
    }

    res.status(200).json({ message: 'Produk berhasil dihapus dari promosi' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus produk dari promosi', error: error.message });
  }
};

/**
 * @desc    (Admin) Melihat semua produk dalam satu promosi
 * @route   GET /api/promo-produk/by-promo/:id_promo
 * @access  Private (Admin)
 */
export const getProdukByPromo = async (req, res) => {
  try {
    const { id_promo } = req.params;
    
    const links = await PromosiProduk.find({ id_promosi: id_promo })
      .populate('id_produk', 'nama_produk harga stok');
      
    const produkList = links.map(link => link.id_produk); // Ekstrak data produknya

    res.status(200).json(produkList);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data produk', error: error.message });
  }
};

/**
 * @desc    (Admin) Melihat semua promosi yang diikuti satu produk
 * @route   GET /api/promo-produk/by-produk/:id_produk
 * @access  Private (Admin)
 */
export const getPromoByProduk = async (req, res) => {
  try {
    const { id_produk } = req.params;
    
    const links = await PromosiProduk.find({ id_produk: id_produk })
      .populate('id_promosi', 'nama_promo kode_promo tipe_diskon nilai_diskon');
      
    const promoList = links.map(link => link.id_promosi); // Ekstrak data promosinya

    res.status(200).json(promoList);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data promosi', error: error.message });
  }
};