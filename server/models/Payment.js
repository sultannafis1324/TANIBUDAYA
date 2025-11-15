import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  id_pesanan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pesanan",
    required: true
  },

  metode_pembayaran: { 
    type: String,
    enum: ['cash', 'card', 'qris', 'transfer', 'ewallet'],
    required: true
  },
  
  saluran_pembayaran: { type: String }, // contoh: "bca", "bri", "gopay", "shopeepay"

  midtrans_order_id: { type: String },
  midtrans_snap_token: { type: String },
  midtrans_payment_url: { type: String },
  midtrans_qr_string: { type: String },

  jumlah: { type: Number, required: true },

  status_payment: {
    type: String,
    enum: ["pending", "success", "failed", "expired"],
    default: "pending"
  },

  expired_at: { type: Date },
  paid_at: { type: Date },
  
  reference_number: { type: String }, // untuk cash payment

  response_data: {
    type: mongoose.Schema.Types.Mixed
  }

}, { timestamps: true });

// Index untuk query cepat
paymentSchema.index({ id_pesanan: 1 });
paymentSchema.index({ midtrans_order_id: 1 });
paymentSchema.index({ status_payment: 1, expired_at: 1 });

export default mongoose.model("Payment", paymentSchema);