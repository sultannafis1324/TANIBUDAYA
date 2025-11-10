// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import penggunaRoutes from "./routes/penggunaRoutes.js";
import kategoriRoutes from "./routes/kategoriRoutes.js";
import produkRoutes from "./routes/produkRoutes.js";
import notifikasiRoutes from "./routes/notifikasiRoutes.js";
import MarketplaceRoute from "./routes/MarketplaceRoute.js";
import kontenBudayaRoutes from "./routes/kontenBudaya.js";
import alamatRoutes from "./routes/alamatRoutes.js"; // 🆕 alamat
import profileUsahaRoutes from "./routes/profileUsahaRoutes.js"; // 🆕 pengganti usaha

dotenv.config();
const app = express();

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ====== ROUTES ======
app.get("/", (req, res) => {
  res.send("🌾 Server TANIBUDAYA berjalan dengan baik 🚀");
});

// Auth & Admin
app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);

// Pengguna & Alamat
app.use("/api/pengguna", penggunaRoutes);
app.use("/api/alamat", alamatRoutes);

// Kategori, Produk, dan Profile Usaha
app.use("/api/kategori", kategoriRoutes);
app.use("/api/produk", produkRoutes);
app.use("/api/profile-usaha", profileUsahaRoutes); // ✅ ganti route usaha ke profile-usaha

// Notifikasi & Marketplace
app.use("/api/notifikasi", notifikasiRoutes);
app.use("/api/marketplace", MarketplaceRoute);

// Konten Budaya
app.use("/api/konten-budaya", kontenBudayaRoutes);

// ====== DATABASE ======
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ====== START SERVER ======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server TANIBUDAYA running on port ${PORT}`)
);
