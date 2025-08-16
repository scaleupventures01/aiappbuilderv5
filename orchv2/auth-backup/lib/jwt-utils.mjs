/**
 * JWT Token Utilities
 * Handles JWT token generation, verification, and refresh token management
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.mjs';
import { database } from './database.mjs';
import { logger, logSecurityEvent } from './logger.mjs';

/**
 * Generate JWT access and refresh tokens
 */
export async function generateTokens(user, sessionInfo = {}) {
  try {
    const jwtId = uuidv4();
    const issuedAt = Math.floor(Date.now() / 1000);
    const accessTokenExpiry = issuedAt + (15 * 60); // 15 minutes
    const refreshTokenExpiry = issuedAt + (7 * 24 * 60 * 60); // 7 days
    
    // Access token payload
    const accessPayload = {
      sub: user.id, // Subject (user ID)
      email: user.email,
      displayName: user.displayName,
      iat: issuedAt,
      exp: accessTokenExpiry,
      jti: jwtId, // JWT ID
      type: 'access',
      sessionId: sessionInfo.sessionId,
      providers: user.oauthProviders?.map(p => p.provider) || []
    };
    
    // Refresh token payload
    const refreshPayload = {
      sub: user.id,
      iat: issuedAt,
      exp: refreshTokenExpiry,
      jti: jwtId,
      type: 'refresh',
      sessionId: sessionInfo.sessionId
    };
    
    // Sign tokens
    const accessToken = jwt.sign(accessPayload, config.jwt.access.secret, {
      algorithm: 'HS256'
    });
    
    const refreshToken = jwt.sign(refreshPayload, config.jwt.refresh.secret, {
      algorithm: 'HS256'
    });
    
    // Store refresh token in database
    await database.models.RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      jwtId: jwtId,
      deviceInfo: {
        userAgent: sessionInfo.userAgent,
        ipAddress: sessionInfo.ipAddress
      },
      ipAddress: sessionInfo.ipAddress,
      expiresAt: new Date(refreshTokenExpiry * 1000)
    });
    
    logger.debug('JWT tokens generated', {
      userId: user.id,
      jwtId,
      accessExpiry: new Date(accessTokenExpiry * 1000),
      refreshExpiry: new Date(refreshTokenExpiry * 1000)
    });
    
    return {
      accessToken,
      refreshToken,
      jwtId,
      expiresAt: new Date(accessTokenExpiry * 1000),
      refreshExpiresAt: new Date(refreshTokenExpiry * 1000)
    };
    
  } catch (error) {
    logger.error('Error generating JWT tokens:', error);
    throw new Error('Failed to generate authentication tokens');
  }
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.access.secret);
    
    // Validate token type
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    // Check if token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now) {
      throw new Error('Token expired');
    }
    
    return decoded;
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    } else {
      throw error;
    }
  }
}

/**
 * Verify JWT refresh token
 */
export async function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.refresh.secret);
    
    // Validate token type
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Check if refresh token exists in database and is active
    const refreshTokenRecord = await database.models.RefreshToken.findOne({
      where: {
        token: token,
        jwtId: decoded.jti,
        isActive: true
      }
    });
    
    if (!refreshTokenRecord) {
      logSecurityEvent('invalid_refresh_token_used', {
        jwtId: decoded.jti,
        userId: decoded.sub,
        reason: 'Token not found in database or inactive'
      });
      throw new Error('Refresh token not found or inactive');
    }
    
    // Check if token is expired
    if (refreshTokenRecord.isExpired()) {
      logSecurityEvent('expired_refresh_token_used', {
        jwtId: decoded.jti,
        userId: decoded.sub,
        expiresAt: refreshTokenRecord.expiresAt
      });
      
      // Clean up expired token
      await refreshTokenRecord.update({ isActive: false });
      throw new Error('Refresh token expired');
    }
    
    // Update last used timestamp
    await refreshTokenRecord.markUsed();
    
    return {
      userId: decoded.sub,
      jwtId: decoded.jti,
      sessionId: decoded.sessionId
    };
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else {
      throw error;
    }
  }
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(jwtId) {
  try {
    const result = await database.models.RefreshToken.update(
      { isActive: false },
      { 
        where: { 
          jwtId: jwtId,
          isActive: true 
        },
        returning: true
      }
    );
    
    if (result[0] === 0) {
      throw new Error('Refresh token not found or already revoked');
    }
    
    logger.info('Refresh token revoked', { jwtId });
    return true;
    
  } catch (error) {
    logger.error('Error revoking refresh token:', error);
    throw error;
  }
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId) {
  try {
    const result = await database.models.RefreshToken.update(
      { isActive: false },
      { 
        where: { 
          userId: userId,
          isActive: true 
        }
      }
    );
    
    logger.info('All refresh tokens revoked for user', { userId, count: result[0] });
    return result[0];
    
  } catch (error) {
    logger.error('Error revoking all user tokens:', error);
    throw error;
  }
}

/**
 * Clean up expired refresh tokens
 */
export async function cleanupExpiredTokens() {
  try {
    const now = new Date();
    
    const result = await database.models.RefreshToken.destroy({
      where: {
        expiresAt: {
          [database.sequelize.Op.lt]: now
        }
      }
    });
    
    logger.info('Expired refresh tokens cleaned up', { count: result });
    return result;
    
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', error);
    throw error;
  }
}

/**
 * Get user's active refresh tokens
 */
export async function getUserRefreshTokens(userId) {
  try {
    const tokens = await database.models.RefreshToken.findAll({
      where: {
        userId: userId,
        isActive: true,
        expiresAt: {
          [database.sequelize.Op.gt]: new Date()
        }
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'jwtId', 'deviceInfo', 'ipAddress', 'lastUsedAt', 'createdAt', 'expiresAt']
    });
    
    return tokens.map(token => ({
      id: token.id,
      jwtId: token.jwtId,
      deviceInfo: token.deviceInfo,
      ipAddress: token.ipAddress,
      lastUsedAt: token.lastUsedAt,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt
    }));
    
  } catch (error) {
    logger.error('Error getting user refresh tokens:', error);
    throw error;
  }
}

/**
 * Validate JWT payload structure
 */
export function validateTokenPayload(payload) {
  const requiredFields = ['sub', 'iat', 'exp', 'jti', 'type'];
  
  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate token type
  if (!['access', 'refresh'].includes(payload.type)) {
    throw new Error('Invalid token type');
  }
  
  // Validate expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new Error('Token expired');
  }
  
  // Validate issued at time (not in future)
  if (payload.iat > now + 60) { // Allow 60 seconds clock skew
    throw new Error('Token issued in future');
  }
  
  return true;
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authorizationHeader) {
  if (!authorizationHeader) {
    throw new Error('No Authorization header provided');
  }
  
  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Invalid Authorization header format');
  }
  
  return parts[1];
}

/**
 * Middleware to verify JWT access token
 */
export function verifyJWTMiddleware(req, res, next) {
  try {
    let token;
    
    // Try to get token from cookie first, then Authorization header
    if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization) {
      token = extractTokenFromHeader(req.headers.authorization);
    }
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'No access token provided'
      });
    }
    
    const decoded = verifyAccessToken(token);
    
    // Add user info to request
    req.jwtUser = {
      id: decoded.sub,
      email: decoded.email,
      displayName: decoded.displayName,
      jwtId: decoded.jti,
      sessionId: decoded.sessionId,
      providers: decoded.providers || []
    };
    
    next();
    
  } catch (error) {
    logger.warn('JWT verification failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    return res.status(401).json({
      error: 'Invalid access token',
      message: error.message
    });
  }
}

/**
 * Optional JWT middleware (doesn't fail if no token)
 */
export function optionalJWTMiddleware(req, res, next) {
  try {
    let token;
    
    // Try to get token from cookie first, then Authorization header
    if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization) {
      token = extractTokenFromHeader(req.headers.authorization);
    }
    
    if (token) {
      const decoded = verifyAccessToken(token);
      req.jwtUser = {
        id: decoded.sub,
        email: decoded.email,
        displayName: decoded.displayName,
        jwtId: decoded.jti,
        sessionId: decoded.sessionId,
        providers: decoded.providers || []
      };
    }
    
    next();
    
  } catch (error) {
    // Don't fail, just continue without user info
    logger.debug('Optional JWT verification failed', {
      error: error.message,
      ip: req.ip
    });
    next();
  }
}

export default {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens,
  getUserRefreshTokens,
  validateTokenPayload,
  extractTokenFromHeader,
  verifyJWTMiddleware,
  optionalJWTMiddleware
};