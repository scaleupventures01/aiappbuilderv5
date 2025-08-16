/**
 * Environment Configuration Service
 * Handles environment variable validation and fallback logic
 */

interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  appName: string;
  appVersion: string;
  isDevelopment: boolean;
  isProduction: boolean;
  upload: {
    maxFileSize: number;
    maxFiles: number;
    allowedTypes: string[];
    endpoint: string;
  };
}

/**
 * Validates environment configuration
 */
class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  private loadConfiguration(): AppConfig {
    // Get environment variables with fallbacks
    const apiUrl = this.getEnvVar('VITE_API_URL', this.getDefaultApiUrl());
    const wsUrl = this.getEnvVar('VITE_WS_URL', this.getDefaultWsUrl(apiUrl));
    const appName = this.getEnvVar('VITE_APP_NAME', 'Elite Trading Coach');
    const appVersion = this.getEnvVar('VITE_APP_VERSION', '1.0.0');
    
    const isDevelopment = import.meta.env.DEV;
    const isProduction = import.meta.env.PROD;

    return {
      apiUrl,
      wsUrl,
      appName,
      appVersion,
      isDevelopment,
      isProduction,
      upload: {
        maxFileSize: 15 * 1024 * 1024, // 15MB for images
        maxFiles: 5,
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        endpoint: `${apiUrl}/upload/images`
      }
    };
  }

  private getEnvVar(key: string, fallback: string): string {
    const value = import.meta.env[key];
    if (!value || value.trim() === '') {
      console.warn(`Environment variable ${key} not found, using fallback: ${fallback}`);
      return fallback;
    }
    return value.trim();
  }

  private getDefaultApiUrl(): string {
    // Try to detect the current environment and provide appropriate fallbacks
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Development environment - try common development ports
      return `${protocol}//localhost:3001`;
    }
    
    // Production environment - use current origin with /api path
    return `${protocol}//${hostname}/api`;
  }

  private getDefaultWsUrl(apiUrl: string): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiUrlObj = new URL(apiUrl);
    return `${wsProtocol}//${apiUrlObj.host}`;
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate API URL
    try {
      new URL(this.config.apiUrl);
    } catch {
      errors.push(`Invalid API URL: ${this.config.apiUrl}`);
    }

    // Validate WebSocket URL
    try {
      new URL(this.config.wsUrl);
    } catch {
      errors.push(`Invalid WebSocket URL: ${this.config.wsUrl}`);
    }

    // Check for required configuration
    if (!this.config.appName) {
      errors.push('App name is required');
    }

    if (!this.config.appVersion) {
      errors.push('App version is required');
    }

    if (errors.length > 0) {
      console.error('Environment configuration errors:', errors);
      
      // In development, log warnings but continue
      if (this.config.isDevelopment) {
        console.warn('Continuing with potentially invalid configuration in development mode');
      } else {
        // In production, this could be more strict
        throw new Error(`Environment configuration invalid: ${errors.join(', ')}`);
      }
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public getApiUrl(): string {
    return this.config.apiUrl;
  }

  public getWsUrl(): string {
    return this.config.wsUrl;
  }

  public getUploadEndpoint(): string {
    return this.config.upload.endpoint;
  }

  public getUploadConfig() {
    return { ...this.config.upload };
  }

  public isHealthy(): boolean {
    try {
      // Basic validation that URLs are properly formed
      new URL(this.config.apiUrl);
      new URL(this.config.wsUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test connectivity to the API endpoint
   */
  public async testApiConnection(): Promise<{
    success: boolean;
    responseTime?: number;
    error?: string;
    status?: number;
  }> {
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;

      return {
        success: response.ok,
        responseTime: Math.round(responseTime),
        status: response.status
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            responseTime: Math.round(responseTime),
            error: 'Connection timeout'
          };
        }
        return {
          success: false,
          responseTime: Math.round(responseTime),
          error: error.message
        };
      }
      
      return {
        success: false,
        responseTime: Math.round(responseTime),
        error: 'Unknown connection error'
      };
    }
  }

  /**
   * Test connectivity to the upload endpoint specifically
   */
  public async testUploadEndpoint(): Promise<{
    success: boolean;
    responseTime?: number;
    error?: string;
    status?: number;
  }> {
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Use OPTIONS to test endpoint availability without actually uploading
      const response = await fetch(this.config.upload.endpoint, {
        method: 'OPTIONS',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;

      return {
        success: response.status !== 404, // 404 means endpoint doesn't exist
        responseTime: Math.round(responseTime),
        status: response.status
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      return {
        success: false,
        responseTime: Math.round(responseTime),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get human-readable status information
   */
  public getStatusInfo(): {
    environment: string;
    apiUrl: string;
    uploadEndpoint: string;
    healthy: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    if (this.config.isDevelopment) {
      warnings.push('Running in development mode');
    }

    if (!this.isHealthy()) {
      warnings.push('Configuration validation failed');
    }

    return {
      environment: this.config.isDevelopment ? 'development' : 'production',
      apiUrl: this.config.apiUrl,
      uploadEndpoint: this.config.upload.endpoint,
      healthy: this.isHealthy(),
      warnings
    };
  }
}

// Export singleton instance
export const envConfig = EnvironmentConfig.getInstance();

// Export configuration for easy access
export const config = envConfig.getConfig();

// Export utility functions
export const getApiUrl = () => envConfig.getApiUrl();
export const getWsUrl = () => envConfig.getWsUrl();
export const getUploadEndpoint = () => envConfig.getUploadEndpoint();
export const getUploadConfig = () => envConfig.getUploadConfig();

// Export for testing and debugging
export const testApiConnection = () => envConfig.testApiConnection();
export const testUploadEndpoint = () => envConfig.testUploadEndpoint();
export const getStatusInfo = () => envConfig.getStatusInfo();

export default envConfig;