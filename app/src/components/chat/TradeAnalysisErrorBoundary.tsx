/**
 * TradeAnalysisErrorBoundary - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Specialized error boundary for trade analysis components
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MessageCircle, TrendingUp } from 'lucide-react';
import { ScreenReader } from '@/utils/accessibility';

interface TradeAnalysisErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
  context?: 'chat' | 'analysis' | 'upload' | 'general';
}

interface TradeAnalysisErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
  lastErrorTime: number;
}

/**
 * Enhanced error boundary specifically for trade analysis features
 */
export class TradeAnalysisErrorBoundary extends Component<
  TradeAnalysisErrorBoundaryProps,
  TradeAnalysisErrorBoundaryState
> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: TradeAnalysisErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<TradeAnalysisErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
      retryCount: this.state.retryCount + 1
    });

    // Log error details
    console.error('TradeAnalysisErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString()
    });

    // Announce error to screen readers
    ScreenReader.announce(
      `Trade analysis error occurred: ${error.message}`,
      'assertive'
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for certain error types (max 2 retries)
    if (this.shouldAutoRetry(error) && this.state.retryCount < 2) {
      this.scheduleAutoRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    // Auto-retry for network errors, temporary service issues
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /connection/i,
      /temporary/i,
      /rate.?limit/i
    ];

    return retryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private scheduleAutoRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff, max 10s

    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });

    ScreenReader.announce('Retrying trade analysis');

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoToChat = () => {
    // Navigate to main chat interface
    window.location.href = '/chat';
  };

  private getContextIcon() {
    const { context } = this.props;
    
    switch (context) {
      case 'chat':
        return MessageCircle;
      case 'analysis':
        return TrendingUp;
      case 'upload':
        return TrendingUp;
      default:
        return AlertTriangle;
    }
  }

  private getContextTitle() {
    const { context } = this.props;
    
    switch (context) {
      case 'chat':
        return 'Chat Interface Error';
      case 'analysis':
        return 'Trade Analysis Error';
      case 'upload':
        return 'Image Upload Error';
      default:
        return 'Trade Analysis Error';
    }
  }

  private getContextMessage() {
    const { context } = this.props;
    
    switch (context) {
      case 'chat':
        return 'We encountered an issue with the chat interface. Your conversation is safe.';
      case 'analysis':
        return 'There was a problem analyzing your trade. Your data is secure.';
      case 'upload':
        return 'Failed to upload your image. Please try again with a different image.';
      default:
        return 'We encountered an unexpected error while processing your request.';
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const IconComponent = this.getContextIcon();
      const title = this.getContextTitle();
      const message = this.getContextMessage();
      const isRetrying = this.retryTimeout !== null;

      // Compact error display for inline contexts
      if (this.props.context === 'upload' || this.props.context === 'analysis') {
        return (
          <div className="flex items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-center max-w-md">
              <IconComponent className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                {title}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                {message}
              </p>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </button>
              </div>

              {this.state.retryCount > 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Retry attempt {this.state.retryCount} of 2
                </p>
              )}
            </div>
          </div>
        );
      }

      // Full error display for main contexts
      return (
        <div className="min-h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-lg w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                  <IconComponent className="h-8 w-8 text-red-500 dark:text-red-400" />
                </div>
              </div>

              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {title}
              </h1>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>

              {/* Error details for development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <summary className="cursor-pointer font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="text-xs text-red-600 dark:text-red-400 space-y-2">
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 overflow-auto max-h-32 bg-gray-200 dark:bg-gray-800 p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 overflow-auto max-h-32 bg-gray-200 dark:bg-gray-800 p-2 rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Retry operation"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </button>

                {this.props.context === 'analysis' && (
                  <button
                    onClick={this.handleGoToChat}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Go to chat interface"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Back to Chat
                  </button>
                )}

                <button
                  onClick={this.handleReload}
                  className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Reload page"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </button>
              </div>

              {/* Retry indicator */}
              {this.state.retryCount > 0 && (
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {isRetrying ? (
                    <span>Attempting automatic retry ({this.state.retryCount} of 2)...</span>
                  ) : (
                    <span>Retry attempt {this.state.retryCount} of 2</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC wrapper for components that need trade analysis error boundaries
 */
export const withTradeAnalysisErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Omit<TradeAnalysisErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <TradeAnalysisErrorBoundary {...boundaryProps}>
      <Component {...props} />
    </TradeAnalysisErrorBoundary>
  );

  WrappedComponent.displayName = `withTradeAnalysisErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default TradeAnalysisErrorBoundary;