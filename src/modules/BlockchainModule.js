/**
 * Blockchain Module
 * 
 * This module provides secure, immutable record-keeping for procurement activities
 * using a blockchain implementation to ensure data integrity and transparency.
 * 
 * Features:
 * - Secure transaction recording
 * - Immutable bid submission records
 * - Smart contract automation
 * - Multi-party verification
 * - Audit trail generation
 * - Tamper-proof document versioning
 */

const crypto = require('crypto');
const { ethers } = require('ethers');
const { promisify } = require('util');
const logger = require('../utils/logger');

class BlockchainModule {
  constructor() {
    // Initialize blockchain configuration
    this.config = {
      networkProvider: process.env.BLOCKCHAIN_PROVIDER || 'http://localhost:8545',
      contractAddress: process.env.CONTRACT_ADDRESS,
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
      useLocalBlockchain: process.env.USE_LOCAL_BLOCKCHAIN === 'true'
    };
    
    // Initialize blockchain provider and signer
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    
    // Transaction record cache
    this.transactionCache = new Map();
    
    // Block data store (for local blockchain simulation)
    this.blocks = [];
    this.pendingTransactions = [];
    this.genesisBlockCreated = false;
    
    // Initialize the blockchain module
    this.initialize();
    
    logger.info('Blockchain Module initialized');
  }
  
  /**
   * Initialize the blockchain connection or local blockchain
   */
  async initialize() {
    try {
      if (this.config.useLocalBlockchain) {
        // Initialize local blockchain simulation
        await this.initializeLocalBlockchain();
        logger.info('Local blockchain simulation initialized');
      } else {
        // Initialize connection to external blockchain
        await this.initializeBlockchainConnection();
        logger.info('Connected to blockchain network');
      }
    } catch (error) {
      logger.error('Error initializing blockchain module:', error);
    }
  }
  
  /**
   * Initialize connection to external blockchain network
   */
  async initializeBlockchainConnection() {
    try {
      // Connect to blockchain provider
      this.provider = new ethers.providers.JsonRpcProvider(this.config.networkProvider);
      
      // Initialize wallet with private key if available
      if (this.config.privateKey) {
        this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
        logger.debug('Wallet initialized');
      } else {
        logger.warn('No private key provided, operating in read-only mode');
      }
      
      // Connect to smart contract if available
      if (this.config.contractAddress) {
        // Load ABI (Application Binary Interface)
        const abi = require('../../contracts/ProcurementContract.json').abi;
        
        // Initialize contract interface
        this.contract = new ethers.Contract(
          this.config.contractAddress,
          abi,
          this.wallet || this.provider
        );
        
        logger.debug('Smart contract connected');
      } else {
        logger.warn('No contract address provided, smart contract functionality disabled');
      }
      
      logger.info('Blockchain connection initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize blockchain connection:', error);
      throw error;
    }
  }
  
  /**
   * Initialize local blockchain simulation (for testing/development)
   */
  async initializeLocalBlockchain() {
    if (!this.genesisBlockCreated) {
      // Create genesis block
      const genesisBlock = {
        index: 0,
        timestamp: Date.now(),
        transactions: [],
        previousHash: '0',
        hash: '0',
        nonce: 0
      };
      
      // Calculate hash for genesis block
      genesisBlock.hash = this.calculateBlockHash(genesisBlock);
      
      // Add genesis block to chain
      this.blocks.push(genesisBlock);
      this.genesisBlockCreated = true;
      
      logger.debug('Genesis block created');
    }
  }
  
  /**
   * Record a bid submission on the blockchain
   * @param {string} opportunityId - Opportunity ID
   * @param {string} bidderId - Bidder ID
   * @param {Object} bidData - Bid data to record
   * @returns {Object} - Transaction receipt
   */
  async recordBidSubmission(opportunityId, bidderId, bidData) {
    logger.info(`Recording bid submission for opportunity ${opportunityId} by bidder ${bidderId}`);
    
    try {
      // Calculate data hash for bid data
      const dataHash = this.hashData(bidData);
      
      // Prepare transaction data
      const transactionData = {
        type: 'bid_submission',
        opportunityId,
        bidderId,
        dataHash,
        timestamp: Date.now()
      };
      
      if (this.config.useLocalBlockchain) {
        // Add transaction to local blockchain
        return await this.addTransaction(transactionData);
      } else if (this.contract) {
        // Add transaction to external blockchain via smart contract
        const tx = await this.contract.recordBid(
          opportunityId,
          bidderId,
          dataHash,
          { gasLimit: 500000 }
        );
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        
        // Cache the transaction
        this.cacheTransaction(receipt.transactionHash, transactionData);
        
        return {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 1 ? 'success' : 'failed',
          data: transactionData
        };
      } else {
        throw new Error('No blockchain connection or contract available');
      }
    } catch (error) {
      logger.error(`Error recording bid submission for opportunity ${opportunityId}:`, error);
      throw new Error('Failed to record bid submission');
    }
  }
  
  /**
   * Verify a bid submission record on the blockchain
   * @param {string} transactionHash - Transaction hash to verify
   * @param {Object} bidData - Original bid data to verify against
   * @returns {Object} - Verification result
   */
  async verifyBidSubmission(transactionHash, bidData) {
    logger.info(`Verifying bid submission for transaction ${transactionHash}`);
    
    try {
      // Calculate data hash for the provided bid data
      const providedDataHash = this.hashData(bidData);
      
      let storedDataHash;
      let transactionData;
      
      if (this.config.useLocalBlockchain) {
        // Retrieve transaction from local blockchain
        const transaction = await this.getTransaction(transactionHash);
        
        if (!transaction) {
          return {
            verified: false,
            reason: 'Transaction not found'
          };
        }
        
        storedDataHash = transaction.dataHash;
        transactionData = transaction;
      } else if (this.contract) {
        // Retrieve transaction from external blockchain
        const event = await this.contract.queryFilter(
          this.contract.filters.BidRecorded(null, null, null),
          0,
          'latest'
        );
        
        // Find the matching transaction
        const matchingEvent = event.find(e => e.transactionHash === transactionHash);
        
        if (!matchingEvent) {
          return {
            verified: false,
            reason: 'Transaction not found'
          };
        }
        
        storedDataHash = matchingEvent.args.dataHash;
        transactionData = {
          opportunityId: matchingEvent.args.opportunityId,
          bidderId: matchingEvent.args.bidderId,
          timestamp: matchingEvent.args.timestamp.toNumber()
        };
      } else {
        throw new Error('No blockchain connection or contract available');
      }
      
      // Verify data hash
      const isVerified = providedDataHash === storedDataHash;
      
      return {
        verified: isVerified,
        transactionData,
        reason: isVerified ? 'Data hash matches' : 'Data hash does not match'
      };
    } catch (error) {
      logger.error(`Error verifying bid submission for transaction ${transactionHash}:`, error);
      throw new Error('Failed to verify bid submission');
    }
  }
  
  /**
   * Record document version on the blockchain
   * @param {string} documentId - Document ID
   * @param {string} authorId - Author ID
   * @param {Object} documentData - Document data or hash
   * @returns {Object} - Transaction receipt
   */
  async recordDocumentVersion(documentId, authorId, documentData) {
    logger.info(`Recording document version for document ${documentId} by author ${authorId}`);
    
    try {
      // Calculate data hash for document
      const dataHash = this.hashData(documentData);
      
      // Prepare transaction data
      const transactionData = {
        type: 'document_version',
        documentId,
        authorId,
        dataHash,
        timestamp: Date.now()
      };
      
      if (this.config.useLocalBlockchain) {
        // Add transaction to local blockchain
        return await this.addTransaction(transactionData);
      } else if (this.contract) {
        // Add transaction to external blockchain via smart contract
        const tx = await this.contract.recordDocument(
          documentId,
          authorId,
          dataHash,
          { gasLimit: 500000 }
        );
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        
        // Cache the transaction
        this.cacheTransaction(receipt.transactionHash, transactionData);
        
        return {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 1 ? 'success' : 'failed',
          data: transactionData
        };
      } else {
        throw new Error('No blockchain connection or contract available');
      }
    } catch (error) {
      logger.error(`Error recording document version for document ${documentId}:`, error);
      throw new Error('Failed to record document version');
    }
  }
  
  /**
   * Generate an audit trail for an opportunity
   * @param {string} opportunityId - Opportunity ID
   * @returns {Array} - Audit trail of all transactions related to the opportunity
   */
  async generateAuditTrail(opportunityId) {
    logger.info(`Generating audit trail for opportunity ${opportunityId}`);
    
    try {
      if (this.config.useLocalBlockchain) {
        // Get audit trail from local blockchain
        return await this.getOpportunityTransactions(opportunityId);
      } else if (this.contract) {
        // Get audit trail from external blockchain
        const events = await this.contract.queryFilter(
          this.contract.filters.BidRecorded(opportunityId, null, null),
          0,
          'latest'
        );
        
        // Format events into audit trail
        return events.map(event => {
          return {
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            opportunityId: event.args.opportunityId,
            bidderId: event.args.bidderId,
            dataHash: event.args.dataHash,
            timestamp: new Date(event.args.timestamp.toNumber()).toISOString(),
            type: 'bid_submission'
          };
        });
      } else {
        throw new Error('No blockchain connection or contract available');
      }
    } catch (error) {
      logger.error(`Error generating audit trail for opportunity ${opportunityId}:`, error);
      throw new Error('Failed to generate audit trail');
    }
  }
  
  /**
   * Add a transaction to the local blockchain
   * @param {Object} transactionData - Transaction data
   * @returns {Object} - Transaction receipt
   */
  async addTransaction(transactionData) {
    // Add transaction to pending transactions
    const transaction = {
      ...transactionData,
      transactionHash: this.calculateTransactionHash(transactionData)
    };
    
    this.pendingTransactions.push(transaction);
    
    // Mine block if enough transactions are pending (for simulation purposes)
    if (this.pendingTransactions.length >= 5) {
      await this.mineBlock();
    }
    
    // Cache the transaction
    this.cacheTransaction(transaction.transactionHash, transaction);
    
    return {
      transactionHash: transaction.transactionHash,
      blockNumber: this.blocks.length, // Will be updated after mining
      status: 'pending',
      data: transaction
    };
  }
  
  /**
   * Mine a new block for the local blockchain simulation
   * @returns {Object} - The newly mined block
   */
  async mineBlock() {
    // Get the last block
    const lastBlock = this.blocks[this.blocks.length - 1];
    
    // Create new block
    const newBlock = {
      index: lastBlock.index + 1,
      timestamp: Date.now(),
      transactions: [...this.pendingTransactions],
      previousHash: lastBlock.hash,
      nonce: 0
    };
    
    // Mine the block (find valid hash)
    newBlock.hash = await this.mineBlockHash(newBlock);
    
    // Add block to the chain
    this.blocks.push(newBlock);
    
    // Clear pending transactions
    this.pendingTransactions = [];
    
    logger.debug(`Mined new block #${newBlock.index} with ${newBlock.transactions.length} transactions`);
    
    return newBlock;
  }
  
  /**
   * Mine a valid block hash (simplified proof-of-work simulation)
   * @param {Object} block - Block to mine
   * @returns {string} - Valid block hash
   */
  async mineBlockHash(block) {
    const difficulty = '0000'; // Simplified difficulty - first 4 chars must be zeros
    
    while (true) {
      const hash = this.calculateBlockHash(block);
      
      if (hash.startsWith(difficulty)) {
        return hash;
      }
      
      block.nonce++;
    }
  }
  
  /**
   * Calculate hash for a block
   * @param {Object} block - Block data
   * @returns {string} - Block hash
   */
  calculateBlockHash(block) {
    const blockData = JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      transactions: block.transactions,
      previousHash: block.previousHash,
      nonce: block.nonce
    });
    
    return crypto.createHash('sha256').update(blockData).digest('hex');
  }
  
  /**
   * Calculate hash for a transaction
   * @param {Object} transaction - Transaction data
   * @returns {string} - Transaction hash
   */
  calculateTransactionHash(transaction) {
    const transactionData = JSON.stringify(transaction);
    return crypto.createHash('sha256').update(transactionData).digest('hex');
  }
  
  /**
   * Get a transaction from the local blockchain
   * @param {string} transactionHash - Transaction hash
   * @returns {Object|null} - Transaction data or null if not found
   */
  async getTransaction(transactionHash) {
    // Check transaction cache first
    if (this.transactionCache.has(transactionHash)) {
      return this.transactionCache.get(transactionHash);
    }
    
    // Search in pending transactions
    let transaction = this.pendingTransactions.find(tx => tx.transactionHash === transactionHash);
    
    if (transaction) {
      return transaction;
    }
    
    // Search in blocks
    for (const block of this.blocks) {
      transaction = block.transactions.find(tx => tx.transactionHash === transactionHash);
      
      if (transaction) {
        // Cache the transaction for future requests
        this.cacheTransaction(transactionHash, transaction);
        return transaction;
      }
    }
    
    return null;
  }
  
  /**
   * Get all transactions related to an opportunity from the local blockchain
   * @param {string} opportunityId - Opportunity ID
   * @returns {Array} - Transactions related to the opportunity
   */
  async getOpportunityTransactions(opportunityId) {
    const transactions = [];
    
    // Search in pending transactions
    transactions.push(
      ...this.pendingTransactions.filter(tx => tx.opportunityId === opportunityId)
    );
    
    // Search in blocks
    for (const block of this.blocks) {
      transactions.push(
        ...block.transactions.filter(tx => tx.opportunityId === opportunityId)
      );
    }
    
    // Sort by timestamp
    return transactions.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Cache a transaction for faster retrieval
   * @param {string} transactionHash - Transaction hash
   * @param {Object} transaction - Transaction data
   */
  cacheTransaction(transactionHash, transaction) {
    this.transactionCache.set(transactionHash, transaction);
    
    // Limit cache size (simple LRU implementation)
    if (this.transactionCache.size > 1000) {
      const oldestKey = this.transactionCache.keys().next().value;
      this.transactionCache.delete(oldestKey);
    }
  }
  
  /**
   * Hash data to generate a deterministic and verifiable fingerprint
   * @param {Object|string} data - Data to hash
   * @returns {string} - Hash of the data
   */
  hashData(data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
  
  /**
   * Get the current blockchain status
   * @returns {Object} - Status of the blockchain
   */
  getBlockchainStatus() {
    if (this.config.useLocalBlockchain) {
      return {
        type: 'local',
        blockCount: this.blocks.length,
        lastBlockTimestamp: this.blocks[this.blocks.length - 1].timestamp,
        pendingTransactionCount: this.pendingTransactions.length,
        operational: true
      };
    } else {
      return {
        type: 'external',
        provider: this.config.networkProvider,
        contractAddress: this.config.contractAddress,
        walletConnected: !!this.wallet,
        contractConnected: !!this.contract,
        operational: !!this.provider
      };
    }
  }
  
  /**
   * Validate the integrity of the blockchain
   * @returns {Object} - Validation results
   */
  async validateBlockchain() {
    if (!this.config.useLocalBlockchain) {
      // Can't validate external blockchain through this method
      return {
        valid: true,
        message: 'Validation not applicable for external blockchain'
      };
    }
    
    let valid = true;
    const invalidBlocks = [];
    
    // Validate each block in the chain
    for (let i = 1; i < this.blocks.length; i++) {
      const currentBlock = this.blocks[i];
      const previousBlock = this.blocks[i - 1];
      
      // Validate block hash
      const calculatedHash = this.calculateBlockHash(currentBlock);
      if (calculatedHash !== currentBlock.hash) {
        valid = false;
        invalidBlocks.push({
          index: currentBlock.index,
          reason: 'Invalid block hash',
          expected: calculatedHash,
          actual: currentBlock.hash
        });
      }
      
      // Validate previous hash reference
      if (currentBlock.previousHash !== previousBlock.hash) {
        valid = false;
        invalidBlocks.push({
          index: currentBlock.index,
          reason: 'Invalid previous hash reference',
          expected: previousBlock.hash,
          actual: currentBlock.previousHash
        });
      }
    }
    
    return {
      valid,
      blockCount: this.blocks.length,
      invalidBlocks: invalidBlocks.length > 0 ? invalidBlocks : undefined,
      message: valid ? 'Blockchain is valid' : 'Blockchain integrity compromised'
    };
  }
  
  /**
   * Execute a smart contract function
   * @param {string} functionName - Name of the function to execute
   * @param {Array} params - Parameters for the function
   * @returns {Object} - Transaction receipt
   */
  async executeContract(functionName, params = []) {
    logger.info(`Executing smart contract function: ${functionName}`);
    
    if (this.config.useLocalBlockchain) {
      throw new Error('Smart contract execution not supported in local blockchain simulation');
    }
    
    if (!this.contract) {
      throw new Error('No contract connection available');
    }
    
    try {
      // Ensure function exists on contract
      if (typeof this.contract[functionName] !== 'function') {
        throw new Error(`Function ${functionName} does not exist on contract`);
      }
      
      // Execute contract function
      const tx = await this.contract[functionName](...params, { gasLimit: 500000 });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1 ? 'success' : 'failed',
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.events?.map(e => ({
          name: e.event,
          args: e.args
        }))
      };
    } catch (error) {
      logger.error(`Error executing contract function ${functionName}:`, error);
      throw new Error(`Failed to execute contract function: ${error.message}`);
    }
  }
}

module.exports = BlockchainModule;
