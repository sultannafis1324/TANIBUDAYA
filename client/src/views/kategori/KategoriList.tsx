import React, { useEffect, useState } from "react";
import axios from "axios";

interface Kategori {
  _id: string;
  nama_kategori: string;
  tipe_kategori: "produk" | "budaya";
  deskripsi?: string;
  status: "aktif" | "nonaktif";
}

const KategoriList: React.FC = () => {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Kategori>>({});
  const [newKategori, setNewKategori] = useState<Partial<Kategori>>({ status: "aktif" });

  const handleAxiosError = (err: unknown, fallbackMessage: string) => {
    if (axios.isAxiosError(err)) {
      alert(err.response?.data?.message || fallbackMessage);
    } else if (err instanceof Error) {
      alert(err.message);
    } else {
      alert(fallbackMessage);
    }
  };

  const fetchKategori = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/kategori");
      setKategoriList(res.data);
    } catch (err: unknown) {
      handleAxiosError(err, "Gagal fetch kategori");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKategori();
  }, []);

  const handleEdit = (kat: Kategori) => {
    setEditingId(kat._id);
    setEditData({ ...kat });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (id: string) => {
    try {
      await axios.put(`/api/kategori/${id}`, editData);
      fetchKategori();
      handleCancel();
    } catch (err: unknown) {
      handleAxiosError(err, "Gagal update kategori");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin hapus kategori ini?")) return;
    try {
      await axios.delete(`/api/kategori/${id}`);
      fetchKategori();
    } catch (err: unknown) {
      handleAxiosError(err, "Gagal hapus kategori");
    }
  };

  const handleCreate = async () => {
    if (!newKategori.nama_kategori || !newKategori.tipe_kategori)
      return alert("Nama & tipe wajib diisi");
    try {
      await axios.post("/api/kategori", newKategori);
      setNewKategori({ status: "aktif" });
      fetchKategori();
    } catch (err: unknown) {
      handleAxiosError(err, "Gagal tambah kategori");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Kategori</h1>

        {/* Create Form */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Nama kategori"
            value={newKategori.nama_kategori || ""}
            onChange={(e) => setNewKategori({ ...newKategori, nama_kategori: e.target.value })}
            className="border p-2 rounded w-48"
          />
          <select
            value={newKategori.tipe_kategori || ""}
            onChange={(e) =>
              setNewKategori({ ...newKategori, tipe_kategori: e.target.value as "produk" | "budaya" })
            }
            className="border p-2 rounded"
          >
            <option value="">--Tipe--</option>
            <option value="produk">Produk</option>
            <option value="budaya">Budaya</option>
          </select>
          <select
            value={newKategori.status}
            onChange={(e) =>
              setNewKategori({ ...newKategori, status: e.target.value as "aktif" | "nonaktif" })
            }
            className="border p-2 rounded"
          >
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
          <button
            onClick={handleCreate}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Tambah
          </button>
        </div>

        {/* Table List */}
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2 border">Nama</th>
              <th className="p-2 border">Tipe</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {kategoriList.map((kat) => (
              <tr key={kat._id}>
                <td className="p-2 border">
                  {editingId === kat._id ? (
                    <input
                      value={editData.nama_kategori}
                      onChange={(e) => setEditData({ ...editData, nama_kategori: e.target.value })}
                      className="border p-1 rounded w-full"
                    />
                  ) : (
                    kat.nama_kategori
                  )}
                </td>
                <td className="p-2 border">
                  {editingId === kat._id ? (
                    <select
                      value={editData.tipe_kategori}
                      onChange={(e) =>
                        setEditData({ ...editData, tipe_kategori: e.target.value as "produk" | "budaya" })
                      }
                      className="border p-1 rounded w-full"
                    >
                      <option value="produk">Produk</option>
                      <option value="budaya">Budaya</option>
                    </select>
                  ) : (
                    kat.tipe_kategori
                  )}
                </td>
                <td className="p-2 border">
                  {editingId === kat._id ? (
                    <select
                      value={editData.status}
                      onChange={(e) =>
                        setEditData({ ...editData, status: e.target.value as "aktif" | "nonaktif" })
                      }
                      className="border p-1 rounded w-full"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  ) : (
                    kat.status
                  )}
                </td>
                <td className="p-2 border text-center">
                  {editingId === kat._id ? (
                    <>
                      <button
                        onClick={() => handleSave(kat._id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded mr-2"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded"
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(kat)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(kat._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Hapus
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
};

export default KategoriList;
