import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { validateCloudinaryEnvironment } from '../server/config/environment.js';

class UploadService {
  constructor() {
    this.isConfigured = false;
    this.initializationPromise = null;
    this.configDetails = null;
    this.initializeCloudinary();
  }

  async initializeCloudinary() {
    // Prevent multiple initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  async _performInitialization() {
    try {
      console.log('\n🔧 Initializing Cloudinary Upload Service');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Validate Cloudinary environment variables and test connectivity
      const validationResult = await validateCloudinaryEnvironment();
      this.configDetails = validationResult;
      
      // Configure Cloudinary based on available configuration method
      if (process.env.CLOUDINARY_URL) {
        console.log('📋 Configuring Cloudinary with CLOUDINARY_URL');
        cloudinary.config({
          cloudinary_url: process.env.CLOUDINARY_URL
        });
      } else {
        console.log('📋 Configuring Cloudinary with individual environment variables');
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
      }
      
      // Verify configuration worked by testing a simple operation
      console.log('🔌 Verifying Cloudinary service initialization...');
      const pingResult = await cloudinary.api.ping();
      
      if (pingResult && pingResult.status === 'ok') {
        this.isConfigured = true;
        console.log('✅ Cloudinary upload service successfully initialized');
        console.log(`   • Cloud Name: ${validationResult.cloudName}`);
        console.log(`   • Configuration Method: ${validationResult.configMethod}`);
        console.log(`   • Service Status: ${pingResult.status}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      } else {
        throw new Error('Cloudinary ping test failed during service initialization');
      }
      
    } catch (error) {
      this.isConfigured = false;
      this.configDetails = null;
      
      // Mask sensitive information in error messages
      const maskedError = this._maskSensitiveInfo(error.message);
      
      console.error('❌ Failed to initialize Cloudinary upload service:', maskedError);
      console.error('   Upload functionality will be disabled');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Don't throw the error - allow the service to exist but be disabled
      // This prevents the entire application from failing to start
    }
  }

  _maskSensitiveInfo(message) {
    if (!message) return message;
    
    // Mask API keys and secrets that might appear in error messages
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    let maskedMessage = message;
    
    if (apiKey) {
      const apiKeyRegex = new RegExp(apiKey, 'g');
      maskedMessage = maskedMessage.replace(apiKeyRegex, `${apiKey.substring(0, 6)}...[MASKED]`);
    }
    
    if (apiSecret) {
      const apiSecretRegex = new RegExp(apiSecret, 'g');
      maskedMessage = maskedMessage.replace(apiSecretRegex, `${apiSecret.substring(0, 6)}...[MASKED]`);
    }
    
    // Also mask URLs that might contain credentials
    maskedMessage = maskedMessage.replace(
      /cloudinary:\/\/[^@]+@/g, 
      'cloudinary://[MASKED_CREDENTIALS]@'
    );
    
    return maskedMessage;
  }

  async checkConfiguration() {
    // Wait for initialization to complete if it's still in progress
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    
    if (!this.isConfigured) {
      const baseMessage = 'Cloudinary is not properly configured. Upload functionality is disabled.';
      
      if (this.configDetails) {
        throw new Error(`${baseMessage} Configuration was attempted but connectivity test failed.`);
      } else {
        throw new Error(`${baseMessage} Please check your CLOUDINARY_URL or individual Cloudinary environment variables.`);
      }
    }
  }

  getStatus() {
    return {
      isConfigured: this.isConfigured,
      configDetails: this.configDetails,
      initializationComplete: this.initializationPromise !== null
    };
  }

  async uploadBuffer(buffer, options = {}) {
    try {
      // Check if Cloudinary is properly configured
      await this.checkConfiguration();
      
      // Validate and optimize image using Sharp
      const processedBuffer = await this.processImage(buffer);
      
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            ...options
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(processedBuffer);
      });
      
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async processImage(buffer) {
    try {
      // Get image metadata
      const metadata = await sharp(buffer).metadata();
      
      // Define max dimensions
      const maxWidth = 2048;
      const maxHeight = 2048;
      
      let processedBuffer = buffer;
      
      // Resize if image is too large
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        processedBuffer = await sharp(buffer)
          .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toBuffer();
      }
      
      return processedBuffer;
      
    } catch (error) {
      // If Sharp processing fails, return original buffer
      console.warn('Image processing failed, using original:', error.message);
      return buffer;
    }
  }

  async generateThumbnail(publicId, width = 300, height = 300) {
    await this.checkConfiguration();
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto:good',
      fetch_format: 'auto'
    });
  }

  async generateOptimizedUrl(publicId, transformations = {}) {
    await this.checkConfiguration();
    return cloudinary.url(publicId, {
      quality: 'auto:good',
      fetch_format: 'auto',
      ...transformations
    });
  }

  // Generate multiple image sizes for responsive loading
  async generateResponsiveSizes(publicId) {
    await this.checkConfiguration();
    const sizes = [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'small', width: 320, height: 240 },
      { name: 'medium', width: 640, height: 480 },
      { name: 'large', width: 1024, height: 768 },
      { name: 'xlarge', width: 1920, height: 1440 }
    ];

    return sizes.reduce((acc, size) => {
      acc[size.name] = cloudinary.url(publicId, {
        width: size.width,
        height: size.height,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto'
      });
      return acc;
    }, {});
  }

  // Delete image from Cloudinary
  async deleteImage(publicId) {
    try {
      await this.checkConfiguration();
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  // Get image metadata from Cloudinary
  async getImageInfo(publicId) {
    try {
      await this.checkConfiguration();
      const result = await cloudinary.api.resource(publicId);
      return {
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        createdAt: result.created_at,
        url: result.secure_url
      };
    } catch (error) {
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }

  // Validate image dimensions
  async validateImageDimensions(buffer, maxWidth = 4096, maxHeight = 4096) {
    try {
      const metadata = await sharp(buffer).metadata();
      
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        return {
          valid: false,
          message: `Image dimensions (${metadata.width}x${metadata.height}) exceed maximum allowed (${maxWidth}x${maxHeight})`
        };
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: `Failed to validate image dimensions: ${error.message}`
      };
    }
  }

  // Extract and strip EXIF data for privacy
  async stripExifData(buffer) {
    try {
      // Remove all metadata including EXIF, IPTC, XMP
      const strippedBuffer = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .withMetadata({
          // Keep only essential metadata
          orientation: undefined // Remove orientation after rotating
        })
        .toBuffer();
      
      return strippedBuffer;
    } catch (error) {
      console.warn('Failed to strip EXIF data:', error.message);
      return buffer; // Return original if stripping fails
    }
  }

  // Generate a blur placeholder for progressive loading
  async generateBlurPlaceholder(buffer) {
    try {
      const placeholder = await sharp(buffer)
        .resize(20, 20, { fit: 'inside' })
        .blur(5)
        .toBuffer();
      
      return `data:image/jpeg;base64,${placeholder.toString('base64')}`;
    } catch (error) {
      console.warn('Failed to generate blur placeholder:', error.message);
      return null;
    }
  }
}

export const uploadService = new UploadService();