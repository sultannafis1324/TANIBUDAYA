import { useState } from "react";
import { registerPengguna } from "../../api/auth";
import { useNavigate } from "react-router-dom";

const RegisterPengguna = () => {
  const [nama, setNama] = useState("");
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
      await registerPengguna({ nama_lengkap: nama, email, password });
      setMessage("✅ Registrasi berhasil! Mengarahkan ke login...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Registrasi gagal");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Register Pengguna</h2>

      {message && (
        <p
          style={{
            color: message.includes("berhasil") ? "green" : "red",
            padding: "10px",
            backgroundColor: message.includes("berhasil") ? "#d4edda" : "#f8d7da",
            border: `1px solid ${message.includes("berhasil") ? "#c3e6cb" : "#f5c6cb"}`,
            borderRadius: "4px",
            marginBottom: "15px",
            textAlign: "center",
          }}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="Nama Lengkap"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
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
              borderRadius: "4px",
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
              borderRadius: "4px",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !nama || !email || !password}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            backgroundColor: loading ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading..." : "Register"}
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
        Sudah punya akun?{" "}
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "5px 10px",
            border: "1px solid #007bff",
            borderRadius: "4px",
            backgroundColor: "white",
            color: "#007bff",
            cursor: "pointer",
            marginLeft: "5px",
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default RegisterPengguna;
