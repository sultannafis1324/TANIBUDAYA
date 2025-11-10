import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Layout from "../../components/Layout";

interface Produk {
  _id: string;
  nama_produk: string;
  slug: string;
  harga: number;
  media: { url: string; type: string }[];
  kategori: { nama_kategori: string };
  stok: number;
  jumlah_terjual: number;
}

const Marketplace: React.FC = () => {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("terbaru");

  useEffect(() => {
    fetchProduk();
  }, [sort]);

  const fetchProduk = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/marketplace/public?sort=${sort}`
      );
      // Pastikan res.data selalu array
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setProduk(data);
    } catch (error) {
      console.error("Error fetching produk:", error);
      setProduk([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.get(
        `http://localhost:5000/api/marketplace/public?search=${search}&sort=${sort}`
      );
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setProduk(data);
    } catch (error) {
      console.error("Error searching:", error);
      setProduk([]);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Loading Marketplace...</div>;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Marketplace TaniBudaya</h1>

          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border rounded"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Cari
              </button>
            </form>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2 border rounded"
            >
              <option value="terbaru">Terbaru</option>
              <option value="termurah">Termurah</option>
              <option value="termahal">Termahal</option>
              <option value="terlaris">Terlaris</option>
            </select>
          </div>

          {/* Produk Grid */}
          {produk.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {produk.map((item) => (
                <Link
                  key={item._id}
                  to={`/produk/${item.slug}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition"
                >
                  <img
                    src={item.media[0]?.url || "https://via.placeholder.com/300"}
                    alt={item.nama_produk}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">
                      {item.nama_produk}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.kategori.nama_kategori}
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      Rp {item.harga.toLocaleString("id-ID")}
                    </p>
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>Stok: {item.stok}</span>
                      <span>Terjual: {item.jumlah_terjual}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Tidak ada produk ditemukan
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Marketplace;
