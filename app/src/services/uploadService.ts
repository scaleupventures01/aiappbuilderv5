import type { 
  UploadResponse, 
  UploadProgress, 
  UploadServiceConfig,
  ImageUploadResponse,
  BackendUploadResult
} from '../types/upload';

import { validateFile } from '../utils/fileValidation';
import { envConfig, testUploadEndpoint } from '../config/environment';

/**
 * Retry configuration for upload attempts
 */
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Upload attempt result for retry logic
 */
interface UploadAttemptResult {
  success: boolean;
  shouldRetry: boolean;
  error: string;
  response?: UploadResponse;
}

/**
 * Server status information
 */
interface ServerStatus {
  available: boolean;
  responseTime?: number;
  error?: string;
  status?: number;
  lastChecked: number;
}

/**
 * Upload queue item for managing uploads
 */
interface QueuedUpload {
  id: string;
  file: File;
  options: any;
  // eslint-disable-next-line no-unused-vars
  resolve: (value: UploadResponse) => void;
  // eslint-disable-next-line no-unused-vars
  reject: (reason: Error) => void;
  retryCount: number;
  addedAt: number;
}

/**
 * Upload Service for Backend API Integration
 * Handles file uploads via backend endpoint with progress tracking and error handling
 */
export class UploadService {
  private baseUrl: string;
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2
  };
  private serverStatus: ServerStatus = {
    available: false,
    lastChecked: 0
  };
  private uploadQueue: QueuedUpload[] = [];
  private processingQueue = false;
  private statusCheckInterval: number | null = null;

  constructor(config: UploadServiceConfig) {
    this.baseUrl = config.apiBaseUrl || '/api';
    this.startStatusMonitoring();
  }

  /**
   * Get authentication headers for API requests
   */
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth-token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get current authentication status
   */
  public getAuthStatus(): AuthStatus {
    const token = localStorage.getItem('auth-token');
    
    if (!token) {
      return {
        hasToken: false,
        isExpired: false
      };
    }

    try {
      // Parse JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const isExpired = Date.now() >= expiresAt;

      return {
        hasToken: true,
        isExpired,
        expiresAt,
        userId: payload.userId || payload.sub
      };
    } catch (error) {
      // Invalid token format
      return {
        hasToken: true,
        isExpired: true
      };
    }
  }

  /**
   * Handle authentication errors and try to refresh token
   */
  private async handleAuthError(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refresh-token');
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.access_token) {
          localStorage.setItem('auth-token', result.access_token);
          if (result.refresh_token) {
            localStorage.setItem('refresh-token', result.refresh_token);
          }
          return true;
        }
      }

      // Refresh failed, clear tokens
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      return false;
    } catch (error) {
      console.error('Auth refresh failed:', error);
      return false;
    }
  }

  /**
   * Check if error is retryable (network/server errors, not client errors)
   */
  private isRetryableError(status: number, error: string): boolean {
    // Retry on server errors (5xx), timeout, and network errors
    if (status >= 500) return true;
    if (status === 0) return true; // Network error
    if (status === 408) return true; // Request timeout
    if (status === 429) return true; // Rate limited
    if (error.includes('timeout')) return true;
    if (error.includes('network')) return true;
    if (error.includes('connection')) return true;
    
    // Don't retry on client errors (4xx except 408, 429)
    return false;
  }

  /**
   * Calculate delay for retry attempt with exponential backoff
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Upload a single file via backend API with progress tracking and retry logic
   */
  async uploadFile(
    file: File,
    options: {
      conversationId?: string;
      context?: string;
      retryConfig?: Partial<RetryConfig>;
      queueIfOffline?: boolean;
      // eslint-disable-next-line no-unused-vars
      onProgress?: (progress: UploadProgress) => void;
      // eslint-disable-next-line no-unused-vars
      onRetryAttempt?: (attempt: number, maxAttempts: number, delay: number) => void;
    } = {}
  ): Promise<UploadResponse> {
    const { 
      conversationId, 
      context = 'chat', 
      retryConfig, 
      queueIfOffline = true,
      onProgress, 
      onRetryAttempt 
    } = options;

    const finalRetryConfig = { ...this.defaultRetryConfig, ...retryConfig };

    // Check server status first
    await this.checkServerStatus();
    
    // If server is not available and queueing is enabled, queue the upload
    if (!this.serverStatus.available && queueIfOffline) {
      return this.queueUpload(file, options);
    }
    
    // If server is not available and queueing is disabled, return error
    if (!this.serverStatus.available) {
      return {
        success: false,
        error: `Upload server unavailable: ${this.serverStatus.error || 'Unknown error'}`
      };
    }

    // Validate file first
    const validation = validateFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    for (let attempt = 1; attempt <= finalRetryConfig.maxAttempts; attempt++) {
      try {
        // Check and refresh authentication before each attempt
        if (attempt > 1) {
          const authOk = await this.handleAuthError();
          if (!authOk) {
            return {
              success: false,
              error: 'Authentication failed - please log in again'
            };
          }
        }
        
        const attemptResult = await this.attemptSingleFileUpload(
          file,
          { conversationId, context, onProgress }
        );

        if (attemptResult.success) {
          return attemptResult.response!;
        }

        // Check if we should retry
        if (attempt < finalRetryConfig.maxAttempts && attemptResult.shouldRetry) {
          // For auth errors, try to refresh token before retrying
          if (attemptResult.error.includes('Authentication') || attemptResult.error.includes('401')) {
            const authRefreshed = await this.handleAuthError();
            if (!authRefreshed) {
              return {
                success: false,
                error: 'Authentication failed - please log in again'
              };
            }
          }
          
          const delay = this.calculateRetryDelay(attempt, finalRetryConfig);
          
          if (onRetryAttempt) {
            onRetryAttempt(attempt, finalRetryConfig.maxAttempts, delay);
          }
          
          await this.sleep(delay);
          continue;
        }

        // No more retries or not retryable
        return {
          success: false,
          error: attemptResult.error
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // For unexpected errors, only retry if it's the last attempt
        if (attempt === finalRetryConfig.maxAttempts) {
          return {
            success: false,
            error: errorMessage
          };
        }
        
        // Retry unexpected errors
        const delay = this.calculateRetryDelay(attempt, finalRetryConfig);
        if (onRetryAttempt) {
          onRetryAttempt(attempt, finalRetryConfig.maxAttempts, delay);
        }
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: 'Upload failed after all retry attempts'
    };
  }

  /**
   * Attempt a single file upload without retry logic
   */
  private async attemptSingleFileUpload(
    file: File,
    options: {
      conversationId?: string;
      context?: string;
      // eslint-disable-next-line no-unused-vars
      onProgress?: (progress: UploadProgress) => void;
    }
  ): Promise<UploadAttemptResult> {
    const { conversationId, context = 'chat', onProgress } = options;

    // Create FormData for backend upload
    const formData = new FormData();
    formData.append('images', file);
    
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }
    
    if (context) {
      formData.append('context', context);
    }

    // Upload with XMLHttpRequest for progress tracking
    return new Promise<UploadAttemptResult>((resolve) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          onProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        try {
          if (xhr.status === 201) {
            const result: ImageUploadResponse = JSON.parse(xhr.responseText);
            
            if (result.success && result.data.uploads.length > 0) {
              const uploadData = result.data.uploads[0];
              const uploadResult: BackendUploadResult = {
                id: uploadData.id,
                public_id: uploadData.publicId,
                secure_url: uploadData.secureUrl,
                thumbnail_url: uploadData.thumbnailUrl,
                width: uploadData.width,
                height: uploadData.height,
                format: uploadData.format,
                bytes: uploadData.bytes,
                original_name: uploadData.originalName,
                created_at: uploadData.createdAt
              };

              resolve({
                success: true,
                shouldRetry: false,
                error: '',
                response: {
                  success: true,
                  data: uploadResult
                }
              });
            } else {
              const error = result.error || 'Upload failed';
              resolve({
                success: false,
                shouldRetry: this.isRetryableError(xhr.status, error),
                error
              });
            }
          } else {
            let errorMessage = 'Upload failed';
            try {
              const errorResult = JSON.parse(xhr.responseText);
              errorMessage = errorResult.error || errorMessage;
            } catch {
              errorMessage = `HTTP ${xhr.status}: ${xhr.statusText}`;
            }

            resolve({
              success: false,
              shouldRetry: this.isRetryableError(xhr.status, errorMessage),
              error: errorMessage
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          resolve({
            success: false,
            shouldRetry: this.isRetryableError(xhr.status, errorMessage),
            error: errorMessage
          });
        }
      });

      // Handle network errors
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          shouldRetry: true, // Network errors are always retryable
          error: 'Network error occurred during upload'
        });
      });

      // Handle timeout
      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          shouldRetry: true, // Timeouts are retryable
          error: 'Upload timed out'
        });
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          shouldRetry: false, // Aborts are intentional, don't retry
          error: 'Upload was cancelled'
        });
      });

      // Configure and send request to backend API
      xhr.open('POST', `${this.baseUrl}/upload/images`);
      xhr.timeout = 60000; // 60 second timeout
      
      // Set auth headers
      const authHeaders = this.getAuthHeaders();
      Object.entries(authHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple files with progress tracking via backend API
   * Note: This method uploads all files in a single request - no individual retry logic
   */
  async uploadFiles(
    files: File[],
    options: {
      conversationId?: string;
      context?: string;
      // eslint-disable-next-line no-unused-vars
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<UploadResponse> {
    const { conversationId, context = 'chat', onProgress } = options;

    try {
      // Validate files first
      const validationErrors: string[] = [];
      files.forEach((file, index) => {
        const validation = validateFile(file);
        if (!validation.isValid) {
          validationErrors.push(`File ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });

      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join('; ')
        };
      }

      // Backend supports up to 5 files per request
      if (files.length > 5) {
        return {
          success: false,
          error: 'Maximum 5 files allowed per upload request'
        };
      }

      // Create FormData for backend upload
      const formData = new FormData();
      
      // Append all files with the same field name 'images'
      files.forEach((file) => {
        formData.append('images', file);
      });
      
      if (conversationId) {
        formData.append('conversationId', conversationId);
      }
      
      if (context) {
        formData.append('context', context);
      }

      // Upload with XMLHttpRequest for progress tracking
      return new Promise<UploadResponse>((resolve) => {
        const xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            };
            onProgress(progress);
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          try {
            if (xhr.status === 201) {
              const result: ImageUploadResponse = JSON.parse(xhr.responseText);
              
              if (result.success && result.data.uploads.length > 0) {
                // For multiple files, return the full response with all uploads
                resolve({
                  success: true,
                  data: result.data
                });
              } else {
                resolve({
                  success: false,
                  error: result.error || 'Upload failed'
                });
              }
            } else {
              let errorMessage = 'Upload failed';
              try {
                const errorResult = JSON.parse(xhr.responseText);
                errorMessage = errorResult.error || errorMessage;
              } catch {
                errorMessage = `HTTP ${xhr.status}: ${xhr.statusText}`;
              }

              resolve({
                success: false,
                error: errorMessage
              });
            }
          } catch (error) {
            resolve({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            });
          }
        });

        // Handle network errors
        xhr.addEventListener('error', () => {
          resolve({
            success: false,
            error: 'Network error occurred during upload'
          });
        });

        // Handle timeout
        xhr.addEventListener('timeout', () => {
          resolve({
            success: false,
            error: 'Upload timed out'
          });
        });

        // Handle abort
        xhr.addEventListener('abort', () => {
          resolve({
            success: false,
            error: 'Upload was cancelled'
          });
        });

        // Configure and send request to backend API
        xhr.open('POST', `${this.baseUrl}/upload/images`);
        xhr.timeout = 120000; // 2 minute timeout for multiple files
        
        // Set auth headers
        const authHeaders = this.getAuthHeaders();
        Object.entries(authHeaders).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
        
        xhr.send(formData);
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a file via backend API with retry logic
   */
  async deleteFile(
    uploadId: string, 
    retryConfig?: Partial<RetryConfig>
  ): Promise<{ success: boolean; error?: string }> {
    const finalRetryConfig = { ...this.defaultRetryConfig, ...retryConfig };

    for (let attempt = 1; attempt <= finalRetryConfig.maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/upload/images/${uploadId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          }
        });

        if (response.ok) {
          const result = await response.json();
          return result;
        }

        const errorText = await response.text();
        let errorMessage = `Failed to delete file: ${response.statusText}`;
        
        try {
          const errorResult = JSON.parse(errorText);
          errorMessage = errorResult.error || errorMessage;
        } catch {
          // Use default error message
        }

        // Check if we should retry
        if (attempt < finalRetryConfig.maxAttempts && this.isRetryableError(response.status, errorMessage)) {
          const delay = this.calculateRetryDelay(attempt, finalRetryConfig);
          await this.sleep(delay);
          continue;
        }

        return {
          success: false,
          error: errorMessage
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
        
        // For network errors, retry if not the last attempt
        if (attempt < finalRetryConfig.maxAttempts) {
          const delay = this.calculateRetryDelay(attempt, finalRetryConfig);
          await this.sleep(delay);
          continue;
        }

        return {
          success: false,
          error: errorMessage
        };
      }
    }

    return {
      success: false,
      error: 'Delete operation failed after all retry attempts'
    };
  }

  /**
   * Generate optimized image URL via backend/Cloudinary
   * Since we're using backend API, we return the secure_url or thumbnail_url directly
   */
  getOptimizedImageUrl(
    secureUrl: string,
    // eslint-disable-next-line no-unused-vars
    _options: {
      thumbnail?: boolean;
    } = {}
  ): string {
    // For now, return the URL as-is since backend handles optimization
    // In the future, we could add URL transformation parameters if needed
    return secureUrl;
  }

  /**
   * Get upload details by ID from backend with retry logic
   */
  async getUploadDetails(
    uploadId: string,
    retryConfig?: Partial<RetryConfig>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const finalRetryConfig = { ...this.defaultRetryConfig, ...retryConfig };

    for (let attempt = 1; attempt <= finalRetryConfig.maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/upload/images/${uploadId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          }
        });

        if (response.ok) {
          const result = await response.json();
          return result;
        }

        const errorText = await response.text();
        let errorMessage = `Failed to get upload details: ${response.statusText}`;
        
        try {
          const errorResult = JSON.parse(errorText);
          errorMessage = errorResult.error || errorMessage;
        } catch {
          // Use default error message
        }

        // Check if we should retry
        if (attempt < finalRetryConfig.maxAttempts && this.isRetryableError(response.status, errorMessage)) {
          const delay = this.calculateRetryDelay(attempt, finalRetryConfig);
          await this.sleep(delay);
          continue;
        }

        return {
          success: false,
          error: errorMessage
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get upload details';
        
        // For network errors, retry if not the last attempt
        if (attempt < finalRetryConfig.maxAttempts) {
          const delay = this.calculateRetryDelay(attempt, finalRetryConfig);
          await this.sleep(delay);
          continue;
        }

        return {
          success: false,
          error: errorMessage
        };
      }
    }

    return {
      success: false,
      error: 'Get upload details failed after all retry attempts'
    };
  }

  /**
   * Start monitoring server status
   */
  private startStatusMonitoring(): void {
    // Check status immediately
    this.checkServerStatus();
    
    // Set up periodic status checks (every 30 seconds)
    this.statusCheckInterval = window.setInterval(() => {
      this.checkServerStatus();
    }, 30000);
  }

  /**
   * Stop monitoring server status
   */
  private stopStatusMonitoring(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  /**
   * Check if upload server is available
   */
  public async checkServerStatus(): Promise<ServerStatus> {
    const now = Date.now();
    
    // Use cached result if checked recently (within 5 seconds)
    if (now - this.serverStatus.lastChecked < 5000) {
      return this.serverStatus;
    }

    try {
      const result = await testUploadEndpoint();
      
      this.serverStatus = {
        available: result.success,
        responseTime: result.responseTime,
        error: result.error,
        status: result.status,
        lastChecked: now
      };

      // If server becomes available, process any queued uploads
      if (this.serverStatus.available && this.uploadQueue.length > 0) {
        this.processUploadQueue();
      }

    } catch (error) {
      this.serverStatus = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: now
      };
    }

    return this.serverStatus;
  }

  /**
   * Get current server status
   */
  public getServerStatus(): ServerStatus {
    return { ...this.serverStatus };
  }

  /**
   * Check if server is available
   */
  public isServerAvailable(): boolean {
    return this.serverStatus.available;
  }

  /**
   * Add upload to queue for when server becomes available
   */
  private queueUpload(
    file: File,
    options: any
  ): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const queuedUpload: QueuedUpload = {
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        options,
        resolve,
        reject,
        retryCount: 0,
        addedAt: Date.now()
      };

      this.uploadQueue.push(queuedUpload);
      
      // Limit queue size to prevent memory issues
      if (this.uploadQueue.length > 50) {
        const oldUpload = this.uploadQueue.shift();
        if (oldUpload) {
          oldUpload.reject(new Error('Upload queue full - request discarded'));
        }
      }
    });
  }

  /**
   * Process queued uploads when server becomes available
   */
  private async processUploadQueue(): Promise<void> {
    if (this.processingQueue || this.uploadQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      // Process uploads one at a time to avoid overwhelming the server
      while (this.uploadQueue.length > 0 && this.serverStatus.available) {
        const queuedUpload = this.uploadQueue.shift();
        if (!queuedUpload) break;

        try {
          const result = await this.uploadFile(queuedUpload.file, queuedUpload.options);
          queuedUpload.resolve(result);
        } catch (error) {
          queuedUpload.reject(error instanceof Error ? error : new Error(String(error)));
        }

        // Small delay between uploads to be nice to the server
        await this.sleep(100);
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Get upload queue status
   */
  public getQueueStatus(): {
    length: number;
    processing: boolean;
    oldestUpload?: number;
  } {
    const status = {
      length: this.uploadQueue.length,
      processing: this.processingQueue,
      oldestUpload: undefined as number | undefined
    };

    if (this.uploadQueue.length > 0) {
      status.oldestUpload = Date.now() - this.uploadQueue[0].addedAt;
    }

    return status;
  }

  /**
   * Clear upload queue
   */
  public clearQueue(reason = 'Queue cleared'): void {
    this.uploadQueue.forEach(upload => {
      upload.reject(new Error(reason));
    });
    this.uploadQueue = [];
  }

  /**
   * Validate upload configuration
   */
  isConfigured(): boolean {
    return !!(this.baseUrl);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopStatusMonitoring();
    this.clearQueue('Service destroyed');
  }
}

/**
 * Default upload service instance
 * Uses backend API configuration
 */
let uploadServiceInstance: UploadService | null = null;

export const getUploadService = (): UploadService => {
  if (!uploadServiceInstance) {
    const config: UploadServiceConfig = {
      apiBaseUrl: envConfig.getApiUrl()
    };

    uploadServiceInstance = new UploadService(config);
  }

  return uploadServiceInstance;
};

/**
 * Destroy the upload service instance (useful for cleanup)
 */
export const destroyUploadService = (): void => {
  if (uploadServiceInstance) {
    uploadServiceInstance.destroy();
    uploadServiceInstance = null;
  }
};

/**
 * Utility function for quick single file upload via backend with retry
 */
export const uploadSingleFile = async (
  file: File,
  options: {
    conversationId?: string;
    context?: string;
    retryConfig?: Partial<RetryConfig>;
    // eslint-disable-next-line no-unused-vars
    onProgress?: (progress: UploadProgress) => void;
    // eslint-disable-next-line no-unused-vars
    onRetryAttempt?: (attempt: number, maxAttempts: number, delay: number) => void;
  } = {}
): Promise<UploadResponse> => {
  const service = getUploadService();
  return service.uploadFile(file, options);
};

/**
 * Utility function for quick multiple file upload via backend
 */
export const uploadMultipleFiles = async (
  files: File[],
  options: {
    conversationId?: string;
    context?: string;
    // eslint-disable-next-line no-unused-vars
    onProgress?: (progress: UploadProgress) => void;
  } = {}
): Promise<UploadResponse> => {
  const service = getUploadService();
  return service.uploadFiles(files, options);
};

/**
 * Export utility functions for upload service status
 */
export const getUploadServiceStatus = () => {
  const service = getUploadService();
  return {
    serverStatus: service.getServerStatus(),
    queueStatus: service.getQueueStatus(),
    authStatus: service.getAuthStatus(),
    configured: service.isConfigured()
  };
};

export const checkUploadServer = async () => {
  const service = getUploadService();
  return await service.checkServerStatus();
};

export const getAuthStatus = () => {
  const service = getUploadService();
  return service.getAuthStatus();
};

/**
 * Export types for external use
 */
/**
 * Authentication status information  
 */
interface AuthStatus {
  hasToken: boolean;
  isExpired: boolean;
  expiresAt?: number;
  userId?: string;
}

export type { RetryConfig, ServerStatus, QueuedUpload, AuthStatus };