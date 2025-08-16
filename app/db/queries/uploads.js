import { query } from '../connection.js';

/**
 * Upload-related database queries
 */

/**
 * Create a new upload record
 */
export const createUpload = async (uploadData) => {
  const {
    userId,
    conversationId,
    cloudinaryPublicId,
    originalFilename,
    fileType,
    fileSize,
    secureUrl,
    thumbnailUrl,
    context = 'chat'
  } = uploadData;

  const result = await query(`
    INSERT INTO uploads (
      user_id, conversation_id, cloudinary_public_id, 
      original_filename, file_type, file_size, secure_url, 
      thumbnail_url, context, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
    ) RETURNING *
  `, [
    userId,
    conversationId || null,
    cloudinaryPublicId,
    originalFilename,
    fileType,
    fileSize,
    secureUrl,
    thumbnailUrl,
    context
  ]);

  return result.rows[0];
};

/**
 * Get upload by ID
 */
export const getUploadById = async (uploadId, userId = null) => {
  let queryText = `
    SELECT 
      u.id, u.user_id, u.conversation_id, u.cloudinary_public_id,
      u.original_filename, u.file_type, u.file_size, u.secure_url,
      u.thumbnail_url, u.context, u.created_at, u.updated_at,
      usr.email as uploader_email,
      CONCAT(usr.first_name, ' ', usr.last_name) as uploader_name
    FROM uploads u
    LEFT JOIN users usr ON u.user_id = usr.id
    WHERE u.id = $1
  `;
  
  const params = [uploadId];
  
  // If userId is provided, add user restriction
  if (userId) {
    queryText += ' AND u.user_id = $2';
    params.push(userId);
  }

  const result = await query(queryText, params);
  return result.rows[0];
};

/**
 * Get uploads by user ID
 */
export const getUploadsByUserId = async (userId, options = {}) => {
  const {
    limit = 50,
    offset = 0,
    context = null,
    conversationId = null
  } = options;

  let queryText = `
    SELECT 
      u.id, u.conversation_id, u.cloudinary_public_id,
      u.original_filename, u.file_type, u.file_size, u.secure_url,
      u.thumbnail_url, u.context, u.created_at, u.updated_at
    FROM uploads u
    WHERE u.user_id = $1
  `;
  
  const params = [userId];
  let paramIndex = 2;

  // Add context filter if provided
  if (context) {
    queryText += ` AND u.context = $${paramIndex}`;
    params.push(context);
    paramIndex++;
  }

  // Add conversation filter if provided
  if (conversationId) {
    queryText += ` AND u.conversation_id = $${paramIndex}`;
    params.push(conversationId);
    paramIndex++;
  }

  queryText += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await query(queryText, params);
  return result.rows;
};

/**
 * Get uploads by conversation ID
 */
export const getUploadsByConversationId = async (conversationId, userId) => {
  const result = await query(`
    SELECT 
      u.id, u.cloudinary_public_id, u.original_filename, 
      u.file_type, u.file_size, u.secure_url, u.thumbnail_url,
      u.context, u.created_at, u.updated_at
    FROM uploads u
    INNER JOIN conversations c ON u.conversation_id = c.id
    WHERE u.conversation_id = $1 
      AND c.user_id = $2
    ORDER BY u.created_at ASC
  `, [conversationId, userId]);

  return result.rows;
};

/**
 * Update upload record
 */
export const updateUpload = async (uploadId, userId, updateData) => {
  const allowedFields = ['original_filename', 'context'];
  const updateFields = [];
  const params = [];
  let paramIndex = 1;

  // Build dynamic update query
  Object.keys(updateData).forEach(field => {
    if (allowedFields.includes(field)) {
      updateFields.push(`${field} = $${paramIndex}`);
      params.push(updateData[field]);
      paramIndex++;
    }
  });

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  // Add WHERE clause parameters
  params.push(uploadId, userId);

  const queryText = `
    UPDATE uploads 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
    RETURNING *
  `;

  const result = await query(queryText, params);
  return result.rows[0];
};

/**
 * Delete upload record
 */
export const deleteUpload = async (uploadId, userId) => {
  const result = await query(`
    DELETE FROM uploads 
    WHERE id = $1 AND user_id = $2
    RETURNING cloudinary_public_id, original_filename
  `, [uploadId, userId]);

  return result.rows[0];
};

/**
 * Get upload statistics for a user
 */
export const getUploadStats = async (userId) => {
  const result = await query(`
    SELECT 
      COUNT(*) as total_uploads,
      SUM(file_size) as total_bytes,
      AVG(file_size) as avg_file_size,
      COUNT(DISTINCT context) as contexts_used,
      MIN(created_at) as first_upload,
      MAX(created_at) as last_upload
    FROM uploads 
    WHERE user_id = $1
  `, [userId]);

  return result.rows[0];
};

/**
 * Get uploads by context
 */
export const getUploadsByContext = async (context, userId, options = {}) => {
  const { limit = 20, offset = 0 } = options;

  const result = await query(`
    SELECT 
      u.id, u.conversation_id, u.cloudinary_public_id,
      u.original_filename, u.file_type, u.file_size, u.secure_url,
      u.thumbnail_url, u.created_at, u.updated_at
    FROM uploads u
    WHERE u.context = $1 AND u.user_id = $2
    ORDER BY u.created_at DESC
    LIMIT $3 OFFSET $4
  `, [context, userId, limit, offset]);

  return result.rows;
};

/**
 * Clean up old uploads (for maintenance)
 */
export const cleanupOldUploads = async (daysOld = 365) => {
  const result = await query(`
    DELETE FROM uploads 
    WHERE created_at < NOW() - INTERVAL '${daysOld} days'
    RETURNING cloudinary_public_id, original_filename
  `);

  return result.rows;
};

/**
 * Get upload count by user in time period
 */
export const getUploadCountInPeriod = async (userId, hours = 24) => {
  const result = await query(`
    SELECT COUNT(*) as upload_count
    FROM uploads 
    WHERE user_id = $1 
      AND created_at > NOW() - INTERVAL '${hours} hours'
  `, [userId]);

  return parseInt(result.rows[0].upload_count);
};

/**
 * Check if user has access to upload
 */
export const checkUploadAccess = async (uploadId, userId) => {
  const result = await query(`
    SELECT EXISTS(
      SELECT 1 FROM uploads 
      WHERE id = $1 AND user_id = $2
    ) as has_access
  `, [uploadId, userId]);

  return result.rows[0].has_access;
};