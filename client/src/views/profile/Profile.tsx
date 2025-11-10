import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layout';

interface Pengguna {
  _id: string;
  nama_lengkap: string;
  email: string;
  no_telepon: string;
  foto_profil: string;
  role: string;
  status_akun: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  poin_game: number;
  level_user: number;
  email_verified: boolean;
}

interface ProfileUsaha {
  _id: string;
  nama_usaha: string;
  deskripsi_usaha: string;
  logo_usaha: string;
  status_verifikasi: string;
  rating_toko: number;
  jumlah_produk_terjual: number;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [pengguna, setPengguna] = useState<Pengguna | null>(null);
  const [profileUsaha, setProfileUsaha] = useState<ProfileUsaha | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    checkProfileUsaha();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      const res = await axios.get(`http://localhost:5000/api/pengguna/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPengguna(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      alert('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const checkProfileUsaha = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      const res = await axios.get(`http://localhost:5000/api/profile-usaha/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfileUsaha(res.data);
    } catch (err: any) {
      // 404 = belum punya usaha, itu normal
      if (err.response?.status !== 404) {
        console.error('Error fetching profile usaha:', err);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
      </Layout>
    );
  }

  if (!pengguna) {
    return (
      <Layout>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Profil tidak ditemukan</p>
        </div>
      </Layout>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'aktif': return '#4CAF50';
      case 'nonaktif': return '#999';
      case 'banned': return '#f44336';
      default: return '#999';
    }
  };

  const getVerifikasiBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#f44336';
      default: return '#999';
    }
  };

  return (
    <Layout>
      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Header Profile */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
            <div>
              {pengguna.foto_profil ? (
                <img 
                  src={pengguna.foto_profil} 
                  alt="Foto Profil"
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #ddd'
                  }}
                />
              ) : (
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  color: 'white'
                }}>
                  {pengguna.nama_lengkap.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: '0 0 10px 0' }}>{pengguna.nama_lengkap}</h1>
                  <p style={{ margin: '5px 0', color: '#666' }}>{pengguna.email}</p>
                  {pengguna.no_telepon && (
                    <p style={{ margin: '5px 0', color: '#666' }}>{pengguna.no_telepon}</p>
                  )}
                </div>
                
                <div>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: getStatusBadgeColor(pengguna.status_akun),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {pengguna.status_akun.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => navigate('/profile/edit')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  Edit Profil
                </button>
                
                <button
                  onClick={() => navigate('/alamat')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  Kelola Alamat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Detail */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0 }}>Informasi Detail</h2>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <strong>Role:</strong> 
              <span style={{ marginLeft: '10px', textTransform: 'capitalize' }}>
                {pengguna.role}
              </span>
            </div>
            
            {pengguna.tanggal_lahir && (
              <div>
                <strong>Tanggal Lahir:</strong>
                <span style={{ marginLeft: '10px' }}>
                  {new Date(pengguna.tanggal_lahir).toLocaleDateString('id-ID')}
                </span>
              </div>
            )}
            
            {pengguna.jenis_kelamin && (
              <div>
                <strong>Jenis Kelamin:</strong>
                <span style={{ marginLeft: '10px', textTransform: 'capitalize' }}>
                  {pengguna.jenis_kelamin}
                </span>
              </div>
            )}

            <div>
              <strong>Level:</strong>
              <span style={{ marginLeft: '10px' }}>
                Level {pengguna.level_user} ({pengguna.poin_game} poin)
              </span>
            </div>

            <div>
              <strong>Email Verified:</strong>
              <span style={{ marginLeft: '10px' }}>
                {pengguna.email_verified ? '✅ Terverifikasi' : '❌ Belum Terverifikasi'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Usaha */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0 }}>Profile Usaha</h2>
          
          {profileUsaha ? (
            <div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {profileUsaha.logo_usaha && (
                  <img 
                    src={profileUsaha.logo_usaha} 
                    alt="Logo Usaha"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  />
                )}
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{profileUsaha.nama_usaha}</h3>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: getVerifikasiBadgeColor(profileUsaha.status_verifikasi),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {profileUsaha.status_verifikasi.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ margin: '10px 0', color: '#666' }}>
                    {profileUsaha.deskripsi_usaha || 'Tidak ada deskripsi'}
                  </p>

                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '14px' }}>
                    <div>⭐ {profileUsaha.rating_toko.toFixed(1)}</div>
                    <div>📦 {profileUsaha.jumlah_produk_terjual} terjual</div>
                  </div>

                  <button
                    onClick={() => navigate('/profile/usaha')}
                    style={{
                      marginTop: '15px',
                      padding: '8px 16px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                  >
                    Lihat Detail Usaha
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#999', marginBottom: '20px' }}>
                Anda belum memiliki profile usaha
              </p>
              <button
                onClick={() => navigate('/profile/usaha')}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                Daftar Usaha Sekarang
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;