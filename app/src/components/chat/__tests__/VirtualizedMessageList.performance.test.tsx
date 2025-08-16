import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VirtualizedMessageList } from '../VirtualizedMessageList';
import { Message } from '@/types/chat';

// Mock utilities
vi.mock('@/utils/cn', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock MessageBubble component
vi.mock('../MessageBubble', () => ({
  MessageBubble: ({ message, showTimestamp }: any) => (
    <div data-testid={`message-${message.id}`} data-show-timestamp={showTimestamp}>
      <div>{message.content}</div>
      {showTimestamp && <span>timestamp</span>}
    </div>
  )
}));

// Mock TypingIndicator component
vi.mock('../TypingIndicator', () => ({
  TypingIndicator: () => <div data-testid="typing-indicator">Typing...</div>
}));

// Enhanced performance API mock
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 15 * 1024 * 1024, // 15MB
      totalJSHeapSize: 30 * 1024 * 1024 // 30MB
    },
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => [])
  }
});

// Mock requestAnimationFrame for better control
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16.67); // 60fps
  return 1;
});

describe('VirtualizedMessageList Performance Tests', () => {
  const createLargeMessageSet = (count: number): Message[] => {
    return Array.from({ length: count }, (_, index) => ({
      id: `perf-msg-${index}`,
      content: `Performance test message ${index} with some longer content to simulate real-world usage patterns. This content includes multiple sentences to test text wrapping and height calculation accuracy.`,
      type: index % 3 === 0 ? 'user' : index % 3 === 1 ? 'ai' : 'system',
      userId: index % 3 === 0 ? 'user1' : 'ai',
      createdAt: new Date(Date.now() - (count - index) * 30000).toISOString(), // 30 seconds apart
      metadata: {
        confidence: Math.random(),
        category: index % 4 === 0 ? 'trading' : index % 4 === 1 ? 'psychology' : undefined,
        attachments: index % 10 === 0 ? [{ 
          id: `attach-${index}`, 
          name: 'chart.png', 
          type: 'image' as const,
          url: 'http://example.com/chart.png',
          size: 150000,
          mimeType: 'image/png',
          metadata: {},
          uploadedAt: new Date().toISOString()
        }] : undefined
      }
    }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.performance.now).mockImplementation(() => Date.now());
  });

  describe('Render Performance Tests', () => {
    it('should render 10,000 messages efficiently with virtual scrolling', async () => {
      const largeMessageSet = createLargeMessageSet(10000);
      const performanceMetrics: any[] = [];
      
      const startTime = performance.now();
      
      const { container } = render(
        <VirtualizedMessageList
          messages={largeMessageSet}
          containerHeight={600}
          enablePerformanceMonitoring={true}
          dynamicHeights={true}
          onPerformanceUpdate={(metrics) => performanceMetrics.push(metrics)}
        />
      );

      const renderTime = performance.now() - startTime;
      
      // Should render quickly even with 10k messages
      expect(renderTime).toBeLessThan(500); // Less than 500ms

      // Should only render visible messages, not all 10k
      const renderedMessages = container.querySelectorAll('[data-testid^="message-"]');
      expect(renderedMessages.length).toBeLessThan(50); // Only visible + buffer
      expect(renderedMessages.length).toBeGreaterThan(0);
    });

    it('should maintain performance during rapid scrolling', async () => {
      const largeMessageSet = createLargeMessageSet(1000);
      const performanceMetrics: any[] = [];
      let frameDrops = 0;
      
      const { container } = render(
        <VirtualizedMessageList
          messages={largeMessageSet}
          containerHeight={400}
          enablePerformanceMonitoring={true}
          onPerformanceUpdate={(metrics) => {
            performanceMetrics.push(metrics);
            if (metrics.fps < 45) frameDrops++;
          }}
        />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      
      if (scrollContainer) {
        // Simulate rapid scrolling
        for (let i = 0; i < 20; i++) {
          act(() => {
            fireEvent.scroll(scrollContainer, { 
              target: { scrollTop: i * 100 } 
            });
          });
          // Small delay to allow performance monitoring
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Should maintain good FPS during scrolling
        if (performanceMetrics.length > 0) {
          const avgFps = performanceMetrics.reduce((sum, m) => sum + m.fps, 0) / performanceMetrics.length;
          expect(avgFps).toBeGreaterThan(30); // Average FPS should be decent
        }

        // Should have minimal frame drops
        expect(frameDrops).toBeLessThan(performanceMetrics.length * 0.3); // Less than 30% frame drops
      }
    });

    it('should handle memory efficiently with large datasets', async () => {
      const largeMessageSet = createLargeMessageSet(5000);
      let memoryMetrics: any[] = [];
      
      const { rerender } = render(
        <VirtualizedMessageList
          messages={largeMessageSet.slice(0, 1000)}
          containerHeight={400}
          enablePerformanceMonitoring={true}
          onPerformanceUpdate={(metrics) => {
            if (metrics.memoryUsage) {
              memoryMetrics.push(metrics.memoryUsage);
            }
          }}
        />
      );

      // Gradually increase message count
      for (let i = 1000; i <= 5000; i += 1000) {
        rerender(
          <VirtualizedMessageList
            messages={largeMessageSet.slice(0, i)}
            containerHeight={400}
            enablePerformanceMonitoring={true}
            onPerformanceUpdate={(metrics) => {
              if (metrics.memoryUsage) {
                memoryMetrics.push(metrics.memoryUsage);
              }
            }}
          />
        );
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (memoryMetrics.length > 0) {
        const maxMemory = Math.max(...memoryMetrics);
        expect(maxMemory).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      }
    });
  });

  describe('Dynamic Height Performance Tests', () => {
    it('should cache heights efficiently', async () => {
      const messagesWithVariedContent = Array.from({ length: 1000 }, (_, index) => ({
        id: `cache-test-${index}`,
        content: 'Short'.repeat(index % 50 + 1), // Varied content lengths
        type: 'user' as const,
        userId: 'user1',
        createdAt: new Date().toISOString()
      }));

      const { container, rerender } = render(
        <VirtualizedMessageList
          messages={messagesWithVariedContent}
          containerHeight={400}
          dynamicHeights={true}
          enablePerformanceMonitoring={true}
        />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      
      // First scroll pass - heights should be calculated and cached
      const startTime1 = performance.now();
      if (scrollContainer) {
        for (let i = 0; i < 10; i++) {
          act(() => {
            fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 200 } });
          });
        }
      }
      const firstPassTime = performance.now() - startTime1;

      // Second scroll pass - heights should be retrieved from cache
      const startTime2 = performance.now();
      if (scrollContainer) {
        for (let i = 0; i < 10; i++) {
          act(() => {
            fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 200 } });
          });
        }
      }
      const secondPassTime = performance.now() - startTime2;

      // Second pass should be faster due to caching
      expect(secondPassTime).toBeLessThan(firstPassTime * 1.2); // Allow some variance
    });

    it('should handle height recalculation efficiently', async () => {
      const baseMessages = createLargeMessageSet(500);
      const performanceData: any[] = [];

      const { rerender } = render(
        <VirtualizedMessageList
          messages={baseMessages}
          containerHeight={400}
          dynamicHeights={true}
          enablePerformanceMonitoring={true}
          onPerformanceUpdate={(metrics) => performanceData.push(metrics)}
        />
      );

      // Modify messages to trigger height recalculation
      const modifiedMessages = baseMessages.map(msg => ({
        ...msg,
        content: msg.content + ' Additional content that changes height significantly.'
      }));

      const recalcStartTime = performance.now();
      rerender(
        <VirtualizedMessageList
          messages={modifiedMessages}
          containerHeight={400}
          dynamicHeights={true}
          enablePerformanceMonitoring={true}
          onPerformanceUpdate={(metrics) => performanceData.push(metrics)}
        />
      );
      const recalcTime = performance.now() - recalcStartTime;

      // Recalculation should complete quickly
      expect(recalcTime).toBeLessThan(200); // Less than 200ms
    });
  });

  describe('Auto-scroll Performance Tests', () => {
    it('should handle rapid message additions efficiently', async () => {
      const initialMessages = createLargeMessageSet(100);
      const performanceData: any[] = [];

      const { rerender } = render(
        <VirtualizedMessageList
          messages={initialMessages}
          containerHeight={400}
          enablePerformanceMonitoring={true}
          onPerformanceUpdate={(metrics) => performanceData.push(metrics)}
        />
      );

      // Rapidly add messages to test auto-scroll performance
      const startTime = performance.now();
      for (let i = 0; i < 50; i++) {
        const newMessage: Message = {
          id: `rapid-${i}`,
          content: `Rapid message ${i}`,
          type: 'ai',
          userId: 'ai',
          createdAt: new Date().toISOString(),
          metadata: {}
        };

        rerender(
          <VirtualizedMessageList
            messages={[...initialMessages, newMessage]}
            containerHeight={400}
            enablePerformanceMonitoring={true}
            onPerformanceUpdate={(metrics) => performanceData.push(metrics)}
          />
        );
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      const totalTime = performance.now() - startTime;

      // Should handle rapid additions efficiently
      expect(totalTime).toBeLessThan(1000); // Less than 1 second for 50 additions

      if (performanceData.length > 0) {
        const avgRenderTime = performanceData.reduce((sum, m) => sum + m.renderTime, 0) / performanceData.length;
        expect(avgRenderTime).toBeLessThan(16.67); // Average render time < 1 frame
      }
    });
  });

  describe('Mobile Performance Tests', () => {
    it('should handle touch interactions efficiently', async () => {
      const largeMessageSet = createLargeMessageSet(1000);
      
      const { container } = render(
        <VirtualizedMessageList
          messages={largeMessageSet}
          containerHeight={400}
          enableMobileOptimization={true}
          enablePerformanceMonitoring={true}
        />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      
      if (scrollContainer) {
        const startTime = performance.now();
        
        // Simulate touch scrolling
        act(() => {
          fireEvent.touchStart(scrollContainer, {
            touches: [{ clientY: 200 }]
          });
        });

        for (let i = 0; i < 20; i++) {
          act(() => {
            fireEvent.touchMove(scrollContainer, {
              touches: [{ clientY: 200 - i * 10 }]
            });
          });
        }

        act(() => {
          fireEvent.touchEnd(scrollContainer);
        });

        const touchTime = performance.now() - startTime;
        
        // Touch interactions should be processed quickly
        expect(touchTime).toBeLessThan(100); // Less than 100ms
      }
    });
  });

  describe('Stress Tests', () => {
    it('should survive extreme message counts', async () => {
      const extremeMessageSet = createLargeMessageSet(50000);
      
      const startTime = performance.now();
      
      const { container } = render(
        <VirtualizedMessageList
          messages={extremeMessageSet}
          containerHeight={400}
          enablePerformanceMonitoring={true}
          dynamicHeights={true}
        />
      );

      const renderTime = performance.now() - startTime;
      
      // Should still render in reasonable time with 50k messages
      expect(renderTime).toBeLessThan(2000); // Less than 2 seconds

      // Should only render visible subset
      const renderedMessages = container.querySelectorAll('[data-testid^="message-"]');
      expect(renderedMessages.length).toBeLessThan(100); // Only visible portion
    });

    it('should handle concurrent scroll and resize operations', async () => {
      const largeMessageSet = createLargeMessageSet(2000);
      const errors: Error[] = [];
      
      const { container, rerender } = render(
        <VirtualizedMessageList
          messages={largeMessageSet}
          containerHeight={400}
          enablePerformanceMonitoring={true}
        />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      
      try {
        // Concurrent operations
        const operations = [];
        
        // Scrolling operation
        if (scrollContainer) {
          operations.push(
            (async () => {
              for (let i = 0; i < 50; i++) {
                act(() => {
                  fireEvent.scroll(scrollContainer, { 
                    target: { scrollTop: Math.random() * 5000 } 
                  });
                });
                await new Promise(resolve => setTimeout(resolve, 20));
              }
            })()
          );
        }

        // Resize operation
        operations.push(
          (async () => {
            for (let i = 0; i < 10; i++) {
              rerender(
                <VirtualizedMessageList
                  messages={largeMessageSet}
                  containerHeight={400 + i * 50}
                  enablePerformanceMonitoring={true}
                />
              );
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          })()
        );

        await Promise.all(operations);
        
      } catch (error) {
        errors.push(error as Error);
      }

      // Should handle concurrent operations without errors
      expect(errors.length).toBe(0);
    });
  });
});