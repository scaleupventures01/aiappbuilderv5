/**
 * Error handling types for trade analysis - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Frontend error types matching backend error classification
 */

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  retryable: boolean;
  guidance?: string;
  requestId?: string;
  retryCount?: number;
  maxRetries?: number;
  processingTime?: number;
  timestamp: string;
  retryDelay?: number;
  canRetry?: boolean;
  debug?: {
    originalMessage: string;
    code: string;
    stack: string[];
  };
}

export interface RetryConfig {
  enabled: boolean;
  maxRetries: number;
  delay: number;
  exponentialBackoff: boolean;
  autoRetry: boolean;
}

export interface ErrorUIState {
  isVisible: boolean;
  message: string;
  guidance?: string;
  retryable: boolean;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  errorType: string;
  requestId?: string;
  autoRetryEnabled: boolean;
  nextRetryIn?: number;
}

export interface ToastNotification {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
  retryable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export type ErrorType = 
  | 'OPENAI_RATE_LIMIT'
  | 'OPENAI_API_DOWN'
  | 'OPENAI_QUOTA_EXCEEDED'
  | 'NETWORK_TIMEOUT'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_FORMAT'
  | 'UPLOAD_FAILED'
  | 'IMAGE_CORRUPTED'
  | 'IMAGE_PROCESSING_FAILED'
  | 'AI_PROCESSING_FAILED'
  | 'VISION_API_ERROR'
  | 'AUTHENTICATION_FAILED'
  | 'INSUFFICIENT_CREDITS'
  | 'DATABASE_CONNECTION_FAILED'
  | 'DATA_SAVE_FAILED'
  | 'UNKNOWN_ERROR'
  | 'VALIDATION_ERROR';

export interface ErrorTypeConfig {
  message: string;
  retryable: boolean;
  autoRetry: boolean;
  delay?: number;
  maxRetries: number;
  guidance?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userActionRequired: boolean;
  category: 'network' | 'file' | 'processing' | 'auth' | 'database' | 'general';
}

export interface AnalysisError extends Error {
  code?: string;
  errorType?: ErrorType;
  retryable?: boolean;
  guidance?: string;
  retryCount?: number;
  requestId?: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  onError?: (error: AnalysisError) => void;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: (error: AnalysisError) => void;
}