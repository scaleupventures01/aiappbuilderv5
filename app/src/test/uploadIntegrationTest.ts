/**
 * Upload Integration Test Utilities
 * Provides tools for testing the complete upload flow
 */

import { UploadProgress } from '../types/upload';

/**
 * Mock server responses for testing
 */
export const mockServerResponses = {
  success: {
    status: 201,
    response: {
      success: true,
      data: {
        uploads: [{
          id: 'test-upload-123',
          publicId: 'test-folder/test-image-123',
          originalName: 'test-image.jpg',
          secureUrl: 'https://res.cloudinary.com/test/image/upload/test-folder/test-image-123.jpg',
          thumbnailUrl: 'https://res.cloudinary.com/test/image/upload/c_thumb,w_150,h_150/test-folder/test-image-123.jpg',
          width: 1920,
          height: 1080,
          format: 'jpg',
          bytes: 2048576,
          createdAt: new Date().toISOString()
        }],
        totalUploaded: 1
      }
    }
  },
  serverError: {
    status: 500,
    response: {
      success: false,
      error: 'Internal server error'
    }
  },
  authError: {
    status: 401,
    response: {
      success: false,
      error: 'Authentication required'
    }
  },
  validationError: {
    status: 400,
    response: {
      success: false,
      error: 'Invalid file type'
    }
  },
  networkError: {
    status: 0,
    response: null,
    error: 'Network connection failed'
  }
};

/**
 * Mock fetch implementation for testing
 */
export class MockFetch {
  private responses: Map<string, any> = new Map();
  private callHistory: Array<{ url: string; options: any }> = [];
  private networkFailure = false;
  private delayMs = 0;

  constructor() {
    this.setupDefaultResponses();
  }

  private setupDefaultResponses() {
    // Health check endpoint
    this.responses.set('GET:/api/health', {
      status: 200,
      response: { status: 'ok', timestamp: Date.now() }
    });

    // Upload endpoint
    this.responses.set('POST:/api/upload/images', mockServerResponses.success);
    this.responses.set('OPTIONS:/api/upload/images', {
      status: 200,
      response: {}
    });

    // Auth refresh endpoint
    this.responses.set('POST:/api/auth/refresh', {
      status: 200,
      response: {
        accessToken: 'new-mock-token',
        refreshToken: 'new-refresh-token'
      }
    });
  }

  /**
   * Set custom response for a specific endpoint
   */
  setResponse(method: string, url: string, response: any) {
    this.responses.set(`${method}:${url}`, response);
  }

  /**
   * Simulate network failure
   */
  setNetworkFailure(enabled: boolean) {
    this.networkFailure = enabled;
  }

  /**
   * Add artificial delay to responses
   */
  setDelay(ms: number) {
    this.delayMs = ms;
  }

  /**
   * Get call history for testing
   */
  getCallHistory() {
    return [...this.callHistory];
  }

  /**
   * Clear call history
   */
  clearHistory() {
    this.callHistory = [];
  }

  /**
   * Mock fetch implementation
   */
  async fetch(url: string, options: any = {}): Promise<Response> {
    this.callHistory.push({ url, options });

    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }

    if (this.networkFailure) {
      throw new Error('Network connection failed');
    }

    const key = `${options.method || 'GET'}:${url}`;
    const mockResponse = this.responses.get(key);

    if (!mockResponse) {
      return new Response(null, {
        status: 404,
        statusText: 'Not Found'
      });
    }

    if (mockResponse.error) {
      throw new Error(mockResponse.error);
    }

    const responseBody = mockResponse.response ? JSON.stringify(mockResponse.response) : null;
    
    return new Response(responseBody, {
      status: mockResponse.status,
      statusText: mockResponse.statusText || 'OK',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Upload service test helper
 */
export class UploadServiceTestHelper {
  private mockFetch: MockFetch;
  private originalFetch: typeof fetch;

  constructor() {
    this.mockFetch = new MockFetch();
    this.originalFetch = window.fetch;
  }

  /**
   * Start mocking fetch requests
   */
  startMocking() {
    // @ts-ignore
    window.fetch = this.mockFetch.fetch.bind(this.mockFetch);
  }

  /**
   * Stop mocking and restore original fetch
   */
  stopMocking() {
    window.fetch = this.originalFetch;
  }

  /**
   * Configure mock responses
   */
  configureMock(config: {
    uploadSuccess?: boolean;
    serverError?: boolean;
    authError?: boolean;
    networkFailure?: boolean;
    delay?: number;
  }) {
    const {
      uploadSuccess = true,
      serverError = false,
      authError = false,
      networkFailure = false,
      delay = 0
    } = config;

    this.mockFetch.setNetworkFailure(networkFailure);
    this.mockFetch.setDelay(delay);

    if (authError) {
      this.mockFetch.setResponse('POST', '/api/upload/images', mockServerResponses.authError);
    } else if (serverError) {
      this.mockFetch.setResponse('POST', '/api/upload/images', mockServerResponses.serverError);
    } else if (uploadSuccess) {
      this.mockFetch.setResponse('POST', '/api/upload/images', mockServerResponses.success);
    }
  }

  /**
   * Get request history
   */
  getRequestHistory() {
    return this.mockFetch.getCallHistory();
  }

  /**
   * Clear request history
   */
  clearHistory() {
    this.mockFetch.clearHistory();
  }

  /**
   * Simulate server coming online/offline
   */
  setServerOnline(online: boolean) {
    if (online) {
      this.mockFetch.setResponse('OPTIONS', '/api/upload/images', {
        status: 200,
        response: {}
      });
      this.mockFetch.setResponse('GET', '/api/health', {
        status: 200,
        response: { status: 'ok' }
      });
    } else {
      this.mockFetch.setResponse('OPTIONS', '/api/upload/images', {
        status: 0,
        error: 'Network connection failed'
      });
      this.mockFetch.setResponse('GET', '/api/health', {
        status: 0,
        error: 'Network connection failed'
      });
    }
  }
}

/**
 * Create test file for upload testing
 */
export function createTestFile(
  name = 'test-image.jpg',
  type = 'image/jpeg',
  size = 1024 * 1024 // 1MB
): File {
  const content = new Array(size).fill(0).map(() => Math.floor(Math.random() * 255));
  const uint8Array = new Uint8Array(content);
  
  return new File([uint8Array], name, { type });
}

/**
 * Progress tracking helper for tests
 */
export class ProgressTracker {
  private progressUpdates: UploadProgress[] = [];
  private retryAttempts: Array<{ attempt: number; maxAttempts: number; delay: number }> = [];

  onProgress = (progress: UploadProgress) => {
    this.progressUpdates.push({ ...progress });
  };

  onRetryAttempt = (attempt: number, maxAttempts: number, delay: number) => {
    this.retryAttempts.push({ attempt, maxAttempts, delay });
  };

  getProgressUpdates() {
    return [...this.progressUpdates];
  }

  getRetryAttempts() {
    return [...this.retryAttempts];
  }

  getMaxProgress() {
    return Math.max(...this.progressUpdates.map(p => p.percentage), 0);
  }

  clear() {
    this.progressUpdates = [];
    this.retryAttempts = [];
  }
}

/**
 * Integration test scenarios
 */
export const testScenarios = {
  /**
   * Test successful upload flow
   */
  async successfulUpload(helper: UploadServiceTestHelper) {
    helper.configureMock({ uploadSuccess: true });
    
    const testFile = createTestFile();
    const progressTracker = new ProgressTracker();
    
    return {
      file: testFile,
      progressTracker,
      expectedCalls: ['OPTIONS:/api/upload/images', 'POST:/api/upload/images']
    };
  },

  /**
   * Test upload with server error and retry
   */
  async serverErrorWithRetry(helper: UploadServiceTestHelper) {
    // First call fails, second succeeds
    helper.configureMock({ serverError: true });
    
    setTimeout(() => {
      helper.configureMock({ uploadSuccess: true });
    }, 100);
    
    const testFile = createTestFile();
    const progressTracker = new ProgressTracker();
    
    return {
      file: testFile,
      progressTracker,
      expectedRetries: 1
    };
  },

  /**
   * Test auth error with token refresh
   */
  async authErrorWithRefresh(helper: UploadServiceTestHelper) {
    helper.configureMock({ authError: true });
    
    const testFile = createTestFile();
    const progressTracker = new ProgressTracker();
    
    return {
      file: testFile,
      progressTracker,
      expectedCalls: ['POST:/api/auth/refresh']
    };
  },

  /**
   * Test network failure with queue
   */
  async networkFailureWithQueue(helper: UploadServiceTestHelper) {
    helper.configureMock({ networkFailure: true });
    helper.setServerOnline(false);
    
    const testFile = createTestFile();
    const progressTracker = new ProgressTracker();
    
    return {
      file: testFile,
      progressTracker,
      shouldQueue: true
    };
  }
};

/**
 * Test assertions helper
 */
export const assertions = {
  assertProgressIncreasing(progressUpdates: UploadProgress[]) {
    if (progressUpdates.length === 0) {
      throw new Error('No progress updates recorded');
    }
    
    for (let i = 1; i < progressUpdates.length; i++) {
      if (progressUpdates[i].percentage < progressUpdates[i - 1].percentage) {
        throw new Error('Progress should be non-decreasing');
      }
    }
  },

  assertRetryAttempts(retryAttempts: Array<{ attempt: number; maxAttempts: number }>, expectedCount: number) {
    if (retryAttempts.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} retry attempts, got ${retryAttempts.length}`);
    }
  },

  assertRequestHistory(history: Array<{ url: string; options: any }>, expectedCalls: string[]) {
    const actualCalls = history.map(h => `${h.options.method || 'GET'}:${h.url}`);
    
    for (const expectedCall of expectedCalls) {
      if (!actualCalls.includes(expectedCall)) {
        throw new Error(`Expected API call not found: ${expectedCall}. Actual calls: ${actualCalls.join(', ')}`);
      }
    }
  }
};

export default {
  MockFetch,
  UploadServiceTestHelper,
  ProgressTracker,
  createTestFile,
  testScenarios,
  assertions,
  mockServerResponses
};