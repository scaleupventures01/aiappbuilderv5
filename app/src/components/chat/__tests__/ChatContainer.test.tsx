import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ChatContainer, ChatErrorBoundary } from '../ChatContainer';
import { useChatStore } from '../../../stores/chatStore';
import { useSocket } from '../../../hooks/useSocket';
import { usePerformanceMonitor } from '../../../hooks/usePerformanceMonitor';

// Mock dependencies
vi.mock('../../../stores/chatStore');
vi.mock('../../../hooks/useSocket');
vi.mock('../../../hooks/usePerformanceMonitor');
vi.mock('../../../utils/accessibility');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ conversationId: 'test-conversation-1' })
  };
});

// Mock components
vi.mock('../MessageList', () => ({
  MessageList: ({ messages, isTyping, className }: any) => (
    <div data-testid="message-list" className={className}>
      Messages: {messages.length}
      {isTyping && <div data-testid="typing-indicator">Typing...</div>}
    </div>
  )
}));

vi.mock('../MessageInput', () => ({
  MessageInput: ({ onSendMessage, disabled, placeholder }: any) => (
    <div data-testid="message-input">
      <input
        data-testid="message-input-field"
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value === 'send') {
            onSendMessage('test message');
          }
        }}
      />
    </div>
  )
}));

vi.mock('../../ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: any) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  )
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ChatContainer', () => {
  const mockChatStore = {
    messages: [],
    currentConversation: null,
    loadMessages: vi.fn(),
    addMessage: vi.fn(),
    sendMessage: vi.fn(),
    isTyping: false,
    connectionStatus: 'disconnected'
  };

  const mockSocket = {
    socket: {
      on: vi.fn(),
      off: vi.fn(),
      connected: true
    },
    isConnected: true
  };

  const mockPerformanceMonitor = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useChatStore as any).mockReturnValue(mockChatStore);
    (useSocket as any).mockReturnValue(mockSocket);
    (usePerformanceMonitor as any).mockReturnValue(mockPerformanceMonitor);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders loading state when loading messages', () => {
      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading conversation...')).toBeInTheDocument();
    });

    test('renders chat interface when loaded', async () => {
      mockChatStore.loadMessages.mockResolvedValue(undefined);
      
      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      expect(screen.getByText('AI Trading Coach')).toBeInTheDocument();
      expect(screen.getByTestId('message-list')).toBeInTheDocument();
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });

    test('displays conversation title when available', async () => {
      mockChatStore.currentConversation = {
        id: 'test-1',
        title: 'Trading Strategy Discussion',
        description: 'Discussion about swing trading'
      };
      mockChatStore.loadMessages.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Trading Strategy Discussion')).toBeInTheDocument();
      });
    });

    test('shows message count in header', async () => {
      mockChatStore.messages = [
        { id: '1', content: 'Hello', type: 'user' },
        { id: '2', content: 'Hi there!', type: 'ai' },
        { id: '3', content: 'How can I help?', type: 'ai' }
      ];
      mockChatStore.loadMessages.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('3 messages')).toBeInTheDocument();
      });
    });
  });

  describe('Connection Status', () => {
    test('displays connected status when socket is connected', async () => {
      mockChatStore.loadMessages.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });

    test('displays disconnected status when socket is disconnected', async () => {
      mockSocket.isConnected = false;
      mockSocket.socket.connected = false;
      mockChatStore.loadMessages.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });
    });

    test('displays connecting status appropriately', async () => {
      mockSocket.isConnected = false;
      mockSocket.socket.connected = true;
      mockChatStore.loadMessages.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument();
      });
    });
  });

  describe('Message Handling', () => {
    test('sends message through chat store', async () => {
      mockChatStore.loadMessages.mockResolvedValue(undefined);
      mockChatStore.sendMessage.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('message-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('message-input-field');
      fireEvent.change(input, { target: { value: 'send' } });

      await waitFor(() => {
        expect(mockChatStore.sendMessage).toHaveBeenCalledWith({
          conversationId: 'test-conversation-1',
          content: 'test message',
          type: 'user',
          metadata: expect.objectContaining({
            timestamp: expect.any(Number)
          })
        });
      });
    });

    test('handles message send errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockChatStore.loadMessages.mockResolvedValue(undefined);
      mockChatStore.sendMessage.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('message-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('message-input-field');
      fireEvent.change(input, { target: { value: 'send' } });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to send message:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Socket Event Handling', () => {
    test('registers socket event listeners on mount', async () => {
      mockChatStore.loadMessages.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSocket.socket.on).toHaveBeenCalledWith('message', expect.any(Function));
        expect(mockSocket.socket.on).toHaveBeenCalledWith('typing', expect.any(Function));
        expect(mockSocket.socket.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockSocket.socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(mockSocket.socket.on).toHaveBeenCalledWith('error', expect.any(Function));
      });
    });

    test('handles incoming messages', async () => {
      mockChatStore.loadMessages.mockResolvedValue(undefined);
      let messageHandler: Function;

      mockSocket.socket.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      });

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(messageHandler).toBeDefined();
      });

      const testMessage = {
        id: 'new-message',
        content: 'New AI response',
        type: 'ai'
      };

      act(() => {
        messageHandler!(testMessage);
      });

      expect(mockChatStore.addMessage).toHaveBeenCalledWith(testMessage);
    });

    test('handles typing indicators', async () => {
      mockChatStore.loadMessages.mockResolvedValue(undefined);
      let typingHandler: Function;

      mockSocket.socket.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'typing') {
          typingHandler = handler;
        }
      });

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(typingHandler).toBeDefined();
      });

      act(() => {
        typingHandler!({ userId: 'ai', isTyping: true, timestamp: Date.now() });
      });

      // The component should update typing state
      expect(mockChatStore.setTyping).toHaveBeenCalledWith(true);
    });

    test('cleans up socket listeners on unmount', async () => {
      mockChatStore.loadMessages.mockResolvedValue(undefined);

      const { unmount } = render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSocket.socket.on).toHaveBeenCalled();
      });

      unmount();

      expect(mockSocket.socket.off).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockSocket.socket.off).toHaveBeenCalledWith('typing', expect.any(Function));
      expect(mockSocket.socket.off).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.socket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.socket.off).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Performance Monitoring', () => {
    test('initializes performance monitoring', () => {
      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      expect(mockPerformanceMonitor).toHaveBeenCalledWith('ChatContainer');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', async () => {
      mockChatStore.loadMessages.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        const main = screen.getByRole('main');
        expect(main).toHaveAttribute('aria-label', 'Trading coach chat interface');
      });
    });

    test('announces loading state to screen readers', () => {
      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      // Should announce loading state
      expect(screen.getByText('Loading conversation...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles conversation loading errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockChatStore.loadMessages.mockRejectedValue(new Error('Failed to load'));

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load conversation:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    test('handles socket errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockChatStore.loadMessages.mockResolvedValue(undefined);
      let errorHandler: Function;

      mockSocket.socket.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'error') {
          errorHandler = handler;
        }
      });

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(errorHandler).toBeDefined();
      });

      act(() => {
        errorHandler!(new Error('Socket error'));
      });

      expect(consoleError).toHaveBeenCalledWith(
        'Socket.IO error:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('Input States', () => {
    test('disables input when disconnected', async () => {
      mockSocket.isConnected = false;
      mockChatStore.loadMessages.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        const input = screen.getByTestId('message-input-field');
        expect(input).toHaveAttribute('disabled');
      });
    });

    test('enables input when connected', async () => {
      mockChatStore.loadMessages.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        const input = screen.getByTestId('message-input-field');
        expect(input).not.toHaveAttribute('disabled');
      });
    });

    test('shows appropriate placeholder based on connection status', async () => {
      mockSocket.isConnected = false;
      mockChatStore.loadMessages.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <ChatContainer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Chat disconnected/)).toBeInTheDocument();
      });
    });
  });
});

describe('ChatErrorBoundary', () => {
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  test('renders children when no error occurs', () => {
    render(
      <ChatErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ChatErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  test('renders error UI when error occurs', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ChatErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ChatErrorBoundary>
    );

    expect(screen.getByText('Something went wrong with the chat')).toBeInTheDocument();
    expect(screen.getByText('We\'re having trouble loading the chat interface.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload Chat' })).toBeInTheDocument();

    consoleError.mockRestore();
  });

  test('reload button triggers page reload', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    render(
      <ChatErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ChatErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: 'Reload Chat' });
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});