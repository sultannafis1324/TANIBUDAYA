import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
dotenv.config();

// 🔹 Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// 🔹 Storage untuk multer (otomatis upload ke Cloudinary)
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Deteksi tipe file
    const isVideo = file.mimetype.startsWith('video/');
    const isAudio = file.mimetype.startsWith('audio/');
    
    return {
      folder: "tanibudaya/konten_budaya",
      resource_type: isVideo ? "video" : isAudio ? "video" : "image", // Audio juga pakai 'video' di Cloudinary
      allowed_formats: isVideo 
        ? ["mp4", "avi", "mov", "mkv", "webm"] 
        : isAudio
        ? ["mp3", "wav", "ogg", "m4a", "aac"]
        : ["jpg", "jpeg", "png", "gif", "webp"],
      // Transformation (optional)
      ...(isVideo && {
        eager: [{ quality: "auto" }],
        eager_async: true,
      })
    };
  },
});

// 🔹 Middleware upload pakai multer
export const uploadMiddleware = multer({ 
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024 // Max 100MB (untuk video/audio)
  },
  fileFilter: (req, file, cb) => {
    // Validasi tipe file
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Hanya gambar, video, dan audio yang diperbolehkan.'));
    }
  }
});

// 🔹 Export cloudinary instance
export { cloudinary };