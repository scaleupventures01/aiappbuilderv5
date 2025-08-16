import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatStore } from '../../stores/chatStore';
import { useSocket } from '../../hooks/useSocket';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Message } from '@/types/chat';
import { ScreenReader } from '../../utils/accessibility';

interface ChatContainerProps {
  className?: string;
}

/**
 * Main chat container component for Elite Trading Coach AI
 * Implements real-time messaging with performance optimization
 * 
 * Features:
 * - Real-time Socket.IO messaging
 * - Message persistence and history loading
 * - Auto-scroll to latest messages
 * - Connection status monitoring
 * - Performance monitoring for 1000+ messages
 * - Accessibility compliance
 */
const ChatContainerComponent: React.FC<ChatContainerProps> = ({ className = '' }) => {
  usePerformanceMonitor('ChatContainer');
  
  const { conversationId } = useParams<{ conversationId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    currentConversation,
    loadMessages,
    addMessage,
    sendMessage,
    isTyping,
    connectionStatus
  } = useChatStore();
  
  const { socket, isConnected: socketConnected } = useSocket();

  // Load conversation and messages on mount
  useEffect(() => {
    const initializeChat = async () => {
      if (conversationId) {
        setIsLoading(true);
        try {
          await loadMessages(conversationId);
          ScreenReader.announce('Chat conversation loaded successfully');
        } catch (error) {
          console.error('Failed to load conversation:', error);
          ScreenReader.announce('Failed to load chat conversation', 'assertive');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, [conversationId, loadMessages]);

  // Socket event handlers with error handling
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: Message) => {
      try {
        addMessage(message);
        
        // Announce new messages to screen readers
        if (message.type === 'ai') {
          ScreenReader.announce('New AI response received');
        }
        
        scrollToBottom();
      } catch (error) {
        console.error('Error handling incoming message:', error);
      }
    };

    const handleTyping = (data: { userId: string; isTyping: boolean; timestamp: number }) => {
      // Handle typing indicators with timeout
      try {
        useChatStore.getState().setTyping(data.isTyping);
        
        if (data.isTyping) {
          // Auto-clear typing indicator after 5 seconds
          setTimeout(() => {
            useChatStore.getState().setTyping(false);
          }, 5000);
        }
      } catch (error) {
        console.error('Error handling typing indicator:', error);
      }
    };

    const handleConnect = () => {
      setIsConnected(true);
      ScreenReader.announce('Chat connected');
      console.log('Socket.IO connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      ScreenReader.announce('Chat disconnected', 'assertive');
      console.log('Socket.IO disconnected');
    };

    const handleError = (error: any) => {
      console.error('Socket.IO error:', error);
      ScreenReader.announce('Chat connection error', 'assertive');
    };

    // Register socket event listeners
    socket.on('message', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);

    return () => {
      socket.off('message', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
    };
  }, [socket, addMessage]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // Monitor message count changes for auto-scroll
  useEffect(() => {
    if (messages.length > lastMessageCount) {
      scrollToBottom();
      setLastMessageCount(messages.length);
    }
  }, [messages.length, lastMessageCount, scrollToBottom]);

  const handleSendMessage = async (content: string, metadata?: any) => {
    if (!content.trim() || !conversationId) return;
    
    try {
      await sendMessage({
        conversationId,
        content: content.trim(),
        type: 'user',
        metadata: {
          timestamp: Date.now(),
          ...metadata
        }
      });
      
      ScreenReader.announce('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
      ScreenReader.announce('Failed to send message', 'assertive');
      
      // TODO: Show user-friendly error notification
      // Could integrate with a toast notification system
    }
  };

  // Connection status with more detailed states
  const getConnectionStatus = () => {
    if (!socket) return { status: 'disconnected', color: 'bg-gray-500', text: 'Not connected' };
    if (isConnected && socketConnected) return { status: 'connected', color: 'bg-green-500', text: 'Connected' };
    if (socket.connected) return { status: 'connecting', color: 'bg-yellow-500', text: 'Connecting...' };
    return { status: 'disconnected', color: 'bg-red-500', text: 'Disconnected' };
  };

  const connectionInfo = getConnectionStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">
          Loading conversation...
        </span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}
      role="main"
      aria-label="Trading coach chat interface"
    >
      {/* Chat header with connection status */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentConversation?.title || 'AI Trading Coach'}
            </h1>
            {currentConversation?.description && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentConversation.description}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Message count indicator */}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {messages.length} messages
            </span>
            
            {/* Connection status indicator */}
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full ${connectionInfo.color} transition-colors duration-200`}
                aria-hidden="true"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {connectionInfo.text}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages area with error boundary */}
      <div className="flex-1 overflow-hidden relative" style={{ minHeight: 0 }}>
        <MessageList 
          messages={messages} 
          isTyping={isTyping}
          className="h-full"
          conversationId={conversationId}
        />
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input area */}
      <footer className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 relative z-10">
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={!isConnected || isLoading}
          placeholder={
            isConnected 
              ? "Ask your trading coach anything..." 
              : connectionInfo.status === 'connecting'
                ? "Connecting to chat..."
                : "Chat disconnected - reconnecting..."
          }
          isTyping={isTyping}
          className="bg-transparent"
        />
      </footer>
    </div>
  );
};

// Memoize the component for performance with large message lists
export const ChatContainer = React.memo(ChatContainerComponent);

// Error boundary for the chat container
export class ChatErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat container error:', error, errorInfo);
    ScreenReader.announce('Chat error occurred', 'assertive');
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
          <div className="text-center p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong with the chat
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We're having trouble loading the chat interface.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Chat
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default ChatContainer;