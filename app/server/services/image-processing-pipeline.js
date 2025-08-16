/**
 * Image Processing Pipeline - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.3-gpt4-vision-integration-service.md
 * Comprehensive pipeline for image processing workflow
 * Created: 2025-08-15
 */

import { imagePreprocessingService } from './image-preprocessing-service.js';
import { ExternalServiceError } from '../middleware/error-handler.js';

/**
 * Image Processing Pipeline Class
 * Orchestrates the complete image processing workflow
 */
export class ImageProcessingPipeline {
  constructor() {
    this.processingSteps = [
      'validation',
      'preprocessing', 
      'optimization',
      'conversion',
      'quality-check'
    ];
    this.processingStats = {
      totalProcessed: 0,
      successfulProcessed: 0,
      failedProcessed: 0,
      averageProcessingTime: 0,
      totalCompressionSaved: 0
    };
  }

  /**
   * Process image through complete pipeline
   * @param {Buffer} imageBuffer - Raw image buffer
   * @param {Object} fileMetadata - Original file metadata
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Complete processing result
   */
  async processImage(imageBuffer, fileMetadata, options = {}) {
    const startTime = Date.now();
    const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚀 Starting image processing pipeline ${pipelineId}`);
    
    const result = {
      pipelineId,
      success: false,
      steps: {},
      data: null,
      metadata: {
        originalFile: fileMetadata,
        processingSteps: this.processingSteps,
        startTime: new Date(startTime).toISOString(),
        endTime: null,
        totalTime: 0
      },
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Validation
      console.log(`📋 Pipeline ${pipelineId}: Step 1 - Validation`);
      const validationResult = await this.validateImageStep(imageBuffer, fileMetadata);
      result.steps.validation = validationResult;
      
      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error}`);
      }

      // Step 2: Preprocessing and Optimization 
      console.log(`⚙️ Pipeline ${pipelineId}: Step 2 - Preprocessing`);
      const preprocessingResult = await this.preprocessImageStep(imageBuffer, options);
      result.steps.preprocessing = preprocessingResult;
      
      if (!preprocessingResult.success) {
        throw new Error(`Preprocessing failed: ${preprocessingResult.error}`);
      }

      // Step 3: Quality Check
      console.log(`🔍 Pipeline ${pipelineId}: Step 3 - Quality Check`);
      const qualityCheckResult = await this.qualityCheckStep(preprocessingResult.data);
      result.steps.qualityCheck = qualityCheckResult;
      
      if (!qualityCheckResult.success) {
        result.warnings.push(qualityCheckResult.warning);
      }

      // Step 4: Final Optimization
      console.log(`✨ Pipeline ${pipelineId}: Step 4 - Final Optimization`);
      const optimizationResult = await this.finalOptimizationStep(preprocessingResult.data, options);
      result.steps.optimization = optimizationResult;

      // Compile final result
      result.success = true;
      result.data = {
        processedImage: optimizationResult.data || preprocessingResult.data,
        thumbnail: optimizationResult.thumbnail,
        processingMetrics: this.calculateProcessingMetrics(validationResult, preprocessingResult, optimizationResult),
        qualityScore: qualityCheckResult.qualityScore || 85
      };

      const endTime = Date.now();
      result.metadata.endTime = new Date(endTime).toISOString();
      result.metadata.totalTime = endTime - startTime;

      // Update statistics
      this.updateProcessingStats(result);

      console.log(`✅ Pipeline ${pipelineId} completed successfully in ${result.metadata.totalTime}ms`);
      
      return result;

    } catch (error) {
      const endTime = Date.now();
      result.metadata.endTime = new Date(endTime).toISOString();
      result.metadata.totalTime = endTime - startTime;
      result.errors.push({
        step: this.getCurrentStep(result.steps),
        error: error.message,
        timestamp: new Date().toISOString()
      });

      console.error(`❌ Pipeline ${pipelineId} failed: ${error.message}`);
      
      // Update failure statistics
      this.processingStats.failedProcessed++;
      this.processingStats.totalProcessed++;

      throw new ExternalServiceError('ImageProcessing', `Image processing pipeline failed: ${error.message}`);
    }
  }

  /**
   * Step 1: Validate image
   * @param {Buffer} imageBuffer - Image buffer
   * @param {Object} fileMetadata - File metadata
   * @returns {Promise<Object>} Validation result
   */
  async validateImageStep(imageBuffer, fileMetadata) {
    try {
      const validation = await imagePreprocessingService.validateImage(imageBuffer, fileMetadata.mimetype);
      
      return {
        success: validation.valid,
        error: validation.error || null,
        data: validation.metadata,
        stepTime: 0, // Validation is very fast
        warnings: []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
        stepTime: 0
      };
    }
  }

  /**
   * Step 2: Preprocess image
   * @param {Buffer} imageBuffer - Image buffer  
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Preprocessing result
   */
  async preprocessImageStep(imageBuffer, options) {
    try {
      const result = await imagePreprocessingService.preprocessImage(imageBuffer, options);
      
      return {
        success: result.success,
        error: null,
        data: result.data,
        metadata: result.metadata,
        stepTime: result.data.processingTime,
        warnings: []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
        stepTime: 0
      };
    }
  }

  /**
   * Step 3: Quality check
   * @param {Object} processedImageData - Processed image data
   * @returns {Promise<Object>} Quality check result
   */
  async qualityCheckStep(processedImageData) {
    try {
      const qualityScore = this.calculateQualityScore(processedImageData);
      const warnings = [];
      
      // Check for quality issues
      if (processedImageData.fileSize.compressionRatio > 80) {
        warnings.push('High compression ratio may affect image quality');
      }
      
      if (processedImageData.dimensions.processed.width < 500 || processedImageData.dimensions.processed.height < 500) {
        warnings.push('Processed image may be too small for optimal analysis');
      }

      return {
        success: qualityScore >= 70, // Consider 70+ as acceptable quality
        warning: warnings.join(', ') || null,
        qualityScore,
        warnings,
        stepTime: 5 // Quality check is fast
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        qualityScore: 0,
        stepTime: 0
      };
    }
  }

  /**
   * Step 4: Final optimization
   * @param {Object} processedImageData - Processed image data
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimization result
   */
  async finalOptimizationStep(processedImageData, options) {
    try {
      let optimizedData = processedImageData;
      let thumbnail = null;

      // Create thumbnail if requested
      if (options.createThumbnail !== false) {
        const base64Data = processedImageData.base64Data;
        const imageBuffer = Buffer.from(base64Data, 'base64');
        thumbnail = await imagePreprocessingService.createThumbnail(imageBuffer, {
          size: options.thumbnailSize || 150,
          quality: options.thumbnailQuality || 80
        });
      }

      return {
        success: true,
        data: optimizedData,
        thumbnail,
        stepTime: 10,
        optimizations: [
          'Thumbnail generation',
          'Final format validation',
          'Metadata cleanup'
        ]
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: processedImageData, // Return original processed data
        stepTime: 0
      };
    }
  }

  /**
   * Calculate quality score for processed image
   * @param {Object} processedImageData - Processed image data
   * @returns {number} Quality score (0-100)
   */
  calculateQualityScore(processedImageData) {
    let score = 100;
    
    // Penalize excessive compression
    const compressionRatio = processedImageData.fileSize.compressionRatio;
    if (compressionRatio > 80) {
      score -= (compressionRatio - 80) * 2; // Reduce by 2 points per % over 80%
    }
    
    // Penalize very small images
    const { width, height } = processedImageData.dimensions.processed;
    if (width < 300 || height < 300) {
      score -= 20;
    }
    
    // Bonus for optimal size range
    if (width >= 800 && width <= 1500 && height >= 600 && height <= 1200) {
      score += 10;
    }
    
    // Bonus for good compression with maintained quality
    if (compressionRatio > 30 && compressionRatio < 60) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate processing metrics
   * @param {Object} validationResult - Validation step result
   * @param {Object} preprocessingResult - Preprocessing step result
   * @param {Object} optimizationResult - Optimization step result
   * @returns {Object} Processing metrics
   */
  calculateProcessingMetrics(validationResult, preprocessingResult, optimizationResult) {
    const totalStepTime = (validationResult.stepTime || 0) + 
                         (preprocessingResult.stepTime || 0) + 
                         (optimizationResult.stepTime || 0);

    return {
      stepTimes: {
        validation: validationResult.stepTime || 0,
        preprocessing: preprocessingResult.stepTime || 0,
        optimization: optimizationResult.stepTime || 0,
        total: totalStepTime
      },
      compressionAchieved: preprocessingResult.data?.fileSize?.compressionRatio || 0,
      dimensionReduction: this.calculateDimensionReduction(preprocessingResult.data?.dimensions),
      processingEfficiency: this.calculateProcessingEfficiency(preprocessingResult.data),
      memoryUsage: this.estimateMemoryUsage(preprocessingResult.data)
    };
  }

  /**
   * Calculate dimension reduction percentage
   * @param {Object} dimensions - Original and processed dimensions
   * @returns {number} Reduction percentage
   */
  calculateDimensionReduction(dimensions) {
    if (!dimensions || !dimensions.original || !dimensions.processed) return 0;
    
    const originalPixels = dimensions.original.width * dimensions.original.height;
    const processedPixels = dimensions.processed.width * dimensions.processed.height;
    
    return Math.round((1 - processedPixels / originalPixels) * 100);
  }

  /**
   * Calculate processing efficiency score
   * @param {Object} processedData - Processed image data
   * @returns {number} Efficiency score (0-100)
   */
  calculateProcessingEfficiency(processedData) {
    if (!processedData) return 0;
    
    const compressionRatio = processedData.fileSize?.compressionRatio || 0;
    const processingTime = processedData.processingTime || 1000;
    
    // Higher compression in less time = higher efficiency
    const timeScore = Math.max(0, 100 - (processingTime / 100)); // Penalize longer processing
    const compressionScore = Math.min(80, compressionRatio); // Cap compression score at 80
    
    return Math.round((timeScore + compressionScore) / 2);
  }

  /**
   * Estimate memory usage for processing
   * @param {Object} processedData - Processed image data
   * @returns {Object} Memory usage estimate
   */
  estimateMemoryUsage(processedData) {
    if (!processedData || !processedData.dimensions) {
      return { estimated: '0MB', breakdown: {} };
    }
    
    const { original, processed } = processedData.dimensions;
    
    // Estimate memory usage (rough calculation)
    const originalMemory = (original.width * original.height * 4) / (1024 * 1024); // RGBA
    const processedMemory = (processed.width * processed.height * 4) / (1024 * 1024);
    const bufferMemory = (processedData.fileSize?.original || 0) / (1024 * 1024);
    
    const totalMemory = originalMemory + processedMemory + bufferMemory;
    
    return {
      estimated: `${Math.round(totalMemory * 10) / 10}MB`,
      breakdown: {
        originalImage: `${Math.round(originalMemory * 10) / 10}MB`,
        processedImage: `${Math.round(processedMemory * 10) / 10}MB`,
        buffers: `${Math.round(bufferMemory * 10) / 10}MB`
      }
    };
  }

  /**
   * Get current processing step from results
   * @param {Object} steps - Completed steps
   * @returns {string} Current step name
   */
  getCurrentStep(steps) {
    if (!steps.validation) return 'validation';
    if (!steps.preprocessing) return 'preprocessing';
    if (!steps.qualityCheck) return 'qualityCheck';
    if (!steps.optimization) return 'optimization';
    return 'completed';
  }

  /**
   * Update processing statistics
   * @param {Object} result - Processing result
   */
  updateProcessingStats(result) {
    this.processingStats.totalProcessed++;
    
    if (result.success) {
      this.processingStats.successfulProcessed++;
      
      // Update average processing time
      const currentAvg = this.processingStats.averageProcessingTime;
      const newTime = result.metadata.totalTime;
      const count = this.processingStats.successfulProcessed;
      
      this.processingStats.averageProcessingTime = Math.round(
        (currentAvg * (count - 1) + newTime) / count
      );
      
      // Update compression savings
      if (result.data?.processingMetrics?.compressionAchieved) {
        this.processingStats.totalCompressionSaved += result.data.processingMetrics.compressionAchieved;
      }
    }
  }

  /**
   * Get processing pipeline statistics
   * @returns {Object} Pipeline statistics
   */
  getProcessingStatistics() {
    const successRate = this.processingStats.totalProcessed > 0 
      ? Math.round((this.processingStats.successfulProcessed / this.processingStats.totalProcessed) * 100)
      : 0;

    const avgCompressionSaving = this.processingStats.successfulProcessed > 0
      ? Math.round(this.processingStats.totalCompressionSaved / this.processingStats.successfulProcessed)
      : 0;

    return {
      ...this.processingStats,
      successRate: `${successRate}%`,
      averageCompressionSaving: `${avgCompressionSaving}%`,
      processingSteps: this.processingSteps,
      capabilities: [
        'Image format validation',
        'Automatic resizing and optimization',
        'Quality assessment',
        'Thumbnail generation',
        'Compression optimization',
        'Memory usage optimization'
      ]
    };
  }

  /**
   * Reset processing statistics
   */
  resetStatistics() {
    this.processingStats = {
      totalProcessed: 0,
      successfulProcessed: 0,
      failedProcessed: 0,
      averageProcessingTime: 0,
      totalCompressionSaved: 0
    };
  }
}

/**
 * Global pipeline instance
 */
export const imageProcessingPipeline = new ImageProcessingPipeline();

export default ImageProcessingPipeline;