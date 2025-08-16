// Core type definitions for Elite Trading Coach AI
// Re-export the comprehensive types from chat.ts for compatibility

export type {
  User,
  Message,
  Conversation,
  ApiResponse,
  PaginatedResponse
} from './chat';

// Export error handling types
export type {
  ErrorResponse,
  RetryConfig,
  ErrorUIState,
  ToastNotification,
  ErrorType,
  ErrorTypeConfig,
  AnalysisError,
  ErrorHandlerOptions
} from './error';