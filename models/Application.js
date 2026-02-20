const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  templateTitle: { type: String },
  templateSlug: { type: String },
  categoryType: { type: String },
  formData: { type: mongoose.Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['draft', 'generated', 'downloaded', 'submitted'],
    default: 'generated',
  },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

applicationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
