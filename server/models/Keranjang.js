import mongoose from "mongoose";

const keranjangSchema = new mongoose.Schema({
  id_pengguna: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Pengguna", 
    required: true 
  },

  id_produk: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Produk", 
    required: true 
  },

  id_penjual: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProfileUsaha",
    required: true
  },

  jumlah: { 
    type: Number, 
    required: true, 
    default: 1 
  },

  checked: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

export default mongoose.model("Keranjang", keranjangSchema);
