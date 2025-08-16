/**
 * Message CRUD Operations - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.4-messages-table.md
 * Task: BE-MSG-003, BE-MSG-004, BE-MSG-005 - Message database operations with full-text search and threading
 * Created: 2025-08-14
 * 
 * Implements comprehensive message CRUD operations with security considerations,
 * AI verdict system, psychology coaching, full-text search, message threading,
 * and performance optimization.
 */

import { query, getClient } from '../connection.js';
import Message from '../../models/Message.js';

/**
 * Create a new message with validation
 * @param {Object} messageData - Message creation data
 * @returns {Promise<Object>} Created message object
 * @throws {Error} If creation fails or validation errors occur
 */
export async function createMessage(messageData) {
  // Validate input data
  const validation = Message.validate(messageData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Create Message instance
  const message = new Message(messageData);
  const dbData = message.toDatabaseObject();

  try {
    const sql = `
      INSERT INTO messages (
        conversation_id, user_id, parent_message_id, content, type,
        verdict, confidence, analysis_mode, image_url, image_filename,
        image_size, image_metadata, emotional_state, coaching_type,
        pattern_tags, ai_model, ai_tokens_used, ai_cost_cents,
        processing_time_ms, status, error_message, retry_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22
      )
      RETURNING id, conversation_id, user_id, parent_message_id, content, type,
               verdict, confidence, analysis_mode, image_url, image_filename,
               image_size, image_metadata, emotional_state, coaching_type,
               pattern_tags, ai_model, ai_tokens_used, ai_cost_cents,
               processing_time_ms, status, error_message, retry_count,
               created_at, updated_at, edited_at
    `;

    const params = [
      dbData.conversation_id,
      dbData.user_id,
      dbData.parent_message_id,
      dbData.content,
      dbData.type,
      dbData.verdict,
      dbData.confidence,
      dbData.analysis_mode,
      dbData.image_url,
      dbData.image_filename,
      dbData.image_size,
      JSON.stringify(dbData.image_metadata),
      dbData.emotional_state,
      dbData.coaching_type,
      JSON.stringify(dbData.pattern_tags),
      dbData.ai_model,
      dbData.ai_tokens_used,
      dbData.ai_cost_cents,
      dbData.processing_time_ms,
      dbData.status,
      dbData.error_message,
      dbData.retry_count
    ];

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      throw new Error('Failed to create message - no data returned');
    }

    return new Message(result.rows[0]).toPublicObject();
  } catch (error) {
    // Handle specific database errors
    if (error.code === '23503') { // Foreign key constraint violation
      if (error.constraint === 'messages_conversation_id_fkey') {
        throw new Error('Conversation not found');
      } else if (error.constraint === 'messages_user_id_fkey') {
        throw new Error('User not found');
      } else if (error.constraint === 'messages_parent_message_id_fkey') {
        throw new Error('Parent message not found');
      }
    }

    console.error('Message creation error:', error);
    throw new Error(`Failed to create message: ${error.message}`);
  }
}

/**
 * Get message by ID with user ownership validation
 * @param {string} messageId - Message UUID
 * @param {string} userId - User UUID (for ownership validation)
 * @returns {Promise<Object|null>} Message object or null if not found
 */
export async function getMessageById(messageId, userId) {
  if (!messageId || !userId) {
    throw new Error('Message ID and User ID are required');
  }

  try {
    const sql = `
      SELECT id, conversation_id, user_id, parent_message_id, content, type,
             verdict, confidence, analysis_mode, image_url, image_filename,
             image_size, image_metadata, emotional_state, coaching_type,
             pattern_tags, ai_model, ai_tokens_used, ai_cost_cents,
             processing_time_ms, status, error_message, retry_count,
             created_at, updated_at, edited_at
      FROM messages 
      WHERE id = $1 AND user_id = $2
    `;

    const result = await query(sql, [messageId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return new Message(result.rows[0]).toPublicObject();
  } catch (error) {
    console.error('Get message by ID error:', error);
    throw new Error(`Failed to get message by ID: ${error.message}`);
  }
}

/**
 * Get messages for a conversation with pagination
 * @param {string} conversationId - Conversation UUID
 * @param {string} userId - User UUID (for ownership validation)
 * @param {Object} options - Query options (limit, offset, order)
 * @returns {Promise<Object>} Messages array and pagination info
 */
export async function getConversationMessages(conversationId, userId, options = {}) {
  if (!conversationId || !userId) {
    throw new Error('Conversation ID and User ID are required');
  }

  const {
    limit = 50,
    offset = 0,
    order = 'ASC', // ASC for chronological, DESC for reverse
    includeMetadata = false
  } = options;

  try {
    // First verify user owns the conversation
    const ownershipCheck = await query(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      throw new Error('Conversation not found or access denied');
    }

    const selectFields = includeMetadata
      ? `id, conversation_id, user_id, parent_message_id, content, type,
         verdict, confidence, analysis_mode, image_url, image_filename,
         image_size, image_metadata, emotional_state, coaching_type,
         pattern_tags, ai_model, ai_tokens_used, ai_cost_cents,
         processing_time_ms, status, error_message, retry_count,
         created_at, updated_at, edited_at`
      : `id, conversation_id, user_id, parent_message_id, content, type,
         verdict, confidence, analysis_mode, image_url, image_filename,
         image_size, emotional_state, coaching_type, pattern_tags,
         status, created_at, updated_at, edited_at`;

    const sql = `
      SELECT ${selectFields}
      FROM messages 
      WHERE conversation_id = $1
      ORDER BY created_at ${order}
      LIMIT $2 OFFSET $3
    `;

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total_count
      FROM messages 
      WHERE conversation_id = $1
    `;

    const [messagesResult, countResult] = await Promise.all([
      query(sql, [conversationId, limit, offset]),
      query(countSql, [conversationId])
    ]);

    const messages = messagesResult.rows.map(row => new Message(row).toPublicObject());
    const totalCount = parseInt(countResult.rows[0].total_count);

    return {
      messages,
      pagination: {
        total_count: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      }
    };
  } catch (error) {
    console.error('Get conversation messages error:', error);
    throw new Error(`Failed to get conversation messages: ${error.message}`);
  }
}

/**
 * Update message with validation
 * @param {string} messageId - Message UUID
 * @param {string} userId - User UUID (for ownership validation)
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated message object
 */
export async function updateMessage(messageId, userId, updateData) {
  if (!messageId || !userId) {
    throw new Error('Message ID and User ID are required');
  }

  // Remove fields that shouldn't be updated directly
  const {
    id, conversation_id, user_id, created_at,
    ai_tokens_used, ai_cost_cents, processing_time_ms, // AI processing fields
    ...allowedUpdates
  } = updateData;

  if (Object.keys(allowedUpdates).length === 0) {
    throw new Error('No valid fields provided for update');
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Check if message exists and user owns it
    const existingMessage = await client.query(
      'SELECT id, type, status FROM messages WHERE id = $1 AND user_id = $2',
      [messageId, userId]
    );

    if (existingMessage.rows.length === 0) {
      throw new Error('Message not found or access denied');
    }

    const messageData = existingMessage.rows[0];

    // Only allow editing of user messages that aren't being processed
    if (messageData.type !== 'user') {
      throw new Error('Only user messages can be edited');
    }

    if (messageData.status === 'processing') {
      throw new Error('Cannot edit message while AI is processing');
    }

    // Build dynamic UPDATE query
    const updateFields = [];
    const params = [];
    let paramCount = 1;

    Object.entries(allowedUpdates).forEach(([key, value]) => {
      if (value !== undefined) {
        // Handle JSONB fields
        if (key === 'image_metadata' || key === 'pattern_tags') {
          updateFields.push(`${key} = $${paramCount}`);
          params.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramCount}`);
          params.push(value);
        }
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid update values provided');
    }

    // Add edited timestamp if content is being updated
    if (allowedUpdates.content) {
      updateFields.push(`edited_at = NOW()`);
    }

    // Add message ID and user ID as last parameters
    params.push(messageId, userId);

    const sql = `
      UPDATE messages 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, conversation_id, user_id, parent_message_id, content, type,
               verdict, confidence, analysis_mode, image_url, image_filename,
               image_size, image_metadata, emotional_state, coaching_type,
               pattern_tags, ai_model, ai_tokens_used, ai_cost_cents,
               processing_time_ms, status, error_message, retry_count,
               created_at, updated_at, edited_at
    `;

    const result = await client.query(sql, params);

    if (result.rows.length === 0) {
      throw new Error('Failed to update message');
    }

    await client.query('COMMIT');

    return new Message(result.rows[0]).toPublicObject();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Message update error:', error);
    throw new Error(`Failed to update message: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Delete message (soft delete by marking as deleted)
 * @param {string} messageId - Message UUID
 * @param {string} userId - User UUID (for ownership validation)
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMessage(messageId, userId) {
  if (!messageId || !userId) {
    throw new Error('Message ID and User ID are required');
  }

  try {
    // Only allow deletion of user messages
    const sql = `
      UPDATE messages 
      SET status = 'deleted', updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND type = 'user'
      RETURNING id
    `;

    const result = await query(sql, [messageId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Message not found, access denied, or cannot delete this message type');
    }

    return true;
  } catch (error) {
    console.error('Delete message error:', error);
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

/**
 * Full-text search messages across user's conversations
 * @param {string} userId - User UUID
 * @param {string} searchQuery - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results with pagination
 */
export async function searchMessages(userId, searchQuery, options = {}) {
  if (!userId || !searchQuery) {
    throw new Error('User ID and search query are required');
  }

  const {
    limit = 20,
    offset = 0,
    conversationId = null,
    analysisMode = null,
    verdictFilter = null,
    hasAttachment = null,
    dateFrom = null,
    dateTo = null
  } = options;

  try {
    let whereClause = 'WHERE m.user_id = $1 AND m.search_vector @@ plainto_tsquery($2)';
    let params = [userId, searchQuery];
    let paramCount = 3;

    // Add optional filters
    if (conversationId) {
      whereClause += ` AND m.conversation_id = $${paramCount}`;
      params.push(conversationId);
      paramCount++;
    }

    if (analysisMode) {
      whereClause += ` AND m.analysis_mode = $${paramCount}`;
      params.push(analysisMode);
      paramCount++;
    }

    if (verdictFilter) {
      whereClause += ` AND m.verdict = $${paramCount}`;
      params.push(verdictFilter);
      paramCount++;
    }

    if (hasAttachment !== null) {
      if (hasAttachment) {
        whereClause += ' AND m.image_url IS NOT NULL';
      } else {
        whereClause += ' AND m.image_url IS NULL';
      }
    }

    if (dateFrom) {
      whereClause += ` AND m.created_at >= $${paramCount}`;
      params.push(dateFrom);
      paramCount++;
    }

    if (dateTo) {
      whereClause += ` AND m.created_at <= $${paramCount}`;
      params.push(dateTo);
      paramCount++;
    }

    // Exclude deleted messages
    whereClause += " AND m.status != 'deleted'";

    const sql = `
      SELECT m.id, m.conversation_id, m.user_id, m.parent_message_id, 
             m.content, m.type, m.verdict, m.confidence, m.analysis_mode,
             m.image_url, m.image_filename, m.emotional_state, m.coaching_type,
             m.pattern_tags, m.status, m.created_at, m.updated_at,
             c.title as conversation_title,
             ts_headline('english', m.content, plainto_tsquery($2), 
                        'MaxWords=20, MinWords=10, ShortWord=3, HighlightAll=false') as highlighted_content,
             ts_rank(m.search_vector, plainto_tsquery($2)) as rank
      FROM messages m
      LEFT JOIN conversations c ON m.conversation_id = c.id
      ${whereClause}
      ORDER BY rank DESC, m.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total_count
      FROM messages m
      ${whereClause}
    `;

    params.push(limit, offset);
    const countParams = params.slice(0, -2); // Remove limit and offset for count query

    const [searchResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, countParams)
    ]);

    const messages = searchResult.rows.map(row => ({
      ...new Message(row).toPublicObject(),
      conversation_title: row.conversation_title,
      highlighted_content: row.highlighted_content,
      search_rank: parseFloat(row.rank)
    }));

    const totalCount = parseInt(countResult.rows[0].total_count);

    return {
      messages,
      search_query: searchQuery,
      pagination: {
        total_count: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      }
    };
  } catch (error) {
    console.error('Search messages error:', error);
    throw new Error(`Failed to search messages: ${error.message}`);
  }
}

/**
 * Get message thread (parent message and all its children)
 * @param {string} messageId - Root message UUID
 * @param {string} userId - User UUID (for ownership validation)
 * @returns {Promise<Object>} Thread with parent and children messages
 */
export async function getMessageThread(messageId, userId) {
  if (!messageId || !userId) {
    throw new Error('Message ID and User ID are required');
  }

  try {
    // First get the root message and verify ownership
    const rootMessage = await getMessageById(messageId, userId);
    if (!rootMessage) {
      throw new Error('Message not found or access denied');
    }

    // Get all child messages recursively using WITH RECURSIVE CTE
    const sql = `
      WITH RECURSIVE message_thread AS (
        -- Base case: start with the root message
        SELECT id, conversation_id, user_id, parent_message_id, content, type,
               verdict, confidence, analysis_mode, image_url, image_filename,
               image_size, emotional_state, coaching_type, pattern_tags,
               status, created_at, updated_at, edited_at, 0 as level
        FROM messages 
        WHERE id = $1 AND user_id = $2
        
        UNION ALL
        
        -- Recursive case: find children
        SELECT m.id, m.conversation_id, m.user_id, m.parent_message_id, m.content, m.type,
               m.verdict, m.confidence, m.analysis_mode, m.image_url, m.image_filename,
               m.image_size, m.emotional_state, m.coaching_type, m.pattern_tags,
               m.status, m.created_at, m.updated_at, m.edited_at, mt.level + 1
        FROM messages m
        INNER JOIN message_thread mt ON m.parent_message_id = mt.id
        WHERE m.user_id = $2 AND m.status != 'deleted'
      )
      SELECT * FROM message_thread
      ORDER BY level, created_at
    `;

    const result = await query(sql, [messageId, userId]);
    
    const messages = result.rows.map(row => ({
      ...new Message(row).toPublicObject(),
      thread_level: row.level
    }));

    // Separate root message from children
    const rootMsg = messages.find(m => m.thread_level === 0);
    const childMessages = messages.filter(m => m.thread_level > 0);

    return {
      root_message: rootMsg,
      child_messages: childMessages,
      thread_count: messages.length
    };
  } catch (error) {
    console.error('Get message thread error:', error);
    throw new Error(`Failed to get message thread: ${error.message}`);
  }
}

/**
 * Get child messages for a parent message
 * @param {string} parentMessageId - Parent message UUID
 * @param {string} userId - User UUID (for ownership validation)
 * @returns {Promise<Array>} Array of child messages
 */
export async function getChildMessages(parentMessageId, userId) {
  if (!parentMessageId || !userId) {
    throw new Error('Parent message ID and User ID are required');
  }

  try {
    // Verify parent message exists and user owns it
    const parentCheck = await query(
      'SELECT id FROM messages WHERE id = $1 AND user_id = $2',
      [parentMessageId, userId]
    );

    if (parentCheck.rows.length === 0) {
      throw new Error('Parent message not found or access denied');
    }

    const sql = `
      SELECT id, conversation_id, user_id, parent_message_id, content, type,
             verdict, confidence, analysis_mode, image_url, image_filename,
             image_size, emotional_state, coaching_type, pattern_tags,
             status, created_at, updated_at, edited_at
      FROM messages 
      WHERE parent_message_id = $1 AND user_id = $2 AND status != 'deleted'
      ORDER BY created_at
    `;

    const result = await query(sql, [parentMessageId, userId]);
    return result.rows.map(row => new Message(row).toPublicObject());
  } catch (error) {
    console.error('Get child messages error:', error);
    throw new Error(`Failed to get child messages: ${error.message}`);
  }
}

/**
 * Get messages by AI verdict for analytics
 * @param {string} userId - User UUID
 * @param {string} verdict - AI verdict (diamond, fire, skull)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Messages with verdict and pagination
 */
export async function getMessagesByVerdict(userId, verdict, options = {}) {
  if (!userId || !verdict) {
    throw new Error('User ID and verdict are required');
  }

  const { limit = 20, offset = 0, conversationId = null } = options;

  try {
    let whereClause = 'WHERE user_id = $1 AND verdict = $2 AND status != \'deleted\'';
    let params = [userId, verdict];
    let paramCount = 3;

    if (conversationId) {
      whereClause += ` AND conversation_id = $${paramCount}`;
      params.push(conversationId);
      paramCount++;
    }

    const sql = `
      SELECT id, conversation_id, user_id, content, type, verdict, confidence,
             analysis_mode, image_url, image_filename, emotional_state,
             coaching_type, pattern_tags, created_at, updated_at
      FROM messages 
      ${whereClause}
      ORDER BY confidence DESC, created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countSql = `
      SELECT COUNT(*) as total_count
      FROM messages 
      ${whereClause}
    `;

    params.push(limit, offset);
    const countParams = params.slice(0, -2);

    const [messagesResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, countParams)
    ]);

    const messages = messagesResult.rows.map(row => new Message(row).toPublicObject());
    const totalCount = parseInt(countResult.rows[0].total_count);

    return {
      messages,
      verdict,
      pagination: {
        total_count: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      }
    };
  } catch (error) {
    console.error('Get messages by verdict error:', error);
    throw new Error(`Failed to get messages by verdict: ${error.message}`);
  }
}

/**
 * Get psychology coaching messages
 * @param {string} userId - User UUID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Psychology messages with pagination
 */
export async function getPsychologyMessages(userId, options = {}) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const {
    limit = 20,
    offset = 0,
    emotionalState = null,
    coachingType = null,
    patternTag = null
  } = options;

  try {
    let whereClause = "WHERE user_id = $1 AND analysis_mode = 'psychology' AND status != 'deleted'";
    let params = [userId];
    let paramCount = 2;

    if (emotionalState) {
      whereClause += ` AND emotional_state = $${paramCount}`;
      params.push(emotionalState);
      paramCount++;
    }

    if (coachingType) {
      whereClause += ` AND coaching_type = $${paramCount}`;
      params.push(coachingType);
      paramCount++;
    }

    if (patternTag) {
      whereClause += ` AND pattern_tags @> $${paramCount}`;
      params.push(JSON.stringify([patternTag]));
      paramCount++;
    }

    const sql = `
      SELECT id, conversation_id, user_id, content, type, verdict, confidence,
             analysis_mode, emotional_state, coaching_type, pattern_tags,
             ai_model, status, created_at, updated_at
      FROM messages 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countSql = `
      SELECT COUNT(*) as total_count
      FROM messages 
      ${whereClause}
    `;

    params.push(limit, offset);
    const countParams = params.slice(0, -2);

    const [messagesResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, countParams)
    ]);

    const messages = messagesResult.rows.map(row => new Message(row).toPublicObject());
    const totalCount = parseInt(countResult.rows[0].total_count);

    return {
      messages,
      filters: { emotionalState, coachingType, patternTag },
      pagination: {
        total_count: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      }
    };
  } catch (error) {
    console.error('Get psychology messages error:', error);
    throw new Error(`Failed to get psychology messages: ${error.message}`);
  }
}

/**
 * Get message statistics for analytics
 * @param {string} userId - User UUID
 * @param {Object} options - Options for date range filtering
 * @returns {Promise<Object>} Message statistics
 */
export async function getMessageStats(userId, options = {}) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { dateFrom = null, dateTo = null } = options;

  try {
    let whereClause = "WHERE user_id = $1 AND status != 'deleted'";
    let params = [userId];
    let paramCount = 2;

    if (dateFrom) {
      whereClause += ` AND created_at >= $${paramCount}`;
      params.push(dateFrom);
      paramCount++;
    }

    if (dateTo) {
      whereClause += ` AND created_at <= $${paramCount}`;
      params.push(dateTo);
      paramCount++;
    }

    const sql = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE type = 'user') as user_messages,
        COUNT(*) FILTER (WHERE type = 'ai') as ai_messages,
        COUNT(*) FILTER (WHERE verdict = 'diamond') as diamond_verdicts,
        COUNT(*) FILTER (WHERE verdict = 'fire') as fire_verdicts,
        COUNT(*) FILTER (WHERE verdict = 'skull') as skull_verdicts,
        COUNT(*) FILTER (WHERE analysis_mode = 'psychology') as psychology_messages,
        COUNT(*) FILTER (WHERE image_url IS NOT NULL) as messages_with_images,
        AVG(confidence) FILTER (WHERE confidence IS NOT NULL) as avg_confidence,
        SUM(ai_cost_cents) FILTER (WHERE ai_cost_cents IS NOT NULL) as total_ai_cost_cents,
        SUM(ai_tokens_used) FILTER (WHERE ai_tokens_used IS NOT NULL) as total_tokens_used
      FROM messages 
      ${whereClause}
    `;

    const result = await query(sql, params);
    const stats = result.rows[0];

    // Convert numeric strings and format results
    return {
      total_messages: parseInt(stats.total_messages) || 0,
      user_messages: parseInt(stats.user_messages) || 0,
      ai_messages: parseInt(stats.ai_messages) || 0,
      verdicts: {
        diamond: parseInt(stats.diamond_verdicts) || 0,
        fire: parseInt(stats.fire_verdicts) || 0,
        skull: parseInt(stats.skull_verdicts) || 0
      },
      psychology_messages: parseInt(stats.psychology_messages) || 0,
      messages_with_images: parseInt(stats.messages_with_images) || 0,
      avg_confidence: stats.avg_confidence ? parseFloat(stats.avg_confidence).toFixed(1) : null,
      total_ai_cost_dollars: stats.total_ai_cost_cents ? (parseInt(stats.total_ai_cost_cents) / 100).toFixed(4) : '0.0000',
      total_tokens_used: parseInt(stats.total_tokens_used) || 0
    };
  } catch (error) {
    console.error('Get message stats error:', error);
    throw new Error(`Failed to get message statistics: ${error.message}`);
  }
}

/**
 * Update AI processing results for a message
 * @param {string} messageId - Message UUID
 * @param {Object} aiResults - AI processing results
 * @returns {Promise<Object>} Updated message object
 */
export async function updateAiResults(messageId, aiResults) {
  if (!messageId || !aiResults) {
    throw new Error('Message ID and AI results are required');
  }

  try {
    const sql = `
      UPDATE messages 
      SET verdict = $2,
          confidence = $3,
          emotional_state = $4,
          coaching_type = $5,
          pattern_tags = $6,
          ai_model = $7,
          ai_tokens_used = $8,
          ai_cost_cents = $9,
          processing_time_ms = $10,
          status = 'completed',
          error_message = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, conversation_id, user_id, parent_message_id, content, type,
               verdict, confidence, analysis_mode, image_url, image_filename,
               image_size, image_metadata, emotional_state, coaching_type,
               pattern_tags, ai_model, ai_tokens_used, ai_cost_cents,
               processing_time_ms, status, error_message, retry_count,
               created_at, updated_at, edited_at
    `;

    const params = [
      messageId,
      aiResults.verdict || null,
      aiResults.confidence || null,
      aiResults.emotional_state || null,
      aiResults.coaching_type || null,
      JSON.stringify(aiResults.pattern_tags || []),
      aiResults.ai_model || null,
      aiResults.ai_tokens_used || null,
      aiResults.ai_cost_cents || null,
      aiResults.processing_time_ms || null
    ];

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      throw new Error('Message not found');
    }

    return new Message(result.rows[0]).toPublicObject();
  } catch (error) {
    console.error('Update AI results error:', error);
    throw new Error(`Failed to update AI results: ${error.message}`);
  }
}

/**
 * Mark message processing as failed
 * @param {string} messageId - Message UUID
 * @param {string} errorMessage - Error message
 * @returns {Promise<boolean>} Success status
 */
export async function markMessageAsFailed(messageId, errorMessage) {
  if (!messageId || !errorMessage) {
    throw new Error('Message ID and error message are required');
  }

  try {
    const sql = `
      UPDATE messages 
      SET status = 'failed',
          error_message = $2,
          retry_count = retry_count + 1,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, retry_count
    `;

    const result = await query(sql, [messageId, errorMessage]);

    if (result.rows.length === 0) {
      throw new Error('Message not found');
    }

    return true;
  } catch (error) {
    console.error('Mark message as failed error:', error);
    throw new Error(`Failed to mark message as failed: ${error.message}`);
  }
}