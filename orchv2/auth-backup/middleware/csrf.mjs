/**
 * CSRF Protection Middleware
 * Implements Cross-Site Request Forgery protection
 */

import csrf from 'csrf';
import { config } from '../lib/config.mjs';
import { logger, logSecurityEvent } from '../lib/logger.mjs';

// Initialize CSRF
const csrfTokens = new csrf();

/**
 * Generate CSRF token
 */
export function generateCSRFToken(secret) {
  return csrfTokens.create(secret);
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(secret, token) {
  return csrfTokens.verify(secret, token);
}

/**
 * CSRF Protection Middleware
 */
export function csrfProtection(req, res, next) {
  // Skip CSRF protection if disabled
  if (!config.security.csrf.enabled) {
    return next();
  }
  
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for health check endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  
  try {
    // Get or create CSRF secret
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = csrfTokens.secretSync();
    }
    
    const secret = req.session.csrfSecret;
    
    // Get CSRF token from header or body
    const token = req.get('X-CSRF-Token') || 
                  req.get('CSRF-Token') || 
                  req.body._csrf ||
                  req.query._csrf;
    
    if (!token) {
      logSecurityEvent('csrf_token_missing', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      });
      
      return res.status(403).json({
        error: 'CSRF token required',
        message: 'CSRF token is missing. Include X-CSRF-Token header or _csrf parameter.'
      });
    }
    
    // Verify CSRF token
    if (!verifyCSRFToken(secret, token)) {
      logSecurityEvent('csrf_token_invalid', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        providedToken: token.substring(0, 8) + '...'
      });
      
      return res.status(403).json({
        error: 'Invalid CSRF token',
        message: 'CSRF token verification failed.'
      });
    }
    
    next();
    
  } catch (error) {
    logger.error('CSRF protection error:', error);
    
    return res.status(500).json({
      error: 'CSRF protection error',
      message: 'An error occurred while verifying CSRF token.'
    });
  }
}

/**
 * Middleware to provide CSRF token to client
 */
export function provideCSRFToken(req, res, next) {
  if (!config.security.csrf.enabled) {
    return next();
  }
  
  try {
    // Generate CSRF secret if it doesn't exist
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = csrfTokens.secretSync();
    }
    
    // Generate CSRF token
    const token = generateCSRFToken(req.session.csrfSecret);
    
    // Add token to response locals for templates
    res.locals.csrfToken = token;
    
    // Add token to response header
    res.set('X-CSRF-Token', token);
    
    next();
    
  } catch (error) {
    logger.error('Error providing CSRF token:', error);
    next(error);
  }
}

/**
 * Route to get CSRF token
 */
export function getCSRFToken(req, res) {
  if (!config.security.csrf.enabled) {
    return res.json({
      csrf: null,
      message: 'CSRF protection is disabled'
    });
  }
  
  try {
    // Generate CSRF secret if it doesn't exist
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = csrfTokens.secretSync();
    }
    
    // Generate CSRF token
    const token = generateCSRFToken(req.session.csrfSecret);
    
    res.json({
      csrf: token,
      message: 'Include this token in X-CSRF-Token header or _csrf parameter'
    });
    
  } catch (error) {
    logger.error('Error generating CSRF token:', error);
    res.status(500).json({
      error: 'Failed to generate CSRF token',
      message: 'An error occurred while generating CSRF token'
    });
  }
}

export default csrfProtection;