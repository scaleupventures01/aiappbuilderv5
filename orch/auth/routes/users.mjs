/**
 * User Management Routes
 * Handles user profile, sessions, and account management
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { database } from '../lib/database.mjs';
import { logger, logAuthEvent, logSecurityEvent } from '../lib/logger.mjs';
import { ensureAuthenticated } from '../lib/passport-config.mjs';
import { verifyJWTMiddleware, getUserRefreshTokens, revokeRefreshToken } from '../lib/jwt-utils.mjs';
import { rateLimiter } from '../middleware/rateLimiter.mjs';
import { asyncErrorHandler } from '../middleware/errorHandler.mjs';

const router = express.Router();

/**
 * Get user profile
 */
router.get('/profile',
  ensureAuthenticated,
  asyncErrorHandler(async (req, res) => {
    try {
      const user = await database.models.User.findByPk(req.user.id, {
        include: [
          {
            model: database.models.OAuthProvider,
            as: 'oauthProviders',
            where: { isActive: true },
            required: false,
            attributes: ['provider', 'email', 'displayName', 'lastUsedAt', 'createdAt']
          }
        ]
      });
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          locale: user.locale,
          timezone: user.timezone,
          isVerified: user.isVerified,
          lastLoginAt: user.lastLoginAt,
          loginCount: user.loginCount,
          createdAt: user.createdAt,
          providers: user.oauthProviders || []
        }
      });
      
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      res.status(500).json({
        error: 'Failed to fetch profile',
        message: 'An error occurred while fetching user profile'
      });
    }
  })
);

/**
 * Update user profile
 */
router.put('/profile',
  ensureAuthenticated,
  rateLimiter.api,
  [
    body('displayName')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Display name must be between 1 and 100 characters'),
    body('firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('locale')
      .optional()
      .isLocale()
      .withMessage('Invalid locale format'),
    body('timezone')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid timezone')
  ],
  asyncErrorHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    try {
      const { displayName, firstName, lastName, locale, timezone } = req.body;
      
      const updateData = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (locale !== undefined) updateData.locale = locale;
      if (timezone !== undefined) updateData.timezone = timezone;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No data to update',
          message: 'At least one field must be provided'
        });
      }
      
      await database.models.User.update(updateData, {
        where: { id: req.user.id }
      });
      
      logAuthEvent('profile_updated', {
        userId: req.user.id,
        updatedFields: Object.keys(updateData),
        ip: req.ip
      });
      
      // Fetch updated user
      const updatedUser = await database.models.User.findByPk(req.user.id);
      
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          displayName: updatedUser.displayName,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          locale: updatedUser.locale,
          timezone: updatedUser.timezone
        }
      });
      
    } catch (error) {
      logger.error('Error updating user profile:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        message: 'An error occurred while updating profile'
      });
    }
  })
);

/**
 * Get user's active sessions
 */
router.get('/sessions',
  ensureAuthenticated,
  rateLimiter.api,
  asyncErrorHandler(async (req, res) => {
    try {
      const sessions = await database.models.UserSession.findAll({
        where: {
          userId: req.user.id,
          isActive: true,
          expiresAt: {
            [database.sequelize.Op.gt]: new Date()
          }
        },
        order: [['lastActivityAt', 'DESC']],
        attributes: [
          'id',
          'sessionId',
          'ipAddress',
          'userAgent',
          'deviceInfo',
          'location',
          'lastActivityAt',
          'expiresAt',
          'createdAt'
        ]
      });
      
      // Get refresh tokens info
      const refreshTokens = await getUserRefreshTokens(req.user.id);
      
      res.json({
        sessions: sessions.map(session => ({
          id: session.id,
          sessionId: session.sessionId.substring(0, 8) + '...', // Partial for security
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          deviceInfo: session.deviceInfo,
          location: session.location,
          lastActivityAt: session.lastActivityAt,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
          isCurrent: session.sessionId === req.sessionID
        })),
        refreshTokens: refreshTokens.length,
        currentSessionId: req.sessionID ? req.sessionID.substring(0, 8) + '...' : null
      });
      
    } catch (error) {
      logger.error('Error fetching user sessions:', error);
      res.status(500).json({
        error: 'Failed to fetch sessions',
        message: 'An error occurred while fetching sessions'
      });
    }
  })
);

/**
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId',
  ensureAuthenticated,
  rateLimiter.api,
  [
    param('sessionId')
      .isLength({ min: 32, max: 128 })
      .withMessage('Invalid session ID format')
  ],
  asyncErrorHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    try {
      const { sessionId } = req.params;
      
      // Check if session belongs to user
      const session = await database.models.UserSession.findOne({
        where: {
          sessionId: sessionId,
          userId: req.user.id,
          isActive: true
        }
      });
      
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Session not found or already revoked'
        });
      }
      
      // Prevent user from revoking their current session
      if (sessionId === req.sessionID) {
        return res.status(400).json({
          error: 'Cannot revoke current session',
          message: 'Use logout endpoint to end current session'
        });
      }
      
      // Revoke session
      await session.update({ isActive: false });
      
      // Revoke associated refresh tokens
      const refreshTokens = await database.models.RefreshToken.findAll({
        where: {
          userId: req.user.id,
          isActive: true
        }
      });
      
      for (const token of refreshTokens) {
        if (token.deviceInfo?.sessionId === sessionId) {
          await token.update({ isActive: false });
        }
      }
      
      logAuthEvent('session_revoked', {
        userId: req.user.id,
        revokedSessionId: sessionId.substring(0, 8) + '...',
        ip: req.ip
      });
      
      res.json({
        message: 'Session revoked successfully'
      });
      
    } catch (error) {
      logger.error('Error revoking session:', error);
      res.status(500).json({
        error: 'Failed to revoke session',
        message: 'An error occurred while revoking session'
      });
    }
  })
);

/**
 * Revoke all other sessions (keep current)
 */
router.delete('/sessions',
  ensureAuthenticated,
  rateLimiter.strict,
  asyncErrorHandler(async (req, res) => {
    try {
      // Revoke all other sessions except current
      const revokedCount = await database.models.UserSession.update(
        { isActive: false },
        {
          where: {
            userId: req.user.id,
            sessionId: {
              [database.sequelize.Op.ne]: req.sessionID
            },
            isActive: true
          }
        }
      );
      
      // Revoke all other refresh tokens except current session
      await database.models.RefreshToken.update(
        { isActive: false },
        {
          where: {
            userId: req.user.id,
            isActive: true,
            // Don't revoke tokens from current session
            deviceInfo: {
              [database.sequelize.Op.or]: [
                { sessionId: { [database.sequelize.Op.ne]: req.sessionID } },
                { sessionId: null }
              ]
            }
          }
        }
      );
      
      logAuthEvent('all_other_sessions_revoked', {
        userId: req.user.id,
        revokedCount: revokedCount[0],
        ip: req.ip
      });
      
      res.json({
        message: 'All other sessions revoked successfully',
        revokedCount: revokedCount[0]
      });
      
    } catch (error) {
      logger.error('Error revoking all sessions:', error);
      res.status(500).json({
        error: 'Failed to revoke sessions',
        message: 'An error occurred while revoking sessions'
      });
    }
  })
);

/**
 * Get user's OAuth providers
 */
router.get('/providers',
  ensureAuthenticated,
  asyncErrorHandler(async (req, res) => {
    try {
      const providers = await database.models.OAuthProvider.findAll({
        where: {
          userId: req.user.id,
          isActive: true
        },
        order: [['lastUsedAt', 'DESC']],
        attributes: [
          'id',
          'provider',
          'email',
          'displayName',
          'lastUsedAt',
          'createdAt'
        ]
      });
      
      res.json({
        providers: providers.map(provider => ({
          id: provider.id,
          provider: provider.provider,
          email: provider.email,
          displayName: provider.displayName,
          lastUsedAt: provider.lastUsedAt,
          connectedAt: provider.createdAt
        }))
      });
      
    } catch (error) {
      logger.error('Error fetching user providers:', error);
      res.status(500).json({
        error: 'Failed to fetch providers',
        message: 'An error occurred while fetching OAuth providers'
      });
    }
  })
);

/**
 * Unlink OAuth provider
 */
router.delete('/providers/:providerId',
  ensureAuthenticated,
  rateLimiter.strict,
  [
    param('providerId')
      .isUUID()
      .withMessage('Invalid provider ID format')
  ],
  asyncErrorHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    try {
      const { providerId } = req.params;
      
      // Check if provider belongs to user
      const provider = await database.models.OAuthProvider.findOne({
        where: {
          id: providerId,
          userId: req.user.id,
          isActive: true
        }
      });
      
      if (!provider) {
        return res.status(404).json({
          error: 'Provider not found',
          message: 'OAuth provider not found or already unlinked'
        });
      }
      
      // Check if user has other active providers
      const otherProviders = await database.models.OAuthProvider.count({
        where: {
          userId: req.user.id,
          id: { [database.sequelize.Op.ne]: providerId },
          isActive: true
        }
      });
      
      if (otherProviders === 0) {
        return res.status(400).json({
          error: 'Cannot unlink last provider',
          message: 'You must have at least one linked OAuth provider'
        });
      }
      
      // Deactivate provider
      await provider.update({ isActive: false });
      
      logSecurityEvent('oauth_provider_unlinked', {
        userId: req.user.id,
        provider: provider.provider,
        providerId: providerId,
        ip: req.ip
      });
      
      res.json({
        message: 'OAuth provider unlinked successfully',
        provider: provider.provider
      });
      
    } catch (error) {
      logger.error('Error unlinking OAuth provider:', error);
      res.status(500).json({
        error: 'Failed to unlink provider',
        message: 'An error occurred while unlinking OAuth provider'
      });
    }
  })
);

/**
 * Get account security information
 */
router.get('/security',
  ensureAuthenticated,
  asyncErrorHandler(async (req, res) => {
    try {
      // Get recent security events
      const recentEvents = await database.models.SecurityEvent.findAll({
        where: {
          userId: req.user.id
        },
        order: [['createdAt', 'DESC']],
        limit: 10,
        attributes: ['event', 'severity', 'ipAddress', 'createdAt']
      });
      
      // Get active sessions count
      const activeSessionsCount = await database.models.UserSession.count({
        where: {
          userId: req.user.id,
          isActive: true,
          expiresAt: {
            [database.sequelize.Op.gt]: new Date()
          }
        }
      });
      
      // Get active refresh tokens count
      const activeTokensCount = await database.models.RefreshToken.count({
        where: {
          userId: req.user.id,
          isActive: true,
          expiresAt: {
            [database.sequelize.Op.gt]: new Date()
          }
        }
      });
      
      res.json({
        security: {
          activeSessionsCount,
          activeTokensCount,
          lastLogin: req.user.lastLoginAt,
          lastLoginIP: req.user.lastLoginIP,
          totalLogins: req.user.loginCount,
          accountCreated: req.user.createdAt,
          isVerified: req.user.isVerified
        },
        recentEvents: recentEvents.map(event => ({
          event: event.event,
          severity: event.severity,
          ipAddress: event.ipAddress,
          timestamp: event.createdAt
        }))
      });
      
    } catch (error) {
      logger.error('Error fetching security information:', error);
      res.status(500).json({
        error: 'Failed to fetch security info',
        message: 'An error occurred while fetching security information'
      });
    }
  })
);

/**
 * Delete user account
 */
router.delete('/account',
  ensureAuthenticated,
  rateLimiter.strict,
  [
    body('confirmation')
      .equals('DELETE_MY_ACCOUNT')
      .withMessage('Must provide exact confirmation text: DELETE_MY_ACCOUNT')
  ],
  asyncErrorHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    try {
      const userId = req.user.id;
      
      // Start transaction
      const transaction = await database.sequelize.transaction();
      
      try {
        // Deactivate all user sessions
        await database.models.UserSession.update(
          { isActive: false },
          { where: { userId }, transaction }
        );
        
        // Deactivate all refresh tokens
        await database.models.RefreshToken.update(
          { isActive: false },
          { where: { userId }, transaction }
        );
        
        // Deactivate all OAuth providers
        await database.models.OAuthProvider.update(
          { isActive: false },
          { where: { userId }, transaction }
        );
        
        // Deactivate user account
        await database.models.User.update(
          { isActive: false },
          { where: { id: userId }, transaction }
        );
        
        await transaction.commit();
        
        logSecurityEvent('account_deleted', {
          userId,
          ip: req.ip,
          severity: 'high'
        });
        
        // Logout user
        req.logout((err) => {
          if (err) {
            logger.error('Logout error during account deletion:', err);
          }
          
          req.session.destroy((err) => {
            if (err) {
              logger.error('Session destruction error during account deletion:', err);
            }
            
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            
            res.json({
              message: 'Account deleted successfully'
            });
          });
        });
        
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
      
    } catch (error) {
      logger.error('Error deleting user account:', error);
      res.status(500).json({
        error: 'Failed to delete account',
        message: 'An error occurred while deleting account'
      });
    }
  })
);

export default router;