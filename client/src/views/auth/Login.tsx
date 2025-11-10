import { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login gagal");

      // ✅ PENTING: Simpan semua data yang diperlukan
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data._id); // ✅ INI YANG KURANG!
      localStorage.setItem("userType", data.tipe);
      localStorage.setItem(
        "userData",
        JSON.stringify({
          _id: data._id,
          nama: data.nama,
          email: data.email,
          role: data.role,
          tipe: data.tipe,
          foto_profil: data.foto_profil,
        })
      );

      console.log('✅ Login success - userId saved:', data._id); // Debug log

      setMessage(`✅ Selamat datang, ${data.nama}!`);

      setTimeout(() => {
        if (data.tipe === "admin") {
          window.location.href = "/admin/list";
        } else {
          window.location.href = "/profile";
        }
      }, 500);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Login gagal");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Login Universal</h2>

      {message && (
        <p
          style={{
            color: message.includes("Selamat") ? "green" : "red",
            padding: "10px",
            backgroundColor: message.includes("Selamat") ? "#d4edda" : "#f8d7da",
            border: `1px solid ${message.includes("Selamat") ? "#c3e6cb" : "#f5c6cb"}`,
            borderRadius: "4px",
          }}
        >
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
          disabled={loading || !email || !password}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
        Belum punya akun? <br />
        <button
          onClick={() => (window.location.href = "/register-pengguna")}
          style={{
            marginTop: "5px",
            padding: "6px 12px",
            border: "1px solid green",
            borderRadius: "4px",
            backgroundColor: "white",
            color: "green",
            cursor: "pointer",
          }}
        >
          Daftar Pengguna
        </button>
        <button
          onClick={() => (window.location.href = "/register-admin")}
          style={{
            marginTop: "5px",
            marginLeft: "10px",
            padding: "6px 12px",
            border: "1px solid purple",
            borderRadius: "4px",
            backgroundColor: "white",
            color: "purple",
            cursor: "pointer",
          }}
        >
          Daftar Admin
        </button>
      </div>
    </div>
  );
};

export default Login;