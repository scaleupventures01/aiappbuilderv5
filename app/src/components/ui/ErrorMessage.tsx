/**
 * ErrorMessage Component - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Reusable error display component with retry functionality
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Info, Clock, X } from 'lucide-react';
import { ErrorUIState } from '@/types/error';
import { ScreenReader } from '@/utils/accessibility';

interface ErrorMessageProps {
  error: ErrorUIState;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
  showDetails?: boolean;
}

/**
 * Get error category information for styling and icons
 */
const getErrorCategory = (errorType: string) => {
  const categories = {
    network: {
      icon: RefreshCw,
      color: 'orange',
      label: 'Connection Issue'
    },
    file: {
      icon: AlertTriangle,
      color: 'red',
      label: 'File Error'
    },
    processing: {
      icon: AlertTriangle,
      color: 'yellow',
      label: 'Processing Error'
    },
    auth: {
      icon: AlertTriangle,
      color: 'red',
      label: 'Authentication Error'
    },
    database: {
      icon: AlertTriangle,
      color: 'red',
      label: 'System Error'
    },
    general: {
      icon: AlertTriangle,
      color: 'gray',
      label: 'Error'
    }
  };

  // Map error types to categories
  if (errorType.includes('NETWORK') || errorType.includes('TIMEOUT') || 
      errorType.includes('API_DOWN') || errorType.includes('CONNECTION')) {
    return categories.network;
  }
  if (errorType.includes('FILE') || errorType.includes('UPLOAD') || 
      errorType.includes('IMAGE') || errorType.includes('FORMAT')) {
    return categories.file;
  }
  if (errorType.includes('PROCESSING') || errorType.includes('AI') || 
      errorType.includes('VISION') || errorType.includes('RATE_LIMIT')) {
    return categories.processing;
  }
  if (errorType.includes('AUTH') || errorType.includes('CREDITS')) {
    return categories.auth;
  }
  if (errorType.includes('DATABASE') || errorType.includes('DATA_SAVE')) {
    return categories.database;
  }

  return categories.general;
};

/**
 * CountdownTimer component for retry delays
 */
const CountdownTimer: React.FC<{ 
  seconds: number; 
  onComplete: () => void;
  className?: string;
}> = ({ seconds, onComplete, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <Clock className="h-3 w-3 mr-1" />
      {timeLeft}s
    </span>
  );
};

/**
 * Main ErrorMessage component
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  compact = false,
  showDetails = false
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const category = getErrorCategory(error.errorType);
  const IconComponent = category.icon;

  // Auto-retry countdown
  const [autoRetryCountdown, setAutoRetryCountdown] = useState<number | null>(null);

  useEffect(() => {
    // Announce error to screen readers
    if (error.isVisible) {
      ScreenReader.announce(`Error: ${error.message}`, 'assertive');
    }
  }, [error.isVisible, error.message]);

  useEffect(() => {
    // Handle auto-retry countdown
    if (error.autoRetryEnabled && error.nextRetryIn && error.nextRetryIn > 0) {
      setAutoRetryCountdown(Math.ceil(error.nextRetryIn / 1000));
    } else {
      setAutoRetryCountdown(null);
    }
  }, [error.autoRetryEnabled, error.nextRetryIn]);

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    ScreenReader.announce('Retrying operation');

    try {
      await onRetry();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
    ScreenReader.announce('Error dismissed');
  };

  const handleAutoRetryComplete = () => {
    setAutoRetryCountdown(null);
    handleRetry();
  };

  if (!error.isVisible) {
    return null;
  }

  const colorClasses = {
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: 'text-red-500 dark:text-red-400',
      button: 'bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-800 dark:text-orange-200',
      icon: 'text-orange-500 dark:text-orange-400',
      button: 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-800 dark:hover:bg-orange-700 text-orange-700 dark:text-orange-200'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: 'text-yellow-500 dark:text-yellow-400',
      button: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-700 dark:text-yellow-200'
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      text: 'text-gray-800 dark:text-gray-200',
      icon: 'text-gray-500 dark:text-gray-400',
      button: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
    }
  };

  const colors = colorClasses[category.color as keyof typeof colorClasses];

  return (
    <div
      className={`rounded-lg border ${colors.bg} ${colors.border} ${compact ? 'p-3' : 'p-4'} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start space-x-3">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <IconComponent 
            className={`h-5 w-5 ${colors.icon} ${isRetrying ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </div>

        {/* Error Content */}
        <div className="flex-1 min-w-0">
          {/* Error Header */}
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${colors.text}`}>
              {category.label}
              {error.retryCount > 0 && (
                <span className="ml-2 text-xs opacity-75">
                  (Attempt {error.retryCount + 1})
                </span>
              )}
            </h3>

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className={`ml-2 inline-flex rounded-md p-1.5 ${colors.button} hover:${colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-red-600`}
                aria-label="Dismiss error"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Error Message */}
          <div className={`mt-1 text-sm ${colors.text}`}>
            <p>{error.message}</p>
          </div>

          {/* Error Guidance */}
          {error.guidance && (
            <div className="mt-2">
              {compact ? (
                <button
                  onClick={() => setShowGuidance(!showGuidance)}
                  className={`text-xs ${colors.text} hover:underline flex items-center`}
                >
                  <Info className="h-3 w-3 mr-1" />
                  {showGuidance ? 'Hide' : 'Show'} guidance
                </button>
              ) : (
                <div className={`text-xs ${colors.text} opacity-90 mt-1`}>
                  <Info className="h-3 w-3 mr-1 inline" />
                  {error.guidance}
                </div>
              )}

              {compact && showGuidance && (
                <div className={`text-xs ${colors.text} opacity-90 mt-1 pl-4`}>
                  {error.guidance}
                </div>
              )}
            </div>
          )}

          {/* Retry Section */}
          {error.retryable && (
            <div className="mt-3 flex items-center space-x-3">
              {/* Manual Retry Button */}
              {onRetry && !autoRetryCountdown && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying || error.isRetrying}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${colors.button} transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50`}
                  aria-label="Retry operation"
                >
                  <RefreshCw 
                    className={`h-3 w-3 mr-1 ${(isRetrying || error.isRetrying) ? 'animate-spin' : ''}`} 
                  />
                  {isRetrying || error.isRetrying ? 'Retrying...' : 'Try Again'}
                </button>
              )}

              {/* Auto-retry Countdown */}
              {autoRetryCountdown && autoRetryCountdown > 0 && (
                <div className={`text-xs ${colors.text} flex items-center`}>
                  <span>Auto-retry in </span>
                  <CountdownTimer
                    seconds={autoRetryCountdown}
                    onComplete={handleAutoRetryComplete}
                    className="ml-1 font-mono"
                  />
                </div>
              )}

              {/* Retry Progress */}
              {error.retryCount > 0 && error.maxRetries > 0 && (
                <div className={`text-xs ${colors.text} opacity-75`}>
                  {error.retryCount} of {error.maxRetries} retries
                </div>
              )}
            </div>
          )}

          {/* Debug Information (Development Only) */}
          {showDetails && process.env.NODE_ENV === 'development' && error.requestId && (
            <details className="mt-3">
              <summary className={`text-xs ${colors.text} opacity-75 cursor-pointer hover:opacity-100`}>
                Debug Information
              </summary>
              <div className={`text-xs ${colors.text} opacity-75 mt-1 font-mono`}>
                <div>Request ID: {error.requestId}</div>
                <div>Error Type: {error.errorType}</div>
                <div>Retryable: {error.retryable ? 'Yes' : 'No'}</div>
                <div>Auto-retry: {error.autoRetryEnabled ? 'Enabled' : 'Disabled'}</div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;