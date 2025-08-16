/**
 * Conversation CRUD Operations - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.3-conversations-table.md
 * Task: BE-005 - Conversation database operations with statistics
 * Created: 2025-08-14
 * 
 * Implements comprehensive conversation CRUD operations with security considerations,
 * performance optimization, JSONB context queries, and statistics functionality.
 */

import { query, getClient } from '../connection.js';
import Conversation from '../../models/Conversation.js';

/**
 * Create a new conversation with proper validation
 * @param {Object} conversationData - Conversation creation data
 * @returns {Promise<Object>} Created conversation object
 * @throws {Error} If creation fails or validation errors occur
 */
export async function createConversation(conversationData) {
  // Validate input data
  const validation = Conversation.validate(conversationData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Create Conversation instance
  const conversation = new Conversation(conversationData);
  const dbData = conversation.toDatabaseObject();
    
  try {
    const sql = `
            INSERT INTO conversations (
                user_id, title, mode, status, context_data
            ) VALUES (
                $1, $2, $3, $4, $5
            )
            RETURNING id, user_id, title, mode, status, context_data,
                     last_message_at, message_count, created_at, updated_at, archived_at
        `;

    const params = [
      dbData.user_id,
      dbData.title,
      dbData.mode,
      dbData.status,
      JSON.stringify(dbData.context_data)
    ];

    const result = await query(sql, params);
        
    if (result.rows.length === 0) {
      throw new Error('Failed to create conversation - no data returned');
    }

    return new Conversation(result.rows[0]).toPublicObject();
  } catch (error) {
    // Handle specific database errors
    if (error.code === '23503') { // Foreign key violation
      throw new Error('User does not exist');
    }
        
    console.error('Conversation creation error:', error);
    throw new Error(`Failed to create conversation: ${error.message}`);
  }
}

/**
 * Get conversation by ID with ownership validation
 * @param {string} conversationId - Conversation UUID
 * @param {string} userId - User UUID for ownership validation
 * @returns {Promise<Object|null>} Conversation object or null if not found
 */
export async function getConversationById(conversationId, userId) {
  if (!conversationId || !userId) {
    throw new Error('Conversation ID and User ID are required');
  }

  try {
    const sql = `
            SELECT id, user_id, title, mode, status, context_data,
                   last_message_at, message_count, created_at, updated_at, archived_at
            FROM conversations 
            WHERE id = $1 AND user_id = $2 AND status != 'deleted'
        `;

    const result = await query(sql, [conversationId, userId]);
        
    if (result.rows.length === 0) {
      return null;
    }

    return new Conversation(result.rows[0]).toPublicObject();
  } catch (error) {
    console.error('Get conversation by ID error:', error);
    throw new Error(`Failed to get conversation: ${error.message}`);
  }
}

/**
 * Get all conversations for a user with pagination and filtering
 * @param {string} userId - User UUID
 * @param {Object} options - Query options (status, mode, limit, offset, orderBy)
 * @returns {Promise<Object>} Conversations array with pagination metadata
 */
export async function getUserConversations(userId, options = {}) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const {
    status = 'active',
    mode = null,
    limit = 20,
    offset = 0,
    orderBy = 'updated_at',
    orderDirection = 'DESC'
  } = options;

  try {
    // Build WHERE clause dynamically
    let whereConditions = ['user_id = $1'];
    let params = [userId];
    let paramCount = 1;

    if (status && status !== 'all') {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (mode) {
      paramCount++;
      whereConditions.push(`mode = $${paramCount}`);
      params.push(mode);
    }

    // Ensure we don't show deleted conversations unless explicitly requested
    if (status !== 'deleted') {
      whereConditions.push("status != 'deleted'");
    }

    const whereClause = whereConditions.join(' AND ');
    
    // Validate orderBy to prevent SQL injection
    const allowedOrderFields = ['created_at', 'updated_at', 'last_message_at', 'message_count', 'title'];
    const safeOrderBy = allowedOrderFields.includes(orderBy) ? orderBy : 'updated_at';
    const safeDirection = orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countSql = `SELECT COUNT(*) FROM conversations WHERE ${whereClause}`;
    const countResult = await query(countSql, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get conversations with pagination
    const sql = `
            SELECT id, user_id, title, mode, status, context_data,
                   last_message_at, message_count, created_at, updated_at, archived_at
            FROM conversations 
            WHERE ${whereClause}
            ORDER BY ${safeOrderBy} ${safeDirection}
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

    params.push(limit, offset);
    const result = await query(sql, params);
        
    const conversations = result.rows.map(row => new Conversation(row).toPublicObject());

    return {
      conversations,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    };
  } catch (error) {
    console.error('Get user conversations error:', error);
    throw new Error(`Failed to get user conversations: ${error.message}`);
  }
}

/**
 * Update conversation with validation and optimistic concurrency
 * @param {string} conversationId - Conversation UUID
 * @param {string} userId - User UUID for ownership validation
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated conversation object
 * @throws {Error} If update fails or conversation not found
 */
export async function updateConversation(conversationId, userId, updateData) {
  if (!conversationId || !userId) {
    throw new Error('Conversation ID and User ID are required');
  }

  // Remove fields that shouldn't be updated directly
  const { id, user_id, created_at, message_count, last_message_at, ...allowedUpdates } = updateData;

  // Validate update data
  if (Object.keys(allowedUpdates).length === 0) {
    throw new Error('No valid fields provided for update');
  }

  // Validate each field
  const tempConversationData = { user_id: userId, ...allowedUpdates };
  const validation = Conversation.validate(tempConversationData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  const client = await getClient();
    
  try {
    await client.query('BEGIN');

    // Check if conversation exists and user owns it
    const existingConv = await client.query(
      'SELECT id, status FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (existingConv.rows.length === 0) {
      throw new Error('Conversation not found or access denied');
    }

    if (existingConv.rows[0].status === 'deleted') {
      throw new Error('Cannot update deleted conversation');
    }

    // Build dynamic UPDATE query
    const updateFields = [];
    const params = [];
    let paramCount = 1;

    Object.entries(allowedUpdates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        // Handle JSONB serialization for context_data
        params.push(key === 'context_data' ? JSON.stringify(value) : value);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid update values provided');
    }

    // Add conversation ID and user ID as final parameters
    params.push(conversationId, userId);

    const sql = `
            UPDATE conversations 
            SET ${updateFields.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCount} AND user_id = $${paramCount + 1} AND status != 'deleted'
            RETURNING id, user_id, title, mode, status, context_data,
                     last_message_at, message_count, created_at, updated_at, archived_at
        `;

    const result = await client.query(sql, params);
        
    if (result.rows.length === 0) {
      throw new Error('Failed to update conversation');
    }

    await client.query('COMMIT');
        
    return new Conversation(result.rows[0]).toPublicObject();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Conversation update error:', error);
    throw new Error(`Failed to update conversation: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Archive a conversation (soft archive)
 * @param {string} conversationId - Conversation UUID
 * @param {string} userId - User UUID for ownership validation
 * @returns {Promise<boolean>} Success status
 */
export async function archiveConversation(conversationId, userId) {
  if (!conversationId || !userId) {
    throw new Error('Conversation ID and User ID are required');
  }

  try {
    const sql = `
            UPDATE conversations 
            SET status = 'archived', archived_at = NOW(), updated_at = NOW()
            WHERE id = $1 AND user_id = $2 AND status = 'active'
            RETURNING id
        `;

    const result = await query(sql, [conversationId, userId]);
        
    if (result.rows.length === 0) {
      throw new Error('Conversation not found, access denied, or already archived');
    }

    return true;
  } catch (error) {
    console.error('Archive conversation error:', error);
    throw new Error(`Failed to archive conversation: ${error.message}`);
  }
}

/**
 * Restore an archived conversation
 * @param {string} conversationId - Conversation UUID
 * @param {string} userId - User UUID for ownership validation
 * @returns {Promise<boolean>} Success status
 */
export async function restoreConversation(conversationId, userId) {
  if (!conversationId || !userId) {
    throw new Error('Conversation ID and User ID are required');
  }

  try {
    const sql = `
            UPDATE conversations 
            SET status = 'active', archived_at = NULL, updated_at = NOW()
            WHERE id = $1 AND user_id = $2 AND status = 'archived'
            RETURNING id
        `;

    const result = await query(sql, [conversationId, userId]);
        
    if (result.rows.length === 0) {
      throw new Error('Conversation not found, access denied, or not archived');
    }

    return true;
  } catch (error) {
    console.error('Restore conversation error:', error);
    throw new Error(`Failed to restore conversation: ${error.message}`);
  }
}

/**
 * Soft delete a conversation
 * @param {string} conversationId - Conversation UUID
 * @param {string} userId - User UUID for ownership validation
 * @returns {Promise<boolean>} Success status
 */
export async function deleteConversation(conversationId, userId) {
  if (!conversationId || !userId) {
    throw new Error('Conversation ID and User ID are required');
  }

  try {
    const sql = `
            UPDATE conversations 
            SET status = 'deleted', updated_at = NOW()
            WHERE id = $1 AND user_id = $2 AND status != 'deleted'
            RETURNING id
        `;

    const result = await query(sql, [conversationId, userId]);
        
    if (result.rows.length === 0) {
      throw new Error('Conversation not found, access denied, or already deleted');
    }

    return true;
  } catch (error) {
    console.error('Delete conversation error:', error);
    throw new Error(`Failed to delete conversation: ${error.message}`);
  }
}

/**
 * Search conversations by title and context data
 * @param {string} userId - User UUID
 * @param {string} searchTerm - Search term for title and context
 * @param {Object} options - Search options (mode, status, limit)
 * @returns {Promise<Array>} Array of matching conversations
 */
export async function searchConversations(userId, searchTerm, options = {}) {
  if (!userId || !searchTerm) {
    throw new Error('User ID and search term are required');
  }

  const { mode = null, status = 'active', limit = 50 } = options;

  try {
    let whereConditions = ['user_id = $1'];
    let params = [userId];
    let paramCount = 1;

    // Add search conditions
    paramCount++;
    whereConditions.push(`(
            title ILIKE $${paramCount} OR 
            context_data::text ILIKE $${paramCount}
        )`);
    const searchPattern = `%${searchTerm}%`;
    params.push(searchPattern);

    // Add optional filters
    if (mode) {
      paramCount++;
      whereConditions.push(`mode = $${paramCount}`);
      params.push(mode);
    }

    if (status && status !== 'all') {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      params.push(status);
    } else {
      whereConditions.push("status != 'deleted'");
    }

    const whereClause = whereConditions.join(' AND ');

    const sql = `
            SELECT id, user_id, title, mode, status, context_data,
                   last_message_at, message_count, created_at, updated_at, archived_at
            FROM conversations 
            WHERE ${whereClause}
            ORDER BY 
                CASE WHEN title ILIKE $2 THEN 1 ELSE 2 END,
                last_message_at DESC
            LIMIT $${paramCount + 1}
        `;

    params.push(limit);
    const result = await query(sql, params);
        
    return result.rows.map(row => new Conversation(row).toPublicObject());
  } catch (error) {
    console.error('Search conversations error:', error);
    throw new Error(`Failed to search conversations: ${error.message}`);
  }
}

/**
 * Get conversation statistics for a user (BE-008)
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} User conversation statistics
 */
export async function getUserConversationStats(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const sql = `
            SELECT 
                COUNT(*) FILTER (WHERE status != 'deleted') as total_conversations,
                COUNT(*) FILTER (WHERE status = 'active') as active_conversations,
                COUNT(*) FILTER (WHERE status = 'archived') as archived_conversations,
                COUNT(*) FILTER (WHERE mode = 'analysis' AND status != 'deleted') as analysis_conversations,
                COUNT(*) FILTER (WHERE mode = 'psychology' AND status != 'deleted') as psychology_conversations,
                COUNT(*) FILTER (WHERE mode = 'training' AND status != 'deleted') as training_conversations,
                COUNT(*) FILTER (WHERE mode = 'planning' AND status != 'deleted') as planning_conversations,
                SUM(message_count) FILTER (WHERE status != 'deleted') as total_messages,
                AVG(message_count) FILTER (WHERE status != 'deleted') as avg_messages_per_conversation,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days' AND status != 'deleted') as conversations_last_7d,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND status != 'deleted') as conversations_last_30d,
                COUNT(*) FILTER (WHERE last_message_at >= NOW() - INTERVAL '7 days' AND status != 'deleted') as active_last_7d,
                MAX(last_message_at) as most_recent_activity,
                MIN(created_at) as first_conversation_date
            FROM conversations
            WHERE user_id = $1
        `;

    const result = await query(sql, [userId]);
    const stats = result.rows[0];
    
    // Convert string numbers to integers and handle nulls
    return {
      total_conversations: parseInt(stats.total_conversations) || 0,
      active_conversations: parseInt(stats.active_conversations) || 0,
      archived_conversations: parseInt(stats.archived_conversations) || 0,
      analysis_conversations: parseInt(stats.analysis_conversations) || 0,
      psychology_conversations: parseInt(stats.psychology_conversations) || 0,
      training_conversations: parseInt(stats.training_conversations) || 0,
      planning_conversations: parseInt(stats.planning_conversations) || 0,
      total_messages: parseInt(stats.total_messages) || 0,
      avg_messages_per_conversation: parseFloat(stats.avg_messages_per_conversation) || 0,
      conversations_last_7d: parseInt(stats.conversations_last_7d) || 0,
      conversations_last_30d: parseInt(stats.conversations_last_30d) || 0,
      active_last_7d: parseInt(stats.active_last_7d) || 0,
      most_recent_activity: stats.most_recent_activity,
      first_conversation_date: stats.first_conversation_date
    };
  } catch (error) {
    console.error('Get user conversation stats error:', error);
    throw new Error(`Failed to get conversation statistics: ${error.message}`);
  }
}

/**
 * Get platform-wide conversation metrics (for analytics)
 * @param {Object} options - Query options (dateRange, groupBy)
 * @returns {Promise<Object>} Platform conversation metrics
 */
export async function getConversationMetrics(options = {}) {
  const { 
    dateFrom = null, 
    dateTo = null, 
    groupBy = 'day' // day, week, month
  } = options;

  try {
    let dateFilter = '';
    const params = [];
    let paramCount = 0;

    if (dateFrom) {
      paramCount++;
      dateFilter += ` AND created_at >= $${paramCount}`;
      params.push(dateFrom);
    }

    if (dateTo) {
      paramCount++;
      dateFilter += ` AND created_at <= $${paramCount}`;
      params.push(dateTo);
    }

    // Determine date grouping
    let dateGrouping;
    switch (groupBy) {
    case 'week':
      dateGrouping = "DATE_TRUNC('week', created_at)";
      break;
    case 'month':
      dateGrouping = "DATE_TRUNC('month', created_at)";
      break;
    default:
      dateGrouping = "DATE_TRUNC('day', created_at)";
    }

    const sql = `
            SELECT 
                ${dateGrouping} as period,
                COUNT(*) as total_conversations,
                COUNT(*) FILTER (WHERE mode = 'analysis') as analysis_count,
                COUNT(*) FILTER (WHERE mode = 'psychology') as psychology_count,
                COUNT(*) FILTER (WHERE mode = 'training') as training_count,
                COUNT(*) FILTER (WHERE mode = 'planning') as planning_count,
                COUNT(DISTINCT user_id) as unique_users,
                SUM(message_count) as total_messages,
                AVG(message_count) as avg_messages_per_conversation
            FROM conversations
            WHERE status != 'deleted' ${dateFilter}
            GROUP BY ${dateGrouping}
            ORDER BY period DESC
        `;

    const result = await query(sql, params);
    
    return result.rows.map(row => ({
      period: row.period,
      total_conversations: parseInt(row.total_conversations),
      analysis_count: parseInt(row.analysis_count),
      psychology_count: parseInt(row.psychology_count),
      training_count: parseInt(row.training_count),
      planning_count: parseInt(row.planning_count),
      unique_users: parseInt(row.unique_users),
      total_messages: parseInt(row.total_messages) || 0,
      avg_messages_per_conversation: parseFloat(row.avg_messages_per_conversation) || 0
    }));
  } catch (error) {
    console.error('Get conversation metrics error:', error);
    throw new Error(`Failed to get conversation metrics: ${error.message}`);
  }
}

/**
 * Get most active conversations (by message count)
 * @param {string} userId - User UUID (optional - if provided, limit to user)
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of most active conversations
 */
export async function getMostActiveConversations(userId = null, limit = 10) {
  try {
    let whereClause = "status != 'deleted'";
    let params = [];

    if (userId) {
      whereClause += ' AND user_id = $1';
      params.push(userId);
      params.push(limit);
    } else {
      params.push(limit);
    }

    const sql = `
            SELECT id, user_id, title, mode, status, 
                   message_count, last_message_at, created_at
            FROM conversations 
            WHERE ${whereClause} AND message_count > 0
            ORDER BY message_count DESC, last_message_at DESC
            LIMIT $${params.length}
        `;

    const result = await query(sql, params);
        
    return result.rows.map(row => new Conversation(row).getSummary());
  } catch (error) {
    console.error('Get most active conversations error:', error);
    throw new Error(`Failed to get most active conversations: ${error.message}`);
  }
}

/**
 * Get recent conversations across the platform
 * @param {number} limit - Maximum number of results
 * @param {string} mode - Optional mode filter
 * @returns {Promise<Array>} Array of recent conversations
 */
export async function getRecentConversations(limit = 20, mode = null) {
  try {
    let whereClause = "status = 'active'";
    const params = [];
    let paramCount = 0;

    if (mode) {
      paramCount++;
      whereClause += ` AND mode = $${paramCount}`;
      params.push(mode);
    }

    paramCount++;
    params.push(limit);

    const sql = `
            SELECT id, user_id, title, mode, message_count, 
                   last_message_at, created_at
            FROM conversations 
            WHERE ${whereClause}
            ORDER BY COALESCE(last_message_at, created_at) DESC
            LIMIT $${paramCount}
        `;

    const result = await query(sql, params);
        
    return result.rows.map(row => new Conversation(row).getSummary());
  } catch (error) {
    console.error('Get recent conversations error:', error);
    throw new Error(`Failed to get recent conversations: ${error.message}`);
  }
}