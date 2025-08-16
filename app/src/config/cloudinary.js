import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Cloudinary Configuration
 * Environment-based configuration for image/file uploads
 */

// Validate required environment variables
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Cloudinary environment variables: ${missingVars.join(', ')}`
  );
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: process.env.NODE_ENV === 'production'
});

/**
 * Upload presets configuration
 */
export const UPLOAD_PRESETS = {
  // Profile images with optimization
  USER_AVATAR: {
    folder: 'elite-trading-coach/avatars',
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto', format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'webp']
  },
  
  // Trading screenshots and charts
  TRADE_SCREENSHOT: {
    folder: 'elite-trading-coach/trades',
    transformation: [
      { width: 1200, quality: 'auto', format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'webp']
  },
  
  // General documents and files
  DOCUMENT: {
    folder: 'elite-trading-coach/documents',
    resource_type: 'auto',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt']
  }
};

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  AVATAR: 2 * 1024 * 1024 // 2MB
};

/**
 * Allowed MIME types
 */
export const ALLOWED_MIME_TYPES = {
  IMAGES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
};

/**
 * Generate secure signed upload URL
 * @param {string} uploadPreset - The upload preset to use
 * @param {string} publicId - Optional public ID for the file
 * @param {Object} options - Additional upload options
 * @returns {Object} Signed upload parameters
 */
export const generateSignedUploadUrl = (uploadPreset, publicId = null, options = {}) => {
  const timestamp = Math.round(Date.now() / 1000);
  
  const params = {
    timestamp,
    upload_preset: uploadPreset,
    ...options
  };
  
  if (publicId) {
    params.public_id = publicId;
  }
  
  // Generate signature
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
  
  return {
    ...params,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME
  };
};

/**
 * Upload file to Cloudinary
 * @param {Buffer|string} file - File buffer or file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export const uploadFile = async (file, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'auto',
      ...options
    });
    
    return {
      success: true,
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        created_at: result.created_at
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @param {string} resourceType - The resource type (image, video, raw)
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    return {
      success: true,
      result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate optimized image URL
 * @param {string} publicId - The public ID of the image
 * @param {Object} transformations - Transformation options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    quality: 'auto',
    format: 'auto',
    ...transformations
  });
};

/**
 * Validate upload parameters
 * @param {Object} params - Upload parameters to validate
 * @returns {Object} Validation result
 */
export const validateUploadParams = (params) => {
  const errors = [];
  
  // Validate required parameters
  if (!params.timestamp) {
    errors.push('Missing timestamp');
  }
  
  if (!params.signature) {
    errors.push('Missing signature');
  }
  
  if (!params.api_key) {
    errors.push('Missing API key');
  }
  
  // Validate timestamp (should not be older than 1 hour)
  const currentTime = Math.round(Date.now() / 1000);
  const maxAge = 3600; // 1 hour
  
  if (params.timestamp && (currentTime - params.timestamp > maxAge)) {
    errors.push('Upload signature has expired');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export default cloudinary;