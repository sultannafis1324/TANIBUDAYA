import Payment from "../models/Payment.js";
import Pesanan from "../models/Pesanan.js";
import Produk from "../models/Produk.js";
import { checkTransactionStatus } from "./midtrans.js";
import mongoose from "mongoose";

/**
 * Check dan update expired payments
 * Jalankan setiap 5 menit
 */
export const checkExpiredPayments = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("🔍 Checking expired payments...");

    // Cari payment yang pending dan sudah expired
    const expiredPayments = await Payment.find({
      status_payment: 'pending',
      expired_at: { $lt: new Date() }
    })
    .populate('id_pesanan')
    .session(session);

    console.log(`📊 Found ${expiredPayments.length} expired payments`);

    for (const payment of expiredPayments) {
      try {
        // Update payment status ke expired
        payment.status_payment = 'expired';
        await payment.save({ session });

        console.log(`⏰ Payment ${payment._id} set to EXPIRED`);

        // Jangan langsung cancel pesanan, beri waktu 24 jam
        // (akan dihandle oleh checkUnpaidOrders)

      } catch (error) {
        console.error(`❌ Error processing payment ${payment._id}:`, error.message);
      }
    }

    await session.commitTransaction();
    console.log("✅ Expired payments check completed");

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error in checkExpiredPayments:", error.message);
  } finally {
    session.endSession();
  }
};

/**
 * Cancel pesanan yang tidak dibayar selama 24 jam
 * Jalankan setiap 1 jam
 */
export const checkUnpaidOrders = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("🔍 Checking unpaid orders...");

    // Cari pesanan yang masih menunggu pembayaran dan sudah 24 jam
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 jam yang lalu

    const unpaidOrders = await Pesanan.find({
      status_pesanan: 'menunggu_pembayaran',
      createdAt: { $lt: cutoffTime }
    }).session(session);

    console.log(`📊 Found ${unpaidOrders.length} unpaid orders > 24h`);

    for (const pesanan of unpaidOrders) {
      try {
        // Kembalikan stok jika sudah dikurangi
        if (pesanan.stok_dikurangi) {
          for (const item of pesanan.items) {
            await Produk.findByIdAndUpdate(
              item.id_produk,
              { 
                $inc: { 
                  stok: item.jumlah,
                  jumlah_terjual: -item.jumlah 
                } 
              },
              { session }
            );
          }
          console.log(`✅ Stok dikembalikan untuk pesanan ${pesanan.kode_pesanan}`);
        }

        // Update pesanan ke dibatalkan
        pesanan.status_pesanan = 'dibatalkan';
        pesanan.alasan_batal = `Pesanan dibatalkan otomatis karena tidak ada pembayaran selama 24 jam`;
        await pesanan.save({ session });

        // Update payment ke expired jika masih pending
        await Payment.updateMany(
          { 
            id_pesanan: pesanan._id,
            status_payment: 'pending'
          },
          { status_payment: 'expired' },
          { session }
        );

        console.log(`🚫 Pesanan ${pesanan.kode_pesanan} auto-cancelled (unpaid 24h)`);

      } catch (error) {
        console.error(`❌ Error cancelling order ${pesanan.kode_pesanan}:`, error.message);
      }
    }

    await session.commitTransaction();
    console.log("✅ Unpaid orders check completed");

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error in checkUnpaidOrders:", error.message);
  } finally {
    session.endSession();
  }
};

/**
 * Check payment status dari Midtrans untuk pending payments
 * Jalankan setiap 10 menit
 */
export const checkPendingPayments = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("🔍 Checking pending payments with Midtrans...");

    // Cari payment yang masih pending dan belum expired
    const pendingPayments = await Payment.find({
      status_payment: 'pending',
      metode_pembayaran: { $ne: 'cash' },
      expired_at: { $gt: new Date() },
      midtrans_order_id: { $exists: true, $ne: null }
    })
    .populate({
      path: 'id_pesanan',
      populate: { path: 'items.id_produk' }
    })
    .session(session);

    console.log(`📊 Found ${pendingPayments.length} pending payments to check`);

    for (const payment of pendingPayments) {
      try {
        // Check status ke Midtrans
        const statusResponse = await checkTransactionStatus(payment.midtrans_order_id);
        
        const transactionStatus = statusResponse.transaction_status?.toLowerCase();
        const fraudStatus = statusResponse.fraud_status?.toLowerCase() || 'accept';

        console.log(`🔍 ${payment.midtrans_order_id}: ${transactionStatus}`);

        // Jika sudah success/settlement
        if ((transactionStatus === 'capture' && fraudStatus === 'accept') || 
            transactionStatus === 'settlement') {
          
          payment.status_payment = 'success';
          payment.paid_at = new Date();
          payment.response_data = statusResponse.raw_response;

          const { extractPaymentChannel } = await import("./midtrans.js");
          payment.saluran_pembayaran = extractPaymentChannel(
            statusResponse.payment_type,
            statusResponse.raw_response
          );

          await payment.save({ session });

          // Update pesanan ke diproses & kurangi stok
          const pesanan = await Pesanan.findById(payment.id_pesanan).session(session);
          
          if (pesanan && pesanan.status_pesanan === 'menunggu_pembayaran') {
            pesanan.status_pesanan = 'diproses';
            pesanan.tanggal_bayar = new Date();

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
            }

            await pesanan.save({ session });
            console.log(`✅ Pesanan ${pesanan.kode_pesanan} -> DIPROSES (auto)`);
          }

        } else if (transactionStatus === 'expire' || statusResponse.error) {
          payment.status_payment = 'expired';
          payment.response_data = statusResponse.raw_response || { error: statusResponse.error };
          await payment.save({ session });

        } else if (['deny', 'cancel', 'failure'].includes(transactionStatus)) {
          payment.status_payment = 'failed';
          payment.response_data = statusResponse.raw_response;
          await payment.save({ session });
        }

      } catch (error) {
        console.error(`❌ Error checking payment ${payment._id}:`, error.message);
      }
    }

    await session.commitTransaction();
    console.log("✅ Pending payments check completed");

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error in checkPendingPayments:", error.message);
  } finally {
    session.endSession();
  }
};

/**
 * Start all cron jobs
 */
export const startCronJobs = () => {
  console.log("🕐 Starting cron jobs...");

  // Check expired payments setiap 5 menit
  setInterval(checkExpiredPayments, 5 * 60 * 1000);

  // Check unpaid orders setiap 1 jam
  setInterval(checkUnpaidOrders, 60 * 60 * 1000);

  // Check pending payments setiap 10 menit
  setInterval(checkPendingPayments, 10 * 60 * 1000);

  // Run immediately on start
  setTimeout(() => {
    checkExpiredPayments();
    checkUnpaidOrders();
    checkPendingPayments();
  }, 10000); // 10 detik setelah server start

  console.log("✅ Cron jobs started");
};

export default {
  checkExpiredPayments,
  checkUnpaidOrders,
  checkPendingPayments,
  startCronJobs
};