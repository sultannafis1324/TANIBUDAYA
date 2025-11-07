const Produk = require('../models/Produk.js'); // Sesuaikan path
const slugify = require('slugify');
const mongoose = require('mongoose');

/**
 * Helper function untuk membuat slug unik.
 * Jika 'batik-megamendung' ada, akan jadi 'batik-megamendung-2'
 */
const generateSlug = async (nama) => {
  let baseSlug = slugify(nama, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 2;

  // Cek apakah slug sudah ada
  let existing = await Produk.findOne({ slug: slug });
  while (existing) {
    slug = `${baseSlug}-${count}`;
    existing = await Produk.findOne({ slug: slug });
    count++;
  }
  return slug;
};

// --- FUNGSI PUBLIK (Untuk Marketplace) ---

/**
 * @desc    Mendapatkan semua produk (Filter, Sort, Pagination)
 * @route   GET /api/produk
 * @access  Public
 */
const getPublicProduk = async (req, res) => {
  try {
    const { kategori, provinsi, search, sort, page = 1, limit = 12 } = req.query;

    let filter = { status: 'aktif' };
    if (kategori) filter.kategori = kategori;
    if (provinsi) filter.provinsi = provinsi;
    if (search) {
      filter.nama_produk = { $regex: search, $options: 'i' };
    }

    let sortOptions = { createdAt: -1 }; // Default: terbaru
    if (sort === 'terlaris') sortOptions = { jumlah_terjual: -1 };
    if (sort === 'rating') sortOptions = { rating_produk: -1 };
    if (sort === 'harga_asc') sortOptions = { harga: 1 };
    if (sort === 'harga_desc') sortOptions = { harga: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const produkList = await Produk.find(filter)
      .populate('kategori', 'nama_kategori')
      .populate('provinsi', 'nama_provinsi')
      .populate('id_penjual', 'nama_usaha domisili')
      .select('-harga_modal -spesifikasi -stok') // Sembunyikan data sensitif/berat
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProduk = await Produk.countDocuments(filter);
    const totalPages = Math.ceil(totalProduk / limit);

    res.status(200).json({
      data: produkList,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalProduk,
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data produk', error: error.message });
  }
};

/**
 * @desc    Mendapatkan detail satu produk (via SLUG)
 * @route   GET /api/produk/:slug
 * @access  Public
 */
const getProdukBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const produk = await Produk.findOne({ slug: slug, status: 'aktif' })
      .populate('kategori', 'nama_kategori icon')
      .populate('provinsi', 'nama_provinsi')
      .populate('id_penjual', 'nama_usaha domisili rating_penjual')
      .populate('asal_budaya', 'judul slug') // Link ke Konten Budaya
      .select('-harga_modal'); // Sembunyikan harga modal

    if (!produk) {
      return res.status(404).json({ message: 'Produk tidak ditemukan atau tidak aktif' });
    }
    res.status(200).json(produk);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil detail produk', error: error.message });
  }
};

// --- FUNGSI PENJUAL (Untuk Dashboard Toko) ---
// Berasumsi 'req.profileUsaha.id' tersedia dari middleware auth penjual

/**
 * @desc    (Penjual) Membuat produk baru
 * @route   POST /api/penjual/produk
 * @access  Private (Penjual)
 */
const createProduk = async (req, res) => {
  try {
    const id_penjual = req.profileUsaha.id;
    const { nama_produk, stok, ...dataProduk } = req.body;

    if (!nama_produk || !dataProduk.kategori || !dataProduk.harga || stok === undefined) {
      return res.status(400).json({ message: 'Nama, kategori, harga, dan stok wajib diisi' });
    }

    // 1. Generate Slug
    const slug = await generateSlug(nama_produk);
    
    // 2. Tentukan Status
    const status = parseInt(stok) > 0 ? 'aktif' : 'sold_out';

    // 3. Buat Produk
    // Asumsi 'media' adalah array URL dari Cloudinary
    const newProduk = new Produk({
      ...dataProduk,
      id_penjual,
      nama_produk,
      slug,
      stok: parseInt(stok),
      status
    });

    const savedProduk = await newProduk.save();
    res.status(201).json(savedProduk);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Nama produk/slug sudah ada' });
    }
    res.status(500).json({ message: 'Gagal membuat produk', error: error.message });
  }
};

/**
 * @desc    (Penjual) Mendapatkan semua produk MILIKNYA
 * @route   GET /api/penjual/produk
 * @access  Private (Penjual)
 */
const getMyProduk = async (req, res) => {
  try {
    const id_penjual = req.profileUsaha.id;
    const { status, search } = req.query;

    let filter = { id_penjual: id_penjual };
    if (status) filter.status = status;
    if (search) filter.nama_produk = { $regex: search, $options: 'i' };

    // Penjual boleh lihat semua status (aktif, nonaktif, sold_out)
    const produkList = await Produk.find(filter)
      .populate('kategori', 'nama_kategori')
      .select('nama_produk slug harga stok status rating_produk jumlah_terjual media')
      .sort({ createdAt: -1 });
      
    res.status(200).json(produkList);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil produk saya', error: error.message });
  }
};

/**
 * @desc    (Penjual) Update produk MILIKNYA
 * @route   PUT /api/penjual/produk/:id
 * @access  Private (Penjual)
 */
const updateProduk = async (req, res) => {
  try {
    const { id: id_produk } = req.params;
    const id_penjual = req.profileUsaha.id;

    // 1. Validasi Kepemilikan
    const produk = await Produk.findById(id_produk);
    if (!produk) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    if (produk.id_penjual.toString() !== id_penjual) {
      return res.status(403).json({ message: 'Akses ditolak. Ini bukan produk Anda.' });
    }

    // 2. Ambil data, JANGAN biarkan penjual update rating/terjual
    const {
      rating_produk,
      jumlah_ulasan,
      jumlah_terjual,
      ...updateData
    } = req.body;
    
    // 3. Logika Slug (jika nama berubah)
    if (updateData.nama_produk && updateData.nama_produk !== produk.nama_produk) {
      updateData.slug = await generateSlug(updateData.nama_produk);
    }
    
    // 4. Logika Status (berdasarkan stok)
    if (updateData.stok !== undefined) {
      const stokInt = parseInt(updateData.stok);
      if (stokInt > 0 && produk.status === 'sold_out') {
        // Otomatis aktifkan jika restock
        updateData.status = 'aktif'; 
      } else if (stokInt === 0) {
        updateData.status = 'sold_out';
      }
    }
    
    // 5. Jika penjual set manual (aktif/nonaktif)
    if (req.body.status) {
       updateData.status = req.body.status;
    }

    const updatedProduk = await Produk.findByIdAndUpdate(
      id_produk,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedProduk);
  } catch (error) {
     res.status(500).json({ message: 'Gagal mengupdate produk', error: error.message });
  }
};

/**
 * @desc    (Penjual) Menghapus produk MILIKNYA (Soft Delete)
 * @route   DELETE /api/penjual/produk/:id
 * @access  Private (Penjual)
 */
const deleteProduk = async (req, res) => {
  try {
    const { id: id_produk } = req.params;
    const id_penjual = req.profileUsaha.id;

    // 1. Validasi Kepemilikan
    const produk = await Produk.findById(id_produk);
    if (!produk) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    if (produk.id_penjual.toString() !== id_penjual) {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }
    
    // 2. Soft Delete: Ubah status jadi 'nonaktif'
    //    Ini lebih aman daripada menghapus permanen
    produk.status = 'nonaktif';
    await produk.save();
    
    res.status(200).json({ message: 'Produk telah dinonaktifkan (dihapus)' });
  } catch (error) {
     res.status(500).json({ message: 'Gagal menghapus produk', error: error.message });
  }
};


module.exports = {
  // Rute Publik
  getPublicProduk,
  getProdukBySlug,
  
  // Rute Penjual
  createProduk,
  getMyProduk,
  updateProduk,
  deleteProduk
};