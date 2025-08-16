import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Message } from '@/types/chat';
import { cn } from '@/utils/cn';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping = false,
  className = '',
  onLoadMore,
  hasMore = false
}) => {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && scrollElementRef.current) {
      const element = scrollElementRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, isTyping, shouldAutoScroll]);

  // Check if user has scrolled up to disable auto-scroll
  const handleScroll = async () => {
    if (!scrollElementRef.current) return;
    
    const element = scrollElementRef.current;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
    setShouldAutoScroll(isAtBottom);

    // Load more messages when scrolled to top
    if (element.scrollTop < 100 && hasMore && onLoadMore && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        await onLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const scrollToBottom = () => {
    setShouldAutoScroll(true);
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = scrollElementRef.current.scrollHeight;
    }
  };

  // Helper function to determine if timestamp should be shown
  const shouldShowTimestamp = (message: Message, index: number): boolean => {
    if (index === 0) return true;
    
    const previousMessage = messages[index - 1];
    const currentTime = new Date(message.createdAt);
    const previousTime = new Date(previousMessage.createdAt);
    
    // Show timestamp if more than 5 minutes have passed or different sender
    const timeDiff = currentTime.getTime() - previousTime.getTime();
    return timeDiff > 5 * 60 * 1000 || previousMessage.userId !== message.userId;
  };

  return (
    <div className={cn('flex flex-col h-full relative', className)}>
      {/* Message container */}
      <div
        ref={scrollElementRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scroll-smooth"
        onScroll={handleScroll}
        style={{ minHeight: 0 }}
      >
        {/* Load more indicator */}
        {hasMore && (
          <div className="flex justify-center p-4">
            {isLoadingMore ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
                <span>Loading earlier messages...</span>
              </div>
            ) : (
              <button
                onClick={onLoadMore}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
                disabled={isLoadingMore}
              >
                Load earlier messages
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="px-4 pb-4">
          {messages.map((message, index) => (
            <div key={message.id} className={index > 0 ? "mt-4" : ""}>
              <MessageBubble
                message={message}
                showTimestamp={shouldShowTimestamp(message, index)}
              />
            </div>
          ))}
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

      {/* Scroll to bottom button */}
      {!shouldAutoScroll && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={scrollToBottom}
            className="bg-primary-600 text-white p-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};