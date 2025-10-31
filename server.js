// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI validation
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌ Missing MONGO_URI in .env');
  process.exit(1);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Connect with Mongoose
mongoose.connect(uri, { dbName: 'COP4331Cards' })
  .then(() => {
    console.log('✅ MongoDB connected (Mongoose)');
    
    // Import routes AFTER Mongoose connects (models are globally registered)
    const userRoutes = require('./backend/routes/userRoutes');
    const foodRoutes = require('./backend/routes/foodRoutes');
    const dayRoutes = require('./backend/routes/dayRoutes');
    const entryRoutes = require('./backend/routes/entryRoutes');
    
    // Mount routes
    app.use('/api', userRoutes);
    app.use('/api', foodRoutes);
    app.use('/api', dayRoutes);
    app.use('/api', entryRoutes);
    
    console.log('✅ Routes loaded');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;