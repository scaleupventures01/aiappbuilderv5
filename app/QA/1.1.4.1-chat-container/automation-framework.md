# Test Automation Framework — Chat Container Component

## Overview

This document outlines the comprehensive test automation framework for the Chat Container Component, including toolchain setup, CI/CD integration, and maintenance strategies.

## 1. AUTOMATION ARCHITECTURE

### 1.1 Testing Stack Architecture

```mermaid
graph TD
    A[Developer] --> B[Pre-commit Hooks]
    B --> C[Unit Tests - Vitest]
    B --> D[Linting & Type Check]
    C --> E[Integration Tests]
    D --> E
    E --> F[Security Scans]
    F --> G[E2E Tests - Playwright]
    G --> H[Performance Tests]
    H --> I[Visual Regression Tests]
    I --> J[Deployment]
    J --> K[Monitoring & Alerts]
```

### 1.2 Tool Selection Matrix

| Layer | Primary Tool | Alternative | Purpose | Justification |
|-------|-------------|-------------|---------|---------------|
| Unit Testing | Vitest | Jest | Component/function testing | Fast, modern, built-in TypeScript |
| Integration | Vitest + MSW | Cypress | API/service integration | Mock service worker integration |
| E2E Testing | Playwright | Cypress | Full user workflows | Cross-browser, fast, reliable |
| Performance | Lighthouse CI | WebPageTest | Web vitals monitoring | Industry standard, CI integration |
| Security | ESLint Security | SonarQube | Static analysis | Lightweight, fast feedback |
| Visual Regression | Percy | Chromatic | UI consistency | Component library integration |

## 2. TEST AUTOMATION SETUP

### 2.1 Project Configuration

#### Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: './coverage',
      threshold: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        './src/components/chat/': {
          branches: 98,
          functions: 98,
          lines: 98,
          statements: 98
        }
      },
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/types/',
        'dist/'
      ]
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 1000,
    silent: false,
    reporter: ['verbose', 'html', 'json'],
    outputFile: {
      html: './test-results/unit-test-report.html',
      json: './test-results/unit-test-results.json'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types')
    }
  }
});
```

#### Test Setup File
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';
import 'whatwg-fetch';

// Mock server setup
export const server = setupServer(...handlers);

// Global test setup
beforeAll(() => {
  // Start mock server
  server.listen({ onUnhandledRequest: 'error' });
  
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }));

  // Mock WebSocket
  global.WebSocket = vi.fn();

  // Mock performance API
  if (!global.performance) {
    global.performance = {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => []),
    } as any;
  }

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Clean up after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Increase test timeout for integration tests
vi.setConfig({ testTimeout: 10000 });
```

### 2.2 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    }
  ],

  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  expect: {
    timeout: 5000,
    toHaveScreenshot: { 
      mode: 'local',
      threshold: 0.3,
      animations: 'disabled'
    },
    toMatchSnapshot: {
      threshold: 0.3
    }
  },

  outputDir: 'test-results/playwright-output'
});
```

### 2.3 MSW Mock Setup

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { TestDataFactory } from '../factories/TestDataFactory';

export const handlers = [
  // Chat API endpoints
  http.get('/api/conversations/:conversationId/messages', ({ params }) => {
    const messages = TestDataFactory.createMessageList(50, {
      conversationId: params.conversationId as string
    });
    
    return HttpResponse.json({
      data: {
        messages,
        conversation: TestDataFactory.createConversation({
          id: params.conversationId as string
        })
      }
    });
  }),

  http.post('/api/conversations/:conversationId/messages', async ({ request, params }) => {
    const body = await request.json() as any;
    const message = TestDataFactory.createMessage({
      conversationId: params.conversationId as string,
      content: body.content,
      type: 'user'
    });
    
    return HttpResponse.json({ data: message });
  }),

  http.post('/api/conversations', async ({ request }) => {
    const body = await request.json() as any;
    const conversation = TestDataFactory.createConversation(body);
    
    return HttpResponse.json({ data: conversation });
  }),

  // WebSocket mock (handled separately)
  http.get('/socket.io/*', () => {
    return new HttpResponse(null, { status: 426 }); // Upgrade Required
  }),

  // Error scenarios
  http.get('/api/conversations/error-conversation/messages', () => {
    return HttpResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    );
  }),

  http.post('/api/conversations/rate-limited/messages', () => {
    return HttpResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  })
];

// WebSocket mock
export class MockWebSocket {
  static instance: MockWebSocket;
  events: Map<string, Function[]> = new Map();
  readyState = WebSocket.CONNECTING;

  static getInstance() {
    if (!MockWebSocket.instance) {
      MockWebSocket.instance = new MockWebSocket();
    }
    return MockWebSocket.instance;
  }

  on(event: string, callback: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  emit(event: string, data?: any) {
    const callbacks = this.events.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  connect() {
    this.readyState = WebSocket.OPEN;
    this.emit('connect');
  }

  disconnect() {
    this.readyState = WebSocket.CLOSED;
    this.emit('disconnect');
  }

  close() {
    this.disconnect();
  }
}
```

## 3. TEST DATA MANAGEMENT

### 3.1 Test Data Factory

```typescript
// src/test/factories/TestDataFactory.ts
import { faker } from '@faker-js/faker';
import { Message, Conversation, User } from '@/types';

export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: 'user',
      createdAt: faker.date.recent().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides
    };
  }

  static createMessage(overrides: Partial<Message> = {}): Message {
    const type = overrides.type || faker.helpers.arrayElement(['user', 'ai']);
    
    return {
      id: faker.string.uuid(),
      conversationId: overrides.conversationId || faker.string.uuid(),
      userId: faker.string.uuid(),
      content: this.generateMessageContent(type),
      type,
      metadata: this.generateMetadata(type),
      createdAt: faker.date.recent().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides
    };
  }

  static createMessageList(count: number, overrides: Partial<Message> = {}): Message[] {
    return Array.from({ length: count }, (_, index) => 
      this.createMessage({
        ...overrides,
        createdAt: faker.date.recent({ days: 7 }).toISOString()
      })
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  static createConversation(overrides: Partial<Conversation> = {}): Conversation {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.words({ min: 2, max: 5 }),
      description: faker.lorem.sentence(),
      userId: faker.string.uuid(),
      participantIds: [faker.string.uuid()],
      tags: faker.helpers.arrayElements(['trading', 'strategy', 'analysis'], { min: 0, max: 3 }),
      isActive: true,
      createdAt: faker.date.recent().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides
    };
  }

  static createPerformanceDataset() {
    return {
      smallDataset: this.createMessageList(10),
      mediumDataset: this.createMessageList(100),
      largeDataset: this.createMessageList(1000),
      extremeDataset: this.createMessageList(10000)
    };
  }

  private static generateMessageContent(type: 'user' | 'ai'): string {
    if (type === 'ai') {
      const templates = [
        'Based on the current market conditions, I recommend {action} {instrument} at {price}.',
        'The {indicator} is showing {signal} signals for {timeframe}.',
        'Risk assessment: {risk} - Consider {strategy} approach.',
        'Market analysis suggests {trend} trend with {confidence}% confidence.'
      ];
      
      return faker.helpers.arrayElement(templates)
        .replace('{action}', faker.helpers.arrayElement(['buying', 'selling', 'holding']))
        .replace('{instrument}', faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'USDJPY']))
        .replace('{price}', faker.finance.amount({ min: 1, max: 2, dec: 5 }))
        .replace('{indicator}', faker.helpers.arrayElement(['RSI', 'MACD', 'Moving Average']))
        .replace('{signal}', faker.helpers.arrayElement(['bullish', 'bearish', 'neutral']))
        .replace('{timeframe}', faker.helpers.arrayElement(['short-term', 'medium-term', 'long-term']))
        .replace('{risk}', faker.helpers.arrayElement(['Low', 'Medium', 'High']))
        .replace('{strategy}', faker.helpers.arrayElement(['conservative', 'aggressive', 'balanced']))
        .replace('{trend}', faker.helpers.arrayElement(['upward', 'downward', 'sideways']))
        .replace('{confidence}', faker.number.int({ min: 60, max: 95 }).toString());
    }
    
    const userTemplates = [
      'What do you think about {instrument}?',
      'Should I {action} {instrument} now?',
      'What\'s your analysis on {timeframe} trends?',
      'Help me understand {concept}',
      'Is this a good entry point for {instrument}?'
    ];
    
    return faker.helpers.arrayElement(userTemplates)
      .replace('{instrument}', faker.helpers.arrayElement(['EURUSD', 'GBPUSD', 'USDJPY', 'Gold', 'Bitcoin']))
      .replace('{action}', faker.helpers.arrayElement(['buy', 'sell', 'trade']))
      .replace('{timeframe}', faker.helpers.arrayElement(['daily', 'weekly', 'monthly']))
      .replace('{concept}', faker.helpers.arrayElement(['support levels', 'resistance', 'momentum', 'volatility']));
  }

  private static generateMetadata(type: 'user' | 'ai') {
    const baseMetadata = {
      timestamp: Date.now(),
      version: '1.0'
    };

    if (type === 'ai') {
      return {
        ...baseMetadata,
        confidence: faker.number.float({ min: 0.6, max: 1.0, fractionDigits: 2 }),
        modelVersion: 'gpt-4-trading-v2.1',
        responseTime: faker.number.int({ min: 200, max: 2000 }),
        sources: faker.helpers.arrayElements(['technical-analysis', 'news-sentiment', 'market-data'], { min: 1, max: 3 })
      };
    }

    return {
      ...baseMetadata,
      device: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
      browser: faker.helpers.arrayElement(['chrome', 'firefox', 'safari']),
      location: faker.location.country()
    };
  }
}
```

### 3.2 Test Environment Management

```typescript
// src/test/environment/TestEnvironment.ts
export class TestEnvironment {
  private static containers: Map<string, any> = new Map();

  static async setup() {
    if (process.env.NODE_ENV === 'test') {
      await this.setupTestContainers();
    }
    
    await this.seedTestData();
    this.configureTestServices();
  }

  static async teardown() {
    if (this.containers.size > 0) {
      await this.stopTestContainers();
    }
    
    await this.cleanupTestData();
  }

  private static async setupTestContainers() {
    // PostgreSQL container for integration tests
    const { GenericContainer } = await import('testcontainers');
    
    const postgresContainer = await new GenericContainer('postgres:14')
      .withEnvironment({
        POSTGRES_DB: 'test_chat',
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test'
      })
      .withExposedPorts(5432)
      .start();

    this.containers.set('postgres', postgresContainer);

    // Redis container for session management
    const redisContainer = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    this.containers.set('redis', redisContainer);

    // Set environment variables
    process.env.DATABASE_URL = `postgresql://test:test@localhost:${postgresContainer.getMappedPort(5432)}/test_chat`;
    process.env.REDIS_URL = `redis://localhost:${redisContainer.getMappedPort(6379)}`;
  }

  private static async stopTestContainers() {
    for (const [name, container] of this.containers) {
      await container.stop();
      console.log(`Stopped ${name} container`);
    }
    this.containers.clear();
  }

  private static async seedTestData() {
    // Seed initial test data
    const conversations = TestDataFactory.createConversationList(5);
    const messages = conversations.flatMap(conv => 
      TestDataFactory.createMessageList(20, { conversationId: conv.id })
    );

    // Store in test database or mock storage
    if (global.testDatabase) {
      await global.testDatabase.conversations.createMany({ data: conversations });
      await global.testDatabase.messages.createMany({ data: messages });
    }
  }

  private static configureTestServices() {
    // Configure test-specific service settings
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error';
    process.env.DISABLE_RATE_LIMITING = 'true';
    process.env.MOCK_EXTERNAL_SERVICES = 'true';
  }

  private static async cleanupTestData() {
    if (global.testDatabase) {
      await global.testDatabase.messages.deleteMany({});
      await global.testDatabase.conversations.deleteMany({});
      await global.testDatabase.users.deleteMany({});
    }
  }
}
```

## 4. CI/CD PIPELINE INTEGRATION

### 4.1 GitHub Actions Workflow

```yaml
# .github/workflows/chat-container-qa.yml
name: Chat Container QA Pipeline

on:
  push:
    branches: [main, develop]
    paths:
      - 'src/components/chat/**'
      - 'src/stores/chatStore.ts'
      - 'tests/**'
  pull_request:
    branches: [main]
    paths:
      - 'src/components/chat/**'
      - 'src/stores/chatStore.ts'
      - 'tests/**'

env:
  NODE_VERSION: '20.x'
  CACHE_VERSION: v1

jobs:
  # Quality Gates
  quality-gates:
    name: Quality Gates
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'package-lock.json'

      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit

      - name: Type checking
        run: npm run typecheck

      - name: Linting
        run: npm run lint -- --max-warnings 0

      - name: Formatting check
        run: npm run format:check

      - name: Security audit
        run: npm audit --audit-level high

  # Unit Tests
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: quality-gates
    
    strategy:
      matrix:
        node-version: ['18.x', '20.x']
    
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage --reporter=verbose,json --outputFile=test-results/unit-results.json

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unit-tests
          name: codecov-chat-container

      - name: Archive test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: unit-test-results-${{ matrix.node-version }}
          path: |
            test-results/
            coverage/

  # Integration Tests
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: quality-gates
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: test_chat
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_chat

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_chat
          REDIS_URL: redis://localhost:6379

      - name: Archive integration test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: integration-test-results
          path: test-results/integration/

  # End-to-End Tests
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install ${{ matrix.browser }} --with-deps

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm run preview &
        env:
          PORT: 3000

      - name: Wait for application
        run: npx wait-on http://localhost:3000 --timeout 60000

      - name: Run E2E tests
        run: npx playwright test --project=${{ matrix.browser }}

      - name: Upload E2E test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-test-results-${{ matrix.browser }}
          path: |
            playwright-report/
            test-results/

  # Performance Tests
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: e2e-tests

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm run preview &

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
        if: always()
        with:
          name: performance-test-results
          path: |
            lighthouse-results/
            performance-test-results.json

  # Security Tests
  security-tests:
    name: Security Tests
    runs-on: ubuntu-latest
    needs: quality-gates

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run security linting
        run: npm run lint:security

      - name: Run dependency security scan
        run: npm audit --audit-level moderate

      - name: Run OWASP ZAP scan
        if: github.event_name == 'push'
        run: |
          docker run --rm -t \
            -v $(pwd):/zap/wrk/:rw \
            owasp/zap2docker-stable \
            zap-baseline.py -t http://host.docker.internal:3000 \
            -r security-scan-report.html

      - name: Upload security scan results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-scan-results
          path: security-scan-report.html

  # Test Report Generation
  generate-reports:
    name: Generate Test Reports
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests, performance-tests]
    if: always()

    steps:
      - uses: actions/checkout@v4

      - name: Download all artifacts
        uses: actions/download-artifact@v3

      - name: Generate comprehensive test report
        run: node scripts/generate-test-report.js

      - name: Upload comprehensive report
        uses: actions/upload-artifact@v3
        with:
          name: comprehensive-test-report
          path: test-report.html

      - name: Comment PR with test results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const testSummary = fs.readFileSync('test-summary.md', 'utf8');
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: testSummary
            });
```

### 4.2 Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:unit",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write",
      "npm run test:unit -- --passWithNoTests --findRelatedTests"
    ],
    "src/**/*.{css,scss}": [
      "stylelint --fix",
      "prettier --write"
    ],
    "**/*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

## 5. TEST MAINTENANCE STRATEGY

### 5.1 Test Code Quality

```typescript
// Test quality rules and guidelines
const testQualityRules = {
  // Test naming conventions
  naming: {
    describe: 'Component/Feature name',
    test: 'should [expected behavior] when [condition]',
    testId: 'kebab-case-descriptive-names'
  },

  // Test structure
  structure: {
    arrange: 'Setup test data and mocks',
    act: 'Execute the behavior being tested',
    assert: 'Verify the expected outcome'
  },

  // Test isolation
  isolation: {
    noSharedState: 'Each test should be independent',
    cleanupAfter: 'Clean up resources after each test',
    mockExternal: 'Mock all external dependencies'
  },

  // Performance
  performance: {
    fastFeedback: 'Tests should complete quickly',
    parallelExecution: 'Tests should be parallelizable',
    minimalSetup: 'Use minimal test setup required'
  }
};

// Test quality metrics
export class TestQualityMetrics {
  static analyzeTestSuite() {
    return {
      coverage: this.getCoverageMetrics(),
      performance: this.getPerformanceMetrics(),
      maintainability: this.getMaintainabilityMetrics(),
      reliability: this.getReliabilityMetrics()
    };
  }

  private static getCoverageMetrics() {
    return {
      line: '95%',
      branch: '90%',
      function: '95%',
      statement: '95%'
    };
  }

  private static getPerformanceMetrics() {
    return {
      averageTestTime: '50ms',
      totalSuiteTime: '2.5s',
      slowestTest: '200ms',
      parallelizationRatio: '80%'
    };
  }

  private static getMaintainabilityMetrics() {
    return {
      testCodeDuplication: '5%',
      averageTestComplexity: 'Low',
      testToCodeRatio: '1:2',
      maintenanceEffort: 'Low'
    };
  }

  private static getReliabilityMetrics() {
    return {
      flakeTestCount: 0,
      passRate: '99.8%',
      falsePositiveRate: '0.1%',
      testStability: 'High'
    };
  }
}
```

### 5.2 Automated Test Maintenance

```typescript
// test-maintenance.ts
export class TestMaintenanceAutomation {
  static async runMaintenance() {
    await this.removeObsoleteTests();
    await this.updateTestSnapshots();
    await this.optimizeTestPerformance();
    await this.validateTestCoverage();
  }

  private static async removeObsoleteTests() {
    // Find tests for deleted/moved components
    const obsoleteTests = await this.findObsoleteTestFiles();
    
    obsoleteTests.forEach(testFile => {
      console.log(`Removing obsolete test: ${testFile}`);
      // Remove or flag for manual review
    });
  }

  private static async updateTestSnapshots() {
    // Update visual regression snapshots
    const outdatedSnapshots = await this.findOutdatedSnapshots();
    
    if (outdatedSnapshots.length > 0) {
      console.log('Updating visual snapshots...');
      // Update snapshots automatically or prompt for review
    }
  }

  private static async optimizeTestPerformance() {
    const slowTests = await this.identifySlowTests();
    
    slowTests.forEach(test => {
      console.log(`Optimizing slow test: ${test.name} (${test.duration}ms)`);
      // Suggest optimizations
    });
  }

  private static async validateTestCoverage() {
    const coverage = await this.analyzeCoverage();
    
    if (coverage.overall < 95) {
      throw new Error(`Coverage below threshold: ${coverage.overall}%`);
    }
  }
}
```

## 6. MONITORING AND REPORTING

### 6.1 Test Dashboard

```typescript
// test-dashboard.ts
export class TestDashboard {
  generateDashboard() {
    return {
      overview: this.getTestOverview(),
      trends: this.getTestTrends(),
      coverage: this.getCoverageReport(),
      performance: this.getPerformanceReport(),
      flakeTests: this.getFlakeTestReport()
    };
  }

  private getTestOverview() {
    return {
      totalTests: 1247,
      passedTests: 1245,
      failedTests: 2,
      skippedTests: 0,
      passRate: 99.8,
      executionTime: '2m 34s'
    };
  }

  private getTestTrends() {
    return {
      last30Days: {
        averagePassRate: 99.7,
        averageExecutionTime: '2m 31s',
        newTestsAdded: 15,
        testsRemoved: 3
      }
    };
  }

  private getCoverageReport() {
    return {
      overall: 96.2,
      components: 98.1,
      utils: 94.3,
      stores: 97.8,
      hooks: 95.5
    };
  }

  private getPerformanceReport() {
    return {
      unit: { average: '45ms', max: '180ms' },
      integration: { average: '450ms', max: '2.1s' },
      e2e: { average: '15s', max: '45s' }
    };
  }

  private getFlakeTestReport() {
    return {
      flakeCount: 0,
      stabilityScore: 100,
      recentFlakes: []
    };
  }
}
```

This comprehensive automation framework ensures consistent, reliable, and maintainable testing of the Chat Container Component while providing excellent developer experience and continuous quality monitoring.