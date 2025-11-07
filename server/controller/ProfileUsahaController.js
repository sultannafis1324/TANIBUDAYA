const ProfileUsaha = require('../models/ProfileUsaha.js');
const Pengguna = require('../models/Pengguna.js'); // Dibutuhkan untuk update role
const Notifikasi = require('../models/Notifikasi.js'); // Dibutuhkan untuk kirim notif
const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * Helper function untuk membuat slug unik (jika "Toko Jaya" ada -> "toko-jaya-2")
 */
const generateSlug = async (nama) => {
  let baseSlug = slugify(nama, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 2;
  while (await ProfileUsaha.findOne({ slug: slug })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }
  return slug;
};


// --- FUNGSI PENJUAL (PENGGUNA) ---

/**
 * @desc    Mendaftarkan profil usaha baru
 * @route   POST /api/usaha/daftar
 * @access  Private (Pengguna)
 */
const createProfileUsaha = async (req, res) => {
  const id_pengguna = req.user.id;
  const { nama_usaha, deskripsi_usaha, bidang_usaha, alamat_usaha, no_telepon_usaha, email_usaha, npwp, dokumen_verifikasi, logo_usaha } = req.body;

  if (!nama_usaha || !alamat_usaha || !no_telepon_usaha) {
    return res.status(400).json({ message: 'Nama usaha, alamat, dan telepon wajib diisi' });
  }

  // Gunakan Transaksi untuk memastikan 2 update (ProfileUsaha & Pengguna) konsisten
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Buat Slug
    const slug = await generateSlug(nama_usaha);

    // 2. Buat Profil Usaha Baru
    const newProfile = new ProfileUsaha({
      id_pengguna,
      nama_usaha,
      slug,
      deskripsi_usaha,
      bidang_usaha,
      alamat_usaha,
      no_telepon_usaha,
      email_usaha,
      npwp,
      dokumen_verifikasi, // Asumsi array URL dari Cloudinary
      logo_usaha, // Asumsi URL dari Cloudinary
      status_verifikasi: 'pending' // Wajib pending
    });
    
    await newProfile.save({ session });

    // 3. Update Role Pengguna menjadi 'penjual' atau 'keduanya'
    await Pengguna.updateOne(
      { _id: id_pengguna },
      { $set: { role: 'penjual' } }, // Atau 'keduanya' jika ada logika tambahan
      { session }
    );
    
    // 4. Kirim Notifikasi ke Admin (Opsional tapi bagus)
    // ... (Logika kirim notif ke Admin bahwa ada toko baru) ...

    // Jika semua berhasil
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({ message: 'Pendaftaran usaha berhasil. Menunggu verifikasi admin.', data: newProfile });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    // Tangkap error jika data unique (pengguna/nama_usaha) dilanggar
    if (error.code === 11000) {
      if (error.keyPattern.id_pengguna) {
        return res.status(400).json({ message: 'Anda sudah memiliki profil usaha.' });
      }
      if (error.keyPattern.nama_usaha) {
        return res.status(400).json({ message: 'Nama usaha sudah digunakan.' });
      }
    }
    res.status(500).json({ message: 'Gagal mendaftar usaha', error: error.message });
  }
};

/**
 * @desc    Mendapatkan profil usaha (milik sendiri)
 * @route   GET /api/usaha/saya
 * @access  Private (Pengguna/Penjual)
 */
const getMyProfileUsaha = async (req, res) => {
  try {
    const profile = await ProfileUsaha.findOne({ id_pengguna: req.user.id })
      .populate('alamat_usaha');
      
    if (!profile) {
      return res.status(404).json({ message: 'Anda belum mendaftarkan usaha' });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data usaha', error: error.message });
  }
};

/**
 * @desc    Update profil usaha (milik sendiri)
 * @route   PUT /api/usaha/saya
 * @access  Private (Pengguna/Penjual)
 */
const updateMyProfileUsaha = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { 
      rating_toko, 
      jumlah_produk_terjual, 
      total_transaksi, 
      status_verifikasi,
      ...updateData 
    } = req.body;

    const profile = await ProfileUsaha.findOne({ id_pengguna: id_pengguna });
    if (!profile) {
      return res.status(404).json({ message: 'Profil usaha tidak ditemukan' });
    }
    
    // Jika ganti nama, buat slug baru
    if (updateData.nama_usaha && updateData.nama_usaha !== profile.nama_usaha) {
      updateData.slug = await generateSlug(updateData.nama_usaha);
    }
    
    // Logika verifikasi ulang jika data sensitif diubah
    const dataSensitif = ['npwp', 'dokumen_verifikasi'];
    const diubah = dataSensitif.some(field => updateData[field] !== undefined);
    
    if (diubah && profile.status_verifikasi === 'approved') {
      updateData.status_verifikasi = 'pending'; // Wajib verifikasi ulang
      updateData.alasan_reject = null;
    }

    const updatedProfile = await ProfileUsaha.findOneAndUpdate(
      { id_pengguna: id_pengguna },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedProfile);
  } catch (error) {
     if (error.code === 11000) {
        return res.status(400).json({ message: 'Nama usaha sudah digunakan.' });
     }
    res.status(500).json({ message: 'Gagal mengupdate usaha', error: error.message });
  }
};


// --- FUNGSI ADMIN ---

/**
 * @desc    (Admin) Memverifikasi/Update status profil usaha
 * @route   PATCH /api/admin/usaha/:id/status
 * @access  Private (Admin)
 */
const verifyProfileUsaha = async (req, res) => {
  try {
    const { id: id_usaha } = req.params;
    const { status_verifikasi, alasan_reject } = req.body;

    if (!['approved', 'rejected'].includes(status_verifikasi)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }
    if (status_verifikasi === 'rejected' && !alasan_reject) {
      return res.status(400).json({ message: 'Alasan reject wajib diisi' });
    }

    const updateData = {
      status_verifikasi,
      alasan_reject: status_verifikasi === 'rejected' ? alasan_reject : null,
      tanggal_verifikasi: new Date()
    };
    
    const profile = await ProfileUsaha.findByIdAndUpdate(id_usaha, updateData, { new: true });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profil usaha tidak ditemukan' });
    }

    // Kirim Notifikasi ke Penjual
    let judul, pesan;
    if (status_verifikasi === 'approved') {
      judul = 'Toko Disetujui!';
      pesan = `Selamat, toko Anda "${profile.nama_usaha}" telah disetujui dan kini aktif di marketplace.`;
    } else {
      judul = 'Pendaftaran Toko Ditolak';
      pesan = `Maaf, pendaftaran toko Anda ditolak. Alasan: ${alasan_reject}`;
    }
    
    await Notifikasi.create({
      id_pengguna: profile.id_pengguna,
      judul: judul,
      pesan: pesan,
      tipe: 'sistem',
      link: '/toko/saya'
    });
    
    res.status(200).json({ message: 'Status verifikasi berhasil diupdate', data: profile });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memverifikasi usaha', error: error.message });
  }
};


// --- FUNGSI PUBLIK ---

/**
 * @desc    (Publik) Melihat halaman profil usaha berdasarkan slug
 * @route   GET /api/usaha/by-slug/:slug
 * @access  Public
 */
const getPublicProfileUsahaBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const profile = await ProfileUsaha.findOne({ 
      slug: slug, 
      status_verifikasi: 'approved' // Hanya tampilkan yang sudah disetujui
    })
    .populate('alamat_usaha', 'kota provinsi') // Hanya tampilkan info alamat yg relevan
    .select('-id_pengguna -npwp -dokumen_verifikasi -alasan_reject -email_usaha'); // Sembunyikan data sensitif

    if (!profile) {
      return res.status(404).json({ message: 'Toko tidak ditemukan atau belum diverifikasi' });
    }
    
    // TODO: Tambah logika untuk mengambil produk milik toko ini
    // const produkToko = await Produk.find({ id_penjual: profile._id, status: 'aktif' }).limit(10);
    
    res.status(200).json({ 
      toko: profile,
      // produk: produkToko 
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data toko', error: error.message });
  }
};

module.exports = {
  // Rute Penjual
  createProfileUsaha,
  getMyProfileUsaha,
  updateMyProfileUsaha,
  
  // Rute Admin
  verifyProfileUsaha,
  // ... (perlu fungsi getAllUsahaForAdmin, dll)
  
  // Rute Publik
  getPublicProfileUsahaBySlug
};