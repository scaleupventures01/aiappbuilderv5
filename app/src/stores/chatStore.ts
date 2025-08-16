import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { Message, Conversation } from '@/types/index';
import { chatAPI } from '@/services/chatAPI';

interface OptimisticMessage {
  id: string;
  tempId: string;
  status: 'sending' | 'sent' | 'failed';
  retryCount: number;
}

interface ConnectionState {
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  lastConnected: number | null;
  reconnectAttempts: number;
}

interface ChatState {
  // Core state
  messages: Message[];
  currentConversation: Conversation | null;
  isTyping: boolean;
  isLoading: boolean;
  error: string | null;

  // Advanced features
  optimisticMessages: Record<string, OptimisticMessage>;
  messageCache: Record<string, Message[]>;
  offlineQueue: Array<Partial<Message>>;
  connectionState: ConnectionState;
  lastSeen: Record<string, number>; // conversationId -> timestamp
  unreadCounts: Record<string, number>;

  // Performance tracking
  performanceMetrics: {
    messageRenderTime: number;
    scrollPerformance: number;
    lastOptimization: number;
  };

  // Core actions
  loadMessages: (conversationId: string, offset?: number, limit?: number) => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  addOptimisticMessage: (tempMessage: Partial<Message>) => string;
  updateOptimisticMessage: (tempId: string, updates: Partial<OptimisticMessage>) => void;
  removeOptimisticMessage: (tempId: string) => void;
  sendMessage: (data: Partial<Message>) => Promise<void>;
  retrySendMessage: (tempId: string) => Promise<void>;
  
  // Real-time features
  setTyping: (isTyping: boolean) => void;
  setConnectionState: (state: Partial<ConnectionState>) => void;
  handleReconnection: () => Promise<void>;
  
  // Conversation management
  createConversation: (title: string, description?: string) => Promise<Conversation>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  
  // Utility actions
  setError: (error: string | null) => void;
  clearMessages: () => void;
  clearCache: () => void;
  markAsRead: (conversationId: string) => void;
  
  // Offline support
  processOfflineQueue: () => Promise<void>;
  addToOfflineQueue: (message: Partial<Message>) => void;
  clearOfflineQueue: () => void;

  // Performance optimization
  optimizeMessageList: () => void;
  updatePerformanceMetrics: (metrics: Partial<ChatState['performanceMetrics']>) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      messages: [],
      currentConversation: null,
      isTyping: false,
      isLoading: false,
      error: null,
      optimisticMessages: {},
      messageCache: {},
      offlineQueue: [],
      connectionState: {
        status: 'disconnected',
        lastConnected: null,
        reconnectAttempts: 0
      },
      lastSeen: {},
      unreadCounts: {},
      performanceMetrics: {
        messageRenderTime: 0,
        scrollPerformance: 0,
        lastOptimization: Date.now()
      },

      // Core message loading with caching
      loadMessages: async (conversationId: string, offset = 0, limit = 50) => {
        const state = get();
        
        // Check cache first
        const cacheKey = `${conversationId}-${offset}-${limit}`;
        const cached = state.messageCache[cacheKey];
        if (cached && offset === 0) {
          set({ 
            messages: cached,
            isLoading: false
          });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await chatAPI.getMessages(conversationId, { offset, limit });
          const newMessages = response.data.messages;
          
          // Update cache
          const updatedCache = { ...state.messageCache };
          updatedCache[cacheKey] = newMessages;
          
          set({ 
            messages: offset === 0 ? newMessages : [...state.messages, ...newMessages],
            currentConversation: response.data.conversation,
            messageCache: updatedCache,
            isLoading: false
          });

          // Mark as read
          get().markAsRead(conversationId);
        } catch (error) {
          console.error('Failed to load messages:', error);
          set({ 
            error: 'Failed to load messages',
            isLoading: false
          });
        }
      },

      // Load more messages for pagination
      loadMoreMessages: async (conversationId: string) => {
        const state = get();
        const offset = state.messages.length;
        await get().loadMessages(conversationId, offset, 20);
      },

      // Add message with deduplication
      addMessage: (message: Message) => {
        set(state => {
          // Check for duplicates
          const exists = state.messages.some(m => m.id === message.id);
          if (exists) return state;

          const newMessages = [...state.messages, message];
          
          // Update cache
          const updatedCache = { ...state.messageCache };
          const cacheKey = `${message.conversationId}-0-50`;
          if (updatedCache[cacheKey]) {
            updatedCache[cacheKey] = newMessages.slice(-50);
          }

          return {
            messages: newMessages,
            messageCache: updatedCache
          };
        });
      },

      // Optimistic message handling
      addOptimisticMessage: (tempMessage: Partial<Message>) => {
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const optimisticMsg: Message = {
          id: tempId,
          conversationId: tempMessage.conversationId || '',
          userId: tempMessage.userId || 'current-user',
          content: tempMessage.content || '',
          type: tempMessage.type || 'user',
          metadata: tempMessage.metadata || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set(state => ({
          messages: [...state.messages, optimisticMsg],
          optimisticMessages: {
            ...state.optimisticMessages,
            [tempId]: {
              id: tempId,
              tempId,
              status: 'sending',
              retryCount: 0
            }
          }
        }));

        return tempId;
      },

      updateOptimisticMessage: (tempId: string, updates: Partial<OptimisticMessage>) => {
        set(state => ({
          optimisticMessages: {
            ...state.optimisticMessages,
            [tempId]: {
              ...state.optimisticMessages[tempId],
              ...updates
            }
          }
        }));
      },

      removeOptimisticMessage: (tempId: string) => {
        set(state => {
          const { [tempId]: removed, ...remaining } = state.optimisticMessages;
          return {
            optimisticMessages: remaining,
            messages: state.messages.filter(m => m.id !== tempId)
          };
        });
      },

      // Enhanced send message with optimistic updates
      sendMessage: async (messageData: Partial<Message>) => {
        const tempId = get().addOptimisticMessage(messageData);
        
        try {
          const response = await chatAPI.sendMessage(messageData);
          
          // Replace optimistic message with real message
          set(state => ({
            messages: state.messages.map(m => 
              m.id === tempId ? response.data : m
            )
          }));
          
          get().removeOptimisticMessage(tempId);
          return response;
        } catch (error) {
          console.error('Failed to send message:', error);
          
          // Mark as failed
          get().updateOptimisticMessage(tempId, { status: 'failed' });
          
          // Add to offline queue if offline
          if (!navigator.onLine) {
            get().addToOfflineQueue(messageData);
          }
          
          set({ error: 'Failed to send message' });
          throw error;
        }
      },

      // Retry failed messages
      retrySendMessage: async (tempId: string) => {
        const state = get();
        const optimistic = state.optimisticMessages[tempId];
        if (!optimistic) return;

        const message = state.messages.find(m => m.id === tempId);
        if (!message) return;

        get().updateOptimisticMessage(tempId, { 
          status: 'sending',
          retryCount: optimistic.retryCount + 1
        });

        try {
          await get().sendMessage({
            conversationId: message.conversationId,
            content: message.content,
            type: message.type,
            metadata: message.metadata
          });
        } catch (error) {
          get().updateOptimisticMessage(tempId, { status: 'failed' });
        }
      },

      // Connection management
      setConnectionState: (updates: Partial<ConnectionState>) => {
        set(state => ({
          connectionState: {
            ...state.connectionState,
            ...updates
          }
        }));
      },

      handleReconnection: async () => {
        const state = get();
        
        set(state => ({
          connectionState: {
            ...state.connectionState,
            status: 'reconnecting',
            reconnectAttempts: state.connectionState.reconnectAttempts + 1
          }
        }));

        try {
          // Process offline queue
          await get().processOfflineQueue();
          
          // Reload current conversation
          if (state.currentConversation) {
            await get().loadMessages(state.currentConversation.id);
          }

          set(state => ({
            connectionState: {
              ...state.connectionState,
              status: 'connected',
              lastConnected: Date.now(),
              reconnectAttempts: 0
            }
          }));
        } catch (error) {
          console.error('Reconnection failed:', error);
          set(state => ({
            connectionState: {
              ...state.connectionState,
              status: 'disconnected'
            }
          }));
        }
      },

      // Conversation management
      createConversation: async (title: string, description?: string) => {
        try {
          const response = await chatAPI.createConversation({ title, description });
          return response.data;
        } catch (error) {
          console.error('Failed to create conversation:', error);
          set({ error: 'Failed to create conversation' });
          throw error;
        }
      },

      updateConversation: async (id: string, updates: Partial<Conversation>) => {
        try {
          const response = await chatAPI.updateConversation(id, updates);
          set(state => ({
            currentConversation: state.currentConversation?.id === id 
              ? response.data 
              : state.currentConversation
          }));
        } catch (error) {
          console.error('Failed to update conversation:', error);
          set({ error: 'Failed to update conversation' });
          throw error;
        }
      },

      deleteConversation: async (id: string) => {
        try {
          await chatAPI.deleteConversation(id);
          set(state => ({
            currentConversation: state.currentConversation?.id === id 
              ? null 
              : state.currentConversation,
            messages: state.currentConversation?.id === id ? [] : state.messages
          }));
        } catch (error) {
          console.error('Failed to delete conversation:', error);
          set({ error: 'Failed to delete conversation' });
          throw error;
        }
      },

      // Offline queue management
      processOfflineQueue: async () => {
        const state = get();
        const queue = [...state.offlineQueue];
        
        for (const message of queue) {
          try {
            await get().sendMessage(message);
            // Remove from queue on success
            set(state => ({
              offlineQueue: state.offlineQueue.filter(m => m !== message)
            }));
          } catch (error) {
            console.error('Failed to process offline message:', error);
            break; // Stop processing on first failure
          }
        }
      },

      addToOfflineQueue: (message: Partial<Message>) => {
        set(state => ({
          offlineQueue: [...state.offlineQueue, message]
        }));
      },

      clearOfflineQueue: () => {
        set({ offlineQueue: [] });
      },

      // Utility methods
      setTyping: (isTyping: boolean) => {
        set({ isTyping });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearMessages: () => {
        set({ messages: [], currentConversation: null });
      },

      clearCache: () => {
        set({ messageCache: {} });
      },

      markAsRead: (conversationId: string) => {
        set(state => ({
          lastSeen: {
            ...state.lastSeen,
            [conversationId]: Date.now()
          },
          unreadCounts: {
            ...state.unreadCounts,
            [conversationId]: 0
          }
        }));
      },

      // Performance optimization
      optimizeMessageList: () => {
        const state = get();
        const now = Date.now();
        
        // Only optimize if enough time has passed
        if (now - state.performanceMetrics.lastOptimization < 30000) return;

        // Remove old cache entries
        const updatedCache: Record<string, Message[]> = {};
        Object.entries(state.messageCache).forEach(([key, value]) => {
          if (value.length > 0 && value[0].createdAt) {
            const age = now - new Date(value[0].createdAt).getTime();
            if (age < 3600000) { // Keep cache for 1 hour
              updatedCache[key] = value;
            }
          }
        });

        set({
          messageCache: updatedCache,
          performanceMetrics: {
            ...state.performanceMetrics,
            lastOptimization: now
          }
        });
      },

      updatePerformanceMetrics: (metrics: Partial<ChatState['performanceMetrics']>) => {
        set(state => ({
          performanceMetrics: {
            ...state.performanceMetrics,
            ...metrics
          }
        }));
      }
    })),
    {
      name: 'chat-store',
      partialize: (state) => ({
        // Only persist essential data
        messageCache: state.messageCache,
        lastSeen: state.lastSeen,
        unreadCounts: state.unreadCounts,
        offlineQueue: state.offlineQueue
      })
    }
  )
);