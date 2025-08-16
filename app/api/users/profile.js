/**
 * User Profile Management API Endpoints - Elite Trading Coach AI
 * Task: BE-008 - User profile management endpoints
 * Created: 2025-08-14
 * 
 * GET and PUT endpoints for user profile management with authentication middleware,
 * input validation, and proper error handling for secure profile operations.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { 
  getUserById, 
  updateUser, 
  updateUserPassword,
  updateLastActive 
} from '../../db/queries/users.js';
import { 
  authenticateToken, 
  requireSelfAccess, 
  requireEmailVerification,
  premiumRateLimitBypass 
} from '../../middleware/auth.js';
import User from '../../models/User.js';

const router = express.Router();

// Rate limiting for profile operations
const profileRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window per IP
  message: {
    success: false,
    error: 'Too many profile requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  skip: (req) => req.isPremiumUser === true
});

// Stricter rate limit for profile updates
const updateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 updates per hour per IP
  message: {
    success: false,
    error: 'Too many profile updates. Please try again in 1 hour.',
    code: 'UPDATE_RATE_LIMIT'
  },
  skip: (req) => req.isPremiumUser === true
});

/**
 * Validate profile update data
 * @param {Object} updateData - Profile data to update
 * @returns {Object} Validation result
 */
function validateProfileData(updateData) {
  const errors = [];
  const allowedFields = [
    'first_name', 'last_name', 'avatar_url', 'timezone', 
    'trading_experience', 'email' // Email updates require verification
  ];
    
  // Check for disallowed fields
  const providedFields = Object.keys(updateData);
  const disallowedFields = providedFields.filter(field => !allowedFields.includes(field));
    
  if (disallowedFields.length > 0) {
    errors.push(`Invalid fields: ${disallowedFields.join(', ')}`);
  }
    
  // Validate each field if provided
  if (updateData.first_name !== undefined) {
    if (updateData.first_name && !User.validateFirstName(updateData.first_name)) {
      errors.push('First name contains invalid characters');
    }
  }
    
  if (updateData.last_name !== undefined) {
    if (updateData.last_name && !User.validateLastName(updateData.last_name)) {
      errors.push('Last name contains invalid characters');
    }
  }
    
  if (updateData.email !== undefined) {
    if (!User.validateEmail(updateData.email)) {
      errors.push('Invalid email format');
    }
  }
    
  if (updateData.timezone !== undefined) {
    if (updateData.timezone && !User.validateTimezone(updateData.timezone)) {
      errors.push('Invalid timezone');
    }
  }
    
  if (updateData.trading_experience !== undefined) {
    if (updateData.trading_experience && !User.validateTradingExperience(updateData.trading_experience)) {
      errors.push('Invalid trading experience level');
    }
  }
    
  if (updateData.avatar_url !== undefined) {
    if (updateData.avatar_url) {
      try {
        new URL(updateData.avatar_url);
      } catch {
        errors.push('Invalid avatar URL format');
      }
    }
  }
    
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize profile update data
 * @param {Object} updateData - Raw profile data
 * @returns {Object} Sanitized profile data
 */
function sanitizeProfileData(updateData) {
  const sanitized = {};
    
  if (updateData.first_name !== undefined) {
    sanitized.first_name = updateData.first_name ? updateData.first_name.trim() : null;
  }
    
  if (updateData.last_name !== undefined) {
    sanitized.last_name = updateData.last_name ? updateData.last_name.trim() : null;
  }
    
  if (updateData.email !== undefined) {
    sanitized.email = updateData.email.trim().toLowerCase();
  }
    
  if (updateData.timezone !== undefined) {
    sanitized.timezone = updateData.timezone;
  }
    
  if (updateData.trading_experience !== undefined) {
    sanitized.trading_experience = updateData.trading_experience;
  }
    
  if (updateData.avatar_url !== undefined) {
    sanitized.avatar_url = updateData.avatar_url ? updateData.avatar_url.trim() : null;
  }
    
  return sanitized;
}

/**
 * GET /api/users/profile/:userId
 * Get user profile information
 */
router.get('/profile/:userId', 
  profileRateLimit, 
  premiumRateLimitBypass,
  authenticateToken, 
  requireSelfAccess('userId'),
  async (req, res) => {
    try {
      const userId = req.params.userId;
            
      console.log('Profile fetch request:', {
        userId: userId,
        requestedBy: req.user.id,
        ip: req.ip
      });
            
      // Get user profile
      const userProfile = await getUserById(userId);
            
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'User profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }
            
      // Update last active timestamp
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
            
      res.json({
        success: true,
        data: {
          user: userProfile
        }
      });
            
    } catch (error) {
      console.error('Profile fetch error:', error);
            
      res.status(500).json({
        success: false,
        error: 'Unable to fetch profile',
        code: 'PROFILE_FETCH_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * GET /api/users/profile
 * Get current user's profile (shorthand)
 */
router.get('/profile', 
  profileRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
            
      const userProfile = await getUserById(userId);
            
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'User profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }
            
      // Update last active timestamp
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
            
      res.json({
        success: true,
        data: {
          user: userProfile
        }
      });
            
    } catch (error) {
      console.error('Current profile fetch error:', error);
            
      res.status(500).json({
        success: false,
        error: 'Unable to fetch profile',
        code: 'PROFILE_FETCH_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * PUT /api/users/profile/:userId
 * Update user profile information
 */
router.put('/profile/:userId',
  profileRateLimit,
  updateRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  requireSelfAccess('userId'),
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const updateData = req.body;
            
      console.log('Profile update request:', {
        userId: userId,
        updatedBy: req.user.id,
        fields: Object.keys(updateData),
        ip: req.ip
      });
            
      // Validate update data
      const validation = validateProfileData(updateData);
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
      const sanitizedData = sanitizeProfileData(updateData);
            
      // Special handling for email changes
      if (sanitizedData.email) {
        // Email changes should trigger verification process
        // For now, we'll mark email as unverified
        sanitizedData.email_verified = false;
                
        console.log('Email change detected - verification required');
      }
            
      // Update user profile
      const updatedUser = await updateUser(userId, sanitizedData);
            
      console.log('Profile updated successfully:', {
        userId: userId,
        updatedFields: Object.keys(sanitizedData)
      });
            
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser
        }
      });
            
    } catch (error) {
      console.error('Profile update error:', error);
            
      // Handle specific error types
      if (error.message.includes('already in use')) {
        return res.status(409).json({
          success: false,
          error: error.message,
          code: 'CONFLICT_ERROR'
        });
      } else if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      } else if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Profile update failed',
          code: 'UPDATE_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * PUT /api/users/profile
 * Update current user's profile (shorthand)
 */
router.put('/profile',
  profileRateLimit,
  updateRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
            
      // Validate update data
      const validation = validateProfileData(updateData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
          code: 'VALIDATION_ERROR'
        });
      }
            
      // Sanitize and update
      const sanitizedData = sanitizeProfileData(updateData);
            
      // Handle email changes
      if (sanitizedData.email) {
        sanitizedData.email_verified = false;
      }
            
      const updatedUser = await updateUser(userId, sanitizedData);
            
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser
        }
      });
            
    } catch (error) {
      console.error('Current profile update error:', error);
            
      if (error.message.includes('already in use')) {
        return res.status(409).json({
          success: false,
          error: error.message,
          code: 'CONFLICT_ERROR'
        });
      } else if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Profile update failed',
          code: 'UPDATE_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * PUT /api/users/profile/:userId/password
 * Update user password
 */
router.put('/profile/:userId/password',
  updateRateLimit,
  authenticateToken,
  requireSelfAccess('userId'),
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const { current_password, new_password, confirm_password } = req.body;
            
      console.log('Password update request:', {
        userId: userId,
        requestedBy: req.user.id,
        ip: req.ip
      });
            
      // Validate input
      if (!current_password) {
        return res.status(400).json({
          success: false,
          error: 'Current password is required',
          code: 'CURRENT_PASSWORD_REQUIRED'
        });
      }
            
      if (!new_password) {
        return res.status(400).json({
          success: false,
          error: 'New password is required',
          code: 'NEW_PASSWORD_REQUIRED'
        });
      }
            
      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          error: 'Password confirmation does not match',
          code: 'PASSWORD_MISMATCH'
        });
      }
            
      // Validate new password strength
      if (!User.validatePassword(new_password)) {
        return res.status(400).json({
          success: false,
          error: 'New password does not meet security requirements',
          code: 'PASSWORD_WEAK'
        });
      }
            
      // Verify current password
      const user = new User(req.user);
      user.passwordHash = req.user.password_hash;
            
      const currentPasswordValid = await user.verifyPassword(current_password);
      if (!currentPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }
            
      // Update password
      await updateUserPassword(userId, new_password);
            
      console.log('Password updated successfully:', { userId });
            
      res.json({
        success: true,
        message: 'Password updated successfully'
      });
            
    } catch (error) {
      console.error('Password update error:', error);
            
      if (error.message.includes('security requirements')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'PASSWORD_WEAK'
        });
      } else if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Password update failed',
          code: 'PASSWORD_UPDATE_FAILED',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
      }
    }
  }
);

/**
 * DELETE /api/users/profile/:userId
 * Soft delete user account
 */
router.delete('/profile/:userId',
  authenticateToken,
  requireSelfAccess('userId'),
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const { confirmation } = req.body;
            
      // Require explicit confirmation
      if (confirmation !== 'DELETE_MY_ACCOUNT') {
        return res.status(400).json({
          success: false,
          error: 'Account deletion requires confirmation',
          code: 'CONFIRMATION_REQUIRED',
          required_confirmation: 'DELETE_MY_ACCOUNT'
        });
      }
            
      console.log('Account deletion request:', {
        userId: userId,
        requestedBy: req.user.id,
        ip: req.ip
      });
            
      // Import here to avoid circular dependencies
      const { softDeleteUser } = await import('../../db/queries/users.js');
      await softDeleteUser(userId);
            
      console.log('Account soft deleted:', { userId });
            
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
            
    } catch (error) {
      console.error('Account deletion error:', error);
            
      res.status(500).json({
        success: false,
        error: 'Account deletion failed',
        code: 'DELETION_FAILED',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

export default router;