/**
 * Conversation Management API Endpoints - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.3-conversations-table.md
 * Task: BE-006 - Conversation CRUD API endpoints with statistics
 * Created: 2025-08-14
 * 
 * Complete conversation management API with create, list, get, update, archive operations,
 * conversation statistics, search functionality, and proper security/validation.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { 
  createConversation,
  getConversationById,
  getUserConversations,
  updateConversation,
  archiveConversation,
  restoreConversation,
  deleteConversation,
  searchConversations,
  getUserConversationStats,
  getConversationMetrics,
  getMostActiveConversations,
  getRecentConversations
} from '../../db/queries/conversations.js';
import { 
  authenticateToken,
  requireEmailVerification,
  premiumRateLimitBypass 
} from '../../middleware/auth.js';
import { updateLastActive } from '../../db/queries/users.js';
import Conversation from '../../models/Conversation.js';

const router = express.Router();

// Rate limiting for conversation operations
const conversationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    success: false,
    error: 'Too many conversation requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  skip: (req) => req.isPremiumUser === true
});

// Stricter rate limit for conversation creation
const createRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 conversation creations per minute per IP
  message: {
    success: false,
    error: 'Too many conversation creations. Please try again in a minute.',
    code: 'CREATE_RATE_LIMIT'
  },
  skip: (req) => req.isPremiumUser === true
});

// Rate limit for search operations
const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute per IP
  message: {
    success: false,
    error: 'Too many search requests. Please try again in a minute.',
    code: 'SEARCH_RATE_LIMIT'
  },
  skip: (req) => req.isPremiumUser === true
});

/**
 * Validate conversation creation data
 * @param {Object} conversationData - Conversation data to validate
 * @returns {Object} Validation result
 */
function validateConversationData(conversationData) {
  const errors = [];
  const allowedFields = ['title', 'mode', 'context_data'];
    
  // Check for disallowed fields
  const providedFields = Object.keys(conversationData);
  const disallowedFields = providedFields.filter(field => !allowedFields.includes(field));
    
  if (disallowedFields.length > 0) {
    errors.push(`Invalid fields: ${disallowedFields.join(', ')}`);
  }
    
  // Validate each field if provided
  if (conversationData.title !== undefined && conversationData.title !== null) {
    if (!Conversation.validateTitle(conversationData.title)) {
      errors.push('Title contains invalid characters or is too long');
    }
  }
    
  if (conversationData.mode !== undefined) {
    if (!Conversation.validateMode(conversationData.mode)) {
      errors.push('Mode must be one of: analysis, psychology, training, planning');
    }
  }
    
  if (conversationData.context_data !== undefined) {
    if (!Conversation.validateContextData(conversationData.context_data)) {
      errors.push('Context data is invalid or too large');
    }
  }
    
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize conversation data
 * @param {Object} conversationData - Raw conversation data
 * @returns {Object} Sanitized conversation data
 */
function sanitizeConversationData(conversationData) {
  const sanitized = {};
    
  if (conversationData.title !== undefined) {
    sanitized.title = conversationData.title ? conversationData.title.trim() : null;
  }
    
  if (conversationData.mode !== undefined) {
    sanitized.mode = conversationData.mode;
  }
    
  if (conversationData.context_data !== undefined) {
    sanitized.context_data = conversationData.context_data || {};
  }
    
  return sanitized;
}

/**
 * POST /api/conversations
 * Create a new conversation
 */
router.post('/',
  conversationRateLimit,
  createRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  requireEmailVerification,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const conversationData = req.body;
            
      console.log('Conversation creation request:', {
        userId: userId,
        mode: conversationData.mode,
        hasTitle: !!conversationData.title,
        ip: req.ip
      });
            
      // Validate conversation data
      const validation = validateConversationData(conversationData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
          code: 'VALIDATION_ERROR'
        });
      }
            
      // Sanitize data
      const sanitizedData = sanitizeConversationData(conversationData);
      sanitizedData.user_id = userId;
            
      // Create conversation
      const newConversation = await createConversation(sanitizedData);
            
      // Update user's last active timestamp
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
            
      console.log('Conversation created successfully:', {
        conversationId: newConversation.id,
        userId: userId,
        mode: newConversation.mode
      });
            
      res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: {
          conversation: newConversation
        }
      });
            
    } catch (error) {
      console.error('Conversation creation error:', error);
            
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      } else if (error.message.includes('User does not exist')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user',
          code: 'INVALID_USER'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create conversation',
          code: 'CREATION_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * GET /api/conversations
 * Get user's conversations with pagination and filtering
 */
router.get('/',
  conversationRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        status = 'active', 
        mode = null, 
        limit = 20, 
        offset = 0, 
        orderBy = 'updated_at',
        orderDirection = 'DESC'
      } = req.query;
            
      // Validate and sanitize query parameters
      const validStatuses = ['active', 'archived', 'all'];
      const validModes = ['analysis', 'psychology', 'training', 'planning'];
      const validOrderFields = ['created_at', 'updated_at', 'last_message_at', 'message_count', 'title'];
            
      const options = {
        status: validStatuses.includes(status) ? status : 'active',
        mode: mode && validModes.includes(mode) ? mode : null,
        limit: Math.min(parseInt(limit) || 20, 100), // Max 100 per page
        offset: Math.max(parseInt(offset) || 0, 0),
        orderBy: validOrderFields.includes(orderBy) ? orderBy : 'updated_at',
        orderDirection: orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
      };
            
      console.log('Conversations list request:', {
        userId: userId,
        options: options,
        ip: req.ip
      });
            
      // Get conversations
      const result = await getUserConversations(userId, options);
            
      // Update user's last active timestamp
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
            
      res.json({
        success: true,
        data: {
          conversations: result.conversations,
          pagination: result.pagination
        }
      });
            
    } catch (error) {
      console.error('Conversations list error:', error);
            
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversations',
        code: 'FETCH_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * GET /api/conversations/:conversationId
 * Get a specific conversation by ID
 */
router.get('/:conversationId',
  conversationRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;
            
      // Validate UUID format
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(conversationId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid conversation ID format',
          code: 'INVALID_ID_FORMAT'
        });
      }
            
      console.log('Conversation fetch request:', {
        conversationId: conversationId,
        userId: userId,
        ip: req.ip
      });
            
      // Get conversation (includes ownership validation)
      const conversation = await getConversationById(conversationId, userId);
            
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found or access denied',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }
            
      // Update user's last active timestamp
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
            
      res.json({
        success: true,
        data: {
          conversation: conversation
        }
      });
            
    } catch (error) {
      console.error('Conversation fetch error:', error);
            
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversation',
        code: 'FETCH_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * PUT /api/conversations/:conversationId
 * Update a conversation
 */
router.put('/:conversationId',
  conversationRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;
      const updateData = req.body;
            
      // Validate UUID format
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(conversationId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid conversation ID format',
          code: 'INVALID_ID_FORMAT'
        });
      }
            
      console.log('Conversation update request:', {
        conversationId: conversationId,
        userId: userId,
        fields: Object.keys(updateData),
        ip: req.ip
      });
            
      // Validate update data
      const validation = validateConversationData(updateData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
          code: 'VALIDATION_ERROR'
        });
      }
            
      // Check if there's actually data to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No update data provided',
          code: 'NO_UPDATE_DATA'
        });
      }
            
      // Sanitize update data
      const sanitizedData = sanitizeConversationData(updateData);
            
      // Update conversation (includes ownership validation)
      const updatedConversation = await updateConversation(conversationId, userId, sanitizedData);
            
      console.log('Conversation updated successfully:', {
        conversationId: conversationId,
        userId: userId,
        updatedFields: Object.keys(sanitizedData)
      });
            
      res.json({
        success: true,
        message: 'Conversation updated successfully',
        data: {
          conversation: updatedConversation
        }
      });
            
    } catch (error) {
      console.error('Conversation update error:', error);
            
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      } else if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found or access denied',
          code: 'CONVERSATION_NOT_FOUND'
        });
      } else if (error.message.includes('Cannot update deleted')) {
        return res.status(400).json({
          success: false,
          error: 'Cannot update deleted conversation',
          code: 'CONVERSATION_DELETED'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update conversation',
          code: 'UPDATE_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * POST /api/conversations/:conversationId/archive
 * Archive a conversation
 */
router.post('/:conversationId/archive',
  conversationRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;
            
      console.log('Conversation archive request:', {
        conversationId: conversationId,
        userId: userId,
        ip: req.ip
      });
            
      // Archive conversation (includes ownership validation)
      await archiveConversation(conversationId, userId);
            
      console.log('Conversation archived successfully:', {
        conversationId: conversationId,
        userId: userId
      });
            
      res.json({
        success: true,
        message: 'Conversation archived successfully'
      });
            
    } catch (error) {
      console.error('Conversation archive error:', error);
            
      if (error.message.includes('not found') || error.message.includes('access denied') || error.message.includes('already archived')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'ARCHIVE_FAILED'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to archive conversation',
          code: 'ARCHIVE_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * POST /api/conversations/:conversationId/restore
 * Restore an archived conversation
 */
router.post('/:conversationId/restore',
  conversationRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;
            
      console.log('Conversation restore request:', {
        conversationId: conversationId,
        userId: userId,
        ip: req.ip
      });
            
      // Restore conversation (includes ownership validation)
      await restoreConversation(conversationId, userId);
            
      console.log('Conversation restored successfully:', {
        conversationId: conversationId,
        userId: userId
      });
            
      res.json({
        success: true,
        message: 'Conversation restored successfully'
      });
            
    } catch (error) {
      console.error('Conversation restore error:', error);
            
      if (error.message.includes('not found') || error.message.includes('access denied') || error.message.includes('not archived')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'RESTORE_FAILED'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to restore conversation',
          code: 'RESTORE_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * DELETE /api/conversations/:conversationId
 * Soft delete a conversation
 */
router.delete('/:conversationId',
  conversationRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;
      const { confirmation } = req.body;
            
      // Require confirmation for deletion
      if (confirmation !== 'DELETE_CONVERSATION') {
        return res.status(400).json({
          success: false,
          error: 'Conversation deletion requires confirmation',
          code: 'CONFIRMATION_REQUIRED',
          required_confirmation: 'DELETE_CONVERSATION'
        });
      }
            
      console.log('Conversation deletion request:', {
        conversationId: conversationId,
        userId: userId,
        ip: req.ip
      });
            
      // Delete conversation (includes ownership validation)
      await deleteConversation(conversationId, userId);
            
      console.log('Conversation deleted successfully:', {
        conversationId: conversationId,
        userId: userId
      });
            
      res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
            
    } catch (error) {
      console.error('Conversation deletion error:', error);
            
      if (error.message.includes('not found') || error.message.includes('access denied') || error.message.includes('already deleted')) {
        return res.status(404).json({
          success: false,
          error: error.message,
          code: 'DELETE_FAILED'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete conversation',
          code: 'DELETE_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * GET /api/conversations/search
 * Search conversations by title and context data
 */
router.get('/search',
  conversationRateLimit,
  searchRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        q: searchTerm, 
        mode = null, 
        status = 'active', 
        limit = 50 
      } = req.query;
            
      if (!searchTerm || searchTerm.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search term is required',
          code: 'SEARCH_TERM_REQUIRED'
        });
      }
            
      if (searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search term must be at least 2 characters',
          code: 'SEARCH_TERM_TOO_SHORT'
        });
      }
            
      // Validate and sanitize query parameters
      const validModes = ['analysis', 'psychology', 'training', 'planning'];
      const validStatuses = ['active', 'archived', 'all'];
            
      const options = {
        mode: mode && validModes.includes(mode) ? mode : null,
        status: validStatuses.includes(status) ? status : 'active',
        limit: Math.min(parseInt(limit) || 50, 100) // Max 100 results
      };
            
      console.log('Conversation search request:', {
        userId: userId,
        searchTerm: searchTerm.substring(0, 50) + '...', // Log truncated term
        options: options,
        ip: req.ip
      });
            
      // Search conversations
      const conversations = await searchConversations(userId, searchTerm.trim(), options);
            
      res.json({
        success: true,
        data: {
          conversations: conversations,
          search_term: searchTerm.trim(),
          total_results: conversations.length
        }
      });
            
    } catch (error) {
      console.error('Conversation search error:', error);
            
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
 * GET /api/conversations/stats
 * Get user's conversation statistics (BE-008)
 */
router.get('/stats',
  conversationRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
            
      console.log('Conversation stats request:', {
        userId: userId,
        ip: req.ip
      });
            
      // Get conversation statistics
      const stats = await getUserConversationStats(userId);
            
      res.json({
        success: true,
        data: {
          stats: stats
        }
      });
            
    } catch (error) {
      console.error('Conversation stats error:', error);
            
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversation statistics',
        code: 'STATS_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * GET /api/conversations/metrics
 * Get platform conversation metrics (admin only - would need admin middleware)
 * For now, returns user-specific most active conversations
 */
router.get('/metrics',
  conversationRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;
            
      console.log('Conversation metrics request:', {
        userId: userId,
        limit: limit,
        ip: req.ip
      });
            
      // Get most active conversations for user
      const activeConversations = await getMostActiveConversations(userId, Math.min(parseInt(limit) || 10, 50));
            
      res.json({
        success: true,
        data: {
          most_active_conversations: activeConversations
        }
      });
            
    } catch (error) {
      console.error('Conversation metrics error:', error);
            
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversation metrics',
        code: 'METRICS_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

export default router;