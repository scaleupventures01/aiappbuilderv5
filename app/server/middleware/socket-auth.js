/**
 * WebSocket Authentication Middleware - Elite Trading Coach AI
 * Handles authentication for Socket.io connections
 * Created: 2025-08-14
 */

import jwt from 'jsonwebtoken';
import { serverConfig } from '../config/environment.js';

/**
 * Socket.io authentication middleware
 * Validates JWT tokens from WebSocket connections
 */
export const socketAuthMiddleware = (socket, next) => {
  try {
    // Extract token from socket handshake
    const token = extractTokenFromSocket(socket);
    
    if (!token) {
      const error = new Error('Authentication token required');
      error.code = 'MISSING_TOKEN';
      return next(error);
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, serverConfig.jwtSecret);
    
    // Attach user info to socket
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    socket.userRole = decoded.role || 'user';
    socket.userTier = decoded.tier || 'free';
    socket.authenticated = true;
    
    // Log successful authentication
    console.log(`WebSocket authenticated: User ${decoded.userId} (${decoded.email})`);
    
    next();
  } catch (error) {
    console.error('WebSocket authentication failed:', error.message);
    
    // Handle different JWT errors
    if (error.name === 'JsonWebTokenError') {
      const authError = new Error('Invalid authentication token');
      authError.code = 'INVALID_TOKEN';
      return next(authError);
    }
    
    if (error.name === 'TokenExpiredError') {
      const authError = new Error('Authentication token expired');
      authError.code = 'TOKEN_EXPIRED';
      return next(authError);
    }
    
    // Generic authentication error
    const authError = new Error('Authentication failed');
    authError.code = 'AUTH_FAILED';
    return next(authError);
  }
};

/**
 * Extracts JWT token from various socket authentication methods
 */
const extractTokenFromSocket = (socket) => {
  // Method 1: Token in handshake auth
  if (socket.handshake.auth && socket.handshake.auth.token) {
    return socket.handshake.auth.token;
  }
  
  // Method 2: Token in query parameters
  if (socket.handshake.query && socket.handshake.query.token) {
    return socket.handshake.query.token;
  }
  
  // Method 3: Bearer token in headers
  const authorization = socket.handshake.headers.authorization;
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.substring(7);
  }
  
  // Method 4: Token in cookies (if available)
  const cookies = socket.handshake.headers.cookie;
  if (cookies) {
    const tokenMatch = cookies.match(/token=([^;]+)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }
  
  return null;
};

/**
 * Middleware to check user role permissions for WebSocket events
 */
export const requireRole = (allowedRoles) => {
  return (socket, next) => {
    if (!socket.authenticated) {
      const error = new Error('Socket not authenticated');
      error.code = 'NOT_AUTHENTICATED';
      return next(error);
    }
    
    if (!allowedRoles.includes(socket.userRole)) {
      const error = new Error('Insufficient permissions');
      error.code = 'INSUFFICIENT_PERMISSIONS';
      return next(error);
    }
    
    next();
  };
};

/**
 * Middleware to check user tier permissions for WebSocket events
 */
export const requireTier = (minimumTier) => {
  const tierHierarchy = ['free', 'premium', 'enterprise'];
  
  return (socket, next) => {
    if (!socket.authenticated) {
      const error = new Error('Socket not authenticated');
      error.code = 'NOT_AUTHENTICATED';
      return next(error);
    }
    
    const userTierIndex = tierHierarchy.indexOf(socket.userTier);
    const requiredTierIndex = tierHierarchy.indexOf(minimumTier);
    
    if (userTierIndex < requiredTierIndex) {
      const error = new Error(`${minimumTier} tier required`);
      error.code = 'TIER_REQUIRED';
      error.requiredTier = minimumTier;
      error.userTier = socket.userTier;
      return next(error);
    }
    
    next();
  };
};

/**
 * Rate limiting middleware for WebSocket events
 */
export const socketRateLimit = (options = {}) => {
  const {
    windowMs = 60000, // 1 minute
    maxEvents = 10,
    keyGenerator = (socket) => `socket_${socket.userId}`,
    skipSuccessfulRequests = false
  } = options;
  
  const requests = new Map();
  
  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests.entries()) {
      if (now - data.resetTime > windowMs) {
        requests.delete(key);
      }
    }
  }, windowMs);
  
  return (socket, eventName, data, next) => {
    const key = keyGenerator(socket);
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, {
        count: 1,
        resetTime: now,
        firstRequestTime: now
      });
      return next();
    }
    
    const requestData = requests.get(key);
    
    // Reset if window has passed
    if (now - requestData.resetTime > windowMs) {
      requestData.count = 1;
      requestData.resetTime = now;
      requestData.firstRequestTime = now;
      return next();
    }
    
    // Check if limit exceeded
    if (requestData.count >= maxEvents) {
      const error = new Error('Rate limit exceeded');
      error.code = 'RATE_LIMIT_EXCEEDED';
      error.limit = maxEvents;
      error.windowMs = windowMs;
      error.resetTime = requestData.resetTime + windowMs;
      return next(error);
    }
    
    requestData.count++;
    next();
  };
};

/**
 * WebSocket connection validator
 */
export const validateSocketConnection = (socket) => {
  // Check if socket has required authentication info
  if (!socket.userId || !socket.userEmail) {
    return {
      valid: false,
      error: 'Invalid socket authentication state'
    };
  }
  
  // Additional validation can be added here
  // e.g., check if user is still active in database
  
  return {
    valid: true,
    userId: socket.userId,
    userEmail: socket.userEmail,
    userRole: socket.userRole,
    userTier: socket.userTier
  };
};

/**
 * Socket disconnect handler
 */
export const handleSocketDisconnect = (socket, reason) => {
  console.log(`WebSocket disconnected: User ${socket.userId} (${socket.userEmail}) - Reason: ${reason}`);
  
  // Clean up any user-specific data
  // This could include removing from active user lists, etc.
  
  // Emit to other relevant sockets if needed
  if (socket.authenticated && socket.userId) {
    socket.broadcast.emit('user_disconnected', {
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  }
};

export default socketAuthMiddleware;