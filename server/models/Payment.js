const paymentSchema = new mongoose.Schema({
  id_pesanan: { type: mongoose.Schema.Types.ObjectId, ref: 'Pesanan', required: true },
  
  metode_pembayaran: { type: String },
  saluran_pembayaran: { type: String },
  
  midtrans_order_id: { type: String },
  midtrans_snap_token: { type: String },
  midtrans_payment_url: { type: String },
  midtrans_qr_string: { type: String },
  
  jumlah: { type: Number, required: true },
  status_payment: { type: String, enum: ['pending', 'success', 'failed', 'expired'], default: 'pending' },
  expired_at: { type: Date },
  paid_at: { type: Date },
  response_data: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);