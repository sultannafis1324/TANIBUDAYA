const riwayatChatSchema = new mongoose.Schema({
  id_pengirim: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  id_penerima: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  id_produk: { type: mongoose.Schema.Types.ObjectId, ref: 'Produk' },
  
  messages: [{
    pengirim: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
    pesan: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    is_read: { type: Boolean, default: false }
  }],
  
  is_archived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('RiwayatChat', riwayatChatSchema);