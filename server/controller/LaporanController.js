import Laporan from '../models/Laporan.js';
import Notifikasi from '../models/Notifikasi.js'; // Untuk memberi tahu pengguna
import mongoose from 'mongoose';

// --- FUNGSI PENGGUNA ---

/**
 * @desc    Membuat laporan baru
 * @route   POST /api/laporan
 * @access  Private (Pengguna)
 */
export const createLaporan = async (req, res) => {
  try {
    const id_pelapor = req.user.id;
    const { 
      terlapor, 
      tipe_laporan, 
      id_pesanan, 
      id_produk, 
      deskripsi, 
      bukti 
    } = req.body;

    // Validasi input
    if (!terlapor || !tipe_laporan || !deskripsi) {
      return res.status(400).json({ message: 'Terlapor, tipe laporan, dan deskripsi wajib diisi' });
    }

    // Buat laporan baru
    const newLaporan = new Laporan({
      pelapor: id_pelapor,
      terlapor,
      tipe_laporan,
      id_pesanan: id_pesanan || null,
      id_produk: id_produk || null,
      deskripsi,
      bukti: bukti || [], // Asumsi array URL dari Cloudinary
      status: 'pending' // Selalu 'pending' saat dibuat
    });

    await newLaporan.save();
    
    // TODO: Kirim notifikasi ke Admin bahwa ada laporan baru

    res.status(201).json({ message: 'Laporan berhasil dikirim', data: newLaporan });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengirim laporan', error: error.message });
  }
};

/**
 * @desc    Melihat riwayat laporan milik sendiri
 * @route   GET /api/laporan/saya
 * @access  Private (Pengguna)
 */
export const getMyLaporan = async (req, res) => {
  try {
    const id_pelapor = req.user.id;

    const reports = await Laporan.find({ pelapor: id_pelapor })
      .populate('terlapor', 'nama_lengkap foto_profil')
      .populate('ditangani_oleh', 'nama')
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil riwayat laporan', error: error.message });
  }
};

// --- FUNGSI ADMIN ---

/**
 * @desc    (Admin) Mendapatkan semua laporan (bisa difilter by status)
 * @route   GET /api/laporan/admin
 * @access  Private (Admin)
 */
export const getAllLaporan = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const reports = await Laporan.find(filter)
      .populate('pelapor', 'nama_lengkap email')
      .populate('terlapor', 'nama_lengkap email')
      .populate('ditangani_oleh', 'nama')
      .sort({ createdAt: -1 });
      
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data laporan', error: error.message });
  }
};

/**
 * @desc    (Admin) Mendapatkan detail satu laporan
 * @route   GET /api/laporan/admin/:id
 * @access  Private (Admin)
 */
export const getLaporanById = async (req, res) => {
  try {
    const report = await Laporan.findById(req.params.id)
      .populate('pelapor', 'nama_lengkap email no_telepon')
      .populate('terlapor', 'nama_lengkap email no_telepon')
      .populate('id_pesanan')
      .populate('id_produk', 'nama_produk');

    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil detail laporan', error: error.message });
  }
};

/**
 * @desc    (Admin) Update status laporan (menangani laporan)
 * @route   PUT /api/laporan/admin/:id
 * @access  Private (Admin)
 */
export const updateLaporanStatus = async (req, res) => {
  try {
    const { id: id_laporan } = req.params;
    const id_admin = req.admin.id; // Didapat dari middleware authAdmin
    const { status, tindakan_admin } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status wajib diisi' });
    }
    
    if (status === 'ditolak' && !tindakan_admin) {
       return res.status(400).json({ message: 'Tindakan/alasan admin wajib diisi jika laporan ditolak' });
    }

    const updatedLaporan = await Laporan.findByIdAndUpdate(
      id_laporan,
      {
        status,
        tindakan_admin: tindakan_admin || null,
        ditangani_oleh: id_admin
      },
      { new: true }
    );

    if (!updatedLaporan) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    // Kirim notifikasi ke Pelapor
    await Notifikasi.create({
      id_pengguna: updatedLaporan.pelapor,
      judul: 'Status Laporan Anda Diperbarui',
      pesan: `Status laporan Anda (ID: ${id_laporan.slice(-6)}) telah diubah menjadi "${status}".`,
      tipe: 'sistem',
      link: '/laporan/saya' // Arahkan ke halaman riwayat laporan
    });

    res.status(200).json(updatedLaporan);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengupdate status laporan', error: error.message });
  }
};