/**
 * Trade Analysis API Service - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Frontend service for trade analysis with comprehensive error handling
 */

import { ErrorResponse, ErrorType, AnalysisError, ErrorHandlerOptions } from '@/types/error';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface TradeAnalysisRequest {
  image: File;
  description?: string;
  context?: string;
}

export interface TradeAnalysisResponse {
  success: true;
  data: {
    verdict: 'Diamond' | 'Fire' | 'Skull';
    confidence: number;
    reasoning: string;
    processingTime: number;
  };
  metadata: {
    requestId: string;
    timestamp: string;
    model: string;
    tokensUsed: number;
    retryCount: number;
    totalProcessingTime: number;
  };
}

export interface AnalysisProgress {
  stage: 'uploading' | 'processing' | 'analyzing' | 'completed' | 'error';
  progress: number;
  message: string;
  retryAttempt?: number;
  timeRemaining?: number;
}

class TradeAnalysisAPIService {
  private abortControllers: Map<string, AbortController> = new Map();
  private progressCallbacks: Map<string, (progress: AnalysisProgress) => void> = new Map();

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth-token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private createAnalysisError(response: ErrorResponse): AnalysisError {
    const error = new Error(response.error) as AnalysisError;
    error.code = response.code;
    error.errorType = response.code as ErrorType;
    error.retryable = response.retryable;
    error.guidance = response.guidance;
    error.retryCount = response.retryCount || 0;
    error.requestId = response.requestId;
    return error;
  }

  private classifyHttpError(status: number): ErrorType {
    switch (status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'AUTHENTICATION_FAILED';
      case 403:
        return 'INSUFFICIENT_CREDITS';
      case 413:
        return 'FILE_TOO_LARGE';
      case 415:
        return 'INVALID_FILE_FORMAT';
      case 429:
        return 'OPENAI_RATE_LIMIT';
      case 503:
        return 'OPENAI_API_DOWN';
      case 504:
        return 'NETWORK_TIMEOUT';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  private updateProgress(requestId: string, progress: AnalysisProgress): void {
    const callback = this.progressCallbacks.get(requestId);
    if (callback) {
      callback(progress);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private validateImageFile(file: File): void {
    // File size check (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      const error = new Error('Image file is too large. Please use an image under 10MB.') as AnalysisError;
      error.errorType = 'FILE_TOO_LARGE';
      error.retryable = false;
      error.guidance = 'Try compressing your image or using a different format.';
      throw error;
    }

    // File type check
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      const error = new Error('Invalid image format. Please use PNG, JPG, or JPEG.') as AnalysisError;
      error.errorType = 'INVALID_FILE_FORMAT';
      error.retryable = false;
      error.guidance = 'Convert your image to a supported format and try again.';
      throw error;
    }

    // Check if file is actually an image
    if (!file.type.startsWith('image/')) {
      const error = new Error('Selected file is not a valid image.') as AnalysisError;
      error.errorType = 'INVALID_FILE_FORMAT';
      error.retryable = false;
      error.guidance = 'Please select an image file (PNG, JPG, or JPEG).';
      throw error;
    }
  }

  async analyzeChart(
    request: TradeAnalysisRequest,
    options: ErrorHandlerOptions = {},
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<TradeAnalysisResponse> {
    const requestId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const {
      autoRetry = true,
      maxRetries = 2,
      onError,
      onRetry,
      onMaxRetriesReached
    } = options;

    // Set up progress callback
    if (onProgress) {
      this.progressCallbacks.set(requestId, onProgress);
    }

    // Set up abort controller
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    try {
      // Validate input
      this.validateImageFile(request.image);

      // Update progress
      this.updateProgress(requestId, {
        stage: 'uploading',
        progress: 10,
        message: 'Preparing image for analysis...'
      });

      // Prepare form data
      const formData = new FormData();
      formData.append('image', request.image);
      if (request.description) {
        formData.append('description', request.description);
      }

      // Attempt analysis with retry logic
      let lastError: AnalysisError | null = null;
      let currentRetry = 0;

      while (currentRetry <= maxRetries) {
        try {
          // Update progress for retry attempts
          if (currentRetry > 0) {
            this.updateProgress(requestId, {
              stage: 'processing',
              progress: 20,
              message: `Retrying analysis (attempt ${currentRetry + 1})...`,
              retryAttempt: currentRetry
            });

            // Call retry callback
            if (onRetry) {
              onRetry(currentRetry);
            }
          } else {
            this.updateProgress(requestId, {
              stage: 'processing',
              progress: 30,
              message: 'Uploading image to analysis service...'
            });
          }

          // Make API request
          const response = await fetch(`${API_BASE_URL}/analyze-trade`, {
            method: 'POST',
            headers: {
              ...this.getAuthHeaders(),
              'Retry-Count': currentRetry.toString()
            },
            body: formData,
            signal: controller.signal
          });

          this.updateProgress(requestId, {
            stage: 'analyzing',
            progress: 70,
            message: 'AI analyzing your chart...'
          });

          // Handle response
          if (!response.ok) {
            let errorData: ErrorResponse;
            
            try {
              errorData = await response.json();
            } catch {
              // Fallback for non-JSON responses
              const errorType = this.classifyHttpError(response.status);
              throw this.createAnalysisError({
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
                code: errorType,
                retryable: response.status >= 500 || response.status === 429,
                timestamp: new Date().toISOString()
              });
            }

            const analysisError = this.createAnalysisError(errorData);
            throw analysisError;
          }

          // Success - parse response
          const result = await response.json() as TradeAnalysisResponse;

          this.updateProgress(requestId, {
            stage: 'completed',
            progress: 100,
            message: 'Analysis completed successfully!'
          });

          return result;

        } catch (error) {
          lastError = error as AnalysisError;

          // Check if error is retryable and we haven't exceeded max retries
          if (lastError.retryable && autoRetry && currentRetry < maxRetries) {
            currentRetry++;

            // Calculate retry delay (exponential backoff with jitter)
            const baseDelay = 1000;
            const backoffDelay = baseDelay * Math.pow(2, currentRetry - 1);
            const jitter = Math.random() * 1000;
            const totalDelay = Math.min(backoffDelay + jitter, 10000); // Max 10 seconds

            this.updateProgress(requestId, {
              stage: 'processing',
              progress: 20,
              message: `Retrying in ${Math.ceil(totalDelay / 1000)} seconds...`,
              retryAttempt: currentRetry,
              timeRemaining: totalDelay
            });

            // Wait before retry
            await this.delay(totalDelay);
            continue;

          } else {
            // Not retryable or max retries exceeded
            if (currentRetry >= maxRetries && onMaxRetriesReached) {
              onMaxRetriesReached(lastError);
            }

            // Call error callback
            if (onError) {
              onError(lastError);
            }

            this.updateProgress(requestId, {
              stage: 'error',
              progress: 0,
              message: lastError.message
            });

            throw lastError;
          }
        }
      }

      // This should never be reached, but just in case
      throw lastError || new Error('Analysis failed after all retry attempts');

    } finally {
      // Clean up
      this.abortControllers.delete(requestId);
      this.progressCallbacks.delete(requestId);
    }
  }

  cancelAnalysis(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
      this.progressCallbacks.delete(requestId);
    }
  }

  cancelAllAnalyses(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    this.progressCallbacks.clear();
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; service: string; timestamp: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-trade/health`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return {
        status: data.success ? 'healthy' : 'unhealthy',
        service: 'trade-analysis',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'trade-analysis',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getServiceConfig(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-trade/config`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service configuration');
      }

      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch service configuration:', error);
      return null;
    }
  }
}

// Singleton instance
export const tradeAnalysisAPI = new TradeAnalysisAPIService();

export default tradeAnalysisAPI;