import { useState, useEffect } from "react";
import Layout from "../../components/Layout";

interface Notifikasi {
  _id: string;
  judul: string;
  pesan: string;
  tipe: string;
  is_read: boolean;
  createdAt: string;
}

const Notifikasi = () => {
  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Ganti endpoint ini nanti ke backend lu
    fetch("http://localhost:5000/api/notifikasi")
      .then((res) => res.json())
      .then((data) => {
        setNotifikasi(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleMarkAllRead = () => {
    setNotifikasi((prev) =>
      prev.map((n) => ({
        ...n,
        is_read: true,
      }))
    );
    // TODO: panggil API PATCH read-all
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  return (
    <Layout>
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Notifikasi</h2>
        <button onClick={handleMarkAllRead}>Tandai Semua Terbaca</button>
      </div>

      {notifikasi.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: 30 }}>Belum ada notifikasi</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
          {notifikasi.map((item) => (
            <li
              key={item._id}
              style={{
                background: item.is_read ? "#f5f5f5" : "#e8f0fe",
                padding: "15px 20px",
                borderRadius: 10,
                marginBottom: 10,
                cursor: "pointer",
              }}
            >
              <h4 style={{ margin: 0 }}>{item.judul}</h4>
              <p style={{ margin: "5px 0" }}>{item.pesan}</p>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
    </Layout>
  );
};

export default Notifikasi;
