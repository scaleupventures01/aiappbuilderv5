/**
 * Upload and Analyze Endpoint
 * Unified endpoint for uploading trading charts and getting immediate AI analysis
 * Created: 2025-08-16
 */

import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../../middleware/auth.js';
import { validateUpload } from '../../middleware/validation.js';
import { processUploadedChart, checkPipelineHealth } from '../../services/uploadAnalysisPipeline.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
    files: 1 // Only one file for analysis
  },
  fileFilter: (req, file, cb) => {
    // Validate file types for trading charts
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP trading charts are allowed.'));
    }
  }
});

/**
 * POST /api/upload-analyze/chart
 * Upload a trading chart and get immediate AI analysis
 */
router.post('/chart', 
  authenticateToken,
  upload.single('chart'),
  validateUpload,
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      const file = req.file;
      const userId = req.user.id;
      const { 
        conversationId, 
        context = 'trading_analysis',
        speed = 'balanced',
        enablePsychology = 'true'
      } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No chart file provided',
          code: 'FILE_REQUIRED',
          help: 'Please upload a trading chart image (JPEG, PNG, GIF, or WebP)'
        });
      }

      // Add request headers for progress tracking
      res.set('X-Upload-Status', 'processing');
      res.set('X-Upload-Progress', '0');

      console.log(`📈 Processing chart upload for user ${userId}: ${file.originalname}`);

      // Process through unified pipeline
      const result = await processUploadedChart(
        file.buffer,
        {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        },
        {
          userId,
          conversationId,
          context,
          speed,
          enablePsychologyAnalysis: enablePsychology === 'true',
          startTime
        }
      );

      if (!result.success && result.error) {
        return res.status(500).json({
          success: false,
          error: result.error,
          pipeline: result.pipeline,
          help: 'Please try again or contact support if the issue persists'
        });
      }

      // Update progress headers
      res.set('X-Upload-Status', 'completed');
      res.set('X-Upload-Progress', '100');

      // Return comprehensive result
      res.status(201).json({
        success: true,
        message: 'Chart uploaded and analyzed successfully',
        data: {
          upload: result.upload,
          analysis: result.analysis,
          pipeline: result.pipeline
        },
        meta: {
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          userId,
          fileName: file.originalname,
          fileSize: file.size
        }
      });

    } catch (error) {
      console.error('Upload-analyze endpoint error:', error);
      
      // Set error status
      res.set('X-Upload-Status', 'failed');
      
      // Handle specific error types
      if (error.message.includes('File too large')) {
        return res.status(413).json({
          success: false,
          error: 'File size exceeds 15MB limit',
          code: 'FILE_TOO_LARGE',
          help: 'Please reduce the file size and try again'
        });
      }
      
      if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type',
          code: 'INVALID_FILE_TYPE',
          help: 'Please upload a valid trading chart image (JPEG, PNG, GIF, or WebP)'
        });
      }
      
      if (error.message.includes('Cloudinary')) {
        return res.status(503).json({
          success: false,
          error: 'Upload service is temporarily unavailable',
          code: 'STORAGE_ERROR',
          help: 'Please try again in a few moments'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to process chart upload and analysis',
        code: 'PROCESSING_ERROR',
        details: error.message,
        help: 'Please try again or contact support'
      });
    }
  }
);

/**
 * GET /api/upload-analyze/health
 * Check the health of the upload-analyze pipeline
 */
router.get('/health', async (req, res) => {
  try {
    const healthResult = await checkPipelineHealth();
    
    const statusCode = healthResult.success ? 200 : 503;
    res.status(statusCode).json({
      ...healthResult,
      endpoint: '/api/upload-analyze'
    });
    
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/upload-analyze/status
 * Get status information about the upload-analyze service
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    service: 'Upload & Analyze Trading Charts',
    version: '1.0.0',
    features: {
      uploadToCloudinary: true,
      aiAnalysis: process.env.USE_MOCK_OPENAI === 'true' ? 'mock' : 'production',
      psychologyAnalysis: true,
      multipleSpeedOptions: true,
      unifiedPipeline: true
    },
    limits: {
      maxFileSize: '15MB',
      allowedTypes: ['JPEG', 'PNG', 'GIF', 'WebP'],
      maxFilesPerRequest: 1
    },
    endpoints: {
      'POST /api/upload-analyze/chart': 'Upload and analyze trading chart',
      'GET /api/upload-analyze/health': 'Check pipeline health',
      'GET /api/upload-analyze/status': 'Get service status'
    },
    authentication: 'JWT Bearer token required',
    timestamp: new Date().toISOString()
  });
});

export default router;