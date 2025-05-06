/**
 * Data Collection Module
 * 
 * This module is responsible for gathering procurement data from various sources,
 * including government procurement platforms like SAM.gov, and processing this data
 * for further analysis.
 * 
 * Features:
 * - Real-time data collection from multiple procurement platforms
 * - Advanced data cleansing and normalization
 * - Multi-language processing capabilities
 * - Intelligent categorization of opportunities
 * - Company profile matching
 */

const axios = require('axios');
const cheerio = require('cheerio');
const natural = require('natural');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class DataCollectionModule {
  constructor() {
    this.sources = [
      {
        id: 'sam_gov',
        name: 'SAM.gov',
        url: 'https://sam.gov/data-services/contract-opportunities',
        apiEndpoint: process.env.SAM_GOV_API_ENDPOINT,
        apiKey: process.env.SAM_GOV_API_KEY,
        type: 'api'
      },
      {
        id: 'usaspending',
        name: 'USASpending.gov',
        url: 'https://www.usaspending.gov/api',
        apiEndpoint: process.env.USASPENDING_API_ENDPOINT,
        apiKey: process.env.USASPENDING_API_KEY,
        type: 'api'
      },
      {
        id: 'ted_europa',
        name: 'TED (Tenders Electronic Daily)',
        url: 'https://ted.europa.eu/TED/browse/browseByMap.do',
        type: 'scraper'
      },
      // More sources can be added here
    ];
    
    // Initialize NLP tokenizer for text processing
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    
    // Initialize data storage
    this.opportunities = new Map();
    this.lastUpdated = null;
    
    logger.info('Data Collection Module initialized');
  }
  
  /**
   * Fetch procurement opportunities from all configured sources
   * @param {Object} filters - Optional filters to apply to the search
   * @returns {Promise<Array>} - Array of procurement opportunities
   */
  async fetchOpportunities(filters = {}) {
    logger.info('Fetching procurement opportunities', { filters });
    
    const results = [];
    const fetchPromises = this.sources.map(source => this.fetchFromSource(source, filters));
    
    try {
      const sourceResults = await Promise.allSettled(fetchPromises);
      
      sourceResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const sourceData = result.value;
          results.push(...sourceData);
          logger.info(`Successfully fetched ${sourceData.length} opportunities from ${this.sources[index].name}`);
        } else {
          logger.error(`Failed to fetch from ${this.sources[index].name}:`, result.reason);
        }
      });
      
      // Process and normalize the collected data
      const normalizedResults = this.normalizeData(results);
      
      // Update internal storage
      normalizedResults.forEach(opp => {
        this.opportunities.set(opp.id, opp);
      });
      
      this.lastUpdated = new Date();
      
      return normalizedResults;
    } catch (error) {
      logger.error('Error fetching procurement opportunities:', error);
      throw new Error('Failed to fetch procurement opportunities');
    }
  }
  
  /**
   * Fetch data from a specific source
   * @param {Object} source - Source configuration
   * @param {Object} filters - Filters to apply
   * @returns {Promise<Array>} - Procurement opportunities from this source
   */
  async fetchFromSource(source, filters) {
    logger.debug(`Fetching from source: ${source.name}`);
    
    if (source.type === 'api') {
      return this.fetchFromAPI(source, filters);
    } else if (source.type === 'scraper') {
      return this.scrapeFromWebsite(source, filters);
    } else {
      logger.warn(`Unknown source type: ${source.type} for ${source.name}`);
      return [];
    }
  }
  
  /**
   * Fetch data from an API source
   * @param {Object} source - API source configuration
   * @param {Object} filters - Filters to apply
   * @returns {Promise<Array>} - Procurement opportunities from this API
   */
  async fetchFromAPI(source, filters) {
    try {
      // Construct API request with appropriate parameters
      const params = this.constructAPIParams(source, filters);
      
      const response = await axios.get(source.apiEndpoint, {
        params,
        headers: {
          'X-Api-Key': source.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 200 && response.data) {
        // Transform the API-specific response to our standard format
        return this.transformAPIResponse(source, response.data);
      } else {
        logger.warn(`Unexpected response from ${source.name}: ${response.status}`);
        return [];
      }
    } catch (error) {
      logger.error(`API fetch error for ${source.name}:`, error);
      return [];
    }
  }
  
  /**
   * Scrape data from a website source
   * @param {Object} source - Website source configuration
   * @param {Object} filters - Filters to apply
   * @returns {Promise<Array>} - Procurement opportunities from this website
   */
  async scrapeFromWebsite(source, filters) {
    try {
      // Construct the URL with appropriate parameters
      const url = this.constructScraperURL(source, filters);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'AIPS Data Collection Bot/1.0'
        }
      });
      
      if (response.status === 200 && response.data) {
        // Parse the HTML response
        const $ = cheerio.load(response.data);
        
        // Extract procurement opportunities
        return this.extractOpportunitiesFromHTML(source, $);
      } else {
        logger.warn(`Unexpected response from ${source.name}: ${response.status}`);
        return [];
      }
    } catch (error) {
      logger.error(`Scraper error for ${source.name}:`, error);
      return [];
    }
  }
  
  /**
   * Normalize data from different sources into a standard format
   * @param {Array} data - Raw data from various sources
   * @returns {Array} - Normalized data
   */
  normalizeData(data) {
    return data.map(item => {
      // Ensure each opportunity has a unique ID
      const id = item.id || uuidv4();
      
      // Normalize dates to ISO format
      const publishDate = item.publishDate ? new Date(item.publishDate).toISOString() : null;
      const closeDate = item.closeDate ? new Date(item.closeDate).toISOString() : null;
      
      // Extract keywords from description
      const keywords = this.extractKeywords(item.description || '');
      
      return {
        id,
        source: item.source,
        sourceId: item.sourceId,
        title: item.title || 'Untitled Opportunity',
        description: item.description || '',
        publishDate,
        closeDate,
        agency: item.agency || item.organization || 'Unknown Agency',
        type: item.type || 'Unknown',
        category: item.category || 'Uncategorized',
        value: item.value || null,
        location: item.location || 'Not specified',
        keywords,
        contactInfo: item.contactInfo || null,
        url: item.url || null,
        documents: item.documents || [],
        status: item.status || 'active',
        lastUpdated: new Date().toISOString()
      };
    });
  }
  
  /**
   * Extract keywords from text using NLP
   * @param {string} text - Input text
   * @returns {Array} - Extracted keywords
   */
  extractKeywords(text) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    
    // Remove stop words
    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by']);
    const filteredTokens = tokens.filter(token => !stopWords.has(token) && token.length > 2);
    
    // Stem words and count frequencies
    const stemmed = filteredTokens.map(token => this.stemmer.stem(token));
    const frequencies = stemmed.reduce((acc, token) => {
      acc[token] = (acc[token] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array and sort by frequency
    const sortedKeywords = Object.entries(frequencies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword]) => keyword);
    
    return sortedKeywords;
  }
  
  /**
   * Get opportunity by ID
   * @param {string} id - Opportunity ID
   * @returns {Object|null} - Opportunity data or null if not found
   */
  getOpportunityById(id) {
    return this.opportunities.has(id) ? this.opportunities.get(id) : null;
  }
  
  /**
   * Search opportunities by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array} - Matching opportunities
   */
  searchOpportunities(criteria = {}) {
    const results = [];
    
    for (const opp of this.opportunities.values()) {
      let match = true;
      
      // Check if opportunity matches all criteria
      for (const [key, value] of Object.entries(criteria)) {
        if (key === 'keyword') {
          // Special case for keyword search
          const hasKeyword = opp.title.toLowerCase().includes(value.toLowerCase()) || 
                             opp.description.toLowerCase().includes(value.toLowerCase()) ||
                             opp.keywords.some(k => k.includes(value.toLowerCase()));
          
          if (!hasKeyword) {
            match = false;
            break;
          }
        } else if (key === 'minValue') {
          if (!opp.value || opp.value < value) {
            match = false;
            break;
          }
        } else if (key === 'maxValue') {
          if (!opp.value || opp.value > value) {
            match = false;
            break;
          }
        } else if (opp[key] !== value) {
          match = false;
          break;
        }
      }
      
      if (match) {
        results.push(opp);
      }
    }
    
    return results;
  }
  
  /**
   * Get statistics about collected data
   * @returns {Object} - Collection statistics
   */
  getStatistics() {
    const totalOpportunities = this.opportunities.size;
    const bySource = {};
    const byCategory = {};
    const byAgency = {};
    
    for (const opp of this.opportunities.values()) {
      // Count by source
      bySource[opp.source] = (bySource[opp.source] || 0) + 1;
      
      // Count by category
      byCategory[opp.category] = (byCategory[opp.category] || 0) + 1;
      
      // Count by agency
      byAgency[opp.agency] = (byAgency[opp.agency] || 0) + 1;
    }
    
    return {
      totalOpportunities,
      bySource,
      byCategory,
      byAgency,
      lastUpdated: this.lastUpdated
    };
  }
  
  // Helper methods (implementation details)
  constructAPIParams(source, filters) {
    // Implement source-specific parameter mapping
    const params = {};
    
    if (source.id === 'sam_gov') {
      params.api_key = source.apiKey;
      params.postedFrom = filters.fromDate;
      params.postedTo = filters.toDate;
      params.keyword = filters.keyword;
      // Add more SAM.gov specific parameters
    } else if (source.id === 'usaspending') {
      params.page = 1;
      params.limit = 100;
      params.sort = 'published_date';
      params.order = 'desc';
      // Add more USASpending specific parameters
    }
    
    return params;
  }
  
  constructScraperURL(source, filters) {
    // Implement source-specific URL construction
    let url = source.url;
    
    if (source.id === 'ted_europa') {
      if (filters.keyword) {
        url += `?keywords=${encodeURIComponent(filters.keyword)}`;
      }
      // Add more TED specific URL parameters
    }
    
    return url;
  }
  
  transformAPIResponse(source, data) {
    // Transform API-specific response to standard format
    const transformed = [];
    
    if (source.id === 'sam_gov') {
      const opportunities = data.opportunitiesData || [];
      
      opportunities.forEach(opp => {
        transformed.push({
          id: opp.noticeId,
          source: source.name,
          sourceId: opp.noticeId,
          title: opp.title,
          description: opp.description,
          publishDate: opp.publishDate,
          closeDate: opp.responseDeadline,
          agency: opp.departmentAgency,
          type: opp.noticeType,
          category: opp.classificationCode,
          value: opp.baseAndAllOptionsValue,
          location: opp.placeOfPerformance,
          contactInfo: opp.primaryContactInfo,
          url: `https://sam.gov/opp/${opp.noticeId}/view`,
          documents: opp.attachments || [],
          status: opp.status
        });
      });
    } else if (source.id === 'usaspending') {
      // Implement USASpending.gov specific transformation
    }
    
    return transformed;
  }
  
  extractOpportunitiesFromHTML(source, $) {
    const opportunities = [];
    
    if (source.id === 'ted_europa') {
      // Example TED scraper implementation
      $('.tender-notice').each((i, el) => {
        const title = $(el).find('.tender-title').text().trim();
        const id = $(el).attr('data-notice-id');
        const publishDate = $(el).find('.publish-date').text().trim();
        const closeDate = $(el).find('.close-date').text().trim();
        const agency = $(el).find('.contracting-authority').text().trim();
        const description = $(el).find('.description').text().trim();
        const url = $(el).find('a.notice-link').attr('href');
        
        opportunities.push({
          id,
          source: source.name,
          sourceId: id,
          title,
          description,
          publishDate,
          closeDate,
          agency,
          url: url ? `https://ted.europa.eu${url}` : null
        });
      });
    }
    
    return opportunities;
  }
}

module.exports = DataCollectionModule;
