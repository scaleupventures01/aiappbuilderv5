import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';

// File type validation using magic numbers (file signatures)
const FILE_SIGNATURES = {
  'image/jpeg': [
    { offset: 0, bytes: Buffer.from([0xFF, 0xD8, 0xFF]) }
  ],
  'image/png': [
    { offset: 0, bytes: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) }
  ],
  'image/gif': [
    { offset: 0, bytes: Buffer.from('GIF87a', 'ascii') },
    { offset: 0, bytes: Buffer.from('GIF89a', 'ascii') }
  ],
  'image/webp': [
    { offset: 0, bytes: Buffer.from('RIFF', 'ascii') },
    { offset: 8, bytes: Buffer.from('WEBP', 'ascii') }
  ]
};

// Validate file buffer against known signatures
function validateFileSignature(buffer, mimeType) {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return false;

  return signatures.some(sig => {
    if (buffer.length < sig.offset + sig.bytes.length) return false;
    
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[sig.offset + i] !== sig.bytes[i]) {
        // Special case for WebP which has two separate checks
        if (mimeType === 'image/webp' && sig.offset === 8) {
          // For WebP, we need both RIFF and WEBP signatures
          const riffCheck = buffer.slice(0, 4).toString('ascii') === 'RIFF';
          const webpCheck = buffer.slice(8, 12).toString('ascii') === 'WEBP';
          return riffCheck && webpCheck;
        }
        return false;
      }
    }
    return true;
  });
}

// Sanitize filename to prevent path traversal and other attacks
function sanitizeFilename(filename) {
  // Remove any directory components
  const basename = path.basename(filename);
  
  // Remove any non-alphanumeric characters except dots, dashes, and underscores
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Ensure the filename doesn't start with a dot (hidden file)
  const finalName = sanitized.startsWith('.') ? `file_${sanitized}` : sanitized;
  
  // Limit filename length
  const maxLength = 255;
  if (finalName.length > maxLength) {
    const ext = path.extname(finalName);
    const nameWithoutExt = finalName.slice(0, finalName.length - ext.length);
    return nameWithoutExt.slice(0, maxLength - ext.length) + ext;
  }
  
  return finalName;
}

// Main validation middleware
export const validateUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Validate each file
    for (const file of req.files) {
      // 1. Check MIME type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(415).json({
          success: false,
          error: `Unsupported file type: ${file.mimetype}. Only JPEG, PNG, GIF, and WebP are allowed.`
        });
      }

      // 2. Validate file signature (magic numbers)
      const mimeType = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
      if (!validateFileSignature(file.buffer, mimeType)) {
        return res.status(422).json({
          success: false,
          error: `File validation failed: ${file.originalname} does not match its declared type.`
        });
      }

      // 3. Check file size (redundant with multer, but good for explicit validation)
      const maxSize = 15 * 1024 * 1024; // 15MB
      if (file.size > maxSize) {
        return res.status(413).json({
          success: false,
          error: `File too large: ${file.originalname} exceeds 15MB limit.`
        });
      }

      // 4. Sanitize filename
      file.sanitizedName = sanitizeFilename(file.originalname);

      // 5. Check for potential security threats in filename
      const suspiciousPatterns = [
        /\.\.\//g,  // Path traversal
        /<script/gi, // Script tags
        /javascript:/gi, // JavaScript protocol
        /on\w+=/gi, // Event handlers
        /%00/g, // Null bytes
        /\x00/g, // Null characters
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(file.originalname)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid filename detected. Please rename your file and try again.'
          });
        }
      }

      // 6. Generate a unique identifier for the file
      file.uniqueId = crypto.randomBytes(16).toString('hex');

      // 7. Add metadata for tracking
      file.uploadTimestamp = Date.now();
      file.validatedAt = new Date().toISOString();
    }

    // All validations passed
    next();

  } catch (error) {
    console.error('Upload validation error:', error);
    res.status(500).json({
      success: false,
      error: 'File validation failed. Please try again.'
    });
  }
};

// Additional validation for specific upload contexts
export const validateUploadContext = (allowedContexts = ['chat', 'profile', 'analysis']) => {
  return (req, res, next) => {
    const { context = 'chat' } = req.body;
    
    if (!allowedContexts.includes(context)) {
      return res.status(400).json({
        success: false,
        error: `Invalid upload context: ${context}. Allowed contexts: ${allowedContexts.join(', ')}`
      });
    }
    
    req.uploadContext = context;
    next();
  };
};

// Rate limiting specifically for uploads
export const uploadRateLimit = (maxUploads = 10, windowMs = 60000) => {
  const uploadCounts = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, data] of uploadCounts.entries()) {
      if (now - data.firstUpload > windowMs) {
        uploadCounts.delete(key);
      }
    }
    
    // Check current user's upload count
    const userData = uploadCounts.get(userId);
    
    if (userData) {
      if (now - userData.firstUpload <= windowMs) {
        if (userData.count >= maxUploads) {
          return res.status(429).json({
            success: false,
            error: `Upload limit exceeded. Maximum ${maxUploads} uploads per ${windowMs / 1000} seconds.`
          });
        }
        userData.count++;
      } else {
        // Reset if window has passed
        uploadCounts.set(userId, { firstUpload: now, count: 1 });
      }
    } else {
      uploadCounts.set(userId, { firstUpload: now, count: 1 });
    }
    
    next();
  };
};