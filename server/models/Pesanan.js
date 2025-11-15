import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  id_produk: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Produk",
    required: true
  },
  nama_produk: { type: String, required: true },
  harga_satuan: { type: Number, required: true },
  jumlah: { type: Number, required: true },
  subtotal: { type: Number, required: true }
}, { _id: false });

const pesananSchema = new mongoose.Schema({
  kode_pesanan: { type: String, required: true, unique: true },

  id_pembeli: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Pengguna", 
    required: true 
  },

  id_penjual: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ProfileUsaha", 
    required: true 
  },

  items: [itemSchema],

  total_harga_produk: { type: Number, required: true },
  ongkir: { type: Number, default: 0 },
  biaya_admin: { type: Number, default: 0 },

  id_promosi: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Promosi" 
  },

  diskon: { type: Number, default: 0 },

  total_bayar: { type: Number, required: true },

  alamat_pengiriman: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Alamat" 
  },

  kurir: { type: String },
  resi: { type: String },

  status_pesanan: {
    type: String,
    enum: [
      "menunggu_pembayaran",
      "diproses",
      "dikirim",
      "selesai",
      "dibatalkan",
      "dikembalikan"
    ],
    default: "menunggu_pembayaran"
  },

  catatan_pembeli: { type: String },
  alasan_batal: { type: String },

  tanggal_bayar: { type: Date },
  tanggal_kirim: { type: Date },
  tanggal_selesai: { type: Date },
  
  stok_dikurangi: { type: Boolean, default: false } // 🆕 flag untuk track stok

}, { timestamps: true });

// Index untuk query cepat
pesananSchema.index({ kode_pesanan: 1 });
pesananSchema.index({ id_pembeli: 1 });
pesananSchema.index({ id_penjual: 1 });
pesananSchema.index({ status_pesanan: 1 });

export default mongoose.model("Pesanan", pesananSchema);