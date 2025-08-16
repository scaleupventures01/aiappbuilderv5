/**
 * Message Management API Endpoints - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.4-messages-table.md
 * Task: BE-MSG-012 - Message CRUD API endpoints with full-text search and threading
 * Created: 2025-08-14
 * 
 * Complete message management API with create, list, get, update operations,
 * full-text search, message threading, AI verdict system, and proper security/validation.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { 
  createMessage,
  getMessageById,
  getConversationMessages,
  updateMessage,
  deleteMessage,
  searchMessages,
  getMessageThread,
  getChildMessages,
  getMessagesByVerdict,
  getPsychologyMessages,
  getMessageStats,
  updateAiResults,
  markMessageAsFailed
} from '../../db/queries/messages.js';
import { 
  authenticateToken,
  requireEmailVerification,
  premiumRateLimitBypass 
} from '../../middleware/auth.js';
import { updateLastActive } from '../../db/queries/users.js';
import { getConversationById } from '../../db/queries/conversations.js';
import Message from '../../models/Message.js';
import { emitToRoom } from '../../server/websocket/socket-manager.js';

const router = express.Router();

// Rate limiting for message operations
const messageRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window per IP
  message: {
    success: false,
    error: 'Too many message requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  skip: (req) => req.isPremiumUser === true
});

// Stricter rate limit for message creation
const createRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 message creations per minute per IP
  message: {
    success: false,
    error: 'Too many message creations. Please try again in a minute.',
    code: 'CREATE_RATE_LIMIT'
  },
  skip: (req) => req.isPremiumUser === true
});

// Rate limit for search operations
const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 searches per minute per IP
  message: {
    success: false,
    error: 'Too many search requests. Please try again in a minute.',
    code: 'SEARCH_RATE_LIMIT'
  },
  skip: (req) => req.isPremiumUser === true
});

/**
 * Validate message creation data
 * @param {Object} messageData - Message data to validate
 * @returns {Object} Validation result
 */
function validateMessageData(messageData) {
  const errors = [];
  const allowedFields = [
    'conversation_id', 'content', 'type', 'parent_message_id',
    'verdict', 'confidence', 'analysis_mode', 'image_url', 'image_filename',
    'image_size', 'image_metadata', 'emotional_state', 'coaching_type',
    'pattern_tags', 'ai_model', 'ai_tokens_used', 'ai_cost_cents',
    'processing_time_ms', 'status'
  ];
  
  // Check for disallowed fields
  const providedFields = Object.keys(messageData);
  const disallowedFields = providedFields.filter(field => !allowedFields.includes(field));
  
  if (disallowedFields.length > 0) {
    errors.push(`Invalid fields: ${disallowedFields.join(', ')}`);
  }
  
  // Required fields validation
  if (!messageData.conversation_id) {
    errors.push('Conversation ID is required');
  } else if (!Message.validateUUID(messageData.conversation_id)) {
    errors.push('Conversation ID must be a valid UUID');
  }
  
  if (!messageData.type) {
    errors.push('Message type is required');
  } else if (!Message.validateType(messageData.type)) {
    errors.push('Type must be one of: user, ai, system, training');
  }
  
  // Content validation - required for user messages
  if (messageData.type === 'user') {
    if (!messageData.content || messageData.content.trim().length === 0) {
      errors.push('Content is required for user messages');
    }
  }
  
  if (messageData.content && !Message.validateContent(messageData.content)) {
    errors.push('Content is too long or invalid');
  }
  
  // Optional field validations
  if (messageData.parent_message_id && !Message.validateUUID(messageData.parent_message_id)) {
    errors.push('Parent message ID must be a valid UUID');
  }
  
  if (messageData.verdict && !Message.validateVerdict(messageData.verdict)) {
    errors.push('Verdict must be one of: diamond, fire, skull');
  }
  
  if (messageData.confidence !== undefined && !Message.validateConfidence(messageData.confidence)) {
    errors.push('Confidence must be an integer between 0 and 100');
  }
  
  if (messageData.analysis_mode && !Message.validateAnalysisMode(messageData.analysis_mode)) {
    errors.push('Analysis mode must be one of: analysis, psychology, training');
  }
  
  if (messageData.emotional_state && !Message.validateEmotionalState(messageData.emotional_state)) {
    errors.push('Emotional state is invalid');
  }
  
  if (messageData.coaching_type && !Message.validateCoachingType(messageData.coaching_type)) {
    errors.push('Coaching type is invalid');
  }
  
  if (messageData.pattern_tags && !Message.validatePatternTags(messageData.pattern_tags)) {
    errors.push('Pattern tags are invalid or too many');
  }
  
  // Cross-field validations
  if (messageData.verdict && !messageData.confidence) {
    errors.push('Confidence score is required when verdict is provided');
  }
  
  if (messageData.image_url && !messageData.image_filename) {
    errors.push('Image filename is required when image URL is provided');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize message data
 * @param {Object} messageData - Raw message data
 * @returns {Object} Sanitized message data
 */
function sanitizeMessageData(messageData) {
  const sanitized = {};
  
  // Copy allowed fields with sanitization
  if (messageData.conversation_id) sanitized.conversation_id = messageData.conversation_id;
  if (messageData.parent_message_id) sanitized.parent_message_id = messageData.parent_message_id;
  if (messageData.content !== undefined) sanitized.content = messageData.content ? messageData.content.trim() : null;
  if (messageData.type) sanitized.type = messageData.type;
  if (messageData.verdict) sanitized.verdict = messageData.verdict;
  if (messageData.confidence !== undefined) sanitized.confidence = messageData.confidence;
  if (messageData.analysis_mode) sanitized.analysis_mode = messageData.analysis_mode;
  if (messageData.image_url) sanitized.image_url = messageData.image_url;
  if (messageData.image_filename) sanitized.image_filename = messageData.image_filename;
  if (messageData.image_size !== undefined) sanitized.image_size = messageData.image_size;
  if (messageData.image_metadata) sanitized.image_metadata = messageData.image_metadata;
  if (messageData.emotional_state) sanitized.emotional_state = messageData.emotional_state;
  if (messageData.coaching_type) sanitized.coaching_type = messageData.coaching_type;
  if (messageData.pattern_tags) sanitized.pattern_tags = messageData.pattern_tags;
  if (messageData.ai_model) sanitized.ai_model = messageData.ai_model;
  if (messageData.ai_tokens_used !== undefined) sanitized.ai_tokens_used = messageData.ai_tokens_used;
  if (messageData.ai_cost_cents !== undefined) sanitized.ai_cost_cents = messageData.ai_cost_cents;
  if (messageData.processing_time_ms !== undefined) sanitized.processing_time_ms = messageData.processing_time_ms;
  if (messageData.status) sanitized.status = messageData.status;
  
  return sanitized;
}

/**
 * GET /api/messages
 * Get messages with optional filtering by conversation ID
 * Supports pagination with limit and offset
 * PRD Reference: PRD-1.1.2.5-message-get-endpoint.md
 */
router.get('/',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        conversationId = null,
        limit = 50,
        offset = 0,
        order = 'asc'
      } = req.query;
      
      // Validate query parameters
      const validationErrors = [];
      
      // Validate conversationId if provided
      if (conversationId && !Message.validateUUID(conversationId)) {
        validationErrors.push('Invalid conversation ID format');
      }
      
      // Validate limit
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        validationErrors.push('Limit must be between 1 and 100');
      }
      
      // Validate offset
      const offsetNum = parseInt(offset);
      if (isNaN(offsetNum) || offsetNum < 0) {
        validationErrors.push('Offset must be a non-negative integer');
      }
      
      // Validate order
      if (!['asc', 'desc', 'ASC', 'DESC'].includes(order)) {
        validationErrors.push('Order must be "asc" or "desc"');
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validationErrors,
          code: 'INVALID_QUERY_PARAMS'
        });
      }
      
      const options = {
        limit: Math.min(limitNum || 50, 100), // Max 100 per page
        offset: Math.max(offsetNum || 0, 0),
        order: order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      };
      
      console.log('Messages retrieval request:', {
        userId: userId,
        conversationId: conversationId,
        options: options,
        ip: req.ip
      });
      
      let result;
      
      if (conversationId) {
        // Verify conversation exists and user owns it
        const conversation = await getConversationById(conversationId, userId);
        if (!conversation) {
          return res.status(404).json({
            success: false,
            error: 'Conversation not found or access denied',
            code: 'CONVERSATION_NOT_FOUND'
          });
        }
        
        // Get messages for specific conversation
        result = await getConversationMessages(conversationId, userId, options);
      } else {
        // Get all user's messages (useful for admin/debugging)
        // This uses a custom query to get messages across all conversations
        const { query } = await import('../../db/connection.js');
        
        const queryText = `
          SELECT 
            m.id,
            m.conversation_id,
            m.user_id,
            m.content,
            m.type,
            m.verdict,
            m.confidence,
            m.analysis_mode,
            m.created_at,
            m.updated_at,
            COUNT(*) OVER() as total_count
          FROM messages m
          WHERE m.user_id = $1
            AND m.deleted_at IS NULL
          ORDER BY m.created_at ${options.order}
          LIMIT $2 OFFSET $3
        `;
        
        const queryResult = await query(queryText, [userId, options.limit, options.offset]);
        
        const totalCount = queryResult.rows.length > 0 ? parseInt(queryResult.rows[0].total_count) : 0;
        const hasMore = (options.offset + queryResult.rows.length) < totalCount;
        
        // Format messages
        const messages = queryResult.rows.map(row => ({
          id: row.id,
          conversationId: row.conversation_id,
          userId: row.user_id,
          content: row.content,
          type: row.type,
          verdict: row.verdict,
          confidence: row.confidence,
          analysisMode: row.analysis_mode,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
        
        result = {
          messages,
          pagination: {
            total: totalCount,
            limit: options.limit,
            offset: options.offset,
            hasMore
          }
        };
      }
      
      // Update user's last active timestamp
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
      
      res.json({
        success: true,
        data: {
          messages: result.messages,
          pagination: result.pagination
        }
      });
      
    } catch (error) {
      console.error('Messages retrieval error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'NOT_FOUND'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve messages',
          code: 'RETRIEVAL_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * POST /api/messages
 * Create a new message
 */
router.post('/',
  messageRateLimit,
  createRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  requireEmailVerification,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const messageData = req.body;
      
      console.log('Message creation request:', {
        userId: userId,
        conversationId: messageData.conversation_id,
        type: messageData.type,
        hasContent: !!messageData.content,
        hasAttachment: !!messageData.image_url,
        ip: req.ip
      });
      
      // Validate message data
      const validation = validateMessageData(messageData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
          code: 'VALIDATION_ERROR'
        });
      }
      
      // Verify conversation exists and user owns it
      const conversation = await getConversationById(messageData.conversation_id, userId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found or access denied',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }
      
      // Sanitize data and add user_id
      const sanitizedData = sanitizeMessageData(messageData);
      sanitizedData.user_id = userId;
      
      // Create message
      const newMessage = await createMessage(sanitizedData);
      
      // Update user's last active timestamp
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
      
      // Broadcast new message via Socket.IO to conversation participants
      // This fulfills FR-5 from PRD-1.1.2.4
      const conversationRoom = `conversation_${newMessage.conversation_id}`;
      const broadcastSuccess = emitToRoom(conversationRoom, 'new_message', {
        message: newMessage,
        sender: {
          id: userId,
          email: req.user.email
        },
        timestamp: new Date().toISOString()
      });
      
      if (!broadcastSuccess) {
        console.warn('Failed to broadcast message via Socket.IO - WebSocket may not be initialized');
      }
      
      console.log('Message created successfully:', {
        messageId: newMessage.id,
        conversationId: newMessage.conversation_id,
        userId: userId,
        type: newMessage.type,
        broadcastedTo: broadcastSuccess ? conversationRoom : 'none',
        socketIOStatus: broadcastSuccess ? 'success' : 'failed'
      });
      
      res.status(201).json({
        success: true,
        message: 'Message created successfully',
        data: {
          message: newMessage
        }
      });
      
    } catch (error) {
      console.error('Message creation error:', error);
      
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      } else if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'NOT_FOUND'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create message',
          code: 'CREATION_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * GET /api/messages/:messageId
 * Get a specific message by ID
 */
router.get('/:messageId',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const messageId = req.params.messageId;
      
      // Validate UUID format
      if (!Message.validateUUID(messageId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid message ID format',
          code: 'INVALID_ID_FORMAT'
        });
      }
      
      console.log('Message fetch request:', {
        messageId: messageId,
        userId: userId,
        ip: req.ip
      });
      
      // Get message (includes ownership validation)
      const message = await getMessageById(messageId, userId);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found or access denied',
          code: 'MESSAGE_NOT_FOUND'
        });
      }
      
      // Update user's last active timestamp
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
      
      res.json({
        success: true,
        data: {
          message: message
        }
      });
      
    } catch (error) {
      console.error('Message fetch error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch message',
        code: 'FETCH_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * GET /api/messages/conversation/:conversationId
 * Get messages for a conversation with pagination
 */
router.get('/conversation/:conversationId',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;
      const { 
        limit = 50, 
        offset = 0, 
        order = 'ASC', 
        include_metadata = false 
      } = req.query;
      
      // Validate UUID format
      if (!Message.validateUUID(conversationId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid conversation ID format',
          code: 'INVALID_ID_FORMAT'
        });
      }
      
      const options = {
        limit: Math.min(parseInt(limit) || 50, 100), // Max 100 per page
        offset: Math.max(parseInt(offset) || 0, 0),
        order: order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
        includeMetadata: include_metadata === 'true'
      };
      
      console.log('Conversation messages request:', {
        conversationId: conversationId,
        userId: userId,
        options: options,
        ip: req.ip
      });
      
      // Get messages (includes conversation ownership validation)
      const result = await getConversationMessages(conversationId, userId, options);
      
      // Update user's last active timestamp
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
      
      res.json({
        success: true,
        data: {
          messages: result.messages,
          pagination: result.pagination
        }
      });
      
    } catch (error) {
      console.error('Conversation messages fetch error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'CONVERSATION_NOT_FOUND'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch conversation messages',
          code: 'FETCH_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * PUT /api/messages/:messageId
 * Update a message
 */
router.put('/:messageId',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const messageId = req.params.messageId;
      const updateData = req.body;
      
      // Validate UUID format
      if (!Message.validateUUID(messageId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid message ID format',
          code: 'INVALID_ID_FORMAT'
        });
      }
      
      console.log('Message update request:', {
        messageId: messageId,
        userId: userId,
        fields: Object.keys(updateData),
        ip: req.ip
      });
      
      // Check if there's actually data to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No update data provided',
          code: 'NO_UPDATE_DATA'
        });
      }
      
      // Validate update data (partial validation for updates)
      const allowedUpdateFields = ['content', 'emotional_state', 'pattern_tags', 'image_metadata'];
      const invalidFields = Object.keys(updateData).filter(field => !allowedUpdateFields.includes(field));
      
      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid fields for update: ${invalidFields.join(', ')}`,
          code: 'INVALID_UPDATE_FIELDS'
        });
      }
      
      // Sanitize update data
      const sanitizedData = {};
      if (updateData.content !== undefined) {
        sanitizedData.content = updateData.content ? updateData.content.trim() : null;
      }
      if (updateData.emotional_state) {
        if (!Message.validateEmotionalState(updateData.emotional_state)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid emotional state',
            code: 'VALIDATION_ERROR'
          });
        }
        sanitizedData.emotional_state = updateData.emotional_state;
      }
      if (updateData.pattern_tags) {
        if (!Message.validatePatternTags(updateData.pattern_tags)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid pattern tags',
            code: 'VALIDATION_ERROR'
          });
        }
        sanitizedData.pattern_tags = updateData.pattern_tags;
      }
      if (updateData.image_metadata) {
        if (!Message.validateImageMetadata(updateData.image_metadata)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid image metadata',
            code: 'VALIDATION_ERROR'
          });
        }
        sanitizedData.image_metadata = updateData.image_metadata;
      }
      
      // Update message (includes ownership validation)
      const updatedMessage = await updateMessage(messageId, userId, sanitizedData);
      
      console.log('Message updated successfully:', {
        messageId: messageId,
        userId: userId,
        updatedFields: Object.keys(sanitizedData)
      });
      
      res.json({
        success: true,
        message: 'Message updated successfully',
        data: {
          message: updatedMessage
        }
      });
      
    } catch (error) {
      console.error('Message update error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'MESSAGE_NOT_FOUND'
        });
      } else if (error.message.includes('Only user messages') || error.message.includes('Cannot edit message while')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'EDIT_NOT_ALLOWED'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update message',
          code: 'UPDATE_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * DELETE /api/messages/:messageId
 * Soft delete a message
 */
router.delete('/:messageId',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const messageId = req.params.messageId;
      
      // Validate UUID format
      if (!Message.validateUUID(messageId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid message ID format',
          code: 'INVALID_ID_FORMAT'
        });
      }
      
      console.log('Message deletion request:', {
        messageId: messageId,
        userId: userId,
        ip: req.ip
      });
      
      // Delete message (includes ownership validation)
      await deleteMessage(messageId, userId);
      
      console.log('Message deleted successfully:', {
        messageId: messageId,
        userId: userId
      });
      
      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
      
    } catch (error) {
      console.error('Message deletion error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied') || error.message.includes('cannot delete')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'DELETE_FAILED'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete message',
          code: 'DELETE_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * GET /api/messages/search
 * Full-text search messages across user's conversations
 */
router.get('/search',
  messageRateLimit,
  searchRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        q: searchQuery, 
        conversation_id = null,
        analysis_mode = null,
        verdict = null,
        has_attachment = null,
        date_from = null,
        date_to = null,
        limit = 20, 
        offset = 0 
      } = req.query;
      
      if (!searchQuery || searchQuery.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
          code: 'SEARCH_QUERY_REQUIRED'
        });
      }
      
      if (searchQuery.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters',
          code: 'SEARCH_QUERY_TOO_SHORT'
        });
      }
      
      // Validate optional filters
      const options = {
        limit: Math.min(parseInt(limit) || 20, 100), // Max 100 results
        offset: Math.max(parseInt(offset) || 0, 0),
        conversationId: conversation_id && Message.validateUUID(conversation_id) ? conversation_id : null,
        analysisMode: analysis_mode && Message.validateAnalysisMode(analysis_mode) ? analysis_mode : null,
        verdictFilter: verdict && Message.validateVerdict(verdict) ? verdict : null,
        hasAttachment: has_attachment === 'true' ? true : has_attachment === 'false' ? false : null,
        dateFrom: date_from ? new Date(date_from) : null,
        dateTo: date_to ? new Date(date_to) : null
      };
      
      console.log('Message search request:', {
        userId: userId,
        searchQuery: searchQuery.substring(0, 50) + '...', // Log truncated query
        options: options,
        ip: req.ip
      });
      
      // Search messages
      const result = await searchMessages(userId, searchQuery.trim(), options);
      
      res.json({
        success: true,
        data: {
          messages: result.messages,
          search_query: result.search_query,
          pagination: result.pagination
        }
      });
      
    } catch (error) {
      console.error('Message search error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Search failed',
        code: 'SEARCH_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * GET /api/messages/:messageId/thread
 * Get message thread (parent message and all its children)
 */
router.get('/:messageId/thread',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const messageId = req.params.messageId;
      
      // Validate UUID format
      if (!Message.validateUUID(messageId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid message ID format',
          code: 'INVALID_ID_FORMAT'
        });
      }
      
      console.log('Message thread request:', {
        messageId: messageId,
        userId: userId,
        ip: req.ip
      });
      
      // Get message thread (includes ownership validation)
      const thread = await getMessageThread(messageId, userId);
      
      res.json({
        success: true,
        data: {
          thread: thread
        }
      });
      
    } catch (error) {
      console.error('Message thread fetch error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'MESSAGE_NOT_FOUND'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch message thread',
          code: 'FETCH_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * GET /api/messages/:messageId/children
 * Get child messages for a parent message
 */
router.get('/:messageId/children',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const messageId = req.params.messageId;
      
      // Validate UUID format
      if (!Message.validateUUID(messageId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid message ID format',
          code: 'INVALID_ID_FORMAT'
        });
      }
      
      console.log('Child messages request:', {
        parentMessageId: messageId,
        userId: userId,
        ip: req.ip
      });
      
      // Get child messages (includes ownership validation)
      const childMessages = await getChildMessages(messageId, userId);
      
      res.json({
        success: true,
        data: {
          child_messages: childMessages,
          parent_message_id: messageId,
          child_count: childMessages.length
        }
      });
      
    } catch (error) {
      console.error('Child messages fetch error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'MESSAGE_NOT_FOUND'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch child messages',
          code: 'FETCH_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * GET /api/messages/verdict/:verdict
 * Get messages by AI verdict for analytics
 */
router.get('/verdict/:verdict',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const verdict = req.params.verdict;
      const { 
        conversation_id = null,
        limit = 20, 
        offset = 0 
      } = req.query;
      
      if (!Message.validateVerdict(verdict)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid verdict. Must be one of: diamond, fire, skull',
          code: 'INVALID_VERDICT'
        });
      }
      
      const options = {
        limit: Math.min(parseInt(limit) || 20, 100),
        offset: Math.max(parseInt(offset) || 0, 0),
        conversationId: conversation_id && Message.validateUUID(conversation_id) ? conversation_id : null
      };
      
      console.log('Messages by verdict request:', {
        userId: userId,
        verdict: verdict,
        options: options,
        ip: req.ip
      });
      
      // Get messages by verdict
      const result = await getMessagesByVerdict(userId, verdict, options);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Messages by verdict fetch error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages by verdict',
        code: 'FETCH_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * GET /api/messages/psychology
 * Get psychology coaching messages
 */
router.get('/psychology',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        emotional_state = null,
        coaching_type = null,
        pattern_tag = null,
        limit = 20, 
        offset = 0 
      } = req.query;
      
      const options = {
        limit: Math.min(parseInt(limit) || 20, 100),
        offset: Math.max(parseInt(offset) || 0, 0),
        emotionalState: emotional_state && Message.validateEmotionalState(emotional_state) ? emotional_state : null,
        coachingType: coaching_type && Message.validateCoachingType(coaching_type) ? coaching_type : null,
        patternTag: pattern_tag // Will be validated in the query function
      };
      
      console.log('Psychology messages request:', {
        userId: userId,
        options: options,
        ip: req.ip
      });
      
      // Get psychology messages
      const result = await getPsychologyMessages(userId, options);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Psychology messages fetch error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch psychology messages',
        code: 'FETCH_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * GET /api/messages/stats
 * Get user's message statistics
 */
router.get('/stats',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        date_from = null,
        date_to = null 
      } = req.query;
      
      const options = {
        dateFrom: date_from ? new Date(date_from) : null,
        dateTo: date_to ? new Date(date_to) : null
      };
      
      console.log('Message stats request:', {
        userId: userId,
        options: options,
        ip: req.ip
      });
      
      // Get message statistics
      const stats = await getMessageStats(userId, options);
      
      res.json({
        success: true,
        data: {
          stats: stats
        }
      });
      
    } catch (error) {
      console.error('Message stats error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch message statistics',
        code: 'STATS_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * POST /api/messages/:messageId/ai-results
 * Update AI processing results for a message (internal endpoint for AI services)
 */
router.post('/:messageId/ai-results',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken, // This would typically require service-to-service auth
  async (req, res) => {
    try {
      const messageId = req.params.messageId;
      const aiResults = req.body;
      
      // Validate UUID format
      if (!Message.validateUUID(messageId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid message ID format',
          code: 'INVALID_ID_FORMAT'
        });
      }
      
      console.log('AI results update request:', {
        messageId: messageId,
        hasVerdict: !!aiResults.verdict,
        hasConfidence: aiResults.confidence !== undefined,
        ip: req.ip
      });
      
      // Update AI results
      const updatedMessage = await updateAiResults(messageId, aiResults);
      
      console.log('AI results updated successfully:', {
        messageId: messageId,
        verdict: updatedMessage.verdict,
        confidence: updatedMessage.confidence
      });
      
      res.json({
        success: true,
        message: 'AI results updated successfully',
        data: {
          message: updatedMessage
        }
      });
      
    } catch (error) {
      console.error('AI results update error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Message not found',
          code: 'MESSAGE_NOT_FOUND'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update AI results',
          code: 'UPDATE_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * POST /api/messages/:messageId/mark-failed
 * Mark message processing as failed (internal endpoint for AI services)
 */
router.post('/:messageId/mark-failed',
  messageRateLimit,
  premiumRateLimitBypass,
  authenticateToken, // This would typically require service-to-service auth
  async (req, res) => {
    try {
      const messageId = req.params.messageId;
      const { error_message } = req.body;
      
      // Validate UUID format
      if (!Message.validateUUID(messageId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid message ID format',
          code: 'INVALID_ID_FORMAT'
        });
      }
      
      if (!error_message) {
        return res.status(400).json({
          success: false,
          error: 'Error message is required',
          code: 'ERROR_MESSAGE_REQUIRED'
        });
      }
      
      console.log('Mark message as failed request:', {
        messageId: messageId,
        errorMessage: error_message.substring(0, 100),
        ip: req.ip
      });
      
      // Mark message as failed
      await markMessageAsFailed(messageId, error_message);
      
      console.log('Message marked as failed successfully:', {
        messageId: messageId
      });
      
      res.json({
        success: true,
        message: 'Message marked as failed successfully'
      });
      
    } catch (error) {
      console.error('Mark message as failed error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Message not found',
          code: 'MESSAGE_NOT_FOUND'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to mark message as failed',
          code: 'UPDATE_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

export default router;