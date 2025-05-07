/**
 * AI-Powered Procurement System (AIPS)
 * Main Application Entry Point
 * 
 * Based on Ucaretron Inc.'s patent technology for optimizing 
 * public procurement bidding processes through artificial intelligence.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');

// Import core modules
const { 
  DataCollectionModule,
  AIAnalysisModule,
  DocumentGenerationModule,
  BlockchainModule,
  CollaborationModule
} = require('./modules');

// Import API routes
const { apiRoutes, authRoutes, dashboardRoutes } = require('./routes');

// Initialize express application
const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'aips-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Initialize core modules
const dataCollection = new DataCollectionModule();
const aiAnalysis = new AIAnalysisModule();
const documentGeneration = new DocumentGenerationModule();
const blockchain = new BlockchainModule();
const collaboration = new CollaborationModule();

// Make modules available to routes
app.use((req, res, next) => {
  req.modules = {
    dataCollection,
    aiAnalysis,
    documentGeneration,
    blockchain,
    collaboration
  };
  next();
});

// Register API routes
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

// Serve the main application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 AIPS Server running on port ${PORT}`);
  console.log(`🤖 AI modules initialized and ready to optimize procurement processes`);
});

module.exports = app;