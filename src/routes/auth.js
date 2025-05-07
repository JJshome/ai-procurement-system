/**
 * AI-Powered Procurement System (AIPS)
 * Authentication Routes
 * 
 * This file defines the authentication routes for the AIPS system.
 */

const express = require('express');
const router = express.Router();

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo credentials check - In production, this would use a proper authentication system
  if (email === 'demo@example.com' && password === 'AIprocurement2025') {
    // Create a session with user information
    req.session.user = {
      id: 'demo-user-001',
      email: email,
      name: 'Demo User',
      company: 'Demo Company',
      role: 'Procurement Manager',
      permissions: ['read', 'write', 'analyze', 'collaborate']
    };
    
    res.json({
      success: true,
      message: 'Login successful',
      user: req.session.user
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Check if user is authenticated
router.get('/check', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      success: true,
      authenticated: true,
      user: req.session.user
    });
  } else {
    res.json({
      success: true,
      authenticated: false
    });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    } else {
      res.json({
        success: true,
        message: 'Logout successful'
      });
    }
  });
});

// Register route (just for demo, would be more complex in production)
router.post('/register', (req, res) => {
  const { email, password, name, company } = req.body;
  
  // Validate input
  if (!email || !password || !name || !company) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // In a real application, we would validate and create a user in the database
  // For this demo, we'll just return a success message
  res.json({
    success: true,
    message: 'Registration successful. Please log in with your new credentials.',
    user: {
      email,
      name,
      company
    }
  });
});

// Password reset request
router.post('/password-reset/request', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  // In a real application, we would verify the email exists and send a reset link
  // For this demo, we just simulate success
  res.json({
    success: true,
    message: 'If an account exists with that email, a password reset link has been sent.'
  });
});

// Password reset verification
router.post('/password-reset/verify', (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Token and new password are required'
    });
  }
  
  // In a real application, we would verify the token and update the password
  // For this demo, we just simulate success
  res.json({
    success: true,
    message: 'Password has been reset successfully. Please log in with your new password.'
  });
});

module.exports = router;