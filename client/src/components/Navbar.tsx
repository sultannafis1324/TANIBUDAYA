// src/components/Navbar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="bg-indigo-600 text-white p-4 flex justify-between items-center">
      <div
        className="text-lg font-bold cursor-pointer"
        onClick={() => navigate("/marketplace")}
      >
        TaniBudaya
      </div>

      <div className="flex gap-3 items-center">
        <button onClick={() => navigate("/marketplace")} className="hover:bg-indigo-500 px-3 py-1 rounded">
          Marketplace
        </button>

        <button onClick={() => navigate("/budaya")} className="hover:bg-indigo-500 px-3 py-1 rounded">
          Konten Budaya
        </button>

        {/* Admin Menu */}
{token && userType === "admin" && (
  <>
    <button onClick={() => navigate("/admin/list")} className="hover:bg-indigo-500 px-3 py-1 rounded">
      Admin
    </button>
    <button onClick={() => navigate("/pengguna/list")} className="hover:bg-indigo-500 px-3 py-1 rounded">
      Pengguna
    </button>
    <button onClick={() => navigate("/kategori/list")} className="hover:bg-indigo-500 px-3 py-1 rounded">
      Kategori
    </button>
    <button onClick={() => navigate("/profile-usaha/verifikasi")} className="hover:bg-indigo-500 px-3 py-1 rounded">
      Verifikasi Usaha
    </button>
    <button onClick={() => navigate("/konten-budaya")} className="hover:bg-indigo-500 px-3 py-1 rounded">
      Kelola Konten
    </button>
  </>
)}

        {/* Pengguna Menu */}
        {token && userType === "pengguna" && (
          <>
            <button onClick={() => navigate("/produk/list")} className="hover:bg-indigo-500 px-3 py-1 rounded">
              Produk
            </button>
            <button onClick={() => navigate("/profile")} className="hover:bg-indigo-500 px-3 py-1 rounded">
              Profil
            </button>
            <button onClick={() => navigate("/profile-usaha")} className="hover:bg-indigo-500 px-3 py-1 rounded">
              Profile Usaha
            </button>
            <button onClick={() => navigate("/alamat")} className="hover:bg-indigo-500 px-3 py-1 rounded">
              Alamat
            </button>
            <button onClick={() => navigate("/notifikasi")} className="hover:bg-indigo-500 px-3 py-1 rounded">
              Notifikasi
            </button>
            <button onClick={() => navigate("/konten-budaya")} className="hover:bg-indigo-500 px-3 py-1 rounded">
              Konten Saya
            </button>
          </>
        )}

        {!token ? (
          <>
            <button onClick={() => navigate("/login")} className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded">
              Login
            </button>
            <button
              onClick={() => navigate("/register-pengguna")}
              className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded"
            >
              Register
            </button>
          </>
        ) : (
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
