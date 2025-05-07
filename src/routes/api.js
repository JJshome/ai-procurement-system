/**
 * AI-Powered Procurement System (AIPS)
 * API Routes
 * 
 * This file defines the main API routes for the AIPS system.
 */

const express = require('express');
const router = express.Router();

// Opportunity routes
router.get('/opportunities', (req, res) => {
  const { dataCollection } = req.modules;
  const { query, page = 1, limit = 10, sortBy = 'releaseDate', sortOrder = 'desc' } = req.query;
  
  try {
    const opportunities = dataCollection.searchOpportunities(query, page, limit, sortBy, sortOrder);
    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/opportunities/:id', (req, res) => {
  const { dataCollection } = req.modules;
  const { id } = req.params;
  
  try {
    const opportunity = dataCollection.getOpportunityDetails(id);
    res.json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: `Opportunity with ID ${id} not found`
    });
  }
});

// Analysis routes
router.post('/analyze/opportunity', (req, res) => {
  const { aiAnalysis } = req.modules;
  const { opportunityId, companyProfile } = req.body;
  
  try {
    const analysis = aiAnalysis.analyzeOpportunity(opportunityId, companyProfile);
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/analyze/predict-success', (req, res) => {
  const { aiAnalysis } = req.modules;
  const { opportunityData, companyData, proposalData } = req.body;
  
  try {
    const prediction = aiAnalysis.predictSuccessProbability(opportunityData, companyData, proposalData);
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Document generation routes
router.post('/documents/generate', (req, res) => {
  const { documentGeneration } = req.modules;
  const { opportunityId, documentType, parameters } = req.body;
  
  try {
    const document = documentGeneration.generateDocument(opportunityId, documentType, parameters);
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/documents/:id', (req, res) => {
  const { documentGeneration } = req.modules;
  const { id } = req.params;
  
  try {
    const document = documentGeneration.getDocument(id);
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: `Document with ID ${id} not found`
    });
  }
});

// Blockchain routes
router.post('/blockchain/store', (req, res) => {
  const { blockchain } = req.modules;
  const { data, type } = req.body;
  
  try {
    const result = blockchain.storeData(data, type);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/blockchain/verify/:id', (req, res) => {
  const { blockchain } = req.modules;
  const { id } = req.params;
  
  try {
    const result = blockchain.verifyData(id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Collaboration routes
router.post('/collaboration/session', (req, res) => {
  const { collaboration } = req.modules;
  const { documentId, users } = req.body;
  
  try {
    const session = collaboration.createSession(documentId, users);
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/collaboration/sessions', (req, res) => {
  const { collaboration } = req.modules;
  const { userId } = req.query;
  
  try {
    const sessions = collaboration.getUserSessions(userId);
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Company profile routes
router.get('/company/profile/:id', (req, res) => {
  const { dataCollection } = req.modules;
  const { id } = req.params;
  
  try {
    const profile = dataCollection.getCompanyProfile(id);
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: `Company profile with ID ${id} not found`
    });
  }
});

router.post('/company/profile', (req, res) => {
  const { dataCollection } = req.modules;
  const profileData = req.body;
  
  try {
    const profile = dataCollection.saveCompanyProfile(profileData);
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;