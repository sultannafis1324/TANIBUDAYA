import Pesanan from "../models/Pesanan.js";
import Payment from "../models/Payment.js";
import Produk from "../models/Produk.js";
import Pengguna from "../models/Pengguna.js";
import { createSnapTransaction } from "../utils/midtrans.js";
import mongoose from "mongoose";

/**
 * Generate kode pesanan unik
 */
const generateKodePesanan = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

/**
 * CREATE PESANAN
 * POST /api/pesanan
 */
export const createPesanan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      id_penjual,
      items,
      total_harga_produk,
      ongkir,
      biaya_admin,
      id_promosi,
      diskon,
      total_bayar,
      alamat_pengiriman,
      kurir,
      catatan_pembeli,
      metode_pembayaran // 'cash', 'card', 'qris', 'transfer', 'ewallet'
    } = req.body;

    const id_pembeli = req.user.id;

    // Validasi
    if (!items || items.length === 0) {
      throw new Error("Items tidak boleh kosong");
    }

    if (!['cash', 'card', 'qris', 'transfer', 'ewallet'].includes(metode_pembayaran)) {
      throw new Error("Metode pembayaran tidak valid");
    }

    // Validasi stok produk
    for (const item of items) {
      const produk = await Produk.findById(item.id_produk).session(session);
      
      if (!produk) {
        throw new Error(`Produk dengan ID ${item.id_produk} tidak ditemukan`);
      }

      if (produk.stok < item.jumlah) {
        throw new Error(
          `Stok tidak cukup untuk ${produk.nama_produk}. ` +
          `Tersedia: ${produk.stok}, Dipesan: ${item.jumlah}`
        );
      }

      if (produk.status !== 'aktif') {
        throw new Error(`Produk ${produk.nama_produk} tidak aktif`);
      }
    }

    // Generate kode pesanan
    const kode_pesanan = generateKodePesanan();

    // Tentukan status pesanan awal
    const status_pesanan = metode_pembayaran === 'cash' 
      ? 'diproses' 
      : 'menunggu_pembayaran';

    // Create pesanan
    const pesanan = new Pesanan({
      kode_pesanan,
      id_pembeli,
      id_penjual,
      items,
      total_harga_produk,
      ongkir: ongkir || 0,
      biaya_admin: biaya_admin || 0,
      id_promosi: id_promosi || null,
      diskon: diskon || 0,
      total_bayar,
      alamat_pengiriman,
      kurir,
      catatan_pembeli,
      status_pesanan,
      tanggal_bayar: metode_pembayaran === 'cash' ? new Date() : null,
      stok_dikurangi: metode_pembayaran === 'cash' // true jika cash
    });

    await pesanan.save({ session });

    // 🔥 KURANGI STOK HANYA JIKA CASH
    if (metode_pembayaran === 'cash') {
      for (const item of items) {
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
      console.log(`✅ Stok dikurangi untuk pesanan ${kode_pesanan} (CASH)`);
    }

    // Create payment record
    let paymentData = {
      id_pesanan: pesanan._id,
      metode_pembayaran,
      jumlah: total_bayar,
      status_payment: metode_pembayaran === 'cash' ? 'success' : 'pending',
      paid_at: metode_pembayaran === 'cash' ? new Date() : null
    };

    // CASH - langsung success
    if (metode_pembayaran === 'cash') {
      paymentData.reference_number = `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    } 
    // ONLINE PAYMENT - create Midtrans Snap
    else {
      const pembeli = await Pengguna.findById(id_pembeli).session(session);
      
      const snapData = await createSnapTransaction(pesanan, pembeli, metode_pembayaran);
      
      paymentData.midtrans_order_id = snapData.order_id;
      paymentData.midtrans_snap_token = snapData.snap_token;
      paymentData.midtrans_payment_url = snapData.payment_url;
      paymentData.expired_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam
    }

    const payment = new Payment(paymentData);
    await payment.save({ session });

    await session.commitTransaction();

    console.log(`✅ Pesanan berhasil dibuat: ${kode_pesanan}, Status: ${status_pesanan}`);

    res.status(201).json({
      success: true,
      message: metode_pembayaran === 'cash' 
        ? 'Pesanan berhasil dibuat dan langsung diproses' 
        : 'Pesanan berhasil dibuat, silakan selesaikan pembayaran',
      data: {
        pesanan,
        payment: {
          id: payment._id,
          metode_pembayaran: payment.metode_pembayaran,
          status: payment.status_payment,
          snap_token: payment.midtrans_snap_token,
          payment_url: payment.midtrans_payment_url,
          expired_at: payment.expired_at
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error create pesanan:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * GET ALL PESANAN (untuk pembeli)
 * GET /api/pesanan
 */
export const getAllPesanan = async (req, res) => {
  try {
    const id_pembeli = req.user.id;
    const { status } = req.query;

    const filter = { id_pembeli };
    if (status) {
      filter.status_pesanan = status;
    }

    const pesanan = await Pesanan.find(filter)
      .populate('id_penjual', 'nama_usaha logo_usaha')
      .populate('items.id_produk', 'nama_produk media')
      .populate('alamat_pengiriman')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pesanan
    });

  } catch (error) {
    console.error("❌ Error get all pesanan:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET PESANAN BY ID
 * GET /api/pesanan/:id
 */
export const getPesananById = async (req, res) => {
  try {
    const { id } = req.params;
    const id_pembeli = req.user.id;

    const pesanan = await Pesanan.findOne({ _id: id, id_pembeli })
      .populate('id_penjual', 'nama_usaha logo_usaha alamat no_telepon')
      .populate('items.id_produk', 'nama_produk media harga')
      .populate('alamat_pengiriman');

    if (!pesanan) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan"
      });
    }

    // Get payment info
    const payment = await Payment.findOne({ id_pesanan: id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        pesanan,
        payment
      }
    });

  } catch (error) {
    console.error("❌ Error get pesanan by id:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET PESANAN PENJUAL
 * GET /api/pesanan/penjual/orders
 */
export const getPesananPenjual = async (req, res) => {
  try {
    // ✅ FIX: Ambil Profile Usaha dari user yang login
    const userId = req.user.id;
    
    const ProfileUsaha = mongoose.model("ProfileUsaha");
    const profileUsaha = await ProfileUsaha.findOne({ id_pengguna: userId });
    
    if (!profileUsaha) {
      return res.status(404).json({
        success: false,
        message: "Profile Usaha tidak ditemukan. Anda harus membuat Profile Usaha terlebih dahulu."
      });
    }

    const { status } = req.query;

    // ✅ Filter berdasarkan Profile Usaha ID
    const filter = { id_penjual: profileUsaha._id };
    if (status) {
      filter.status_pesanan = status;
    }

    const pesanan = await Pesanan.find(filter)
      .populate('id_pembeli', 'nama_lengkap email no_telepon')
      .populate('items.id_produk', 'nama_produk media')
      .populate('alamat_pengiriman')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${pesanan.length} pesanan for ${profileUsaha.nama_usaha}`);

    res.json({
      success: true,
      data: pesanan
    });

  } catch (error) {
    console.error("❌ Error get pesanan penjual:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * UPDATE STATUS PESANAN (untuk penjual)
 * PUT /api/pesanan/:id/status
 */
export const updateStatusPesanan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status_pesanan, resi, kurir } = req.body;

    const pesanan = await Pesanan.findById(id).session(session);

    if (!pesanan) {
      throw new Error("Pesanan tidak ditemukan");
    }

    // Validasi transisi status
    const allowedTransitions = {
      'menunggu_pembayaran': ['diproses', 'dibatalkan'],
      'diproses': ['dikirim', 'dibatalkan'],
      'dikirim': ['selesai', 'dikembalikan'],
      'selesai': [],
      'dibatalkan': [],
      'dikembalikan': []
    };

    if (!allowedTransitions[pesanan.status_pesanan]?.includes(status_pesanan)) {
      throw new Error(
        `Tidak bisa mengubah status dari ${pesanan.status_pesanan} ke ${status_pesanan}`
      );
    }

    // Update status
    pesanan.status_pesanan = status_pesanan;

    if (status_pesanan === 'dikirim') {
      pesanan.resi = resi;
      pesanan.kurir = kurir;
      pesanan.tanggal_kirim = new Date();
    }

    if (status_pesanan === 'selesai') {
      pesanan.tanggal_selesai = new Date();
    }

    await pesanan.save({ session });

    await session.commitTransaction();

    console.log(`✅ Status pesanan ${pesanan.kode_pesanan} diubah ke: ${status_pesanan}`);

    res.json({
      success: true,
      message: "Status pesanan berhasil diupdate",
      data: pesanan
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error update status pesanan:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * CANCEL PESANAN (untuk pembeli)
 * POST /api/pesanan/:id/cancel
 */
export const cancelPesanan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { alasan_batal } = req.body;
    const id_pembeli = req.user.id;

    const pesanan = await Pesanan.findOne({ _id: id, id_pembeli }).session(session);

    if (!pesanan) {
      throw new Error("Pesanan tidak ditemukan");
    }

    // Hanya bisa cancel jika masih menunggu pembayaran atau diproses
    if (!['menunggu_pembayaran', 'diproses'].includes(pesanan.status_pesanan)) {
      throw new Error(`Tidak bisa membatalkan pesanan dengan status ${pesanan.status_pesanan}`);
    }

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

    pesanan.status_pesanan = 'dibatalkan';
    pesanan.alasan_batal = alasan_batal || 'Dibatalkan oleh pembeli';
    await pesanan.save({ session });

    // Update payment jadi failed
    await Payment.updateOne(
      { id_pesanan: id },
      { status_payment: 'failed' },
      { session }
    );

    await session.commitTransaction();

    console.log(`✅ Pesanan ${pesanan.kode_pesanan} berhasil dibatalkan`);

    res.json({
      success: true,
      message: "Pesanan berhasil dibatalkan",
      data: pesanan
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error cancel pesanan:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

export default {
  createPesanan,
  getAllPesanan,
  getPesananById,
  getPesananPenjual,
  updateStatusPesanan,
  cancelPesanan
};