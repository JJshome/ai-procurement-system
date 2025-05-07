/**
 * AI-Powered Procurement System (AIPS)
 * Dashboard Routes
 * 
 * This file defines the dashboard-related routes for the AIPS system.
 */

const express = require('express');
const router = express.Router();

// Middleware to check if user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
};

// Apply authentication check to all dashboard routes
router.use(ensureAuthenticated);

// Get dashboard summary
router.get('/summary', (req, res) => {
  const { aiAnalysis, dataCollection } = req.modules;
  const userId = req.session.user.id;
  
  try {
    // Get active opportunities
    const activeOpportunities = dataCollection.getActiveOpportunities(userId);
    
    // Get recommendations
    const recommendations = aiAnalysis.getRecommendedOpportunities(userId);
    
    // Get analytics
    const analytics = aiAnalysis.getDashboardAnalytics(userId);
    
    // Get recent activities
    const recentActivities = dataCollection.getRecentActivities(userId);
    
    res.json({
      success: true,
      data: {
        activeOpportunities,
        recommendations,
        analytics,
        recentActivities
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get user performance metrics
router.get('/metrics', (req, res) => {
  const { aiAnalysis } = req.modules;
  const userId = req.session.user.id;
  const { period = 'month' } = req.query;
  
  try {
    const metrics = aiAnalysis.getUserPerformanceMetrics(userId, period);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get active bids
router.get('/bids', (req, res) => {
  const { dataCollection } = req.modules;
  const userId = req.session.user.id;
  const { status = 'all', page = 1, limit = 10 } = req.query;
  
  try {
    const bids = dataCollection.getUserBids(userId, status, page, limit);
    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get calendar events
router.get('/calendar', (req, res) => {
  const { dataCollection } = req.modules;
  const userId = req.session.user.id;
  const { start, end } = req.query;
  
  try {
    const events = dataCollection.getUserCalendarEvents(userId, start, end);
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get team activities
router.get('/team-activities', (req, res) => {
  const { dataCollection } = req.modules;
  const userId = req.session.user.id;
  const { page = 1, limit = 20 } = req.query;
  
  try {
    const teamActivities = dataCollection.getTeamActivities(userId, page, limit);
    res.json({
      success: true,
      data: teamActivities
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get notifications
router.get('/notifications', (req, res) => {
  const { dataCollection } = req.modules;
  const userId = req.session.user.id;
  const { unreadOnly = false } = req.query;
  
  try {
    const notifications = dataCollection.getUserNotifications(userId, unreadOnly);
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Mark notification as read
router.put('/notifications/:id', (req, res) => {
  const { dataCollection } = req.modules;
  const userId = req.session.user.id;
  const { id } = req.params;
  
  try {
    dataCollection.markNotificationRead(userId, id);
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get user settings
router.get('/settings', (req, res) => {
  const { dataCollection } = req.modules;
  const userId = req.session.user.id;
  
  try {
    const settings = dataCollection.getUserSettings(userId);
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update user settings
router.put('/settings', (req, res) => {
  const { dataCollection } = req.modules;
  const userId = req.session.user.id;
  const settings = req.body;
  
  try {
    const updatedSettings = dataCollection.updateUserSettings(userId, settings);
    res.json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;