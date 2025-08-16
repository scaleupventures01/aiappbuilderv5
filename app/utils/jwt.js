/**
 * JWT Utility Functions - Elite Trading Coach AI
 * Task: BE-006, BE-007, BE-008 - JWT token generation and verification
 * Created: 2025-08-14
 * 
 * Implements secure JWT token generation, verification, and management
 * with proper error handling and security considerations.
 */

import jwt from 'jsonwebtoken';

// JWT Configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'elite-trading-coach-dev-secret-change-in-production',
  accessTokenExpiry: process.env.JWT_EXPIRES_IN || '4h',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  issuer: 'elite-trading-coach-ai',
  audience: 'elite-trading-coach-users'
};

/**
 * Generate access token for authenticated user
 * @param {Object} user - User object with id, email, username
 * @returns {string} JWT access token
 * @throws {Error} If token generation fails
 */
export function generateAccessToken(user) {
  if (!user || !user.id) {
    throw new Error('Valid user object with ID is required');
  }

  try {
    const payload = {
      sub: user.id, // Subject (user ID)
      email: user.email,
      username: user.username,
      type: 'access',
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    const options = {
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithm: 'HS256'
    };

    return jwt.sign(payload, JWT_CONFIG.secret, options);
  } catch (error) {
    console.error('Access token generation error:', error);
    throw new Error('Failed to generate access token');
  }
}

/**
 * Generate refresh token for user session
 * @param {Object} user - User object with id
 * @returns {string} JWT refresh token
 * @throws {Error} If token generation fails
 */
export function generateRefreshToken(user) {
  if (!user || !user.id) {
    throw new Error('Valid user object with ID is required');
  }

  try {
    const payload = {
      sub: user.id, // Subject (user ID)
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    const options = {
      expiresIn: JWT_CONFIG.refreshTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithm: 'HS256'
    };

    return jwt.sign(payload, JWT_CONFIG.secret, options);
  } catch (error) {
    console.error('Refresh token generation error:', error);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing access and refresh tokens
 */
export function generateTokenPair(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    tokenType: 'Bearer',
    expiresIn: JWT_CONFIG.accessTokenExpiry
  };
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @param {string} expectedType - Expected token type ('access' or 'refresh')
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token, expectedType = 'access') {
  if (!token || typeof token !== 'string') {
    throw new Error('Valid token is required');
  }

  try {
    const options = {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithms: ['HS256']
    };

    const decoded = jwt.verify(token, JWT_CONFIG.secret, options);

    // Verify token type matches expected
    if (expectedType && decoded.type !== expectedType) {
      throw new Error(`Invalid token type. Expected: ${expectedType}, Got: ${decoded.type}`);
    }

    // Check if token is expired (additional check)
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      throw new Error('Token has expired');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error('Token not yet active');
    } else {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token string or null if not found
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  // Check for Bearer token format
  const bearerPattern = /^Bearer\s+(.+)$/i;
  const match = authHeader.match(bearerPattern);
    
  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

/**
 * Decode token without verification (for debugging/logging)
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded payload or null if invalid
 */
export function decodeTokenUnsafe(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    console.warn('Token decode error:', error.message);
    return null;
  }
}

/**
 * Check if token is close to expiry
 * @param {Object} decodedToken - Decoded JWT payload
 * @param {number} bufferMinutes - Minutes before expiry to consider "close"
 * @returns {boolean} True if token expires within buffer time
 */
export function isTokenNearExpiry(decodedToken, bufferMinutes = 5) {
  if (!decodedToken || !decodedToken.exp) {
    return true; // Consider invalid tokens as expired
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const bufferSeconds = bufferMinutes * 60;
    
  return (decodedToken.exp - currentTime) <= bufferSeconds;
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Valid refresh token
 * @param {Function} getUserById - Function to fetch user data by ID
 * @returns {Promise<Object>} New token pair
 * @throws {Error} If refresh fails
 */
export async function refreshAccessToken(refreshToken, getUserById) {
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken, 'refresh');
        
    // Get current user data
    const user = await getUserById(decoded.sub);
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    // Generate new token pair
    return generateTokenPair(user);
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
}

/**
 * Create token blacklist checker (in-memory implementation)
 * For production, use Redis or database-backed blacklist
 */
const blacklistedTokens = new Set();

/**
 * Add token to blacklist
 * @param {string} tokenId - Token ID (jti claim) or full token
 * @returns {void}
 */
export function blacklistToken(tokenId) {
  if (tokenId && typeof tokenId === 'string') {
    blacklistedTokens.add(tokenId);
  }
}

/**
 * Check if token is blacklisted
 * @param {string} tokenId - Token ID (jti claim) or full token
 * @returns {boolean} True if token is blacklisted
 */
export function isTokenBlacklisted(tokenId) {
  if (!tokenId || typeof tokenId !== 'string') {
    return false;
  }
  return blacklistedTokens.has(tokenId);
}

/**
 * Clear expired tokens from blacklist (cleanup utility)
 * @returns {number} Number of tokens removed
 */
export function cleanupBlacklistedTokens() {
  // In production, implement with token expiry tracking
  // For now, return 0 as this is in-memory
  return 0;
}

/**
 * Get JWT configuration (for debugging)
 * @returns {Object} JWT configuration (without secret)
 */
export function getJWTConfig() {
  return {
    accessTokenExpiry: JWT_CONFIG.accessTokenExpiry,
    refreshTokenExpiry: JWT_CONFIG.refreshTokenExpiry,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    hasSecret: !!JWT_CONFIG.secret
  };
}