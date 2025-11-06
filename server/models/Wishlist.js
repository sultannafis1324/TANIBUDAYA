const wishlistSchema = new mongoose.Schema({
  id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  tipe_item: { type: String, enum: ['produk', 'budaya'], required: true },
  id_item: { type: mongoose.Schema.Types.ObjectId, required: true },
  catatan: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);