/**
 * Image Preprocessing Service - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.3-gpt4-vision-integration-service.md
 * Sharp-based image preprocessing with optimization and format conversion
 * Created: 2025-08-15
 */

import sharp from 'sharp';
import { promisify } from 'util';

/**
 * Image Preprocessing Service Class
 * Handles image optimization, resizing, and format conversion for GPT-4 Vision API
 */
export class ImagePreprocessingService {
  constructor() {
    this.maxWidth = 2048; // Max width for GPT-4 Vision
    this.maxHeight = 2048; // Max height for GPT-4 Vision  
    this.quality = 85; // JPEG quality for optimization
    this.maxFileSize = 10 * 1024 * 1024; // 10MB max file size
    this.supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    this.outputFormat = 'jpeg'; // Always convert to JPEG for consistency
  }

  /**
   * Preprocess image for GPT-4 Vision API
   * @param {Buffer} imageBuffer - Raw image buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed image data
   */
  async preprocessImage(imageBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!Buffer.isBuffer(imageBuffer)) {
        throw new Error('Invalid image buffer provided');
      }

      if (imageBuffer.length === 0) {
        throw new Error('Empty image buffer provided');
      }

      if (imageBuffer.length > this.maxFileSize) {
        throw new Error(`Image too large: ${Math.round(imageBuffer.length / 1024 / 1024)}MB (max: ${this.maxFileSize / 1024 / 1024}MB)`);
      }

      // Create Sharp instance and get metadata
      const sharpInstance = sharp(imageBuffer);
      const metadata = await sharpInstance.metadata();
      
      // Validate image format
      if (!metadata.format || !['png', 'jpeg', 'jpg', 'webp'].includes(metadata.format.toLowerCase())) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }

      // Log original image info
      console.log(`📸 Processing ${metadata.format} image: ${metadata.width}x${metadata.height} (${Math.round(imageBuffer.length / 1024)}KB)`);

      // Calculate optimal dimensions
      const dimensions = this.calculateOptimalDimensions(metadata.width, metadata.height, options);
      
      // Process image with Sharp
      let processedBuffer;
      const pipeline = sharpInstance
        .resize({
          width: dimensions.width,
          height: dimensions.height,
          fit: 'inside', // Maintain aspect ratio
          withoutEnlargement: true // Don't upscale small images
        })
        .jpeg({
          quality: options.quality || this.quality,
          progressive: true,
          mozjpeg: true // Use mozjpeg encoder for better compression
        });

      processedBuffer = await pipeline.toBuffer();

      // Get final metadata
      const finalMetadata = await sharp(processedBuffer).metadata();
      
      const processingTime = Date.now() - startTime;
      
      // Convert to base64 for API
      const base64Data = processedBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Data}`;

      console.log(`✅ Image processed: ${finalMetadata.width}x${finalMetadata.height} (${Math.round(processedBuffer.length / 1024)}KB) in ${processingTime}ms`);

      return {
        success: true,
        data: {
          dataUrl,
          base64Data,
          format: 'jpeg',
          originalFormat: metadata.format,
          dimensions: {
            original: { width: metadata.width, height: metadata.height },
            processed: { width: finalMetadata.width, height: finalMetadata.height }
          },
          fileSize: {
            original: imageBuffer.length,
            processed: processedBuffer.length,
            compressionRatio: Math.round((1 - processedBuffer.length / imageBuffer.length) * 100)
          },
          processingTime,
          optimized: processedBuffer.length < imageBuffer.length
        },
        metadata: {
          originalMetadata: metadata,
          processedMetadata: finalMetadata,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error('❌ Image preprocessing failed:', error.message);
      
      // Transform Sharp errors into more user-friendly messages
      let friendlyMessage = error.message;
      
      if (error.message.includes('Input buffer contains unsupported image format')) {
        friendlyMessage = 'Unsupported image format. Please use PNG, JPG, JPEG, or WebP.';
      } else if (error.message.includes('Input image exceeds pixel limit')) {
        friendlyMessage = 'Image too large. Please use an image smaller than 2048x2048 pixels.';
      } else if (error.message.includes('premultiplied alpha')) {
        friendlyMessage = 'Image format issue. Please try saving as a standard PNG or JPEG.';
      }

      throw new Error(`Image processing failed: ${friendlyMessage}`);
    }
  }

  /**
   * Calculate optimal dimensions for GPT-4 Vision API
   * @param {number} originalWidth - Original image width
   * @param {number} originalHeight - Original image height
   * @param {Object} options - Processing options
   * @returns {Object} Optimal dimensions
   */
  calculateOptimalDimensions(originalWidth, originalHeight, options = {}) {
    const maxWidth = options.maxWidth || this.maxWidth;
    const maxHeight = options.maxHeight || this.maxHeight;
    
    // If image is already within limits, keep original size
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }
    
    // Calculate scaling factor to maintain aspect ratio
    const widthScale = maxWidth / originalWidth;
    const heightScale = maxHeight / originalHeight;
    const scale = Math.min(widthScale, heightScale);
    
    const newWidth = Math.round(originalWidth * scale);
    const newHeight = Math.round(originalHeight * scale);
    
    return { width: newWidth, height: newHeight };
  }

  /**
   * Validate image format and size
   * @param {Buffer} imageBuffer - Image buffer to validate
   * @param {string} mimetype - File mimetype
   * @returns {Promise<Object>} Validation result
   */
  async validateImage(imageBuffer, mimetype) {
    try {
      // Check mimetype
      if (!this.supportedFormats.includes(mimetype)) {
        return {
          valid: false,
          error: `Unsupported format: ${mimetype}. Supported formats: ${this.supportedFormats.join(', ')}`
        };
      }

      // Check file size
      if (imageBuffer.length > this.maxFileSize) {
        return {
          valid: false,
          error: `File too large: ${Math.round(imageBuffer.length / 1024 / 1024)}MB (max: ${this.maxFileSize / 1024 / 1024}MB)`
        };
      }

      // Try to get image metadata (this will fail if image is corrupted)
      const metadata = await sharp(imageBuffer).metadata();
      
      // Check image dimensions
      if (!metadata.width || !metadata.height) {
        return {
          valid: false,
          error: 'Invalid image: unable to determine dimensions'
        };
      }

      // Check for reasonable dimensions (not too small)
      if (metadata.width < 50 || metadata.height < 50) {
        return {
          valid: false,
          error: 'Image too small: minimum size is 50x50 pixels'
        };
      }

      // Check for extremely large dimensions
      if (metadata.width > 10000 || metadata.height > 10000) {
        return {
          valid: false,
          error: 'Image too large: maximum size is 10000x10000 pixels'
        };
      }

      return {
        valid: true,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          channels: metadata.channels,
          hasAlpha: metadata.hasAlpha
        }
      };

    } catch (error) {
      return {
        valid: false,
        error: `Invalid or corrupted image: ${error.message}`
      };
    }
  }

  /**
   * Get image processing statistics
   * @returns {Object} Service statistics
   */
  getProcessingStats() {
    return {
      supportedFormats: this.supportedFormats,
      maxDimensions: { width: this.maxWidth, height: this.maxHeight },
      maxFileSize: this.maxFileSize,
      outputFormat: this.outputFormat,
      defaultQuality: this.quality,
      optimizations: [
        'Automatic resizing to optimal dimensions',
        'JPEG conversion with mozjpeg encoder',
        'Progressive JPEG encoding',
        'Lossless compression when possible',
        'Metadata stripping for privacy'
      ]
    };
  }

  /**
   * Create thumbnail version of image
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {Object} options - Thumbnail options
   * @returns {Promise<Object>} Thumbnail data
   */
  async createThumbnail(imageBuffer, options = {}) {
    try {
      const thumbnailSize = options.size || 200;
      const quality = options.quality || 80;

      const thumbnail = await sharp(imageBuffer)
        .resize(thumbnailSize, thumbnailSize, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toBuffer();

      const base64Thumbnail = thumbnail.toString('base64');
      const thumbnailDataUrl = `data:image/jpeg;base64,${base64Thumbnail}`;

      return {
        dataUrl: thumbnailDataUrl,
        size: thumbnail.length,
        dimensions: thumbnailSize
      };

    } catch (error) {
      console.error('Failed to create thumbnail:', error.message);
      return null;
    }
  }

  /**
   * Extract image metadata without processing
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Object>} Image metadata
   */
  async getImageMetadata(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        isAnimated: metadata.pages && metadata.pages > 1,
        colorSpace: metadata.space,
        fileSize: imageBuffer.length
      };
    } catch (error) {
      throw new Error(`Failed to extract metadata: ${error.message}`);
    }
  }
}

/**
 * Global service instance
 */
export const imagePreprocessingService = new ImagePreprocessingService();

export default ImagePreprocessingService;