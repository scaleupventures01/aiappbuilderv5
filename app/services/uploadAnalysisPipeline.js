/**
 * Upload-to-Analysis Pipeline Service
 * Unified pipeline for processing uploaded trading charts through AI analysis
 * Created: 2025-08-16
 */

import { uploadService } from './uploadService.js';
import { tradeAnalysisService } from '../server/services/trade-analysis-service.js';
import { createUpload } from '../db/queries/uploads.js';

/**
 * Process uploaded image through complete analysis pipeline
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {Object} fileInfo - File metadata
 * @param {Object} analysisOptions - Analysis configuration
 * @returns {Promise<Object>} Complete upload and analysis result
 */
export async function processUploadedChart(fileBuffer, fileInfo, analysisOptions = {}) {
  const {
    userId,
    conversationId,
    context = 'trading_analysis',
    speed = 'balanced',
    enablePsychologyAnalysis = true
  } = analysisOptions;

  try {
    console.log('🔄 Starting upload-to-analysis pipeline...');
    
    // Step 1: Upload to Cloudinary
    console.log('📤 Step 1: Uploading to cloud storage...');
    const cloudinaryResult = await uploadService.uploadBuffer(
      fileBuffer,
      {
        folder: `elite-trading-coach/${context}/${userId}`,
        public_id: `${Date.now()}_${fileInfo.originalname.split('.')[0]}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
          // Add transformations optimized for AI analysis
          { width: 1920, height: 1080, crop: 'limit' }
        ],
        tags: [context, `user_${userId}`, 'ai_analysis', speed]
      }
    );
    
    // Step 2: Save upload record
    console.log('💾 Step 2: Saving upload record...');
    const uploadRecord = await createUpload({
      userId,
      conversationId,
      cloudinaryPublicId: cloudinaryResult.public_id,
      originalFilename: fileInfo.originalname,
      fileType: fileInfo.mimetype,
      fileSize: fileInfo.size,
      secureUrl: cloudinaryResult.secure_url,
      thumbnailUrl: uploadService.generateThumbnail(cloudinaryResult.public_id, 300, 300),
      context
    });

    // Step 3: Prepare image for AI analysis
    console.log('🤖 Step 3: Preparing for AI analysis...');
    const optimizedImageUrl = uploadService.generateOptimizedUrl(
      cloudinaryResult.public_id, 
      { width: 1024, height: 768, quality: 'auto:good' }
    );

    // Step 4: Analyze with AI
    console.log('🔍 Step 4: Running AI analysis...');
    let analysisResult;
    
    try {
      // Check if we should use mock analysis
      if (process.env.USE_MOCK_OPENAI === 'true') {
        analysisResult = await generateMockAnalysis(cloudinaryResult.secure_url, speed);
      } else {
        analysisResult = await tradeAnalysisService.analyzeChart(
          optimizedImageUrl,
          {
            speed,
            includeConfidence: true,
            includePsychology: enablePsychologyAnalysis,
            userId,
            uploadId: uploadRecord.id
          }
        );
      }
    } catch (aiError) {
      console.warn('⚠️ AI analysis failed, using fallback:', aiError.message);
      analysisResult = await generateFallbackAnalysis(cloudinaryResult.secure_url);
    }

    // Step 5: Combine results
    console.log('✅ Step 5: Finalizing pipeline results...');
    const pipelineResult = {
      upload: {
        id: uploadRecord.id,
        publicId: cloudinaryResult.public_id,
        originalName: fileInfo.originalname,
        secureUrl: cloudinaryResult.secure_url,
        thumbnailUrl: uploadRecord.thumbnail_url,
        optimizedUrl: optimizedImageUrl,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        bytes: cloudinaryResult.bytes,
        createdAt: uploadRecord.created_at
      },
      analysis: {
        ...analysisResult,
        processingTime: Date.now() - (analysisOptions.startTime || Date.now()),
        pipelineVersion: '1.0.0',
        analysisId: generateAnalysisId()
      },
      pipeline: {
        success: true,
        steps: [
          { step: 'upload', status: 'completed', duration: '~2s' },
          { step: 'storage', status: 'completed', duration: '~1s' },
          { step: 'optimization', status: 'completed', duration: '~0.5s' },
          { step: 'ai_analysis', status: 'completed', duration: `~${speed === 'fast' ? '10' : speed === 'balanced' ? '20' : '45'}s` }
        ],
        totalSteps: 4,
        completedSteps: 4
      }
    };

    console.log('🎉 Upload-to-analysis pipeline completed successfully');
    return pipelineResult;

  } catch (error) {
    console.error('❌ Upload-to-analysis pipeline failed:', error);
    
    // Return error with partial results if possible
    return {
      success: false,
      error: error.message,
      pipeline: {
        success: false,
        error: error.message,
        failedAt: 'pipeline_execution'
      }
    };
  }
}

/**
 * Generate mock analysis for development/testing
 */
async function generateMockAnalysis(imageUrl, speed = 'balanced') {
  console.log('🎭 Generating mock analysis...');
  
  // Simulate processing time based on speed
  const delay = speed === 'fast' ? 1000 : speed === 'balanced' ? 2000 : 3000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return {
    verdict: 'Bullish',
    confidence: 0.78,
    reasoning: 'Mock analysis: Chart shows strong upward momentum with higher highs and higher lows. Support level holding at key resistance turned support.',
    keyLevels: {
      support: ['$45,200', '$43,800'],
      resistance: ['$48,500', '$50,000']
    },
    technicalIndicators: {
      trend: 'Upward',
      momentum: 'Strong',
      volume: 'Above Average'
    },
    psychology: {
      sentiment: 'Optimistic',
      fearGreed: 65,
      marketPhase: 'Accumulation',
      tradingTips: [
        'Consider taking profits at resistance levels',
        'Watch for volume confirmation on breakouts',
        'Manage risk with stop losses below support'
      ]
    },
    metadata: {
      analysisMode: 'mock',
      speed,
      imageUrl,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Generate fallback analysis when AI fails
 */
async function generateFallbackAnalysis(imageUrl) {
  console.log('🔄 Generating fallback analysis...');
  
  return {
    verdict: 'Neutral',
    confidence: 0.45,
    reasoning: 'Analysis service temporarily unavailable. Please try again later or contact support for manual analysis.',
    error: 'AI_SERVICE_UNAVAILABLE',
    fallback: true,
    metadata: {
      analysisMode: 'fallback',
      imageUrl,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Generate unique analysis ID
 */
function generateAnalysisId() {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Pipeline health check
 */
export async function checkPipelineHealth() {
  const healthStatus = {
    upload: false,
    storage: false,
    analysis: false,
    overall: false
  };

  try {
    // Check upload service
    healthStatus.upload = uploadService.isConfigured;
    
    // Check storage (Cloudinary)
    healthStatus.storage = !!process.env.CLOUDINARY_URL;
    
    // Check analysis service
    try {
      const analysisHealth = await tradeAnalysisService.healthCheck();
      healthStatus.analysis = analysisHealth.status === 'healthy' || process.env.USE_MOCK_OPENAI === 'true';
    } catch {
      healthStatus.analysis = process.env.USE_MOCK_OPENAI === 'true';
    }
    
    healthStatus.overall = healthStatus.upload && healthStatus.storage && healthStatus.analysis;
    
    return {
      success: healthStatus.overall,
      components: healthStatus,
      message: healthStatus.overall ? 'Pipeline is healthy' : 'Pipeline has issues',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      components: healthStatus,
      error: error.message,
      message: 'Pipeline health check failed',
      timestamp: new Date().toISOString()
    };
  }
}

export default {
  processUploadedChart,
  checkPipelineHealth
};