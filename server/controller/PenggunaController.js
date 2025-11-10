import Pengguna from '../models/Pengguna.js';
import bcrypt from 'bcryptjs';

// GET all pengguna (untuk admin)
export const getAllPengguna = async (req, res) => {
  try {
    console.log('=== GET ALL PENGGUNA ===');
    
    const { status_akun, role } = req.query;
    let filter = {};
    
    if (status_akun) filter.status_akun = status_akun;
    if (role) filter.role = role;

    const pengguna = await Pengguna.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${pengguna.length} pengguna`);
    res.json(pengguna);
  } catch (err) {
    console.error('❌ Error in getAllPengguna:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET pengguna by ID
export const getPenggunaById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== GET PENGGUNA BY ID ===');
    console.log('ID:', id);

    const pengguna = await Pengguna.findById(id).select('-password');
    
    if (!pengguna) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    console.log('✅ Pengguna found:', pengguna.nama_lengkap);
    res.json(pengguna);
  } catch (err) {
    console.error('❌ Error in getPenggunaById:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// UPDATE pengguna profile
export const updatePengguna = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== UPDATE PENGGUNA ===');
    console.log('ID:', id);

    // Jika ada file foto profil dari cloudinary
    if (req.file) {
      req.body.foto_profil = req.file.path;
    }

    // Jangan update password di sini
    delete req.body.password;

    const updated = await Pengguna.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true }
    ).select('-password');
      
    if (!updated) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }
    
    console.log('✅ Pengguna updated:', updated.nama_lengkap);
    res.json(updated);
  } catch (err) {
    console.error('❌ Error in updatePengguna:', err);
    res.status(500).json({ message: 'Gagal update pengguna', error: err.message });
  }
};

// UPDATE password
export const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password_lama, password_baru } = req.body;

    console.log('=== UPDATE PASSWORD ===');

    if (!password_lama || !password_baru) {
      return res.status(400).json({ 
        message: 'Password lama dan password baru harus diisi' 
      });
    }

    const pengguna = await Pengguna.findById(id);
    if (!pengguna) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    // Cek password lama
    const isMatch = await bcrypt.compare(password_lama, pengguna.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password lama tidak sesuai' });
    }

    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password_baru, salt);

    pengguna.password = hashedPassword;
    await pengguna.save();

    console.log('✅ Password updated');
    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    console.error('❌ Error in updatePassword:', err);
    res.status(500).json({ message: 'Gagal update password', error: err.message });
  }
};

// UPDATE status akun (untuk admin)
export const updateStatusAkun = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_akun } = req.body;
    
    console.log('=== UPDATE STATUS AKUN ===');
    console.log('ID:', id, 'Status:', status_akun);

    if (!['aktif', 'nonaktif', 'banned'].includes(status_akun)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const updated = await Pengguna.findByIdAndUpdate(
      id, 
      { status_akun }, 
      { new: true }
    ).select('-password');
    
    if (!updated) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }
    
    console.log('✅ Status updated');
    res.json(updated);
  } catch (err) {
    console.error('❌ Error in updateStatusAkun:', err);
    res.status(500).json({ message: 'Gagal update status akun', error: err.message });
  }
};

// UPDATE role (pembeli/penjual/keduanya)
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    console.log('=== UPDATE ROLE ===');
    console.log('ID:', id, 'Role:', role);

    if (!['pembeli', 'penjual', 'keduanya'].includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' });
    }

    const updated = await Pengguna.findByIdAndUpdate(
      id, 
      { role }, 
      { new: true }
    ).select('-password');
    
    if (!updated) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }
    
    console.log('✅ Role updated');
    res.json(updated);
  } catch (err) {
    console.error('❌ Error in updateRole:', err);
    res.status(500).json({ message: 'Gagal update role', error: err.message });
  }
};

// DELETE pengguna (soft delete - set status nonaktif)
export const deletePengguna = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('=== DELETE PENGGUNA ===');
    console.log('ID:', id);

    const updated = await Pengguna.findByIdAndUpdate(
      id,
      { status_akun: 'nonaktif' },
      { new: true }
    ).select('-password');
    
    if (!updated) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    console.log('✅ Pengguna deactivated');
    res.json({ message: 'Pengguna berhasil dinonaktifkan', data: updated });
  } catch (err) {
    console.error('❌ Error in deletePengguna:', err);
    res.status(500).json({ message: 'Gagal hapus pengguna', error: err.message });
  }
};

// UPDATE poin game
export const updatePoinGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { poin } = req.body;

    console.log('=== UPDATE POIN GAME ===');

    const pengguna = await Pengguna.findById(id);
    if (!pengguna) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    pengguna.poin_game += poin;
    
    // Level up logic (setiap 1000 poin = 1 level)
    pengguna.level_user = Math.floor(pengguna.poin_game / 1000) + 1;

    await pengguna.save();

    console.log('✅ Poin updated');
    res.json({ 
      message: 'Poin berhasil ditambahkan',
      poin_game: pengguna.poin_game,
      level_user: pengguna.level_user
    });
  } catch (err) {
    console.error('❌ Error in updatePoinGame:', err);
    res.status(500).json({ message: 'Gagal update poin', error: err.message });
  }
};