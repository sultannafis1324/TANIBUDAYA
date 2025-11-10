// src/views/admin/AdminRegister.tsx
import React, { useState } from "react";
import axios from "axios";

const AdminRegister: React.FC = () => {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("moderator");
  const [status, setStatus] = useState("aktif");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/admins/register", {
        nama,
        email,
        password,
        role,
        status,
      });
      setMessage(`Admin ${res.data.nama} berhasil didaftarkan!`);
      // Reset form
      setNama("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Terjadi kesalahan server");
    }
  };

  return (
    <div>
      <h2>Register Admin</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="super_admin">Super Admin</option>
          <option value="moderator">Moderator</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default AdminRegister;
