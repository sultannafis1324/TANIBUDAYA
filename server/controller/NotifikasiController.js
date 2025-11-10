import Notifikasi from '../models/Notifikasi.js'
import Pengguna from '../models/Pengguna.js'

// --- FUNGSI PENGGUNA ---

// Mendapatkan semua notifikasi milik pengguna
export const getNotifikasiSaya = async (req, res) => {
  try {
    const id_pengguna = req.user?.id || req.query.id_pengguna // sementara karena belum ada middleware
    const { page = 1, limit = 15 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const notifikasiList = await Notifikasi.find({ id_pengguna })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      
    const totalNotifikasi = await Notifikasi.countDocuments({ id_pengguna })
    const totalPages = Math.ceil(totalNotifikasi / limit)

    res.status(200).json({
      data: notifikasiList,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalNotifikasi,
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message })
  }
}

// Menandai satu notifikasi sebagai 'sudah dibaca'
export const markAsRead = async (req, res) => {
  try {
    const id_pengguna = req.user?.id || req.body.id_pengguna
    const { id: id_notifikasi } = req.params

    const notifikasi = await Notifikasi.findOneAndUpdate(
      { _id: id_notifikasi, id_pengguna },
      { is_read: true },
      { new: true }
    )

    if (!notifikasi) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan atau akses ditolak' })
    }

    res.status(200).json(notifikasi)
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message })
  }
}

// Menandai semua notifikasi sebagai 'sudah dibaca'
export const markAllAsRead = async (req, res) => {
  try {
    const id_pengguna = req.user?.id || req.body.id_pengguna
    await Notifikasi.updateMany(
      { id_pengguna, is_read: false },
      { is_read: true }
    )
    res.status(200).json({ message: 'Semua notifikasi telah ditandai terbaca' })
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message })
  }
}

// Mendapatkan jumlah notifikasi yang belum dibaca
export const getUnreadCount = async (req, res) => {
  try {
    const id_pengguna = req.user?.id || req.query.id_pengguna
    const count = await Notifikasi.countDocuments({ id_pengguna, is_read: false })
    res.status(200).json({ count })
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message })
  }
}

// Menghapus satu notifikasi
export const deleteNotifikasi = async (req, res) => {
  try {
    const id_pengguna = req.user?.id || req.body.id_pengguna
    const { id: id_notifikasi } = req.params

    const deleted = await Notifikasi.findOneAndDelete({ _id: id_notifikasi, id_pengguna })
    if (!deleted) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan atau akses ditolak' })
    }

    res.status(200).json({ message: 'Notifikasi berhasil dihapus' })
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message })
  }
}

// --- FUNGSI ADMIN ---

// Kirim notifikasi ke satu pengguna
export const sendSingleNotifikasi = async (req, res) => {
  try {
    const { id_pengguna, judul, pesan, tipe, link, icon } = req.body

    if (!id_pengguna || !judul || !pesan || !tipe) {
      return res.status(400).json({ message: 'ID Pengguna, judul, pesan, dan tipe wajib diisi' })
    }

    const newNotifikasi = new Notifikasi({ id_pengguna, judul, pesan, tipe, link, icon })
    await newNotifikasi.save()
    res.status(201).json({ message: 'Notifikasi berhasil dikirim', data: newNotifikasi })
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message })
  }
}

// Kirim notifikasi ke semua pengguna
export const sendMassNotifikasi = async (req, res) => {
  try {
    const { judul, pesan, tipe, link, icon } = req.body

    if (!judul || !pesan || !tipe) {
      return res.status(400).json({ message: 'Judul, pesan, dan tipe wajib diisi' })
    }

    const allPengguna = await Pengguna.find({ status: 'aktif' }).select('_id')
    if (allPengguna.length === 0) {
      return res.status(404).json({ message: 'Tidak ada pengguna aktif ditemukan' })
    }

    const notifikasiDocs = allPengguna.map(user => ({
      id_pengguna: user._id,
      judul,
      pesan,
      tipe: tipe || 'promosi',
      link,
      icon
    }))

    await Notifikasi.insertMany(notifikasiDocs)
    res.status(200).json({ message: `Notifikasi massal berhasil dikirim ke ${allPengguna.length} pengguna` })
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message })
  }
}
