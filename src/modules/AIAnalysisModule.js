/**
 * AI-Powered Procurement System (AIPS)
 * AI Analysis Module
 * 
 * This module provides AI-based analysis of procurement opportunities,
 * predicts success probabilities, and generates strategic recommendations.
 * 
 * Based on Ucaretron Inc.'s patent technology for optimizing 
 * public procurement bidding processes through artificial intelligence.
 */

// Import sample data for demonstration
const sampleOpportunities = require('../data/opportunities.json');
const sampleCompanies = require('../data/companies.json');
const samplePastBids = require('../data/pastBids.json');

class AIAnalysisModule {
  constructor() {
    console.log('Initializing AI Analysis Module...');
    this.opportunities = sampleOpportunities.opportunities;
    this.companies = sampleCompanies.companies;
    this.pastBids = samplePastBids.pastBids;
    
    // Demo analytical data
    this.analyticsData = {
      'demo-user-001': {
        bidSuccessRate: 0.68,
        averageBidAmount: 4800000,
        opportunitiesAnalyzed: 24,
        bidsSubmitted: 18,
        contractsWon: 12,
        totalContractValue: 58700000,
        topAgencies: [
          { name: 'Department of Defense', contracts: 4, value: 21500000 },
          { name: 'Department of Homeland Security', contracts: 3, value: 12800000 },
          { name: 'Department of Health and Human Services', contracts: 2, value: 9300000 }
        ],
        topCategories: [
          { name: 'Information Technology', percentage: 45 },
          { name: 'Cybersecurity', percentage: 30 },
          { name: 'Healthcare IT', percentage: 15 }
        ],
        monthlyPerformance: [
          { month: '2024-11', bids: 2, wins: 1, value: 3500000 },
          { month: '2024-12', bids: 3, wins: 2, value: 8200000 },
          { month: '2025-01', bids: 4, wins: 3, value: 12500000 },
          { month: '2025-02', bids: 5, wins: 3, value: 15000000 },
          { month: '2025-03', bids: 4, wins: 3, value: 19500000 }
        ]
      }
    };
    
    // Demo recommendations
    this.recommendations = {
      'demo-user-001': [
        {
          opportunityId: 'OPP-2025-003',
          score: 0.92,
          reasons: [
            'Strong match with company core competencies in healthcare IT',
            'Past performance with similar interoperability projects',
            'High estimated success probability based on historical data',
            'Matches company's strategic growth areas'
          ]
        },
        {
          opportunityId: 'OPP-2025-001',
          score: 0.87,
          reasons: [
            'Strong match with company cybersecurity expertise',
            'Previous successful projects with Department of Homeland Security',
            'Technical requirements align with company capabilities',
            'Budget range matches company's typical contract size'
          ]
        },
        {
          opportunityId: 'OPP-2025-008',
          score: 0.79,
          reasons: [
            'Identity management aligns with company's security focus',
            'Blockchain experience is relevant to requirements',
            'Government identity projects match past performance',
            'Estimated success probability is above company average'
          ]
        }
      ]
    };
  }

  /**
   * Analyze an opportunity for a specific company
   * @param {string} opportunityId - ID of the opportunity to analyze
   * @param {object} companyProfile - Company profile data
   * @return {object} Analysis results
   */
  analyzeOpportunity(opportunityId, companyProfile) {
    console.log(`Analyzing opportunity ${opportunityId} for company profile`);
    
    // Find the opportunity
    const opportunity = this.opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) {
      throw new Error(`Opportunity with ID ${opportunityId} not found`);
    }
    
    // Find or use the provided company profile
    let company;
    if (companyProfile && companyProfile.id) {
      company = companyProfile;
    } else if (companyProfile && typeof companyProfile === 'string') {
      company = this.companies.find(comp => comp.id === companyProfile);
      if (!company) {
        throw new Error(`Company with ID ${companyProfile} not found`);
      }
    } else {
      // Default to the first company for demo purposes
      company = this.companies[0];
    }
    
    // Calculate match score based on NAICS code match
    const naicsMatch = company.naicsCodes.includes(opportunity.naicsCode);
    
    // Calculate capability match
    let capabilityMatchScore = 0;
    if (opportunity.tags && company.capabilities) {
      const matchingTags = opportunity.tags.filter(tag => 
        company.capabilities.some(cap => 
          cap.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(cap.toLowerCase())
        )
      );
      capabilityMatchScore = matchingTags.length / opportunity.tags.length;
    }
    
    // Calculate domain expertise match
    let domainMatchScore = 0;
    if (opportunity.category && company.domains) {
      const matchingDomains = company.domains.filter(domain => 
        domain.toLowerCase().includes(opportunity.category.toLowerCase()) || 
        opportunity.category.toLowerCase().includes(domain.toLowerCase())
      );
      domainMatchScore = matchingDomains.length > 0 ? 1 : 0;
    }
    
    // Find past bids for similar opportunities
    const similarPastBids = this.pastBids.filter(bid => 
      bid.companyId === company.id && (
        bid.opportunityTitle.toLowerCase().includes(opportunity.category.toLowerCase()) ||
        opportunity.title.toLowerCase().includes(bid.opportunityTitle.toLowerCase()) ||
        bid.agency === opportunity.agency
      )
    );
    
    const wonSimilarBids = similarPastBids.filter(bid => bid.outcome === 'Won');
    const pastPerformanceScore = similarPastBids.length > 0 ? 
      wonSimilarBids.length / similarPastBids.length : 0.5;
    
    // Calculate overall match score
    const matchScore = (
      (naicsMatch ? 0.3 : 0) + 
      (capabilityMatchScore * 0.3) + 
      (domainMatchScore * 0.2) + 
      (pastPerformanceScore * 0.2)
    );
    
    // Predict success probability
    const successProbability = Math.min(0.95, matchScore * 0.8 + Math.random() * 0.2);
    
    // Generate competitor analysis
    const competitorAnalysis = this._generateCompetitorAnalysis(opportunity, company);
    
    // Generate pricing strategy
    const pricingStrategy = this._generatePricingStrategy(opportunity, company, successProbability);
    
    // Generate technical approach recommendations
    const technicalRecommendations = this._generateTechnicalRecommendations(opportunity, company);
    
    // Generate team composition recommendations
    const teamRecommendations = this._generateTeamRecommendations(opportunity);
    
    // Calculate timeline and critical path
    const timeline = this._generateTimeline(opportunity);
    
    // Calculate risk assessment
    const riskAssessment = this._generateRiskAssessment(opportunity, company, successProbability);
    
    return {
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      companyId: company.id,
      companyName: company.name,
      analysisDate: new Date().toISOString(),
      matchScore: Math.round(matchScore * 100) / 100,
      successProbability: Math.round(successProbability * 100) / 100,
      analysis: {
        naicsMatch: naicsMatch,
        capabilityMatchScore: Math.round(capabilityMatchScore * 100) / 100,
        domainMatchScore: Math.round(domainMatchScore * 100) / 100,
        pastPerformanceScore: Math.round(pastPerformanceScore * 100) / 100,
        similarPastBids: similarPastBids.length,
        wonSimilarBids: wonSimilarBids.length
      },
      recommendations: {
        bidDecision: successProbability > 0.6 ? 'Recommended to bid' : 'Cautious approach recommended',
        reasoning: this._generateBidRecommendationReasoning(matchScore, successProbability, opportunity, company),
        competitorAnalysis,
        pricingStrategy,
        technicalRecommendations,
        teamRecommendations,
        timeline,
        riskAssessment
      }
    };
  }

  /**
   * Generate a detailed bid recommendation reasoning
   * @private
   */
  _generateBidRecommendationReasoning(matchScore, successProbability, opportunity, company) {
    const reasons = [];
    
    if (matchScore > 0.7) {
      reasons.push(`Strong alignment between opportunity requirements and company capabilities.`);
    } else if (matchScore > 0.4) {
      reasons.push(`Moderate alignment between opportunity requirements and company capabilities.`);
    } else {
      reasons.push(`Limited alignment between opportunity requirements and company capabilities.`);
    }
    
    if (company.naicsCodes.includes(opportunity.naicsCode)) {
      reasons.push(`NAICS code ${opportunity.naicsCode} directly matches company's registered codes.`);
    } else {
      reasons.push(`NAICS code ${opportunity.naicsCode} is not in company's registered codes, which may present a challenge.`);
    }
    
    // Agency experience
    const agencyExperience = company.pastPerformance && company.pastPerformance.some(pp => pp.client === opportunity.agency);
    if (agencyExperience) {
      reasons.push(`Company has previous experience with ${opportunity.agency}, which is advantageous.`);
    } else {
      reasons.push(`No previous experience with ${opportunity.agency} identified, which increases risk.`);
    }
    
    // Size consideration
    if (opportunity.value > 0) {
      const companyRevenue = company.financials && company.financials.annualRevenue ? company.financials.annualRevenue : 0;
      if (opportunity.value > companyRevenue * 0.5) {
        reasons.push(`Opportunity value (${opportunity.value.toLocaleString('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0})}) is significant relative to company's annual revenue, presenting execution risk.`);
      } else if (opportunity.value < companyRevenue * 0.1) {
        reasons.push(`Opportunity value (${opportunity.value.toLocaleString('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0})}) is manageable given company's size and resources.`);
      }
    }
    
    // Success probability assessment
    if (successProbability > 0.8) {
      reasons.push(`High predicted success probability (${(successProbability * 100).toFixed(1)}%) suggests this is a strong opportunity.`);
    } else if (successProbability > 0.6) {
      reasons.push(`Moderately strong success probability (${(successProbability * 100).toFixed(1)}%) indicates this is worth pursuing with careful strategy.`);
    } else {
      reasons.push(`Lower success probability (${(successProbability * 100).toFixed(1)}%) suggests significant challenges, requiring exceptional differentiation strategy.`);
    }
    
    return reasons;
  }

  /**
   * Generate competitor analysis
   * @private
   */
  _generateCompetitorAnalysis(opportunity, company) {
    // In a real implementation, this would analyze actual competitor data
    // For demonstration, we're generating a simulated analysis
    
    const expectedCompetitors = opportunity.category === 'Cybersecurity' ? 
      ['Secure Systems, Inc.', 'CyberShield Technologies', 'Guardian Cyber Solutions'] :
      opportunity.category === 'Healthcare' ?
      ['MedTech Innovations', 'HealthData Systems', 'CarePlus Technologies'] :
      ['TechSolutions Group', 'Innovative Systems LLC', 'NextGen Solutions'];
    
    const competitorStrengths = opportunity.category === 'Cybersecurity' ?
      ['Strong past performance with federal agencies', 'Proprietary security platforms', 'Lower pricing strategies'] :
      opportunity.category === 'Healthcare' ?
      ['Healthcare-specific compliance expertise', 'Established provider networks', 'Clinical workflow knowledge'] :
      ['Larger size and resources', 'Broad technical capabilities', 'Established agency relationships'];
    
    return {
      expectedCompetitors,
      competitorCount: Math.floor(Math.random() * 5) + 3,
      competitorStrengths,
      differentiationOpportunities: [
        'Focus on innovative technical approach specific to agency needs',
        'Emphasize past performance with similar projects',
        'Highlight unique capabilities and proprietary technologies',
        'Demonstrate superior understanding of agency mission and challenges'
      ],
      competitiveLandscape: Math.random() > 0.5 ? 'Highly competitive' : 'Moderately competitive'
    };
  }

  /**
   * Generate pricing strategy recommendations
   * @private
   */
  _generatePricingStrategy(opportunity, company, successProbability) {
    // In a real implementation, this would use ML models trained on historical data
    // For demonstration, we're generating a simulated strategy
    
    const recommendedBidAmount = opportunity.value * (0.9 + Math.random() * 0.2);
    const bidStrategy = successProbability > 0.8 ? 'Value-based premium' : 
      successProbability > 0.6 ? 'Competitive mid-range' : 'Aggressive pricing';
    
    return {
      recommendedBidAmount,
      bidStrategy,
      rationale: `Based on opportunity value, competitive analysis, and company positioning, a ${bidStrategy.toLowerCase()} approach is recommended to maximize win probability while maintaining profitability.`,
      keyConsiderations: [
        'Emphasize value proposition and ROI in proposal',
        'Consider strategic pricing on key line items',
        'Highlight cost efficiencies from proposed technical approach',
        'Ensure adequate margin for project risks and contingencies'
      ],
      sensitivities: {
        priceElasticity: 'Medium',
        keyDrivers: ['Technical quality', 'Past performance', 'Innovative approach']
      }
    };
  }

  /**
   * Generate technical approach recommendations
   * @private
   */
  _generateTechnicalRecommendations(opportunity, company) {
    // Extract key terms from opportunity description
    const descriptionWords = opportunity.description.toLowerCase().split(/\s+/);
    const keyTerms = descriptionWords.filter(word => 
      word.length > 5 && 
      !['should', 'would', 'could', 'their', 'there', 'these', 'those', 'other', 'another'].includes(word)
    );
    
    // Find matching capabilities
    const matchingCapabilities = company.capabilities ? company.capabilities.filter(capability => 
      keyTerms.some(term => capability.toLowerCase().includes(term))
    ) : [];
    
    // Generate recommended approach
    const approaches = [
      'Innovative', 'Comprehensive', 'Integrated', 'Agile', 'Robust', 
      'Secure', 'Scalable', 'Efficient', 'Resilient', 'Adaptive'
    ];
    
    const focusAreas = opportunity.requirements ? 
      opportunity.requirements.slice(0, 3) : 
      ['Quality assurance', 'Performance optimization', 'Risk management'];
    
    return {
      recommendedApproach: `${approaches[Math.floor(Math.random() * approaches.length)]} ${opportunity.category} Solution`,
      focusAreas,
      keyDifferentiators: matchingCapabilities.length > 0 ? 
        matchingCapabilities.slice(0, 3) : 
        ['Technical innovation', 'Integration expertise', 'Domain knowledge'],
      emphasisAreas: [
        'Alignment with agency mission and goals',
        'Proven methodologies and best practices',
        'Clear implementation roadmap with milestones',
        'Comprehensive testing and validation approach'
      ]
    };
  }

  /**
   * Generate team composition recommendations
   * @private
   */
  _generateTeamRecommendations(opportunity) {
    // In a real implementation, this would analyze the opportunity requirements
    // and recommend specific team members and roles
    
    const coreRoles = [
      {
        role: 'Program Manager',
        skills: ['Project management', 'Client communication', 'Resource allocation'],
        certifications: ['PMP', 'Agile/Scrum Master'],
        allocation: '100%'
      },
      {
        role: 'Technical Lead',
        skills: [opportunity.category + ' expertise', 'Solution architecture', 'Technical oversight'],
        certifications: opportunity.category === 'Cybersecurity' ? 
          ['CISSP', 'CEH'] : 
          opportunity.category === 'Healthcare' ?
          ['HL7 Certification', 'HIPAA Compliance'] :
          ['AWS Solutions Architect', 'Azure Architect'],
        allocation: '100%'
      },
      {
        role: 'Subject Matter Expert',
        skills: [opportunity.agency + ' domain knowledge', 'Regulatory compliance', 'Requirements analysis'],
        certifications: ['Industry certifications', 'Relevant experience'],
        allocation: '50%'
      }
    ];
    
    const supportRoles = [
      {
        role: 'Quality Assurance Lead',
        skills: ['Test planning', 'Defect management', 'Quality processes'],
        allocation: '75%'
      },
      {
        role: 'Documentation Specialist',
        skills: ['Technical writing', 'Process documentation', 'Compliance documentation'],
        allocation: '50%'
      }
    ];
    
    return {
      coreRoles,
      supportRoles,
      recommendedTeamSize: coreRoles.length + supportRoles.length + Math.floor(Math.random() * 3) + 2,
      keyCertifications: coreRoles.flatMap(role => role.certifications),
      resourceingStrategy: 'Blend of senior leadership with specialized domain experts'
    };
  }

  /**
   * Generate project timeline
   * @private
   */
  _generateTimeline(opportunity) {
    const closeDate = new Date(opportunity.closeDate);
    const projectStart = new Date(closeDate);
    projectStart.setDate(projectStart.getDate() + 30); // 30 days after close
    
    const phases = [
      {
        name: 'Initiation',
        duration: '2 weeks',
        startDate: projectStart.toISOString().split('T')[0],
        activities: ['Project kickoff', 'Requirements validation', 'Team onboarding']
      },
      {
        name: 'Planning',
        duration: '3 weeks',
        activities: ['Detailed project planning', 'Technical architecture design', 'Risk assessment']
      },
      {
        name: 'Execution',
        duration: '16 weeks',
        activities: ['Implementation', 'Regular progress reviews', 'Quality assurance']
      },
      {
        name: 'Transition',
        duration: '3 weeks',
        activities: ['User acceptance testing', 'Knowledge transfer', 'Documentation finalization']
      },
      {
        name: 'Closure',
        duration: '2 weeks',
        activities: ['Final delivery', 'Lessons learned', 'Project closure']
      }
    ];
    
    const criticalPath = [
      'Requirements validation',
      'Technical architecture design',
      'Implementation',
      'User acceptance testing',
      'Final delivery'
    ];
    
    return {
      estimatedDuration: '26 weeks',
      phases,
      criticalPath,
      keyMilestones: [
        'Project kickoff',
        'Architecture approval',
        'Implementation completion',
        'User acceptance testing completion',
        'Final delivery'
      ]
    };
  }

  /**
   * Generate risk assessment
   * @private
   */
  _generateRiskAssessment(opportunity, company, successProbability) {
    // In a real implementation, this would analyze specific risks based on
    // opportunity characteristics and company capabilities
    
    const riskLevel = successProbability > 0.8 ? 'Low' : 
      successProbability > 0.6 ? 'Medium' : 'High';
    
    const commonRisks = [
      {
        category: 'Technical',
        description: 'Integration with existing systems may be more complex than anticipated',
        impact: 'Medium',
        probability: 'Medium',
        mitigation: 'Conduct detailed system analysis during initiation phase'
      },
      {
        category: 'Schedule',
        description: 'Tight timeline for implementation',
        impact: 'High',
        probability: 'Medium',
        mitigation: 'Implement agile methodology with frequent delivery points'
      },
      {
        category: 'Resource',
        description: 'Availability of specialized expertise',
        impact: 'Medium',
        probability: 'Low',
        mitigation: 'Identify backup resources and cross-training opportunities'
      },
      {
        category: 'Compliance',
        description: 'Regulatory requirements may change during project',
        impact: 'High',
        probability: 'Low',
        mitigation: 'Regular monitoring of regulatory changes, flexible design approach'
      }
    ];
    
    return {
      overallRiskLevel: riskLevel,
      keyRisks: commonRisks,
      contingencyRecommendation: `${riskLevel === 'Low' ? '10%' : riskLevel === 'Medium' ? '15%' : '20%'} budget contingency`,
      mitigationStrategy: 'Proactive risk management with weekly risk reviews and mitigation tracking'
    };
  }

  /**
   * Predict the success probability of a bid
   * @param {object} opportunityData - Opportunity data
   * @param {object} companyData - Company data
   * @param {object} proposalData - Proposal data
   * @return {object} Prediction results
   */
  predictSuccessProbability(opportunityData, companyData, proposalData) {
    console.log('Predicting success probability for bid');
    
    // In a real implementation, this would use a trained ML model
    // For demonstration, we'll use a simplified calculation
    
    // Find or create opportunity and company objects
    let opportunity, company;
    
    if (typeof opportunityData === 'string') {
      opportunity = this.opportunities.find(opp => opp.id === opportunityData);
      if (!opportunity) {
        throw new Error(`Opportunity with ID ${opportunityData} not found`);
      }
    } else {
      opportunity = opportunityData;
    }
    
    if (typeof companyData === 'string') {
      company = this.companies.find(comp => comp.id === companyData);
      if (!company) {
        throw new Error(`Company with ID ${companyData} not found`);
      }
    } else {
      company = companyData;
    }
    
    // Calculate base probability
    const baseProbability = opportunity.successProbability || 0.5;
    
    // Adjust for company factors
    let adjustedProbability = baseProbability;
    
    // Adjust for NAICS code match
    if (company.naicsCodes && company.naicsCodes.includes(opportunity.naicsCode)) {
      adjustedProbability += 0.1;
    } else {
      adjustedProbability -= 0.1;
    }
    
    // Adjust for past performance with the agency
    const agencyExperience = company.pastPerformance && 
      company.pastPerformance.some(pp => pp.client === opportunity.agency);
    if (agencyExperience) {
      adjustedProbability += 0.15;
    }
    
    // Adjust for pricing factors
    if (proposalData && proposalData.bidAmount) {
      const bidRatio = proposalData.bidAmount / opportunity.value;
      if (bidRatio < 0.9) {
        adjustedProbability += 0.1; // Lower bid is favorable
      } else if (bidRatio > 1.1) {
        adjustedProbability -= 0.1; // Higher bid is unfavorable
      }
    }
    
    // Adjust for proposal quality factors
    if (proposalData && proposalData.quality) {
      adjustedProbability += (proposalData.quality - 0.5) * 0.2;
    }
    
    // Ensure probability is between 0 and 1
    adjustedProbability = Math.max(0, Math.min(1, adjustedProbability));
    
    return {
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      companyId: company.id,
      companyName: company.name,
      predictionDate: new Date().toISOString(),
      baseProbability: Math.round(baseProbability * 100) / 100,
      adjustedProbability: Math.round(adjustedProbability * 100) / 100,
      confidenceLevel: 'Medium',
      factors: {
        naicsCodeMatch: company.naicsCodes && company.naicsCodes.includes(opportunity.naicsCode),
        agencyExperience: agencyExperience,
        competitionLevel: opportunity.competitorCount || 'Unknown',
        bidAmount: proposalData && proposalData.bidAmount ? proposalData.bidAmount : 'Not specified'
      },
      recommendation: adjustedProbability > 0.7 ? 
        'Strong opportunity - proceed with full effort' :
        adjustedProbability > 0.5 ?
        'Moderate opportunity - proceed with caution' :
        'Challenging opportunity - consider whether to proceed'
    };
  }

  /**
   * Get recommended opportunities for a user
   * @param {string} userId - User ID
   * @return {array} Recommended opportunities
   */
  getRecommendedOpportunities(userId) {
    console.log(`Getting recommended opportunities for user: ${userId}`);
    
    // For demonstration, return the pre-defined recommendations
    const userRecommendations = this.recommendations[userId] || [];
    
    // Expand opportunity details
    return userRecommendations.map(rec => {
      const opportunity = this.opportunities.find(opp => opp.id === rec.opportunityId);
      return {
        ...opportunity,
        matchScore: rec.score,
        matchReasons: rec.reasons
      };
    });
  }

  /**
   * Get dashboard analytics for a user
   * @param {string} userId - User ID
   * @return {object} Dashboard analytics
   */
  getDashboardAnalytics(userId) {
    console.log(`Getting dashboard analytics for user: ${userId}`);
    
    // For demonstration, return the pre-defined analytics
    return this.analyticsData[userId] || {
      bidSuccessRate: 0,
      averageBidAmount: 0,
      opportunitiesAnalyzed: 0,
      bidsSubmitted: 0,
      contractsWon: 0,
      totalContractValue: 0,
      topAgencies: [],
      topCategories: [],
      monthlyPerformance: []
    };
  }

  /**
   * Get user performance metrics
   * @param {string} userId - User ID
   * @param {string} period - Time period ('month', 'quarter', 'year')
   * @return {object} Performance metrics
   */
  getUserPerformanceMetrics(userId, period = 'month') {
    console.log(`Getting user performance metrics for user: ${userId} for period: ${period}`);
    
    // For demonstration, derive from the pre-defined analytics
    const analytics = this.analyticsData[userId];
    
    if (!analytics) {
      return {
        bidSuccessRate: 0,
        opportunitiesAnalyzed: 0,
        bidsSubmitted: 0,
        contractsWon: 0,
        averageContractValue: 0,
        performanceTrend: 'stable'
      };
    }
    
    // Filter data by period
    let filteredPerformance;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    if (period === 'month') {
      // Last 30 days
      filteredPerformance = analytics.monthlyPerformance.slice(-1);
    } else if (period === 'quarter') {
      // Last 90 days / 3 months
      filteredPerformance = analytics.monthlyPerformance.slice(-3);
    } else {
      // Last year
      filteredPerformance = analytics.monthlyPerformance.slice(-12);
    }
    
    // Calculate metrics
    const totalBids = filteredPerformance.reduce((sum, month) => sum + month.bids, 0);
    const totalWins = filteredPerformance.reduce((sum, month) => sum + month.wins, 0);
    const totalValue = filteredPerformance.reduce((sum, month) => sum + month.value, 0);
    
    // Calculate performance trend
    let performanceTrend = 'stable';
    if (filteredPerformance.length >= 2) {
      const firstHalf = filteredPerformance.slice(0, Math.floor(filteredPerformance.length / 2));
      const secondHalf = filteredPerformance.slice(Math.floor(filteredPerformance.length / 2));
      
      const firstHalfWinRate = firstHalf.reduce((sum, month) => sum + month.wins, 0) / 
        firstHalf.reduce((sum, month) => sum + month.bids, 0) || 0;
      
      const secondHalfWinRate = secondHalf.reduce((sum, month) => sum + month.wins, 0) / 
        secondHalf.reduce((sum, month) => sum + month.bids, 0) || 0;
      
      if (secondHalfWinRate > firstHalfWinRate * 1.1) {
        performanceTrend = 'improving';
      } else if (secondHalfWinRate < firstHalfWinRate * 0.9) {
        performanceTrend = 'declining';
      }
    }
    
    return {
      bidSuccessRate: totalBids > 0 ? totalWins / totalBids : 0,
      opportunitiesAnalyzed: totalBids + Math.floor(totalBids * 0.3), // Assume 30% more analyzed than bid
      bidsSubmitted: totalBids,
      contractsWon: totalWins,
      averageContractValue: totalWins > 0 ? totalValue / totalWins : 0,
      totalContractValue: totalValue,
      performanceTrend
    };
  }

  /**
   * Simulate simple ML model training for demonstration purposes
   * @param {string} modelType - Type of model to train
   * @return {object} Training results
   */
  trainModel(modelType = 'success_prediction') {
    console.log(`Training ${modelType} model`);
    
    // This is a simulated function - in a real implementation,
    // this would train actual ML models using TensorFlow or similar
    
    // Simulate training process
    const trainingSteps = 500;
    const trainingProgress = [];
    
    let accuracy = 0.5;
    let loss = 0.7;
    
    for (let i = 0; i < 10; i++) {
      // Simulate improvement in model metrics
      accuracy += (0.9 - accuracy) * 0.2;
      loss -= loss * 0.15;
      
      trainingProgress.push({
        step: (i + 1) * (trainingSteps / 10),
        accuracy,
        loss
      });
    }
    
    return {
      modelType,
      trainingStatus: 'completed',
      trainingDuration: '00:03:45',
      finalMetrics: {
        accuracy: Math.round(accuracy * 100) / 100,
        loss: Math.round(loss * 1000) / 1000,
        f1Score: Math.round(accuracy * 0.95 * 100) / 100,
        precision: Math.round(accuracy * 1.05 * 100) / 100,
        recall: Math.round(accuracy * 0.9 * 100) / 100
      },
      trainingProgress,
      featureImportance: [
        { feature: 'Past performance with agency', importance: 0.28 },
        { feature: 'Capability match score', importance: 0.23 },
        { feature: 'NAICS code match', importance: 0.18 },
        { feature: 'Bid amount relative to estimated value', importance: 0.15 },
        { feature: 'Competitor count', importance: 0.09 },
        { feature: 'Company size', importance: 0.07 }
      ]
    };
  }
}

module.exports = AIAnalysisModule;