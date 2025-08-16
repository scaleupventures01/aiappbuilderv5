import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
  isSlowRender: boolean;
}

interface PerformanceConfig {
  threshold: number; // ms
  enableWarnings: boolean;
  enableLogging: boolean;
  sampleRate: number; // 0-1
}

const defaultConfig: PerformanceConfig = {
  threshold: 100,
  enableWarnings: true,
  enableLogging: process.env.NODE_ENV === 'development',
  sampleRate: 0.1, // Log 10% of renders in production
};

// Global performance metrics store
const performanceMetrics: PerformanceMetrics[] = [];

/**
 * Performance monitoring hook for React components
 * Tracks render times and identifies slow renders > 100ms (NFR-1)
 */
export const usePerformanceMonitor = (
  componentName: string,
  config: Partial<PerformanceConfig> = {}
) => {
  const mergedConfig = { ...defaultConfig, ...config };
  const renderStartRef = useRef<number | null>(null);
  const frameIdRef = useRef<number | null>(null);

  // Start timing before render
  const startRenderTiming = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  // End timing after render
  const endRenderTiming = useCallback(() => {
    if (renderStartRef.current === null) return;

    // Use requestAnimationFrame to measure after DOM updates
    frameIdRef.current = requestAnimationFrame(() => {
      if (renderStartRef.current === null) return;

      const renderTime = performance.now() - renderStartRef.current;
      const isSlowRender = renderTime > mergedConfig.threshold;
      
      const metrics: PerformanceMetrics = {
        renderTime,
        componentName,
        timestamp: Date.now(),
        isSlowRender,
      };

      // Store metrics
      performanceMetrics.push(metrics);
      
      // Keep only last 100 metrics to prevent memory leaks
      if (performanceMetrics.length > 100) {
        performanceMetrics.shift();
      }

      // Log slow renders
      if (isSlowRender && mergedConfig.enableWarnings) {
        console.warn(
          `🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (> ${mergedConfig.threshold}ms threshold)`,
          {
            renderTime,
            componentName,
            threshold: mergedConfig.threshold,
          }
        );
      }

      // Log all renders in development
      if (mergedConfig.enableLogging && Math.random() < mergedConfig.sampleRate) {
        console.log(`⚡ ${componentName} rendered in ${renderTime.toFixed(2)}ms`, {
          renderTime,
          isSlowRender,
          metrics,
        });
      }

      // Reset for next render
      renderStartRef.current = null;
    });
  }, [componentName, mergedConfig]);

  // Auto-start timing on each render
  useEffect(() => {
    startRenderTiming();
    return endRenderTiming;
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, []);

  return {
    startRenderTiming,
    endRenderTiming,
    getMetrics: () => performanceMetrics.slice(), // Return copy
    clearMetrics: () => performanceMetrics.length = 0,
  };
};

/**
 * Hook for monitoring layout shift and paint timing
 */
export const useLayoutPerformance = (componentName: string) => {
  const observer = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    if ('PerformanceObserver' in window) {
      observer.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'layout-shift') {
            const layoutShift = entry as PerformanceEntry & { value: number };
            if (layoutShift.value > 0.1) {
              console.warn(`📐 Layout shift detected in ${componentName}:`, {
                value: layoutShift.value,
                startTime: entry.startTime,
                componentName,
              });
            }
          }
          
          if (entry.entryType === 'paint') {
            console.log(`🎨 ${entry.name} for ${componentName}:`, {
              startTime: entry.startTime,
              componentName,
            });
          }
        });
      });

      try {
        observer.current.observe({ entryTypes: ['layout-shift', 'paint'] });
      } catch (error) {
        console.warn('Performance observation not supported:', error);
      }
    }

    return () => {
      observer.current?.disconnect();
    };
  }, [componentName]);
};

/**
 * Utility functions for performance analysis
 */
export const PerformanceUtils = {
  /**
   * Get average render time for a component
   */
  getAverageRenderTime: (componentName: string): number => {
    const componentMetrics = performanceMetrics.filter(
      m => m.componentName === componentName
    );
    
    if (componentMetrics.length === 0) return 0;
    
    const total = componentMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    return total / componentMetrics.length;
  },

  /**
   * Get slow render count for a component
   */
  getSlowRenderCount: (componentName: string): number => {
    return performanceMetrics.filter(
      m => m.componentName === componentName && m.isSlowRender
    ).length;
  },

  /**
   * Get all performance metrics
   */
  getAllMetrics: (): PerformanceMetrics[] => {
    return performanceMetrics.slice();
  },

  /**
   * Get performance summary
   */
  getSummary: () => {
    const components = [...new Set(performanceMetrics.map(m => m.componentName))];
    
    return components.map(componentName => ({
      componentName,
      totalRenders: performanceMetrics.filter(m => m.componentName === componentName).length,
      averageRenderTime: PerformanceUtils.getAverageRenderTime(componentName),
      slowRenderCount: PerformanceUtils.getSlowRenderCount(componentName),
      slowRenderPercentage: (PerformanceUtils.getSlowRenderCount(componentName) / 
        performanceMetrics.filter(m => m.componentName === componentName).length) * 100,
    }));
  },

  /**
   * Export metrics for analysis
   */
  exportMetrics: (): string => {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: performanceMetrics,
      summary: PerformanceUtils.getSummary(),
    }, null, 2);
  },
};

/**
 * Development-only performance debugging component
 */
export const PerformanceDebugger: React.FC<{ enabled?: boolean }> = ({ 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const summary = PerformanceUtils.getSummary();
      const slowComponents = summary.filter(s => s.averageRenderTime > 100);
      
      if (slowComponents.length > 0) {
        console.group('🐌 Performance Alert: Slow Components Detected');
        slowComponents.forEach(component => {
          console.warn(`${component.componentName}:`, {
            averageRenderTime: `${component.averageRenderTime.toFixed(2)}ms`,
            slowRenderPercentage: `${component.slowRenderPercentage.toFixed(1)}%`,
            totalRenders: component.totalRenders,
          });
        });
        console.groupEnd();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enabled]);

  return null;
};

export default usePerformanceMonitor;