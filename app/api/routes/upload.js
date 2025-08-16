import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateToken } from '../../middleware/auth.js';
import { validateUpload } from '../../middleware/validation.js';
import { uploadService } from '../../services/uploadService.js';
import { 
  createUpload, 
  getUploadById, 
  deleteUpload,
  checkUploadAccess 
} from '../../db/queries/uploads.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
    files: 5 // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// POST /api/upload/images
router.post('/images', 
  authenticateToken,
  upload.array('images', 5),
  validateUpload,
  async (req, res) => {
    try {
      // Check if uploads table exists before processing
      const { validateUploadsTable } = await import('../../db/validate-uploads-table.js');
      try {
        await validateUploadsTable();
      } catch (dbError) {
        return res.status(503).json({
          success: false,
          error: 'Upload functionality is not available',
          details: 'Database table not configured. Please run database migrations.',
          code: 'DB_TABLE_MISSING',
          help: 'Run: psql -d your_database -f db/migrations/create-uploads-table.sql'
        });
      }

      const files = req.files;
      const userId = req.user.id;
      const { conversationId, context = 'chat' } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided'
        });
      }

      // Process each uploaded file
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          try {
            // Upload to Cloudinary
            const cloudinaryResult = await uploadService.uploadBuffer(
              file.buffer,
              {
                folder: `elite-trading-coach/${context}/${userId}`,
                public_id: `${Date.now()}_${file.originalname.split('.')[0]}`,
                resource_type: 'image',
                transformation: [
                  { quality: 'auto:good' },
                  { fetch_format: 'auto' }
                ],
                tags: [context, `user_${userId}`, 'upload']
              }
            );

            // Store upload record in database
            const uploadRecord = await createUpload({
              userId,
              conversationId,
              cloudinaryPublicId: cloudinaryResult.public_id,
              originalFilename: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              secureUrl: cloudinaryResult.secure_url,
              thumbnailUrl: uploadService.generateThumbnail(cloudinaryResult.public_id, 300, 300),
              context
            });

            return {
              id: uploadRecord.id,
              publicId: cloudinaryResult.public_id,
              originalName: file.originalname,
              secureUrl: cloudinaryResult.secure_url,
              thumbnailUrl: uploadRecord.thumbnail_url,
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              format: cloudinaryResult.format,
              bytes: cloudinaryResult.bytes,
              createdAt: uploadRecord.created_at
            };

          } catch (uploadError) {
            console.error('Individual file upload error:', uploadError);
            throw new Error(`Failed to upload ${file.originalname}: ${uploadError.message}`);
          }
        })
      );

      // Return success response
      res.status(201).json({
        success: true,
        results: uploadResults.map(result => ({
          id: result.id,
          originalFilename: result.originalName,
          secureUrl: result.secureUrl,
          thumbnailUrl: result.thumbnailUrl,
          fileSize: result.bytes,
          format: result.format,
          width: result.width,
          height: result.height,
          createdAt: result.createdAt
        })),
        data: {
          uploads: uploadResults,
          totalUploaded: uploadResults.length
        }
      });

    } catch (error) {
      console.error('Upload endpoint error:', error);
      
      // Handle specific error types
      if (error.message.includes('relation "uploads" does not exist')) {
        return res.status(503).json({
          success: false,
          error: 'Upload functionality is not available',
          details: 'Database uploads table does not exist',
          code: 'DB_TABLE_MISSING',
          help: 'Please run database migrations to create the uploads table'
        });
      }
      
      if (error.message.includes('Cloudinary')) {
        return res.status(503).json({
          success: false,
          error: 'Upload service is not available',
          details: 'Cloudinary is not properly configured',
          code: 'CLOUDINARY_CONFIG_ERROR',
          help: 'Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message || 'Upload failed. Please try again.'
      });
    }
  }
);

// GET /api/upload/images/:id - Get upload details
router.get('/images/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const upload = await getUploadById(id, userId);

      if (!upload) {
        return res.status(404).json({
          success: false,
          error: 'Upload not found'
        });
      }

      res.json({
        success: true,
        data: upload
      });

    } catch (error) {
      console.error('Get upload error:', error);
      
      // Handle database table missing error
      if (error.message.includes('relation "uploads" does not exist')) {
        return res.status(503).json({
          success: false,
          error: 'Upload functionality is not available',
          details: 'Database uploads table does not exist',
          code: 'DB_TABLE_MISSING'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve upload details'
      });
    }
  }
);

// DELETE /api/upload/images/:id - Delete uploaded image
router.delete('/images/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get and delete upload record
      const deletedUpload = await deleteUpload(id, userId);

      if (!deletedUpload) {
        return res.status(404).json({
          success: false,
          error: 'Upload not found'
        });
      }

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(deletedUpload.cloudinary_public_id);

      res.json({
        success: true,
        message: 'Upload deleted successfully'
      });

    } catch (error) {
      console.error('Delete upload error:', error);
      
      // Handle database table missing error
      if (error.message.includes('relation "uploads" does not exist')) {
        return res.status(503).json({
          success: false,
          error: 'Upload functionality is not available',
          details: 'Database uploads table does not exist',
          code: 'DB_TABLE_MISSING'
        });
      }
      
      // Handle Cloudinary errors
      if (error.message.includes('Cloudinary')) {
        return res.status(503).json({
          success: false,
          error: 'Upload service is not available',
          details: 'Cloudinary is not properly configured',
          code: 'CLOUDINARY_CONFIG_ERROR'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete upload'
      });
    }
  }
);

export default router;