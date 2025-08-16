/**
 * User CRUD Operations - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.2-users-table.md
 * Task: BE-005 - User database operations
 * Created: 2025-08-14
 * 
 * Implements comprehensive user CRUD operations with security considerations,
 * performance optimization, and proper error handling.
 */

import { query, getClient } from '../connection.js';
import User from '../../models/User.js';

/**
 * Create a new user with secure password hashing
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Created user object (without password hash)
 * @throws {Error} If creation fails or validation errors occur
 */
export async function createUser(userData) {
  // Validate input data
  const validation = User.validate(userData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Create User instance and hash password
  const user = new User(userData);
    
  if (!userData.password) {
    throw new Error('Password is required for user creation');
  }
    
  await user.setPassword(userData.password);

  const dbData = user.toDatabaseObject();
    
  try {
    const sql = `
            INSERT INTO users (
                email, username, password_hash, first_name, last_name, 
                avatar_url, timezone, trading_experience, subscription_tier,
                is_active, email_verified
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            )
            RETURNING id, email, username, first_name, last_name, avatar_url,
                     timezone, trading_experience, subscription_tier, is_active,
                     email_verified, last_active, created_at, updated_at
        `;

    const params = [
      dbData.email,
      dbData.username,
      dbData.password_hash,
      dbData.first_name,
      dbData.last_name,
      dbData.avatar_url,
      dbData.timezone,
      dbData.trading_experience,
      dbData.subscription_tier,
      dbData.is_active,
      dbData.email_verified
    ];

    const result = await query(sql, params);
        
    if (result.rows.length === 0) {
      throw new Error('Failed to create user - no data returned');
    }

    return new User(result.rows[0]).toPublicObject();
  } catch (error) {
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      if (error.constraint === 'users_email_key') {
        throw new Error('Email address is already registered');
      } else if (error.constraint === 'users_username_key') {
        throw new Error('Username is already taken');
      }
    }
        
    console.error('User creation error:', error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

/**
 * Find user by email address (for authentication)
 * @param {string} email - User email address
 * @param {boolean} includeHash - Whether to include password hash (for authentication)
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function findUserByEmail(email, includeHash = false) {
  if (!email || typeof email !== 'string') {
    throw new Error('Valid email address is required');
  }

  try {
    const sql = `
            SELECT id, email, username, ${includeHash ? 'password_hash,' : ''} 
                   first_name, last_name, avatar_url, timezone, 
                   trading_experience, subscription_tier, is_active, 
                   email_verified, last_login, last_active, 
                   created_at, updated_at, deleted_at
            FROM users 
            WHERE email = $1 AND deleted_at IS NULL
        `;

    const result = await query(sql, [email.toLowerCase()]);
        
    if (result.rows.length === 0) {
      return null;
    }

    const userData = result.rows[0];
    const user = new User(userData);
        
    return includeHash ? userData : user.toPublicObject();
  } catch (error) {
    console.error('Find user by email error:', error);
    throw new Error(`Failed to find user by email: ${error.message}`);
  }
}

/**
 * Find user by username (for authentication)
 * @param {string} username - Username
 * @param {boolean} includeHash - Whether to include password hash (for authentication)
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function findUserByUsername(username, includeHash = false) {
  if (!username || typeof username !== 'string') {
    throw new Error('Valid username is required');
  }

  try {
    const sql = `
            SELECT id, email, username, ${includeHash ? 'password_hash,' : ''} 
                   first_name, last_name, avatar_url, timezone, 
                   trading_experience, subscription_tier, is_active, 
                   email_verified, last_login, last_active, 
                   created_at, updated_at, deleted_at
            FROM users 
            WHERE username = $1 AND deleted_at IS NULL
        `;

    const result = await query(sql, [username.toLowerCase()]);
        
    if (result.rows.length === 0) {
      return null;
    }

    const userData = result.rows[0];
    const user = new User(userData);
        
    return includeHash ? userData : user.toPublicObject();
  } catch (error) {
    console.error('Find user by username error:', error);
    throw new Error(`Failed to find user by username: ${error.message}`);
  }
}

/**
 * Get user by ID with active status check
 * @param {string} userId - User UUID
 * @param {boolean} activeOnly - Whether to return only active users
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserById(userId, activeOnly = true) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    let sql = `
            SELECT id, email, username, first_name, last_name, avatar_url,
                   timezone, trading_experience, subscription_tier, is_active,
                   email_verified, last_login, last_active, created_at, updated_at, deleted_at
            FROM users 
            WHERE id = $1
        `;

    // Add active filter if requested
    if (activeOnly) {
      sql += ' AND is_active = TRUE AND deleted_at IS NULL';
    }

    const result = await query(sql, [userId]);
        
    if (result.rows.length === 0) {
      return null;
    }

    const user = new User(result.rows[0]);
    return user.toPublicObject();
  } catch (error) {
    console.error('Get user by ID error:', error);
    throw new Error(`Failed to get user by ID: ${error.message}`);
  }
}

/**
 * Update user profile information
 * @param {string} userId - User UUID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If update fails or user not found
 */
export async function updateUser(userId, updateData) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Remove fields that shouldn't be updated directly
  const { password, id, created_at, password_hash, ...allowedUpdates } = updateData;

  // Validate update data
  if (Object.keys(allowedUpdates).length === 0) {
    throw new Error('No valid fields provided for update');
  }

  // Validate each field
  const tempUserData = { ...allowedUpdates };
  const validation = User.validate(tempUserData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  const client = await getClient();
    
  try {
    await client.query('BEGIN');

    // Check if user exists and is active
    const existingUser = await client.query(
      'SELECT id FROM users WHERE id = $1 AND is_active = TRUE AND deleted_at IS NULL',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      throw new Error('User not found or inactive');
    }

    // Build dynamic UPDATE query
    const updateFields = [];
    const params = [];
    let paramCount = 1;

    Object.entries(allowedUpdates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        updateFields.push(`${key} = $${paramCount}`);
        params.push(value);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid update values provided');
    }

    // Add user ID as last parameter
    params.push(userId);

    const sql = `
            UPDATE users 
            SET ${updateFields.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCount}
            RETURNING id, email, username, first_name, last_name, avatar_url,
                     timezone, trading_experience, subscription_tier, is_active,
                     email_verified, last_login, last_active, created_at, updated_at
        `;

    const result = await client.query(sql, params);
        
    if (result.rows.length === 0) {
      throw new Error('Failed to update user');
    }

    await client.query('COMMIT');
        
    const user = new User(result.rows[0]);
    return user.toPublicObject();
  } catch (error) {
    await client.query('ROLLBACK');
        
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      if (error.constraint === 'users_email_key') {
        throw new Error('Email address is already in use');
      } else if (error.constraint === 'users_username_key') {
        throw new Error('Username is already taken');
      }
    }
        
    console.error('User update error:', error);
    throw new Error(`Failed to update user: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Update user password with proper hashing
 * @param {string} userId - User UUID
 * @param {string} newPassword - New plain text password
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserPassword(userId, newPassword) {
  if (!userId || !newPassword) {
    throw new Error('User ID and new password are required');
  }

  // Validate password strength
  if (!User.validatePassword(newPassword)) {
    throw new Error('Password does not meet security requirements');
  }

  try {
    // Hash the new password
    const passwordHash = await User.hashPassword(newPassword);

    const sql = `
            UPDATE users 
            SET password_hash = $1, updated_at = NOW()
            WHERE id = $2 AND is_active = TRUE AND deleted_at IS NULL
            RETURNING id
        `;

    const result = await query(sql, [passwordHash, userId]);
        
    if (result.rows.length === 0) {
      throw new Error('User not found or inactive');
    }

    return true;
  } catch (error) {
    console.error('Password update error:', error);
    throw new Error(`Failed to update password: ${error.message}`);
  }
}

/**
 * Soft delete a user (mark as deleted without removing data)
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} Success status
 */
export async function softDeleteUser(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const client = await getClient();
    
  try {
    await client.query('BEGIN');

    // Check if user exists
    const existingUser = await client.query(
      'SELECT id, deleted_at FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      throw new Error('User not found');
    }

    if (existingUser.rows[0].deleted_at) {
      throw new Error('User is already deleted');
    }

    // Soft delete user
    const result = await client.query(`
            UPDATE users 
            SET deleted_at = NOW(), is_active = FALSE, updated_at = NOW()
            WHERE id = $1
            RETURNING id, deleted_at
        `, [userId]);

    if (result.rows.length === 0) {
      throw new Error('Failed to delete user');
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Soft delete error:', error);
    throw new Error(`Failed to delete user: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Restore a soft deleted user
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} Success status
 */
export async function restoreUser(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const sql = `
            UPDATE users 
            SET deleted_at = NULL, is_active = TRUE, updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NOT NULL
            RETURNING id
        `;

    const result = await query(sql, [userId]);
        
    if (result.rows.length === 0) {
      throw new Error('User not found or not deleted');
    }

    return true;
  } catch (error) {
    console.error('Restore user error:', error);
    throw new Error(`Failed to restore user: ${error.message}`);
  }
}

/**
 * Update user's last active timestamp
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} Success status
 */
export async function updateLastActive(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const sql = `
            UPDATE users 
            SET last_active = NOW()
            WHERE id = $1 AND is_active = TRUE AND deleted_at IS NULL
        `;

    await query(sql, [userId]);
    return true;
  } catch (error) {
    console.error('Update last active error:', error);
    return false;
  }
}

/**
 * Update user's last login timestamp
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} Success status
 */
export async function updateLastLogin(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const sql = `
            UPDATE users 
            SET last_login = NOW(), last_active = NOW()
            WHERE id = $1 AND is_active = TRUE AND deleted_at IS NULL
        `;

    await query(sql, [userId]);
    return true;
  } catch (error) {
    console.error('Update last login error:', error);
    return false;
  }
}

/**
 * Get users by subscription tier (for analytics and management)
 * @param {string} tier - Subscription tier
 * @param {number} limit - Maximum number of users to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of user objects
 */
export async function getUsersBySubscriptionTier(tier, limit = 100, offset = 0) {
  if (!tier || !User.validateSubscriptionTier(tier)) {
    throw new Error('Valid subscription tier is required');
  }

  try {
    const sql = `
            SELECT id, email, username, first_name, last_name, trading_experience,
                   subscription_tier, is_active, email_verified, last_active, created_at
            FROM users 
            WHERE subscription_tier = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;

    const result = await query(sql, [tier, limit, offset]);
        
    return result.rows.map(row => new User(row).toPublicObject());
  } catch (error) {
    console.error('Get users by subscription tier error:', error);
    throw new Error(`Failed to get users by subscription tier: ${error.message}`);
  }
}

/**
 * Search users by name or username
 * @param {string} searchTerm - Search term
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of user objects
 */
export async function searchUsers(searchTerm, limit = 50) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    throw new Error('Valid search term is required');
  }

  try {
    const sql = `
            SELECT id, username, first_name, last_name, trading_experience,
                   subscription_tier, is_active, email_verified, last_active, created_at
            FROM users 
            WHERE (
                username ILIKE $1 OR 
                first_name ILIKE $1 OR 
                last_name ILIKE $1 OR
                CONCAT(first_name, ' ', last_name) ILIKE $1
            )
            AND is_active = TRUE AND deleted_at IS NULL
            ORDER BY 
                CASE WHEN username ILIKE $1 THEN 1 ELSE 2 END,
                last_active DESC
            LIMIT $2
        `;

    const searchPattern = `%${searchTerm}%`;
    const result = await query(sql, [searchPattern, limit]);
        
    return result.rows.map(row => new User(row).toPublicObject());
  } catch (error) {
    console.error('Search users error:', error);
    throw new Error(`Failed to search users: ${error.message}`);
  }
}

/**
 * Get user statistics for analytics
 * @returns {Promise<Object>} User statistics object
 */
export async function getUserStats() {
  try {
    const sql = `
            SELECT 
                COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_users,
                COUNT(*) FILTER (WHERE is_active = TRUE AND deleted_at IS NULL) as active_users,
                COUNT(*) FILTER (WHERE email_verified = TRUE AND deleted_at IS NULL) as verified_users,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND deleted_at IS NULL) as new_users_30d,
                COUNT(*) FILTER (WHERE last_active >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL) as active_7d,
                COUNT(*) FILTER (WHERE subscription_tier = 'free' AND deleted_at IS NULL) as free_users,
                COUNT(*) FILTER (WHERE subscription_tier = 'founder' AND deleted_at IS NULL) as founder_users,
                COUNT(*) FILTER (WHERE subscription_tier = 'pro' AND deleted_at IS NULL) as pro_users
            FROM users
        `;

    const result = await query(sql);
    return result.rows[0];
  } catch (error) {
    console.error('Get user stats error:', error);
    throw new Error(`Failed to get user statistics: ${error.message}`);
  }
}