/**
 * Error Handling Demonstration - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Demo component showing all error handling features
 */

import React, { useState } from 'react';
import { TradeAnalysisError } from '../components/chat/TradeAnalysisError';
import { TradeAnalysisErrorBoundary } from '../components/chat/TradeAnalysisErrorBoundary';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { ToastContainer, useToast } from '../components/ui/ToastNotification';
import { useTradeAnalysisError } from '../hooks/useTradeAnalysisError';
import { AnalysisError, ErrorUIState } from '../types/error';

/**
 * Demo component for testing error handling
 */
export const ErrorHandlingDemo: React.FC = () => {
  const [demoError, setDemoError] = useState<AnalysisError | null>(null);
  const { toasts, removeToast, showError, showSuccess, showWarning } = useToast();
  
  const {
    error: hookError,
    isRetrying,
    retryCount,
    canRetry,
    handleError,
    retry,
    clearError,
    getErrorUIState
  } = useTradeAnalysisError();

  // Demo error scenarios
  const createDemoError = (type: string): AnalysisError => {
    const errorMap: Record<string, AnalysisError> = {
      'network': {
        name: 'NetworkError',
        message: 'Failed to connect to AI service. Check your internet connection.',
        errorType: 'NETWORK_TIMEOUT',
        retryable: true,
        guidance: 'Please check your internet connection and try again.',
        retryCount: 0
      },
      'file': {
        name: 'FileError', 
        message: 'Image file is too large. Please use an image under 10MB.',
        errorType: 'FILE_TOO_LARGE',
        retryable: false,
        guidance: 'Try compressing your image or using a different format.',
        retryCount: 0
      },
      'api': {
        name: 'APIError',
        message: 'AI service is busy. Trying again...',
        errorType: 'OPENAI_RATE_LIMIT',
        retryable: true,
        guidance: 'This usually resolves quickly. We\'ll automatically retry for you.',
        retryCount: 1
      },
      'auth': {
        name: 'AuthError',
        message: 'Authentication required. Please log in and try again.',
        errorType: 'AUTHENTICATION_FAILED',
        retryable: false,
        guidance: 'Please log in to continue using the analysis feature.',
        retryCount: 0
      }
    };

    return errorMap[type] || errorMap['network'];
  };

  // Simulate async operation that fails
  const simulateFailedOperation = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    throw createDemoError('api');
  };

  const handleDemoError = (errorType: string) => {
    const error = createDemoError(errorType);
    setDemoError(error);
    handleError(error, simulateFailedOperation);
  };

  const handleRetryDemo = async () => {
    if (!canRetry) return;
    
    try {
      await retry(simulateFailedOperation);
      showSuccess('Retry Successful', 'Operation completed after retry');
    } catch {
      // Error handled by hook
    }
  };

  const errorUIState = getErrorUIState();

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Error Handling Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive error handling system for trade analysis
        </p>
      </div>

      {/* Demo Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Demo Controls
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleDemoError('network')}
            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
          >
            Network Error
          </button>
          
          <button
            onClick={() => handleDemoError('file')}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            File Error
          </button>
          
          <button
            onClick={() => handleDemoError('api')}
            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
          >
            API Rate Limit
          </button>
          
          <button
            onClick={() => handleDemoError('auth')}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
          >
            Auth Error
          </button>
        </div>

        <div className="flex space-x-3 mt-4">
          <button
            onClick={() => showError('Demo Error', 'This is a test error toast')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Show Error Toast
          </button>
          
          <button
            onClick={() => showWarning('Demo Warning', 'This is a test warning toast')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Show Warning Toast
          </button>
          
          <button
            onClick={() => showSuccess('Demo Success', 'This is a test success toast')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Show Success Toast
          </button>

          <button
            onClick={() => {
              setDemoError(null);
              clearError();
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            Clear Errors
          </button>
        </div>
      </div>

      {/* TradeAnalysisError Component Demo */}
      {demoError && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            TradeAnalysisError Component
          </h2>
          <TradeAnalysisError
            error={demoError}
            onRetry={() => {
              showSuccess('Retry Triggered', 'Manual retry initiated');
              setDemoError(null);
            }}
            onDismiss={() => setDemoError(null)}
          />
        </div>
      )}

      {/* ErrorMessage Component Demo */}
      {errorUIState && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            ErrorMessage Component (Hook-managed)
          </h2>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Hook State:</strong> Retrying: {isRetrying ? 'Yes' : 'No'}, 
              Retry Count: {retryCount}, Can Retry: {canRetry ? 'Yes' : 'No'}
            </p>
          </div>
          <ErrorMessage
            error={errorUIState}
            onRetry={handleRetryDemo}
            onDismiss={clearError}
            showDetails={true}
          />
        </div>
      )}

      {/* Error Boundary Demo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Error Boundary Demo
        </h2>
        <TradeAnalysisErrorBoundary context="analysis">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This content is wrapped in a TradeAnalysisErrorBoundary. 
              Any React errors will be caught and displayed gracefully.
            </p>
            <button
              onClick={() => {
                throw new Error('Simulated React error for testing error boundary');
              }}
              className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
            >
              Trigger Error Boundary
            </button>
          </div>
        </TradeAnalysisErrorBoundary>
      </div>

      {/* Features Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Implemented Features
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Error Components</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>✅ ErrorMessage - General error display</li>
              <li>✅ TradeAnalysisError - Trade-specific errors</li>
              <li>✅ TradeAnalysisErrorBoundary - React error boundary</li>
              <li>✅ ToastNotification - Instant feedback</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Error Handling</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>✅ 16 error types classification</li>
              <li>✅ Auto-retry with exponential backoff</li>
              <li>✅ Manual retry functionality</li>
              <li>✅ User-friendly error messages</li>
              <li>✅ Accessibility support</li>
              <li>✅ Loading states and progress</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={removeToast} 
        position="top-right"
        maxToasts={5}
      />
    </div>
  );
};

export default ErrorHandlingDemo;