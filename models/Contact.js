const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: ['contact', 'review', 'complaint', 'suggestion'], default: 'contact' },
  rating: { type: Number, min: 1, max: 5 },
  status: { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new' },
  adminReply: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Contact', contactSchema);
