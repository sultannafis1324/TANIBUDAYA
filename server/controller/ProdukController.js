import mongoose from "mongoose";
import Produk from "../models/Produk.js";
import slugify from "slugify";

// Generate slug unik
const generateSlug = async (nama) => {
  let baseSlug = slugify(nama, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 2;
  let existing = await Produk.findOne({ slug });
  while (existing) {
    slug = `${baseSlug}-${count}`;
    existing = await Produk.findOne({ slug });
    count++;
  }
  return slug;
};

// Helper function untuk mendapatkan ProfileUsaha
const getProfileUsaha = async (userId) => {
  const ProfileUsaha = mongoose.model("ProfileUsaha");
  const profileUsaha = await ProfileUsaha.findOne({ id_pengguna: userId });

  if (!profileUsaha) {
    throw new Error("Anda harus membuat Profile Usaha terlebih dahulu");
  }

  return profileUsaha;
};

// --- CRUD untuk Penjual ---
export const getAllProduk = async (req, res) => {
  try {
    const profileUsaha = await getProfileUsaha(req.user.id);
    const produk = await Produk.find({ id_penjual: profileUsaha._id })
      .populate("kategori", "nama_kategori")
      .sort({ createdAt: -1 })
      .lean();

    res.json(produk);
  } catch (err) {
    if (err.message === "Anda harus membuat Profile Usaha terlebih dahulu") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

export const getProdukById = async (req, res) => {
  try {
    const profileUsaha = await getProfileUsaha(req.user.id);

    const produk = await Produk.findOne({
      _id: req.params.id,
      id_penjual: profileUsaha._id,
    }).populate("kategori", "nama_kategori");

    if (!produk)
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json(produk);
  } catch (err) {
    if (err.message === "Anda harus membuat Profile Usaha terlebih dahulu") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// --- CREATE PRODUK ---
export const createProduk = async (req, res) => {
  try {
    const {
      nama_produk,
      harga,
      harga_modal,
      stok,
      deskripsi,
      kategori,
      berat,
      spesifikasi,
      tags,
      tanggal_kadaluarsa,
    } = req.body;

    const profileUsaha = await getProfileUsaha(req.user.id);
    if (profileUsaha.status_verifikasi !== "approved") {
      return res
        .status(403)
        .json({ message: "Profile usaha Anda belum diverifikasi oleh admin" });
    }

    const slug = await generateSlug(nama_produk);

    // Parse spesifikasi & tags
    let parsedSpesifikasi = [];
    let parsedTags = [];
    try {
      parsedSpesifikasi = JSON.parse(spesifikasi || "[]");
    } catch (e) {
      console.warn("Invalid spesifikasi JSON:", e.message);
    }
    try {
      parsedTags = JSON.parse(tags || "[]");
    } catch (e) {
      console.warn("Invalid tags JSON:", e.message);
    }

    // ✅ Ambil URL dari Cloudinary (sudah otomatis terupload)
    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      mediaUrls = req.files.map(file => ({
        url: file.path, // Cloudinary menyimpan URL di file.path
        type: file.mimetype.startsWith('video/') ? "video" : "image" // ✅ Auto-detect
      }));
    }

    const produk = new Produk({
      nama_produk,
      slug,
      deskripsi: deskripsi || "",
      harga: Number(harga),
      harga_modal: harga_modal ? Number(harga_modal) : undefined,
      stok: Number(stok),
      berat: berat ? Number(berat) : undefined,
      kategori,
      id_penjual: profileUsaha._id,
      media: mediaUrls,
      spesifikasi: parsedSpesifikasi,
      tags: parsedTags,
      tanggal_kadaluarsa: tanggal_kadaluarsa
        ? new Date(tanggal_kadaluarsa)
        : undefined,
      status: stok > 0 ? "aktif" : "sold_out",
      rating_produk: 0,
      jumlah_ulasan: 0,
      jumlah_terjual: 0,
    });

    const saved = await produk.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating produk:", err);
    res
      .status(500)
      .json({ message: "Gagal menambah produk", error: err.message });
  }
};

// --- UPDATE PRODUK ---
export const updateProduk = async (req, res) => {
  try {
    const profileUsaha = await getProfileUsaha(req.user.id);

    const produk = await Produk.findOne({
      _id: req.params.id,
      id_penjual: profileUsaha._id,
    });

    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const {
      nama_produk,
      harga,
      harga_modal,
      stok,
      deskripsi,
      kategori,
      berat,
      spesifikasi,
      tags,
      tanggal_kadaluarsa,
    } = req.body;

    // Update slug kalau nama berubah
    let slug = produk.slug;
    if (nama_produk && nama_produk !== produk.nama_produk) {
      slug = await generateSlug(nama_produk);
    }

    // Parsing JSON field
    let parsedSpesifikasi = produk.spesifikasi || [];
    let parsedTags = produk.tags || [];
    try {
      parsedSpesifikasi = JSON.parse(spesifikasi || "[]");
    } catch (e) {
      console.warn("Invalid spesifikasi JSON:", e.message);
    }
    try {
      parsedTags = JSON.parse(tags || "[]");
    } catch (e) {
      console.warn("Invalid tags JSON:", e.message);
    }

    // ✅ Upload media baru (jika ada) - sudah otomatis ke Cloudinary
    let mediaUrls = produk.media || [];
    if (req.files && req.files.length > 0) {
      const newMedia = req.files.map(file => ({
        url: file.path, // Cloudinary URL
        type: file.mimetype.startsWith('video/') ? "video" : "image" // ✅ Auto-detect
      }));
      mediaUrls = [...mediaUrls, ...newMedia].slice(-5); // Maksimal 5 media
    }

    // Update semua field
    produk.nama_produk = nama_produk || produk.nama_produk;
    produk.slug = slug;
    produk.deskripsi = deskripsi ?? produk.deskripsi;
    produk.harga = harga !== undefined ? Number(harga) : produk.harga;
    produk.harga_modal =
      harga_modal !== undefined ? Number(harga_modal) : produk.harga_modal;
    produk.stok = stok !== undefined ? Number(stok) : produk.stok;
    produk.berat = berat !== undefined ? Number(berat) : produk.berat;
    produk.kategori = kategori || produk.kategori;
    produk.spesifikasi = parsedSpesifikasi;
    produk.tags = parsedTags;
    produk.media = mediaUrls;
    produk.tanggal_kadaluarsa = tanggal_kadaluarsa
      ? new Date(tanggal_kadaluarsa)
      : produk.tanggal_kadaluarsa;

    produk.status = produk.stok > 0 ? "aktif" : "sold_out";

    const updated = await produk.save();
    res.json(updated);
  } catch (err) {
    console.error("Error update produk:", err);
    if (err.message === "Anda harus membuat Profile Usaha terlebih dahulu") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({
      message: "Gagal update produk",
      error: err.message,
    });
  }
};

export const deleteProduk = async (req, res) => {
  try {
    const profileUsaha = await getProfileUsaha(req.user.id);

    const produk = await Produk.findOneAndDelete({
      _id: req.params.id,
      id_penjual: profileUsaha._id,
    });

    if (!produk)
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json({ message: "Produk dihapus" });
  } catch (err) {
    if (err.message === "Anda harus membuat Profile Usaha terlebih dahulu") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};