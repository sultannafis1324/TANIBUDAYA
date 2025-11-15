import mongoose from 'mongoose';

const riwayatChatSchema = new mongoose.Schema({
  // Top-level IDs ini mendefinisikan *siapa* peserta dalam thread ini
  id_pengirim: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  id_penerima: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  
  // Konteks produk yang sedang dibicarakan (opsional, untuk memulai chat)
  id_produk: { type: mongoose.Schema.Types.ObjectId, ref: 'Produk' },
  
  // Array dari semua pesan dalam thread ini
  messages: [{
    pengirim: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
    pesan: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    is_read: { type: Boolean, default: false }
  }],
  
  is_archived: { type: Boolean, default: false }
}, { timestamps: true });

// Menggunakan 'export default' untuk ES Modules
export default mongoose.model('RiwayatChat', riwayatChatSchema);