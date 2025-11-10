import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Pengguna from '../models/Pengguna.js';

const createToken = (id, role, tipe) => {
  return jwt.sign({ id, role, tipe }, process.env.JWT_SECRET, { expiresIn: '3d' });
};

const AuthController = {
  /**
   * @desc Login universal (Admin & Pengguna)
   * @route POST /api/auth/login
   * @access Public
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email dan password wajib diisi' });
      }

      // 1️⃣ Cek dulu di tabel Admin
      let user = await Admin.findOne({ email });
      let tipe = 'admin';

      // 2️⃣ Kalau bukan admin, cek di Pengguna
      if (!user) {
        user = await Pengguna.findOne({ email });
        tipe = 'pengguna';
      }

      // 3️⃣ Kalau gak ketemu sama sekali
      if (!user) {
        return res.status(401).json({ message: 'Email atau password salah' });
      }

      // 4️⃣ Cek status akun
      if (
        (tipe === 'admin' && user.status === 'nonaktif') ||
        (tipe === 'pengguna' && user.status_akun !== 'aktif')
      ) {
        return res.status(403).json({ message: 'Akun anda tidak aktif' });
      }

      // 5️⃣ Bandingin password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Email atau password salah' });
      }

      // 6️⃣ Update waktu login
      user.terakhir_login = new Date();
      await user.save();

      // 7️⃣ Buat token JWT
      const token = createToken(user._id, user.role, tipe);

      // 8️⃣ Kirim respon
      res.status(200).json({
        _id: user._id,
        nama: user.nama || user.nama_lengkap,
        email: user.email,
        role: user.role,
        tipe,
        foto_profil: user.foto_profil,
        token,
      });

    } catch (error) {
      res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
  },
  /**
 * @desc Register Pengguna baru
 * @route POST /api/auth/register-pengguna
 * @access Public
 */
registerPengguna: async (req, res) => {
  try {
    const { nama_lengkap, email, password } = req.body;

    if (!nama_lengkap || !email || !password) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    // Cek apakah email sudah terdaftar
    const existing = await Pengguna.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan pengguna baru
    const newUser = await Pengguna.create({
      nama_lengkap,
      email,
      password: hashedPassword,
      status_akun: 'aktif',
      terakhir_login: null,
    });

    // Buat token
    const token = createToken(newUser._id, 'user', 'pengguna');

    res.status(201).json({
      message: 'Registrasi berhasil',
      _id: newUser._id,
      nama: newUser.nama_lengkap,
      email: newUser.email,
      role: 'user',
      tipe: 'pengguna',
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal registrasi pengguna', error: error.message });
  }
},

/**
 * @desc Register Admin (opsional, untuk awal sistem)
 * @route POST /api/auth/register-admin
 * @access Private (sementara Public kalau belum ada super admin)
 */
registerAdmin: async (req, res) => {
  try {
    const { nama, email, password, role } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email admin sudah terdaftar' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await Admin.create({
      nama,
      email,
      password: hashedPassword,
      role: role || 'admin',
      status: 'aktif',
      terakhir_login: null,
    });

    const token = createToken(newAdmin._id, newAdmin.role, 'admin');

    res.status(201).json({
      message: 'Admin berhasil didaftarkan',
      _id: newAdmin._id,
      nama: newAdmin.nama,
      email: newAdmin.email,
      role: newAdmin.role,
      tipe: 'admin',
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal registrasi admin', error: error.message });
  }
},

};

export default AuthController;
