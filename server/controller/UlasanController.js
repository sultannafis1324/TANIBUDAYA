import Ulasan from '../models/Ulasan.js';
import Produk from '../models/Produk.js';
import KontenBudaya from '../models/KontenBudaya.js';
import mongoose from 'mongoose';

// --- HELPER FUNCTION (SANGAT PENTING) ---
/**
 * Fungsi ini menghitung ulang rating rata-rata dan jumlah ulasan
 * lalu menyimpannya di model Produk atau KontenBudaya.
 */
const recalculateRating = async (tipe, id_item) => {
  try {
    const id = new mongoose.Types.ObjectId(id_item);
    
    // 1. Tentukan filter berdasarkan tipe
    let filter;
    if (tipe === 'produk') {
      filter = { id_produk: id, tipe_ulasan: 'produk' };
    } else if (tipe === 'budaya') {
      filter = { id_konten_budaya: id, tipe_ulasan: 'budaya' };
    } else {
      return; // Tipe tidak valid
    }

    // 2. Gunakan Aggregation untuk menghitung rata-rata & jumlah
    const stats = await Ulasan.aggregate([
      { $match: filter },
      { 
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      }
    ]);

    let newRating = 0;
    let newCount = 0;

    if (stats.length > 0) {
      newRating = parseFloat(stats[0].avgRating.toFixed(1)); // Bulatkan 1 desimal
      newCount = stats[0].count;
    }

    // 3. Update model parent (Produk atau KontenBudaya)
    if (tipe === 'produk') {
      await Produk.findByIdAndUpdate(id, {
        rating_produk: newRating,
        jumlah_ulasan: newCount
      });
    } else if (tipe === 'budaya') {
      // Pastikan model KontenBudaya punya field 'rating_konten' & 'jumlah_ulasan'
      await KontenBudaya.findByIdAndUpdate(id, {
        rating_konten: newRating,
        jumlah_ulasan: newCount
      });
    }

  } catch (error) {
    console.error(`Error recalculating rating for ${tipe} ${id_item}:`, error);
  }
};


// --- FUNGSI CONTROLLER ---

/**
 * @desc    Membuat ulasan baru (oleh Pengguna)
 * @route   POST /api/ulasan
 * @access  Private (Pengguna)
 */
export const createUlasan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const id_pengguna = req.user.id;
    const { 
      tipe_ulasan, 
      id_produk, 
      id_penjual, 
      id_konten_budaya, 
      rating, 
      komentar, 
      media 
    } = req.body;

    // --- Validasi ---
    if (!tipe_ulasan || !rating) {
      throw new Error('Tipe ulasan dan rating wajib diisi');
    }
    
    let filter, id_item;
    if (tipe_ulasan === 'produk') {
      if (!id_produk || !id_penjual) throw new Error('ID Produk dan Penjual wajib diisi');
      filter = { id_produk: id_produk };
      id_item = id_produk;
      
      // TODO (PENTING): Tambahkan validasi di sini
      // Cek apakah 'id_pengguna' sudah pernah membeli 'id_produk'
      // dari model 'Pesanan' yang statusnya 'selesai'.
    } else {
      if (!id_konten_budaya) throw new Error('ID Konten Budaya wajib diisi');
      filter = { id_konten_budaya: id_konten_budaya };
      id_item = id_konten_budaya;
    }
    
    // Cek duplikat: 1 pengguna = 1 ulasan per item
    const existingUlasan = await Ulasan.findOne({ id_pengguna, tipe_ulasan, ...filter });
    if (existingUlasan) {
      throw new Error('Anda sudah memberikan ulasan untuk item ini');
    }

    // 1. Buat Ulasan
    const newUlasan = new Ulasan({
      id_pengguna,
      tipe_ulasan,
      id_produk,
      id_penjual,
      id_konten_budaya,
      rating,
      komentar,
      media // Asumsi array URL dari Cloudinary
    });
    
    await newUlasan.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    // 2. Panggil helper recalculate SETELAH transaksi sukses
    await recalculateRating(tipe_ulasan, id_item);

    res.status(201).json(newUlasan);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan semua ulasan untuk satu item (Produk/Budaya)
 * @route   GET /api/ulasan
 * @access  Public
 */
export const getUlasanForItem = async (req, res) => {
  try {
    const { id_produk, id_konten_budaya } = req.query;
    let filter = {};

    if (id_produk) {
      filter = { id_produk: id_produk, tipe_ulasan: 'produk' };
    } else if (id_konten_budaya) {
      filter = { id_konten_budaya: id_konten_budaya, tipe_ulasan: 'budaya' };
    } else {
      return res.status(400).json({ message: 'ID Produk atau ID Konten Budaya wajib diisi' });
    }

    const ulasanList = await Ulasan.find(filter)
      .populate('id_pengguna', 'nama_lengkap foto_profil') // Tampilkan info pengulas
      .populate('id_pembalas', 'nama_lengkap foto_profil') // Tampilkan info pembalas
      .sort({ createdAt: -1 });
      
    res.status(200).json(ulasanList);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil ulasan', error: error.message });
  }
};

/**
 * @desc    Membalas ulasan (oleh Penjual)
 * @route   POST /api/ulasan/:id/reply
 * @access  Private (Penjual)
 */
export const replyToUlasan = async (req, res) => {
  try {
    const { id: id_ulasan } = req.params;
    const { balasan } = req.body;
    
    // Didapat dari middleware authPenjual
    const id_penjual_profil = req.profileUsaha._id; 
    // ID Pengguna milik Penjual (yang membalas)
    const id_pengguna_pembalas = req.user.id; 

    if (!balasan) {
      return res.status(400).json({ message: 'Balasan tidak boleh kosong' });
    }

    const ulasan = await Ulasan.findById(id_ulasan);
    if (!ulasan) {
      return res.status(404).json({ message: 'Ulasan tidak ditemukan' });
    }
    
    // Validasi: Hanya penjual produk tsb yang boleh balas
    if (ulasan.tipe_ulasan !== 'produk' || ulasan.id_penjual.toString() !== id_penjual_profil.toString()) {
      return res.status(403).json({ message: 'Akses ditolak. Anda bukan penjual dari produk ini.' });
    }
    
    ulasan.balasan = balasan;
    ulasan.id_pembalas = id_pengguna_pembalas;
    ulasan.tanggal_balas = new Date();
    
    await ulasan.save();
    res.status(200).json(ulasan);

  } catch (error) {
    res.status(500).json({ message: 'Gagal membalas ulasan', error: error.message });
  }
};

/**
 * @desc    (Admin) Menghapus ulasan (Moderasi)
 * @route   DELETE /api/ulasan/admin/:id
 * @access  Private (Admin)
 */
export const deleteUlasan = async (req, res) => {
  try {
    const { id: id_ulasan } = req.params;

    const ulasan = await Ulasan.findById(id_ulasan);
    if (!ulasan) {
      return res.status(404).json({ message: 'Ulasan tidak ditemukan' });
    }
    
    // Simpan info Tipe dan ID Item SEBELUM dihapus
    const { tipe_ulasan, id_produk, id_konten_budaya } = ulasan;
    const id_item = id_produk || id_konten_budaya;

    await Ulasan.findByIdAndDelete(id_ulasan);
    
    // Hitung ulang rating setelah dihapus
    if (id_item) {
      await recalculateRating(tipe_ulasan, id_item);
    }

    res.status(200).json({ message: 'Ulasan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus ulasan', error: error.message });
  }
};