import ProfileUsaha from '../models/ProfileUsaha.js';
import Pengguna from '../models/Pengguna.js';

// Helper untuk generate slug
const generateSlug = (nama) => {
  return nama
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

// GET all profile usaha (untuk admin)
export const getAllProfileUsaha = async (req, res) => {
  try {
    console.log('=== GET ALL PROFILE USAHA ===');
    
    const { status_verifikasi } = req.query;
    let filter = {};
    
    if (status_verifikasi) {
      filter.status_verifikasi = status_verifikasi;
    }

    const usaha = await ProfileUsaha.find(filter)
      .populate('id_pengguna', 'nama_lengkap email no_telepon')
      .populate('id_alamat_usaha')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${usaha.length} profile usaha`);
    res.json(usaha);
  } catch (err) {
    console.error('❌ Error in getAllProfileUsaha:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET profile usaha by user ID
export const getProfileUsahaByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('=== GET PROFILE USAHA BY USER ID ===');
    console.log('User ID:', userId);

    const usaha = await ProfileUsaha.findOne({ id_pengguna: userId })
      .populate('id_pengguna', 'nama_lengkap email no_telepon')
      .populate('id_alamat_usaha');
    
    if (!usaha) {
      return res.status(404).json({ message: 'Profile usaha tidak ditemukan' });
    }

    console.log('✅ Profile usaha found:', usaha.nama_usaha);
    res.json(usaha);
  } catch (err) {
    console.error('❌ Error in getProfileUsahaByUserId:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET profile usaha by ID
export const getProfileUsahaById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== GET PROFILE USAHA BY ID ===');
    console.log('ID:', id);

    const usaha = await ProfileUsaha.findById(id)
      .populate('id_pengguna', 'nama_lengkap email no_telepon')
      .populate('id_alamat_usaha');
    
    if (!usaha) {
      return res.status(404).json({ message: 'Profile usaha tidak ditemukan' });
    }

    console.log('✅ Profile usaha found:', usaha.nama_usaha);
    res.json(usaha);
  } catch (err) {
    console.error('❌ Error in getProfileUsahaById:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET profile usaha by slug (untuk publik)
export const getProfileUsahaBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('=== GET PROFILE USAHA BY SLUG ===');
    console.log('Slug:', slug);

    const usaha = await ProfileUsaha.findOne({ slug })
      .populate('id_pengguna', 'nama_lengkap email')
      .populate('id_alamat_usaha');
    
    if (!usaha) {
      return res.status(404).json({ message: 'Usaha tidak ditemukan' });
    }

    // Hanya tampilkan jika sudah approved
    if (usaha.status_verifikasi !== 'approved') {
      return res.status(403).json({ message: 'Usaha belum diverifikasi' });
    }

    console.log('✅ Profile usaha found');
    res.json(usaha);
  } catch (err) {
    console.error('❌ Error in getProfileUsahaBySlug:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET my usaha (untuk user yang login)
export const getMyProfileUsaha = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('=== GET MY PROFILE USAHA ===');
    console.log('User ID from token:', userId);

    const usaha = await ProfileUsaha.findOne({ id_pengguna: userId })
      .populate('id_pengguna', 'nama_lengkap email no_telepon')
      .populate('id_alamat_usaha');
    
    if (!usaha) {
      return res.status(404).json({ message: 'Profile usaha tidak ditemukan' });
    }

    console.log('✅ Profile usaha found:', usaha.nama_usaha);
    res.json(usaha);
  } catch (err) {
    console.error('❌ Error in getMyProfileUsaha:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// CREATE profile usaha
export const createProfileUsaha = async (req, res) => {
  try {
    console.log('=== CREATE PROFILE USAHA ===');
    console.log('req.user from token:', req.user);
    
    // ✅ Ambil userId dari token JWT (BUKAN dari body!)
    const userId = req.user.id;
    console.log('User ID from token:', userId);
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Token tidak valid. Harap login kembali.' 
      });
    }
    
    // Parse data JSON dari FormData
    let formData;
    try {
      formData = JSON.parse(req.body.data);
    } catch (parseErr) {
      formData = req.body;
    }
    
    console.log('Parsed formData:', formData);

    // Cek apakah user sudah punya profile usaha
    const existing = await ProfileUsaha.findOne({ id_pengguna: userId });
    if (existing) {
      return res.status(400).json({ 
        message: 'Anda sudah memiliki profile usaha' 
      });
    }

    // Generate slug
    const slug = generateSlug(formData.nama_usaha);
    
    // Cek slug sudah ada atau belum
    let finalSlug = slug;
    let counter = 1;
    while (await ProfileUsaha.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // ✅ FIX: Handle file upload dengan benar
    const dataToSave = {
      ...formData,
      id_pengguna: userId, // ✅ Gunakan userId dari token
      slug: finalSlug,
      status_verifikasi: 'pending'
    };

    // Logo dari single file upload
    if (req.files && req.files.logo && req.files.logo[0]) {
      dataToSave.logo_usaha = req.files.logo[0].path;
    }

    // Dokumen verifikasi dari multiple files
    if (req.files && req.files.dokumen) {
      dataToSave.dokumen_verifikasi = req.files.dokumen.map(f => f.path);
    }

    const newUsaha = new ProfileUsaha(dataToSave);
    await newUsaha.save();
    
    // Update role pengguna jadi penjual atau keduanya
    const pengguna = await Pengguna.findById(userId);
    if (pengguna && pengguna.role === 'pembeli') {
      pengguna.role = 'penjual';
      await pengguna.save();
    }

    const populatedUsaha = await ProfileUsaha.findById(newUsaha._id)
      .populate('id_pengguna', 'nama_lengkap email no_telepon')
      .populate('id_alamat_usaha');
    
    console.log('✅ Profile usaha created:', populatedUsaha.nama_usaha);
    res.status(201).json(populatedUsaha);
  } catch (err) {
    console.error('❌ Error in createProfileUsaha:', err);
    res.status(500).json({ 
      message: 'Gagal membuat profile usaha', 
      error: err.message 
    });
  }
};

// UPDATE profile usaha
export const updateProfileUsaha = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== UPDATE PROFILE USAHA ===');
    console.log('ID:', id);
    
    // ✅ FIX: Parse data JSON dari FormData
    let formData;
    try {
      formData = JSON.parse(req.body.data);
    } catch (parseErr) {
      formData = req.body;
    }

    // Jika update nama usaha, update slug juga
    if (formData.nama_usaha) {
      const slug = generateSlug(formData.nama_usaha);
      
      // Cek slug sudah ada atau belum (kecuali milik sendiri)
      let finalSlug = slug;
      let counter = 1;
      while (await ProfileUsaha.findOne({ slug: finalSlug, _id: { $ne: id } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      formData.slug = finalSlug;
    }

    // ✅ FIX: Handle file upload dengan benar
    if (req.files && req.files.logo && req.files.logo[0]) {
      formData.logo_usaha = req.files.logo[0].path;
    }

    if (req.files && req.files.dokumen) {
      formData.dokumen_verifikasi = req.files.dokumen.map(f => f.path);
    }

    const updated = await ProfileUsaha.findByIdAndUpdate(
      id, 
      formData, 
      { new: true }
    )
    .populate('id_pengguna', 'nama_lengkap email no_telepon')
    .populate('id_alamat_usaha');
      
    if (!updated) {
      return res.status(404).json({ message: 'Profile usaha tidak ditemukan' });
    }
    
    console.log('✅ Profile usaha updated');
    res.json(updated);
  } catch (err) {
    console.error('❌ Error in updateProfileUsaha:', err);
    res.status(500).json({ message: 'Gagal update profile usaha', error: err.message });
  }
};

// UPDATE status verifikasi (untuk admin)
export const updateStatusVerifikasi = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_verifikasi, alasan_reject } = req.body;
    
    console.log('=== UPDATE STATUS VERIFIKASI ===');
    console.log('ID:', id, 'Status:', status_verifikasi);

    if (!['pending', 'approved', 'rejected'].includes(status_verifikasi)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const updateData = {
      status_verifikasi,
      tanggal_verifikasi: new Date()
    };

    if (status_verifikasi === 'rejected' && alasan_reject) {
      updateData.alasan_reject = alasan_reject;
    }

    const updated = await ProfileUsaha.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    )
    .populate('id_pengguna', 'nama_lengkap email no_telepon')
    .populate('id_alamat_usaha');
    
    if (!updated) {
      return res.status(404).json({ message: 'Profile usaha tidak ditemukan' });
    }
    
    console.log('✅ Status verifikasi updated');
    res.json(updated);
  } catch (err) {
    console.error('❌ Error in updateStatusVerifikasi:', err);
    res.status(500).json({ message: 'Gagal update status verifikasi', error: err.message });
  }
};

// DELETE profile usaha
export const deleteProfileUsaha = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('=== DELETE PROFILE USAHA ===');
    console.log('ID:', id);

    const deleted = await ProfileUsaha.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Profile usaha tidak ditemukan' });
    }

    // Update role pengguna kembali jadi pembeli
    await Pengguna.findByIdAndUpdate(
      deleted.id_pengguna,
      { role: 'pembeli' }
    );

    console.log('✅ Profile usaha deleted');
    res.json({ message: 'Profile usaha berhasil dihapus' });
  } catch (err) {
    console.error('❌ Error in deleteProfileUsaha:', err);
    res.status(500).json({ message: 'Gagal hapus profile usaha', error: err.message });
  }
};