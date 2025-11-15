import RiwayatChat from '../models/RiwayatChat.js';
import mongoose from 'mongoose';

/**
 * @desc    Mengirim pesan baru
 * @route   POST /api/riwayat-chat
 * @access  Private (Pengguna)
 */
export const sendMessage = async (req, res) => {
  try {
    const id_pengirim = req.user.id; // Didapat dari authPengguna
    const { id_penerima, pesan, id_produk } = req.body;

    if (!id_penerima || !pesan) {
      return res.status(400).json({ message: 'ID Penerima dan Pesan wajib diisi' });
    }

    // Pesan yang akan disimpan
    const newMessage = {
      pengirim: id_pengirim,
      pesan: pesan,
      timestamp: new Date()
    };

    // 1. Cari thread obrolan yang sudah ada antara dua pengguna ini
    // (Tidak peduli siapa yang jadi 'id_pengirim' atau 'id_penerima' di dokumen)
    let conversation = await RiwayatChat.findOne({
      $or: [
        { id_pengirim: id_pengirim, id_penerima: id_penerima },
        { id_pengirim: id_penerima, id_penerima: id_pengirim }
      ]
    });

    if (conversation) {
      // 2. Jika thread ada, tambahkan pesan baru ke array 'messages'
      conversation.messages.push(newMessage);
      await conversation.save();
      res.status(200).json(conversation);
    } else {
      // 3. Jika thread tidak ada, buat thread baru
      const newConversation = new RiwayatChat({
        id_pengirim: id_pengirim,
        id_penerima: id_penerima,
        id_produk: id_produk || null, // Simpan konteks produk HANYA jika ini chat baru
        messages: [newMessage] // Buat array dengan pesan pertama
      });
      await newConversation.save();
      res.status(201).json(newConversation);
    }
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengirim pesan', error: error.message });
  }
};

/**
 * @desc    Mendapatkan daftar (inbox) semua percakapan pengguna
 * @route   GET /api/riwayat-chat
 * @access  Private (Pengguna)
 */
export const getMyConversations = async (req, res) => {
  try {
    const id_pengguna = req.user.id;

    const conversations = await RiwayatChat.find({
      $or: [{ id_pengirim: id_pengguna }, { id_penerima: id_pengguna }]
    })
    .populate('id_pengirim', 'nama_lengkap foto_profil') // Info pengguna 1
    .populate('id_penerima', 'nama_lengkap foto_profil') // Info pengguna 2
    .populate('id_produk', 'nama_produk media') // Info produk (jika ada)
    .sort({ updatedAt: -1 }); // Tampilkan yang terbaru

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data chat', error: error.message });
  }
};

/**
 * @desc    Mendapatkan semua pesan dari satu thread percakapan
 * @route   GET /api/riwayat-chat/:id
 * @access  Private (Pengguna)
 */
export const getConversationMessages = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id: id_thread } = req.params;

    const conversation = await RiwayatChat.findById(id_thread)
      .populate('messages.pengirim', 'nama_lengkap foto_profil'); // Populate pengirim di tiap pesan

    if (!conversation) {
      return res.status(404).json({ message: 'Percakapan tidak ditemukan' });
    }

    // Keamanan: Pastikan pengguna yang login adalah bagian dari percakapan
    if (conversation.id_pengirim.toString() !== id_pengguna && 
        conversation.id_penerima.toString() !== id_pengguna) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    
    // TODO: Tandai pesan sebagai 'telah dibaca'
    // (Logika 'markAsRead' bisa ditambahkan di sini atau di rute terpisah)

    res.status(200).json(conversation.messages);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil pesan', error: error.message });
  }
};

/**
 * @desc    Menandai pesan dalam thread sebagai telah dibaca
 * @route   PATCH /api/riwayat-chat/:id/read
 * @access  Private (Pengguna)
 */
export const markAsRead = async (req, res) => {
    try {
        const id_pengguna = req.user.id;
        const { id: id_thread } = req.params;

        // Update semua pesan di thread ini
        // di mana pengirim BUKAN user saat ini, dan statusnya 'is_read: false'
        const result = await RiwayatChat.updateOne(
            { _id: id_thread },
            { $set: { "messages.$[elem].is_read": true } },
            { 
                arrayFilters: [ 
                    { "elem.pengirim": { $ne: id_pengguna }, "elem.is_read": false } 
                ] 
            }
        );

        if (result.nModified === 0) {
            return res.status(200).json({ message: 'Tidak ada pesan baru untuk dibaca' });
        }

        res.status(200).json({ message: 'Pesan ditandai telah dibaca' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menandai pesan', error: error.message });
    }
};