const Admin = require('../models/Admin'); // Sesuaikan path ke model Anda
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fungsi untuk membuat token JWT
const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token berlaku selama 1 hari
  });
};

const adminController = {
  /**
   * @desc    Registrasi admin baru
   * @route   POST /api/admins/register
   * @access  Private (Mungkin hanya Super Admin)
   */
  registerAdmin: async (req, res) => {
    try {
      const { nama, email, password, role, foto_profil, status } = req.body;

      // 1. Validasi input dasar
      if (!nama || !email || !password) {
        return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
      }

      // 2. Cek apakah email sudah ada
      const adminExists = await Admin.findOne({ email });
      if (adminExists) {
        return res.status(400).json({ message: 'Email sudah terdaftar' });
      }

      // 3. Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 4. Buat admin baru
      const newAdmin = new Admin({
        nama,
        email,
        password: hashedPassword, // Simpan password yang sudah di-hash
        role, // Akan menggunakan default 'moderator' jika tidak diisi
        foto_profil,
        status, // Akan menggunakan default 'aktif' jika tidak diisi
      });

      // 5. Simpan ke database
      const savedAdmin = await newAdmin.save();

      // 6. Kirim respon (tanpa password)
      res.status(201).json({
        _id: savedAdmin._id,
        nama: savedAdmin.nama,
        email: savedAdmin.email,
        role: savedAdmin.role,
        status: savedAdmin.status,
      });
    } catch (error) {
      res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
  },

  /**
   * @desc    Login admin
   * @route   POST /api/admins/login
   * @access  Public
   */
  loginAdmin: async (req, res) => {
    try {
      const { email, password } = req.body;

      // 1. Cek email dan password
      if (!email || !password) {
        return res.status(400).json({ message: 'Email dan password wajib diisi' });
      }

      // 2. Cari admin berdasarkan email
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({ message: 'Email atau password salah' });
      }

      // 3. Cek status admin
      if (admin.status === 'nonaktif') {
        return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan' });
      }

      // 4. Bandingkan password
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Email atau password salah' });
      }

      // 5. Update waktu login terakhir
      admin.terakhir_login = new Date();
      await admin.save();

      // 6. Buat token dan kirim respon
      const token = createToken(admin._id, admin.role);
      res.status(200).json({
        _id: admin._id,
        nama: admin.nama,
        email: admin.email,
        role: admin.role,
        foto_profil: admin.foto_profil,
        token: token,
      });
    } catch (error) {
      res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
  },

  /**
   * @desc    Mendapatkan semua data admin
   * @route   GET /api/admins
   * @access  Private (Super Admin)
   */
  getAllAdmins: async (req, res) => {
    try {
      // .select('-password') digunakan untuk tidak menyertakan field password
      const admins = await Admin.find({}).select('-password');
      res.status(200).json(admins);
    } catch (error) {
      res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
  },

  /**
   * @desc    Mendapatkan data admin tunggal berdasarkan ID
   * @route   GET /api/admins/:id
   * @access  Private (Super Admin / Admin ybs)
   */
  getAdminById: async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id).select('-password');

      if (admin) {
        res.status(200).json(admin);
      } else {
        res.status(404).json({ message: 'Admin tidak ditemukan' });
      }
    } catch (error) {
      // Handle jika format ID salah
      if (error.kind === 'ObjectId') {
         return res.status(404).json({ message: 'Admin tidak ditemukan' });
      }
      res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
  },

  /**
   * @desc    Update data admin
   * @route   PUT /api/admins/:id
   * @access  Private (Super Admin / Admin ybs)
   */
  updateAdmin: async (req, res) => {
    try {
      // Ambil data dari body, tapi HAPUS field 'password'
      // Perubahan password harus punya rute sendiri yang lebih aman
      const { password, ...updateData } = req.body;

      // Opsi { new: true } agar mengembalikan dokumen yang sudah diupdate
      // Opsi { runValidators: true } agar validasi schema (spt 'enum') tetap berjalan
      const updatedAdmin = await Admin.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (updatedAdmin) {
        res.status(200).json(updatedAdmin);
      } else {
        res.status(404).json({ message: 'Admin tidak ditemukan' });
      }
    } catch (error) {
       // Handle jika ada duplikasi email
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Email sudah digunakan' });
      }
      res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
  },

  /**
   * @desc    Menghapus admin
   * @route   DELETE /api/admins/:id
   * @access  Private (Super Admin)
   */
  deleteAdmin: async (req, res) => {
    try {
      const deletedAdmin = await Admin.findByIdAndDelete(req.params.id);

      if (deletedAdmin) {
        res.status(200).json({ message: 'Admin berhasil dihapus' });
      } else {
        res.status(404).json({ message: 'Admin tidak ditemukan' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
  },
};

module.exports = adminController;