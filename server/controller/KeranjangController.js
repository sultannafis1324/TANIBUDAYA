import mongoose from "mongoose";
import Keranjang from "../models/Keranjang.js";
import Produk from "../models/Produk.js";

// Helper function untuk mendapatkan keranjang dengan detail produk
const getKeranjangWithDetails = async (userId) => {
  const items = await Keranjang.find({ id_pengguna: userId })
    .populate({
      path: "id_produk",
      select: "nama_produk harga stok media status slug id_penjual", // ✅ Tambah id_penjual
    })
    .populate({
      path: "id_penjual",
      select: "nama_usaha foto_profil",
    })
    .sort({ createdAt: -1 })
    .lean();

  // Group by penjual (seperti Shopee)
  const groupedByPenjual = items.reduce((acc, item) => {
    const penjualId = item.id_penjual._id.toString();
    
    if (!acc[penjualId]) {
      acc[penjualId] = {
        id_penjual: item.id_penjual._id,
        nama_usaha: item.id_penjual.nama_usaha,
        foto_profil: item.id_penjual.foto_profil,
        items: [],
      };
    }
    
    // ✅ HITUNG SUBTOTAL untuk setiap item
    const subtotal = (item.id_produk?.harga || 0) * item.jumlah;
    
    acc[penjualId].items.push({
      ...item,
      subtotal // ✅ Tambahkan subtotal
    });
    return acc;
  }, {});

  return Object.values(groupedByPenjual);
};

// GET semua keranjang user (dikelompokkan per penjual)
export const getKeranjang = async (req, res) => {
  try {
    const grouped = await getKeranjangWithDetails(req.user.id);
    res.json(grouped);
  } catch (err) {
    console.error("Error get keranjang:", err);
    res.status(500).json({ message: "Gagal mengambil keranjang", error: err.message });
  }
};

// ADD produk ke keranjang
export const addToKeranjang = async (req, res) => {
  try {
    const { id_produk, jumlah = 1 } = req.body;

    if (!id_produk) {
      return res.status(400).json({ message: "ID produk harus diisi" });
    }

    // Validasi produk
    const produk = await Produk.findById(id_produk);
    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    if (produk.status !== "aktif") {
      return res.status(400).json({ message: "Produk tidak tersedia" });
    }

    if (produk.stok < jumlah) {
      return res.status(400).json({ message: "Stok tidak mencukupi" });
    }

    // Cek apakah produk sudah ada di keranjang
    let keranjangItem = await Keranjang.findOne({
      id_pengguna: req.user.id,
      id_produk: id_produk,
    });

    if (keranjangItem) {
      // Update jumlah jika sudah ada
      const newJumlah = keranjangItem.jumlah + jumlah;
      
      if (newJumlah > produk.stok) {
        return res.status(400).json({ message: "Jumlah melebihi stok tersedia" });
      }

      keranjangItem.jumlah = newJumlah;
      keranjangItem.checked = true;
      await keranjangItem.save();

      return res.json({ 
        message: "Jumlah produk di keranjang diperbarui", 
        data: keranjangItem 
      });
    }

    // Tambah item baru
    keranjangItem = new Keranjang({
      id_pengguna: req.user.id,
      id_produk: id_produk,
      id_penjual: produk.id_penjual,
      jumlah: jumlah,
      checked: true,
    });

    await keranjangItem.save();

    res.status(201).json({ 
      message: "Produk berhasil ditambahkan ke keranjang", 
      data: keranjangItem 
    });
  } catch (err) {
    console.error("Error add to keranjang:", err);
    res.status(500).json({ message: "Gagal menambahkan ke keranjang", error: err.message });
  }
};

// UPDATE jumlah produk di keranjang
export const updateJumlahKeranjang = async (req, res) => {
  try {
    const { id } = req.params;
    const { jumlah } = req.body;

    if (!jumlah || jumlah < 1) {
      return res.status(400).json({ message: "Jumlah harus minimal 1" });
    }

    const keranjangItem = await Keranjang.findOne({
      _id: id,
      id_pengguna: req.user.id,
    });

    if (!keranjangItem) {
      return res.status(404).json({ message: "Item keranjang tidak ditemukan" });
    }

    // Validasi stok
    const produk = await Produk.findById(keranjangItem.id_produk);
    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    if (jumlah > produk.stok) {
      return res.status(400).json({ message: "Jumlah melebihi stok tersedia" });
    }

    keranjangItem.jumlah = jumlah;
    await keranjangItem.save();

    res.json({ 
      message: "Jumlah berhasil diperbarui", 
      data: keranjangItem 
    });
  } catch (err) {
    console.error("Error update jumlah:", err);
    res.status(500).json({ message: "Gagal update jumlah", error: err.message });
  }
};

// TOGGLE checkbox item (untuk pilih produk yang akan di-checkout)
export const toggleCheckKeranjang = async (req, res) => {
  try {
    const { id } = req.params;

    const keranjangItem = await Keranjang.findOne({
      _id: id,
      id_pengguna: req.user.id,
    });

    if (!keranjangItem) {
      return res.status(404).json({ message: "Item keranjang tidak ditemukan" });
    }

    keranjangItem.checked = !keranjangItem.checked;
    await keranjangItem.save();

    res.json({ 
      message: "Status checked berhasil diubah", 
      data: keranjangItem 
    });
  } catch (err) {
    console.error("Error toggle check:", err);
    res.status(500).json({ message: "Gagal toggle check", error: err.message });
  }
};

// TOGGLE ALL checkbox per penjual
export const toggleCheckAllPenjual = async (req, res) => {
  try {
    const { id_penjual } = req.body;

    if (!id_penjual) {
      return res.status(400).json({ message: "ID penjual harus diisi" });
    }

    const items = await Keranjang.find({
      id_pengguna: req.user.id,
      id_penjual: id_penjual,
    });

    if (items.length === 0) {
      return res.status(404).json({ message: "Tidak ada item dari penjual ini" });
    }

    // Cek apakah semua sudah checked
    const allChecked = items.every(item => item.checked);
    const newStatus = !allChecked;

    // Update semua item penjual
    await Keranjang.updateMany(
      { 
        id_pengguna: req.user.id, 
        id_penjual: id_penjual 
      },
      { checked: newStatus }
    );

    res.json({ 
      message: `Semua item ${newStatus ? 'dipilih' : 'dibatalkan'}`, 
      checked: newStatus 
    });
  } catch (err) {
    console.error("Error toggle all penjual:", err);
    res.status(500).json({ message: "Gagal toggle semua item", error: err.message });
  }
};

// DELETE item dari keranjang
export const deleteKeranjangItem = async (req, res) => {
  try {
    const { id } = req.params;

    const keranjangItem = await Keranjang.findOneAndDelete({
      _id: id,
      id_pengguna: req.user.id,
    });

    if (!keranjangItem) {
      return res.status(404).json({ message: "Item keranjang tidak ditemukan" });
    }

    res.json({ message: "Item berhasil dihapus dari keranjang" });
  } catch (err) {
    console.error("Error delete keranjang:", err);
    res.status(500).json({ message: "Gagal menghapus item", error: err.message });
  }
};

// DELETE multiple items (berdasarkan array ID)
export const deleteMultipleKeranjang = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Array ID harus diisi" });
    }

    const result = await Keranjang.deleteMany({
      _id: { $in: ids },
      id_pengguna: req.user.id,
    });

    res.json({ 
      message: `${result.deletedCount} item berhasil dihapus`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error delete multiple:", err);
    res.status(500).json({ message: "Gagal menghapus item", error: err.message });
  }
};

// GET total item & harga yang di-check (untuk summary checkout)
export const getKeranjangSummary = async (req, res) => {
  try {
    const items = await Keranjang.find({
      id_pengguna: req.user.id,
      checked: true,
    }).populate("id_produk", "harga");

    const totalItems = items.reduce((sum, item) => sum + item.jumlah, 0);
    
    // ✅ FIX: Hitung totalHarga dengan benar
    const totalHarga = items.reduce((sum, item) => {
      const harga = item.id_produk?.harga || 0;
      return sum + (harga * item.jumlah);
    }, 0);

    res.json({
      totalItems,
      totalHarga,
      jumlahProduk: items.length,
    });
  } catch (err) {
    console.error("Error get summary:", err);
    res.status(500).json({ message: "Gagal mengambil summary", error: err.message });
  }
};

// CLEAR semua keranjang user
export const clearKeranjang = async (req, res) => {
  try {
    const result = await Keranjang.deleteMany({ id_pengguna: req.user.id });
    
    res.json({ 
      message: "Keranjang berhasil dikosongkan",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error clear keranjang:", err);
    res.status(500).json({ message: "Gagal mengosongkan keranjang", error: err.message });
  }
};