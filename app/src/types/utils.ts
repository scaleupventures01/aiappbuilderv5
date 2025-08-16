// Type utility functions for TypeScript

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// API utilities
export type ApiEndpoint<TRequest, TResponse> = (
  request: TRequest
) => Promise<ApiResponse<TResponse>>;

// Import ApiResponse from main types
import { ApiResponse } from './index';