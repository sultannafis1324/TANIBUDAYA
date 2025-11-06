const chatAISchema = new mongoose.Schema({
  id_pengguna: { type: mongoose.Schema.Types.ObjectId, ref: 'Pengguna', required: true },
  session_id: { type: String },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  topik: { type: String },
  is_archived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ChatAI', chatAISchema);