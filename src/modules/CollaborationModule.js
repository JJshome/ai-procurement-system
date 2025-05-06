/**
 * Collaboration Module
 * 
 * This module provides real-time collaboration features for teams working 
 * on procurement bids, enabling efficient communication and document sharing.
 * 
 * Features:
 * - Real-time document editing
 * - Team messaging and notifications
 * - Task assignment and tracking
 * - Version control and change tracking
 * - Comment and feedback system
 * - AI-powered collaboration assistant
 */

const socketIO = require('socket.io');
const http = require('http');
const ShareDB = require('sharedb');
const richText = require('rich-text');
const mongodb = require('mongodb');
const WebSocket = require('websocket').server;
const { OpenAI } = require('openai');
const logger = require('../utils/logger');

// Register rich text type for collaborative editing
ShareDB.types.register(richText.type);

class CollaborationModule {
  constructor(app, server) {
    // Store the Express app and HTTP server
    this.app = app;
    this.server = server || http.createServer(app);
    
    // Initialize collaboration components
    this.io = null;
    this.shareDBBackend = null;
    this.shareDBConnection = null;
    
    // AI assistant for collaboration
    this.openai = null;
    
    // Active users and projects tracking
    this.activeUsers = new Map();
    this.activeDocuments = new Map();
    this.userSessions = new Map();
    
    // Initialize module
    this.initialize();
    
    logger.info('Collaboration Module initialized');
  }
  
  /**
   * Initialize the collaboration module components
   */
  async initialize() {
    try {
      // Initialize OpenAI connection for collaboration assistant
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        logger.debug('OpenAI initialized for collaboration assistant');
      }
      
      // Initialize ShareDB backend
      await this.initializeShareDB();
      
      // Initialize Socket.IO for real-time communication
      this.initializeSocketIO();
      
      logger.info('Collaboration module components initialized successfully');
    } catch (error) {
      logger.error('Error initializing collaboration module:', error);
    }
  }
  
  /**
   * Initialize ShareDB for real-time document collaboration
   */
  async initializeShareDB() {
    try {
      // Create ShareDB backend
      const db = await this.connectToDatabase();
      
      if (db) {
        // Use MongoDB adapter if database connection is available
        const mongoDBAdapter = new ShareDB.DB.MongoDBAdapter(db);
        this.shareDBBackend = new ShareDB({db: mongoDBAdapter});
      } else {
        // Use in-memory adapter as fallback
        logger.warn('Using in-memory ShareDB adapter - data will not persist');
        this.shareDBBackend = new ShareDB();
      }
      
      // Create connection to ShareDB backend
      this.shareDBConnection = this.shareDBBackend.connect();
      
      // Attach WebSocket server for ShareDB
      const webSocketServer = new WebSocket({
        httpServer: this.server,
        autoAcceptConnections: false
      });
      
      // Handle WebSocket connections
      webSocketServer.on('request', (request) => {
        if (!this.originIsAllowed(request.origin)) {
          request.reject();
          logger.warn(`ShareDB WebSocket connection from origin ${request.origin} rejected`);
          return;
        }
        
        const connection = request.accept('sharedb', request.origin);
        
        // Create ShareDB agent for client connection
        const agent = this.shareDBBackend.listen(connection);
        
        // Handle connection close
        connection.on('close', () => {
          logger.debug('ShareDB WebSocket connection closed');
        });
      });
      
      logger.info('ShareDB initialized successfully');
    } catch (error) {
      logger.error('Error initializing ShareDB:', error);
      throw error;
    }
  }
  
  /**
   * Connect to MongoDB database
   * @returns {Object|null} - MongoDB database connection or null if failed
   */
  async connectToDatabase() {
    // Check if MongoDB connection string is available
    const mongoUrl = process.env.MONGODB_URL;
    
    if (!mongoUrl) {
      logger.warn('No MongoDB connection string provided');
      return null;
    }
    
    try {
      // Connect to MongoDB
      const client = await mongodb.MongoClient.connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      // Get database
      const db = client.db(process.env.MONGODB_DB || 'procurement_system');
      logger.info('Connected to MongoDB database');
      return db;
    } catch (error) {
      logger.error('Error connecting to MongoDB:', error);
      return null;
    }
  }
  
  /**
   * Initialize Socket.IO for real-time communication
   */
  initializeSocketIO() {
    // Create Socket.IO server
    this.io = socketIO(this.server, {
      cors: {
        origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    // Handle Socket.IO connections
    this.io.on('connection', (socket) => {
      logger.debug(`New Socket.IO connection: ${socket.id}`);
      
      // Handle user authentication
      socket.on('authenticate', (userData) => {
        this.handleUserAuthentication(socket, userData);
      });
      
      // Handle joining a document collaboration
      socket.on('join_document', (documentData) => {
        this.handleJoinDocument(socket, documentData);
      });
      
      // Handle message sending
      socket.on('send_message', (messageData) => {
        this.handleSendMessage(socket, messageData);
      });
      
      // Handle task creation
      socket.on('create_task', (taskData) => {
        this.handleCreateTask(socket, taskData);
      });
      
      // Handle task updates
      socket.on('update_task', (taskData) => {
        this.handleUpdateTask(socket, taskData);
      });
      
      // Handle AI assistant request
      socket.on('ai_assistant', (assistantData) => {
        this.handleAIAssistant(socket, assistantData);
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket);
      });
    });
    
    logger.info('Socket.IO initialized successfully');
  }
  
  /**
   * Check if WebSocket connection origin is allowed
   * @param {string} origin - Connection origin
   * @returns {boolean} - Whether origin is allowed
   */
  originIsAllowed(origin) {
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Check allowed origins in production
    const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
    
    return allowedOrigins.includes(origin);
  }
  
  /**
   * Handle user authentication
   * @param {Object} socket - Socket.IO socket
   * @param {Object} userData - User authentication data
   */
  handleUserAuthentication(socket, userData) {
    // Validate user data
    if (!userData || !userData.userId || !userData.username) {
      socket.emit('auth_error', { message: 'Invalid authentication data' });
      return;
    }
    
    // Associate socket with user
    socket.userId = userData.userId;
    socket.username = userData.username;
    
    // Add user to active users
    this.activeUsers.set(userData.userId, {
      socketId: socket.id,
      username: userData.username,
      lastActive: new Date()
    });
    
    // Add socket to user sessions
    if (!this.userSessions.has(userData.userId)) {
      this.userSessions.set(userData.userId, new Set());
    }
    this.userSessions.get(userData.userId).add(socket.id);
    
    // Send authentication success
    socket.emit('auth_success', {
      userId: userData.userId,
      username: userData.username
    });
    
    logger.info(`User authenticated: ${userData.username} (${userData.userId})`);
  }
  
  /**
   * Handle user disconnection
   * @param {Object} socket - Socket.IO socket
   */
  handleUserDisconnect(socket) {
    const userId = socket.userId;
    
    if (userId) {
      // Remove socket from user sessions
      if (this.userSessions.has(userId)) {
        this.userSessions.get(userId).delete(socket.id);
        
        // If no more sessions, remove user from active users
        if (this.userSessions.get(userId).size === 0) {
          this.activeUsers.delete(userId);
          this.userSessions.delete(userId);
        }
      }
      
      // Remove user from active documents
      for (const [documentId, users] of this.activeDocuments.entries()) {
        if (users.has(userId)) {
          users.delete(userId);
          
          // Notify other users
          this.io.to(`document:${documentId}`).emit('user_left', {
            userId,
            username: socket.username
          });
          
          // If no more users, cleanup document
          if (users.size === 0) {
            this.activeDocuments.delete(documentId);
          }
        }
      }
      
      logger.debug(`User disconnected: ${socket.username} (${userId})`);
    }
  }
  
  /**
   * Handle joining a document collaboration
   * @param {Object} socket - Socket.IO socket
   * @param {Object} documentData - Document data
   */
  handleJoinDocument(socket, documentData) {
    // Validate document data
    if (!documentData || !documentData.documentId) {
      socket.emit('join_error', { message: 'Invalid document data' });
      return;
    }
    
    const { documentId, projectId } = documentData;
    const userId = socket.userId;
    
    if (!userId) {
      socket.emit('join_error', { message: 'Not authenticated' });
      return;
    }
    
    // Join document room
    socket.join(`document:${documentId}`);
    
    // Add user to active document
    if (!this.activeDocuments.has(documentId)) {
      this.activeDocuments.set(documentId, new Set());
    }
    this.activeDocuments.get(documentId).add(userId);
    
    // Get document from ShareDB
    const doc = this.shareDBConnection.get('documents', documentId);
    
    // Subscribe to document
    doc.subscribe((err) => {
      if (err) {
        socket.emit('join_error', { message: 'Error accessing document' });
        logger.error(`Error subscribing to document ${documentId}:`, err);
        return;
      }
      
      // Create document if it doesn't exist
      if (!doc.type) {
        doc.create([{ insert: '' }], 'rich-text', (createErr) => {
          if (createErr) {
            socket.emit('join_error', { message: 'Error creating document' });
            logger.error(`Error creating document ${documentId}:`, createErr);
            return;
          }
          
          this.completeDocumentJoin(socket, doc, documentId, documentData);
        });
      } else {
        this.completeDocumentJoin(socket, doc, documentId, documentData);
      }
    });
  }
  
  /**
   * Complete document join process
   * @param {Object} socket - Socket.IO socket
   * @param {Object} doc - ShareDB document
   * @param {string} documentId - Document ID
   * @param {Object} documentData - Document data
   */
  completeDocumentJoin(socket, doc, documentId, documentData) {
    // Get active users in document
    const activeUsers = Array.from(this.activeDocuments.get(documentId) || [])
      .map(userId => {
        const user = this.activeUsers.get(userId);
        return user ? { userId, username: user.username } : null;
      })
      .filter(user => user !== null);
    
    // Send document data to user
    socket.emit('document_joined', {
      documentId,
      projectId: documentData.projectId,
      content: doc.data,
      activeUsers
    });
    
    // Notify other users
    socket.to(`document:${documentId}`).emit('user_joined', {
      userId: socket.userId,
      username: socket.username
    });
    
    logger.debug(`User ${socket.username} joined document ${documentId}`);
  }
  
  /**
   * Handle sending a message
   * @param {Object} socket - Socket.IO socket
   * @param {Object} messageData - Message data
   */
  handleSendMessage(socket, messageData) {
    // Validate message data
    if (!messageData || !messageData.content || !messageData.roomId) {
      socket.emit('message_error', { message: 'Invalid message data' });
      return;
    }
    
    const userId = socket.userId;
    
    if (!userId) {
      socket.emit('message_error', { message: 'Not authenticated' });
      return;
    }
    
    const { content, roomId, messageType = 'text' } = messageData;
    
    // Create message object
    const message = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      userId,
      username: socket.username,
      content,
      type: messageType,
      timestamp: new Date().toISOString(),
      roomId
    };
    
    // Broadcast message to room
    this.io.to(roomId).emit('new_message', message);
    
    logger.debug(`Message sent by ${socket.username} in room ${roomId}`);
  }
  
  /**
   * Handle creating a task
   * @param {Object} socket - Socket.IO socket
   * @param {Object} taskData - Task data
   */
  handleCreateTask(socket, taskData) {
    // Validate task data
    if (!taskData || !taskData.title || !taskData.projectId) {
      socket.emit('task_error', { message: 'Invalid task data' });
      return;
    }
    
    const userId = socket.userId;
    
    if (!userId) {
      socket.emit('task_error', { message: 'Not authenticated' });
      return;
    }
    
    // Create task object
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      title: taskData.title,
      description: taskData.description || '',
      projectId: taskData.projectId,
      assigneeId: taskData.assigneeId || null,
      creatorId: userId,
      creatorName: socket.username,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Broadcast task to project room
    this.io.to(`project:${taskData.projectId}`).emit('new_task', task);
    
    // If task is assigned, notify assignee
    if (task.assigneeId) {
      this.sendNotificationToUser(task.assigneeId, {
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${task.title}`,
        data: { taskId: task.id }
      });
    }
    
    logger.debug(`Task created by ${socket.username} in project ${taskData.projectId}`);
  }
  
  /**
   * Handle updating a task
   * @param {Object} socket - Socket.IO socket
   * @param {Object} taskData - Task data
   */
  handleUpdateTask(socket, taskData) {
    // Validate task data
    if (!taskData || !taskData.id || !taskData.projectId) {
      socket.emit('task_error', { message: 'Invalid task data' });
      return;
    }
    
    const userId = socket.userId;
    
    if (!userId) {
      socket.emit('task_error', { message: 'Not authenticated' });
      return;
    }
    
    // Update task object
    const task = {
      ...taskData,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      updatedByName: socket.username
    };
    
    // Broadcast task update to project room
    this.io.to(`project:${taskData.projectId}`).emit('task_updated', task);
    
    // If task assignee changed, notify new assignee
    if (taskData.assigneeChanged && taskData.assigneeId) {
      this.sendNotificationToUser(taskData.assigneeId, {
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `You have been assigned a task: ${task.title}`,
        data: { taskId: task.id }
      });
    }
    
    // If task status changed to completed, notify creator
    if (taskData.statusChanged && task.status === 'completed' && task.creatorId !== userId) {
      this.sendNotificationToUser(task.creatorId, {
        type: 'task_completed',
        title: 'Task Completed',
        message: `Your task "${task.title}" has been completed by ${socket.username}`,
        data: { taskId: task.id }
      });
    }
    
    logger.debug(`Task ${taskData.id} updated by ${socket.username}`);
  }
  
  /**
   * Handle AI assistant request
   * @param {Object} socket - Socket.IO socket
   * @param {Object} assistantData - Assistant request data
   */
  async handleAIAssistant(socket, assistantData) {
    // Validate assistant data
    if (!assistantData || !assistantData.query) {
      socket.emit('assistant_error', { message: 'Invalid assistant request' });
      return;
    }
    
    const userId = socket.userId;
    
    if (!userId) {
      socket.emit('assistant_error', { message: 'Not authenticated' });
      return;
    }
    
    // Check if OpenAI is initialized
    if (!this.openai) {
      socket.emit('assistant_error', { message: 'AI assistant not available' });
      return;
    }
    
    try {
      // Send query to OpenAI
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant specialized in procurement bidding processes. 
            Your goal is to help the team collaborate effectively on their bid documents and tasks. 
            Provide concise, helpful responses focused on procurement, proposal writing, and team coordination.
            Context: The user is working on a bid document for a government procurement opportunity.`
          },
          { role: "user", content: assistantData.query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      // Send response to user
      socket.emit('assistant_response', {
        query: assistantData.query,
        response: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      });
      
      logger.debug(`AI assistant response generated for ${socket.username}`);
    } catch (error) {
      logger.error('Error generating AI assistant response:', error);
      socket.emit('assistant_error', { 
        message: 'Error generating response', 
        details: error.message 
      });
    }
  }
  
  /**
   * Send notification to a specific user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  sendNotificationToUser(userId, notification) {
    // Check if user has active sessions
    if (this.userSessions.has(userId)) {
      const sockets = this.userSessions.get(userId);
      
      // Send notification to all user's sockets
      for (const socketId of sockets) {
        this.io.to(socketId).emit('notification', {
          ...notification,
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          timestamp: new Date().toISOString()
        });
      }
      
      logger.debug(`Notification sent to user ${userId}`);
    }
  }
  
  /**
   * Create a new collaborative document
   * @param {string} documentId - Document ID
   * @param {Object} metadata - Document metadata
   * @returns {Promise<Object>} - Created document
   */
  async createDocument(documentId, metadata = {}) {
    return new Promise((resolve, reject) => {
      const doc = this.shareDBConnection.get('documents', documentId);
      
      doc.fetch((err) => {
        if (err) {
          logger.error(`Error fetching document ${documentId}:`, err);
          return reject(err);
        }
        
        // Check if document already exists
        if (doc.type) {
          logger.warn(`Document ${documentId} already exists`);
          return resolve({ documentId, exists: true });
        }
        
        // Create document with empty content
        doc.create([{ insert: '' }], 'rich-text', (createErr) => {
          if (createErr) {
            logger.error(`Error creating document ${documentId}:`, createErr);
            return reject(createErr);
          }
          
          // Create metadata document
          const metaDoc = this.shareDBConnection.get('document_metadata', documentId);
          
          metaDoc.fetch((metaErr) => {
            if (metaErr) {
              logger.error(`Error fetching metadata for document ${documentId}:`, metaErr);
              return resolve({ documentId, exists: false });
            }
            
            // Create metadata document
            const metaData = {
              ...metadata,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            metaDoc.create(metaData, (metaCreateErr) => {
              if (metaCreateErr) {
                logger.error(`Error creating metadata for document ${documentId}:`, metaCreateErr);
              }
              
              resolve({ documentId, exists: false, metadata: metaData });
            });
          });
        });
      });
    });
  }
  
  /**
   * Get document content and metadata
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} - Document content and metadata
   */
  async getDocument(documentId) {
    return new Promise((resolve, reject) => {
      const doc = this.shareDBConnection.get('documents', documentId);
      
      doc.fetch((err) => {
        if (err) {
          logger.error(`Error fetching document ${documentId}:`, err);
          return reject(err);
        }
        
        // Check if document exists
        if (!doc.type) {
          logger.warn(`Document ${documentId} does not exist`);
          return resolve(null);
        }
        
        // Get metadata
        const metaDoc = this.shareDBConnection.get('document_metadata', documentId);
        
        metaDoc.fetch((metaErr) => {
          let metadata = {};
          
          if (metaErr) {
            logger.error(`Error fetching metadata for document ${documentId}:`, metaErr);
          } else if (metaDoc.type) {
            metadata = metaDoc.data;
          }
          
          resolve({
            documentId,
            content: doc.data,
            metadata
          });
        });
      });
    });
  }
  
  /**
   * Get active collaborators for a document
   * @param {string} documentId - Document ID
   * @returns {Array} - List of active collaborators
   */
  getDocumentCollaborators(documentId) {
    const collaborators = [];
    
    // Get active users in document
    const activeUserIds = this.activeDocuments.get(documentId) || new Set();
    
    for (const userId of activeUserIds) {
      const user = this.activeUsers.get(userId);
      
      if (user) {
        collaborators.push({
          userId,
          username: user.username,
          lastActive: user.lastActive
        });
      }
    }
    
    return collaborators;
  }
  
  /**
   * Create a new chat room
   * @param {string} roomId - Room ID
   * @param {string} name - Room name
   * @param {string} type - Room type (project, document, team)
   * @param {Array} members - Room members
   * @returns {Object} - Created room
   */
  createChatRoom(roomId, name, type, members = []) {
    // Create room
    const room = {
      id: roomId,
      name,
      type,
      members,
      createdAt: new Date().toISOString()
    };
    
    // Notify members
    for (const userId of members) {
      this.sendNotificationToUser(userId, {
        type: 'room_created',
        title: 'New Chat Room',
        message: `You have been added to the chat room: ${name}`,
        data: { roomId }
      });
    }
    
    logger.debug(`Chat room ${roomId} created`);
    
    return room;
  }
  
  /**
   * Get the status of the collaboration module
   * @returns {Object} - Status of the module
   */
  getStatus() {
    return {
      activeUsers: this.activeUsers.size,
      activeDocuments: this.activeDocuments.size,
      userSessions: this.userSessions.size,
      shareDBConnected: !!this.shareDBConnection,
      socketIOConnected: !!this.io,
      aiAssistantAvailable: !!this.openai
    };
  }
  
  /**
   * Stop the collaboration module
   */
  async stop() {
    // Close all Socket.IO connections
    if (this.io) {
      const sockets = await this.io.fetchSockets();
      
      for (const socket of sockets) {
        socket.disconnect(true);
      }
      
      this.io.close();
    }
    
    // Close ShareDB connections
    if (this.shareDBBackend) {
      this.shareDBBackend.close();
    }
    
    logger.info('Collaboration module stopped');
  }
}

module.exports = CollaborationModule;
