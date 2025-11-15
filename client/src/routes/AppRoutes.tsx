import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout";

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

// Keranjang
import KeranjangList from "../views/keranjang/KeranjangList";

// Pesanan
import PesananList from "../views/pesanan/PesananList";
import DetailPesanan from "../views/pesanan/DetailPesanan";
import CreatePesanan from "../views/pesanan/CreatePesanan";
import KelolaPesanan from "../views/pesanan/KelolaPesanan";


// Konten Budaya
import KontenBudayaList from "../views/konten/KontenBudayaList";
import KontenBudayaCreate from "../views/konten/KontenBudayaCreate";
import KontenBudayaEdit from "../views/konten/KontenBudayaEdit";
import KontenBudayaShow from "../views/konten/KontenBudayaShow";
import KontenBudayaPublik from "../views/konten/KontenBudayaPublik";

// PrivateRoute dengan role check
interface PrivateRouteProps {
  children: React.ReactElement;
  role: "admin" | "pengguna";
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");

  if (!token) return <Navigate to="/login" replace />;
  if (userType !== role) return <Navigate to="/login" replace />;

  return children;
};

// Authenticated route untuk semua user login
interface AuthenticatedRouteProps {
  children: React.ReactElement;
}

const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* ===== AUTH (tanpa Layout/Navbar) ===== */}
        <Route path="/login" element={<UniversalLogin />} />
        <Route path="/register-pengguna" element={<RegisterPengguna />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />

        {/* ===== MARKETPLACE & BUDAYA PUBLIC (dengan Layout) ===== */}
        <Route path="/marketplace" element={<Marketplace />} />
        <Route
          path="/produk/:slug"
          element={
            <Layout>
              <ProdukShow />
            </Layout>
          }
        />
        <Route
          path="/budaya"
          element={
            <Layout>
              <KontenBudayaPublik />
            </Layout>
          }
        />
        <Route
          path="/budaya/:id"
          element={
            <Layout>
              <KontenBudayaShow />
            </Layout>
          }
        />

        {/* ===== ADMIN ROUTES ===== */}
        <Route
          path="/admin/list"
          element={
            <Layout>
              <PrivateRoute role="admin">
                <AdminList />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/admin/kategori/list"
          element={
            <Layout>
              <PrivateRoute role="admin">
                <KategoriList />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/admin/pengguna/list"
          element={
            <Layout>
              <PrivateRoute role="admin">
                <PenggunaList />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/admin/profile-usaha/verifikasi"
          element={
            <Layout>
              <PrivateRoute role="admin">
                <VerifikasiUsaha />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* ===== PENGGUNA ROUTES - Profile ===== */}
        <Route
          path="/profile"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <Profile />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <EditProfile />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/profile-usaha"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <ProfileUsaha />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* ===== PENGGUNA ROUTES - Alamat ===== */}
        <Route
          path="/alamat"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <AlamatList />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/alamat/create"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <AlamatCreate />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/alamat/edit/:id"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <AlamatEdit />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* ===== PENGGUNA ROUTES - Keranjang ===== */}
        <Route
          path="/keranjang"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <KeranjangList />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* ===== PENGGUNA ROUTES - Pesanan ===== */}
        <Route
          path="/pesanan"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <PesananList />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/pesanan/:id"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <DetailPesanan />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/pesanan/kelola"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <KelolaPesanan />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/checkout"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <CreatePesanan />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* ===== PENGGUNA ROUTES - Notifikasi ===== */}
        <Route
          path="/notifikasi"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <Notifikasi />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* ===== PENGGUNA ROUTES - Produk ===== */}
        <Route
          path="/produk/list"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <ProdukList />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/produk/create"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <ProdukCreate />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/produk/edit/:id"
          element={
            <Layout>
              <PrivateRoute role="pengguna">
                <ProdukEdit />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* ===== KONTEN BUDAYA - Authenticated ===== */}
        <Route
          path="/konten-budaya"
          element={
            <Layout>
              <AuthenticatedRoute>
                <KontenBudayaList />
              </AuthenticatedRoute>
            </Layout>
          }
        />
        <Route
          path="/konten-budaya/create"
          element={
            <Layout>
              <AuthenticatedRoute>
                <KontenBudayaCreate />
              </AuthenticatedRoute>
            </Layout>
          }
        />
        <Route
          path="/konten-budaya/edit/:id"
          element={
            <Layout>
              <AuthenticatedRoute>
                <KontenBudayaEdit />
              </AuthenticatedRoute>
            </Layout>
          }
        />

        {/* ===== DEFAULT REDIRECT ===== */}
        <Route path="/" element={<Navigate to="/marketplace" replace />} />
        <Route path="*" element={<Navigate to="/marketplace" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;