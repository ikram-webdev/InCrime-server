require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// 1. Connect to MongoDB (Error handling ke saath)
connectDB();

// 2. Middleware - CORS Fix
// CLIENT_URL mein https://in-crime.vercel.app/login nahi sirf domain hona chahiye
const allowedOrigin = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, "") : 'https://in-crime.vercel.app';

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ===================== ROUTES =====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/chatbot', require('./routes/chatbot'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'InCrime API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ===================== SEED ADMIN & DATA =====================
const seedData = async () => {
  try {
    const User = require('./models/User');
    const Category = require('./models/Category');

    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      // Password hashing check: Agar aapka User model password automatically hash nahi karta, 
      // toh yahan bcrypt use karna parega.
      await User.create({
        fullName: 'InCrime Admin',
        username: 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@incrime.pk',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role: 'admin',
      });
      console.log('✅ Admin user created');
    }

    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      await Category.insertMany([
        { name: 'Criminal Cases', slug: 'criminal-cases', type: 'criminal', description: 'Bail, theft, harassment and criminal applications', icon: '🔒', color: '#dc3545', order: 1 },
        { name: 'Family Cases', slug: 'family-cases', type: 'family', description: 'Nikah, custody, divorce and family applications', icon: '👨‍👩‍👧', color: '#28a745', order: 2 },
      ]);
      console.log('✅ Default categories seeded');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

// 3. Render Dynamic Port Fix
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`\n🚀 InCrime Server running on port ${PORT}`);
  // Database seed tabhi karein jab DB connect ho jaye
  await seedData();
});

module.exports = app;