const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Application = require('../models/Application');
const Contact = require('../models/Contact');
const Category = require('../models/Category');
const Template = require('../models/Template');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ===================== DASHBOARD STATS =====================
// @route   GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalApplications, totalTemplates, totalCategories, totalContacts, newContacts] =
      await Promise.all([
        User.countDocuments({ role: 'user' }),
        Application.countDocuments(),
        Template.countDocuments(),
        Category.countDocuments(),
        Contact.countDocuments(),
        Contact.countDocuments({ status: 'new' }),
      ]);

    const recentUsers = await User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5);
    const recentApplications = await Application.find()
      .populate('user', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(5);

    const applicationsByType = await Application.aggregate([
      { $group: { _id: '$categoryType', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalApplications,
        totalTemplates,
        totalCategories,
        totalContacts,
        newContacts,
      },
      recentUsers,
      recentApplications,
      applicationsByType,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

// ===================== USERS =====================
// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const filter = { role: 'user' };
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      users,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// @route   PUT /api/admin/users/:id/toggle
router.put('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot deactivate admin' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling user status' });
  }
});

// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin' });
    await User.findByIdAndDelete(req.params.id);
    await Application.deleteMany({ user: req.params.id });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// ===================== APPLICATION HISTORY =====================
// @route   GET /api/admin/applications
router.get('/applications', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = {};
    if (req.query.categoryType) filter.categoryType = req.query.categoryType;

    const total = await Application.countDocuments(filter);
    const applications = await Application.find(filter)
      .populate('user', 'fullName username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
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

// ===================== CONTACTS / REVIEWS =====================
// @route   GET /api/admin/contacts
router.get('/contacts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    const total = await Contact.countDocuments(filter);
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      contacts,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching contacts' });
  }
});

// @route   PUT /api/admin/contacts/:id/status
router.put('/contacts/:id/status', async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status, adminReply },
      { new: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating contact' });
  }
});

module.exports = router;
