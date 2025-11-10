import KontenBudaya from '../models/KontenBudaya.js';
import axios from 'axios';

// Base URL untuk API wilayah Indonesia
const WILAYAH_API = 'https://www.emsifa.com/api-wilayah-indonesia/api';

// Helper function untuk fetch data wilayah
const fetchWilayah = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching wilayah:', error);
    return [];
  }
};

// GET provinces
export const getProvinces = async (req, res) => {
  try {
    console.log('=== GET PROVINCES (API) ===');
    const provinces = await fetchWilayah(`${WILAYAH_API}/provinces.json`);
    
    console.log('✅ Provinces loaded:', provinces.length);
    res.json(provinces);
  } catch (err) {
    console.error('❌ Error in getProvinces:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET regencies by province
export const getRegencies = async (req, res) => {
  try {
    const { provinceId } = req.params;
    console.log('=== GET REGENCIES (API) ===');
    console.log('Province ID:', provinceId);
    
    const regencies = await fetchWilayah(`${WILAYAH_API}/regencies/${provinceId}.json`);
    
    console.log('✅ Regencies loaded:', regencies.length);
    res.json(regencies);
  } catch (err) {
    console.error('❌ Error in getRegencies:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET districts by regency
export const getDistricts = async (req, res) => {
  try {
    const { regencyId } = req.params;
    console.log('=== GET DISTRICTS (API) ===');
    console.log('Regency ID:', regencyId);
    
    const districts = await fetchWilayah(`${WILAYAH_API}/districts/${regencyId}.json`);
    
    console.log('✅ Districts loaded:', districts.length);
    if (districts.length > 0) {
      console.log('Sample district:', districts[0]);
    }
    
    res.json(districts);
  } catch (err) {
    console.error('❌ Error in getDistricts:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Helper untuk get nama wilayah (untuk display)
const getWilayahName = async (id, type) => {
  try {
    let url;
    switch (type) {
      case 'province':
        const provinces = await fetchWilayah(`${WILAYAH_API}/provinces.json`);
        const province = provinces.find(p => p.id === id);
        return province?.name || '-';
      case 'regency':
        const regencies = await fetchWilayah(`${WILAYAH_API}/regencies/${id.substring(0, 2)}.json`);
        const regency = regencies.find(r => r.id === id);
        return regency?.name || '-';
      case 'district':
        const districts = await fetchWilayah(`${WILAYAH_API}/districts/${id.substring(0, 4)}.json`);
        const district = districts.find(d => d.id === id);
        return district?.name || '-';
      default:
        return '-';
    }
  } catch (error) {
    console.error('Error getting wilayah name:', error);
    return '-';
  }
};

// GET all konten budaya (dengan filter status & user)
export const getAllKontenBudaya = async (req, res) => {
  try {
    const { status, userId, isAdmin } = req.query;
    
    console.log('=== GET ALL KONTEN BUDAYA ===');
    console.log('userId:', userId);
    console.log('isAdmin:', isAdmin);
    console.log('status:', status);
    
    let filter = {};
    
    // ADMIN: Bisa lihat konten yang sudah di-submit + draft milik sendiri
    if (isAdmin === 'true') {
      console.log('👑 Admin mode');
      
      if (status === 'draft') {
        // Admin hanya bisa lihat draft miliknya sendiri
        if (!userId) {
          filter = { status: 'draft', dibuat_oleh: null }; // Tidak akan ada hasil
        } else {
          filter = {
            status: 'draft',
            dibuat_oleh: userId
          };
        }
      } else if (status) {
        // Filter status lain (pending, published, rejected) - semua user
        filter.status = status;
      } else {
        // Tanpa filter: pending, published, rejected (semua user) + draft milik admin sendiri
        if (userId) {
          filter = {
            $or: [
              { status: { $in: ['pending', 'published', 'rejected'] } },
              { status: 'draft', dibuat_oleh: userId }
            ]
          };
        } else {
          filter.status = { $in: ['pending', 'published', 'rejected'] };
        }
      }
    } 
    // USER BIASA: Hanya lihat konten miliknya sendiri
    else {
      console.log('👤 User mode: showing only own content');
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID required for non-admin users' });
      }
      
      // Filter berdasarkan status
      if (status === 'draft') {
        // Draft: Hanya milik user sendiri
        filter = {
          dibuat_oleh: userId,
          status: 'draft'
        };
      } else if (status === 'published') {
        // Published: Hanya milik user sendiri
        filter = {
          dibuat_oleh: userId,
          status: 'published'
        };
      } else if (status === 'pending') {
        // Pending: Hanya milik user sendiri
        filter = {
          dibuat_oleh: userId,
          status: 'pending'
        };
      } else if (status === 'rejected') {
        // Rejected: Hanya milik user sendiri
        filter = {
          dibuat_oleh: userId,
          status: 'rejected'
        };
      } else {
        // Tanpa filter status: Semua konten milik user sendiri
        filter = {
          dibuat_oleh: userId
        };
      }
    }

    console.log('Filter applied:', JSON.stringify(filter));

    const konten = await KontenBudaya.find(filter)
      .populate('dibuat_oleh', 'nama_lengkap email')
      .populate('kategori', 'nama_kategori')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${konten.length} konten`);

    // Get nama wilayah untuk setiap konten
    const hasil = await Promise.all(konten.map(async k => {
      const provinsiNama = await getWilayahName(k.provinsiId, 'province');
      const kabupatenNama = k.kabupatenId ? await getWilayahName(k.kabupatenId, 'regency') : '-';
      const kecamatanNama = k.kecamatanId ? await getWilayahName(k.kecamatanId, 'district') : '-';

      return {
        ...k._doc,
        provinsiNama,
        kabupatenNama,
        kecamatanNama
      };
    }));

    res.json(hasil);
  } catch (err) {
    console.error('❌ Error in getAllKontenBudaya:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET konten budaya publik (hanya published)
export const getKontenBudayaPublik = async (req, res) => {
  try {
    const konten = await KontenBudaya.find({ status: 'published' })
      .populate('dibuat_oleh', 'nama_lengkap')
      .populate('kategori', 'nama_kategori')
      .sort({ createdAt: -1 });

    const hasil = await Promise.all(konten.map(async k => {
      const provinsiNama = await getWilayahName(k.provinsiId, 'province');
      const kabupatenNama = k.kabupatenId ? await getWilayahName(k.kabupatenId, 'regency') : '-';
      const kecamatanNama = k.kecamatanId ? await getWilayahName(k.kecamatanId, 'district') : '-';

      return {
        ...k._doc,
        provinsiNama,
        kabupatenNama,
        kecamatanNama
      };
    }));

    res.json(hasil);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET konten budaya by ID
export const getKontenBudayaById = async (req, res) => {
  try {
    const { id } = req.params;
    const k = await KontenBudaya.findById(id)
      .populate('dibuat_oleh', 'nama_lengkap email')
      .populate('kategori', 'nama_kategori');
    
    if (!k) return res.status(404).json({ message: 'Konten tidak ditemukan' });

    k.jumlah_views += 1;
    await k.save();

    const provinsiNama = await getWilayahName(k.provinsiId, 'province');
    const kabupatenNama = k.kabupatenId ? await getWilayahName(k.kabupatenId, 'regency') : '-';
    const kecamatanNama = k.kecamatanId ? await getWilayahName(k.kecamatanId, 'district') : '-';

    res.json({
      ...k._doc,
      provinsiNama,
      kabupatenNama,
      kecamatanNama
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE konten budaya dengan upload media
export const createKontenBudaya = async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    const userId = req.body.userId || data.dibuat_oleh;
    
    console.log('=== CREATE KONTEN BUDAYA ===');
    console.log('userId:', userId);
    
    if (!userId) {
      return res.status(400).json({ 
        message: 'User ID tidak ditemukan. Harap login kembali.' 
      });
    }
    
    const media_konten = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        let type = 'image';
        if (file.mimetype.startsWith('video/')) type = 'video';
        if (file.mimetype.startsWith('audio/')) type = 'audio';
        
        media_konten.push({
          url: file.path,
          type: type
        });
      });
    }

    const newKonten = new KontenBudaya({
      ...data,
      media_konten,
      dibuat_oleh: userId
    });

    await newKonten.save();
    
    const populatedKonten = await KontenBudaya.findById(newKonten._id)
      .populate('dibuat_oleh', 'nama_lengkap email')
      .populate('kategori', 'nama_kategori');
    
    console.log('✅ Konten created with dibuat_oleh:', populatedKonten.dibuat_oleh);
    
    res.status(201).json(populatedKonten);
  } catch (err) {
    console.error('❌ Error in createKontenBudaya:', err);
    res.status(500).json({ 
      message: 'Gagal membuat konten budaya', 
      error: err.message 
    });
  }
};

// UPDATE konten budaya
export const updateKontenBudaya = async (req, res) => {
  try {
    const { id } = req.params;
    const data = JSON.parse(req.body.data || '{}');
    
    if (req.files && req.files.length > 0) {
      const newMedia = [];
      req.files.forEach(file => {
        let type = 'image';
        if (file.mimetype.startsWith('video/')) type = 'video';
        if (file.mimetype.startsWith('audio/')) type = 'audio';
        
        newMedia.push({
          url: file.path,
          type: type
        });
      });
      
      data.media_konten = [...(data.media_konten || []), ...newMedia];
    }

    const updated = await KontenBudaya.findByIdAndUpdate(id, data, { new: true })
      .populate('dibuat_oleh', 'nama_lengkap email')
      .populate('kategori', 'nama_kategori');
      
    if (!updated) return res.status(404).json({ message: 'Konten tidak ditemukan' });
    
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal update konten budaya' });
  }
};

// UPDATE status konten (untuk admin)
export const updateStatusKonten = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['draft', 'pending', 'published', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const updated = await KontenBudaya.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    )
    .populate('dibuat_oleh', 'nama_lengkap email')
    .populate('kategori', 'nama_kategori');
    
    if (!updated) return res.status(404).json({ message: 'Konten tidak ditemukan' });
    
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal update status konten' });
  }
};

// DELETE konten budaya
export const deleteKontenBudaya = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await KontenBudaya.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Konten tidak ditemukan' });
    res.json({ message: 'Konten berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal hapus konten budaya' });
  }
};