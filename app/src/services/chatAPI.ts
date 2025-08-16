import { ApiResponse, Message, Conversation, PaginatedResponse } from '@/types/index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface MessagesResponse {
  messages: Message[];
  conversation: Conversation;
  hasMore?: boolean;
  total?: number;
}

interface MessageQueryParams {
  offset?: number;
  limit?: number;
  search?: string;
  filter?: {
    type?: 'user' | 'ai' | 'system';
    dateFrom?: string;
    dateTo?: string;
  };
}

interface SendMessageRequest {
  conversationId?: string;
  content: string;
  type: 'user' | 'ai' | 'system';
  metadata?: Record<string, any>;
}

interface CreateConversationRequest {
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface RetryOptions {
  maxRetries: number;
  backoffMs: number;
  exponentialBackoff: boolean;
}

interface RequestCache {
  [key: string]: {
    data: any;
    timestamp: number;
    expiresIn: number;
  };
}

class ChatAPI {
  private cache: RequestCache = {};
  private readonly defaultCacheTime = 5 * 60 * 1000; // 5 minutes
  private abortControllers: Map<string, AbortController> = new Map();

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth-token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private isValidCacheEntry(entry: any): boolean {
    return entry && entry.timestamp && Date.now() - entry.timestamp < entry.expiresIn;
  }

  private getCachedData<T>(cacheKey: string): T | null {
    const entry = this.cache[cacheKey];
    if (this.isValidCacheEntry(entry)) {
      return entry.data;
    }
    // Clean up expired entry
    delete this.cache[cacheKey];
    return null;
  }

  private setCachedData(cacheKey: string, data: any, expiresIn: number = this.defaultCacheTime): void {
    this.cache[cacheKey] = {
      data,
      timestamp: Date.now(),
      expiresIn
    };
  }

  private async fetchWithRetry<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryOptions: Partial<RetryOptions> = {}
  ): Promise<ApiResponse<T>> {
    const {
      maxRetries = 3,
      backoffMs = 1000,
      exponentialBackoff = true
    } = retryOptions;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.fetchRequest<T>(endpoint, options);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain error types
        if (error instanceof Error && (
          error.message.includes('401') || 
          error.message.includes('403') ||
          error.message.includes('400')
        )) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = exponentialBackoff 
            ? backoffMs * Math.pow(2, attempt)
            : backoffMs;
          
          console.log(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  private async fetchRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const requestId = `${Date.now()}-${Math.random()}`;
    
    // Setup abort controller for cancellation
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          // Use default error message if JSON parsing fails
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw error;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  private async fetch<T>(
    endpoint: string, 
    options: RequestInit = {},
    useCache: boolean = false,
    cacheTime?: number
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, options);

    // Check cache for GET requests
    if (useCache && (!options.method || options.method === 'GET')) {
      const cachedData = this.getCachedData<ApiResponse<T>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    const result = await this.fetchWithRetry<T>(endpoint, options);

    // Cache successful GET requests
    if (useCache && (!options.method || options.method === 'GET')) {
      this.setCachedData(cacheKey, result, cacheTime);
    }

    return result;
  }

  // Cancel all pending requests
  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  // Clear cache
  clearCache(): void {
    this.cache = {};
  }

  // Messages API
  async getMessages(
    conversationId: string, 
    params: MessageQueryParams = {}
  ): Promise<ApiResponse<MessagesResponse>> {
    const query = new URLSearchParams();
    
    if (params.offset !== undefined) query.set('offset', params.offset.toString());
    if (params.limit !== undefined) query.set('limit', params.limit.toString());
    if (params.search) query.set('search', params.search);
    if (params.filter?.type) query.set('type', params.filter.type);
    if (params.filter?.dateFrom) query.set('dateFrom', params.filter.dateFrom);
    if (params.filter?.dateTo) query.set('dateTo', params.filter.dateTo);

    const queryString = query.toString();
    const endpoint = `/messages/${conversationId}${queryString ? `?${queryString}` : ''}`;
    
    return this.fetch<MessagesResponse>(endpoint, {}, true, 2 * 60 * 1000); // Cache for 2 minutes
  }

  async sendMessage(messageData: Partial<Message>): Promise<ApiResponse<Message>> {
    return this.fetch<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async updateMessage(messageId: string, updates: Partial<Message>): Promise<ApiResponse<Message>> {
    return this.fetch<Message>(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteMessage(messageId: string): Promise<ApiResponse<void>> {
    return this.fetch<void>(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async searchMessages(query: string, conversationId?: string): Promise<ApiResponse<Message[]>> {
    const params = new URLSearchParams({ q: query });
    if (conversationId) params.set('conversationId', conversationId);
    
    return this.fetch<Message[]>(`/messages/search?${params}`, {}, true, 1 * 60 * 1000);
  }

  // Conversations API
  async getConversations(
    offset: number = 0, 
    limit: number = 50
  ): Promise<PaginatedResponse<Conversation>> {
    return this.fetch<PaginatedResponse<Conversation>['data']>(
      `/conversations?offset=${offset}&limit=${limit}`, 
      {}, 
      true, 
      5 * 60 * 1000
    ).then(response => ({
      success: response.success,
      data: response.data as PaginatedResponse<Conversation>['data']
    }));
  }

  async getConversation(id: string): Promise<ApiResponse<Conversation>> {
    return this.fetch<Conversation>(`/conversations/${id}`, {}, true);
  }

  async createConversation(data: CreateConversationRequest): Promise<ApiResponse<Conversation>> {
    return this.fetch<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<ApiResponse<Conversation>> {
    return this.fetch<Conversation>(`/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteConversation(id: string): Promise<ApiResponse<void>> {
    return this.fetch<void>(`/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  async archiveConversation(id: string): Promise<ApiResponse<Conversation>> {
    return this.fetch<Conversation>(`/conversations/${id}/archive`, {
      method: 'POST',
    });
  }

  async unarchiveConversation(id: string): Promise<ApiResponse<Conversation>> {
    return this.fetch<Conversation>(`/conversations/${id}/unarchive`, {
      method: 'POST',
    });
  }

  // AI Integration API
  async generateAIResponse(
    conversationId: string, 
    context?: Record<string, any>
  ): Promise<ApiResponse<Message>> {
    return this.fetch<Message>('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ conversationId, context }),
    });
  }

  async getAIInsights(conversationId: string): Promise<ApiResponse<any>> {
    return this.fetch<any>(`/ai/insights/${conversationId}`, {}, true, 10 * 60 * 1000);
  }

  async reportMessage(messageId: string, reason: string): Promise<ApiResponse<void>> {
    return this.fetch<void>(`/messages/${messageId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Analytics API
  async getConversationAnalytics(
    conversationId: string,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<ApiResponse<any>> {
    return this.fetch<any>(
      `/analytics/conversations/${conversationId}?timeframe=${timeframe}`,
      {},
      true,
      15 * 60 * 1000
    );
  }

  async getChatMetrics(): Promise<ApiResponse<any>> {
    return this.fetch<any>('/analytics/chat/metrics', {}, true, 5 * 60 * 1000);
  }

  // Image upload for chat messages
  async uploadImages(files: File[], conversationId?: string, context: string = 'chat'): Promise<ApiResponse<any>> {
    const formData = new FormData();
    
    // Append all files with the same field name 'images'
    files.forEach((file) => {
      formData.append('images', file);
    });
    
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }
    
    formData.append('context', context);

    return this.fetchRequest<any>('/upload/images', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, let browser set boundary
        ...this.getAuthHeaders(),
      },
      body: formData,
    });
  }

  // File upload for attachments (legacy)
  async uploadAttachment(file: File, conversationId: string): Promise<ApiResponse<{ url: string; metadata: any }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    return this.fetch<{ url: string; metadata: any }>('/attachments/upload', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData
        ...this.getAuthHeaders(),
      },
      body: formData,
    });
  }

  // Get upload details by ID
  async getUploadDetails(uploadId: string): Promise<ApiResponse<any>> {
    return this.fetch<any>(`/upload/images/${uploadId}`, {}, true, 5 * 60 * 1000);
  }

  // Delete uploaded image
  async deleteUpload(uploadId: string): Promise<ApiResponse<void>> {
    return this.fetch<void>(`/upload/images/${uploadId}`, {
      method: 'DELETE',
    });
  }

  async deleteAttachment(attachmentId: string): Promise<ApiResponse<void>> {
    return this.fetch<void>(`/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  // Export conversation data
  async exportConversation(
    conversationId: string, 
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    return this.fetch<{ downloadUrl: string }>(
      `/conversations/${conversationId}/export?format=${format}`,
      { method: 'POST' }
    );
  }

  // Real-time typing indicators
  async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    // This is typically handled via WebSocket, but can have a REST fallback
    try {
      await this.fetch<void>('/chat/typing', {
        method: 'POST',
        body: JSON.stringify({ conversationId, isTyping }),
      });
    } catch (error) {
      console.warn('Failed to send typing indicator:', error);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    try {
      const response = await this.fetch<{ status: string }>('/health');
      return {
        status: response.data.status,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: Date.now()
      };
    }
  }
}

// Singleton instance
export const chatAPI = new ChatAPI();

// Enhanced API client with additional utilities
export class EnhancedChatAPI extends ChatAPI {
  private eventListeners: Map<string, Function[]> = new Map();

  // Event system for API responses
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Override send message to emit events
  async sendMessage(messageData: Partial<Message>): Promise<ApiResponse<Message>> {
    this.emit('messageSending', messageData);
    try {
      const result = await super.sendMessage(messageData);
      this.emit('messageSent', result.data);
      return result;
    } catch (error) {
      this.emit('messageFailed', { messageData, error });
      throw error;
    }
  }

  // Batch operations
  async sendMultipleMessages(messages: Partial<Message>[]): Promise<ApiResponse<Message>[]> {
    const results = await Promise.allSettled(
      messages.map(msg => this.sendMessage(msg))
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        throw result.reason;
      }
    });
  }

  // Performance monitoring
  async withPerformanceTracking<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      console.log(`${operationName} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
}

export const enhancedChatAPI = new EnhancedChatAPI();