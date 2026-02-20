require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger (development)
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
  const User = require('./models/User');
  const Category = require('./models/Category');

  try {
    // Create admin if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        fullName: 'InCrime Admin',
        username: 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@incrime.pk',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role: 'admin',
      });
      console.log('✅ Admin user created: admin / Admin@123456');
    }

    // Seed default categories
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`\n🚀 InCrime Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🌐 Client: ${process.env.CLIENT_URL}\n`);
  await seedData();
});

module.exports = app;
