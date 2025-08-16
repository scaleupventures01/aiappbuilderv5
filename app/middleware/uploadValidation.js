import multer from 'multer';
import { FILE_SIZE_LIMITS, ALLOWED_MIME_TYPES } from '../src/config/cloudinary.js';

/**
 * Upload Validation Middleware
 * Handles file upload validation including size, type, and security checks
 */

/**
 * Custom storage configuration for multer
 * Files are stored in memory for direct upload to Cloudinary
 */
const storage = multer.memoryStorage();

/**
 * File filter to validate file types and MIME types
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  try {
    const { mimetype, originalname } = file;
    
    // Security: Check for potentially malicious file extensions
    const dangerousExtensions = [
      '.exe', '.bat', '.com', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar',
      '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.bin', '.run'
    ];
    
    const fileExtension = originalname.toLowerCase().substring(originalname.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(fileExtension)) {
      return cb(new Error(`File type ${fileExtension} is not allowed for security reasons`), false);
    }
    
    // Check if MIME type is allowed
    const allAllowedTypes = [...ALLOWED_MIME_TYPES.IMAGES, ...ALLOWED_MIME_TYPES.DOCUMENTS];
    
    if (!allAllowedTypes.includes(mimetype)) {
      return cb(new Error(`File type ${mimetype} is not allowed`), false);
    }
    
    // Additional security: Check for MIME type spoofing
    const expectedMimeTypes = {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.gif': ['image/gif'],
      '.webp': ['image/webp'],
      '.pdf': ['application/pdf'],
      '.doc': ['application/msword'],
      '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      '.txt': ['text/plain']
    };
    
    if (expectedMimeTypes[fileExtension] && !expectedMimeTypes[fileExtension].includes(mimetype)) {
      return cb(new Error('File extension does not match MIME type'), false);
    }
    
    // Set upload category based on MIME type
    if (ALLOWED_MIME_TYPES.IMAGES.includes(mimetype)) {
      req.uploadCategory = 'image';
    } else if (ALLOWED_MIME_TYPES.DOCUMENTS.includes(mimetype)) {
      req.uploadCategory = 'document';
    }
    
    cb(null, true);
  } catch (error) {
    cb(new Error('File validation error'), false);
  }
};

/**
 * Create multer instance with validation
 * @param {string} uploadType - Type of upload (avatar, trade, document)
 * @returns {Object} Configured multer instance
 */
export const createUploadMiddleware = (uploadType = 'general') => {
  let limits;
  
  // Set size limits based on upload type
  switch (uploadType) {
    case 'avatar':
      limits = { fileSize: FILE_SIZE_LIMITS.AVATAR };
      break;
    case 'image':
    case 'trade':
      limits = { fileSize: FILE_SIZE_LIMITS.IMAGE };
      break;
    case 'document':
      limits = { fileSize: FILE_SIZE_LIMITS.DOCUMENT };
      break;
    default:
      limits = { fileSize: FILE_SIZE_LIMITS.IMAGE };
  }
  
  return multer({
    storage,
    fileFilter,
    limits,
    // Additional security options
    preservePath: false, // Prevent path traversal
    limits: {
      ...limits,
      files: 10, // Maximum number of files
      fields: 20, // Maximum number of form fields
      fieldNameSize: 200, // Maximum field name size
      fieldSize: 1024 * 1024, // 1MB maximum field value size
      headerPairs: 2000 // Maximum number of header key-value pairs
    }
  });
};

/**
 * Middleware to validate file upload request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const validateUploadRequest = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for file uploads'
      });
    }
    
    // Rate limiting: Check if user has exceeded upload limits
    const userUploads = req.user.uploadCount || 0;
    const maxUploadsPerHour = 50; // Configurable limit
    
    if (userUploads >= maxUploadsPerHour) {
      return res.status(429).json({
        success: false,
        error: 'Upload limit exceeded. Please try again later.'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Upload validation error'
    });
  }
};

/**
 * Middleware to sanitize uploaded file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const sanitizeFile = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }
    
    const { file } = req;
    
    // Sanitize filename
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 100); // Limit filename length
    
    // Add sanitized filename to request
    req.file.sanitizedName = sanitizedName;
    
    // Add file metadata
    req.file.uploadTimestamp = Date.now();
    req.file.uploadedBy = req.user.id;
    req.file.category = req.uploadCategory || 'general';
    
    // Basic virus scanning placeholder (implement with actual antivirus service)
    if (file.size === 0) {
      return res.status(400).json({
        success: false,
        error: 'Empty file detected'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'File sanitization error'
    });
  }
};

/**
 * Error handler for multer errors
 * @param {Error} error - Multer error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({
          success: false,
          error: 'File too large. Please choose a smaller file.',
          maxSize: error.field === 'avatar' ? '2MB' : '10MB'
        });
        
      case 'LIMIT_FILE_COUNT':
        return res.status(413).json({
          success: false,
          error: 'Too many files. Maximum 10 files allowed.'
        });
        
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field'
        });
        
      default:
        return res.status(400).json({
          success: false,
          error: 'File upload error'
        });
    }
  }
  
  // Handle custom file validation errors
  if (error.message.includes('File type') || error.message.includes('MIME type')) {
    return res.status(415).json({
      success: false,
      error: error.message
    });
  }
  
  // General error handler
  return res.status(500).json({
    success: false,
    error: 'Internal server error during file upload'
  });
};

/**
 * Middleware to log upload attempts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const logUpload = (req, res, next) => {
  const uploadInfo = {
    userId: req.user?.id || 'anonymous',
    filename: req.file?.originalname || 'unknown',
    size: req.file?.size || 0,
    mimetype: req.file?.mimetype || 'unknown',
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress
  };
  
  // Log to console (replace with proper logging service)
  console.log('File upload attempt:', uploadInfo);
  
  // Store in request for potential audit trail
  req.uploadLog = uploadInfo;
  
  next();
};

// Pre-configured middleware instances
export const avatarUpload = createUploadMiddleware('avatar').single('avatar');
export const imageUpload = createUploadMiddleware('image').single('image');
export const documentUpload = createUploadMiddleware('document').single('document');
export const multipleImagesUpload = createUploadMiddleware('image').array('images', 5);

// Combined middleware chains
export const validateAvatarUpload = [
  validateUploadRequest,
  avatarUpload,
  handleUploadError,
  sanitizeFile,
  logUpload
];

export const validateImageUpload = [
  validateUploadRequest,
  imageUpload,
  handleUploadError,
  sanitizeFile,
  logUpload
];

export const validateDocumentUpload = [
  validateUploadRequest,
  documentUpload,
  handleUploadError,
  sanitizeFile,
  logUpload
];

export const validateMultipleImagesUpload = [
  validateUploadRequest,
  multipleImagesUpload,
  handleUploadError,
  sanitizeFile,
  logUpload
];