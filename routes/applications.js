const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Template = require('../models/Template');
const { protect } = require('../middleware/auth');

// @route   POST /api/applications
// @desc    Save application history
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { templateSlug, templateTitle, categoryType, formData } = req.body;

    const application = await Application.create({
      user: req.user._id,
      templateSlug,
      templateTitle,
      categoryType,
      formData,
      status: 'generated',
      ipAddress: req.ip,
    });

    // Increment template usage count
    if (templateSlug) {
      await Template.findOneAndUpdate({ slug: templateSlug }, { $inc: { usageCount: 1 } });
    }

    res.status(201).json({ success: true, application });
  } catch (error) {
    console.error('Save application error:', error);
    res.status(500).json({ success: false, message: 'Error saving application' });
  }
});

// @route   GET /api/applications/my
// @desc    Get current user's application history
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Application.countDocuments({ user: req.user._id });
    const applications = await Application.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      applications,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching applications' });
  }
});

// @route   PUT /api/applications/:id/status
// @desc    Update application status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status },
      { new: true }
    );
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating application' });
  }
});

module.exports = router;
