# PRD: Message List Component

## 1. Overview

This PRD defines the message list component for displaying chat messages in the Elite Trading Coach AI application, providing an efficient and user-friendly interface for viewing conversation history with proper rendering and scrolling behavior.

## 2. Feature Requirements

### 2.1 Functional Requirements
- **FR-1**: Display messages in chronological order with proper formatting
- **FR-2**: Support different message types (user, AI, system)
- **FR-3**: Implement efficient scrolling with performance optimization
- **FR-4**: Show typing indicators when AI is responding
- **FR-5**: Support message timestamps and read status

### 2.2 Non-Functional Requirements
- **NFR-1**: Render 1000+ messages without performance lag
- **NFR-2**: Smooth scrolling at 60fps
- **NFR-3**: Memory-efficient virtual scrolling for large lists
- **NFR-4**: Responsive design for all screen sizes

## 3. User Stories

### 3.1 Primary User Stories
- **US-1**: As a user, I want to see all my messages clearly formatted so I can follow the conversation flow
- **US-2**: As a user, I want smooth scrolling through message history so I can review past conversations easily
- **US-3**: As a user, I want to see when the AI is typing so I know a response is coming

### 3.2 Edge Cases
- **EC-1**: Handling very long messages that exceed viewport width
- **EC-2**: Managing performance with thousands of historical messages
- **EC-3**: Dealing with rapid message sequences

## 4. Technical Specifications

### 4.1 Message List Component
```typescript
// src/components/chat/MessageList.tsx
import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Message } from '@types/index';
import { useVirtualizer } from '@tanstack/react-virtual';

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

  // Virtual scrolling for performance with large message lists
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 80, // Estimated message height
    overscan: 10 // Render extra items for smooth scrolling
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && scrollElementRef.current) {
      const element = scrollElementRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, isTyping, shouldAutoScroll]);

  // Check if user has scrolled up to disable auto-scroll
  const handleScroll = () => {
    if (!scrollElementRef.current) return;
    
    const element = scrollElementRef.current;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
    setShouldAutoScroll(isAtBottom);

    // Load more messages when scrolled to top
    if (element.scrollTop < 100 && hasMore && onLoadMore) {
      onLoadMore();
    }
  };

  const scrollToBottom = () => {
    setShouldAutoScroll(true);
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = scrollElementRef.current.scrollHeight;
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Message container with virtual scrolling */}
      <div
        ref={scrollElementRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
        onScroll={handleScroll}
      >
        {/* Load more indicator */}
        {hasMore && (
          <div className="flex justify-center p-4">
            <button
              onClick={onLoadMore}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {/* Virtual list container */}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const message = messages[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`
                }}
              >
                <MessageBubble
                  message={message}
                  showTimestamp={shouldShowTimestamp(message, messages, virtualItem.index)}
                />
              </div>
            );
          })}
        </div>

        {/* Typing indicator */}
        {isTyping && (
          <div className="px-4 py-2">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {!shouldAutoScroll && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={scrollToBottom}
            className="bg-primary-600 text-white p-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
            aria-label="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to determine if timestamp should be shown
const shouldShowTimestamp = (message: Message, messages: Message[], index: number): boolean => {
  if (index === 0) return true;
  
  const previousMessage = messages[index - 1];
  const currentTime = new Date(message.createdAt);
  const previousTime = new Date(previousMessage.createdAt);
  
  // Show timestamp if more than 5 minutes have passed
  const timeDiff = currentTime.getTime() - previousTime.getTime();
  return timeDiff > 5 * 60 * 1000; // 5 minutes
};
```

### 4.2 Typing Indicator Component
```typescript
// src/components/chat/TypingIndicator.tsx
import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        AI is typing...
      </span>
    </div>
  );
};
```

### 4.3 Message Grouping Logic
```typescript
// src/utils/messageGrouping.ts
import { Message } from '@types/index';

export interface MessageGroup {
  messages: Message[];
  sender: string;
  type: 'user' | 'ai' | 'system';
  timestamp: string;
}

export const groupMessages = (messages: Message[]): MessageGroup[] => {
  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  for (const message of messages) {
    const shouldStartNewGroup = !currentGroup || 
      currentGroup.sender !== message.userId || 
      currentGroup.type !== message.type ||
      isTimestampBreak(currentGroup.timestamp, message.createdAt);

    if (shouldStartNewGroup) {
      currentGroup = {
        messages: [message],
        sender: message.userId,
        type: message.type,
        timestamp: message.createdAt
      };
      groups.push(currentGroup);
    } else {
      currentGroup.messages.push(message);
    }
  }

  return groups;
};

const isTimestampBreak = (lastTimestamp: string, currentTimestamp: string): boolean => {
  const lastTime = new Date(lastTimestamp);
  const currentTime = new Date(currentTimestamp);
  const timeDiff = currentTime.getTime() - lastTime.getTime();
  
  // Group messages within 2 minutes of each other
  return timeDiff > 2 * 60 * 1000;
};
```

## 5. Acceptance Criteria

### 5.1 Definition of Done
- [ ] Message list renders all message types correctly
- [ ] Virtual scrolling implemented for performance
- [ ] Auto-scroll to bottom for new messages
- [ ] Typing indicator displays appropriately
- [ ] Timestamp grouping working
- [ ] Scroll to bottom button functional
- [ ] Load more messages capability
- [ ] Mobile responsive design

### 5.2 Testing Requirements
- [ ] Performance tested with 1000+ messages
- [ ] Scrolling behavior verified
- [ ] Typing indicator functionality tested
- [ ] Timestamp display logic validated
- [ ] Mobile layout and scrolling tested

## 6. Dependencies

### 6.1 Technical Dependencies
- Message Bubble component (PRD-1.1.4.3)
- Virtual scrolling library (@tanstack/react-virtual)
- TailwindCSS for styling
- Message type definitions

### 6.2 Business Dependencies
- Message display requirements
- Performance expectations
- User experience specifications

## 7. Risks and Mitigations

### 7.1 Technical Risks
- **Risk**: Poor performance with large message lists
  - **Mitigation**: Implement virtual scrolling and message pagination
- **Risk**: Complex scroll behavior causing UX issues
  - **Mitigation**: Thorough testing and user feedback

### 7.2 Business Risks
- **Risk**: Difficult message navigation affecting user satisfaction
  - **Mitigation**: Intuitive scroll controls and visual feedback

## 8. Success Metrics

### 8.1 Technical Metrics
- Smooth 60fps scrolling performance
- < 100ms render time for new messages
- Support for 1000+ messages without lag
- < 50MB memory usage for large conversations

### 8.2 Business Metrics
- Efficient message history browsing
- Seamless real-time conversation flow
- High user satisfaction with chat interface

## 9. Implementation Timeline

### 9.1 Development Phases
- **Phase 1**: Basic message list structure (4 hours)
- **Phase 2**: Virtual scrolling implementation (6 hours)
- **Phase 3**: Auto-scroll and typing indicators (4 hours)
- **Phase 4**: Performance optimization and testing (4 hours)

### 9.2 Milestones
- **M1**: Basic message display working (Day 1)
- **M2**: Virtual scrolling implemented (Day 2)
- **M3**: Auto-scroll and indicators functional (Day 2)
- **M4**: Performance optimized and tested (Day 3)

## 10. Appendices

### 10.1 Performance Optimizations
```typescript
// Message memoization for performance
const MemoizedMessageBubble = React.memo(MessageBubble, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id &&
         prevProps.showTimestamp === nextProps.showTimestamp;
});

// Intersection observer for auto-scroll detection
const useAutoScrollDetection = (containerRef: RefObject<HTMLElement>) => {
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsAtBottom(entry.isIntersecting),
      { threshold: 1.0 }
    );
    
    const sentinel = containerRef.current?.lastElementChild;
    if (sentinel) observer.observe(sentinel);
    
    return () => observer.disconnect();
  }, [containerRef]);
  
  return isAtBottom;
};
```

### 10.2 Accessibility Features
- ARIA live regions for new message announcements
- Keyboard navigation for scrolling
- Focus management for screen readers
- High contrast mode support
- Reduced motion support for animations

### 10.3 Custom Scrollbar Styling
```css
/* Custom scrollbar for webkit browsers */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
```