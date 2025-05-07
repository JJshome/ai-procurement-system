/**
 * AI-Powered Procurement System (AIPS)
 * Data Collection Module
 * 
 * This module is responsible for collecting and processing data from various sources,
 * including SAM.gov and other procurement platforms. It provides a unified interface
 * for accessing procurement-related data.
 * 
 * Based on Ucaretron Inc.'s patent technology for optimizing 
 * public procurement bidding processes through artificial intelligence.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Import sample data for demonstration purposes
const sampleOpportunities = require('../data/opportunities.json');
const sampleCompanies = require('../data/companies.json');
const samplePastBids = require('../data/pastBids.json');

class DataCollectionModule {
  constructor() {
    console.log('Initializing Data Collection Module...');
    this.opportunities = sampleOpportunities.opportunities;
    this.companies = sampleCompanies.companies;
    this.pastBids = samplePastBids.pastBids;
    
    // Initialize in-memory storage for demo
    this.users = [
      {
        id: 'demo-user-001',
        email: 'demo@example.com',
        name: 'Demo User',
        company: 'Demo Company',
        role: 'Procurement Manager',
        settings: {
          notificationPreferences: {
            email: true,
            inApp: true,
            bidDeadlineAlerts: 48, // hours before deadline
            newOpportunitiesAlerts: true
          },
          defaultCompanyProfile: 'COMP-001',
          dashboardLayout: 'standard',
          theme: 'light',
          language: 'en-US'
        }
      }
    ];
    
    this.notifications = [
      {
        id: 'notif-001',
        userId: 'demo-user-001',
        type: 'deadline',
        title: 'Bid Deadline Approaching',
        message: 'The bid deadline for "Advanced Cybersecurity Solutions for Federal Agency" is in 48 hours.',
        relatedTo: 'OPP-2025-001',
        createdAt: '2025-04-13T08:00:00Z',
        read: false,
        priority: 'high'
      },
      {
        id: 'notif-002',
        userId: 'demo-user-001',
        type: 'recommendation',
        title: 'New Recommended Opportunity',
        message: 'A new opportunity matching your company profile has been identified: "Healthcare Data Interoperability Platform"',
        relatedTo: 'OPP-2025-003',
        createdAt: '2025-04-03T10:15:00Z',
        read: true,
        priority: 'medium'
      },
      {
        id: 'notif-003',
        userId: 'demo-user-001',
        type: 'analysis',
        title: 'Bid Analysis Complete',
        message: 'The AI analysis for your bid on "Smart City Transportation Management System" is now available.',
        relatedTo: 'OPP-2025-002',
        createdAt: '2025-04-05T14:30:00Z',
        read: false,
        priority: 'medium'
      }
    ];
    
    this.activities = [
      {
        id: 'act-001',
        userId: 'demo-user-001',
        type: 'opportunity_saved',
        description: 'Saved opportunity "Advanced Cybersecurity Solutions for Federal Agency" to watchlist',
        timestamp: '2025-04-11T09:23:15Z',
        relatedTo: 'OPP-2025-001'
      },
      {
        id: 'act-002',
        userId: 'demo-user-001',
        type: 'document_generated',
        description: 'Generated proposal draft for "Smart City Transportation Management System"',
        timestamp: '2025-04-02T13:45:22Z',
        relatedTo: 'OPP-2025-002'
      },
      {
        id: 'act-003',
        userId: 'demo-user-001',
        type: 'analysis_requested',
        description: 'Requested AI analysis for "Healthcare Data Interoperability Platform"',
        timestamp: '2025-04-05T10:12:08Z',
        relatedTo: 'OPP-2025-003'
      }
    ];
    
    this.calendarEvents = [
      {
        id: 'evt-001',
        userId: 'demo-user-001',
        title: 'Bid Submission Deadline - Cybersecurity Solutions',
        start: '2025-06-15T23:59:59Z',
        end: '2025-06-15T23:59:59Z',
        type: 'deadline',
        relatedTo: 'OPP-2025-001',
        description: 'Final deadline for submitting the bid for the DHS cybersecurity project'
      },
      {
        id: 'evt-002',
        userId: 'demo-user-001',
        title: 'Team Meeting - Smart City Transportation Proposal',
        start: '2025-04-10T14:00:00Z',
        end: '2025-04-10T15:30:00Z',
        type: 'meeting',
        relatedTo: 'OPP-2025-002',
        description: 'Internal team meeting to discuss the technical approach for the Smart City proposal'
      },
      {
        id: 'evt-003',
        userId: 'demo-user-001',
        title: 'Pre-bid Conference - Healthcare Data Platform',
        start: '2025-04-15T10:00:00Z',
        end: '2025-04-15T12:00:00Z',
        type: 'conference',
        relatedTo: 'OPP-2025-003',
        description: 'Virtual pre-bid conference with HHS for the Healthcare Data Interoperability Platform'
      }
    ];
    
    this.activeBids = [
      {
        id: 'active-bid-001',
        userId: 'demo-user-001',
        opportunityId: 'OPP-2025-001',
        title: 'Advanced Cybersecurity Solutions for Federal Agency',
        stage: 'Technical Writing',
        progress: 65,
        dueDate: '2025-06-15T23:59:59Z',
        team: ['demo-user-001', 'technical-lead', 'pricing-specialist', 'proposal-manager'],
        documents: [
          { id: 'doc-001', name: 'Technical Approach.docx', status: 'In Progress' },
          { id: 'doc-002', name: 'Past Performance.docx', status: 'Complete' },
          { id: 'doc-003', name: 'Pricing Sheet.xlsx', status: 'In Progress' }
        ]
      },
      {
        id: 'active-bid-002',
        userId: 'demo-user-001',
        opportunityId: 'OPP-2025-002',
        title: 'Smart City Transportation Management System',
        stage: 'Final Review',
        progress: 90,
        dueDate: '2025-05-20T23:59:59Z',
        team: ['demo-user-001', 'technical-lead', 'pricing-specialist', 'proposal-manager'],
        documents: [
          { id: 'doc-004', name: 'Technical Approach.docx', status: 'Complete' },
          { id: 'doc-005', name: 'Past Performance.docx', status: 'Complete' },
          { id: 'doc-006', name: 'Pricing Sheet.xlsx', status: 'Complete' },
          { id: 'doc-007', name: 'Final Proposal.pdf', status: 'In Progress' }
        ]
      }
    ];
  }

  /**
   * Search for procurement opportunities based on criteria
   * @param {string} query - Search query
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order ('asc' or 'desc')
   * @return {object} Opportunities matching the criteria
   */
  searchOpportunities(query, page = 1, limit = 10, sortBy = 'releaseDate', sortOrder = 'desc') {
    console.log(`Searching for opportunities with query: ${query}`);
    
    let results = [...this.opportunities];
    
    // Apply search query if provided
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(opp => 
        opp.title.toLowerCase().includes(queryLower) ||
        opp.description.toLowerCase().includes(queryLower) ||
        opp.agency.toLowerCase().includes(queryLower) ||
        opp.category.toLowerCase().includes(queryLower) ||
        (opp.tags && opp.tags.some(tag => tag.toLowerCase().includes(queryLower)))
      );
    }
    
    // Apply sorting
    results.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle dates
      if (sortBy === 'releaseDate' || sortBy === 'closeDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // Apply sort order
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);
    
    return {
      opportunities: paginatedResults,
      total: results.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(results.length / limit)
    };
  }

  /**
   * Get detailed information about a specific opportunity
   * @param {string} id - Opportunity ID
   * @return {object} Opportunity details
   */
  getOpportunityDetails(id) {
    console.log(`Getting details for opportunity: ${id}`);
    const opportunity = this.opportunities.find(opp => opp.id === id);
    
    if (!opportunity) {
      throw new Error(`Opportunity with ID ${id} not found`);
    }
    
    return opportunity;
  }

  /**
   * Get company profile information
   * @param {string} id - Company ID
   * @return {object} Company profile
   */
  getCompanyProfile(id) {
    console.log(`Getting company profile: ${id}`);
    const company = this.companies.find(comp => comp.id === id);
    
    if (!company) {
      throw new Error(`Company with ID ${id} not found`);
    }
    
    return company;
  }

  /**
   * Save or update a company profile
   * @param {object} profileData - Company profile data
   * @return {object} Updated company profile
   */
  saveCompanyProfile(profileData) {
    console.log('Saving company profile');
    
    // Check if company exists
    const existingCompanyIndex = this.companies.findIndex(comp => comp.id === profileData.id);
    
    if (existingCompanyIndex >= 0) {
      // Update existing company
      this.companies[existingCompanyIndex] = {
        ...this.companies[existingCompanyIndex],
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      return this.companies[existingCompanyIndex];
    } else {
      // Create new company
      const newCompany = {
        ...profileData,
        id: profileData.id || `COMP-${this.companies.length + 1}`.padStart(7, '0'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.companies.push(newCompany);
      return newCompany;
    }
  }

  /**
   * Get active opportunities for a user
   * @param {string} userId - User ID
   * @return {array} Active opportunities
   */
  getActiveOpportunities(userId) {
    console.log(`Getting active opportunities for user: ${userId}`);
    
    // For demonstration, return the active bids mapped to opportunities
    return this.activeBids
      .filter(bid => bid.userId === userId)
      .map(bid => {
        const opportunity = this.getOpportunityDetails(bid.opportunityId);
        return {
          ...opportunity,
          bidProgress: bid.progress,
          bidStage: bid.stage,
          bidTeam: bid.team,
          bidDocuments: bid.documents
        };
      });
  }

  /**
   * Get recent activities for a user
   * @param {string} userId - User ID
   * @return {array} Recent activities
   */
  getRecentActivities(userId) {
    console.log(`Getting recent activities for user: ${userId}`);
    
    return this.activities
      .filter(activity => activity.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get team activities
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @return {object} Team activities
   */
  getTeamActivities(userId, page = 1, limit = 20) {
    console.log(`Getting team activities for user: ${userId}`);
    
    // For demonstration, we'll return all activities
    // In a real implementation, this would filter based on team membership
    const activities = [...this.activities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedResults = activities.slice(startIndex, startIndex + limit);
    
    return {
      activities: paginatedResults,
      total: activities.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(activities.length / limit)
    };
  }

  /**
   * Get bids for a user
   * @param {string} userId - User ID
   * @param {string} status - Bid status filter
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @return {object} User bids
   */
  getUserBids(userId, status = 'all', page = 1, limit = 10) {
    console.log(`Getting bids for user: ${userId} with status: ${status}`);
    
    // Combine active bids with historical bid data
    const allBids = [
      ...this.activeBids.map(bid => ({
        ...bid,
        status: 'active'
      })),
      ...this.pastBids
        .filter(bid => {
          // In a real implementation, this would filter based on user association
          // For demo, we're returning all past bids
          return true;
        })
        .map(bid => ({
          ...bid,
          status: bid.outcome === 'Won' ? 'won' : 'lost'
        }))
    ];
    
    // Apply status filter
    let filteredBids = allBids;
    if (status !== 'all') {
      filteredBids = allBids.filter(bid => bid.status === status);
    }
    
    // Sort by date (most recent first)
    filteredBids.sort((a, b) => {
      const dateA = a.bidDate || a.dueDate;
      const dateB = b.bidDate || b.dueDate;
      return new Date(dateB) - new Date(dateA);
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedResults = filteredBids.slice(startIndex, startIndex + limit);
    
    return {
      bids: paginatedResults,
      total: filteredBids.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(filteredBids.length / limit)
    };
  }

  /**
   * Get calendar events for a user
   * @param {string} userId - User ID
   * @param {string} start - Start date (ISO string)
   * @param {string} end - End date (ISO string)
   * @return {array} Calendar events
   */
  getUserCalendarEvents(userId, start, end) {
    console.log(`Getting calendar events for user: ${userId} from ${start} to ${end}`);
    
    let events = this.calendarEvents.filter(event => event.userId === userId);
    
    // Apply date filtering if provided
    if (start) {
      const startDate = new Date(start);
      events = events.filter(event => new Date(event.start) >= startDate);
    }
    
    if (end) {
      const endDate = new Date(end);
      events = events.filter(event => new Date(event.start) <= endDate);
    }
    
    // Sort by date
    events.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    return events;
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {boolean} unreadOnly - Whether to fetch unread notifications only
   * @return {array} User notifications
   */
  getUserNotifications(userId, unreadOnly = false) {
    console.log(`Getting notifications for user: ${userId}, unread only: ${unreadOnly}`);
    
    let notifications = this.notifications.filter(notif => notif.userId === userId);
    
    if (unreadOnly) {
      notifications = notifications.filter(notif => !notif.read);
    }
    
    // Sort by date (most recent first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return notifications;
  }

  /**
   * Mark a notification as read
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   */
  markNotificationRead(userId, notificationId) {
    console.log(`Marking notification ${notificationId} as read for user: ${userId}`);
    
    const notificationIndex = this.notifications.findIndex(
      n => n.id === notificationId && n.userId === userId
    );
    
    if (notificationIndex >= 0) {
      this.notifications[notificationIndex].read = true;
    } else {
      throw new Error(`Notification not found`);
    }
    
    return { success: true };
  }

  /**
   * Get user settings
   * @param {string} userId - User ID
   * @return {object} User settings
   */
  getUserSettings(userId) {
    console.log(`Getting settings for user: ${userId}`);
    
    const user = this.users.find(u => u.id === userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user.settings;
  }

  /**
   * Update user settings
   * @param {string} userId - User ID
   * @param {object} settings - Updated settings
   * @return {object} Updated user settings
   */
  updateUserSettings(userId, settings) {
    console.log(`Updating settings for user: ${userId}`);
    
    const userIndex = this.users.findIndex(u => u.id === userId);
    
    if (userIndex >= 0) {
      this.users[userIndex].settings = {
        ...this.users[userIndex].settings,
        ...settings
      };
      
      return this.users[userIndex].settings;
    } else {
      throw new Error(`User with ID ${userId} not found`);
    }
  }

  /**
   * Fetch data from SAM.gov (simulated)
   * @param {object} params - Search parameters
   * @return {array} Opportunities from SAM.gov
   */
  fetchFromSAMGov(params) {
    console.log(`Fetching data from SAM.gov with params:`, params);
    
    // This is a simulated function - in a real implementation,
    // this would make API calls to SAM.gov or scrape the website
    
    // For demonstration, return a subset of the sample opportunities
    const simulatedResults = this.opportunities.slice(0, 3).map(opp => ({
      ...opp,
      source: 'SAM.gov'
    }));
    
    return simulatedResults;
  }

  /**
   * Scrape a procurement website for data (simulated)
   * @param {string} url - Website URL
   * @return {object} Scraped data
   */
  async scrapeWebsite(url) {
    console.log(`Scraping website: ${url}`);
    
    // This is a simulated function - in a real implementation,
    // this would make HTTP requests and parse HTML
    
    // For demonstration, return a simulated response
    return {
      success: true,
      source: url,
      data: {
        opportunities: [
          {
            title: 'Simulated Opportunity from Web Scraping',
            agency: 'Simulated Agency',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'This is a simulated opportunity from web scraping'
          }
        ]
      }
    };
  }
}

module.exports = DataCollectionModule;