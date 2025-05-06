/**
 * AI Analysis Module
 * 
 * This module processes collected procurement data using machine learning algorithms
 * to predict success rates, analyze optimal bidding strategies, and provide
 * actionable insights for procurement opportunities.
 * 
 * Features:
 * - Bid success probability prediction
 * - Optimal pricing strategy recommendation
 * - Competitive landscape analysis
 * - Opportunity suitability scoring
 * - Strategic advantage identification
 */

const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const { XGBoost } = require('ml-xgboost');
const logger = require('../utils/logger');

class AIAnalysisModule {
  constructor() {
    // Initialize models
    this.models = {
      successPrediction: null,
      pricingOptimizer: null,
      competitorAnalysis: null
    };
    
    // Initialize NLP tools
    this.tfidf = new natural.TfIdf();
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    
    // Model configuration
    this.modelConfig = {
      epochs: 100,
      batchSize: 32,
      learningRate: 0.001,
      validationSplit: 0.2
    };
    
    // Feature importance cache
    this.featureImportance = {};
    
    // Initialize module
    this.initialize();
    
    logger.info('AI Analysis Module initialized');
  }
  
  /**
   * Initialize the module and load pre-trained models
   */
  async initialize() {
    try {
      // Load success prediction model
      this.models.successPrediction = await this.loadSuccessPredictionModel();
      
      // Load pricing optimizer model
      this.models.pricingOptimizer = await this.loadPricingOptimizerModel();
      
      // Load competitor analysis model
      this.models.competitorAnalysis = await this.loadCompetitorAnalysisModel();
      
      logger.info('AI models loaded successfully');
    } catch (error) {
      logger.error('Error initializing AI models:', error);
      // Fallback to default models
      this.initializeDefaultModels();
    }
  }
  
  /**
   * Analyze an opportunity and predict success probability and optimal strategy
   * @param {Object} opportunity - The opportunity to analyze
   * @param {Object} companyProfile - The company profile
   * @param {Array} pastBids - Historical bid data
   * @returns {Object} - Analysis results
   */
  async analyzeOpportunity(opportunity, companyProfile, pastBids = []) {
    logger.info(`Analyzing opportunity: ${opportunity.id}`);
    
    try {
      // Extract features for machine learning models
      const features = await this.extractFeatures(opportunity, companyProfile, pastBids);
      
      // Predict success probability
      const successProbability = await this.predictSuccessProbability(features);
      
      // Recommend optimal bidding strategy
      const pricingStrategy = await this.recommendPricingStrategy(features, opportunity, companyProfile);
      
      // Analyze competitive landscape
      const competitiveAnalysis = await this.analyzeCompetitivePositioning(features, opportunity);
      
      // Calculate opportunity suitability score
      const suitabilityScore = this.calculateSuitabilityScore(features, companyProfile);
      
      // Identify strategic advantages
      const strategicAdvantages = this.identifyStrategicAdvantages(features, companyProfile, opportunity);
      
      // Generate key insights
      const insights = this.generateActionableInsights(
        opportunity, 
        successProbability, 
        pricingStrategy, 
        competitiveAnalysis, 
        pastBids
      );
      
      return {
        opportunityId: opportunity.id,
        successProbability,
        pricingStrategy,
        competitiveAnalysis,
        suitabilityScore,
        strategicAdvantages,
        insights,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error analyzing opportunity ${opportunity.id}:`, error);
      throw new Error('Failed to analyze opportunity');
    }
  }
  
  /**
   * Batch analyze multiple opportunities to find the best matches
   * @param {Array} opportunities - List of opportunities
   * @param {Object} companyProfile - Company profile data
   * @param {Array} pastBids - Historical bid data
   * @returns {Array} - Ranked opportunities with analysis
   */
  async batchAnalyzeOpportunities(opportunities, companyProfile, pastBids = []) {
    logger.info(`Batch analyzing ${opportunities.length} opportunities`);
    
    try {
      const analysisPromises = opportunities.map(opp => 
        this.analyzeOpportunity(opp, companyProfile, pastBids)
      );
      
      const analysisResults = await Promise.allSettled(analysisPromises);
      
      const successfulAnalyses = analysisResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      // Sort opportunities by combination of success probability and suitability
      const sortedOpportunities = successfulAnalyses.sort((a, b) => {
        const scoreA = (a.successProbability * 0.7) + (a.suitabilityScore * 0.3);
        const scoreB = (b.successProbability * 0.7) + (b.suitabilityScore * 0.3);
        return scoreB - scoreA; // Descending order
      });
      
      return sortedOpportunities;
    } catch (error) {
      logger.error('Error in batch analysis:', error);
      throw new Error('Failed to batch analyze opportunities');
    }
  }
  
  /**
   * Extract features from an opportunity for model input
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @param {Array} pastBids - Historical bid data
   * @returns {Object} - Extracted features
   */
  async extractFeatures(opportunity, companyProfile, pastBids) {
    // Extract numerical features
    const numericalFeatures = this.extractNumericalFeatures(opportunity, companyProfile, pastBids);
    
    // Extract text features using NLP
    const textFeatures = await this.extractTextFeatures(opportunity, companyProfile);
    
    // Extract categorical features
    const categoricalFeatures = this.extractCategoricalFeatures(opportunity, companyProfile);
    
    // Extract temporal features
    const temporalFeatures = this.extractTemporalFeatures(opportunity, pastBids);
    
    // Calculate company-opportunity match features
    const matchFeatures = this.calculateMatchFeatures(opportunity, companyProfile);
    
    return {
      ...numericalFeatures,
      ...textFeatures,
      ...categoricalFeatures,
      ...temporalFeatures,
      ...matchFeatures
    };
  }
  
  /**
   * Predict the probability of bid success
   * @param {Object} features - Extracted features
   * @returns {number} - Success probability (0-1)
   */
  async predictSuccessProbability(features) {
    try {
      // Convert features to model input format
      const modelInput = this.prepareModelInput(features, 'successPrediction');
      
      // Make prediction using TensorFlow model
      let successProbability;
      
      if (this.models.successPrediction) {
        const tensor = tf.tensor2d([modelInput]);
        const prediction = this.models.successPrediction.predict(tensor);
        successProbability = (await prediction.data())[0];
        tensor.dispose();
        prediction.dispose();
      } else {
        // Fallback to simple heuristic model if main model not available
        successProbability = this.heuristicSuccessPrediction(features);
      }
      
      // Ensure probability is in valid range
      return Math.max(0, Math.min(1, successProbability));
    } catch (error) {
      logger.error('Error predicting success probability:', error);
      // Fallback to default prediction
      return 0.5;
    }
  }
  
  /**
   * Recommend optimal pricing strategy
   * @param {Object} features - Extracted features
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {Object} - Pricing strategy recommendations
   */
  async recommendPricingStrategy(features, opportunity, companyProfile) {
    try {
      // Convert features to model input
      const modelInput = this.prepareModelInput(features, 'pricingOptimizer');
      
      let pricingResults;
      
      if (this.models.pricingOptimizer) {
        // Use pricing optimizer model
        const tensor = tf.tensor2d([modelInput]);
        const prediction = this.models.pricingOptimizer.predict(tensor);
        const pricingFactors = await prediction.data();
        
        // Calculate optimal bid price based on prediction
        pricingResults = this.calculateOptimalBidPrice(
          pricingFactors, 
          opportunity, 
          companyProfile
        );
        
        tensor.dispose();
        prediction.dispose();
      } else {
        // Fallback to heuristic pricing model
        pricingResults = this.heuristicPricingStrategy(features, opportunity, companyProfile);
      }
      
      return {
        recommendedBidPrice: pricingResults.recommendedBidPrice,
        priceRange: {
          min: pricingResults.minPrice,
          max: pricingResults.maxPrice
        },
        confidenceLevel: pricingResults.confidenceLevel,
        pricingFactors: pricingResults.factors,
        competitivePositioning: pricingResults.competitivePositioning
      };
    } catch (error) {
      logger.error('Error recommending pricing strategy:', error);
      // Return default pricing strategy
      return {
        recommendedBidPrice: opportunity.value || 0,
        priceRange: {
          min: (opportunity.value || 0) * 0.9,
          max: (opportunity.value || 0) * 1.1
        },
        confidenceLevel: 'low',
        pricingFactors: [],
        competitivePositioning: 'unknown'
      };
    }
  }
  
  /**
   * Analyze competitive positioning for an opportunity
   * @param {Object} features - Extracted features
   * @param {Object} opportunity - Opportunity data
   * @returns {Object} - Competitive analysis results
   */
  async analyzeCompetitivePositioning(features, opportunity) {
    try {
      const modelInput = this.prepareModelInput(features, 'competitorAnalysis');
      
      let competitiveAnalysis;
      
      if (this.models.competitorAnalysis) {
        // Use competitive analysis model
        const tensor = tf.tensor2d([modelInput]);
        const prediction = this.models.competitorAnalysis.predict(tensor);
        const competitiveFactors = await prediction.data();
        
        competitiveAnalysis = this.interpretCompetitiveFactors(
          competitiveFactors, 
          opportunity
        );
        
        tensor.dispose();
        prediction.dispose();
      } else {
        // Fallback to heuristic competitive analysis
        competitiveAnalysis = this.heuristicCompetitiveAnalysis(features, opportunity);
      }
      
      return competitiveAnalysis;
    } catch (error) {
      logger.error('Error analyzing competitive positioning:', error);
      // Return default competitive analysis
      return {
        estimatedCompetitors: 'unknown',
        competitiveDynamics: 'unknown',
        marketPosition: 'unknown',
        estimatedWinRate: 0.5,
        competitiveAdvantages: [],
        competitiveRisks: []
      };
    }
  }
  
  /**
   * Calculate opportunity suitability score for company
   * @param {Object} features - Extracted features
   * @param {Object} companyProfile - Company profile
   * @returns {number} - Suitability score (0-1)
   */
  calculateSuitabilityScore(features, companyProfile) {
    try {
      // Define importance weights for different feature groups
      const weights = {
        categoryMatch: 0.25,
        capabilityMatch: 0.20,
        pastPerformance: 0.20,
        valueMatch: 0.15,
        locationMatch: 0.10,
        timelineMatch: 0.10
      };
      
      // Calculate individual component scores
      const categoryMatchScore = this.calculateCategoryMatchScore(features, companyProfile);
      const capabilityMatchScore = this.calculateCapabilityMatchScore(features, companyProfile);
      const pastPerformanceScore = this.calculatePastPerformanceScore(features, companyProfile);
      const valueMatchScore = this.calculateValueMatchScore(features, companyProfile);
      const locationMatchScore = this.calculateLocationMatchScore(features, companyProfile);
      const timelineMatchScore = this.calculateTimelineMatchScore(features, companyProfile);
      
      // Calculate weighted average
      const suitabilityScore = 
        (categoryMatchScore * weights.categoryMatch) +
        (capabilityMatchScore * weights.capabilityMatch) +
        (pastPerformanceScore * weights.pastPerformance) +
        (valueMatchScore * weights.valueMatch) +
        (locationMatchScore * weights.locationMatch) +
        (timelineMatchScore * weights.timelineMatch);
      
      // Ensure score is in valid range
      return Math.max(0, Math.min(1, suitabilityScore));
    } catch (error) {
      logger.error('Error calculating suitability score:', error);
      return 0.5; // Default middle score
    }
  }
  
  /**
   * Identify strategic advantages for a company on this opportunity
   * @param {Object} features - Extracted features
   * @param {Object} companyProfile - Company profile
   * @param {Object} opportunity - Opportunity data
   * @returns {Array} - Strategic advantages
   */
  identifyStrategicAdvantages(features, companyProfile, opportunity) {
    const advantages = [];
    
    try {
      // Check for category expertise
      if (this.hasCategoryExpertise(companyProfile, opportunity.category)) {
        advantages.push({
          type: 'expertise',
          description: 'Strong expertise in this procurement category',
          impact: 'high'
        });
      }
      
      // Check for past performance with agency
      if (this.hasPastPerformanceWithAgency(companyProfile, opportunity.agency)) {
        advantages.push({
          type: 'relationship',
          description: 'Existing relationship with the contracting agency',
          impact: 'high'
        });
      }
      
      // Check for geographic advantage
      if (this.hasGeographicAdvantage(companyProfile, opportunity.location)) {
        advantages.push({
          type: 'location',
          description: 'Strategic geographic positioning for this opportunity',
          impact: 'medium'
        });
      }
      
      // Check for unique capabilities
      const uniqueCapabilities = this.identifyUniqueCapabilities(companyProfile, features);
      if (uniqueCapabilities.length > 0) {
        advantages.push({
          type: 'capabilities',
          description: 'Unique capabilities that differentiate from competitors',
          details: uniqueCapabilities,
          impact: 'high'
        });
      }
      
      // Check for cost advantages
      if (this.hasCostAdvantage(companyProfile, features)) {
        advantages.push({
          type: 'cost',
          description: 'Cost structure advantage over likely competitors',
          impact: 'medium'
        });
      }
      
      // Check for innovation advantage
      if (this.hasInnovationAdvantage(companyProfile, opportunity)) {
        advantages.push({
          type: 'innovation',
          description: 'Innovative approaches or technologies relevant to this opportunity',
          impact: 'high'
        });
      }
      
      return advantages;
    } catch (error) {
      logger.error('Error identifying strategic advantages:', error);
      return [];
    }
  }
  
  /**
   * Generate actionable insights based on analysis
   * @param {Object} opportunity - Opportunity data
   * @param {number} successProbability - Predicted success probability
   * @param {Object} pricingStrategy - Pricing strategy
   * @param {Object} competitiveAnalysis - Competitive analysis
   * @param {Array} pastBids - Historical bid data
   * @returns {Array} - Actionable insights
   */
  generateActionableInsights(
    opportunity, 
    successProbability, 
    pricingStrategy, 
    competitiveAnalysis, 
    pastBids
  ) {
    const insights = [];
    
    try {
      // Success probability insights
      if (successProbability > 0.7) {
        insights.push({
          type: 'success_probability',
          title: 'High Win Probability',
          description: 'This opportunity has a high likelihood of success and should be prioritized.',
          actionItems: [
            'Allocate premium resources to this bid',
            'Consider strategic pricing for long-term relationship'
          ]
        });
      } else if (successProbability < 0.3) {
        insights.push({
          type: 'success_probability',
          title: 'Low Win Probability',
          description: 'This opportunity has significant challenges for successful bidding.',
          actionItems: [
            'Consider whether to pursue this opportunity',
            'If pursuing, highlight unique differentiators',
            'Consider partnership to strengthen proposal'
          ]
        });
      }
      
      // Pricing insights
      if (pricingStrategy.confidenceLevel === 'high') {
        insights.push({
          type: 'pricing',
          title: 'Optimal Pricing Strategy',
          description: `The recommended bid price of ${pricingStrategy.recommendedBidPrice} is based on high-confidence analysis.`,
          actionItems: [
            'Use the recommended pricing structure',
            'Emphasize value proposition to justify pricing'
          ]
        });
      }
      
      // Competitive insights
      if (competitiveAnalysis.estimatedCompetitors === 'high') {
        insights.push({
          type: 'competitive',
          title: 'High Competition Expected',
          description: 'This opportunity is likely to attract numerous competitors.',
          actionItems: [
            'Focus on unique differentiators',
            'Consider more aggressive pricing',
            'Emphasize past performance and expertise'
          ]
        });
      }
      
      // Past performance insights
      const relevantPastBids = this.findRelevantPastBids(opportunity, pastBids);
      if (relevantPastBids.length > 0) {
        const successfulBids = relevantPastBids.filter(bid => bid.outcome === 'won');
        if (successfulBids.length > 0) {
          insights.push({
            type: 'past_performance',
            title: 'Leverage Past Success',
            description: 'Your company has won similar bids in the past.',
            actionItems: [
              'Reference specific past performance in proposal',
              'Highlight team members involved in successful projects',
              'Use similar pricing strategy to past successful bids'
            ]
          });
        }
      }
      
      // Timeline insights
      const deadlineDate = new Date(opportunity.closeDate);
      const currentDate = new Date();
      const daysToDeadline = Math.ceil((deadlineDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (daysToDeadline < 14) {
        insights.push({
          type: 'timeline',
          title: 'Tight Deadline',
          description: `Only ${daysToDeadline} days remaining until proposal deadline.`,
          actionItems: [
            'Create accelerated bid development schedule',
            'Focus on key requirements and strengths',
            'Consider additional resources to meet deadline'
          ]
        });
      }
      
      return insights;
    } catch (error) {
      logger.error('Error generating actionable insights:', error);
      return [];
    }
  }
  
  /**
   * Load pre-trained success prediction model
   * @returns {tf.LayersModel} - TensorFlow model
   */
  async loadSuccessPredictionModel() {
    try {
      const modelPath = `file://${process.env.MODEL_DIR}/success_prediction_model`;
      return await tf.loadLayersModel(modelPath);
    } catch (error) {
      logger.error('Failed to load success prediction model:', error);
      return null;
    }
  }
  
  /**
   * Load pre-trained pricing optimizer model
   * @returns {tf.LayersModel} - TensorFlow model
   */
  async loadPricingOptimizerModel() {
    try {
      const modelPath = `file://${process.env.MODEL_DIR}/pricing_optimizer_model`;
      return await tf.loadLayersModel(modelPath);
    } catch (error) {
      logger.error('Failed to load pricing optimizer model:', error);
      return null;
    }
  }
  
  /**
   * Load pre-trained competitor analysis model
   * @returns {tf.LayersModel} - TensorFlow model
   */
  async loadCompetitorAnalysisModel() {
    try {
      const modelPath = `file://${process.env.MODEL_DIR}/competitor_analysis_model`;
      return await tf.loadLayersModel(modelPath);
    } catch (error) {
      logger.error('Failed to load competitor analysis model:', error);
      return null;
    }
  }
  
  /**
   * Initialize default models when pre-trained models are unavailable
   */
  initializeDefaultModels() {
    logger.info('Initializing default AI models');
    
    // Simple success prediction model
    this.models.successPrediction = this.createDefaultSuccessPredictionModel();
    
    // Simple pricing optimizer model
    this.models.pricingOptimizer = this.createDefaultPricingOptimizerModel();
    
    // Simple competitor analysis model
    this.models.competitorAnalysis = this.createDefaultCompetitorAnalysisModel();
  }
  
  // Helper methods (implementation details)
  
  /**
   * Create a default success prediction model
   * @returns {tf.LayersModel} - Simple TensorFlow model
   */
  createDefaultSuccessPredictionModel() {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      inputShape: [20], // Simplified input shape
      units: 16,
      activation: 'relu',
      kernelInitializer: 'varianceScaling'
    }));
    
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));
    
    model.compile({
      optimizer: tf.train.adam(),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }
  
  /**
   * Create a default pricing optimizer model
   * @returns {tf.LayersModel} - Simple TensorFlow model
   */
  createDefaultPricingOptimizerModel() {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      inputShape: [20], // Simplified input shape
      units: 16,
      activation: 'relu',
      kernelInitializer: 'varianceScaling'
    }));
    
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 5, // Output factors for pricing
      activation: 'linear'
    }));
    
    model.compile({
      optimizer: tf.train.adam(),
      loss: 'meanSquaredError'
    });
    
    return model;
  }
  
  /**
   * Create a default competitor analysis model
   * @returns {tf.LayersModel} - Simple TensorFlow model
   */
  createDefaultCompetitorAnalysisModel() {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      inputShape: [20], // Simplified input shape
      units: 16,
      activation: 'relu',
      kernelInitializer: 'varianceScaling'
    }));
    
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 5, // Output factors for competitive analysis
      activation: 'linear'
    }));
    
    model.compile({
      optimizer: tf.train.adam(),
      loss: 'meanSquaredError'
    });
    
    return model;
  }
  
  /**
   * Extract numerical features from opportunity data
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @param {Array} pastBids - Historical bid data
   * @returns {Object} - Numerical features
   */
  extractNumericalFeatures(opportunity, companyProfile, pastBids) {
    // Implementation details for extracting numerical features
    return {
      value: opportunity.value || 0,
      daysToDeadline: opportunity.closeDate ? 
        Math.max(0, Math.ceil((new Date(opportunity.closeDate) - new Date()) / (1000 * 60 * 60 * 24))) : 30,
      companyRevenueMatch: opportunity.value ? 
        Math.min(1, companyProfile.annualRevenue / (opportunity.value * 10)) : 0.5,
      pastBidCount: pastBids.length,
      pastWinRate: pastBids.length > 0 ? 
        pastBids.filter(bid => bid.outcome === 'won').length / pastBids.length : 0.5,
      // Additional numerical features
    };
  }
  
  /**
   * Extract text features using NLP
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {Object} - Text features
   */
  async extractTextFeatures(opportunity, companyProfile) {
    // This would typically use more sophisticated NLP techniques
    // Simplified implementation for demonstration purposes
    const oppText = `${opportunity.title} ${opportunity.description}`.toLowerCase();
    const companyText = `${companyProfile.description} ${companyProfile.capabilities.join(' ')}`.toLowerCase();
    
    // Calculate text similarity (simplified)
    const oppTokens = new Set(this.tokenizer.tokenize(oppText).map(t => this.stemmer.stem(t)));
    const companyTokens = new Set(this.tokenizer.tokenize(companyText).map(t => this.stemmer.stem(t)));
    
    const intersection = new Set([...oppTokens].filter(x => companyTokens.has(x)));
    const textSimilarity = intersection.size / (oppTokens.size + companyTokens.size - intersection.size);
    
    return {
      textSimilarity,
      keywordMatch: this.calculateKeywordMatch(opportunity, companyProfile)
    };
  }
  
  /**
   * Calculate keyword match between opportunity and company profile
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {number} - Keyword match score (0-1)
   */
  calculateKeywordMatch(opportunity, companyProfile) {
    if (!opportunity.keywords || !companyProfile.keywords) {
      return 0.5; // Default if keywords not available
    }
    
    const opportunityKeywords = new Set(opportunity.keywords.map(k => k.toLowerCase()));
    const companyKeywords = new Set(companyProfile.keywords.map(k => k.toLowerCase()));
    
    const intersection = new Set([...opportunityKeywords].filter(x => companyKeywords.has(x)));
    return intersection.size / Math.sqrt(opportunityKeywords.size * companyKeywords.size);
  }
  
  /**
   * Extract categorical features
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {Object} - Categorical features
   */
  extractCategoricalFeatures(opportunity, companyProfile) {
    // Implementation details for extracting categorical features
    
    // Match agency with past experience
    const agencyExperience = companyProfile.pastClients.includes(opportunity.agency) ? 1 : 0;
    
    // Match category with company expertise
    const categoryMatch = companyProfile.expertiseCategories.includes(opportunity.category) ? 1 : 0;
    
    // Match location with company presence
    const locationMatch = companyProfile.operationLocations.includes(opportunity.location) ? 1 : 0;
    
    return {
      agencyExperience,
      categoryMatch,
      locationMatch,
      opportunityType: opportunity.type,
      contractType: opportunity.contractType || 'unknown'
    };
  }
  
  /**
   * Extract temporal features
   * @param {Object} opportunity - Opportunity data
   * @param {Array} pastBids - Historical bid data
   * @returns {Object} - Temporal features
   */
  extractTemporalFeatures(opportunity, pastBids) {
    // Calculate days since last bid
    let daysSinceLastBid = 365; // Default if no past bids
    
    if (pastBids.length > 0) {
      const lastBidDate = new Date(Math.max(...pastBids.map(bid => new Date(bid.date).getTime())));
      daysSinceLastBid = Math.ceil((new Date() - lastBidDate) / (1000 * 60 * 60 * 24));
    }
    
    // Calculate seasonal factors
    const month = new Date().getMonth();
    const isFiscalYearEnd = month >= 8 && month <= 10; // Sep-Nov
    
    return {
      daysSinceLastBid,
      isFiscalYearEnd: isFiscalYearEnd ? 1 : 0,
      opportunityPublishedDays: opportunity.publishDate ? 
        Math.ceil((new Date() - new Date(opportunity.publishDate)) / (1000 * 60 * 60 * 24)) : 0
    };
  }
  
  /**
   * Calculate match features between company and opportunity
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {Object} - Match features
   */
  calculateMatchFeatures(opportunity, companyProfile) {
    // Implementation details for calculating match features
    
    // Calculate capacity match
    const capacityMatch = Math.min(1, 
      companyProfile.availableCapacity / (opportunity.estimatedWorkload || companyProfile.availableCapacity));
    
    // Calculate team expertise match
    const teamExpertiseMatch = this.calculateTeamExpertiseMatch(opportunity, companyProfile);
    
    // Calculate certification match
    const certificationMatch = this.calculateCertificationMatch(opportunity, companyProfile);
    
    return {
      capacityMatch,
      teamExpertiseMatch,
      certificationMatch
    };
  }
  
  /**
   * Calculate team expertise match between company and opportunity
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {number} - Team expertise match score (0-1)
   */
  calculateTeamExpertiseMatch(opportunity, companyProfile) {
    // Simplified implementation - would be more sophisticated in production
    if (!opportunity.requiredSkills || !companyProfile.teamSkills) {
      return 0.5; // Default if skills info not available
    }
    
    const requiredSkills = new Set(opportunity.requiredSkills.map(s => s.toLowerCase()));
    const teamSkills = new Set(companyProfile.teamSkills.map(s => s.toLowerCase()));
    
    const matchedSkills = [...requiredSkills].filter(skill => teamSkills.has(skill));
    return requiredSkills.size > 0 ? matchedSkills.length / requiredSkills.size : 0.5;
  }
  
  /**
   * Calculate certification match between company and opportunity
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {number} - Certification match score (0-1)
   */
  calculateCertificationMatch(opportunity, companyProfile) {
    // Simplified implementation - would be more sophisticated in production
    if (!opportunity.requiredCertifications || !companyProfile.certifications) {
      return 0.5; // Default if certification info not available
    }
    
    const requiredCerts = new Set(opportunity.requiredCertifications.map(c => c.toLowerCase()));
    const companyCerts = new Set(companyProfile.certifications.map(c => c.toLowerCase()));
    
    const matchedCerts = [...requiredCerts].filter(cert => companyCerts.has(cert));
    return requiredCerts.size > 0 ? matchedCerts.length / requiredCerts.size : 1.0;
  }
  
  /**
   * Prepare model input data from features
   * @param {Object} features - Extracted features
   * @param {string} modelType - Type of model being used
   * @returns {Array} - Model input array
   */
  prepareModelInput(features, modelType) {
    // Format features into appropriate array for model input
    // This is a simplified implementation - would be more sophisticated in production
    const inputFeatures = [
      features.value || 0,
      features.daysToDeadline || 0,
      features.companyRevenueMatch || 0,
      features.pastBidCount || 0,
      features.pastWinRate || 0,
      features.textSimilarity || 0,
      features.keywordMatch || 0,
      features.agencyExperience || 0,
      features.categoryMatch || 0,
      features.locationMatch || 0,
      features.daysSinceLastBid || 0,
      features.isFiscalYearEnd || 0,
      features.opportunityPublishedDays || 0,
      features.capacityMatch || 0,
      features.teamExpertiseMatch || 0,
      features.certificationMatch || 0,
      // Fill remaining slots with zeros
      0, 0, 0, 0
    ];
    
    return inputFeatures;
  }
  
  /**
   * Fallback heuristic success prediction when model is unavailable
   * @param {Object} features - Extracted features
   * @returns {number} - Success probability (0-1)
   */
  heuristicSuccessPrediction(features) {
    // Simple weighted average of key features
    const weights = {
      pastWinRate: 0.25,
      categoryMatch: 0.20,
      teamExpertiseMatch: 0.15,
      textSimilarity: 0.10,
      agencyExperience: 0.10,
      certificationMatch: 0.10,
      locationMatch: 0.05,
      isFiscalYearEnd: 0.05
    };
    
    let probability = 0;
    let weightSum = 0;
    
    for (const [feature, weight] of Object.entries(weights)) {
      if (features[feature] !== undefined) {
        probability += features[feature] * weight;
        weightSum += weight;
      }
    }
    
    // Normalize by actual weight sum
    return weightSum > 0 ? probability / weightSum : 0.5;
  }
  
  /**
   * Fallback heuristic pricing strategy when model is unavailable
   * @param {Object} features - Extracted features
   * @param {Object} opportunity - Opportunity data
   * @param {Object} companyProfile - Company profile
   * @returns {Object} - Pricing strategy recommendation
   */
  heuristicPricingStrategy(features, opportunity, companyProfile) {
    // Base price is the opportunity value (or a default if not available)
    const basePrice = opportunity.value || 100000;
    
    // Adjust based on competitive factors
    let competitiveAdjustment = 1.0;
    
    // High competition suggests lower price
    if (features.pastBidCount > 10) {
      competitiveAdjustment *= 0.95;
    }
    
    // Strong company position suggests higher price
    if (features.categoryMatch > 0.8 && features.pastWinRate > 0.6) {
      competitiveAdjustment *= 1.05;
    }
    
    // Adjust based on timeline
    if (features.daysToDeadline < 14) {
      competitiveAdjustment *= 1.03; // Rush premium
    }
    
    // Fiscal year end often allows higher prices
    if (features.isFiscalYearEnd) {
      competitiveAdjustment *= 1.02;
    }
    
    const recommendedPrice = basePrice * competitiveAdjustment;
    
    // Calculate price range
    const minPrice = recommendedPrice * 0.95;
    const maxPrice = recommendedPrice * 1.05;
    
    // Determine confidence level
    let confidenceLevel = 'medium';
    if (features.pastBidCount > 5 && features.categoryMatch > 0.7) {
      confidenceLevel = 'high';
    } else if (features.pastBidCount < 2 || features.categoryMatch < 0.3) {
      confidenceLevel = 'low';
    }
    
    // Determine competitive positioning
    let competitivePositioning = 'balanced';
    if (competitiveAdjustment < 0.97) {
      competitivePositioning = 'aggressive';
    } else if (competitiveAdjustment > 1.03) {
      competitivePositioning = 'premium';
    }
    
    return {
      recommendedBidPrice: Math.round(recommendedPrice),
      minPrice: Math.round(minPrice),
      maxPrice: Math.round(maxPrice),
      confidenceLevel,
      competitivePositioning,
      factors: [
        {name: 'Competition', impact: features.pastBidCount > 10 ? 'high' : 'medium'},
        {name: 'Company Strength', impact: features.categoryMatch > 0.8 ? 'high' : 'medium'},
        {name: 'Timeline', impact: features.daysToDeadline < 14 ? 'high' : 'low'},
        {name: 'Fiscal Timing', impact: features.isFiscalYearEnd ? 'medium' : 'low'}
      ]
    };
  }
  
  /**
   * Fallback heuristic competitive analysis when model is unavailable
   * @param {Object} features - Extracted features
   * @param {Object} opportunity - Opportunity data
   * @returns {Object} - Competitive analysis results
   */
  heuristicCompetitiveAnalysis(features, opportunity) {
    // Determine number of expected competitors
    let estimatedCompetitors;
    if (opportunity.value > 1000000 || opportunity.category === 'IT' || opportunity.category === 'Construction') {
      estimatedCompetitors = 'high';
    } else if (opportunity.value < 100000 || opportunity.category === 'Research' || opportunity.category === 'Specialized Equipment') {
      estimatedCompetitors = 'low';
    } else {
      estimatedCompetitors = 'medium';
    }
    
    // Determine competitive dynamics
    let competitiveDynamics;
    if (features.isFiscalYearEnd && estimatedCompetitors === 'high') {
      competitiveDynamics = 'highly competitive';
    } else if (features.pastBidCount < 3 && features.categoryMatch > 0.8) {
      competitiveDynamics = 'favorable';
    } else {
      competitiveDynamics = 'moderately competitive';
    }
    
    // Determine market position
    let marketPosition;
    if (features.categoryMatch > 0.8 && features.agencyExperience > 0) {
      marketPosition = 'strong';
    } else if (features.categoryMatch < 0.3 || features.teamExpertiseMatch < 0.4) {
      marketPosition = 'weak';
    } else {
      marketPosition = 'moderate';
    }
    
    // Estimate win rate based on features
    const estimatedWinRate = this.heuristicSuccessPrediction(features);
    
    // Identify competitive advantages
    const competitiveAdvantages = [];
    if (features.agencyExperience > 0) {
      competitiveAdvantages.push('Existing agency relationship');
    }
    if (features.categoryMatch > 0.8) {
      competitiveAdvantages.push('Strong category expertise');
    }
    if (features.locationMatch > 0.8) {
      competitiveAdvantages.push('Geographic advantage');
    }
    if (features.teamExpertiseMatch > 0.8) {
      competitiveAdvantages.push('Exceptional team qualifications');
    }
    
    // Identify competitive risks
    const competitiveRisks = [];
    if (estimatedCompetitors === 'high') {
      competitiveRisks.push('Crowded competitive field');
    }
    if (features.daysToDeadline < 14) {
      competitiveRisks.push('Limited preparation time');
    }
    if (features.categoryMatch < 0.5) {
      competitiveRisks.push('Limited category experience');
    }
    if (features.pastWinRate < 0.3) {
      competitiveRisks.push('Historically low success rate in similar bids');
    }
    
    return {
      estimatedCompetitors,
      competitiveDynamics,
      marketPosition,
      estimatedWinRate,
      competitiveAdvantages,
      competitiveRisks
    };
  }
  
  /**
   * Check if company has expertise in a particular category
   * @param {Object} companyProfile - Company profile
   * @param {string} category - Opportunity category
   * @returns {boolean} - Whether company has expertise
   */
  hasCategoryExpertise(companyProfile, category) {
    if (!companyProfile.expertiseCategories || !category) {
      return false;
    }
    
    return companyProfile.expertiseCategories.some(
      c => c.toLowerCase() === category.toLowerCase()
    );
  }
  
  /**
   * Check if company has past performance with agency
   * @param {Object} companyProfile - Company profile
   * @param {string} agency - Agency name
   * @returns {boolean} - Whether company has past performance
   */
  hasPastPerformanceWithAgency(companyProfile, agency) {
    if (!companyProfile.pastClients || !agency) {
      return false;
    }
    
    return companyProfile.pastClients.some(
      c => c.toLowerCase() === agency.toLowerCase()
    );
  }
  
  /**
   * Check if company has geographic advantage for opportunity
   * @param {Object} companyProfile - Company profile
   * @param {string} location - Opportunity location
   * @returns {boolean} - Whether company has geographic advantage
   */
  hasGeographicAdvantage(companyProfile, location) {
    if (!companyProfile.operationLocations || !location) {
      return false;
    }
    
    return companyProfile.operationLocations.some(
      l => l.toLowerCase() === location.toLowerCase()
    );
  }
  
  /**
   * Identify unique capabilities of company relevant to opportunity
   * @param {Object} companyProfile - Company profile
   * @param {Object} features - Extracted features
   * @returns {Array} - Unique capabilities
   */
  identifyUniqueCapabilities(companyProfile, features) {
    // Simplified implementation - would be more sophisticated in production
    const uniqueCapabilities = [];
    
    if (companyProfile.uniqueTechnologies && companyProfile.uniqueTechnologies.length > 0) {
      uniqueCapabilities.push(...companyProfile.uniqueTechnologies.slice(0, 3));
    }
    
    if (companyProfile.patents && companyProfile.patents.length > 0) {
      uniqueCapabilities.push('Patented technologies');
    }
    
    if (companyProfile.specializedEquipment && companyProfile.specializedEquipment.length > 0) {
      uniqueCapabilities.push('Specialized equipment');
    }
    
    return uniqueCapabilities;
  }
  
  /**
   * Check if company has cost advantage for opportunity
   * @param {Object} companyProfile - Company profile
   * @param {Object} features - Extracted features
   * @returns {boolean} - Whether company has cost advantage
   */
  hasCostAdvantage(companyProfile, features) {
    // Simplified implementation - would be more sophisticated in production
    
    // Check if company has cost-saving technologies
    if (companyProfile.costSavingTechnologies && companyProfile.costSavingTechnologies.length > 0) {
      return true;
    }
    
    // Check if company has offshore capabilities for cost savings
    if (companyProfile.hasOffshoreCapabilities) {
      return true;
    }
    
    // Check if company has automated processes for cost efficiency
    if (companyProfile.automatedProcesses && companyProfile.automatedProcesses.length > 0) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if company has innovation advantage for opportunity
   * @param {Object} companyProfile - Company profile
   * @param {Object} opportunity - Opportunity data
   * @returns {boolean} - Whether company has innovation advantage
   */
  hasInnovationAdvantage(companyProfile, opportunity) {
    // Simplified implementation - would be more sophisticated in production
    
    // Check if company has patents
    if (companyProfile.patents && companyProfile.patents.length > 0) {
      return true;
    }
    
    // Check if company has R&D department
    if (companyProfile.hasRnD) {
      return true;
    }
    
    // Check if company has innovative methodologies
    if (companyProfile.innovativeMethodologies && companyProfile.innovativeMethodologies.length > 0) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Find relevant past bids for an opportunity
   * @param {Object} opportunity - Current opportunity
   * @param {Array} pastBids - Historical bid data
   * @returns {Array} - Relevant past bids
   */
  findRelevantPastBids(opportunity, pastBids) {
    if (!pastBids || pastBids.length === 0) {
      return [];
    }
    
    return pastBids.filter(bid => {
      // Same agency
      if (bid.agency === opportunity.agency) {
        return true;
      }
      
      // Same category
      if (bid.category === opportunity.category) {
        return true;
      }
      
      // Similar value (within 20% range)
      if (opportunity.value && bid.value) {
        const valueRatio = bid.value / opportunity.value;
        if (valueRatio >= 0.8 && valueRatio <= 1.2) {
          return true;
        }
      }
      
      return false;
    });
  }
  
  /**
   * Calculate category match score
   * @param {Object} features - Extracted features
   * @param {Object} companyProfile - Company profile
   * @returns {number} - Category match score (0-1)
   */
  calculateCategoryMatchScore(features, companyProfile) {
    // Use categoryMatch if available, otherwise default
    return features.categoryMatch !== undefined ? features.categoryMatch : 0.5;
  }
  
  /**
   * Calculate capability match score
   * @param {Object} features - Extracted features
   * @param {Object} companyProfile - Company profile
   * @returns {number} - Capability match score (0-1)
   */
  calculateCapabilityMatchScore(features, companyProfile) {
    // Combine various capability measures
    const measures = [
      features.teamExpertiseMatch,
      features.textSimilarity,
      features.keywordMatch
    ].filter(m => m !== undefined);
    
    // Average of available measures
    return measures.length > 0 ? 
      measures.reduce((sum, m) => sum + m, 0) / measures.length : 0.5;
  }
  
  /**
   * Calculate past performance score
   * @param {Object} features - Extracted features
   * @param {Object} companyProfile - Company profile
   * @returns {number} - Past performance score (0-1)
   */
  calculatePastPerformanceScore(features, companyProfile) {
    // Combine past performance measures
    const measures = [
      features.pastWinRate,
      features.agencyExperience
    ].filter(m => m !== undefined);
    
    // Average of available measures
    return measures.length > 0 ? 
      measures.reduce((sum, m) => sum + m, 0) / measures.length : 0.5;
  }
  
  /**
   * Calculate value match score
   * @param {Object} features - Extracted features
   * @param {Object} companyProfile - Company profile
   * @returns {number} - Value match score (0-1)
   */
  calculateValueMatchScore(features, companyProfile) {
    // Use companyRevenueMatch if available, otherwise default
    return features.companyRevenueMatch !== undefined ? features.companyRevenueMatch : 0.5;
  }
  
  /**
   * Calculate location match score
   * @param {Object} features - Extracted features
   * @param {Object} companyProfile - Company profile
   * @returns {number} - Location match score (0-1)
   */
  calculateLocationMatchScore(features, companyProfile) {
    // Use locationMatch if available, otherwise default
    return features.locationMatch !== undefined ? features.locationMatch : 0.5;
  }
  
  /**
   * Calculate timeline match score
   * @param {Object} features - Extracted features
   * @param {Object} companyProfile - Company profile
   * @returns {number} - Timeline match score (0-1)
   */
  calculateTimelineMatchScore(features, companyProfile) {
    // Calculate based on days to deadline and company capacity
    if (features.daysToDeadline === undefined) {
      return 0.5;
    }
    
    // Short deadlines with high capacity are good matches
    // Long deadlines are generally good matches
    if (features.daysToDeadline > 30) {
      return 0.9;
    } else if (features.daysToDeadline > 14) {
      return 0.7;
    } else if (features.capacityMatch > 0.8) {
      return 0.6;
    } else {
      return 0.3; // Short deadline with limited capacity
    }
  }
}

module.exports = AIAnalysisModule;
