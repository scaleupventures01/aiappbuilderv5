/**
 * TradeAnalysisError Component - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Specialized error handling component for trade analysis in chat interface
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Upload, Wifi, CreditCard, Database, RefreshCw } from 'lucide-react';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ErrorUIState, ErrorType, AnalysisError } from '@/types/error';
import { ScreenReader } from '@/utils/accessibility';

interface TradeAnalysisErrorProps {
  error: AnalysisError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  inline?: boolean;
}

/**
 * Error type configuration with enhanced UI information
 */
const ERROR_TYPE_CONFIG = {
  OPENAI_RATE_LIMIT: {
    icon: TrendingUp,
    title: 'AI Service Busy',
    category: 'temporary',
    severity: 'medium',
    autoRetry: true,
    helpText: 'This usually resolves quickly. We\'ll automatically retry for you.'
  },
  OPENAI_API_DOWN: {
    icon: Wifi,
    title: 'AI Service Unavailable',
    category: 'service',
    severity: 'high',
    autoRetry: false,
    helpText: 'The AI analysis service is temporarily down. Please try again in a few minutes.'
  },
  OPENAI_QUOTA_EXCEEDED: {
    icon: CreditCard,
    title: 'Service Quota Exceeded',
    category: 'quota',
    severity: 'high',
    autoRetry: false,
    helpText: 'Our AI service has reached its usage limit. This typically resets hourly.'
  },
  NETWORK_TIMEOUT: {
    icon: Wifi,
    title: 'Connection Timeout',
    category: 'network',
    severity: 'medium',
    autoRetry: true,
    helpText: 'The request took too long. Check your internet connection.'
  },
  FILE_TOO_LARGE: {
    icon: Upload,
    title: 'File Too Large',
    category: 'file',
    severity: 'low',
    autoRetry: false,
    helpText: 'Please compress your image or choose a smaller file. Maximum size is 10MB.'
  },
  INVALID_FILE_FORMAT: {
    icon: Upload,
    title: 'Invalid File Format',
    category: 'file',
    severity: 'low',
    autoRetry: false,
    helpText: 'Please use a PNG, JPG, or JPEG image file.'
  },
  UPLOAD_FAILED: {
    icon: Upload,
    title: 'Upload Failed',
    category: 'network',
    severity: 'medium',
    autoRetry: true,
    helpText: 'Failed to upload your image. Check your internet connection.'
  },
  IMAGE_CORRUPTED: {
    icon: Upload,
    title: 'Image Corrupted',
    category: 'file',
    severity: 'medium',
    autoRetry: false,
    helpText: 'The image file appears to be damaged. Please try a different image.'
  },
  IMAGE_PROCESSING_FAILED: {
    icon: TrendingUp,
    title: 'Image Processing Failed',
    category: 'processing',
    severity: 'medium',
    autoRetry: true,
    helpText: 'Unable to analyze the image. Make sure it shows a clear trading chart.'
  },
  AI_PROCESSING_FAILED: {
    icon: TrendingUp,
    title: 'Analysis Failed',
    category: 'processing',
    severity: 'medium',
    autoRetry: true,
    helpText: 'The AI analysis encountered an error. Please try again.'
  },
  VISION_API_ERROR: {
    icon: TrendingUp,
    title: 'Vision Service Error',
    category: 'service',
    severity: 'high',
    autoRetry: true,
    helpText: 'The image analysis service is having issues. We\'ll retry automatically.'
  },
  AUTHENTICATION_FAILED: {
    icon: CreditCard,
    title: 'Authentication Required',
    category: 'auth',
    severity: 'high',
    autoRetry: false,
    helpText: 'Please log in again to continue using the analysis feature.'
  },
  INSUFFICIENT_CREDITS: {
    icon: CreditCard,
    title: 'Insufficient Credits',
    category: 'credits',
    severity: 'high',
    autoRetry: false,
    helpText: 'You\'ve reached your analysis limit. Consider upgrading your plan.'
  },
  DATABASE_CONNECTION_FAILED: {
    icon: Database,
    title: 'Database Error',
    category: 'system',
    severity: 'high',
    autoRetry: true,
    helpText: 'We\'re having trouble saving your analysis. The system will retry automatically.'
  },
  DATA_SAVE_FAILED: {
    icon: Database,
    title: 'Save Failed',
    category: 'system',
    severity: 'medium',
    autoRetry: true,
    helpText: 'Your analysis completed but couldn\'t be saved. We\'ll try again.'
  },
  UNKNOWN_ERROR: {
    icon: AlertTriangle,
    title: 'Unexpected Error',
    category: 'system',
    severity: 'medium',
    autoRetry: true,
    helpText: 'Something unexpected happened. Please try again.'
  },
  VALIDATION_ERROR: {
    icon: AlertTriangle,
    title: 'Invalid Input',
    category: 'validation',
    severity: 'low',
    autoRetry: false,
    helpText: 'Please check your input and try again.'
  }
};

/**
 * Convert AnalysisError to ErrorUIState
 */
const convertToErrorUIState = (error: AnalysisError, isRetrying: boolean = false): ErrorUIState => {
  const config = ERROR_TYPE_CONFIG[error.errorType as ErrorType] || ERROR_TYPE_CONFIG.UNKNOWN_ERROR;
  
  return {
    isVisible: true,
    message: error.message,
    guidance: error.guidance,
    retryable: error.retryable || false,
    isRetrying,
    retryCount: error.retryCount || 0,
    maxRetries: 2, // Default max retries
    errorType: error.errorType || 'UNKNOWN_ERROR',
    requestId: error.requestId,
    autoRetryEnabled: config.autoRetry
  };
};

/**
 * Inline error display for chat messages
 */
const InlineError: React.FC<{
  error: AnalysisError;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ error, onRetry, onDismiss }) => {
  const config = ERROR_TYPE_CONFIG[error.errorType as ErrorType] || ERROR_TYPE_CONFIG.UNKNOWN_ERROR;
  const IconComponent = config.icon;

  return (
    <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md">
      <div className="flex-shrink-0">
        <IconComponent className="h-5 w-5 text-red-500 dark:text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          {config.title}
        </p>
        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
          {error.message}
        </p>
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Suggestion component for specific error types
 */
const ErrorSuggestions: React.FC<{ errorType: ErrorType }> = ({ errorType }) => {
  const suggestions: Record<string, string[]> = {
    FILE_TOO_LARGE: [
      'Compress your image using an online tool',
      'Reduce image quality in your image editor',
      'Try taking a screenshot instead of uploading the full image'
    ],
    INVALID_FILE_FORMAT: [
      'Convert your image to PNG or JPEG format',
      'Take a screenshot of your chart',
      'Use a different image file'
    ],
    IMAGE_PROCESSING_FAILED: [
      'Make sure the chart is clearly visible',
      'Try a higher quality image',
      'Ensure the chart takes up most of the image'
    ],
    INSUFFICIENT_CREDITS: [
      'Upgrade to a premium plan for more analyses',
      'Wait for your credits to reset',
      'Contact support for assistance'
    ]
  };

  const errorSuggestions = suggestions[errorType];
  if (!errorSuggestions) return null;

  return (
    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
        Suggestions:
      </h4>
      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
        {errorSuggestions.map((suggestion, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-2">•</span>
            <span>{suggestion}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Main TradeAnalysisError component
 */
export const TradeAnalysisError: React.FC<TradeAnalysisErrorProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  inline = false
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (error) {
      setRetryCount(error.retryCount || 0);
    }
  }, [error]);

  if (!error) return null;

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await onRetry();
      ScreenReader.announce('Analysis retry initiated');
    } catch (err) {
      console.error('Retry failed:', err);
      ScreenReader.announce('Retry failed', 'assertive');
    } finally {
      setIsRetrying(false);
    }
  };

  // Use inline display for chat messages
  if (inline) {
    return (
      <InlineError
        error={error}
        onRetry={handleRetry}
        onDismiss={onDismiss}
      />
    );
  }

  // Convert to ErrorUIState for the full ErrorMessage component
  const errorUIState = convertToErrorUIState(error, isRetrying);
  errorUIState.retryCount = retryCount;

  return (
    <div className={`trade-analysis-error ${className}`}>
      <ErrorMessage
        error={errorUIState}
        onRetry={handleRetry}
        onDismiss={onDismiss}
        showDetails={process.env.NODE_ENV === 'development'}
      />
      
      {/* Error-specific suggestions */}
      <ErrorSuggestions errorType={error.errorType as ErrorType} />
    </div>
  );
};

export default TradeAnalysisError;