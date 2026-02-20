const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, trim: true },
  type: { type: String, enum: ['criminal', 'family', 'civil', 'other'], default: 'other' },
  icon: { type: String, default: '⚖️' },
  color: { type: String, default: '#0d2a3a' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

categorySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Category', categorySchema);
