const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');
const { protect } = require('../middleware/auth');

// @route   POST /api/contact
// @desc    Submit contact/review form
// @access  Public (but user id attached if logged in)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, type, rating } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, subject and message are required' });
    }

    const contact = await Contact.create({
      name, email, phone, subject, message, type: type || 'contact', rating,
    });

    // Send email notification to admin (requires valid email config)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_email_password_here') {
      try {
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `InCrime - New ${type || 'Contact'}: ${subject}`,
          html: `
            <h2>New ${type || 'Contact'} from InCrime</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong> ${message}</p>
            ${rating ? `<p><strong>Rating:</strong> ${'⭐'.repeat(rating)}</p>` : ''}
          `,
        });
      } catch (emailErr) {
        console.warn('Email sending failed:', emailErr.message);
      }
    }

    res.status(201).json({ success: true, message: 'Your message has been received. We will get back to you soon.' });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ success: false, message: 'Error submitting contact' });
  }
});

module.exports = router;
