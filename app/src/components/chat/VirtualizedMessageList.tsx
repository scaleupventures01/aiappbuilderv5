import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Message } from '@/types/chat';
import { cn } from '@/utils/cn';

interface VirtualizedMessageListProps {
  messages: Message[];
  isTyping?: boolean;
  className?: string;
  onLoadMore?: () => Promise<void> | void;
  hasMore?: boolean;
  containerHeight?: number;
  enablePerformanceMonitoring?: boolean;
  enableMobileOptimization?: boolean;
  dynamicHeights?: boolean;
  onPerformanceUpdate?: (_metrics: PerformanceMetrics) => void;
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage?: number;
  scrollJank: number;
  renderTime: number;
  visibleMessages: number;
}

interface CachedHeight {
  height: number;
  timestamp: number;
}

interface TouchState {
  startY: number;
  velocity: number;
  lastTime: number;
  isTracking: boolean;
}

// Enhanced virtual scrolling parameters
const DEFAULT_ITEM_HEIGHT = 80; // Default height per message
const BUFFER_SIZE = 5; // Extra items to render outside viewport
const SCROLL_THRESHOLD = 100; // Pixels from top/bottom to trigger actions
const AUTO_SCROLL_IMMEDIATE_THRESHOLD = 50; // Immediate auto-scroll zone
const AUTO_SCROLL_WARNING_THRESHOLD = 100; // Warning zone for auto-scroll
const PERFORMANCE_MONITOR_INTERVAL = 1000; // Performance monitoring interval
const TOUCH_VELOCITY_THRESHOLD = 0.5; // Minimum velocity for momentum scrolling
const HEIGHT_CACHE_SIZE = 1000; // Maximum cached heights

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  isTyping = false,
  className = '',
  onLoadMore,
  hasMore = false,
  containerHeight = 600,
  enablePerformanceMonitoring = typeof window !== 'undefined' && window.location.hostname === 'localhost',
  enableMobileOptimization = true,
  dynamicHeights = true,
  onPerformanceUpdate
}) => {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const heightCache = useRef<Map<string, CachedHeight>>(new Map());
  const performanceRef = useRef<{
    frameCount: number;
    lastFrameTime: number;
    renderStartTime: number;
    jankCount: number;
  }>({ frameCount: 0, lastFrameTime: 0, renderStartTime: 0, jankCount: 0 });
  const touchState = useRef<TouchState>({ startY: 0, velocity: 0, lastTime: 0, isTracking: false });
  
  // Enhanced state management
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [autoScrollZone, setAutoScrollZone] = useState<'immediate' | 'warning' | 'none'>('immediate');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    scrollJank: 0,
    renderTime: 0,
    visibleMessages: 0
  });

  // Helper function to determine if timestamp should be shown
  const shouldShowTimestamp = useCallback((message: Message, index: number, startIndex: number = 0): boolean => {
    if (index === 0) return true;
    
    const actualIndex = startIndex + index;
    if (actualIndex === 0) return true;
    
    const previousMessage = messages[actualIndex - 1];
    if (!previousMessage) return true;
    
    const currentTime = new Date(message.createdAt);
    const previousTime = new Date(previousMessage.createdAt);
    
    // Show timestamp if more than 5 minutes have passed or different sender
    const timeDiff = currentTime.getTime() - previousTime.getTime();
    return timeDiff > 5 * 60 * 1000 || previousMessage.userId !== message.userId;
  }, [messages]);

  // Dynamic height calculation  
  const getMessageHeight = useCallback((message: Message, index: number): number => {
    if (!dynamicHeights) return DEFAULT_ITEM_HEIGHT;
    
    const cached = heightCache.current.get(message.id);
    if (cached && Date.now() - cached.timestamp < 60000) { // Cache for 1 minute
      return cached.height;
    }
    
    // Estimate height based on content
    let estimatedHeight = DEFAULT_ITEM_HEIGHT;
    
    // Base height includes avatar, padding, margins
    const baseHeight = 60;
    
    // Calculate text height (approximate)
    const contentLength = message.content.length;
    const lineHeight = 24;
    const charsPerLine = 70; // Approximate characters per line
    const textLines = Math.max(1, Math.ceil(contentLength / charsPerLine));
    const textHeight = textLines * lineHeight;
    
    // Add height for attachments
    const attachmentHeight = message.metadata?.attachments?.length 
      ? message.metadata.attachments.length * 100 : 0;
    
    // Add height for metadata
    const metadataHeight = message.metadata?.confidence ? 20 : 0;
    
    // Add height for timestamp if shown
    const timestampHeight = shouldShowTimestamp(message, index, 0) ? 20 : 0;
    
    estimatedHeight = baseHeight + textHeight + attachmentHeight + metadataHeight + timestampHeight;
    
    // Cache the height
    heightCache.current.set(message.id, {
      height: estimatedHeight,
      timestamp: Date.now()
    });
    
    // Cleanup cache if too large
    if (heightCache.current.size > HEIGHT_CACHE_SIZE) {
      const oldestKeys = Array.from(heightCache.current.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, HEIGHT_CACHE_SIZE / 4)
        .map(([key]) => key);
      oldestKeys.forEach(key => heightCache.current.delete(key));
    }
    
    return estimatedHeight;
  }, [dynamicHeights, shouldShowTimestamp]);
  
  // Enhanced virtual scrolling parameters with dynamic heights
  const { visibleRange, totalHeight, offsetY } = useMemo(() => {
    const viewportHeight = containerHeight;
    let currentY = 0;
    const positions: number[] = [];
    
    // Calculate cumulative positions for all messages
    messages.forEach((message, index) => {
      positions.push(currentY);
      currentY += getMessageHeight(message, index);
    });
    
    // Find visible range based on scroll position and dynamic heights
    const startIndex = Math.max(0, 
      positions.findIndex(pos => pos + DEFAULT_ITEM_HEIGHT >= scrollTop) - BUFFER_SIZE
    );
    
    let endIndex = startIndex;
    while (endIndex < positions.length && 
           positions[endIndex] <= scrollTop + viewportHeight + (BUFFER_SIZE * DEFAULT_ITEM_HEIGHT)) {
      endIndex++;
    }
    endIndex = Math.min(messages.length, endIndex + BUFFER_SIZE);
    
    return {
      visibleRange: { start: startIndex, end: endIndex },
      totalHeight: currentY,
      offsetY: positions[startIndex] || 0
    };
  }, [scrollTop, containerHeight, messages, getMessageHeight]);

  // Get visible messages
  const visibleMessages = useMemo(() => {
    return messages.slice(visibleRange.start, visibleRange.end);
  }, [messages, visibleRange]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && scrollElementRef.current) {
      const element = scrollElementRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, isTyping, shouldAutoScroll]);

  // Enhanced scroll handling with progressive thresholds and performance monitoring
  const handleScroll = useCallback(() => {
    if (!scrollElementRef.current) return;
    
    const startTime = performance.now();
    const element = scrollElementRef.current;
    const newScrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    setScrollTop(newScrollTop);
    
    // Progressive auto-scroll threshold system
    const distanceFromBottom = scrollHeight - newScrollTop - clientHeight;
    const atBottom = distanceFromBottom <= AUTO_SCROLL_IMMEDIATE_THRESHOLD;
    const inWarningZone = distanceFromBottom <= AUTO_SCROLL_WARNING_THRESHOLD;
    
    setIsAtBottom(atBottom);
    
    // Update auto-scroll zone
    if (atBottom) {
      setAutoScrollZone('immediate');
      setShouldAutoScroll(true);
    } else if (inWarningZone) {
      setAutoScrollZone('warning');
      // Don't change auto-scroll in warning zone - let user decide
    } else {
      setAutoScrollZone('none');
      setShouldAutoScroll(false);
    }

    // Load more messages when scrolled to top
    if (newScrollTop < SCROLL_THRESHOLD && hasMore && onLoadMore && !isLoadingMore) {
      setIsLoadingMore(true);
      const result = onLoadMore();
      if (result && typeof result.finally === 'function') {
        result.finally(() => setIsLoadingMore(false));
      } else {
        setIsLoadingMore(false);
      }
    }
    
    // Performance monitoring
    if (enablePerformanceMonitoring) {
      const renderTime = performance.now() - startTime;
      const currentTime = performance.now();
      
      // Check for jank (frame time > 16.67ms for 60fps)
      if (renderTime > 16.67) {
        performanceRef.current.jankCount++;
      }
      
      // Update performance metrics periodically
      if (currentTime - performanceRef.current.lastFrameTime > PERFORMANCE_MONITOR_INTERVAL) {
        const fps = Math.round(performanceRef.current.frameCount * 1000 / 
          (currentTime - performanceRef.current.lastFrameTime));
        
        const metrics: PerformanceMetrics = {
          fps: Math.min(60, fps),
          scrollJank: performanceRef.current.jankCount,
          renderTime,
          visibleMessages: visibleRange.end - visibleRange.start,
          memoryUsage: (performance as any).memory?.usedJSHeapSize
        };
        
        setPerformanceMetrics(metrics);
        onPerformanceUpdate?.(metrics);
        
        // Reset counters
        performanceRef.current.frameCount = 0;
        performanceRef.current.jankCount = 0;
        performanceRef.current.lastFrameTime = currentTime;
      }
      
      performanceRef.current.frameCount++;
    }
  }, [hasMore, onLoadMore, isLoadingMore, enablePerformanceMonitoring, visibleRange, onPerformanceUpdate]);

  // Enhanced touch handling for mobile optimization
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enableMobileOptimization) return;
    
    const touch = e.touches[0];
    touchState.current = {
      startY: touch.clientY,
      velocity: 0,
      lastTime: Date.now(),
      isTracking: true
    };
  }, [enableMobileOptimization]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enableMobileOptimization || !touchState.current.isTracking) return;
    
    const touch = e.touches[0];
    const currentTime = Date.now();
    const deltaY = touch.clientY - touchState.current.startY;
    const deltaTime = currentTime - touchState.current.lastTime;
    
    if (deltaTime > 0) {
      touchState.current.velocity = deltaY / deltaTime;
    }
    
    touchState.current.lastTime = currentTime;
  }, [enableMobileOptimization]);
  
  const handleTouchEnd = useCallback(() => {
    if (!enableMobileOptimization) return;
    
    // Apply momentum scrolling if velocity is high enough
    if (Math.abs(touchState.current.velocity) > TOUCH_VELOCITY_THRESHOLD && scrollElementRef.current) {
      const element = scrollElementRef.current;
      element.style.scrollBehavior = 'smooth';
      
      // Reset scroll behavior after momentum
      setTimeout(() => {
        if (element.style) {
          element.style.scrollBehavior = 'auto';
        }
      }, 300);
    }
    
    touchState.current.isTracking = false;
  }, [enableMobileOptimization]);
  
  // Throttled scroll handler with RAF
  const throttledScrollHandler = useCallback(() => {
    let ticking = false;
    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
  }, [handleScroll])();

  const scrollToBottom = useCallback((smooth = true) => {
    setShouldAutoScroll(true);
    setAutoScrollZone('immediate');
    if (scrollElementRef.current) {
      const element = scrollElementRef.current;
      if (smooth) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        element.scrollTop = element.scrollHeight;
      }
    }
  }, []);

  return (
    <div className={cn('flex flex-col h-full relative', className)}>
      {/* Virtual scroll container */}
      <div
        ref={scrollElementRef}
        className={cn(
          'flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
          enableMobileOptimization && 'scroll-smooth'
        )}
        onScroll={throttledScrollHandler}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          height: containerHeight,
          // iOS Safari bounce scroll fix
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Load more indicator */}
        {hasMore && (
          <div className="flex justify-center p-4">
            {isLoadingMore ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                <span>Loading earlier messages...</span>
              </div>
            ) : (
              <button
                onClick={onLoadMore}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                disabled={isLoadingMore}
              >
                Load earlier messages
              </button>
            )}
          </div>
        )}

        {/* Enhanced virtual scrolling container */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible messages with dynamic positioning */}
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
            className="px-4"
          >
            {visibleMessages.map((message, index) => {
              const actualIndex = visibleRange.start + index;
              return (
                <div
                  key={message.id}
                  ref={el => {
                    if (el) {
                      messageRefs.current.set(message.id, el);
                      // Update actual height in cache if different from estimate
                      if (dynamicHeights) {
                        const actualHeight = el.offsetHeight;
                        const cachedHeight = heightCache.current.get(message.id);
                        if (cachedHeight && Math.abs(actualHeight - cachedHeight.height) > 10) {
                          heightCache.current.set(message.id, {
                            height: actualHeight,
                            timestamp: Date.now()
                          });
                        }
                      }
                    } else {
                      messageRefs.current.delete(message.id);
                    }
                  }}
                  className={index > 0 ? 'mt-4' : ''}
                  style={{
                    minHeight: dynamicHeights ? getMessageHeight(message, actualIndex) : DEFAULT_ITEM_HEIGHT
                  }}
                >
                  <MessageBubble
                    message={message}
                    showTimestamp={shouldShowTimestamp(message, index, visibleRange.start)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Typing indicator */}
        {isTyping && (
          <div className="px-4 py-2">
            <TypingIndicator />
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !isTyping && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="mb-2 text-lg">💬</div>
              <p className="text-sm">Start a conversation with your AI Trading Coach</p>
              <p className="text-xs mt-1">Ask about trading psychology, strategies, or market analysis</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced scroll to bottom button with progressive feedback */}
      {!isAtBottom && (
        <div className="absolute bottom-4 right-4 flex flex-col items-end space-y-2">
          {/* Progressive auto-scroll feedback */}
          {autoScrollZone === 'warning' && (
            <div className="bg-amber-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              <span>Near bottom</span>
            </div>
          )}
          
          {!shouldAutoScroll && (
            <div className={cn(
              'text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1',
              autoScrollZone === 'none' ? 'bg-blue-600' : 'bg-amber-500'
            )}>
              {autoScrollZone === 'none' ? (
                <span>New messages</span>
              ) : (
                <span>Auto-scroll paused</span>
              )}
            </div>
          )}
          
          <button
            onClick={() => scrollToBottom(true)}
            className={cn(
              'text-white p-3 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105',
              autoScrollZone === 'warning' ? (
                'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 animate-pulse'
              ) : (
                'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              )
            )}
            aria-label="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}

      {/* Enhanced performance indicator for development */}
      {enablePerformanceMonitoring && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded-lg space-y-1">
          <div className="flex items-center justify-between space-x-4">
            <span>Rendering:</span>
            <span className="font-mono">{visibleMessages.length}/{messages.length}</span>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <span>FPS:</span>
            <span className={cn(
              'font-mono',
              performanceMetrics.fps >= 55 ? 'text-green-400' :
              performanceMetrics.fps >= 45 ? 'text-yellow-400' : 'text-red-400'
            )}>
              {performanceMetrics.fps}
            </span>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <span>Jank:</span>
            <span className={cn(
              'font-mono',
              performanceMetrics.scrollJank === 0 ? 'text-green-400' :
              performanceMetrics.scrollJank < 5 ? 'text-yellow-400' : 'text-red-400'
            )}>
              {performanceMetrics.scrollJank}
            </span>
          </div>
          {performanceMetrics.memoryUsage && (
            <div className="flex items-center justify-between space-x-4">
              <span>Memory:</span>
              <span className="font-mono">
                {Math.round(performanceMetrics.memoryUsage / 1024 / 1024)}MB
              </span>
            </div>
          )}
          <div className="flex items-center justify-between space-x-4">
            <span>Render:</span>
            <span className="font-mono">
              {Math.round(performanceMetrics.renderTime * 100) / 100}ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
};