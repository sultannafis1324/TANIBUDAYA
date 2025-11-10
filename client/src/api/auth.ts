import axios from "axios";

const API_URL = "http://localhost:5000/api/auth"; // sesuaikan port backend

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterPenggunaData {
  nama_lengkap: string;
  email: string;
  password: string;
}

export interface RegisterAdminData {
  nama: string;
  email: string;
  password: string;
  role?: "super_admin" | "moderator";
}

export const login = async (data: LoginData) => {
  const res = await axios.post(`${API_URL}/login`, data);
  return res.data;
};

export const registerPengguna = async (data: RegisterPenggunaData) => {
  const res = await axios.post(`${API_URL}/register-pengguna`, data);
  return res.data;
};

export const registerAdmin = async (data: RegisterAdminData) => {
  const res = await axios.post(`${API_URL}/register-admin`, data);
  return res.data;
};
