import Kategori from '../models/Kategori.js';

// --- Publik ---
export const getPublicKategori = async (req, res) => {
  try {
    const { tipe_kategori } = req.query;
    let filter = { status: 'aktif' };
    if (tipe_kategori) {
      if (!['produk','budaya'].includes(tipe_kategori))
        return res.status(400).json({ message: 'Tipe kategori tidak valid' });
      filter.tipe_kategori = tipe_kategori;
    }
    const kategoriList = await Kategori.find(filter).sort({ nama_kategori: 1 });
    res.status(200).json(kategoriList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPublicKategoriById = async (req, res) => {
  try {
    const kategori = await Kategori.findById(req.params.id);
    if (kategori && kategori.status === 'aktif') return res.status(200).json(kategori);
    res.status(404).json({ message: 'Kategori tidak ditemukan atau tidak aktif' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Admin ---
export const createKategori = async (req,res) => {
  try {
    const { nama_kategori, tipe_kategori, deskripsi, icon, status } = req.body;
    if(!nama_kategori || !tipe_kategori) return res.status(400).json({ message:'Nama & tipe wajib diisi' });

    const exists = await Kategori.findOne({ nama_kategori, tipe_kategori });
    if(exists) return res.status(400).json({ message:'Kategori sudah ada' });

    const newKategori = new Kategori({ nama_kategori, tipe_kategori, deskripsi, icon, status });
    const saved = await newKategori.save();
    res.status(201).json(saved);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

export const getAllKategoriForAdmin = async (req,res) => {
  try {
    const list = await Kategori.find().sort({ tipe_kategori:1, nama_kategori:1 });
    res.status(200).json(list);
  } catch(err) { res.status(500).json({ message: err.message }); }
};

export const updateKategori = async (req,res) => {
  try {
    const { nama_kategori, tipe_kategori } = req.body;
    if(nama_kategori || tipe_kategori){
      const kategori = await Kategori.findById(req.params.id);
      const newNama = nama_kategori || kategori.nama_kategori;
      const newTipe = tipe_kategori || kategori.tipe_kategori;
      const exists = await Kategori.findOne({ nama_kategori: newNama, tipe_kategori: newTipe });
      if(exists && exists._id.toString() !== req.params.id)
        return res.status(400).json({ message:'Kombinasi nama & tipe sudah ada' });
    }

    const updated = await Kategori.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true });
    if(updated) return res.status(200).json(updated);
    res.status(404).json({ message:'Kategori tidak ditemukan' });
  } catch(err){ res.status(500).json({ message: err.message }); }
};

export const deleteKategori = async (req,res) => {
  try {
    const deleted = await Kategori.findByIdAndDelete(req.params.id);
    if(deleted) return res.status(200).json({ message:'Kategori berhasil dihapus' });
    res.status(404).json({ message:'Kategori tidak ditemukan' });
  } catch(err){ res.status(500).json({ message: err.message }); }
};
