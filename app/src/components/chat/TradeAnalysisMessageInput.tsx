/**
 * TradeAnalysisMessageInput - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Enhanced message input with integrated trade analysis error handling
 */

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { TrendingUp, Upload, AlertTriangle, RefreshCw } from 'lucide-react';
import { MessageInput } from './MessageInput';
import { TradeAnalysisError } from './TradeAnalysisError';
import { useTradeAnalysisError } from '@/hooks/useTradeAnalysisError';
import { useToast } from '@/components/ui/ToastNotification';
import { tradeAnalysisAPI, TradeAnalysisRequest, AnalysisProgress } from '@/services/tradeAnalysisAPI';
import { AnalysisError } from '@/types/error';
import { ScreenReader } from '@/utils/accessibility';

interface TradeAnalysisMessageInputProps {
  onSendMessage: (content: string, metadata?: any) => Promise<void>;
  onAnalysisComplete?: (result: any) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  conversationId?: string;
  allowTradeAnalysis?: boolean;
}

/**
 * Progress indicator component for analysis
 */
const AnalysisProgress: React.FC<{
  progress: AnalysisProgress;
  onCancel?: () => void;
}> = ({ progress, onCancel }) => (
  <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
    <div className="flex-shrink-0">
      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          {progress.message}
        </p>
        {progress.retryAttempt && (
          <span className="text-xs text-blue-600 dark:text-blue-400">
            Retry {progress.retryAttempt}
          </span>
        )}
      </div>
      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
        <div
          className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      {progress.timeRemaining && (
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Next retry in {Math.ceil(progress.timeRemaining / 1000)}s
        </p>
      )}
    </div>
    {onCancel && (
      <button
        onClick={onCancel}
        className="flex-shrink-0 p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        aria-label="Cancel analysis"
      >
        <AlertTriangle className="h-4 w-4" />
      </button>
    )}
  </div>
);

/**
 * Trade analysis trigger button
 */
const AnalysisButton: React.FC<{
  hasImage: boolean;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  disabled?: boolean;
}> = ({ hasImage, isAnalyzing, onAnalyze, disabled }) => (
  <button
    onClick={onAnalyze}
    disabled={!hasImage || isAnalyzing || disabled}
    className={cn(
      'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
      hasImage && !isAnalyzing && !disabled
        ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-600',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1'
    )}
    aria-label="Analyze chart"
  >
    {isAnalyzing ? (
      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
    ) : (
      <TrendingUp className="h-3 w-3 mr-1" />
    )}
    {isAnalyzing ? 'Analyzing...' : 'Analyze Chart'}
  </button>
);

/**
 * Main TradeAnalysisMessageInput component
 */
export const TradeAnalysisMessageInput: React.FC<TradeAnalysisMessageInputProps> = ({
  onSendMessage,
  onAnalysisComplete,
  disabled = false,
  placeholder = "Upload a chart image and ask for analysis...",
  className = '',
  conversationId,
  allowTradeAnalysis = true
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysisDescription, setAnalysisDescription] = useState('');
  const [showAnalysisOptions, setShowAnalysisOptions] = useState(false);

  const analysisRequestIdRef = useRef<string | null>(null);
  const { showSuccess, showError } = useToast();

  // Error handling hook
  const {
    error: analysisError,
    isRetrying,
    retryCount,
    canRetry,
    handleError,
    retry,
    clearError,
    executeWithErrorHandling
  } = useTradeAnalysisError({
    maxRetries: 2,
    autoRetry: true,
    showToasts: true,
    onError: (error) => {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
      ScreenReader.announce(`Analysis failed: ${error.message}`, 'assertive');
    },
    onRetry: (attempt) => {
      ScreenReader.announce(`Retrying analysis, attempt ${attempt}`);
    },
    onRecovery: () => {
      ScreenReader.announce('Analysis completed successfully after retry');
    }
  });

  /**
   * Handle image selection for analysis
   */
  const handleImageSelect = useCallback((files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setSelectedImage(imageFiles[0]);
      setShowAnalysisOptions(true);
      ScreenReader.announce('Chart image selected for analysis');
    }
  }, []);

  /**
   * Perform trade analysis
   */
  const performAnalysis = useCallback(async (): Promise<any> => {
    if (!selectedImage) {
      throw new Error('No image selected for analysis');
    }

    const request: TradeAnalysisRequest = {
      image: selectedImage,
      description: analysisDescription.trim() || undefined
    };

    const result = await tradeAnalysisAPI.analyzeChart(
      request,
      {
        maxRetries: 2,
        autoRetry: true,
        showToast: false // We handle toasts via our error hook
      },
      setAnalysisProgress
    );

    return result;
  }, [selectedImage, analysisDescription]);

  /**
   * Handle trade analysis execution
   */
  const handleAnalyzeChart = useCallback(async () => {
    if (!selectedImage || isAnalyzing) return;

    setIsAnalyzing(true);
    clearError();

    try {
      const result = await executeWithErrorHandling(performAnalysis);

      // Analysis successful
      setAnalysisProgress({
        stage: 'completed',
        progress: 100,
        message: 'Analysis completed successfully!'
      });

      // Create analysis message with verdict-specific content
      const verdictEmoji = {
        Diamond: '💎',
        Fire: '🔥',
        Skull: '💀'
      }[result.data.verdict];

      const analysisMessage = `${verdictEmoji} **Chart Analysis Complete**

**Verdict:** ${result.data.verdict}
**Confidence:** ${result.data.confidence}%

**Analysis:**
${result.data.reasoning}

*Processing Time: ${result.data.processingTime}ms*`;

      // Send analysis as message
      await onSendMessage(analysisMessage, {
        type: 'analysis',
        chartImage: selectedImage.name,
        verdict: result.data.verdict,
        confidence: result.data.confidence,
        reasoning: result.data.reasoning,
        processingTime: result.data.processingTime,
        analysisId: result.metadata.requestId
      });

      // Call completion callback
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      // Show success toast with verdict-specific message
      const verdictMessages = {
        Diamond: 'Strong buy signal detected! 💎',
        Fire: 'Hot opportunity identified! 🔥',
        Skull: 'High risk warning issued! 💀'
      };
      
      showSuccess('Analysis Complete', verdictMessages[result.data.verdict]);

      // Reset state
      setSelectedImage(null);
      setAnalysisDescription('');
      setShowAnalysisOptions(false);

      ScreenReader.announce(`Analysis complete: ${result.data.verdict} verdict with ${result.data.confidence}% confidence`, 'polite');

    } catch (error) {
      const analysisError = error as AnalysisError;
      handleError(analysisError, performAnalysis);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  }, [
    selectedImage,
    isAnalyzing,
    clearError,
    executeWithErrorHandling,
    performAnalysis,
    onSendMessage,
    onAnalysisComplete,
    showSuccess,
    handleError
  ]);

  /**
   * Handle retry analysis
   */
  const handleRetryAnalysis = useCallback(async () => {
    if (!canRetry) return;

    try {
      await retry(performAnalysis);
    } catch (error) {
      // Error is already handled by the hook
    }
  }, [canRetry, retry, performAnalysis]);

  /**
   * Cancel ongoing analysis
   */
  const handleCancelAnalysis = useCallback(() => {
    if (analysisRequestIdRef.current) {
      tradeAnalysisAPI.cancelAnalysis(analysisRequestIdRef.current);
    }
    setIsAnalyzing(false);
    setAnalysisProgress(null);
    clearError();
    ScreenReader.announce('Analysis cancelled');
  }, [clearError]);

  /**
   * Handle regular message sending with image detection
   */
  const handleSendMessage = useCallback(async (content: string, metadata?: any) => {
    // Check if message contains images that could be analyzed
    if (metadata?.attachments?.length > 0 && allowTradeAnalysis) {
      const imageAttachments = metadata.attachments.filter((att: any) =>
        att.type.startsWith('image/')
      );

      if (imageAttachments.length > 0 && !selectedImage) {
        // Show analysis suggestion
        showSuccess(
          'Chart Detected',
          'Would you like to analyze this chart? Use the analyze button for detailed insights.',
          { duration: 6000 }
        );
      }
    }

    await onSendMessage(content, metadata);
  }, [onSendMessage, allowTradeAnalysis, selectedImage, showSuccess]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Analysis Progress */}
      {analysisProgress && (
        <AnalysisProgress
          progress={analysisProgress}
          onCancel={isAnalyzing ? handleCancelAnalysis : undefined}
        />
      )}

      {/* Analysis Error Display */}
      {analysisError && (
        <TradeAnalysisError
          error={analysisError}
          onRetry={handleRetryAnalysis}
          onDismiss={clearError}
          inline={true}
        />
      )}

      {/* Analysis Options Panel */}
      {showAnalysisOptions && selectedImage && allowTradeAnalysis && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <Upload className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Chart Analysis Options
            </span>
          </div>

          <div className="space-y-3">
            {/* Selected image preview */}
            <div className="flex items-center space-x-3">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Selected chart"
                className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {selectedImage.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {/* Analysis description */}
            <div>
              <label htmlFor="analysis-description" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Context (Optional)
              </label>
              <textarea
                id="analysis-description"
                value={analysisDescription}
                onChange={(e) => setAnalysisDescription(e.target.value)}
                placeholder="Describe what you want to know about this chart..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                maxLength={500}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setAnalysisDescription('');
                  setShowAnalysisOptions(false);
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>

              <AnalysisButton
                hasImage={!!selectedImage}
                isAnalyzing={isAnalyzing}
                onAnalyze={handleAnalyzeChart}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={disabled || isAnalyzing}
        placeholder={placeholder}
        conversationId={conversationId}
        allowAttachments={true}
        className="bg-transparent"
      />

      {/* Quick Analysis Button (when image is attached but not selected for analysis) */}
      {!showAnalysisOptions && allowTradeAnalysis && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAnalysisOptions(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center space-x-1"
          >
            <TrendingUp className="h-3 w-3" />
            <span>Upload chart for AI analysis</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TradeAnalysisMessageInput;