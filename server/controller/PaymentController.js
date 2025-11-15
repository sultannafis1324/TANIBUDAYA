import Payment from "../models/Payment.js";
import Pesanan from "../models/Pesanan.js";
import Produk from "../models/Produk.js";
import { checkTransactionStatus, extractPaymentChannel } from "../utils/midtrans.js";
import mongoose from "mongoose";

/**
 * CHECK PAYMENT STATUS
 * GET /api/payment/:id/check
 */
export const checkPaymentStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params; // payment ID

    const payment = await Payment.findById(id)
      .populate({
        path: 'id_pesanan',
        populate: { path: 'items.id_produk' }
      })
      .session(session);

    if (!payment) {
      throw new Error("Payment tidak ditemukan");
    }

    // Jika sudah success atau failed, tidak perlu cek lagi
    if (['success', 'failed', 'expired'].includes(payment.status_payment)) {
      await session.commitTransaction();
      return res.json({
        success: true,
        message: `Payment sudah ${payment.status_payment}`,
        data: { payment }
      });
    }

    // Jika cash, tidak perlu cek Midtrans
    if (payment.metode_pembayaran === 'cash') {
      await session.commitTransaction();
      return res.json({
        success: true,
        message: "Payment cash sudah success",
        data: { payment }
      });
    }

    // CEK EXPIRED DULU
    if (payment.expired_at && new Date() > payment.expired_at) {
      payment.status_payment = 'expired';
      await payment.save({ session });

      console.log(`⏰ Payment ${payment._id} expired`);

      await session.commitTransaction();
      return res.json({
        success: false,
        message: "Payment sudah expired",
        data: { payment }
      });
    }

    // CEK STATUS KE MIDTRANS
    if (!payment.midtrans_order_id) {
      throw new Error("Order ID Midtrans tidak ditemukan");
    }

    const statusResponse = await checkTransactionStatus(payment.midtrans_order_id);

    const transactionStatus = statusResponse.transaction_status?.toLowerCase();
    const fraudStatus = statusResponse.fraud_status?.toLowerCase() || 'accept';

    console.log(`🔍 Status dari Midtrans:`, {
      order_id: payment.midtrans_order_id,
      transaction_status: transactionStatus,
      fraud_status: fraudStatus
    });

    // UPDATE PAYMENT STATUS
    let newPaymentStatus = payment.status_payment;

    if ((transactionStatus === 'capture' && fraudStatus === 'accept') || 
        transactionStatus === 'settlement') {
      
      // ✅ PAYMENT SUCCESS
      newPaymentStatus = 'success';
      payment.paid_at = new Date();
      payment.response_data = statusResponse.raw_response;

      // Extract payment channel
      const channel = extractPaymentChannel(
        statusResponse.payment_type,
        statusResponse.raw_response
      );
      payment.saluran_pembayaran = channel;

      console.log(`✅ Payment SUCCESS: ${payment.midtrans_order_id}`);

      // 🔥 UPDATE PESANAN KE "DIPROSES" & KURANGI STOK
      const pesanan = await Pesanan.findById(payment.id_pesanan).session(session);
      
      if (pesanan && pesanan.status_pesanan === 'menunggu_pembayaran') {
        pesanan.status_pesanan = 'diproses';
        pesanan.tanggal_bayar = new Date();

        // Kurangi stok jika belum dikurangi
        if (!pesanan.stok_dikurangi) {
          for (const item of pesanan.items) {
            await Produk.findByIdAndUpdate(
              item.id_produk,
              { 
                $inc: { 
                  stok: -item.jumlah,
                  jumlah_terjual: item.jumlah 
                } 
              },
              { session }
            );
          }
          pesanan.stok_dikurangi = true;
          console.log(`✅ Stok dikurangi untuk pesanan ${pesanan.kode_pesanan}`);
        }

        await pesanan.save({ session });
        console.log(`✅ Status pesanan ${pesanan.kode_pesanan} -> DIPROSES`);
      }

    } else if (transactionStatus === 'pending' || transactionStatus === 'authorize') {
      newPaymentStatus = 'pending';
      payment.response_data = statusResponse.raw_response;

    } else if (transactionStatus === 'expire' || statusResponse.error) {
      newPaymentStatus = 'expired';
      payment.response_data = statusResponse.raw_response || { error: statusResponse.error };

    } else if (['deny', 'cancel', 'failure'].includes(transactionStatus)) {
      newPaymentStatus = 'failed';
      payment.response_data = statusResponse.raw_response;
    }

    payment.status_payment = newPaymentStatus;
    await payment.save({ session });

    await session.commitTransaction();

    res.json({
      success: newPaymentStatus === 'success',
      message: `Payment status: ${newPaymentStatus}`,
      data: { 
        payment,
        transaction_status: transactionStatus
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error check payment status:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * GET PAYMENT BY PESANAN ID
 * GET /api/payment/pesanan/:pesanan_id
 */
export const getPaymentByPesananId = async (req, res) => {
  try {
    const { pesanan_id } = req.params;

    const payment = await Payment.findOne({ id_pesanan: pesanan_id })
      .populate('id_pesanan')
      .sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment tidak ditemukan"
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error("❌ Error get payment:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * CHANGE PAYMENT METHOD
 * POST /api/payment/:id/change-method
 */
export const changePaymentMethod = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params; // payment ID
    const { new_payment_method } = req.body;

    if (!['card', 'qris', 'transfer', 'ewallet'].includes(new_payment_method)) {
      throw new Error("Metode pembayaran tidak valid");
    }

    const payment = await Payment.findById(id)
      .populate('id_pesanan')
      .session(session);

    if (!payment) {
      throw new Error("Payment tidak ditemukan");
    }

    if (payment.status_payment !== 'pending') {
      throw new Error(`Tidak bisa ganti metode pembayaran untuk status ${payment.status_payment}`);
    }

    const pesanan = payment.id_pesanan;

    // Reset payment data
    payment.metode_pembayaran = new_payment_method;
    payment.midtrans_order_id = null;
    payment.midtrans_snap_token = null;
    payment.midtrans_payment_url = null;
    payment.saluran_pembayaran = null;

    // Create new Midtrans Snap
    const pembeli = await mongoose.model('Pengguna').findById(pesanan.id_pembeli).session(session);
    const { createSnapTransaction } = await import("../utils/midtrans.js");
    
    const snapData = await createSnapTransaction(pesanan, pembeli, new_payment_method);

    payment.midtrans_order_id = snapData.order_id;
    payment.midtrans_snap_token = snapData.snap_token;
    payment.midtrans_payment_url = snapData.payment_url;
    payment.expired_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await payment.save({ session });

    await session.commitTransaction();

    console.log(`✅ Payment method changed to ${new_payment_method}`);

    res.json({
      success: true,
      message: "Metode pembayaran berhasil diubah",
      data: {
        payment,
        snap_token: payment.midtrans_snap_token,
        payment_url: payment.midtrans_payment_url
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error change payment method:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

export default {
  checkPaymentStatus,
  getPaymentByPesananId,
  changePaymentMethod
};