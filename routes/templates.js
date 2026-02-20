const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/templates
// @desc    Get all active templates
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { categoryType } = req.query;
    const filter = { isActive: true };
    if (categoryType) filter.categoryType = categoryType;
    const templates = await Template.find(filter).populate('category', 'name type').sort({ categoryType: 1, title: 1 });
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching templates' });
  }
});

// @route   GET /api/templates/all (admin)
// @desc    Get all templates including inactive
// @access  Admin
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const templates = await Template.find().populate('category', 'name type').sort({ createdAt: -1 });
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching templates' });
  }
});

// @route   GET /api/templates/:slug
// @desc    Get template by slug
// @access  Private
router.get('/:slug', protect, async (req, res) => {
  try {
    const template = await Template.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name type');
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching template' });
  }
});

// @route   POST /api/templates
// @desc    Create template
// @access  Admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, slug, description, category, categoryType, fields, titleUrdu } = req.body;
    if (!title || !slug || !category) {
      return res.status(400).json({ success: false, message: 'Title, slug, and category are required' });
    }
    const existing = await Template.findOne({ slug });
    if (existing) return res.status(400).json({ success: false, message: 'Template with this slug already exists' });

    const template = await Template.create({
      title, titleUrdu, slug, description, category, categoryType, fields,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating template' });
  }
});

// @route   PUT /api/templates/:id
// @desc    Update template
// @access  Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('category', 'name type');
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating template' });
  }
});

// @route   DELETE /api/templates/:id
// @desc    Delete template
// @access  Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting template' });
  }
});

module.exports = router;
