import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Layout";

interface Admin {
  _id: string;
  nama: string;
  email: string;
  role: string;
  status: string;
}

const AdminList: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    role: "",
    status: "",
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/admins");
      setAdmins(res.data);
    } catch (err: any) {
      setError(err.message || "Gagal fetch data admin");
    } finally {
      setLoading(false);
    }
  };

  // === 🟢 Fungsi Hapus Admin ===
  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin mau hapus admin ini?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/admins/${id}`);
      setAdmins(admins.filter((a) => a._id !== id)); // Hapus dari list
    } catch (err: any) {
      alert("Gagal hapus admin: " + err.message);
    }
  };

  // === 🟡 Fungsi Edit Admin ===
  const handleEdit = (admin: Admin) => {
    setEditAdmin(admin);
    setFormData({
      nama: admin.nama,
      email: admin.email,
      role: admin.role,
      status: admin.status,
    });
  };

  // === 🟠 Simpan Perubahan Edit ===
  const handleSaveEdit = async () => {
    if (!editAdmin) return;
    try {
      const res = await axios.put(
        `http://localhost:5000/api/admins/${editAdmin._id}`,
        formData
      );
      setAdmins(
        admins.map((a) => (a._id === editAdmin._id ? res.data : a))
      );
      setEditAdmin(null);
      alert("Data admin berhasil diupdate!");
    } catch (err: any) {
      alert("Gagal update admin: " + err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Layout>
    <div style={{ padding: "20px" }}>
      <h2>Daftar Admin</h2>

      <table border={1} cellPadding={10} style={{ width: "100%", marginTop: "10px" }}>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin._id}>
              <td>{admin.nama}</td>
              <td>{admin.email}</td>
              <td>
                {admin.role === "super_admin"
                  ? "Super Admin"
                  : admin.role === "moderator"
                  ? "Moderator"
                  : admin.role}
              </td>
              <td>
                {admin.status === "aktif"
                  ? "Aktif"
                  : admin.status === "nonaktif"
                  ? "Nonaktif"
                  : admin.status}
              </td>
              <td>
                <button onClick={() => handleEdit(admin)}>Edit</button>{" "}
                <button
                  onClick={() => handleDelete(admin._id)}
                  style={{ color: "red" }}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editAdmin && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid gray",
            borderRadius: "8px",
          }}
        >
          <h3>Edit Admin</h3>
          <label>
            Nama:
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
          </label>
          <br />
          <label>
            Email:
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </label>
          <br />
          <label>
            Role:
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="super_admin">Super Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </label>
          <br />
          <label>
            Status:
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </label>
          <br />
          <button onClick={handleSaveEdit} style={{ marginTop: "10px" }}>
            Simpan
          </button>{" "}
          <button
            onClick={() => setEditAdmin(null)}
            style={{ marginTop: "10px", color: "red" }}
          >
            Batal
          </button>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default AdminList;
