/**
 * AI-Powered Procurement System (AIPS)
 * Routes Index
 * 
 * This file exports all routes for the AIPS system.
 */

const apiRoutes = require('./api');
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');

module.exports = {
  apiRoutes,
  authRoutes,
  dashboardRoutes
};