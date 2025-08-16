# Performance Benchmarks — Chat Container Component

## Overview

This document defines the specific performance benchmarks and testing requirements for the Chat Container Component to ensure optimal user experience and scalability.

## 1. CORE PERFORMANCE METRICS

### 1.1 Response Time Benchmarks

| Metric | Target | Acceptable | Critical Threshold |
|--------|--------|------------|-------------------|
| Initial Page Load | <1.5s | <2.0s | >3.0s |
| Chat Container Mount | <500ms | <800ms | >1.2s |
| Message List Render (100 msgs) | <200ms | <400ms | >800ms |
| Message List Render (1000 msgs) | <800ms | <1.5s | >2.5s |
| New Message Display | <50ms | <100ms | >200ms |
| Scroll to Bottom | <100ms | <200ms | >400ms |
| WebSocket Connection | <300ms | <500ms | >1000ms |
| Message Send Confirmation | <200ms | <400ms | >800ms |

### 1.2 Rendering Performance

| Metric | Target | Acceptable | Critical Threshold |
|--------|--------|------------|-------------------|
| Scroll Frame Rate | 60fps | >45fps | <30fps |
| Smooth Scroll Duration | <500ms | <800ms | >1200ms |
| Component Re-render Time | <16ms | <33ms | >50ms |
| Virtual Scroll Efficiency | >90% | >80% | <70% |
| Layout Shift (CLS) | <0.1 | <0.25 | >0.5 |
| First Contentful Paint | <1.2s | <1.8s | >2.5s |
| Largest Contentful Paint | <2.5s | <4.0s | >6.0s |

### 1.3 Resource Usage

| Metric | Target | Acceptable | Critical Threshold |
|--------|--------|------------|-------------------|
| Memory Usage (Idle) | <10MB | <20MB | >30MB |
| Memory Usage (1000 msgs) | <30MB | <50MB | >80MB |
| Memory Growth Rate | <1MB/100msgs | <2MB/100msgs | >5MB/100msgs |
| CPU Usage (Idle) | <2% | <5% | >10% |
| CPU Usage (Active Chat) | <10% | <20% | >40% |
| Network Usage | <1KB/msg | <2KB/msg | >5KB/msg |
| Bundle Size (Chat Module) | <300KB | <500KB | >800KB |

## 2. LOAD TESTING SPECIFICATIONS

### 2.1 Message Volume Testing

**Test Scenario 1: High Message Count**
```javascript
const loadTestScenario1 = {
  name: "High Message Volume",
  messageCount: 1000,
  loadPattern: "batch",
  expectedResults: {
    initialRender: "<1.5s",
    scrollPerformance: "60fps",
    memoryUsage: "<50MB",
    searchPerformance: "<200ms"
  }
};
```

**Test Scenario 2: Continuous Message Flow**
```javascript
const loadTestScenario2 = {
  name: "Continuous Message Stream",
  duration: "10 minutes",
  messageRate: "5 messages/second",
  expectedResults: {
    frameRate: ">50fps",
    memoryGrowth: "<5MB/minute",
    latency: "<100ms",
    dropRate: "0%"
  }
};
```

**Test Scenario 3: Burst Message Handling**
```javascript
const loadTestScenario3 = {
  name: "Message Burst",
  burstSize: 50,
  burstInterval: "30 seconds",
  duration: "5 minutes",
  expectedResults: {
    uiBlocking: "0ms",
    memorySpike: "<20MB",
    recovery: "<1s",
    ordering: "100% accurate"
  }
};
```

### 2.2 Concurrent User Testing

**Single Conversation Load**
- Concurrent users: 10 per conversation
- Message frequency: 1 message/user/30s
- Duration: 30 minutes
- Success criteria: No performance degradation

**Multi-Conversation Load**
- Total conversations: 10
- Users per conversation: 5
- Message frequency: 1 message/user/60s
- Duration: 60 minutes
- Success criteria: Linear resource scaling

**Peak Load Simulation**
- Concurrent connections: 100
- Active conversations: 20
- Peak message rate: 50 messages/second
- Duration: 15 minutes
- Success criteria: Graceful degradation only

## 3. PERFORMANCE TESTING IMPLEMENTATION

### 3.1 Automated Performance Tests

```typescript
// performance.test.ts
import { performance, PerformanceObserver } from 'perf_hooks';
import { render, screen, waitFor } from '@testing-library/react';
import { ChatContainer } from '../ChatContainer';
import { TestDataFactory } from '../../../test/factories';

describe('Chat Container Performance', () => {
  let performanceEntries: PerformanceEntry[] = [];
  
  beforeEach(() => {
    performanceEntries = [];
    const obs = new PerformanceObserver((list) => {
      performanceEntries.push(...list.getEntries());
    });
    obs.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
  });

  describe('Rendering Performance', () => {
    test('should render 100 messages within 400ms', async () => {
      const messages = TestDataFactory.createMessageList(100);
      const startTime = performance.now();
      
      render(<ChatContainer messages={messages} />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('message-bubble')).toHaveLength(100);
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(400);
    });

    test('should render 1000 messages within 1.5s', async () => {
      const messages = TestDataFactory.createMessageList(1000);
      const startTime = performance.now();
      
      render(<ChatContainer messages={messages} />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('message-bubble')).toHaveLength(1000);
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(1500);
    });

    test('should maintain 60fps during scroll with 1000 messages', async () => {
      const messages = TestDataFactory.createMessageList(1000);
      render(<ChatContainer messages={messages} />);
      
      const scrollContainer = screen.getByTestId('message-scroll-container');
      const frameRate = await measureScrollFrameRate(scrollContainer);
      
      expect(frameRate).toBeGreaterThanOrEqual(60);
    });
  });

  describe('Memory Usage', () => {
    test('should use less than 30MB for 1000 messages', async () => {
      const messages = TestDataFactory.createMessageList(1000);
      
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      render(<ChatContainer messages={messages} />);
      
      await waitFor(() => {
        expect(screen.getAllByTestId('message-bubble')).toHaveLength(1000);
      });
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryUsage = (finalMemory - initialMemory) / (1024 * 1024); // MB
      
      expect(memoryUsage).toBeLessThan(30);
    });

    test('should have linear memory growth with message count', async () => {
      const measurements = [];
      
      for (const count of [100, 500, 1000]) {
        const messages = TestDataFactory.createMessageList(count);
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        const { unmount } = render(<ChatContainer messages={messages} />);
        
        await waitFor(() => {
          expect(screen.getAllByTestId('message-bubble')).toHaveLength(count);
        });
        
        const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
        const memoryUsage = finalMemory - initialMemory;
        
        measurements.push({ count, memory: memoryUsage });
        unmount();
      }
      
      // Verify linear growth (R² > 0.9)
      const correlation = calculateCorrelation(measurements);
      expect(correlation).toBeGreaterThan(0.9);
    });
  });

  describe('WebSocket Performance', () => {
    test('should establish connection within 500ms', async () => {
      const startTime = performance.now();
      
      render(<ChatContainer />);
      
      await waitFor(() => {
        expect(screen.getByText(/Connected/)).toBeInTheDocument();
      });
      
      const connectionTime = performance.now() - startTime;
      expect(connectionTime).toBeLessThan(500);
    });

    test('should deliver messages with <200ms latency', async () => {
      const { mockSocket } = render(<ChatContainer />);
      
      const latencies = [];
      
      for (let i = 0; i < 10; i++) {
        const message = TestDataFactory.createMessage();
        const startTime = performance.now();
        
        mockSocket.emit('message', message);
        
        await waitFor(() => {
          expect(screen.getByText(message.content)).toBeInTheDocument();
        });
        
        const latency = performance.now() - startTime;
        latencies.push(latency);
      }
      
      const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      expect(averageLatency).toBeLessThan(200);
    });
  });
});

// Utility functions
async function measureScrollFrameRate(element: HTMLElement): Promise<number> {
  return new Promise((resolve) => {
    const frames: number[] = [];
    let lastTime = performance.now();
    
    function measureFrame() {
      const now = performance.now();
      const delta = now - lastTime;
      frames.push(1000 / delta); // FPS
      lastTime = now;
      
      if (frames.length < 60) {
        requestAnimationFrame(measureFrame);
      } else {
        const avgFPS = frames.reduce((a, b) => a + b, 0) / frames.length;
        resolve(avgFPS);
      }
    }
    
    // Start scrolling animation
    element.scrollBy({ top: 1000, behavior: 'smooth' });
    requestAnimationFrame(measureFrame);
  });
}

function calculateCorrelation(data: Array<{count: number, memory: number}>): number {
  const n = data.length;
  const sumX = data.reduce((sum, d) => sum + d.count, 0);
  const sumY = data.reduce((sum, d) => sum + d.memory, 0);
  const sumXY = data.reduce((sum, d) => sum + d.count * d.memory, 0);
  const sumX2 = data.reduce((sum, d) => sum + d.count * d.count, 0);
  const sumY2 = data.reduce((sum, d) => sum + d.memory * d.memory, 0);
  
  const correlation = (n * sumXY - sumX * sumY) / 
    Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return correlation * correlation; // R²
}
```

### 3.2 Load Testing Scripts

```javascript
// artillery-load-test.yml
config:
  target: 'ws://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 1
      name: "Warm up"
    - duration: 300
      arrivalRate: 5
      name: "Ramp up load"
    - duration: 600
      arrivalRate: 10
      name: "Sustained load"
    - duration: 300
      arrivalRate: 20
      name: "Peak load"
  ws:
    connect:
      timeout: 5000
  processor: "./load-test-processor.js"

scenarios:
  - name: "Chat Load Test"
    weight: 100
    engine: ws
    flow:
      - connect:
          url: "/socket.io/?EIO=4&transport=websocket"
      - think: 5
      - emit:
          channel: "join-conversation"
          data:
            conversationId: "{{ $randomString() }}"
            userId: "{{ $randomString() }}"
      - loop:
          - emit:
              channel: "send-message" 
              data:
                content: "{{ $randomString() }}"
                timestamp: "{{ $timestamp() }}"
          - think: "{{ $randomInt(5, 30) }}"
        count: 50

// load-test-processor.js
module.exports = {
  setRandomValues: function(context, events, done) {
    context.vars['randomString'] = function() {
      return Math.random().toString(36).substring(7);
    };
    context.vars['timestamp'] = function() {
      return Date.now();
    };
    context.vars['randomInt'] = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    return done();
  }
};
```

## 4. PERFORMANCE MONITORING

### 4.1 Real-Time Performance Monitoring

```typescript
// performance-monitor.ts
export class ChatPerformanceMonitor {
  private metrics: Map<string, PerformanceEntry[]> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.setupObservers();
  }

  private setupObservers() {
    // Rendering performance
    const renderObserver = new PerformanceObserver((list) => {
      this.recordMetrics('render', list.getEntries());
    });
    renderObserver.observe({ entryTypes: ['measure'] });
    this.observers.push(renderObserver);

    // Memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memory', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          timestamp: Date.now()
        });
      }, 5000);
    }

    // Frame rate monitoring
    this.monitorFrameRate();
  }

  private monitorFrameRate() {
    let frames = 0;
    let lastTime = performance.now();

    const countFrame = () => {
      frames++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        this.recordMetric('fps', {
          frameRate: frames,
          timestamp: now
        });
        frames = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(countFrame);
    };
    
    requestAnimationFrame(countFrame);
  }

  public recordMetrics(type: string, entries: PerformanceEntry[]) {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    this.metrics.get(type)!.push(...entries);
  }

  public recordMetric(type: string, data: any) {
    console.log(`Performance Metric [${type}]:`, data);
    
    // Send to monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_type: type,
        value: JSON.stringify(data)
      });
    }
  }

  public getMetricsSummary() {
    const summary: Record<string, any> = {};
    
    this.metrics.forEach((entries, type) => {
      summary[type] = {
        count: entries.length,
        average: entries.reduce((sum, entry) => sum + entry.duration, 0) / entries.length,
        min: Math.min(...entries.map(e => e.duration)),
        max: Math.max(...entries.map(e => e.duration))
      };
    });
    
    return summary;
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.metrics.clear();
  }
}

// Usage in Chat Component
export const ChatContainer = () => {
  const performanceMonitor = useRef(new ChatPerformanceMonitor());
  
  useEffect(() => {
    return () => {
      performanceMonitor.current.destroy();
    };
  }, []);

  const handleNewMessage = useCallback((message: Message) => {
    performance.mark('message-render-start');
    
    // Add message to state
    addMessage(message);
    
    performance.mark('message-render-end');
    performance.measure('message-render', 'message-render-start', 'message-render-end');
  }, [addMessage]);

  // ... rest of component
};
```

## 5. PERFORMANCE ALERTS AND THRESHOLDS

### 5.1 Alert Configuration

```yaml
# performance-alerts.yml
alerts:
  - name: "High Message Render Time"
    metric: "message_render_duration"
    threshold: 100  # ms
    severity: "warning"
    action: "log_and_notify"
    
  - name: "Critical Message Render Time"
    metric: "message_render_duration" 
    threshold: 200  # ms
    severity: "critical"
    action: "alert_and_fallback"
    
  - name: "Low Frame Rate"
    metric: "scroll_frame_rate"
    threshold: 30  # fps
    severity: "warning"
    action: "optimize_rendering"
    
  - name: "High Memory Usage"
    metric: "memory_usage_mb"
    threshold: 50  # MB
    severity: "warning"
    action: "garbage_collect"
    
  - name: "WebSocket Latency High"
    metric: "websocket_latency"
    threshold: 500  # ms
    severity: "warning" 
    action: "connection_diagnostic"
```

### 5.2 Performance Degradation Handling

```typescript
// performance-guard.ts
export class PerformanceGuard {
  private static instance: PerformanceGuard;
  private performanceState = {
    messageRenderTime: 0,
    frameRate: 60,
    memoryUsage: 0,
    isOptimized: false
  };

  static getInstance(): PerformanceGuard {
    if (!PerformanceGuard.instance) {
      PerformanceGuard.instance = new PerformanceGuard();
    }
    return PerformanceGuard.instance;
  }

  checkPerformance() {
    if (this.performanceState.messageRenderTime > 100) {
      this.optimizeMessageRendering();
    }
    
    if (this.performanceState.frameRate < 30) {
      this.optimizeScrolling();
    }
    
    if (this.performanceState.memoryUsage > 50) {
      this.optimizeMemoryUsage();
    }
  }

  private optimizeMessageRendering() {
    console.warn('Performance: Optimizing message rendering');
    // Enable virtual scrolling
    // Reduce message detail level
    // Batch message updates
    this.performanceState.isOptimized = true;
  }

  private optimizeScrolling() {
    console.warn('Performance: Optimizing scroll performance');
    // Reduce scroll smoothness
    // Disable non-essential animations
    // Use transform instead of scroll
  }

  private optimizeMemoryUsage() {
    console.warn('Performance: Optimizing memory usage');
    // Implement message pagination
    // Clear old message cache
    // Force garbage collection
  }

  updatePerformanceState(metrics: Partial<typeof this.performanceState>) {
    Object.assign(this.performanceState, metrics);
    this.checkPerformance();
  }
}
```

## 6. PERFORMANCE BENCHMARKING TOOLS

### 6.1 Automated Benchmarking

```javascript
// benchmark-runner.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runPerformanceBenchmarks() {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port
  };

  const runnerResult = await lighthouse('http://localhost:3000/chat', options);
  
  const reportJson = JSON.parse(runnerResult.report);
  const performanceScore = reportJson.categories.performance.score * 100;
  
  console.log('Performance Score:', performanceScore);
  
  // Extract specific metrics
  const metrics = {
    firstContentfulPaint: reportJson.audits['first-contentful-paint'].numericValue,
    largestContentfulPaint: reportJson.audits['largest-contentful-paint'].numericValue,
    cumulativeLayoutShift: reportJson.audits['cumulative-layout-shift'].numericValue,
    totalBlockingTime: reportJson.audits['total-blocking-time'].numericValue
  };
  
  console.log('Core Web Vitals:', metrics);
  
  await chrome.kill();
  
  // Validate against benchmarks
  validateBenchmarks(metrics);
}

function validateBenchmarks(metrics) {
  const benchmarks = {
    firstContentfulPaint: 1800, // 1.8s
    largestContentfulPaint: 2500, // 2.5s  
    cumulativeLayoutShift: 0.1,
    totalBlockingTime: 200 // 200ms
  };
  
  Object.entries(benchmarks).forEach(([key, threshold]) => {
    const actual = metrics[key];
    const passed = actual <= threshold;
    
    console.log(`${key}: ${actual} ${passed ? '✓' : '✗'} (threshold: ${threshold})`);
    
    if (!passed) {
      process.exit(1);
    }
  });
}

runPerformanceBenchmarks();
```

## 7. CONTINUOUS PERFORMANCE MONITORING

### 7.1 Performance CI/CD Integration

```yaml
# .github/workflows/performance.yml
name: Performance Testing

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  performance:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Start application
        run: npm start &
        
      - name: Wait for application
        run: npx wait-on http://localhost:3000
        
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun --config=.lighthouserc.js
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
          
      - name: Run custom performance tests
        run: npm run test:performance
        
      - name: Archive performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: |
            lighthouse-results/
            performance-test-results.json
```

This comprehensive performance benchmarking strategy ensures the Chat Container Component meets all performance requirements while providing continuous monitoring and optimization capabilities.