import express from 'express';
import { 
  generateSignedUploadUrl, 
  uploadFile, 
  validateUploadParams,
  UPLOAD_PRESETS 
} from '../../src/config/cloudinary.js';
import { 
  validateImageUpload, 
  validateDocumentUpload, 
  validateAvatarUpload 
} from '../../middleware/uploadValidation.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

/**
 * Secure Upload API Endpoint
 * Handles file uploads with Cloudinary integration and validation
 */

/**
 * POST /api/upload/secure-upload/signature
 * Generate signed upload URL for direct client-side uploads
 */
router.post('/signature', authenticateToken, async (req, res) => {
  try {
    const { uploadType, publicId, folder } = req.body;
    
    // Validate upload type
    const validUploadTypes = ['avatar', 'trade_screenshot', 'document'];
    if (!validUploadTypes.includes(uploadType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid upload type'
      });
    }
    
    // Generate unique public ID if not provided
    const finalPublicId = publicId || `${uploadType}_${req.user.id}_${Date.now()}`;
    
    // Set upload options based on type
    let uploadOptions = {};
    
    switch (uploadType) {
      case 'avatar':
        uploadOptions = {
          ...UPLOAD_PRESETS.USER_AVATAR,
          public_id: finalPublicId
        };
        break;
        
      case 'trade_screenshot':
        uploadOptions = {
          ...UPLOAD_PRESETS.TRADE_SCREENSHOT,
          public_id: finalPublicId
        };
        break;
        
      case 'document':
        uploadOptions = {
          ...UPLOAD_PRESETS.DOCUMENT,
          public_id: finalPublicId
        };
        break;
    }
    
    // Override folder if provided
    if (folder) {
      uploadOptions.folder = `elite-trading-coach/${folder}`;
    }
    
    // Generate signed parameters
    const signedParams = generateSignedUploadUrl('ml_default', finalPublicId, uploadOptions);
    
    // Add upload URL
    const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    res.json({
      success: true,
      data: {
        uploadUrl,
        signedParams,
        publicId: finalPublicId
      }
    });
    
  } catch (error) {
    console.error('Error generating signed upload URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate upload signature'
    });
  }
});

/**
 * POST /api/upload/secure-upload/avatar
 * Upload avatar image with validation and optimization
 */
router.post('/avatar', ...validateAvatarUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }
    
    // Upload to Cloudinary
    const uploadResult = await uploadFile(req.file.buffer, {
      ...UPLOAD_PRESETS.USER_AVATAR,
      public_id: `avatar_${req.user.id}_${Date.now()}`
    });
    
    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload avatar',
        details: uploadResult.error
      });
    }
    
    // TODO: Save file metadata to database
    // This will be handled by the file metadata service
    
    res.json({
      success: true,
      data: {
        fileUrl: uploadResult.data.secure_url,
        publicId: uploadResult.data.public_id,
        metadata: {
          width: uploadResult.data.width,
          height: uploadResult.data.height,
          format: uploadResult.data.format,
          size: uploadResult.data.bytes
        }
      }
    });
    
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during avatar upload'
    });
  }
});

/**
 * POST /api/upload/secure-upload/image
 * Upload trade screenshot or general image
 */
router.post('/image', ...validateImageUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }
    
    const { tradeId, description } = req.body;
    
    // Upload to Cloudinary
    const uploadResult = await uploadFile(req.file.buffer, {
      ...UPLOAD_PRESETS.TRADE_SCREENSHOT,
      public_id: `trade_${tradeId || 'general'}_${Date.now()}`,
      context: {
        uploaded_by: req.user.id,
        trade_id: tradeId || null,
        description: description || ''
      }
    });
    
    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload image',
        details: uploadResult.error
      });
    }
    
    res.json({
      success: true,
      data: {
        fileUrl: uploadResult.data.secure_url,
        publicId: uploadResult.data.public_id,
        metadata: {
          width: uploadResult.data.width,
          height: uploadResult.data.height,
          format: uploadResult.data.format,
          size: uploadResult.data.bytes
        }
      }
    });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during image upload'
    });
  }
});

/**
 * POST /api/upload/secure-upload/document
 * Upload document files (PDF, DOC, etc.)
 */
router.post('/document', ...validateDocumentUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }
    
    const { category, description } = req.body;
    
    // Upload to Cloudinary
    const uploadResult = await uploadFile(req.file.buffer, {
      ...UPLOAD_PRESETS.DOCUMENT,
      public_id: `doc_${category || 'general'}_${Date.now()}`,
      context: {
        uploaded_by: req.user.id,
        category: category || 'general',
        description: description || ''
      }
    });
    
    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload document',
        details: uploadResult.error
      });
    }
    
    res.json({
      success: true,
      data: {
        fileUrl: uploadResult.data.secure_url,
        publicId: uploadResult.data.public_id,
        metadata: {
          format: uploadResult.data.format,
          size: uploadResult.data.bytes,
          resourceType: uploadResult.data.resource_type
        }
      }
    });
    
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during document upload'
    });
  }
});

/**
 * POST /api/upload/secure-upload/validate-signature
 * Validate signed upload parameters from client
 */
router.post('/validate-signature', authenticateToken, async (req, res) => {
  try {
    const { signature, timestamp, api_key } = req.body;
    
    // Validate required parameters
    if (!signature || !timestamp || !api_key) {
      return res.status(400).json({
        success: false,
        error: 'Missing required signature parameters'
      });
    }
    
    // Validate signature parameters
    const validation = validateUploadParams(req.body);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature parameters',
        details: validation.errors
      });
    }
    
    res.json({
      success: true,
      message: 'Signature is valid'
    });
    
  } catch (error) {
    console.error('Error validating signature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate signature'
    });
  }
});

/**
 * DELETE /api/upload/secure-upload/:publicId
 * Delete uploaded file from Cloudinary
 */
router.delete('/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Public ID is required'
      });
    }
    
    // TODO: Verify user has permission to delete this file
    // Check if file belongs to user or user has admin rights
    
    // Delete from Cloudinary
    const { deleteFile } = await import('../../src/config/cloudinary.js');
    const deleteResult = await deleteFile(publicId, resourceType);
    
    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete file',
        details: deleteResult.error
      });
    }
    
    // TODO: Remove file metadata from database
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during file deletion'
    });
  }
});

/**
 * GET /api/upload/secure-upload/status
 * Check upload service status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    service: 'Cloudinary Upload Service',
    status: 'operational',
    timestamp: new Date().toISOString(),
    features: {
      signedUploads: true,
      directUploads: true,
      validation: true,
      fileTypes: ['images', 'documents'],
      maxSizes: {
        avatar: '2MB',
        image: '5MB',
        document: '10MB'
      }
    }
  });
});

// Error handling middleware specific to upload routes
router.use((error, req, res, next) => {
  console.error('Upload API Error:', error);
  
  // Handle specific upload errors
  if (error.message.includes('signature')) {
    return res.status(401).json({
      success: false,
      error: 'Invalid upload signature'
    });
  }
  
  if (error.message.includes('file size') || error.message.includes('too large')) {
    return res.status(413).json({
      success: false,
      error: 'File too large'
    });
  }
  
  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Upload service error'
  });
});

export default router;