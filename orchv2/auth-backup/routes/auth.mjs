/**
 * Authentication Routes
 * Handles OAuth flows, session management, and JWT token operations
 */

import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';

import { config } from '../lib/config.mjs';
import { database } from '../lib/database.mjs';
import { logger, logAuthEvent, logSecurityEvent, logSessionEvent } from '../lib/logger.mjs';
import { ensureAuthenticated, getOAuthProviders } from '../lib/passport-config.mjs';
import { generateTokens, verifyRefreshToken } from '../lib/jwt-utils.mjs';
import { rateLimiter } from '../middleware/rateLimiter.mjs';

const router = express.Router();

/**
 * Get authentication status and available providers
 */
router.get('/status', (req, res) => {
  const isAuthenticated = req.isAuthenticated();
  
  const response = {
    authenticated: isAuthenticated,
    providers: getOAuthProviders()
  };
  
  if (isAuthenticated) {
    response.user = {
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.displayName,
      profilePicture: req.user.profilePicture,
      lastLoginAt: req.user.lastLoginAt,
      providers: req.user.oauthProviders?.map(p => ({
        provider: p.provider,
        email: p.email,
        lastUsed: p.lastUsedAt
      })) || []
    };
  }
  
  res.json(response);
});

/**
 * Google OAuth Routes
 */
router.get('/google', 
  rateLimiter.auth,
  (req, res, next) => {
    const state = uuidv4();
    req.session.oauthState = state;
    
    logAuthEvent('oauth_initiate', {
      provider: 'google',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      state
    });
    
    passport.authenticate('google', {
      scope: config.oauth.google.scope,
      state: state,
      accessType: 'offline',
      prompt: 'consent'
    })(req, res, next);
  }
);

router.get('/google/callback',
  rateLimiter.auth,
  (req, res, next) => {
    // Verify state parameter
    const { state } = req.query;
    if (!state || state !== req.session.oauthState) {
      logSecurityEvent('oauth_state_mismatch', {
        provider: 'google',
        expectedState: req.session.oauthState,
        receivedState: state,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'OAuth state mismatch',
        message: 'Invalid state parameter. Please try again.'
      });
    }
    
    passport.authenticate('google', {
      failureRedirect: `${config.server.frontendUrl}/auth/error`,
      failureMessage: true
    })(req, res, next);
  },
  async (req, res) => {
    try {
      // Clear OAuth state
      delete req.session.oauthState;
      
      // Create session record
      const sessionRecord = await database.models.UserSession.create({
        userId: req.user.id,
        sessionId: req.sessionID,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        expiresAt: new Date(Date.now() + config.session.maxAge)
      });
      
      logSessionEvent('session_created', req.sessionID, {
        userId: req.user.id,
        provider: 'google',
        ip: req.ip
      });
      
      // Generate JWT tokens
      const tokens = await generateTokens(req.user, {
        sessionId: req.sessionID,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Set secure cookie with JWT
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      logAuthEvent('login_success', {
        userId: req.user.id,
        provider: 'google',
        ip: req.ip,
        sessionId: req.sessionID
      });
      
      // Redirect to frontend with success
      res.redirect(`${config.server.frontendUrl}/auth/success`);
      
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      logAuthEvent('login_error', {
        provider: 'google',
        error: error.message,
        ip: req.ip
      });
      
      res.redirect(`${config.server.frontendUrl}/auth/error?message=${encodeURIComponent('Authentication failed')}`);
    }
  }
);

/**
 * GitHub OAuth Routes
 */
router.get('/github',
  rateLimiter.auth,
  (req, res, next) => {
    const state = uuidv4();
    req.session.oauthState = state;
    
    logAuthEvent('oauth_initiate', {
      provider: 'github',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      state
    });
    
    passport.authenticate('github', {
      scope: config.oauth.github.scope,
      state: state
    })(req, res, next);
  }
);

router.get('/github/callback',
  rateLimiter.auth,
  (req, res, next) => {
    // Verify state parameter
    const { state } = req.query;
    if (!state || state !== req.session.oauthState) {
      logSecurityEvent('oauth_state_mismatch', {
        provider: 'github',
        expectedState: req.session.oauthState,
        receivedState: state,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'OAuth state mismatch',
        message: 'Invalid state parameter. Please try again.'
      });
    }
    
    passport.authenticate('github', {
      failureRedirect: `${config.server.frontendUrl}/auth/error`,
      failureMessage: true
    })(req, res, next);
  },
  async (req, res) => {
    try {
      // Clear OAuth state
      delete req.session.oauthState;
      
      // Create session record
      const sessionRecord = await database.models.UserSession.create({
        userId: req.user.id,
        sessionId: req.sessionID,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        expiresAt: new Date(Date.now() + config.session.maxAge)
      });
      
      logSessionEvent('session_created', req.sessionID, {
        userId: req.user.id,
        provider: 'github',
        ip: req.ip
      });
      
      // Generate JWT tokens
      const tokens = await generateTokens(req.user, {
        sessionId: req.sessionID,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Set secure cookies
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });
      
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      logAuthEvent('login_success', {
        userId: req.user.id,
        provider: 'github',
        ip: req.ip,
        sessionId: req.sessionID
      });
      
      res.redirect(`${config.server.frontendUrl}/auth/success`);
      
    } catch (error) {
      logger.error('GitHub OAuth callback error:', error);
      logAuthEvent('login_error', {
        provider: 'github',
        error: error.message,
        ip: req.ip
      });
      
      res.redirect(`${config.server.frontendUrl}/auth/error?message=${encodeURIComponent('Authentication failed')}`);
    }
  }
);

/**
 * Microsoft OAuth Routes
 */
router.get('/microsoft',
  rateLimiter.auth,
  (req, res, next) => {
    const state = uuidv4();
    req.session.oauthState = state;
    
    logAuthEvent('oauth_initiate', {
      provider: 'microsoft',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      state
    });
    
    passport.authenticate('microsoft', {
      scope: config.oauth.microsoft.scope,
      state: state,
      prompt: 'consent'
    })(req, res, next);
  }
);

router.get('/microsoft/callback',
  rateLimiter.auth,
  (req, res, next) => {
    // Verify state parameter
    const { state } = req.query;
    if (!state || state !== req.session.oauthState) {
      logSecurityEvent('oauth_state_mismatch', {
        provider: 'microsoft',
        expectedState: req.session.oauthState,
        receivedState: state,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'OAuth state mismatch',
        message: 'Invalid state parameter. Please try again.'
      });
    }
    
    passport.authenticate('microsoft', {
      failureRedirect: `${config.server.frontendUrl}/auth/error`,
      failureMessage: true
    })(req, res, next);
  },
  async (req, res) => {
    try {
      // Clear OAuth state
      delete req.session.oauthState;
      
      // Create session record
      const sessionRecord = await database.models.UserSession.create({
        userId: req.user.id,
        sessionId: req.sessionID,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        expiresAt: new Date(Date.now() + config.session.maxAge)
      });
      
      logSessionEvent('session_created', req.sessionID, {
        userId: req.user.id,
        provider: 'microsoft',
        ip: req.ip
      });
      
      // Generate JWT tokens
      const tokens = await generateTokens(req.user, {
        sessionId: req.sessionID,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Set secure cookies
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });
      
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      logAuthEvent('login_success', {
        userId: req.user.id,
        provider: 'microsoft',
        ip: req.ip,
        sessionId: req.sessionID
      });
      
      res.redirect(`${config.server.frontendUrl}/auth/success`);
      
    } catch (error) {
      logger.error('Microsoft OAuth callback error:', error);
      logAuthEvent('login_error', {
        provider: 'microsoft',
        error: error.message,
        ip: req.ip
      });
      
      res.redirect(`${config.server.frontendUrl}/auth/error?message=${encodeURIComponent('Authentication failed')}`);
    }
  }
);

/**
 * Get current user profile
 */
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = await database.models.User.findByPk(req.user.id, {
      include: [
        {
          model: database.models.OAuthProvider,
          as: 'oauthProviders',
          where: { isActive: true },
          required: false,
          attributes: ['provider', 'email', 'lastUsedAt']
        }
      ]
    });
    
    if (!user) {
      logSecurityEvent('user_not_found_in_profile', {
        userId: req.user.id,
        ip: req.ip
      });
      
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
        providers: user.oauthProviders || []
      }
    });
    
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user profile'
    });
  }
});

/**
 * Refresh JWT tokens
 */
router.post('/refresh',
  rateLimiter.auth,
  async (req, res) => {
    try {
      const { refreshToken } = req.cookies;
      
      if (!refreshToken) {
        return res.status(401).json({
          error: 'Refresh token required',
          message: 'No refresh token provided'
        });
      }
      
      // Verify and decode refresh token
      const { userId, jwtId } = await verifyRefreshToken(refreshToken);
      
      // Get user
      const user = await database.models.User.findByPk(userId);
      if (!user || !user.isActive) {
        logSecurityEvent('refresh_token_invalid_user', {
          userId,
          ip: req.ip
        });
        
        return res.status(401).json({
          error: 'Invalid refresh token',
          message: 'User not found or inactive'
        });
      }
      
      // Generate new tokens
      const tokens = await generateTokens(user, {
        sessionId: req.sessionID,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Revoke old refresh token
      await database.models.RefreshToken.update(
        { isActive: false },
        { where: { jwtId, isActive: true } }
      );
      
      // Set new cookies
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });
      
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      logAuthEvent('token_refresh', {
        userId: user.id,
        ip: req.ip,
        oldJwtId: jwtId,
        newJwtId: tokens.jwtId
      });
      
      res.json({
        message: 'Tokens refreshed successfully',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      });
      
    } catch (error) {
      logger.error('Token refresh error:', error);
      logSecurityEvent('token_refresh_failed', {
        error: error.message,
        ip: req.ip
      });
      
      res.status(401).json({
        error: 'Token refresh failed',
        message: 'Invalid or expired refresh token'
      });
    }
  }
);

/**
 * Logout
 */
router.post('/logout',
  ensureAuthenticated,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const sessionId = req.sessionID;
      
      // Invalidate session record
      await database.models.UserSession.update(
        { isActive: false },
        { where: { sessionId, isActive: true } }
      );
      
      // Invalidate refresh tokens for this session
      const { refreshToken } = req.cookies;
      if (refreshToken) {
        try {
          const { jwtId } = jwt.decode(refreshToken);
          if (jwtId) {
            await database.models.RefreshToken.update(
              { isActive: false },
              { where: { jwtId, isActive: true } }
            );
          }
        } catch (error) {
          logger.warn('Error invalidating refresh token on logout:', error);
        }
      }
      
      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
      // Destroy session
      req.logout((err) => {
        if (err) {
          logger.error('Logout error:', err);
        }
        
        req.session.destroy((err) => {
          if (err) {
            logger.error('Session destruction error:', err);
          }
          
          logAuthEvent('logout', {
            userId,
            sessionId,
            ip: req.ip
          });
          
          logSessionEvent('session_destroyed', sessionId, {
            userId,
            ip: req.ip
          });
          
          res.json({
            message: 'Logged out successfully'
          });
        });
      });
      
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }
);

/**
 * Logout from all devices
 */
router.post('/logout-all',
  ensureAuthenticated,
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Revoke all user sessions
      await req.user.revokeAllSessions();
      
      logAuthEvent('logout_all_devices', {
        userId,
        ip: req.ip
      });
      
      // Clear current session cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
      // Destroy current session
      req.logout((err) => {
        if (err) {
          logger.error('Logout all error:', err);
        }
        
        req.session.destroy((err) => {
          if (err) {
            logger.error('Session destruction error:', err);
          }
          
          res.json({
            message: 'Logged out from all devices successfully'
          });
        });
      });
      
    } catch (error) {
      logger.error('Logout all error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }
);

export default router;