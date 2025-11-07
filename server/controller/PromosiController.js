const Promosi = require('../models/Promosi.js'); // Sesuaikan path jika perlu
const mongoose = require('mongoose');

// --- 1. FUNGSI ADMIN ---
// (Semua rute ini harus dilindungi oleh middleware auth Admin)

/**
 * @desc    (Admin) Membuat promosi baru
 * @route   POST /api/admin/promosi
 * @access  Private (Admin)
 */
const createPromosi = async (req, res) => {
  try {
    const { kode_promo, ...data } = req.body;

    if (!kode_promo || !data.nama_promo || !data.tipe_diskon || !data.nilai_diskon || !data.tanggal_mulai || !data.tanggal_selesai) {
      return res.status(400).json({ message: 'Data wajib (kode, nama, tipe, nilai, tanggal) harus diisi' });
    }

    // Pastikan kode unik (case-insensitive)
    const upperKode = kode_promo.toUpperCase();
    const existing = await Promosi.findOne({ kode_promo: upperKode });
    if (existing) {
      return res.status(400).json({ message: 'Kode promo sudah ada' });
    }

    const newPromosi = new Promosi({
      ...data,
      kode_promo: upperKode
    });
    
    await newPromosi.save();
    res.status(201).json(newPromosi);
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat promosi', error: error.message });
  }
};

/**
 * @desc    (Admin) Mendapatkan semua promosi (termasuk nonaktif/expired)
 * @route   GET /api/admin/promosi
 * @access  Private (Admin)
 */
const getAllPromosi = async (req, res) => {
  try {
    const promos = await Promosi.find({}).sort({ createdAt: -1 });
    res.status(200).json(promos);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data promosi', error: error.message });
  }
};

/**
 * @desc    (Admin) Update promosi
 * @route   PUT /api/admin/promosi/:id
 * @access  Private (Admin)
 */
const updatePromosi = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Jika kode promo diubah, pastikan unik
    if (updateData.kode_promo) {
      updateData.kode_promo = updateData.kode_promo.toUpperCase();
      const existing = await Promosi.findOne({ 
        kode_promo: updateData.kode_promo,
        _id: { $ne: id } // Cari kode yg sama di dokumen LAIN
      });
      if (existing) {
        return res.status(400).json({ message: 'Kode promo sudah ada' });
      }
    }

    const updated = await Promosi.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ message: 'Promosi tidak ditemukan' });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengupdate promosi', error: error.message });
  }
};

/**
 * @desc    (Admin) Hapus promosi
 * @route   DELETE /api/admin/promosi/:id
 * @access  Private (Admin)
 */
const deletePromosi = async (req, res) => {
  try {
    const deleted = await Promosi.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Promosi tidak ditemukan' });
    }
    res.status(200).json({ message: 'Promosi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus promosi', error: error.message });
  }
};


// --- 2. FUNGSI PUBLIK / PENGGUNA ---

/**
 * @desc    (Publik) Mendapatkan daftar promosi yang sedang aktif
 * @route   GET /api/promosi
 * @access  Public
 */
const getPublicPromosi = async (req, res) => {
  try {
    const now = new Date();
    
    // Cari promosi yang:
    // 1. Aktif
    // 2. Masih dalam periode tanggal
    // 3. Kuota masih ada (kuota > kuota_terpakai ATAU kuota tidak dibatasi (null))
    const promos = await Promosi.find({
      status: 'aktif',
      tanggal_mulai: { $lte: now },
      tanggal_selesai: { $gte: now },
      $or: [
        { kuota: { $exists: false } },
        { kuota: null },
        { $expr: { $lt: ["$kuota_terpakai", "$kuota"] } }
      ]
    }).select('nama_promo deskripsi kode_promo min_pembelian max_diskon tipe_diskon nilai_diskon');
    
    res.status(200).json(promos);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil promosi', error: error.message });
  }
};

/**
 * @desc    (Pengguna) Memvalidasi kode promo saat checkout
 * @route   POST /api/promosi/validate
 * @access  Private (Pengguna)
 */
const validatePromo = async (req, res) => {
  try {
    const { kode_promo, total_harga_produk, items } = req.body;
    
    if (!kode_promo || !total_harga_produk || !items) {
      return res.status(400).json({ isValid: false, message: 'Data (kode, total, items) tidak lengkap' });
    }

    // 1. Cari promo
    const promo = await Promosi.findOne({ kode_promo: kode_promo.toUpperCase() });
    if (!promo) {
      return res.status(404).json({ isValid: false, message: 'Kode promo tidak ditemukan' });
    }

    // 2. Validasi Status dan Tanggal
    const now = new Date();
    if (promo.status !== 'aktif') {
      return res.status(400).json({ isValid: false, message: 'Promo tidak aktif' });
    }
    if (now < promo.tanggal_mulai) {
      return res.status(400).json({ isValid: false, message: 'Promo belum berlaku' });
    }
    if (now > promo.tanggal_selesai) {
      return res.status(400).json({ isValid: false, message: 'Promo sudah kedaluwarsa' });
    }
    
    // 3. Validasi Kuota
    if (promo.kuota != null && promo.kuota_terpakai >= promo.kuota) {
      return res.status(400).json({ isValid: false, message: 'Kuota promo sudah habis' });
    }

    // 4. Validasi Minimum Pembelian
    if (total_harga_produk < promo.min_pembelian) {
      return res.status(400).json({ isValid: false, message: `Minimal pembelian Rp ${promo.min_pembelian} untuk promo ini` });
    }
    
    // 5. Validasi Item (Produk/Kategori)
    // Tentukan total harga dari item yang eligible
    let totalEligible = 0;
    const produkBerlaku = new Set(promo.produk_berlaku.map(String));
    const kategoriBerlaku = new Set(promo.kategori_produk.map(String));

    // Jika promo berlaku untuk semua (array kosong)
    if (produkBerlaku.size === 0 && kategoriBerlaku.size === 0) {
      totalEligible = total_harga_produk;
    } else {
      // Frontend HARUS mengirim 'items' berisi [{ id_produk, id_kategori, harga, jumlah }]
      for (const item of items) {
        if (produkBerlaku.has(item.id_produk) || kategoriBerlaku.has(item.id_kategori)) {
          totalEligible += item.harga * item.jumlah;
        }
      }
      if (totalEligible === 0) {
        return res.status(400).json({ isValid: false, message: 'Tidak ada produk di keranjang yang memenuhi syarat promo' });
      }
    }

    // 6. Hitung Diskon
    let nilai_diskon = 0;
    
    if (promo.tipe_diskon === 'persen') {
      nilai_diskon = totalEligible * (promo.nilai_diskon / 100);
      // Cek diskon maksimum
      if (promo.max_diskon > 0 && nilai_diskon > promo.max_diskon) {
        nilai_diskon = promo.max_diskon;
      }
    } else if (promo.tipe_diskon === 'nominal') {
      nilai_diskon = promo.nilai_diskon;
      // Pastikan diskon tidak melebihi total
      if (nilai_diskon > totalEligible) {
        nilai_diskon = totalEligible;
      }
    } else if (promo.tipe_diskon === 'beli_x_gratis_y') {
      // Tipe 'Beli X Gratis Y' (cth: Beli 2 Gratis 1)
      // biasanya ditangani otomatis di keranjang, bukan via kode promo.
      // Jika model ini untuk kode, logikanya sangat kompleks.
      return res.status(400).json({ isValid: false, message: 'Tipe promo ini tidak dapat divalidasi via kode' });
    }

    // 7. Kirim hasil validasi (Read-Only)
    res.status(200).json({
      isValid: true,
      message: 'Promo berhasil diterapkan!',
      id_promosi: promo._id,
      kode_promo: promo.kode_promo,
      nilai_diskon: Math.round(nilai_diskon) // Bulatkan
    });

  } catch (error)
 {
    res.status(500).json({ message: 'Gagal memvalidasi promosi', error: error.message });
 }
};

module.exports = {
  // Rute Admin
  createPromosi,
  getAllPromosi,
  updatePromosi,
  deletePromosi,
  // Rute Publik/Pengguna
  getPublicPromosi,
  validatePromo
};