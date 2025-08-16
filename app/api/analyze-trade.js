/**
 * Trade Analysis API Endpoint - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Comprehensive trade analysis endpoint with error handling and retry logic
 * Created: 2025-08-15
 */

import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { 
  authenticateToken,
  requireEmailVerification,
  premiumRateLimitBypass 
} from '../middleware/auth.js';
import { asyncHandler } from '../server/middleware/error-handler.js';
import { tradeAnalysisService } from '../server/services/trade-analysis-service.js';
import { tradeAnalysisErrorHandler, ERROR_TYPES } from '../server/services/trade-analysis-error-handler.js';
import { updateLastActive } from '../db/queries/users.js';
import { createMessage } from '../db/queries/messages.js';
import { getUserSpeedPreference, recordSpeedAnalytics } from '../db/queries/speed-preferences.js';
import { CostCalculator } from '../server/services/cost-calculator.js';

const router = express.Router();

/**
 * Configure multer for image uploads
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow single file upload
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Invalid file type. Only PNG, JPG, and JPEG are allowed.');
      error.code = 'INVALID_FILE_FORMAT';
      return cb(error, false);
    }
    
    // Additional file validation
    if (!file.originalname || file.originalname.trim() === '') {
      const error = new Error('File must have a valid name.');
      error.code = 'INVALID_FILE_NAME';
      return cb(error, false);
    }
    
    cb(null, true);
  }
});

/**
 * Rate limiting for trade analysis
 */
const analysisRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 analyses per hour for regular users
  message: {
    success: false,
    error: 'Too many analysis requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 3600
  },
  skip: (req) => req.isPremiumUser === true, // Premium users get higher limits
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Stricter rate limit for rapid requests
 */
const burstRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 analyses per minute
  message: {
    success: false,
    error: 'Too many rapid requests. Please wait a moment before trying again.',
    code: 'BURST_RATE_LIMIT',
    retryAfter: 60
  },
  skip: (req) => req.isPremiumUser === true
});

/**
 * Input validation middleware - supports both file uploads and Cloudinary URLs
 */
const validateTradeAnalysisRequest = (req, res, next) => {
  const errors = [];
  
  // Check if either file was uploaded OR cloudinaryUrl provided
  const hasFile = !!req.file;
  const hasCloudinaryUrl = !!req.body.cloudinaryUrl;
  
  if (!hasFile && !hasCloudinaryUrl) {
    errors.push('Either image file upload or cloudinaryUrl is required');
  } else if (hasFile && hasCloudinaryUrl) {
    errors.push('Provide either image file upload OR cloudinaryUrl, not both');
  }
  
  // Validate file upload if provided
  if (hasFile) {
    // Validate file size (multer handles this but we double-check)
    if (req.file.size > 10 * 1024 * 1024) {
      errors.push('File size too large (max 10MB)');
    }
    
    // Validate file type (multer handles this but we double-check)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      errors.push('Invalid file type (PNG, JPG, JPEG only)');
    }
  }
  
  // Validate Cloudinary URL if provided
  if (hasCloudinaryUrl) {
    const cloudinaryUrl = req.body.cloudinaryUrl.trim();
    
    // Basic URL validation
    if (!cloudinaryUrl.startsWith('https://res.cloudinary.com/')) {
      errors.push('Invalid Cloudinary URL format. Must start with https://res.cloudinary.com/');
    }
    
    // Check for supported image formats in URL
    const imageExtensions = ['.png', '.jpg', '.jpeg'];
    const hasValidExtension = imageExtensions.some(ext => 
      cloudinaryUrl.toLowerCase().includes(ext)
    );
    
    if (!hasValidExtension) {
      errors.push('Cloudinary URL must point to a valid image (PNG, JPG, JPEG)');
    }
    
    // URL length validation
    if (cloudinaryUrl.length > 500) {
      errors.push('Cloudinary URL too long (max 500 characters)');
    }
  }
  
  // Validate description if provided
  if (req.body.description) {
    const description = req.body.description.trim();
    if (description.length > 1000) {
      errors.push('Description too long (max 1000 characters)');
    }
    
    // Basic content validation
    if (description.length > 0 && description.length < 3) {
      errors.push('Description too short (min 3 characters)');
    }
  }
  
  // Validate speed mode if provided
  if (req.body.speedMode) {
    const validSpeedModes = ['fast', 'balanced', 'thorough', 'maximum'];
    if (!validSpeedModes.includes(req.body.speedMode)) {
      errors.push(`Invalid speed mode. Must be one of: ${validSpeedModes.join(', ')}`);
    }
  }
  
  // Validate force model if provided
  if (req.body.forceModel) {
    const validModels = ['gpt-5', 'gpt-4o', 'gpt-4', 'o1-preview', 'o1-mini'];
    if (!validModels.includes(req.body.forceModel)) {
      errors.push(`Invalid model. Must be one of: ${validModels.join(', ')}`);
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Convert uploaded file to base64 data URL
 */
const processImageFile = (file) => {
  try {
    const base64Data = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
    
    return {
      dataUrl,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      source: 'upload'
    };
  } catch (error) {
    throw new Error('Failed to process image file');
  }
};

/**
 * Process Cloudinary URL for analysis
 */
const processCloudinaryUrl = (cloudinaryUrl) => {
  try {
    // Extract filename from Cloudinary URL
    const urlParts = cloudinaryUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Determine mimetype from URL
    let mimetype = 'image/jpeg'; // default
    if (cloudinaryUrl.toLowerCase().includes('.png')) {
      mimetype = 'image/png';
    } else if (cloudinaryUrl.toLowerCase().includes('.jpg') || cloudinaryUrl.toLowerCase().includes('.jpeg')) {
      mimetype = 'image/jpeg';
    }
    
    return {
      dataUrl: cloudinaryUrl, // Use URL directly for Vision API
      filename: filename,
      size: null, // Unknown for URL
      mimetype: mimetype,
      source: 'cloudinary'
    };
  } catch (error) {
    throw new Error('Failed to process Cloudinary URL');
  }
};

/**
 * Save analysis to database
 */
const saveAnalysisToDatabase = async (userId, analysisResult, imageData, description, requestId) => {
  try {
    // For now, we'll save to messages table - in future this might be a separate analyses table
    const messageData = {
      conversation_id: null, // Analysis messages might not be tied to conversations initially
      user_id: userId,
      content: description || 'Chart analysis request',
      type: 'ai',
      verdict: analysisResult.data.verdict.toLowerCase(),
      confidence: analysisResult.data.confidence,
      analysis_mode: 'analysis',
      image_url: imageData.source === 'cloudinary' ? imageData.dataUrl : null,
      image_filename: imageData.filename,
      image_size: imageData.size,
      ai_model: analysisResult.metadata.model,
      ai_tokens_used: analysisResult.metadata.tokensUsed,
      processing_time_ms: analysisResult.metadata.processingTime,
      status: 'completed',
      speed_mode: analysisResult.metadata.speedMode || 'balanced',
      reasoning_effort: analysisResult.metadata.reasoningEffort || null,
      fallback_used: analysisResult.data.fallbackUsed || false
    };
    
    return await createMessage(messageData);
  } catch (error) {
    console.error('Failed to save analysis to database:', error);
    // Don't fail the entire request if database save fails
    return null;
  }
};

/**
 * Optional file upload middleware - only processes uploads if files are present
 */
const optionalFileUpload = (req, res, next) => {
  // Check if this is a multipart request (has file upload)
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('multipart/form-data')) {
    // Use multer for file upload
    upload.single('image')(req, res, next);
  } else {
    // Skip multer, continue with request processing
    next();
  }
};

/**
 * POST /api/analyze-trade
 * Main endpoint for trade analysis - supports both file uploads and Cloudinary URLs
 */
router.post('/',
  analysisRateLimit,
  burstRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  requireEmailVerification,
  optionalFileUpload,
  validateTradeAnalysisRequest,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const requestId = uuidv4();
    const userId = req.user.id;
    const retryCount = parseInt(req.headers['retry-count']) || 0;
    const maxRetries = 2;
    
    // Set error handler context
    tradeAnalysisErrorHandler.setContext(requestId, userId, {
      endpoint: '/api/analyze-trade',
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      retryCount,
      startTime
    });

    console.log(`🔍 Trade analysis request ${requestId} from user ${userId} (retry: ${retryCount})`);

    try {
      // Process image (either uploaded file or Cloudinary URL)
      let imageData;
      if (req.file) {
        imageData = processImageFile(req.file);
      } else if (req.body.cloudinaryUrl) {
        imageData = processCloudinaryUrl(req.body.cloudinaryUrl);
      } else {
        throw new Error('No image source provided');
      }
      
      const description = req.body.description?.trim() || '';
      let speedMode = req.body.speedMode;
      const forceModel = req.body.forceModel || null;
      
      // Get user's speed preference if no speedMode specified
      let userPreference = null;
      if (!speedMode) {
        try {
          userPreference = await getUserSpeedPreference(userId);
          speedMode = userPreference.speedPreference;
          console.log(`📊 Using user's preferred speed mode: ${speedMode}`);
        } catch (error) {
          console.warn('Failed to get user speed preference, using balanced:', error.message);
          speedMode = 'balanced';
        }
      }
      
      console.log(`🚀 Analysis parameters: speedMode=${speedMode}, forceModel=${forceModel}`);
      
      // Attempt analysis with retry logic
      let analysisResult = null;
      let currentRetry = 0;
      
      while (currentRetry <= maxRetries) {
        try {
          // Call trade analysis service with enhanced options
          analysisResult = await tradeAnalysisService.analyzeChart(
            imageData.dataUrl,
            description,
            {
              requestId,
              userId,
              retryCount: currentRetry,
              speedMode,
              forceModel
            }
          );
          
          // If successful, break out of retry loop
          break;
          
        } catch (error) {
          console.error(`Analysis attempt ${currentRetry + 1} failed:`, error.message);
          
          // Check if error is retryable and we haven't exceeded max retries
          if (tradeAnalysisErrorHandler.isRetryable(error) && currentRetry < maxRetries) {
            currentRetry++;
            
            // Get error config for delay
            const errorType = tradeAnalysisErrorHandler.classifyError(error);
            const errorConfig = ERROR_TYPES[errorType];
            
            if (errorConfig.delay) {
              console.log(`Waiting ${errorConfig.delay}ms before retry ${currentRetry}`);
              await tradeAnalysisErrorHandler.delay(errorConfig.delay);
            }
            
            continue; // Try again
          } else {
            // Not retryable or max retries exceeded
            throw error;
          }
        }
      }
      
      if (!analysisResult) {
        throw new Error('Analysis failed after all retry attempts');
      }
      
      // Calculate cost for the analysis
      let costData = null;
      try {
        if (!userPreference) {
          userPreference = await getUserSpeedPreference(userId);
        }
        
        costData = CostCalculator.calculateCost({
          model: analysisResult.metadata.model,
          inputTokens: Math.floor((analysisResult.metadata.tokensUsed || 0) * 0.8), // Estimate 80% input
          outputTokens: Math.floor((analysisResult.metadata.tokensUsed || 0) * 0.2), // Estimate 20% output
          speedMode: analysisResult.metadata.speedMode || speedMode,
          subscriptionTier: userPreference.subscriptionTier || 'free'
        });
        
        console.log(`💰 Analysis cost: $${costData.finalCost} (${costData.speedMode} mode)`);
      } catch (error) {
        console.warn('Failed to calculate cost:', error.message);
      }
      
      // Save analysis to database (non-blocking)
      saveAnalysisToDatabase(userId, analysisResult, imageData, description, requestId)
        .catch(error => {
          console.warn('Failed to save analysis to database:', error.message);
        });
      
      const totalTime = Date.now() - startTime;
      
      // Record speed analytics (non-blocking)
      if (costData) {
        recordSpeedAnalytics({
          userId,
          requestId,
          speedMode: analysisResult.metadata.speedMode || speedMode,
          reasoningEffort: analysisResult.metadata.reasoningEffort,
          responseTimeMs: totalTime,
          targetResponseTime: analysisResult.metadata.speedPerformance?.target,
          withinTargetTime: analysisResult.metadata.speedPerformance?.withinTarget || false,
          costMultiplier: costData.breakdown.speedMultiplier,
          baseCost: costData.breakdown.baseCost,
          totalCost: costData.finalCost,
          tokensUsed: analysisResult.metadata.tokensUsed || 0,
          modelUsed: analysisResult.metadata.model,
          fallbackUsed: analysisResult.data.fallbackUsed || false,
          retryCount: currentRetry,
          endpoint: '/api/analyze-trade',
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          verdict: analysisResult.data.verdict,
          confidence: analysisResult.data.confidence,
          analysisSuccessful: true
        }).catch(error => {
          console.warn('Failed to record speed analytics:', error.message);
        });
      }
      
      // Update user's last active timestamp (non-blocking)
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
      
      console.log(`✅ Trade analysis completed for ${requestId} in ${totalTime}ms (${currentRetry} retries)`);
      
      // Return successful response with enhanced metadata
      res.json({
        success: true,
        data: {
          verdict: analysisResult.data.verdict,
          confidence: analysisResult.data.confidence,
          reasoning: analysisResult.data.reasoning,
          processingTime: totalTime,
          modelUsed: analysisResult.data.modelUsed,
          fallbackUsed: analysisResult.data.fallbackUsed,
          analysisMode: analysisResult.data.analysisMode,
          imageSource: imageData.source,
          imageFilename: imageData.filename
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          model: analysisResult.metadata.model,
          tokensUsed: analysisResult.metadata.tokensUsed,
          retryCount: currentRetry,
          totalProcessingTime: totalTime,
          speedMode: analysisResult.metadata.speedMode,
          reasoningEffort: analysisResult.metadata.reasoningEffort,
          gpt5Features: {
            reasoningEffortSupported: analysisResult.metadata.model === 'gpt-5' || analysisResult.metadata.model?.startsWith('o1'),
            fallbackAvailable: true,
            speedModeMapping: {
              fast: 'low',
              balanced: 'medium', 
              thorough: 'high',
              maximum: 'high'
            }
          },
          cost: costData ? {
            totalCost: costData.finalCost,
            speedMultiplier: costData.breakdown.speedMultiplier,
            subscriptionMultiplier: costData.breakdown.subscriptionMultiplier,
            tokensUsed: costData.totalTokens,
            model: costData.model
          } : null,
          userPreferences: {
            speedPreference: userPreference?.speedPreference || speedMode,
            subscriptionTier: userPreference?.subscriptionTier || 'free',
            usedUserPreference: !req.body.speedMode
          }
        }
      });
      
    } catch (error) {
      console.error(`❌ Trade analysis failed for ${requestId}:`, error.message);
      
      const processingTime = Date.now() - startTime;
      
      // Record failed analysis in speed analytics (non-blocking)
      try {
        if (!userPreference) {
          userPreference = await getUserSpeedPreference(userId);
        }
        
        recordSpeedAnalytics({
          userId,
          requestId,
          speedMode: speedMode || 'balanced',
          responseTimeMs: processingTime,
          costMultiplier: 1.0,
          baseCost: 0.0,
          totalCost: 0.0,
          tokensUsed: 0,
          modelUsed: 'unknown',
          fallbackUsed: false,
          retryCount,
          endpoint: '/api/analyze-trade',
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          analysisSuccessful: false,
          errorType: tradeAnalysisErrorHandler.classifyError(error)
        }).catch(analyticsError => {
          console.warn('Failed to record failed analysis analytics:', analyticsError.message);
        });
      } catch (prefError) {
        console.warn('Failed to get user preference for error analytics:', prefError.message);
      }
      
      // Handle error through error handler
      const errorResponse = await tradeAnalysisErrorHandler.handleError(error, {
        requestId,
        userId,
        processingTime,
        retryCount,
        canRetry: retryCount < maxRetries,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
      
      // If error handler suggests retry (shouldn't happen here since we handle retries above)
      if (errorResponse.shouldRetry) {
        res.set('Retry-After', '3'); // 3 seconds
        return res.status(503).json({
          success: false,
          error: errorResponse.message,
          code: 'SERVICE_TEMPORARILY_UNAVAILABLE',
          retryable: true,
          retryAfter: 3,
          requestId,
          timestamp: new Date().toISOString()
        });
      }
      
      // Determine appropriate HTTP status code
      let statusCode = 500;
      if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
        statusCode = 400;
      } else if (error.name === 'AuthenticationError') {
        statusCode = 401;
      } else if (error.name === 'AuthorizationError') {
        statusCode = 403;
      } else if (error.message?.includes('rate limit')) {
        statusCode = 429;
      } else if (errorResponse.retryable) {
        statusCode = 503;
      }
      
      // Return error response
      res.status(statusCode).json({
        success: false,
        error: errorResponse.message,
        code: errorResponse.errorType || 'ANALYSIS_FAILED',
        retryable: errorResponse.retryable,
        guidance: errorResponse.guidance,
        requestId: errorResponse.requestId || requestId,
        retryCount: errorResponse.retryCount,
        processingTime,
        timestamp: errorResponse.timestamp,
        ...(process.env.NODE_ENV === 'development' && errorResponse.debug && { debug: errorResponse.debug })
      });
    }
  })
);

/**
 * GET /api/analyze-trade/health
 * Health check endpoint for the analysis service
 */
router.get('/health',
  asyncHandler(async (req, res) => {
    const healthStatus = await tradeAnalysisService.healthCheck();
    
    res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
      success: healthStatus.status === 'healthy',
      service: 'trade-analysis',
      ...healthStatus
    });
  })
);

/**
 * GET /api/analyze-trade/config
 * Get service configuration (for debugging)
 */
router.get('/config',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Only show config to authenticated users
    const config = tradeAnalysisService.getConfiguration();
    
    res.json({
      success: true,
      configuration: {
        ...config,
        // Don't expose sensitive data
        hasApiKey: config.hasApiKey,
        errorTypes: Object.keys(ERROR_TYPES),
        gpt5Features: {
          supported: true,
          currentModel: config.model,
          fallbackModel: config.fallbackModel,
          speedModes: ['fast', 'balanced', 'thorough', 'maximum'],
          reasoningEffortLevels: ['low', 'medium', 'high'],
          availableModels: ['gpt-5', 'gpt-4o', 'gpt-4', 'o1-preview', 'o1-mini']
        }
      }
    });
  })
);

/**
 * POST /api/analyze-trade/quick
 * Quick analysis endpoint using fast reasoning
 */
router.post('/quick',
  analysisRateLimit,
  burstRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  requireEmailVerification,
  upload.single('image'),
  validateTradeAnalysisRequest,
  asyncHandler(async (req, res) => {
    // Force fast speed mode
    req.body.speedMode = 'fast';
    // Reuse the main analysis logic
    return router.stack.find(layer => layer.route.path === '/' && layer.route.methods.post).handle(req, res);
  })
);

/**
 * POST /api/analyze-trade/thorough
 * Thorough analysis endpoint using high reasoning
 */
router.post('/thorough',
  analysisRateLimit,
  burstRateLimit,
  premiumRateLimitBypass,
  authenticateToken,
  requireEmailVerification,
  upload.single('image'),
  validateTradeAnalysisRequest,
  asyncHandler(async (req, res) => {
    // Force thorough speed mode
    req.body.speedMode = 'thorough';
    // Reuse the main analysis logic
    return router.stack.find(layer => layer.route.path === '/' && layer.route.methods.post).handle(req, res);
  })
);

export default router;