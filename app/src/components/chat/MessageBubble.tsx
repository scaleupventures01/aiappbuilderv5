import React from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/utils/cn';
import { SpeedMode } from '../SpeedSelector';
import { VerdictDisplay, VerdictType } from '@/components/verdict';

interface SpeedInfo {
  mode: SpeedMode;
  color: string;
  icon: React.ReactNode;
  name: string;
}

const getSpeedInfo = (speedMode?: SpeedMode): SpeedInfo | null => {
  if (!speedMode) return null;
  
  const speedMap: Record<SpeedMode, SpeedInfo> = {
    super_fast: {
      mode: 'super_fast',
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      name: 'Super Fast',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    fast: {
      mode: 'fast',
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      name: 'Fast',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    balanced: {
      mode: 'balanced',
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      name: 'Balanced',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    high_accuracy: {
      mode: 'high_accuracy',
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      name: 'High Accuracy',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };
  
  return speedMap[speedMode];
};

interface MessageBubbleProps {
  message: Message;
  showTimestamp?: boolean;
  className?: string;
  compact?: boolean;
  showSpeedIndicator?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  showTimestamp = false,
  showSpeedIndicator = true
}) => {
  const isUser = message.type === 'user';
  const isAI = message.type === 'ai';
  const isSystem = message.type === 'system';

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  // System messages are centered
  if (isSystem) {
    return (
      <div className="flex flex-col items-center space-y-1 my-4">
        {showTimestamp && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatTimestamp(message.createdAt)}
          </div>
        )}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 max-w-md">
          <div className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col space-y-1',
      isUser ? 'items-end' : 'items-start'
    )}>
      {/* Timestamp */}
      {showTimestamp && (
        <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
          {formatTimestamp(message.createdAt)}
        </div>
      )}
      
      {/* Message bubble */}
      <div className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}>
        {/* AI Avatar */}
        {isAI && (
          <div className="flex-shrink-0 mr-2 mt-1">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )}

        {/* Message content */}
        <div className={cn(
          'rounded-2xl px-4 py-2 break-words max-w-[85%] sm:max-w-[70%] lg:max-w-[65%]',
          isUser ? [
            'bg-primary-600 text-white',
            'rounded-br-md'
          ] : [
            'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
            'rounded-bl-md'
          ]
        )}>
          <div className="whitespace-pre-wrap">
            {message.content}
          </div>
          
          {/* Trade Analysis Verdict Display */}
          {message.metadata?.type === 'analysis' && message.metadata.verdict && (
            <div className="mt-3">
              <VerdictDisplay
                data={{
                  verdict: message.metadata.verdict as VerdictType,
                  confidence: message.metadata.confidence || 0,
                  reasoning: message.metadata.reasoning,
                  processingTime: message.metadata.processingTime,
                  timestamp: message.createdAt
                }}
                size="medium"
                animated={true}
                showDetails={true}
                className="max-w-full"
              />
            </div>
          )}

          {/* Message metadata */}
          {message.metadata && message.metadata.type !== 'analysis' && (
            <div className="mt-2 text-xs opacity-75">
              {message.metadata.confidence && (
                <div>Confidence: {Math.round(message.metadata.confidence * 100)}%</div>
              )}
              {message.metadata.category && (
                <div>Category: {message.metadata.category}</div>
              )}
            </div>
          )}

          {/* Speed indicator for AI messages */}
          {isAI && showSpeedIndicator && message.metadata && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {/* Speed mode indicator */}
                {(() => {
                  const speedInfo = getSpeedInfo(message.metadata.speedMode as SpeedMode);
                  return speedInfo ? (
                    <div className={cn('flex items-center space-x-1 px-2 py-1 rounded-full', speedInfo.color)}>
                      {speedInfo.icon}
                      <span className="font-medium">{speedInfo.name}</span>
                    </div>
                  ) : null;
                })()}

                {/* Response time */}
                {message.metadata.responseTime && (
                  <div className="text-gray-500 dark:text-gray-400">
                    {message.metadata.responseTime < 1000 
                      ? `${Math.round(message.metadata.responseTime)}ms`
                      : `${(message.metadata.responseTime / 1000).toFixed(1)}s`
                    }
                  </div>
                )}
              </div>

              {/* Cost and performance indicators */}
              <div className="flex items-center space-x-2">
                {message.metadata.estimatedCost && (
                  <div className="text-gray-500 dark:text-gray-400">
                    ${message.metadata.estimatedCost.toFixed(3)}
                  </div>
                )}
                
                {message.metadata.targetTime && message.metadata.responseTime && (
                  <div className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    message.metadata.responseTime <= message.metadata.targetTime
                      ? 'text-green-600 bg-green-100 dark:bg-green-900/20'
                      : 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
                  )}>
                    {message.metadata.responseTime <= message.metadata.targetTime ? '✓' : '⚠️'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        {isUser && (
          <div className="flex-shrink-0 ml-2 mt-1">
            <div className="w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Message status for user messages */}
      {isUser && (
        <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
          <span>Sent</span>
        </div>
      )}
    </div>
  );
};