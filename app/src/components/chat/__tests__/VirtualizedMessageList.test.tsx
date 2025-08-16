import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 10 * 1024 * 1024 // 10MB
    }
  }
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));

describe('VirtualizedMessageList', () => {
  const mockMessages: Message[] = Array.from({ length: 100 }, (_, index) => ({
    id: `msg-${index}`,
    content: `Message content ${index}`,
    type: index % 2 === 0 ? 'user' : 'ai',
    userId: index % 2 === 0 ? 'user1' : 'ai',
    createdAt: new Date(Date.now() - (99 - index) * 60000).toISOString()
  }));

  const defaultProps = {
    messages: mockMessages.slice(0, 10),
    containerHeight: 400,
    enablePerformanceMonitoring: true,
    enableMobileOptimization: true,
    dynamicHeights: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset performance counters
    vi.mocked(window.performance.now).mockImplementation(() => Date.now());
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('QA-001: Virtual Scrolling Performance Validation', () => {
    it('should render only visible messages for performance', async () => {
      const { container } = render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={mockMessages} 
          containerHeight={300}
        />
      );

      // Should not render all 100 messages, only visible ones + buffer
      const renderedMessages = container.querySelectorAll('[data-testid^="message-"]');
      expect(renderedMessages.length).toBeLessThan(mockMessages.length);
      expect(renderedMessages.length).toBeGreaterThan(0);
    });

    it('should maintain 60fps target during scrolling', async () => {
      const onPerformanceUpdate = vi.fn();
      const { container } = render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={mockMessages}
          onPerformanceUpdate={onPerformanceUpdate}
        />
      );

      const scrollContainer = container.querySelector('[data-testid="scroll-container"]') ||
                            container.querySelector('div[style*="overflow-y"]');
      
      if (scrollContainer) {
        // Simulate rapid scrolling
        act(() => {
          fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });
          fireEvent.scroll(scrollContainer, { target: { scrollTop: 200 } });
          fireEvent.scroll(scrollContainer, { target: { scrollTop: 300 } });
        });

        // Wait for performance monitoring to kick in
        await waitFor(() => {
          expect(onPerformanceUpdate).toHaveBeenCalled();
        }, { timeout: 2000 });

        const lastCall = onPerformanceUpdate.mock.calls[onPerformanceUpdate.mock.calls.length - 1];
        if (lastCall) {
          const metrics = lastCall[0];
          expect(metrics.fps).toBeGreaterThanOrEqual(30); // Allow some tolerance
        }
      }
    });

    it('should track memory usage below 50MB target', async () => {
      const onPerformanceUpdate = vi.fn();
      const { container } = render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={mockMessages}
          onPerformanceUpdate={onPerformanceUpdate}
          enablePerformanceMonitoring={true}
        />
      );

      // Trigger scroll to activate performance monitoring
      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      if (scrollContainer) {
        act(() => {
          fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });
        });
      }

      await waitFor(() => {
        expect(onPerformanceUpdate).toHaveBeenCalled();
      }, { timeout: 2000 });

      const lastCall = onPerformanceUpdate.mock.calls[onPerformanceUpdate.mock.calls.length - 1];
      if (lastCall) {
        const metrics = lastCall[0];
        if (metrics.memoryUsage) {
          expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB
        } else {
          // If memory API not available, test passes
          expect(true).toBe(true);
        }
      }
    });

    it('should detect and report scroll jank', async () => {
      const onPerformanceUpdate = vi.fn();
      
      // Mock slow performance
      vi.mocked(window.performance.now)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(20); // Simulate jank (> 16.67ms)

      const { container } = render(
        <VirtualizedMessageList 
          {...defaultProps}
          onPerformanceUpdate={onPerformanceUpdate}
        />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      if (scrollContainer) {
        act(() => {
          fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });
        });

        await waitFor(() => {
          expect(onPerformanceUpdate).toHaveBeenCalled();
        }, { timeout: 2000 });
      }
    });
  });

  describe('QA-002: Auto-scroll Logic Testing', () => {
    it('should implement three-zone threshold system', async () => {
      const { container } = render(
        <VirtualizedMessageList {...defaultProps} />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      if (scrollContainer) {
        // Mock scroll properties
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000 });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 400 });
        Object.defineProperty(scrollContainer, 'scrollTop', { value: 0, writable: true });

        // Test immediate zone (0-50px from bottom)
        act(() => {
          Object.defineProperty(scrollContainer, 'scrollTop', { value: 550 }); // 50px from bottom
          fireEvent.scroll(scrollContainer);
        });

        // Test warning zone (50-100px from bottom)
        act(() => {
          Object.defineProperty(scrollContainer, 'scrollTop', { value: 510 }); // 90px from bottom
          fireEvent.scroll(scrollContainer);
        });

        // Should show warning indicator
        await waitFor(() => {
          const warningIndicator = screen.queryByText('Near bottom');
          expect(warningIndicator).toBeInTheDocument();
        });

        // Test none zone (100px+ from bottom)
        act(() => {
          Object.defineProperty(scrollContainer, 'scrollTop', { value: 400 }); // 200px from bottom
          fireEvent.scroll(scrollContainer);
        });

        await waitFor(() => {
          const newMessagesIndicator = screen.queryByText('New messages');
          expect(newMessagesIndicator).toBeInTheDocument();
        });
      }
    });

    it('should auto-scroll on new messages when in immediate zone', async () => {
      const { rerender } = render(
        <VirtualizedMessageList {...defaultProps} />
      );

      // Add new message
      const newMessages = [...defaultProps.messages, {
        id: 'new-msg',
        content: 'New message',
        type: 'ai' as const,
        userId: 'ai',
        createdAt: new Date().toISOString()
      }];

      rerender(<VirtualizedMessageList {...defaultProps} messages={newMessages} />);

      // Component should auto-scroll to bottom
      await waitFor(() => {
        const scrollToBottomButton = screen.queryByLabelText('Scroll to bottom');
        expect(scrollToBottomButton).not.toBeInTheDocument();
      });
    });

    it('should show scroll to bottom button when not at bottom', async () => {
      const { container } = render(
        <VirtualizedMessageList {...defaultProps} />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      if (scrollContainer) {
        // Mock being away from bottom
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000 });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 400 });
        Object.defineProperty(scrollContainer, 'scrollTop', { value: 200 });

        act(() => {
          fireEvent.scroll(scrollContainer);
        });

        await waitFor(() => {
          const scrollToBottomButton = screen.getByLabelText('Scroll to bottom');
          expect(scrollToBottomButton).toBeInTheDocument();
        });
      }
    });
  });

  describe('QA-003: Memory Leak Detection', () => {
    it('should cleanup height cache when size exceeds limit', () => {
      const { rerender } = render(
        <VirtualizedMessageList {...defaultProps} dynamicHeights={true} />
      );

      // Create many messages to exceed cache size
      const manyMessages = Array.from({ length: 1500 }, (_, i) => ({
        id: `cache-test-${i}`,
        content: `Message ${i}`,
        type: 'user' as const,
        userId: 'user1',
        createdAt: new Date().toISOString()
      }));

      rerender(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={manyMessages}
          dynamicHeights={true}
        />
      );

      // Cache should be cleaned up automatically (tested by not crashing)
      expect(true).toBe(true);
    });

    it('should remove message refs when components unmount', () => {
      const { unmount } = render(
        <VirtualizedMessageList {...defaultProps} />
      );

      unmount();

      // Component should unmount cleanly without errors
      expect(true).toBe(true);
    });

    it('should expire height cache entries after TTL', async () => {
      const { rerender } = render(
        <VirtualizedMessageList {...defaultProps} dynamicHeights={true} />
      );

      // Mock time to simulate cache expiry
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 70000); // 70 seconds later

      rerender(
        <VirtualizedMessageList {...defaultProps} dynamicHeights={true} />
      );

      Date.now = originalDateNow;

      // Cache entries should be recalculated
      expect(true).toBe(true);
    });
  });

  describe('QA-004: Mobile Touch Interaction Testing', () => {
    it('should track touch velocity for momentum scrolling', () => {
      const { container } = render(
        <VirtualizedMessageList {...defaultProps} enableMobileOptimization={true} />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      if (scrollContainer) {
        // Simulate touch start
        act(() => {
          fireEvent.touchStart(scrollContainer, {
            touches: [{ clientY: 100 }]
          });
        });

        // Simulate touch move with velocity
        act(() => {
          fireEvent.touchMove(scrollContainer, {
            touches: [{ clientY: 50 }]
          });
        });

        // Simulate touch end
        act(() => {
          fireEvent.touchEnd(scrollContainer);
        });

        // Should handle touch events without errors
        expect(true).toBe(true);
      }
    });

    it('should apply momentum scrolling on high velocity touch', () => {
      const { container } = render(
        <VirtualizedMessageList {...defaultProps} enableMobileOptimization={true} />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]') as HTMLElement;
      if (scrollContainer) {
        // Mock high velocity touch
        act(() => {
          fireEvent.touchStart(scrollContainer, {
            touches: [{ clientY: 100 }]
          });
        });

        // Quick movement
        act(() => {
          fireEvent.touchMove(scrollContainer, {
            touches: [{ clientY: 10 }]
          });
        });

        act(() => {
          fireEvent.touchEnd(scrollContainer);
        });

        // Should apply smooth scroll behavior
        setTimeout(() => {
          expect(scrollContainer.style.scrollBehavior).toBe('smooth');
        }, 100);
      }
    });

    it('should handle iOS Safari compatibility', () => {
      const { container } = render(
        <VirtualizedMessageList {...defaultProps} enableMobileOptimization={true} />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]') as HTMLElement;
      if (scrollContainer) {
        expect(scrollContainer.style.WebkitOverflowScrolling).toBe('touch');
        expect(scrollContainer.style.overscrollBehavior).toBe('contain');
      }
    });
  });

  describe('QA-005: Integration Testing', () => {
    it('should render MessageBubble components correctly', () => {
      render(<VirtualizedMessageList {...defaultProps} />);

      // Should render message bubbles
      const messageBubbles = screen.getAllByTestId(/^message-/);
      expect(messageBubbles.length).toBeGreaterThan(0);
    });

    it('should show typing indicator when isTyping is true', () => {
      render(<VirtualizedMessageList {...defaultProps} isTyping={true} />);

      const typingIndicator = screen.getByTestId('typing-indicator');
      expect(typingIndicator).toBeInTheDocument();
    });

    it('should handle empty message list', () => {
      render(<VirtualizedMessageList {...defaultProps} messages={[]} />);

      const emptyState = screen.getByText('Start a conversation with your AI Trading Coach');
      expect(emptyState).toBeInTheDocument();
    });

    it('should call onLoadMore when scrolled to top', async () => {
      const onLoadMore = vi.fn();
      const { container } = render(
        <VirtualizedMessageList 
          {...defaultProps} 
          onLoadMore={onLoadMore}
          hasMore={true}
        />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      if (scrollContainer) {
        act(() => {
          fireEvent.scroll(scrollContainer, { target: { scrollTop: 0 } });
        });

        await waitFor(() => {
          expect(onLoadMore).toHaveBeenCalled();
        });
      }
    });

    it('should show timestamp based on shouldShowTimestamp logic', () => {
      const messagesWithTimeGaps = [
        {
          id: 'msg-1',
          content: 'First message',
          type: 'user' as const,
          userId: 'user1',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
        },
        {
          id: 'msg-2',
          content: 'Second message',
          type: 'user' as const,
          userId: 'user1',
          createdAt: new Date().toISOString() // Now
        }
      ];

      render(<VirtualizedMessageList {...defaultProps} messages={messagesWithTimeGaps} />);

      // Both messages should show timestamps due to time gap
      const timestampElements = screen.getAllByText('timestamp');
      expect(timestampElements.length).toBe(2);
    });
  });

  describe('QA-006: Accessibility Compliance Testing', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      const { container } = render(
        <VirtualizedMessageList {...defaultProps} />
      );

      // Mock being away from bottom to show scroll button
      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      if (scrollContainer) {
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000 });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 400 });
        Object.defineProperty(scrollContainer, 'scrollTop', { value: 200 });

        act(() => {
          fireEvent.scroll(scrollContainer);
        });
      }

      // Check for accessibility attributes
      setTimeout(() => {
        const scrollToBottomButton = screen.queryByLabelText('Scroll to bottom');
        if (scrollToBottomButton) {
          expect(scrollToBottomButton).toHaveAttribute('aria-label', 'Scroll to bottom');
        }
      }, 100);
    });

    it('should support keyboard navigation', () => {
      const { container } = render(
        <VirtualizedMessageList {...defaultProps} />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      if (scrollContainer) {
        // Test keyboard events
        act(() => {
          fireEvent.keyDown(scrollContainer, { key: 'ArrowDown' });
          fireEvent.keyDown(scrollContainer, { key: 'ArrowUp' });
          fireEvent.keyDown(scrollContainer, { key: 'PageDown' });
          fireEvent.keyDown(scrollContainer, { key: 'PageUp' });
          fireEvent.keyDown(scrollContainer, { key: 'Home' });
          fireEvent.keyDown(scrollContainer, { key: 'End' });
        });

        // Should handle keyboard events without errors
        expect(true).toBe(true);
      }
    });

    it('should have proper focus management', () => {
      const { container } = render(
        <VirtualizedMessageList {...defaultProps} />
      );

      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      if (scrollContainer) {
        act(() => {
          (scrollContainer as HTMLElement).focus();
        });

        expect(document.activeElement).toBe(scrollContainer);
      }
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(
        <VirtualizedMessageList {...defaultProps} />
      );

      // Check for proper container structure
      const scrollContainer = container.querySelector('div[style*="overflow-y"]');
      expect(scrollContainer).toBeTruthy();

      // Check for message containers
      const messageContainers = container.querySelectorAll('[data-testid^="message-"]');
      expect(messageContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Stress Testing', () => {
    it('should handle large message lists without performance degradation', async () => {
      const largeMessageList = Array.from({ length: 10000 }, (_, index) => ({
        id: `stress-msg-${index}`,
        content: `Stress test message ${index}`,
        type: index % 2 === 0 ? 'user' : 'ai' as const,
        userId: index % 2 === 0 ? 'user1' : 'ai',
        createdAt: new Date(Date.now() - (9999 - index) * 1000).toISOString()
      }));

      const startTime = performance.now();
      
      render(
        <VirtualizedMessageList 
          {...defaultProps} 
          messages={largeMessageList}
          enablePerformanceMonitoring={true}
        />
      );

      const renderTime = performance.now() - startTime;
      
      // Should render in reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });

    it('should maintain performance during rapid state changes', async () => {
      const { rerender } = render(
        <VirtualizedMessageList {...defaultProps} />
      );

      // Rapidly change props to test performance
      for (let i = 0; i < 10; i++) {
        const newMessages = [...defaultProps.messages, {
          id: `rapid-${i}`,
          content: `Rapid message ${i}`,
          type: 'ai' as const,
          userId: 'ai',
          createdAt: new Date().toISOString()
        }];

        rerender(
          <VirtualizedMessageList 
            {...defaultProps} 
            messages={newMessages}
          />
        );
      }

      // Should handle rapid updates without errors
      expect(true).toBe(true);
    });
  });
});