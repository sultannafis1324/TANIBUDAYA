import Alamat from '../models/Alamat.js';
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
    res.json(districts);
  } catch (err) {
    console.error('❌ Error in getDistricts:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET villages by district
export const getVillages = async (req, res) => {
  try {
    const { districtId } = req.params;
    console.log('=== GET VILLAGES (API) ===');
    console.log('District ID:', districtId);
    
    const villages = await fetchWilayah(`${WILAYAH_API}/villages/${districtId}.json`);
    
    console.log('✅ Villages loaded:', villages.length);
    res.json(villages);
  } catch (err) {
    console.error('❌ Error in getVillages:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Helper untuk get nama wilayah (untuk display)
const getWilayahName = async (id, type) => {
  try {
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
      case 'village':
        const villages = await fetchWilayah(`${WILAYAH_API}/villages/${id.substring(0, 7)}.json`);
        const village = villages.find(v => v.id === id);
        return village?.name || '-';
      default:
        return '-';
    }
  } catch (error) {
    console.error('Error getting wilayah name:', error);
    return '-';
  }
};

// GET all alamat by user
export const getAlamatByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('=== GET ALAMAT BY USER ===');
    console.log('User ID:', userId);

    const alamat = await Alamat.find({ id_pengguna: userId })
      .sort({ is_default: -1, createdAt: -1 });

    console.log(`✅ Found ${alamat.length} alamat`);

    // Get nama wilayah untuk setiap alamat
    const hasil = await Promise.all(alamat.map(async a => {
      const provinsiNama = await getWilayahName(a.provinsiId, 'province');
      const kabupatenNama = a.kabupatenId ? await getWilayahName(a.kabupatenId, 'regency') : '-';
      const kecamatanNama = a.kecamatanId ? await getWilayahName(a.kecamatanId, 'district') : '-';
      const kelurahanNama = a.kelurahanId ? await getWilayahName(a.kelurahanId, 'village') : '-';

      return {
        ...a._doc,
        provinsiNama,
        kabupatenNama,
        kecamatanNama,
        kelurahanNama
      };
    }));

    res.json(hasil);
  } catch (err) {
    console.error('❌ Error in getAlamatByUser:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET alamat by ID
export const getAlamatById = async (req, res) => {
  try {
    const { id } = req.params;
    const alamat = await Alamat.findById(id).populate('id_pengguna', 'nama_lengkap email');
    
    if (!alamat) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }

    const provinsiNama = await getWilayahName(alamat.provinsiId, 'province');
    const kabupatenNama = alamat.kabupatenId ? await getWilayahName(alamat.kabupatenId, 'regency') : '-';
    const kecamatanNama = alamat.kecamatanId ? await getWilayahName(alamat.kecamatanId, 'district') : '-';
    const kelurahanNama = alamat.kelurahanId ? await getWilayahName(alamat.kelurahanId, 'village') : '-';

    res.json({
      ...alamat._doc,
      provinsiNama,
      kabupatenNama,
      kecamatanNama,
      kelurahanNama
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE alamat
export const createAlamat = async (req, res) => {
  try {
    const userId = req.body.id_pengguna;
    
    console.log('=== CREATE ALAMAT ===');
    console.log('User ID:', userId);
    
    if (!userId) {
      return res.status(400).json({ 
        message: 'User ID tidak ditemukan. Harap login kembali.' 
      });
    }

    // Jika ini alamat pertama atau di set sebagai default, set alamat lain jadi false
    if (req.body.is_default) {
      await Alamat.updateMany(
        { id_pengguna: userId },
        { is_default: false }
      );
    }

    const newAlamat = new Alamat(req.body);
    await newAlamat.save();
    
    const populatedAlamat = await Alamat.findById(newAlamat._id)
      .populate('id_pengguna', 'nama_lengkap email');
    
    console.log('✅ Alamat created');
    res.status(201).json(populatedAlamat);
  } catch (err) {
    console.error('❌ Error in createAlamat:', err);
    res.status(500).json({ 
      message: 'Gagal membuat alamat', 
      error: err.message 
    });
  }
};

// UPDATE alamat
export const updateAlamat = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Jika set sebagai default, unset alamat lain
    if (req.body.is_default) {
      const alamat = await Alamat.findById(id);
      await Alamat.updateMany(
        { id_pengguna: alamat.id_pengguna, _id: { $ne: id } },
        { is_default: false }
      );
    }

    const updated = await Alamat.findByIdAndUpdate(id, req.body, { new: true })
      .populate('id_pengguna', 'nama_lengkap email');
      
    if (!updated) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }
    
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal update alamat' });
  }
};

// SET default alamat
export const setDefaultAlamat = async (req, res) => {
  try {
    const { id } = req.params;
    
    const alamat = await Alamat.findById(id);
    if (!alamat) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }

    // Unset semua alamat default user ini
    await Alamat.updateMany(
      { id_pengguna: alamat.id_pengguna },
      { is_default: false }
    );

    // Set alamat ini sebagai default
    alamat.is_default = true;
    await alamat.save();

    res.json({ message: 'Alamat default berhasil diubah', data: alamat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal set default alamat' });
  }
};

// DELETE alamat
export const deleteAlamat = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Alamat.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }

    // Jika alamat yang dihapus adalah default, set alamat pertama sebagai default
    if (deleted.is_default) {
      const firstAlamat = await Alamat.findOne({ id_pengguna: deleted.id_pengguna });
      if (firstAlamat) {
        firstAlamat.is_default = true;
        await firstAlamat.save();
      }
    }

    res.json({ message: 'Alamat berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal hapus alamat' });
  }
};