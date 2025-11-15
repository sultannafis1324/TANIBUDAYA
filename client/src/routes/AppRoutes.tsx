// src/routes/AppRoutes.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AppLayout from "../layout/AppLayout";

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

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* ===== AUTH (tanpa sidebar) ===== */}
        <Route path="/login" element={<UniversalLogin />} />
        <Route path="/register-pengguna" element={<RegisterPengguna />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />

        {/* ===== MARKETPLACE (Public) ===== */}
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/produk/:slug" element={<ProdukShow />} />

        {/* ===== ADMIN (pakai AppLayout) ===== */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute role="admin">
              <AppLayout>
                <Outlet />
              </AppLayout>
            </PrivateRoute>
          }
        >
          <Route path="list" element={<AdminList />} />
          <Route path="kategori/list" element={<KategoriList />} />
          <Route path="pengguna/list" element={<PenggunaList />} />
          <Route path="profile-usaha/verifikasi" element={<VerifikasiUsaha />} />
        </Route>

        {/* ===== PENGGUNA / PENJUAL (pakai AppLayout) ===== */}
        <Route
          path="/profile/*"
          element={
            <PrivateRoute role="pengguna">
              <AppLayout>
                <Outlet />
              </AppLayout>
            </PrivateRoute>
          }
        >
          <Route index element={<Profile />} />
          <Route path="edit" element={<EditProfile />} />
        </Route>

        <Route
          path="/profile-usaha"
          element={
            <PrivateRoute role="pengguna">
              <AppLayout>
                <ProfileUsaha />
              </AppLayout>
            </PrivateRoute>
          }
        />

        {/* Alamat */}
        <Route
          path="/alamat/*"
          element={
            <PrivateRoute role="pengguna">
              <AppLayout>
                <Outlet />
              </AppLayout>
            </PrivateRoute>
          }
        >
          <Route index element={<AlamatList />} />
          <Route path="create" element={<AlamatCreate />} />
          <Route path="edit/:id" element={<AlamatEdit />} />
        </Route>

        {/* Notifikasi */}
        <Route
          path="/notifikasi"
          element={
            <PrivateRoute role="pengguna">
              <AppLayout>
                <Notifikasi />
              </AppLayout>
            </PrivateRoute>
          }
        />

        {/* Produk */}
        <Route
          path="/produk/*"
          element={
            <PrivateRoute role="pengguna">
              <AppLayout>
                <Outlet />
              </AppLayout>
            </PrivateRoute>
          }
        >
          <Route path="list" element={<ProdukList />} />
          <Route path="create" element={<ProdukCreate />} />
          <Route path="edit/:id" element={<ProdukEdit />} />
        </Route>

        {/* Konten Budaya */}
        <Route path="/budaya" element={<KontenBudayaPublik />} />
        <Route path="/budaya/:id" element={<KontenBudayaShow />} />
        <Route
          path="/konten-budaya/*"
          element={
            <AuthenticatedRoute>
              <AppLayout>
                <Outlet />
              </AppLayout>
            </AuthenticatedRoute>
          }
        >
          <Route index element={<KontenBudayaList />} />
          <Route path="create" element={<KontenBudayaCreate />} />
          <Route path="edit/:id" element={<KontenBudayaEdit />} />
        </Route>

        {/* ===== DEFAULT ===== */}
        <Route path="/" element={<Navigate to="/marketplace" replace />} />
        <Route path="*" element={<Navigate to="/marketplace" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
