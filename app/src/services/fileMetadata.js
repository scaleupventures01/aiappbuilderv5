import { pool } from '../../db/connection.js';

/**
 * File Metadata Service
 * Handles CRUD operations for file metadata in the database
 */

/**
 * Create file metadata record
 * @param {Object} fileData - File metadata object
 * @returns {Promise<Object>} Created file record
 */
export const createFileRecord = async (fileData) => {
  const client = await pool.connect();
  
  try {
    const {
      publicId,
      originalFilename,
      sanitizedFilename,
      cloudinaryUrl,
      secureUrl,
      fileSize,
      mimeType,
      fileFormat,
      resourceType = 'image',
      width = null,
      height = null,
      uploadType = 'general',
      category = 'uncategorized',
      folderPath = null,
      uploadedBy,
      uploadIp = null,
      tradeId = null,
      conversationId = null,
      description = null,
      tags = [],
      uploadSource = 'web_app',
      clientMetadata = {},
      isPublic = false,
      accessLevel = 'private'
    } = fileData;
    
    const query = `
      INSERT INTO files (
        public_id, original_filename, sanitized_filename, cloudinary_url, secure_url,
        file_size, mime_type, file_format, resource_type, width, height,
        upload_type, category, folder_path, uploaded_by, upload_ip,
        trade_id, conversation_id, description, tags, upload_source,
        client_metadata, is_public, access_level
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *
    `;
    
    const values = [
      publicId, originalFilename, sanitizedFilename, cloudinaryUrl, secureUrl,
      fileSize, mimeType, fileFormat, resourceType, width, height,
      uploadType, category, folderPath, uploadedBy, uploadIp,
      tradeId, conversationId, description, tags, uploadSource,
      JSON.stringify(clientMetadata), isPublic, accessLevel
    ];
    
    const result = await client.query(query, values);
    
    return {
      success: true,
      data: result.rows[0]
    };
    
  } catch (error) {
    console.error('Error creating file record:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

/**
 * Get file metadata by public ID
 * @param {string} publicId - Cloudinary public ID
 * @param {number} userId - Optional user ID for access control
 * @returns {Promise<Object>} File record
 */
export const getFileByPublicId = async (publicId, userId = null) => {
  const client = await pool.connect();
  
  try {
    let query = `
      SELECT f.*, u.email as uploader_email
      FROM files f
      JOIN users u ON f.uploaded_by = u.id
      WHERE f.public_id = $1 AND f.deleted_at IS NULL
    `;
    
    const values = [publicId];
    
    // Add user access control if userId is provided
    if (userId) {
      query += ` AND (f.uploaded_by = $2 OR f.is_public = true OR f.access_level = 'shared')`;
      values.push(userId);
    }
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'File not found or access denied'
      };
    }
    
    return {
      success: true,
      data: result.rows[0]
    };
    
  } catch (error) {
    console.error('Error fetching file by public ID:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

/**
 * Get files by user ID with pagination and filtering
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Files list with pagination
 */
export const getFilesByUser = async (userId, options = {}) => {
  const client = await pool.connect();
  
  try {
    const {
      page = 1,
      limit = 20,
      uploadType = null,
      category = null,
      searchTerm = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = ['f.uploaded_by = $1', 'f.deleted_at IS NULL'];
    let values = [userId];
    let paramCount = 1;
    
    // Add upload type filter
    if (uploadType) {
      paramCount++;
      whereConditions.push(`f.upload_type = $${paramCount}`);
      values.push(uploadType);
    }
    
    // Add category filter
    if (category) {
      paramCount++;
      whereConditions.push(`f.category = $${paramCount}`);
      values.push(category);
    }
    
    // Add search term filter
    if (searchTerm) {
      paramCount++;
      whereConditions.push(`(
        f.original_filename ILIKE $${paramCount} OR 
        f.description ILIKE $${paramCount} OR 
        array_to_string(f.tags, ',') ILIKE $${paramCount}
      )`);
      values.push(`%${searchTerm}%`);
    }
    
    // Validate sort column
    const validSortColumns = ['created_at', 'updated_at', 'original_filename', 'file_size', 'upload_type'];
    const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Build the main query
    const query = `
      SELECT 
        f.*,
        COUNT(*) OVER() as total_count
      FROM files f
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY f.${finalSortBy} ${finalSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    values.push(limit, offset);
    
    const result = await client.query(query, values);
    
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Remove total_count from each row
    const files = result.rows.map(row => {
      const { total_count, ...fileData } = row;
      return fileData;
    });
    
    return {
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    };
    
  } catch (error) {
    console.error('Error fetching user files:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

/**
 * Update file metadata
 * @param {string} publicId - Cloudinary public ID
 * @param {number} userId - User ID for access control
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated file record
 */
export const updateFileMetadata = async (publicId, userId, updateData) => {
  const client = await pool.connect();
  
  try {
    // First check if user has permission to update this file
    const permissionCheck = await client.query(
      'SELECT id FROM files WHERE public_id = $1 AND uploaded_by = $2 AND deleted_at IS NULL',
      [publicId, userId]
    );
    
    if (permissionCheck.rows.length === 0) {
      return {
        success: false,
        error: 'File not found or access denied'
      };
    }
    
    // Build dynamic update query
    const allowedFields = [
      'description', 'tags', 'category', 'is_public', 'access_level',
      'client_metadata', 'processing_status', 'virus_scan_status'
    ];
    
    const updateFields = [];
    const values = [];
    let paramCount = 0;
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        
        // Handle JSON fields
        if (['client_metadata', 'virus_scan_result'].includes(key)) {
          values.push(JSON.stringify(updateData[key]));
        } else {
          values.push(updateData[key]);
        }
      }
    });
    
    if (updateFields.length === 0) {
      return {
        success: false,
        error: 'No valid fields to update'
      };
    }
    
    // Add WHERE conditions
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(publicId, userId);
    
    const query = `
      UPDATE files 
      SET ${updateFields.join(', ')}
      WHERE public_id = $${paramCount + 1} AND uploaded_by = $${paramCount + 2} AND deleted_at IS NULL
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Failed to update file'
      };
    }
    
    return {
      success: true,
      data: result.rows[0]
    };
    
  } catch (error) {
    console.error('Error updating file metadata:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

/**
 * Soft delete file record
 * @param {string} publicId - Cloudinary public ID
 * @param {number} userId - User ID for access control
 * @returns {Promise<Object>} Deletion result
 */
export const softDeleteFile = async (publicId, userId) => {
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE files 
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE public_id = $1 AND uploaded_by = $2 AND deleted_at IS NULL
      RETURNING id, public_id, original_filename
    `;
    
    const result = await client.query(query, [publicId, userId]);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'File not found or access denied'
      };
    }
    
    return {
      success: true,
      data: result.rows[0]
    };
    
  } catch (error) {
    console.error('Error soft deleting file:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

/**
 * Get user storage statistics
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Storage statistics
 */
export const getUserStorageStats = async (userId) => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT * FROM get_user_storage_usage($1)
    `;
    
    const result = await client.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return {
        success: true,
        data: {
          total_files: 0,
          total_size: 0,
          size_by_type: {},
          quota_percentage: 0
        }
      };
    }
    
    return {
      success: true,
      data: result.rows[0]
    };
    
  } catch (error) {
    console.error('Error fetching user storage stats:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

/**
 * Get files by trade ID
 * @param {number} tradeId - Trade ID
 * @param {number} userId - User ID for access control
 * @returns {Promise<Object>} Files associated with trade
 */
export const getFilesByTradeId = async (tradeId, userId) => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT f.*
      FROM files f
      WHERE f.trade_id = $1 
      AND (f.uploaded_by = $2 OR f.is_public = true OR f.access_level = 'shared')
      AND f.deleted_at IS NULL
      ORDER BY f.created_at DESC
    `;
    
    const result = await client.query(query, [tradeId, userId]);
    
    return {
      success: true,
      data: result.rows
    };
    
  } catch (error) {
    console.error('Error fetching files by trade ID:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

/**
 * Search files by tags
 * @param {Array} tags - Array of tags to search
 * @param {number} userId - Optional user ID for access control
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Matching files
 */
export const searchFilesByTags = async (tags, userId = null, options = {}) => {
  const client = await pool.connect();
  
  try {
    const { limit = 50, page = 1 } = options;
    const offset = (page - 1) * limit;
    
    let whereConditions = ['f.deleted_at IS NULL'];
    let values = [tags];
    let paramCount = 1;
    
    // Add tags search condition
    whereConditions.push(`f.tags && $${paramCount}`);
    
    // Add user access control if userId is provided
    if (userId) {
      paramCount++;
      whereConditions.push(`(f.uploaded_by = $${paramCount} OR f.is_public = true OR f.access_level = 'shared')`);
      values.push(userId);
    } else {
      whereConditions.push(`f.is_public = true`);
    }
    
    const query = `
      SELECT 
        f.*,
        u.email as uploader_email,
        COUNT(*) OVER() as total_count
      FROM files f
      JOIN users u ON f.uploaded_by = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY f.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    values.push(limit, offset);
    
    const result = await client.query(query, values);
    
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const files = result.rows.map(row => {
      const { total_count, ...fileData } = row;
      return fileData;
    });
    
    return {
      success: true,
      data: {
        files,
        totalCount,
        page,
        limit
      }
    };
    
  } catch (error) {
    console.error('Error searching files by tags:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

/**
 * Get file statistics for admin dashboard
 * @returns {Promise<Object>} Overall file statistics
 */
export const getFileStatistics = async () => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT * FROM file_stats ORDER BY total_files DESC
    `;
    
    const result = await client.query(query);
    
    // Get additional system statistics
    const systemStatsQuery = `
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_storage,
        COUNT(DISTINCT uploaded_by) as total_users,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as files_this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as files_this_month
      FROM files
      WHERE deleted_at IS NULL
    `;
    
    const systemResult = await client.query(systemStatsQuery);
    
    return {
      success: true,
      data: {
        byType: result.rows,
        system: systemResult.rows[0]
      }
    };
    
  } catch (error) {
    console.error('Error fetching file statistics:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

/**
 * Cleanup deleted files (permanently delete old soft-deleted records)
 * @param {number} olderThanDays - Delete records older than this many days
 * @returns {Promise<Object>} Cleanup result
 */
export const cleanupDeletedFiles = async (olderThanDays = 30) => {
  const client = await pool.connect();
  
  try {
    const query = `SELECT cleanup_deleted_files($1)`;
    const result = await client.query(query, [olderThanDays]);
    
    return {
      success: true,
      data: {
        deletedCount: result.rows[0].cleanup_deleted_files
      }
    };
    
  } catch (error) {
    console.error('Error cleaning up deleted files:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};