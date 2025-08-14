# PRD: Chat Container Component

## 1. Overview

This PRD defines the main chat container component for the Elite Trading Coach AI application, serving as the primary interface for real-time conversations between users and the AI trading coach.

## 2. Feature Requirements

### 2.1 Functional Requirements
- **FR-1**: Create main chat container with message display and input areas
- **FR-2**: Implement real-time message rendering and updates
- **FR-3**: Handle loading states for message sending and receiving
- **FR-4**: Support conversation persistence and history loading
- **FR-5**: Integrate with Socket.IO for real-time communication

### 2.2 Non-Functional Requirements
- **NFR-1**: Smooth scrolling with 60fps performance
- **NFR-2**: Handle 1000+ messages without performance degradation
- **NFR-3**: Responsive design for mobile and desktop
- **NFR-4**: Auto-scroll to latest messages

## 3. User Stories

### 3.1 Primary User Stories
- **US-1**: As a user, I want a clean chat interface so I can easily communicate with the AI trading coach
- **US-2**: As a user, I want my conversation history preserved so I can review past trading advice
- **US-3**: As a mobile user, I want the chat to work seamlessly on my phone

### 3.2 Edge Cases
- **EC-1**: Handling extremely long conversations with thousands of messages
- **EC-2**: Managing network disconnections and reconnections
- **EC-3**: Dealing with rapid message sequences

## 4. Technical Specifications

### 4.1 Chat Container Component
```typescript
// src/components/chat/ChatContainer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatStore } from '@stores/chatStore';
import { useSocket } from '@hooks/useSocket';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { Message } from '@types/index';

export const ChatContainer: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    currentConversation,
    loadMessages,
    addMessage,
    sendMessage,
    isTyping
  } = useChatStore();
  
  const { socket, isConnected: socketConnected } = useSocket();

  // Load conversation and messages on mount
  useEffect(() => {
    const initializeChat = async () => {
      if (conversationId) {
        setIsLoading(true);
        await loadMessages(conversationId);
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, [conversationId, loadMessages]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: Message) => {
      addMessage(message);
      scrollToBottom();
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      // Handle typing indicators
    };

    socket.on('message', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.off('message', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket, addMessage]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, metadata?: any) => {
    if (!conversationId) return;
    
    try {
      await sendMessage({
        conversationId,
        content,
        type: 'user',
        metadata
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error (show toast, etc.)
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading conversation...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {currentConversation?.title || 'AI Trading Coach'}
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages} 
          isTyping={isTyping}
          className="h-full"
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={!isConnected}
          placeholder={
            isConnected 
              ? "Type your trading question..." 
              : "Connecting..."
          }
        />
      </div>
    </div>
  );
};
```

### 4.2 Chat Store Integration
```typescript
// src/stores/chatStore.ts
import { create } from 'zustand';
import { Message, Conversation } from '@types/index';
import { chatAPI } from '@services/chatAPI';

interface ChatState {
  messages: Message[];
  currentConversation: Conversation | null;
  isTyping: boolean;
  loadMessages: (conversationId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  sendMessage: (data: Partial<Message>) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentConversation: null,
  isTyping: false,

  loadMessages: async (conversationId: string) => {
    try {
      const response = await chatAPI.getMessages(conversationId);
      set({ 
        messages: response.data.messages,
        currentConversation: response.data.conversation
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  },

  addMessage: (message: Message) => {
    set(state => ({
      messages: [...state.messages, message]
    }));
  },

  sendMessage: async (messageData: Partial<Message>) => {
    try {
      const response = await chatAPI.sendMessage(messageData);
      // Message will be added via Socket.IO event
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  setTyping: (isTyping: boolean) => {
    set({ isTyping });
  }
}));
```

## 5. Acceptance Criteria

### 5.1 Definition of Done
- [ ] Chat container component renders correctly
- [ ] Real-time message display working
- [ ] Message input integration functional
- [ ] Socket.IO connection status displayed
- [ ] Auto-scroll to latest messages
- [ ] Loading states implemented
- [ ] Error handling for failed operations
- [ ] Mobile responsive design

### 5.2 Testing Requirements
- [ ] Component renders without errors
- [ ] Real-time messaging works correctly
- [ ] Auto-scroll behavior verified
- [ ] Connection status updates properly
- [ ] Mobile layout tested

## 6. Dependencies

### 6.1 Technical Dependencies
- Message List component (PRD-1.1.4.2)
- Message Input component (PRD-1.1.4.4)
- Socket.IO client integration (PRD-1.1.6.1)
- Chat state management store
- Base layout component (PRD-1.1.3.4)

### 6.2 Business Dependencies
- Real-time messaging requirements
- Conversation persistence needs
- User interface specifications

## 7. Risks and Mitigations

### 7.1 Technical Risks
- **Risk**: Performance issues with large message lists
  - **Mitigation**: Implement virtual scrolling for large conversations
- **Risk**: Socket connection instability
  - **Mitigation**: Implement reconnection logic and offline indicators

### 7.2 Business Risks
- **Risk**: Poor chat UX affecting user engagement
  - **Mitigation**: Focus on smooth interactions and responsive design

## 8. Success Metrics

### 8.1 Technical Metrics
- 60fps smooth scrolling
- < 2 second message load time
- 99% real-time message delivery
- Support for 1000+ messages

### 8.2 Business Metrics
- Seamless chat experience
- High user engagement with AI coach
- Minimal user complaints about chat functionality

## 9. Implementation Timeline

### 9.1 Development Phases
- **Phase 1**: Basic container structure (4 hours)
- **Phase 2**: Socket.IO integration (5 hours)
- **Phase 3**: State management integration (4 hours)
- **Phase 4**: Testing and optimization (5 hours)

### 9.2 Milestones
- **M1**: Container component working (Day 1)
- **M2**: Real-time messaging functional (Day 2)
- **M3**: State management integrated (Day 2)
- **M4**: Testing and polish completed (Day 3)

## 10. Appendices

### 10.1 Performance Optimizations
```typescript
// Virtual scrolling for large message lists
const VirtualizedMessageList = React.memo(({ messages }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  // Implement virtual scrolling logic
  return (
    <div className="virtual-scroll-container">
      {messages.slice(visibleRange.start, visibleRange.end).map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
});
```

### 10.2 Error Handling
```typescript
// Error boundary for chat container
class ChatErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3>Something went wrong with the chat</h3>
            <button onClick={() => window.location.reload()}>
              Reload Chat
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 10.3 Accessibility Features
- ARIA labels for chat regions
- Keyboard navigation support
- Screen reader announcements for new messages
- Focus management for message input
- High contrast mode support