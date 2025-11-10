// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Auth pages
import UniversalLogin from "../views/auth/Login";
import RegisterPengguna from "../views/auth/RegisterPengguna";
import RegisterAdmin from "../views/auth/RegisterAdmin";

// Pages
import AdminList from "../views/admin/AdminList";
import PenggunaList from "../views/admin/PenggunaList";
import KategoriList from "../views/kategori/KategoriList";
import Notifikasi from "../views/notifikasi/Notifikasi";

// Profile & Usaha
import Profile from "../views/profile/Profile";
import EditProfile from "../views/profile/EditProfile";
import ProfileUsaha from "../views/profile/ProfileUsaha";
import VerifikasiUsaha from "../views/profile/VerifikasiUsaha";

// Alamat
import AlamatList from "../views/alamat/AlamatList";
import AlamatCreate from "../views/alamat/AlamatCreate";
import AlamatEdit from "../views/alamat/AlamatEdit";

// Produk
import Marketplace from "../views/marketplace/Marketplace";
import ProdukShow from "../views/marketplace/ProdukShow";
import ProdukList from "../views/produk/ProdukList";
import ProdukCreate from "../views/produk/ProdukCreate";
import ProdukEdit from "../views/produk/ProdukEdit";

// Konten Budaya
import KontenBudayaList from "../views/konten/KontenBudayaList";
import KontenBudayaCreate from "../views/konten/KontenBudayaCreate";
import KontenBudayaEdit from "../views/konten/KontenBudayaEdit";
import KontenBudayaShow from "../views/konten/KontenBudayaShow";
import KontenBudayaPublik from "../views/konten/KontenBudayaPublik";

// PrivateRoute dengan role check
const PrivateRoute: React.FC<{ children: JSX.Element; role: "admin" | "pengguna" }> = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");

  if (!token) return <Navigate to="/login" replace />;
  if (userType !== role) return <Navigate to="/login" replace />;

  return children;
};

// Authenticated route untuk semua user login
const AuthenticatedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* ===== AUTH ===== */}
        <Route path="/login" element={<UniversalLogin />} />
        <Route path="/register-pengguna" element={<RegisterPengguna />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />

        {/* ===== MARKETPLACE (Public) ===== */}
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/produk/:slug" element={<ProdukShow />} />

        {/* ===== ADMIN ===== */}
        <Route
          path="/admin/list"
          element={
            <PrivateRoute role="admin">
              <AdminList />
            </PrivateRoute>
          }
        />
        <Route
          path="/kategori/list"
          element={
            <PrivateRoute role="admin">
              <KategoriList />
            </PrivateRoute>
          }
        />
        <Route
          path="/pengguna/list"
          element={
            <PrivateRoute role="admin">
              <PenggunaList />
            </PrivateRoute>
          }
        />

        {/* ===== PENGGUNA / PENJUAL ===== */}
        <Route
          path="/profile"
          element={
            <PrivateRoute role="pengguna">
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <PrivateRoute role="pengguna">
              <EditProfile />
            </PrivateRoute>
          }
        />

        {/* 🔥 GANTI: dari /usaha → /profile-usaha */}
        <Route
          path="/profile-usaha"
          element={
            <PrivateRoute role="pengguna">
              <ProfileUsaha />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile-usaha/verifikasi"
          element={
            <PrivateRoute role="admin">
              <VerifikasiUsaha />
            </PrivateRoute>
          }
        />

        {/* Alamat */}
        <Route
          path="/alamat"
          element={
            <PrivateRoute role="pengguna">
              <AlamatList />
            </PrivateRoute>
          }
        />
        <Route
          path="/alamat/create"
          element={
            <PrivateRoute role="pengguna">
              <AlamatCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/alamat/edit/:id"
          element={
            <PrivateRoute role="pengguna">
              <AlamatEdit />
            </PrivateRoute>
          }
        />

        {/* Notifikasi */}
        <Route
          path="/notifikasi"
          element={
            <PrivateRoute role="pengguna">
              <Notifikasi />
            </PrivateRoute>
          }
        />

        {/* Produk */}
        <Route
          path="/produk/list"
          element={
            <PrivateRoute role="pengguna">
              <ProdukList />
            </PrivateRoute>
          }
        />
        <Route
          path="/produk/create"
          element={
            <PrivateRoute role="pengguna">
              <ProdukCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/produk/edit/:id"
          element={
            <PrivateRoute role="pengguna">
              <ProdukEdit />
            </PrivateRoute>
          }
        />

        {/* Konten Budaya */}
        <Route path="/budaya" element={<KontenBudayaPublik />} />
        <Route path="/budaya/:id" element={<KontenBudayaShow />} />
        <Route
          path="/konten-budaya"
          element={
            <AuthenticatedRoute>
              <KontenBudayaList />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/konten-budaya/create"
          element={
            <AuthenticatedRoute>
              <KontenBudayaCreate />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/konten-budaya/edit/:id"
          element={
            <AuthenticatedRoute>
              <KontenBudayaEdit />
            </AuthenticatedRoute>
          }
        />

        {/* ===== DEFAULT ===== */}
        <Route path="/" element={<Navigate to="/marketplace" replace />} />
        <Route path="*" element={<Navigate to="/marketplace" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
