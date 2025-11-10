// src/views/admin/AdminLogin.tsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://localhost:5000/api/admins/login", {
        email,
        password,
      });

      // Simpan token dan data admin
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminData", JSON.stringify({
        _id: res.data._id,
        nama: res.data.nama,
        email: res.data.email,
        role: res.data.role,
        foto_profil: res.data.foto_profil
      }));

      setMessage(`Selamat datang, ${res.data.nama}!`);
      
      // Redirect ke admin list setelah 500ms
      setTimeout(() => {
        navigate("/admin/list");
      }, 500);

    } catch (err: any) {
      setMessage(err.response?.data?.message || "Login gagal");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h2>Login Admin</h2>
      {message && (
        <p style={{ 
          color: message.includes("Selamat") ? "green" : "red",
          padding: "10px",
          backgroundColor: message.includes("Selamat") ? "#d4edda" : "#f8d7da",
          border: `1px solid ${message.includes("Selamat") ? "#c3e6cb" : "#f5c6cb"}`,
          borderRadius: "4px"
        }}>
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;