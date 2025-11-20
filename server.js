// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();

// Middleware - MUST be before routes
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());  // This parses JSON request bodies

// Debug logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

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
    
    // Import routes AFTER Mongoose connects
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
    
    // API Documentation - Swagger UI
    try {
      const swaggerDocument = YAML.load(path.join(__dirname, '../docs/api/openapi.yaml'));
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: "CalZone API Documentation"
      }));
      console.log('📚 Swagger UI available at /api-docs');
    } catch (error) {
      console.error('⚠️  Failed to load Swagger documentation:', error.message);
    }
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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;