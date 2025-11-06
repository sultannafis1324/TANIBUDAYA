const promosiProdukSchema = new mongoose.Schema({
  id_produk: { type: mongoose.Schema.Types.ObjectId, ref: 'Produk', required: true },
  id_promosi: { type: mongoose.Schema.Types.ObjectId, ref: 'Promosi', required: true },
  tanggal_ditambahkan: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PromosiProduk', promosiProdukSchema);