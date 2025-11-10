import Produk from "../models/Produk.js";

// --- MARKETPLACE (Public) ---
export const getPublicProduk = async (req, res) => {
  try {
    let { kategori, search, sort, page, limit } = req.query;

    // Default pagination
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const skip = (page - 1) * limit;

    // Query dasar
    let query = { status: "aktif" };

    if (kategori) query.kategori = kategori;

    if (search) {
      query.$or = [
        { nama_produk: { $regex: search, $options: "i" } },
        { deskripsi: { $regex: search, $options: "i" } },
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default terbaru
    if (sort === "terbaru") sortOption = { createdAt: -1 };
    else if (sort === "termurah") sortOption = { harga: 1 };
    else if (sort === "termahal") sortOption = { harga: -1 };
    else if (sort === "terlaris") sortOption = { jumlah_terjual: -1 };

    // Total produk matching query (buat frontend pagination)
    const total = await Produk.countDocuments(query);

    // Ambil produk
    const produk = await Produk.find(query)
      .populate("kategori", "nama_kategori")
      .populate("id_penjual", "nama_usaha slug logo_usaha")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: produk,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProdukBySlug = async (req, res) => {
  try {
    const produk = await Produk.findOne({ slug: req.params.slug })
      .populate("kategori", "nama_kategori")
      .populate(
        "id_penjual",
        "nama_usaha alamat_usaha slug logo_usaha rating_toko"
      );

    if (!produk)
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json(produk);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
