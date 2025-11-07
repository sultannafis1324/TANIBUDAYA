const Pengguna = require('../models/Pengguna.js'); // Sesuaikan path
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fungsi helper untuk membuat token JWT
// Anda HARUS menambahkan JWT_SECRET di file .env Anda
const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '3d', // Token berlaku selama 3 hari
  });
};

/**
 * @desc    Registrasi pengguna baru
 * @route   POST /api/pengguna/register
 * @access  Public
 */
const registerPengguna = async (req, res) => {
  try {
    const { nama_lengkap, email, password, no_telepon } = req.body;

    // 1. Validasi input dasar
    if (!nama_lengkap || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }

    // 2. Cek apakah email sudah ada
    const penggunaExists = await Pengguna.findOne({ email });
    if (penggunaExists) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Buat pengguna baru
    const newPengguna = new Pengguna({
      nama_lengkap,
      email,
      password: hashedPassword,
      no_telepon,
      email_verified: false, // Perlu alur verifikasi email terpisah
    });

    // 5. Simpan ke database
    const savedPengguna = await newPengguna.save();
    
    // 6. Buat token (langsung login)
    const token = createToken(savedPengguna._id, savedPengguna.role);

    // 7. Kirim respon (JANGAN kirim password)
    res.status(201).json({
      _id: savedPengguna._id,
      nama_lengkap: savedPengguna.nama_lengkap,
      email: savedPengguna.email,
      role: savedPengguna.role,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Login untuk pengguna
 * @route   POST /api/pengguna/login
 * @access  Public
 */
const loginPengguna = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Cek email dan password
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    // 2. Cari pengguna berdasarkan email
    const pengguna = await Pengguna.findOne({ email });
    if (!pengguna) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // 3. Cek status akun
    if (pengguna.status_akun !== 'aktif') {
      return res.status(403).json({ message: `Akun Anda ${pengguna.status_akun}, hubungi admin.` });
    }

    // 4. Bandingkan password
    const isMatch = await bcrypt.compare(password, pengguna.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // 5. Update waktu login terakhir
    pengguna.terakhir_login = new Date();
    await pengguna.save();

    // 6. Buat token dan kirim respon
    const token = createToken(pengguna._id, pengguna.role);
    res.status(200).json({
      _id: pengguna._id,
      nama_lengkap: pengguna.nama_lengkap,
      email: pengguna.email,
      role: pengguna.role,
      foto_profil: pengguna.foto_profil,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Mendapatkan profil pengguna yang sedang login
 * @route   GET /api/pengguna/profile
 * @access  Private (Pengguna ybs)
 */
const getMyProfile = async (req, res) => {
  try {
    // req.user.id didapat dari middleware auth
    const pengguna = await Pengguna.findById(req.user.id)
      .select('-password') // Jangan kirim password
      .populate('provinsi', 'nama_provinsi'); // Tampilkan nama provinsinya

    if (pengguna) {
      res.status(200).json(pengguna);
    } else {
      res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Update profil pengguna yang sedang login
 * @route   PUT /api/pengguna/profile
 * @access  Private (Pengguna ybs)
 */
const updateMyProfile = async (req, res) => {
  try {
    // Ambil data yang BOLEH diupdate oleh pengguna
    const {
      nama_lengkap,
      no_telepon,
      foto_profil,
      tanggal_lahir,
      jenis_kelamin,
      alamat_lengkap,
      provinsi,
      kota,
      kecamatan,
      kelurahan,
      kode_pos
    } = req.body;

    const updateData = {
      nama_lengkap,
      no_telepon,
      foto_profil,
      tanggal_lahir,
      jenis_kelamin,
      alamat_lengkap,
      provinsi,
      kota,
      kecamatan,
      kelurahan,
      kode_pos
    };
    
    // Hapus field yang 'undefined' agar tidak menimpa data yg ada dgn null
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedPengguna = await Pengguna.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json(updatedPengguna);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    Update password pengguna
 * @route   PUT /api/pengguna/update-password
 * @access  Private (Pengguna ybs)
 */
const updateMyPassword = async (req, res) => {
  try {
    const { password_lama, password_baru } = req.body;

    if (!password_lama || !password_baru) {
      return res.status(400).json({ message: 'Password lama dan password baru wajib diisi' });
    }

    // 1. Ambil data pengguna (termasuk password)
    const pengguna = await Pengguna.findById(req.user.id);
    if (!pengguna) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    // 2. Cek password lama
    const isMatch = await bcrypt.compare(password_lama, pengguna.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password lama salah' });
    }

    // 3. Hash password baru
    const salt = await bcrypt.genSalt(10);
    pengguna.password = await bcrypt.hash(password_baru, salt);
    
    await pengguna.save();
    
    res.status(200).json({ message: 'Password berhasil diupdate' });

  } catch (error) {
     res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// --- FUNGSI ADMIN ---
// (Hanya bisa diakses oleh Admin)

/**
 * @desc    (Admin) Mendapatkan semua pengguna
 * @route   GET /api/admin/pengguna
 * @access  Private (Admin)
 */
const getAllPengguna = async (req, res) => {
  try {
    const penggunaList = await Pengguna.find({}).select('-password');
    res.status(200).json(penggunaList);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    (Admin) Mendapatkan detail satu pengguna
 * @route   GET /api/admin/pengguna/:id
 * @access  Private (Admin)
 */
const getPenggunaById = async (req, res) => {
  try {
    const pengguna = await Pengguna.findById(req.params.id).select('-password');
    if (pengguna) {
      res.status(200).json(pengguna);
    } else {
      res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

/**
 * @desc    (Admin) Update pengguna (termasuk status, role, poin)
 * @route   PUT /api/admin/pengguna/:id
 * @access  Private (Admin)
 */
const updatePenggunaByAdmin = async (req, res) => {
  try {
    // Admin boleh update semua field sensitif
    const { password, ...updateData } = req.body;
    
    // Jika admin ingin reset password, mereka harus kirim field 'password'
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedPengguna = await Pengguna.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (updatedPengguna) {
      res.status(200).json(updatedPengguna);
    } else {
      res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email sudah digunakan' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

module.exports = {
  // Rute Auth & Profil
  registerPengguna,
  loginPengguna,
  getMyProfile,
  updateMyProfile,
  updateMyPassword,
  
  // Rute Admin
  getAllPengguna,
  getPenggunaById,
  updatePenggunaByAdmin
};