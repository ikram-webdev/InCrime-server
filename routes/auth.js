const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, generateRefreshToken, protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, phone, password } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({ success: false, message: 'Full name, username, and password are required' });
    }

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone number is required' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    // Check email if provided
    if (email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
    }

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email: email ? email.toLowerCase() : undefined,
      phone: phone || undefined,
      password,
    });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Find by username or email
    const user = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route   POST /api/auth/forgot-password
// @desc    Send reset password token
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success even if not found (security)
      return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // In production, send email here with nodemailer
    // For now, return token in response (remove in production)
    res.json({
      success: true,
      message: 'Password reset link sent to email',
      resetToken: process.env.NODE_ENV === 'development' ? token : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Error sending reset email' });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Profile updated', user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

module.exports = router;
