import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { useChatStore } from '../chatStore';
import { chatAPI } from '../../services/chatAPI';
import type { Message, Conversation } from '../../types/chat';

// Mock the chat API
vi.mock('../../services/chatAPI');

// Mock localStorage for zustand persist
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('ChatStore', () => {
  const mockChatAPI = chatAPI as any;
  
  const mockMessage: Message = {
    id: 'msg-1',
    conversationId: 'conv-1',
    userId: 'user-1',
    content: 'Hello, AI coach!',
    type: 'user',
    status: 'sent',
    metadata: {},
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  };

  const mockConversation: Conversation = {
    id: 'conv-1',
    title: 'Trading Strategy Discussion',
    description: 'Learning about swing trading',
    type: 'ai_coaching',
    status: 'active',
    participants: [],
    settings: {
      isPublic: false,
      allowInvites: false,
      allowFiles: true,
      notificationsEnabled: true,
      aiCoachEnabled: true,
      tradingInsightsEnabled: true,
      psychologyInsightsEnabled: true
    },
    metadata: {
      totalMessages: 1,
      messageCountByType: { user: 1, ai: 0, system: 0, trading_alert: 0, psychology_insight: 0, market_analysis: 0, trade_recommendation: 0 }
    },
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  };

  beforeEach(() => {
    // Reset store state
    useChatStore.getState().clearMessages();
    useChatStore.getState().clearCache();
    useChatStore.getState().clearOfflineQueue();
    useChatStore.setState({
      error: null,
      isLoading: false,
      isTyping: false,
      connectionState: {
        status: 'disconnected',
        lastConnected: null,
        reconnectAttempts: 0
      },
      optimisticMessages: {},
      lastSeen: {},
      unreadCounts: {}
    });
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Message Loading', () => {
    test('loads messages successfully', async () => {
      mockChatAPI.getMessages.mockResolvedValue({
        success: true,
        data: {
          messages: [mockMessage],
          conversation: mockConversation
        }
      });

      const store = useChatStore.getState();
      await store.loadMessages('conv-1');

      const state = useChatStore.getState();
      expect(state.messages).toEqual([mockMessage]);
      expect(state.currentConversation).toEqual(mockConversation);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('handles loading errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockChatAPI.getMessages.mockRejectedValue(new Error('Network error'));

      const store = useChatStore.getState();
      await store.loadMessages('conv-1');

      const state = useChatStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.currentConversation).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to load messages');

      consoleError.mockRestore();
    });

    test('caches loaded messages', async () => {
      mockChatAPI.getMessages.mockResolvedValue({
        success: true,
        data: {
          messages: [mockMessage],
          conversation: mockConversation
        }
      });

      const store = useChatStore.getState();
      await store.loadMessages('conv-1');

      // Second call should use cache
      await store.loadMessages('conv-1');

      expect(mockChatAPI.getMessages).toHaveBeenCalledTimes(1);
    });

    test('loads more messages with pagination', async () => {
      const existingMessage = { ...mockMessage, id: 'msg-0' };
      const newMessage = { ...mockMessage, id: 'msg-2' };
      
      // Set initial state
      useChatStore.setState({ messages: [existingMessage] });

      mockChatAPI.getMessages.mockResolvedValue({
        success: true,
        data: {
          messages: [newMessage],
          conversation: mockConversation
        }
      });

      const store = useChatStore.getState();
      await store.loadMoreMessages('conv-1');

      const state = useChatStore.getState();
      expect(state.messages).toEqual([existingMessage, newMessage]);
    });
  });

  describe('Message Sending', () => {
    test('sends message with optimistic updates', async () => {
      mockChatAPI.sendMessage.mockResolvedValue({
        success: true,
        data: { ...mockMessage, id: 'real-msg-1' }
      });

      const store = useChatStore.getState();
      const sendPromise = store.sendMessage({
        conversationId: 'conv-1',
        content: 'Hello, AI coach!',
        type: 'user'
      });

      // Should immediately add optimistic message
      let state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].content).toBe('Hello, AI coach!');
      expect(state.messages[0].id).toMatch(/^temp_/);

      await sendPromise;

      // Should replace with real message
      state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].id).toBe('real-msg-1');
      expect(Object.keys(state.optimisticMessages)).toHaveLength(0);
    });

    test('handles send failures', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockChatAPI.sendMessage.mockRejectedValue(new Error('Send failed'));

      const store = useChatStore.getState();
      
      try {
        await store.sendMessage({
          conversationId: 'conv-1',
          content: 'Hello, AI coach!',
          type: 'user'
        });
      } catch (error) {
        // Expected to throw
      }

      const state = useChatStore.getState();
      expect(state.error).toBe('Failed to send message');
      expect(state.messages).toHaveLength(1); // Optimistic message remains
      expect(Object.keys(state.optimisticMessages)).toHaveLength(1);
      expect(Object.values(state.optimisticMessages)[0].status).toBe('failed');

      consoleError.mockRestore();
    });

    test('retries failed messages', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // First attempt fails
      mockChatAPI.sendMessage.mockRejectedValueOnce(new Error('Network error'));
      // Retry succeeds
      mockChatAPI.sendMessage.mockResolvedValueOnce({
        success: true,
        data: { ...mockMessage, id: 'retry-msg-1' }
      });

      const store = useChatStore.getState();
      
      // Initial send fails
      try {
        await store.sendMessage({
          conversationId: 'conv-1',
          content: 'Hello, AI coach!',
          type: 'user'
        });
      } catch (error) {
        // Expected
      }

      let state = useChatStore.getState();
      const tempId = state.messages[0].id;
      expect(state.optimisticMessages[tempId].status).toBe('failed');

      // Retry
      await store.retrySendMessage(tempId);

      state = useChatStore.getState();
      expect(state.messages[0].id).toBe('retry-msg-1');
      expect(Object.keys(state.optimisticMessages)).toHaveLength(0);

      consoleError.mockRestore();
    });

    test('adds to offline queue when offline', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      mockChatAPI.sendMessage.mockRejectedValue(new Error('Network error'));

      const store = useChatStore.getState();
      
      try {
        await store.sendMessage({
          conversationId: 'conv-1',
          content: 'Offline message',
          type: 'user'
        });
      } catch (error) {
        // Expected
      }

      const state = useChatStore.getState();
      expect(state.offlineQueue).toHaveLength(1);
      expect(state.offlineQueue[0].content).toBe('Offline message');

      Object.defineProperty(navigator, 'onLine', { value: true });
      consoleError.mockRestore();
    });
  });

  describe('Message Management', () => {
    test('adds message without duplicates', () => {
      const store = useChatStore.getState();
      
      store.addMessage(mockMessage);
      store.addMessage(mockMessage); // Duplicate
      
      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
    });

    test('optimistic message management', () => {
      const store = useChatStore.getState();
      
      const tempId = store.addOptimisticMessage({
        conversationId: 'conv-1',
        content: 'Test message',
        type: 'user'
      });

      let state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.optimisticMessages[tempId]).toBeDefined();
      expect(state.optimisticMessages[tempId].status).toBe('sending');

      store.updateOptimisticMessage(tempId, { status: 'failed' });
      
      state = useChatStore.getState();
      expect(state.optimisticMessages[tempId].status).toBe('failed');

      store.removeOptimisticMessage(tempId);
      
      state = useChatStore.getState();
      expect(state.messages).toHaveLength(0);
      expect(state.optimisticMessages[tempId]).toBeUndefined();
    });
  });

  describe('Connection Management', () => {
    test('updates connection state', () => {
      const store = useChatStore.getState();
      
      store.setConnectionState({
        status: 'connected',
        lastConnected: Date.now()
      });

      const state = useChatStore.getState();
      expect(state.connectionState.status).toBe('connected');
      expect(state.connectionState.lastConnected).toBeDefined();
    });

    test('handles reconnection', async () => {
      mockChatAPI.getMessages.mockResolvedValue({
        success: true,
        data: { messages: [], conversation: mockConversation }
      });

      useChatStore.setState({ 
        currentConversation: mockConversation,
        offlineQueue: [{ content: 'queued message', type: 'user' }]
      });

      const store = useChatStore.getState();
      await store.handleReconnection();

      const state = useChatStore.getState();
      expect(state.connectionState.status).toBe('connected');
      expect(state.connectionState.reconnectAttempts).toBe(0);
    });
  });

  describe('Conversation Management', () => {
    test('creates conversation', async () => {
      mockChatAPI.createConversation.mockResolvedValue({
        success: true,
        data: mockConversation
      });

      const store = useChatStore.getState();
      const result = await store.createConversation('New Chat', 'A new conversation');

      expect(result).toEqual(mockConversation);
      expect(mockChatAPI.createConversation).toHaveBeenCalledWith({
        title: 'New Chat',
        description: 'A new conversation'
      });
    });

    test('updates conversation', async () => {
      useChatStore.setState({ currentConversation: mockConversation });
      
      const updatedConversation = { ...mockConversation, title: 'Updated Title' };
      mockChatAPI.updateConversation.mockResolvedValue({
        success: true,
        data: updatedConversation
      });

      const store = useChatStore.getState();
      await store.updateConversation('conv-1', { title: 'Updated Title' });

      const state = useChatStore.getState();
      expect(state.currentConversation?.title).toBe('Updated Title');
    });

    test('deletes conversation', async () => {
      useChatStore.setState({ 
        currentConversation: mockConversation,
        messages: [mockMessage]
      });

      mockChatAPI.deleteConversation.mockResolvedValue({
        success: true,
        data: undefined
      });

      const store = useChatStore.getState();
      await store.deleteConversation('conv-1');

      const state = useChatStore.getState();
      expect(state.currentConversation).toBeNull();
      expect(state.messages).toEqual([]);
    });
  });

  describe('Offline Queue', () => {
    test('processes offline queue', async () => {
      const queuedMessages = [
        { content: 'Message 1', type: 'user' as const },
        { content: 'Message 2', type: 'user' as const }
      ];

      useChatStore.setState({ offlineQueue: queuedMessages });

      mockChatAPI.sendMessage.mockResolvedValue({
        success: true,
        data: mockMessage
      });

      const store = useChatStore.getState();
      await store.processOfflineQueue();

      const state = useChatStore.getState();
      expect(state.offlineQueue).toHaveLength(0);
      expect(mockChatAPI.sendMessage).toHaveBeenCalledTimes(2);
    });

    test('stops processing on queue failure', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const queuedMessages = [
        { content: 'Message 1', type: 'user' as const },
        { content: 'Message 2', type: 'user' as const }
      ];

      useChatStore.setState({ offlineQueue: queuedMessages });

      mockChatAPI.sendMessage.mockRejectedValueOnce(new Error('Network error'));

      const store = useChatStore.getState();
      await store.processOfflineQueue();

      const state = useChatStore.getState();
      expect(state.offlineQueue).toHaveLength(2); // Should stop on first failure
      expect(mockChatAPI.sendMessage).toHaveBeenCalledTimes(1);

      consoleError.mockRestore();
    });

    test('adds to offline queue', () => {
      const store = useChatStore.getState();
      
      store.addToOfflineQueue({ content: 'Offline message', type: 'user' });

      const state = useChatStore.getState();
      expect(state.offlineQueue).toHaveLength(1);
      expect(state.offlineQueue[0].content).toBe('Offline message');
    });

    test('clears offline queue', () => {
      useChatStore.setState({ 
        offlineQueue: [{ content: 'Message', type: 'user' }]
      });

      const store = useChatStore.getState();
      store.clearOfflineQueue();

      const state = useChatStore.getState();
      expect(state.offlineQueue).toHaveLength(0);
    });
  });

  describe('Performance Optimization', () => {
    test('optimizes message list', () => {
      const oldTimestamp = Date.now() - 7200000; // 2 hours ago
      const recentTimestamp = Date.now() - 1800000; // 30 minutes ago

      useChatStore.setState({
        messageCache: {
          'old-key': [{ ...mockMessage, createdAt: new Date(oldTimestamp).toISOString() }],
          'recent-key': [{ ...mockMessage, createdAt: new Date(recentTimestamp).toISOString() }]
        },
        performanceMetrics: {
          messageRenderTime: 0,
          scrollPerformance: 0,
          lastOptimization: oldTimestamp
        }
      });

      const store = useChatStore.getState();
      store.optimizeMessageList();

      const state = useChatStore.getState();
      expect(state.messageCache['recent-key']).toBeDefined();
      expect(state.performanceMetrics.lastOptimization).toBeGreaterThan(oldTimestamp);
    });

    test('updates performance metrics', () => {
      const store = useChatStore.getState();
      
      store.updatePerformanceMetrics({
        messageRenderTime: 50,
        scrollPerformance: 60
      });

      const state = useChatStore.getState();
      expect(state.performanceMetrics.messageRenderTime).toBe(50);
      expect(state.performanceMetrics.scrollPerformance).toBe(60);
    });
  });

  describe('Utility Functions', () => {
    test('marks conversation as read', () => {
      const store = useChatStore.getState();
      const now = Date.now();
      
      store.markAsRead('conv-1');

      const state = useChatStore.getState();
      expect(state.lastSeen['conv-1']).toBeGreaterThanOrEqual(now);
      expect(state.unreadCounts['conv-1']).toBe(0);
    });

    test('sets typing state', () => {
      const store = useChatStore.getState();
      
      store.setTyping(true);
      expect(useChatStore.getState().isTyping).toBe(true);

      store.setTyping(false);
      expect(useChatStore.getState().isTyping).toBe(false);
    });

    test('sets error state', () => {
      const store = useChatStore.getState();
      
      store.setError('Test error');
      expect(useChatStore.getState().error).toBe('Test error');

      store.setError(null);
      expect(useChatStore.getState().error).toBeNull();
    });

    test('clears messages', () => {
      useChatStore.setState({
        messages: [mockMessage],
        currentConversation: mockConversation
      });

      const store = useChatStore.getState();
      store.clearMessages();

      const state = useChatStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.currentConversation).toBeNull();
    });

    test('clears cache', () => {
      useChatStore.setState({
        messageCache: { 'test-key': [mockMessage] }
      });

      const store = useChatStore.getState();
      store.clearCache();

      const state = useChatStore.getState();
      expect(state.messageCache).toEqual({});
    });
  });
});