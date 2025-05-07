/**
 * AI-Powered Procurement System (AIPS)
 * Sample Data Loader Utility
 * 
 * This utility loads and manages sample data for demonstration purposes.
 * In a production environment, this would be replaced with actual API calls
 * to external data sources and databases.
 * 
 * Based on Ucaretron Inc.'s patent technology for optimizing 
 * public procurement bidding processes through artificial intelligence.
 */

const fs = require('fs');
const path = require('path');

/**
 * Load sample data from JSON files
 * @param {string} dataType - Type of data to load (opportunities, companies, pastBids)
 * @return {array} Loaded data
 */
function loadSampleData(dataType) {
  try {
    // Resolve the path to the data file
    const dataFilePath = path.resolve(__dirname, '../data', `${dataType}.json`);
    
    // Check if the file exists
    if (!fs.existsSync(dataFilePath)) {
      console.warn(`Sample data file not found: ${dataFilePath}`);
      return [];
    }
    
    // Read and parse the file
    const rawData = fs.readFileSync(dataFilePath, 'utf8');
    const parsedData = JSON.parse(rawData);
    
    // Return the array of data
    return parsedData[dataType] || [];
  } catch (error) {
    console.error(`Error loading sample data (${dataType}):`, error);
    return [];
  }
}

/**
 * Save sample data to JSON files
 * @param {string} dataType - Type of data to save (opportunities, companies, pastBids)
 * @param {array} data - Data to save
 * @return {boolean} Success status
 */
function saveSampleData(dataType, data) {
  try {
    // Resolve the path to the data file
    const dataFilePath = path.resolve(__dirname, '../data', `${dataType}.json`);
    
    // Create the data directory if it doesn't exist
    const dataDir = path.dirname(dataFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Format the data
    const formattedData = {
      [dataType]: data
    };
    
    // Write the data to the file
    fs.writeFileSync(dataFilePath, JSON.stringify(formattedData, null, 2), 'utf8');
    
    return true;
  } catch (error) {
    console.error(`Error saving sample data (${dataType}):`, error);
    return false;
  }
}

/**
 * Generate unique ID
 * @param {string} prefix - ID prefix
 * @return {string} Generated ID
 */
function generateId(prefix = 'ID') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

module.exports = {
  loadSampleData,
  saveSampleData,
  generateId
};