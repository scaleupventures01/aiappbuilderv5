/**
 * useTradeAnalysisError Hook - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Custom hook for managing trade analysis errors with retry logic
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnalysisError, ErrorHandlerOptions, ErrorUIState } from '@/types/error';
import { useToast } from '@/components/ui/ToastNotification';
import { ScreenReader } from '@/utils/accessibility';

interface UseTradeAnalysisErrorOptions {
  maxRetries?: number;
  autoRetry?: boolean;
  showToasts?: boolean;
  onError?: (error: AnalysisError) => void;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: (error: AnalysisError) => void;
  onRecovery?: () => void;
}

interface TradeAnalysisErrorState {
  error: AnalysisError | null;
  isRetrying: boolean;
  retryCount: number;
  hasRecovered: boolean;
  lastErrorTime: number | null;
}

export const useTradeAnalysisError = (options: UseTradeAnalysisErrorOptions = {}) => {
  const {
    maxRetries = 2,
    autoRetry = true,
    showToasts = true,
    onError,
    onRetry,
    onMaxRetriesReached,
    onRecovery
  } = options;

  const { showError, showSuccess, showWarning } = useToast();
  
  const [errorState, setErrorState] = useState<TradeAnalysisErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    hasRecovered: false,
    lastErrorTime: null
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryPromiseRef = useRef<Promise<any> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Check if an error is retryable based on its type and properties
   */
  const isRetryable = useCallback((error: AnalysisError): boolean => {
    // Non-retryable error types
    const nonRetryableTypes = [
      'FILE_TOO_LARGE',
      'INVALID_FILE_FORMAT',
      'AUTHENTICATION_FAILED',
      'INSUFFICIENT_CREDITS',
      'VALIDATION_ERROR'
    ];

    if (error.errorType && nonRetryableTypes.includes(error.errorType)) {
      return false;
    }

    // Check retryable property
    return error.retryable !== false;
  }, []);

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  const calculateRetryDelay = useCallback((attempt: number): number => {
    const baseDelay = 1000; // 1 second base delay
    const maxDelay = 10000; // 10 seconds max delay
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  }, []);

  /**
   * Handle error occurrence
   */
  const handleError = useCallback((error: AnalysisError, operation?: () => Promise<any>) => {
    const newErrorState: TradeAnalysisErrorState = {
      error,
      isRetrying: false,
      retryCount: error.retryCount || 0,
      hasRecovered: false,
      lastErrorTime: Date.now()
    };

    setErrorState(newErrorState);

    // Announce error to screen readers
    ScreenReader.announce(`Error: ${error.message}`, 'assertive');

    // Show toast notification
    if (showToasts) {
      const isRetryableError = isRetryable(error);
      showError(
        error.errorType ? error.errorType.replace(/_/g, ' ').toLowerCase() : 'Error',
        error.message,
        {
          retryable: isRetryableError,
          onRetry: isRetryableError && operation ? () => retry(operation) : undefined,
          duration: isRetryableError ? 8000 : 6000
        }
      );
    }

    // Call custom error handler
    if (onError) {
      onError(error);
    }

    // Auto-retry if enabled and error is retryable
    if (autoRetry && isRetryable(error) && newErrorState.retryCount < maxRetries && operation) {
      scheduleRetry(operation, newErrorState.retryCount);
    }
  }, [isRetryable, showToasts, showError, autoRetry, maxRetries, onError]);

  /**
   * Schedule a retry with delay
   */
  const scheduleRetry = useCallback((operation: () => Promise<any>, currentRetryCount: number) => {
    const delay = calculateRetryDelay(currentRetryCount);
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true
    }));

    retryTimeoutRef.current = setTimeout(() => {
      executeRetry(operation, currentRetryCount + 1);
    }, delay);
  }, [calculateRetryDelay]);

  /**
   * Execute retry operation
   */
  const executeRetry = useCallback(async (operation: () => Promise<any>, attempt: number) => {
    try {
      // Call retry callback
      if (onRetry) {
        onRetry(attempt);
      }

      ScreenReader.announce(`Retrying operation, attempt ${attempt}`);

      // Execute the operation
      const result = await operation();
      
      // Success - clear error state
      setErrorState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        hasRecovered: true,
        lastErrorTime: null
      });

      // Show success toast
      if (showToasts) {
        showSuccess('Retry Successful', 'Operation completed successfully');
      }

      // Call recovery callback
      if (onRecovery) {
        onRecovery();
      }

      ScreenReader.announce('Operation succeeded after retry');
      
      return result;

    } catch (error) {
      const analysisError = error as AnalysisError;
      analysisError.retryCount = attempt;

      // Check if we've reached max retries
      if (attempt >= maxRetries) {
        setErrorState(prev => ({
          ...prev,
          error: analysisError,
          isRetrying: false,
          retryCount: attempt
        }));

        // Show max retries warning
        if (showToasts) {
          showWarning(
            'Max Retries Reached',
            'Unable to complete operation after multiple attempts. Please try again manually.'
          );
        }

        // Call max retries callback
        if (onMaxRetriesReached) {
          onMaxRetriesReached(analysisError);
        }

        ScreenReader.announce('Maximum retry attempts reached', 'assertive');
        
        throw analysisError;
      }

      // Schedule another retry if error is still retryable
      if (isRetryable(analysisError)) {
        scheduleRetry(operation, attempt);
      } else {
        // Error is no longer retryable
        setErrorState(prev => ({
          ...prev,
          error: analysisError,
          isRetrying: false,
          retryCount: attempt
        }));

        throw analysisError;
      }
    }
  }, [maxRetries, isRetryable, showToasts, showSuccess, showWarning, onRetry, onMaxRetriesReached, onRecovery, scheduleRetry]);

  /**
   * Manual retry function
   */
  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (errorState.isRetrying) {
      return retryPromiseRef.current;
    }

    const currentRetryCount = errorState.retryCount;
    
    // Check if we can retry
    if (currentRetryCount >= maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    if (errorState.error && !isRetryable(errorState.error)) {
      throw new Error('Error is not retryable');
    }

    // Execute retry
    retryPromiseRef.current = executeRetry(operation, currentRetryCount + 1);
    return retryPromiseRef.current;
  }, [errorState, maxRetries, isRetryable, executeRetry]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      hasRecovered: false,
      lastErrorTime: null
    });
  }, []);

  /**
   * Cancel ongoing retry
   */
  const cancelRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: false
    }));
  }, []);

  /**
   * Get error UI state for components
   */
  const getErrorUIState = useCallback((): ErrorUIState | null => {
    if (!errorState.error) return null;

    return {
      isVisible: true,
      message: errorState.error.message,
      guidance: errorState.error.guidance,
      retryable: isRetryable(errorState.error),
      isRetrying: errorState.isRetrying,
      retryCount: errorState.retryCount,
      maxRetries,
      errorType: errorState.error.errorType || 'UNKNOWN_ERROR',
      requestId: errorState.error.requestId,
      autoRetryEnabled: autoRetry && isRetryable(errorState.error)
    };
  }, [errorState, isRetryable, maxRetries, autoRetry]);

  /**
   * Execute operation with error handling
   */
  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    try {
      clearError(); // Clear any previous errors
      const result = await operation();
      
      // Mark as recovered if we had an error before
      if (errorState.error) {
        setErrorState(prev => ({
          ...prev,
          hasRecovered: true
        }));
      }
      
      return result;
    } catch (error) {
      const analysisError = error as AnalysisError;
      handleError(analysisError, operation);
      throw analysisError;
    }
  }, [clearError, errorState.error, handleError]);

  return {
    // State
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    hasRecovered: errorState.hasRecovered,
    canRetry: errorState.error ? isRetryable(errorState.error) && errorState.retryCount < maxRetries : false,
    
    // Functions
    handleError,
    retry,
    clearError,
    cancelRetry,
    executeWithErrorHandling,
    getErrorUIState,
    
    // Utilities
    isRetryable
  };
};

export default useTradeAnalysisError;