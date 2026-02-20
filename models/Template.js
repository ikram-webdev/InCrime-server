const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  titleUrdu: { type: String, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  categoryType: { type: String, enum: ['criminal', 'family', 'civil', 'other'], default: 'other' },
  fields: [
    {
      id: { type: String, required: true },
      label: { type: String, required: true },
      labelUrdu: { type: String },
      type: { type: String, enum: ['text', 'textarea', 'date', 'select', 'number'], default: 'text' },
      required: { type: Boolean, default: false },
      rows: { type: Number },
      options: [{ value: String, label: String }],
    },
  ],
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

templateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Template', templateSchema);
