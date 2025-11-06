const provinsiSchema = new mongoose.Schema({
  nama_provinsi: { type: String, required: true },
  kode_provinsi: { type: String },
  pulau: { type: String },
  ibu_kota: { type: String },
  koordinat: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  gambar_peta: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Provinsi', provinsiSchema);