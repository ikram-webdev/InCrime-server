const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Get all active categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
});

// @route   POST /api/categories
// @desc    Create category
// @access  Admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, type, description, icon, color, order } = req.body;
    if (!name || !type) return res.status(400).json({ success: false, message: 'Name and type are required' });

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await Category.findOne({ slug });
    if (existing) return res.status(400).json({ success: false, message: 'Category with this name already exists' });

    const category = await Category.create({ name, slug, type, description, icon, color, order });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating category' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating category' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting category' });
  }
});

module.exports = router;
