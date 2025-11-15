// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import Pengguna from '../models/Pengguna.js';
import Admin from '../models/Admin.js';

/**
 * Verify JWT Token
 * Bisa untuk Admin atau Pengguna
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, tipe }
    console.log("✅ Token verified:", decoded);
    next();
  } catch (error) {
    console.error("❌ Token invalid:", error.message);
    return res.status(401).json({ message: 'Token tidak valid atau expired' });
  }
};

/**
 * Middleware untuk Admin only
 * Cek apakah tipe === 'admin'
 */
export const isAdmin = async (req, res, next) => {
  try {
    // ✅ Cek dari 'tipe' di token (bukan 'userType')
    if (req.user.tipe !== 'admin') {
      return res.status(403).json({ 
        message: 'Akses ditolak. Hanya admin yang bisa mengakses.' 
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error checking admin access',
      error: error.message 
    });
  }
};

/**
 * Middleware untuk Pengguna only
 * Cek apakah tipe === 'pengguna'
 */
export const isPengguna = async (req, res, next) => {
  try {
    // ✅ Cek dari 'tipe' di token
    if (req.user.tipe !== 'pengguna') {
      return res.status(403).json({ 
        message: 'Akses ditolak. Hanya pengguna yang bisa mengakses.' 
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error checking user access',
      error: error.message 
    });
  }
};

/**
 * Middleware untuk cek role Penjual
 * User harus punya role 'penjual' atau 'keduanya'
 */
export const isPenjual = async (req, res, next) => {
  try {
    if (req.user.tipe !== 'pengguna') {
      return res.status(403).json({ 
        message: 'Akses ditolak. Hanya pengguna yang bisa mengakses.' 
      });
    }

    // Ambil data pengguna dari database
    const pengguna = await Pengguna.findById(req.user.id);
    
    if (!pengguna) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    // ✅ Cek apakah user punya role penjual atau keduanya
    if (pengguna.role !== 'penjual' && pengguna.role !== 'keduanya') {
      return res.status(403).json({ 
        message: 'Akses ditolak. Anda harus menjadi penjual untuk mengakses fitur ini.' 
      });
    }

    console.log(`✅ isPenjual check passed for user: ${pengguna.nama_lengkap} (role: ${pengguna.role})`);
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error checking seller access',
      error: error.message 
    });
  }
};