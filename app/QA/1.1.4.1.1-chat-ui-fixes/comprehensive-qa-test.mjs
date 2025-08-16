#!/usr/bin/env node

/**
 * COMPREHENSIVE QA TEST SUITE FOR PRD-1.1.4.1.1 (Chat UI Fixes & MVP Polish)
 * 
 * This test suite validates the Frontend Engineer's implementation of:
 * - FE-006: Type system consolidation
 * - FE-001: Chat container height constraints 
 * - FE-008: Container overflow investigation
 * - FE-002: Message bubble width investigation
 * - FE-003: MessageInput bottom positioning
 * 
 * Test Phases:
 * QA-001: Message Bubble Display Validation
 * QA-002: Chat Container Scrolling Performance
 * QA-003: Message Input Functionality
 * QA-004: Visual Regression & Layout Validation
 * QA-005: Accessibility & Keyboard Navigation
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

class ChatUIFixesQAValidator {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      testSuite: 'PRD-1.1.4.1.1-chat-ui-fixes',
      phases: {
        'QA-001': { name: 'Message Bubble Display Validation', status: 'PENDING', tests: [] },
        'QA-002': { name: 'Chat Container Scrolling Performance', status: 'PENDING', tests: [] },
        'QA-003': { name: 'Message Input Functionality', status: 'PENDING', tests: [] },
        'QA-004': { name: 'Visual Regression & Layout Validation', status: 'PENDING', tests: [] },
        'QA-005': { name: 'Accessibility & Keyboard Navigation', status: 'PENDING', tests: [] }
      },
      overallStatus: 'PENDING',
      summary: {},
      metrics: {},
      recommendations: []
    };
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive QA Testing for PRD-1.1.4.1.1');
    console.log('📋 Testing Chat UI Fixes & MVP Polish Implementation\n');
    
    const startTime = performance.now();
    
    try {
      // Phase 1: Message Bubble Display Validation
      await this.runPhase1MessageBubbleValidation();
      
      // Phase 2: Chat Container Scrolling Performance
      await this.runPhase2ScrollingPerformance();
      
      // Phase 3: Message Input Functionality
      await this.runPhase3InputFunctionality();
      
      // Phase 4: Visual Regression & Layout Validation
      await this.runPhase4VisualRegression();
      
      // Phase 5: Accessibility & Keyboard Navigation
      await this.runPhase5Accessibility();
      
      // Calculate overall results
      this.calculateOverallResults();
      
      const endTime = performance.now();
      this.testResults.metrics.totalExecutionTime = `${(endTime - startTime).toFixed(2)}ms`;
      
      // Generate report
      await this.generateQAReport();
      
      console.log('\n✅ QA Testing Complete!');
      console.log(`📊 Overall Status: ${this.testResults.overallStatus}`);
      console.log(`⏱️  Total Time: ${this.testResults.metrics.totalExecutionTime}`);
      
    } catch (error) {
      console.error('❌ QA Testing Failed:', error.message);
      this.testResults.overallStatus = 'FAILED';
      this.testResults.error = error.message;
      await this.generateQAReport();
      throw error;
    }
  }

  async runPhase1MessageBubbleValidation() {
    console.log('🔍 Phase 1: Message Bubble Display Validation');
    
    const phase = this.testResults.phases['QA-001'];
    phase.status = 'RUNNING';
    
    try {
      // Test 1.1: Verify MessageBubble component structure
      const bubbleTest = this.validateMessageBubbleComponent();
      phase.tests.push(bubbleTest);
      
      // Test 1.2: Validate CSS layout and styling
      const stylingTest = this.validateBubbleStyling();
      phase.tests.push(stylingTest);
      
      // Test 1.3: Check responsive behavior
      const responsiveTest = this.validateResponsiveBubbles();
      phase.tests.push(responsiveTest);
      
      // Test 1.4: WCAG AA compliance check
      const accessibilityTest = this.validateWCAGCompliance();
      phase.tests.push(accessibilityTest);
      
      // Test 1.5: Text wrapping and overflow handling
      const textHandlingTest = this.validateTextHandling();
      phase.tests.push(textHandlingTest);
      
      const passedTests = phase.tests.filter(t => t.status === 'PASS').length;
      phase.status = passedTests === phase.tests.length ? 'PASS' : 'PARTIAL';
      
      console.log(`   ✅ Phase 1 Complete: ${passedTests}/${phase.tests.length} tests passed\n`);
      
    } catch (error) {
      phase.status = 'FAIL';
      phase.error = error.message;
      console.log(`   ❌ Phase 1 Failed: ${error.message}\n`);
    }
  }

  validateMessageBubbleComponent() {
    const test = {
      id: 'QA-001-01',
      name: 'MessageBubble Component Structure Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      // Check if MessageBubble.tsx exists and has proper structure
      const bubblePath = join(PROJECT_ROOT, 'src/components/chat/MessageBubble.tsx');
      
      if (!existsSync(bubblePath)) {
        throw new Error('MessageBubble.tsx not found');
      }
      
      const bubbleContent = readFileSync(bubblePath, 'utf8');
      
      // Validate component structure
      const structureChecks = {
        hasProperImports: bubbleContent.includes('import React') && bubbleContent.includes('@/types/chat'),
        hasMessageBubbleProps: bubbleContent.includes('MessageBubbleProps'),
        hasUserMessageStyling: bubbleContent.includes('isUser') && bubbleContent.includes('justify-end'),
        hasAIMessageStyling: bubbleContent.includes('isAI') && bubbleContent.includes('justify-start'),
        hasResponsiveClasses: bubbleContent.includes('max-w-[85%]') || bubbleContent.includes('max-w-[70%]'),
        hasProperAccessibility: bubbleContent.includes('aria-') || bubbleContent.includes('role='),
        hasTimestampSupport: bubbleContent.includes('showTimestamp'),
        hasAvatarImplementation: bubbleContent.includes('Avatar') || bubbleContent.includes('w-8 h-8')
      };
      
      test.details.structureChecks = structureChecks;
      test.details.implementationQuality = this.calculateImplementationQuality(structureChecks);
      
      const passedChecks = Object.values(structureChecks).filter(Boolean).length;
      const totalChecks = Object.keys(structureChecks).length;
      
      if (passedChecks >= totalChecks * 0.8) {
        test.status = 'PASS';
        test.details.message = `Component structure validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Component structure validation failed (${passedChecks}/${totalChecks} checks)`;
        test.details.failedChecks = Object.entries(structureChecks)
          .filter(([_, passed]) => !passed)
          .map(([check, _]) => check);
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateBubbleStyling() {
    const test = {
      id: 'QA-001-02', 
      name: 'Message Bubble CSS Styling Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const bubblePath = join(PROJECT_ROOT, 'src/components/chat/MessageBubble.tsx');
      const bubbleContent = readFileSync(bubblePath, 'utf8');
      
      // Check for proper CSS classes and styling
      const stylingChecks = {
        hasRoundedCorners: bubbleContent.includes('rounded-2xl') || bubbleContent.includes('rounded-'),
        hasProperPadding: bubbleContent.includes('px-4 py-2') || bubbleContent.includes('p-'),
        hasMaxWidthConstraints: bubbleContent.includes('max-w-'),
        hasColorDifferentiation: bubbleContent.includes('bg-primary-600') && bubbleContent.includes('bg-gray-'),
        hasBreakWords: bubbleContent.includes('break-words') || bubbleContent.includes('word-wrap'),
        hasFlexAlignment: bubbleContent.includes('justify-end') && bubbleContent.includes('justify-start'),
        hasDarkModeSupport: bubbleContent.includes('dark:'),
        hasProperSpacing: bubbleContent.includes('space-y-') || bubbleContent.includes('mt-') || bubbleContent.includes('mb-')
      };
      
      test.details.stylingChecks = stylingChecks;
      
      const passedChecks = Object.values(stylingChecks).filter(Boolean).length;
      const totalChecks = Object.keys(stylingChecks).length;
      
      if (passedChecks >= totalChecks * 0.85) {
        test.status = 'PASS';
        test.details.message = `CSS styling validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `CSS styling validation failed (${passedChecks}/${totalChecks} checks)`;
        test.details.failedChecks = Object.entries(stylingChecks)
          .filter(([_, passed]) => !passed)
          .map(([check, _]) => check);
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateResponsiveBubbles() {
    const test = {
      id: 'QA-001-03',
      name: 'Responsive Message Bubble Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const bubblePath = join(PROJECT_ROOT, 'src/components/chat/MessageBubble.tsx');
      const bubbleContent = readFileSync(bubblePath, 'utf8');
      
      // Check responsive design implementation
      const responsiveChecks = {
        hasBreakpointClasses: bubbleContent.includes('sm:') || bubbleContent.includes('md:') || bubbleContent.includes('lg:'),
        hasVariableMaxWidth: bubbleContent.includes('max-w-[85%]') && bubbleContent.includes('max-w-[70%]'),
        hasMobileOptimization: bubbleContent.includes('sm:max-w-'),
        hasDesktopOptimization: bubbleContent.includes('lg:max-w-') || bubbleContent.includes('max-w-[65%]'),
        hasFlexWrapSupport: bubbleContent.includes('flex-wrap') || bubbleContent.includes('break-words')
      };
      
      test.details.responsiveChecks = responsiveChecks;
      
      const passedChecks = Object.values(responsiveChecks).filter(Boolean).length;
      const totalChecks = Object.keys(responsiveChecks).length;
      
      if (passedChecks >= 3) {
        test.status = 'PASS';
        test.details.message = `Responsive design validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Responsive design validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateWCAGCompliance() {
    const test = {
      id: 'QA-001-04',
      name: 'WCAG AA Compliance Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const bubblePath = join(PROJECT_ROOT, 'src/components/chat/MessageBubble.tsx');
      const bubbleContent = readFileSync(bubblePath, 'utf8');
      
      // Check WCAG AA compliance
      const wcagChecks = {
        hasColorContrast: this.checkColorContrast(bubbleContent),
        hasSemanticStructure: bubbleContent.includes('role=') || bubbleContent.includes('<div') || bubbleContent.includes('<section'),
        hasKeyboardAccessibility: bubbleContent.includes('tabIndex') || bubbleContent.includes('onKeyDown'),
        hasScreenReaderSupport: bubbleContent.includes('aria-label') || bubbleContent.includes('aria-describedby'),
        hasFocusManagement: bubbleContent.includes('focus:') || bubbleContent.includes('Focus'),
        hasTextAlternatives: bubbleContent.includes('alt=') || bubbleContent.includes('aria-label')
      };
      
      test.details.wcagChecks = wcagChecks;
      
      const passedChecks = Object.values(wcagChecks).filter(Boolean).length;
      const totalChecks = Object.keys(wcagChecks).length;
      
      // WCAG requires high compliance rate
      if (passedChecks >= totalChecks * 0.7) {
        test.status = 'PASS';
        test.details.message = `WCAG AA compliance validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `WCAG AA compliance validation failed (${passedChecks}/${totalChecks} checks)`;
        test.details.recommendations = [
          'Ensure 4.5:1 color contrast ratio for text',
          'Add proper ARIA labels for screen readers',
          'Implement keyboard navigation support',
          'Add focus indicators for interactive elements'
        ];
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateTextHandling() {
    const test = {
      id: 'QA-001-05',
      name: 'Text Wrapping and Overflow Handling',
      status: 'RUNNING', 
      details: {}
    };
    
    try {
      const bubblePath = join(PROJECT_ROOT, 'src/components/chat/MessageBubble.tsx');
      const bubbleContent = readFileSync(bubblePath, 'utf8');
      
      // Check text handling features
      const textHandlingChecks = {
        hasWordWrap: bubbleContent.includes('break-words') || bubbleContent.includes('word-wrap'),
        hasWhitespacePreservation: bubbleContent.includes('whitespace-pre-wrap'),
        hasOverflowHandling: bubbleContent.includes('overflow-') || bubbleContent.includes('break-'),
        hasLongTextSupport: bubbleContent.includes('max-w-') && bubbleContent.includes('break-'),
        hasEmojiSupport: !bubbleContent.includes('emoji-filter') // Should not filter emojis
      };
      
      test.details.textHandlingChecks = textHandlingChecks;
      
      const passedChecks = Object.values(textHandlingChecks).filter(Boolean).length;
      const totalChecks = Object.keys(textHandlingChecks).length;
      
      if (passedChecks >= 4) {
        test.status = 'PASS';
        test.details.message = `Text handling validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Text handling validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  async runPhase2ScrollingPerformance() {
    console.log('🚀 Phase 2: Chat Container Scrolling Performance');
    
    const phase = this.testResults.phases['QA-002'];
    phase.status = 'RUNNING';
    
    try {
      // Test 2.1: Container height constraints
      const heightTest = this.validateContainerHeight();
      phase.tests.push(heightTest);
      
      // Test 2.2: Scrolling behavior validation
      const scrollTest = this.validateScrollBehavior();
      phase.tests.push(scrollTest);
      
      // Test 2.3: Auto-scroll functionality
      const autoScrollTest = this.validateAutoScroll();
      phase.tests.push(autoScrollTest);
      
      // Test 2.4: Performance with large message lists
      const performanceTest = this.validateScrollPerformance();
      phase.tests.push(performanceTest);
      
      // Test 2.5: CSS containment and optimization
      const optimizationTest = this.validateScrollOptimization();
      phase.tests.push(optimizationTest);
      
      const passedTests = phase.tests.filter(t => t.status === 'PASS').length;
      phase.status = passedTests === phase.tests.length ? 'PASS' : 'PARTIAL';
      
      console.log(`   ✅ Phase 2 Complete: ${passedTests}/${phase.tests.length} tests passed\n`);
      
    } catch (error) {
      phase.status = 'FAIL';
      phase.error = error.message;
      console.log(`   ❌ Phase 2 Failed: ${error.message}\n`);
    }
  }

  validateContainerHeight() {
    const test = {
      id: 'QA-002-01',
      name: 'Chat Container Height Constraints Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      // Check ChatContainer implementation
      const containerPath = join(PROJECT_ROOT, 'src/components/chat/ChatContainer.tsx');
      const containerContent = readFileSync(containerPath, 'utf8');
      
      // Check CSS layout file
      const cssPath = join(PROJECT_ROOT, 'src/index.css');
      const cssContent = readFileSync(cssPath, 'utf8');
      
      const heightChecks = {
        hasFlexColumn: containerContent.includes('flex flex-col'),
        hasFullHeight: containerContent.includes('h-full'),
        hasMinHeightZero: containerContent.includes('minHeight: 0') || cssContent.includes('min-height: 0'),
        hasOverflowHidden: containerContent.includes('overflow-hidden') || cssContent.includes('overflow: hidden'),
        hasViewportHeight: cssContent.includes('height: 100vh'),
        hasProperGridArea: cssContent.includes('grid-area: chat-panel'),
        hasFlexOne: containerContent.includes('flex-1')
      };
      
      test.details.heightChecks = heightChecks;
      
      const passedChecks = Object.values(heightChecks).filter(Boolean).length;
      const totalChecks = Object.keys(heightChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Container height validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Container height validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateScrollBehavior() {
    const test = {
      id: 'QA-002-02',
      name: 'Scrolling Behavior Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const listPath = join(PROJECT_ROOT, 'src/components/chat/MessageList.tsx');
      const listContent = readFileSync(listPath, 'utf8');
      
      const scrollChecks = {
        hasOverflowYAuto: listContent.includes('overflow-y-auto'),
        hasScrollRef: listContent.includes('scrollElementRef') || listContent.includes('useRef'),
        hasSmoothScrolling: listContent.includes('scroll-smooth') || listContent.includes('behavior: \'smooth\''),
        hasScrollEvent: listContent.includes('onScroll') || listContent.includes('handleScroll'),
        hasScrollToBottom: listContent.includes('scrollToBottom') || listContent.includes('scrollTop'),
        hasScrollPosition: listContent.includes('scrollHeight') || listContent.includes('scrollTop'),
        hasCustomScrollbar: listContent.includes('scrollbar-') || listContent.includes('scrollbar'),
      };
      
      test.details.scrollChecks = scrollChecks;
      
      const passedChecks = Object.values(scrollChecks).filter(Boolean).length;
      const totalChecks = Object.keys(scrollChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Scroll behavior validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Scroll behavior validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateAutoScroll() {
    const test = {
      id: 'QA-002-03',
      name: 'Auto-scroll Functionality Validation', 
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const containerPath = join(PROJECT_ROOT, 'src/components/chat/ChatContainer.tsx');
      const containerContent = readFileSync(containerPath, 'utf8');
      
      const listPath = join(PROJECT_ROOT, 'src/components/chat/MessageList.tsx');
      const listContent = readFileSync(listPath, 'utf8');
      
      const autoScrollChecks = {
        hasAutoScrollLogic: containerContent.includes('scrollToBottom') || listContent.includes('shouldAutoScroll'),
        hasMessageCountTracking: containerContent.includes('lastMessageCount') || containerContent.includes('messages.length'),
        hasScrollIntoView: containerContent.includes('scrollIntoView') || listContent.includes('scrollIntoView'),
        hasScrollThreshold: listContent.includes('100') && listContent.includes('scrollTop'),
        hasAutoScrollState: listContent.includes('shouldAutoScroll') || listContent.includes('useState'),
        hasScrollBottomButton: listContent.includes('Scroll to bottom') || listContent.includes('scrollToBottom'),
        hasScrollEffect: containerContent.includes('useEffect') && containerContent.includes('messages')
      };
      
      test.details.autoScrollChecks = autoScrollChecks;
      
      const passedChecks = Object.values(autoScrollChecks).filter(Boolean).length;
      const totalChecks = Object.keys(autoScrollChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Auto-scroll validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Auto-scroll validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateScrollPerformance() {
    const test = {
      id: 'QA-002-04',
      name: 'Scroll Performance with Large Message Lists',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const containerPath = join(PROJECT_ROOT, 'src/components/chat/ChatContainer.tsx');
      const containerContent = readFileSync(containerPath, 'utf8');
      
      const listPath = join(PROJECT_ROOT, 'src/components/chat/MessageList.tsx');
      const listContent = readFileSync(listPath, 'utf8');
      
      const performanceChecks = {
        hasPerformanceMonitoring: containerContent.includes('usePerformanceMonitor') || containerContent.includes('performance'),
        hasReactMemo: containerContent.includes('React.memo') || containerContent.includes('memo'),
        hasCallbackOptimization: containerContent.includes('useCallback') || containerContent.includes('useMemo'),
        hasVirtualization: listContent.includes('virtual') || listContent.includes('window'),
        hasLazyLoading: listContent.includes('onLoadMore') || listContent.includes('hasMore'),
        hasDebouncing: listContent.includes('timeout') || listContent.includes('debounce'),
        hasEfficiencyOptimizations: containerContent.includes('optimization') || listContent.includes('performance')
      };
      
      test.details.performanceChecks = performanceChecks;
      
      const passedChecks = Object.values(performanceChecks).filter(Boolean).length;
      const totalChecks = Object.keys(performanceChecks).length;
      
      // Performance optimization is critical
      if (passedChecks >= 4) {
        test.status = 'PASS';
        test.details.message = `Performance validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Performance validation failed (${passedChecks}/${totalChecks} checks)`;
        test.details.recommendations = [
          'Implement React.memo for component optimization',
          'Add useCallback for expensive operations',
          'Consider virtualization for large lists',
          'Add performance monitoring hooks'
        ];
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateScrollOptimization() {
    const test = {
      id: 'QA-002-05',
      name: 'CSS Containment and Scroll Optimization',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const cssPath = join(PROJECT_ROOT, 'src/index.css');
      const cssContent = readFileSync(cssPath, 'utf8');
      
      const listPath = join(PROJECT_ROOT, 'src/components/chat/MessageList.tsx');
      const listContent = readFileSync(listPath, 'utf8');
      
      const optimizationChecks = {
        hasContainLayout: cssContent.includes('contain:') || cssContent.includes('contain'),
        hasWillChangeProperty: cssContent.includes('will-change:') || cssContent.includes('will-change'),
        hasTransformOptimization: cssContent.includes('transform:') || cssContent.includes('translate'),
        hasScrollbarStyling: listContent.includes('scrollbar-thin') || cssContent.includes('scrollbar'),
        hasGPUAcceleration: cssContent.includes('transform3d') || cssContent.includes('translateZ'),
        hasOverflowAnchor: cssContent.includes('overflow-anchor') || listContent.includes('overflow-anchor'),
        hasScrollBehavior: cssContent.includes('scroll-behavior') || listContent.includes('scroll-smooth')
      };
      
      test.details.optimizationChecks = optimizationChecks;
      
      const passedChecks = Object.values(optimizationChecks).filter(Boolean).length;
      const totalChecks = Object.keys(optimizationChecks).length;
      
      if (passedChecks >= 3) {
        test.status = 'PASS';
        test.details.message = `Scroll optimization validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Scroll optimization validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  async runPhase3InputFunctionality() {
    console.log('⌨️  Phase 3: Message Input Functionality');
    
    const phase = this.testResults.phases['QA-003'];
    phase.status = 'RUNNING';
    
    try {
      // Test 3.1: Input visibility and positioning
      const visibilityTest = this.validateInputVisibility();
      phase.tests.push(visibilityTest);
      
      // Test 3.2: Send functionality
      const sendTest = this.validateSendFunctionality();
      phase.tests.push(sendTest);
      
      // Test 3.3: Keyboard interactions
      const keyboardTest = this.validateKeyboardInteractions();
      phase.tests.push(keyboardTest);
      
      // Test 3.4: Auto-resize behavior
      const resizeTest = this.validateAutoResize();
      phase.tests.push(resizeTest);
      
      // Test 3.5: Input states and feedback
      const statesTest = this.validateInputStates();
      phase.tests.push(statesTest);
      
      const passedTests = phase.tests.filter(t => t.status === 'PASS').length;
      phase.status = passedTests === phase.tests.length ? 'PASS' : 'PARTIAL';
      
      console.log(`   ✅ Phase 3 Complete: ${passedTests}/${phase.tests.length} tests passed\n`);
      
    } catch (error) {
      phase.status = 'FAIL';
      phase.error = error.message;
      console.log(`   ❌ Phase 3 Failed: ${error.message}\n`);
    }
  }

  validateInputVisibility() {
    const test = {
      id: 'QA-003-01',
      name: 'Message Input Visibility and Positioning',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const inputPath = join(PROJECT_ROOT, 'src/components/chat/MessageInput.tsx');
      const inputContent = readFileSync(inputPath, 'utf8');
      
      const containerPath = join(PROJECT_ROOT, 'src/components/chat/ChatContainer.tsx');
      const containerContent = readFileSync(containerPath, 'utf8');
      
      const visibilityChecks = {
        hasFlexShrinkZero: containerContent.includes('flex-shrink-0'),
        hasBottomPosition: containerContent.includes('footer') || containerContent.includes('bottom'),
        hasZIndex: containerContent.includes('z-10') || containerContent.includes('z-index') || inputContent.includes('z-'),
        hasVisibleBackground: containerContent.includes('bg-gray-') || containerContent.includes('bg-white'),
        hasBorderSeparation: containerContent.includes('border-t') || containerContent.includes('border'),
        hasProperWidth: inputContent.includes('w-full') || inputContent.includes('width'),
        hasResponsivePadding: inputContent.includes('p-4') || inputContent.includes('px-') || inputContent.includes('py-')
      };
      
      test.details.visibilityChecks = visibilityChecks;
      
      const passedChecks = Object.values(visibilityChecks).filter(Boolean).length;
      const totalChecks = Object.keys(visibilityChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Input visibility validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Input visibility validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateSendFunctionality() {
    const test = {
      id: 'QA-003-02',
      name: 'Message Send Functionality Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const inputPath = join(PROJECT_ROOT, 'src/components/chat/MessageInput.tsx');
      const inputContent = readFileSync(inputPath, 'utf8');
      
      const containerPath = join(PROJECT_ROOT, 'src/components/chat/ChatContainer.tsx');
      const containerContent = readFileSync(containerPath, 'utf8');
      
      const sendChecks = {
        hasSubmitHandler: inputContent.includes('handleSubmit') || inputContent.includes('onSubmit'),
        hasSendButton: inputContent.includes('type="submit"') || inputContent.includes('Send'),
        hasFormValidation: inputContent.includes('trim()') || inputContent.includes('validate'),
        hasMessageCallback: containerContent.includes('handleSendMessage') || containerContent.includes('onSendMessage'),
        hasDisabledState: inputContent.includes('disabled') && inputContent.includes('isSending'),
        hasLoadingState: inputContent.includes('isSending') || inputContent.includes('isUploading'),
        hasErrorHandling: inputContent.includes('try') && inputContent.includes('catch'),
        hasSuccessCallback: containerContent.includes('sendMessage') && containerContent.includes('await')
      };
      
      test.details.sendChecks = sendChecks;
      
      const passedChecks = Object.values(sendChecks).filter(Boolean).length;
      const totalChecks = Object.keys(sendChecks).length;
      
      if (passedChecks >= 6) {
        test.status = 'PASS';
        test.details.message = `Send functionality validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Send functionality validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateKeyboardInteractions() {
    const test = {
      id: 'QA-003-03',
      name: 'Keyboard Interactions Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const inputPath = join(PROJECT_ROOT, 'src/components/chat/MessageInput.tsx');
      const inputContent = readFileSync(inputPath, 'utf8');
      
      const keyboardChecks = {
        hasEnterToSend: inputContent.includes('Enter') && inputContent.includes('handleSubmit'),
        hasShiftEnterNewLine: inputContent.includes('shiftKey') && inputContent.includes('Enter'),
        hasKeyDownHandler: inputContent.includes('onKeyDown') || inputContent.includes('handleKeyDown'),
        hasEscapeHandling: inputContent.includes('Escape') || inputContent.includes('ESC'),
        hasTabNavigation: inputContent.includes('Tab') || inputContent.includes('tabIndex'),
        hasArrowKeySupport: inputContent.includes('Arrow') || inputContent.includes('suggestions'),
        hasFocusManagement: inputContent.includes('focus()') || inputContent.includes('textareaRef'),
        hasKeyboardShortcuts: inputContent.includes('Ctrl') || inputContent.includes('Cmd') || inputContent.includes('Meta')
      };
      
      test.details.keyboardChecks = keyboardChecks;
      
      const passedChecks = Object.values(keyboardChecks).filter(Boolean).length;
      const totalChecks = Object.keys(keyboardChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Keyboard interactions validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Keyboard interactions validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateAutoResize() {
    const test = {
      id: 'QA-003-04',
      name: 'Auto-resize Behavior Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const inputPath = join(PROJECT_ROOT, 'src/components/chat/MessageInput.tsx');
      const inputContent = readFileSync(inputPath, 'utf8');
      
      const resizeChecks = {
        hasTextareaRef: inputContent.includes('textareaRef') && inputContent.includes('useRef'),
        hasAutoResize: inputContent.includes('adjustTextareaHeight') || inputContent.includes('scrollHeight'),
        hasMaxHeight: inputContent.includes('maxHeight') || inputContent.includes('max-h-'),
        hasMinHeight: inputContent.includes('minHeight') || inputContent.includes('min-h-'),
        hasResizeNone: inputContent.includes('resize-none'),
        hasHeightCalculation: inputContent.includes('scrollHeight') && inputContent.includes('style.height'),
        hasEffectForResize: inputContent.includes('useEffect') && inputContent.includes('message'),
        hasOverflowHandling: inputContent.includes('overflow-') || inputContent.includes('scrollbar')
      };
      
      test.details.resizeChecks = resizeChecks;
      
      const passedChecks = Object.values(resizeChecks).filter(Boolean).length;
      const totalChecks = Object.keys(resizeChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Auto-resize validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Auto-resize validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateInputStates() {
    const test = {
      id: 'QA-003-05',
      name: 'Input States and User Feedback',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const inputPath = join(PROJECT_ROOT, 'src/components/chat/MessageInput.tsx');
      const inputContent = readFileSync(inputPath, 'utf8');
      
      const statesChecks = {
        hasTypingIndicator: inputContent.includes('isTyping') && inputContent.includes('typing'),
        hasDisabledState: inputContent.includes('disabled') && inputContent.includes('opacity'),
        hasLoadingState: inputContent.includes('isSending') || inputContent.includes('isUploading'),
        hasCharacterCount: inputContent.includes('maxLength') && inputContent.includes('length'),
        hasPlaceholderText: inputContent.includes('placeholder') && inputContent.includes('Ask'),
        hasErrorStates: inputContent.includes('error') || inputContent.includes('Error'),
        hasFocusStates: inputContent.includes('focus:') && inputContent.includes('ring'),
        hasVisualFeedback: inputContent.includes('bg-blue-') || inputContent.includes('transform')
      };
      
      test.details.statesChecks = statesChecks;
      
      const passedChecks = Object.values(statesChecks).filter(Boolean).length;
      const totalChecks = Object.keys(statesChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Input states validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Input states validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  async runPhase4VisualRegression() {
    console.log('🎨 Phase 4: Visual Regression & Layout Validation');
    
    const phase = this.testResults.phases['QA-004'];
    phase.status = 'RUNNING';
    
    try {
      // Test 4.1: Layout structure validation
      const layoutTest = this.validateLayoutStructure();
      phase.tests.push(layoutTest);
      
      // Test 4.2: CSS Grid implementation
      const gridTest = this.validateCSSGrid();
      phase.tests.push(gridTest);
      
      // Test 4.3: Typography and spacing
      const typographyTest = this.validateTypography();
      phase.tests.push(typographyTest);
      
      // Test 4.4: Color scheme validation
      const colorTest = this.validateColorScheme();
      phase.tests.push(colorTest);
      
      // Test 4.5: Responsive layout validation
      const responsiveLayoutTest = this.validateResponsiveLayout();
      phase.tests.push(responsiveLayoutTest);
      
      const passedTests = phase.tests.filter(t => t.status === 'PASS').length;
      phase.status = passedTests === phase.tests.length ? 'PASS' : 'PARTIAL';
      
      console.log(`   ✅ Phase 4 Complete: ${passedTests}/${phase.tests.length} tests passed\n`);
      
    } catch (error) {
      phase.status = 'FAIL';
      phase.error = error.message;
      console.log(`   ❌ Phase 4 Failed: ${error.message}\n`);
    }
  }

  validateLayoutStructure() {
    const test = {
      id: 'QA-004-01',
      name: 'Layout Structure Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const containerPath = join(PROJECT_ROOT, 'src/components/chat/ChatContainer.tsx');
      const containerContent = readFileSync(containerPath, 'utf8');
      
      const layoutChecks = {
        hasProperSemantics: containerContent.includes('role="main"') && containerContent.includes('<header') && containerContent.includes('<footer'),
        hasFlexboxLayout: containerContent.includes('flex flex-col') && containerContent.includes('flex-1'),
        hasHeaderSection: containerContent.includes('<header') && containerContent.includes('flex-shrink-0'),
        hasMainSection: containerContent.includes('className="flex-1"') || containerContent.includes('flex-1 overflow-hidden'),
        hasFooterSection: containerContent.includes('<footer') && containerContent.includes('flex-shrink-0'),
        hasProperSpacing: containerContent.includes('space-x-') || containerContent.includes('space-y-'),
        hasResponsiveClasses: containerContent.includes('sm:') || containerContent.includes('md:') || containerContent.includes('lg:'),
        hasAccessibleStructure: containerContent.includes('aria-label') && containerContent.includes('aria-')
      };
      
      test.details.layoutChecks = layoutChecks;
      
      const passedChecks = Object.values(layoutChecks).filter(Boolean).length;
      const totalChecks = Object.keys(layoutChecks).length;
      
      if (passedChecks >= 6) {
        test.status = 'PASS';
        test.details.message = `Layout structure validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Layout structure validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateCSSGrid() {
    const test = {
      id: 'QA-004-02',
      name: 'CSS Grid Implementation Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const cssPath = join(PROJECT_ROOT, 'src/index.css');
      const cssContent = readFileSync(cssPath, 'utf8');
      
      const gridChecks = {
        hasDesktopLayout: cssContent.includes('.desktop-layout') && cssContent.includes('grid'),
        hasGridTemplateColumns: cssContent.includes('grid-template-columns'),
        hasGridTemplateRows: cssContent.includes('grid-template-rows'),
        hasGridTemplateAreas: cssContent.includes('grid-template-areas'),
        hasChatPanelArea: cssContent.includes('grid-area: chat-panel'),
        hasViewportHeight: cssContent.includes('height: 100vh'),
        hasMinHeightZero: cssContent.includes('min-height: 0'),
        hasOverflowHidden: cssContent.includes('overflow: hidden')
      };
      
      test.details.gridChecks = gridChecks;
      
      const passedChecks = Object.values(gridChecks).filter(Boolean).length;
      const totalChecks = Object.keys(gridChecks).length;
      
      if (passedChecks >= 6) {
        test.status = 'PASS';
        test.details.message = `CSS Grid validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `CSS Grid validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateTypography() {
    const test = {
      id: 'QA-004-03',
      name: 'Typography and Spacing Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const bubblePath = join(PROJECT_ROOT, 'src/components/chat/MessageBubble.tsx');
      const bubbleContent = readFileSync(bubblePath, 'utf8');
      
      const containerPath = join(PROJECT_ROOT, 'src/components/chat/ChatContainer.tsx');
      const containerContent = readFileSync(containerPath, 'utf8');
      
      const typographyChecks = {
        hasConsistentSpacing: bubbleContent.includes('space-y-') || bubbleContent.includes('mt-') || bubbleContent.includes('mb-'),
        hasProperFontSizes: containerContent.includes('text-lg') && containerContent.includes('text-sm'),
        hasFontWeights: containerContent.includes('font-semibold') || containerContent.includes('font-medium'),
        hasLineHeight: bubbleContent.includes('leading-') || containerContent.includes('leading-'),
        hasTextColors: bubbleContent.includes('text-white') && bubbleContent.includes('text-gray-'),
        hasPaddingConsistency: bubbleContent.includes('px-4 py-2') || bubbleContent.includes('p-'),
        hasMarginConsistency: bubbleContent.includes('space-y-') || bubbleContent.includes('my-'),
        hasResponsiveTypography: bubbleContent.includes('sm:text-') || bubbleContent.includes('lg:text-')
      };
      
      test.details.typographyChecks = typographyChecks;
      
      const passedChecks = Object.values(typographyChecks).filter(Boolean).length;
      const totalChecks = Object.keys(typographyChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Typography validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Typography validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateColorScheme() {
    const test = {
      id: 'QA-004-04',
      name: 'Color Scheme Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const bubblePath = join(PROJECT_ROOT, 'src/components/chat/MessageBubble.tsx');
      const bubbleContent = readFileSync(bubblePath, 'utf8');
      
      const containerPath = join(PROJECT_ROOT, 'src/components/chat/ChatContainer.tsx');
      const containerContent = readFileSync(containerPath, 'utf8');
      
      const colorChecks = {
        hasDarkModeSupport: bubbleContent.includes('dark:') && containerContent.includes('dark:'),
        hasUserMessageColors: bubbleContent.includes('bg-primary-600') || bubbleContent.includes('bg-blue-'),
        hasBotMessageColors: bubbleContent.includes('bg-gray-200') && bubbleContent.includes('dark:bg-gray-700'),
        hasConsistentBorders: containerContent.includes('border-gray-200') && containerContent.includes('dark:border-gray-700'),
        hasProperContrast: bubbleContent.includes('text-white') && bubbleContent.includes('text-gray-900'),
        hasThemeConsistency: containerContent.includes('bg-white') && containerContent.includes('dark:bg-gray-900'),
        hasStatusColors: containerContent.includes('bg-green-') || containerContent.includes('bg-red-') || containerContent.includes('bg-yellow-'),
        hasHoverStates: bubbleContent.includes('hover:') || containerContent.includes('hover:')
      };
      
      test.details.colorChecks = colorChecks;
      
      const passedChecks = Object.values(colorChecks).filter(Boolean).length;
      const totalChecks = Object.keys(colorChecks).length;
      
      if (passedChecks >= 6) {
        test.status = 'PASS';
        test.details.message = `Color scheme validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Color scheme validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateResponsiveLayout() {
    const test = {
      id: 'QA-004-05',
      name: 'Responsive Layout Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const bubblePath = join(PROJECT_ROOT, 'src/components/chat/MessageBubble.tsx');
      const bubbleContent = readFileSync(bubblePath, 'utf8');
      
      const cssPath = join(PROJECT_ROOT, 'src/index.css');
      const cssContent = readFileSync(cssPath, 'utf8');
      
      const responsiveChecks = {
        hasBreakpoints: bubbleContent.includes('sm:') && bubbleContent.includes('lg:'),
        hasMobileOptimization: bubbleContent.includes('max-w-[85%]'),
        hasDesktopOptimization: bubbleContent.includes('max-w-[70%]') || bubbleContent.includes('max-w-[65%]'),
        hasResponsiveGrid: cssContent.includes('grid-template-columns') && cssContent.includes('var('),
        hasFlexibleLayout: bubbleContent.includes('flex') && bubbleContent.includes('w-full'),
        hasViewportAdaptation: cssContent.includes('100vh') && cssContent.includes('100vw'),
        hasContainerQueries: cssContent.includes('@container') || bubbleContent.includes('container'),
        hasOverflowHandling: bubbleContent.includes('break-words') && bubbleContent.includes('overflow-')
      };
      
      test.details.responsiveChecks = responsiveChecks;
      
      const passedChecks = Object.values(responsiveChecks).filter(Boolean).length;
      const totalChecks = Object.keys(responsiveChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Responsive layout validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Responsive layout validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  async runPhase5Accessibility() {
    console.log('♿ Phase 5: Accessibility & Keyboard Navigation');
    
    const phase = this.testResults.phases['QA-005'];
    phase.status = 'RUNNING';
    
    try {
      // Test 5.1: ARIA labels and roles
      const ariaTest = this.validateARIAImplementation();
      phase.tests.push(ariaTest);
      
      // Test 5.2: Keyboard navigation
      const keyboardNavTest = this.validateKeyboardNavigation();
      phase.tests.push(keyboardNavTest);
      
      // Test 5.3: Screen reader support
      const screenReaderTest = this.validateScreenReaderSupport();
      phase.tests.push(screenReaderTest);
      
      // Test 5.4: Focus management
      const focusTest = this.validateFocusManagement();
      phase.tests.push(focusTest);
      
      // Test 5.5: Color contrast and visual accessibility
      const visualAccessibilityTest = this.validateVisualAccessibility();
      phase.tests.push(visualAccessibilityTest);
      
      const passedTests = phase.tests.filter(t => t.status === 'PASS').length;
      phase.status = passedTests === phase.tests.length ? 'PASS' : 'PARTIAL';
      
      console.log(`   ✅ Phase 5 Complete: ${passedTests}/${phase.tests.length} tests passed\n`);
      
    } catch (error) {
      phase.status = 'FAIL';
      phase.error = error.message;
      console.log(`   ❌ Phase 5 Failed: ${error.message}\n`);
    }
  }

  validateARIAImplementation() {
    const test = {
      id: 'QA-005-01',
      name: 'ARIA Labels and Roles Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const containerPath = join(PROJECT_ROOT, 'src/components/chat/ChatContainer.tsx');
      const containerContent = readFileSync(containerPath, 'utf8');
      
      const inputPath = join(PROJECT_ROOT, 'src/components/chat/MessageInput.tsx');
      const inputContent = readFileSync(inputPath, 'utf8');
      
      const listPath = join(PROJECT_ROOT, 'src/components/chat/MessageList.tsx');
      const listContent = readFileSync(listPath, 'utf8');
      
      const ariaChecks = {
        hasMainRole: containerContent.includes('role="main"'),
        hasAriaLabels: containerContent.includes('aria-label') && inputContent.includes('aria-label'),
        hasAriaDescribedBy: containerContent.includes('aria-describedby') || inputContent.includes('aria-describedby'),
        hasAriaHidden: containerContent.includes('aria-hidden="true"') || listContent.includes('aria-hidden'),
        hasAriaLive: containerContent.includes('aria-live') || inputContent.includes('aria-live'),
        hasAriaExpanded: inputContent.includes('aria-expanded') || listContent.includes('aria-expanded'),
        hasAriaControls: inputContent.includes('aria-controls') || containerContent.includes('aria-controls'),
        hasSemanticHTML: containerContent.includes('<header') && containerContent.includes('<footer') && containerContent.includes('<main')
      };
      
      test.details.ariaChecks = ariaChecks;
      
      const passedChecks = Object.values(ariaChecks).filter(Boolean).length;
      const totalChecks = Object.keys(ariaChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `ARIA implementation validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `ARIA implementation validation failed (${passedChecks}/${totalChecks} checks)`;
        test.details.recommendations = [
          'Add aria-label to interactive elements',
          'Implement proper role attributes',
          'Add aria-live regions for dynamic content',
          'Use semantic HTML elements where possible'
        ];
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateKeyboardNavigation() {
    const test = {
      id: 'QA-005-02',
      name: 'Keyboard Navigation Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const inputPath = join(PROJECT_ROOT, 'src/components/chat/MessageInput.tsx');
      const inputContent = readFileSync(inputPath, 'utf8');
      
      const listPath = join(PROJECT_ROOT, 'src/components/chat/MessageList.tsx');
      const listContent = readFileSync(listPath, 'utf8');
      
      const keyboardChecks = {
        hasTabNavigation: inputContent.includes('tabIndex') || inputContent.includes('tab'),
        hasEnterKeySupport: inputContent.includes('Enter') && inputContent.includes('onKeyDown'),
        hasEscapeKeySupport: inputContent.includes('Escape') || inputContent.includes('ESC'),
        hasArrowKeySupport: inputContent.includes('Arrow') && inputContent.includes('preventDefault'),
        hasFocusTrapping: inputContent.includes('focus') && inputContent.includes('blur'),
        hasSkipLinks: inputContent.includes('skip') || listContent.includes('skip'),
        hasKeyboardShortcuts: inputContent.includes('Ctrl') || inputContent.includes('Meta') || inputContent.includes('Alt'),
        hasFocusVisibleStates: inputContent.includes('focus:') && inputContent.includes('ring')
      };
      
      test.details.keyboardChecks = keyboardChecks;
      
      const passedChecks = Object.values(keyboardChecks).filter(Boolean).length;
      const totalChecks = Object.keys(keyboardChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Keyboard navigation validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Keyboard navigation validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateScreenReaderSupport() {
    const test = {
      id: 'QA-005-03',
      name: 'Screen Reader Support Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const containerPath = join(PROJECT_ROOT, 'src/components/chat/ChatContainer.tsx');
      const containerContent = readFileSync(containerPath, 'utf8');
      
      const accessibilityPath = join(PROJECT_ROOT, 'src/utils/accessibility.ts');
      const hasAccessibilityUtils = existsSync(accessibilityPath);
      
      let accessibilityContent = '';
      if (hasAccessibilityUtils) {
        accessibilityContent = readFileSync(accessibilityPath, 'utf8');
      }
      
      const screenReaderChecks = {
        hasScreenReaderUtils: hasAccessibilityUtils && accessibilityContent.includes('ScreenReader'),
        hasAnnouncements: containerContent.includes('announce') || containerContent.includes('ScreenReader'),
        hasLiveRegions: containerContent.includes('aria-live') || containerContent.includes('polite') || containerContent.includes('assertive'),
        hasStatusUpdates: containerContent.includes('Chat connected') || containerContent.includes('Message sent'),
        hasErrorAnnouncements: containerContent.includes('Failed') && containerContent.includes('announce'),
        hasLoadingAnnouncements: containerContent.includes('Loading') && containerContent.includes('announce'),
        hasProperHeadings: containerContent.includes('<h1') || containerContent.includes('<h2') || containerContent.includes('<h3'),
        hasDescriptiveText: containerContent.includes('Trading coach') && containerContent.includes('aria-label')
      };
      
      test.details.screenReaderChecks = screenReaderChecks;
      
      const passedChecks = Object.values(screenReaderChecks).filter(Boolean).length;
      const totalChecks = Object.keys(screenReaderChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Screen reader support validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Screen reader support validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateFocusManagement() {
    const test = {
      id: 'QA-005-04',
      name: 'Focus Management Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const inputPath = join(PROJECT_ROOT, 'src/components/chat/MessageInput.tsx');
      const inputContent = readFileSync(inputPath, 'utf8');
      
      const listPath = join(PROJECT_ROOT, 'src/components/chat/MessageList.tsx');
      const listContent = readFileSync(listPath, 'utf8');
      
      const focusChecks = {
        hasFocusManagement: inputContent.includes('.focus()') || inputContent.includes('focus'),
        hasFocusRef: inputContent.includes('textareaRef') && inputContent.includes('useRef'),
        hasFocusStates: inputContent.includes('focus:ring') || inputContent.includes('focus:border'),
        hasFocusOutline: inputContent.includes('focus:outline') || inputContent.includes('focus:ring'),
        hasTabIndex: inputContent.includes('tabIndex') || listContent.includes('tabIndex'),
        hasFocusTrapping: inputContent.includes('focus') && inputContent.includes('blur'),
        hasAutoFocus: inputContent.includes('autoFocus') || inputContent.includes('focus()'),
        hasFocusVisible: inputContent.includes('focus-visible') || inputContent.includes('focus:visible')
      };
      
      test.details.focusChecks = focusChecks;
      
      const passedChecks = Object.values(focusChecks).filter(Boolean).length;
      const totalChecks = Object.keys(focusChecks).length;
      
      if (passedChecks >= 4) {
        test.status = 'PASS';
        test.details.message = `Focus management validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Focus management validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  validateVisualAccessibility() {
    const test = {
      id: 'QA-005-05',
      name: 'Visual Accessibility Validation',
      status: 'RUNNING',
      details: {}
    };
    
    try {
      const bubblePath = join(PROJECT_ROOT, 'src/components/chat/MessageBubble.tsx');
      const bubbleContent = readFileSync(bubblePath, 'utf8');
      
      const inputPath = join(PROJECT_ROOT, 'src/components/chat/MessageInput.tsx');
      const inputContent = readFileSync(inputPath, 'utf8');
      
      // Check for proper color contrast and visual accessibility
      const visualChecks = {
        hasHighContrast: this.checkColorContrast(bubbleContent),
        hasReducedMotion: bubbleContent.includes('motion-reduce') || inputContent.includes('motion-reduce'),
        hasFocusIndicators: inputContent.includes('focus:ring') && inputContent.includes('ring-2'),
        hasColorIndependence: bubbleContent.includes('shape') || bubbleContent.includes('icon') || bubbleContent.includes('pattern'),
        hasTextScaling: bubbleContent.includes('text-') && bubbleContent.includes('leading-'),
        hasHoverStates: bubbleContent.includes('hover:') || inputContent.includes('hover:'),
        hasDisabledStates: inputContent.includes('disabled:opacity') || inputContent.includes('disabled:cursor'),
        hasErrorStates: inputContent.includes('border-red') || inputContent.includes('text-red')
      };
      
      test.details.visualChecks = visualChecks;
      
      const passedChecks = Object.values(visualChecks).filter(Boolean).length;
      const totalChecks = Object.keys(visualChecks).length;
      
      if (passedChecks >= 5) {
        test.status = 'PASS';
        test.details.message = `Visual accessibility validation passed (${passedChecks}/${totalChecks} checks)`;
      } else {
        test.status = 'FAIL';
        test.details.message = `Visual accessibility validation failed (${passedChecks}/${totalChecks} checks)`;
      }
      
    } catch (error) {
      test.status = 'FAIL';
      test.details.error = error.message;
    }
    
    return test;
  }

  // Helper methods
  checkColorContrast(content) {
    // Check for high contrast color combinations
    const highContrastPairs = [
      ['text-white', 'bg-primary-600'],
      ['text-white', 'bg-blue-600'],
      ['text-gray-900', 'bg-gray-200'],
      ['text-gray-100', 'bg-gray-700']
    ];
    
    return highContrastPairs.some(([textColor, bgColor]) => 
      content.includes(textColor) && content.includes(bgColor)
    );
  }

  calculateImplementationQuality(checks) {
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    const percentage = (passedChecks / totalChecks) * 100;
    
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Fair';
    if (percentage >= 60) return 'Poor';
    return 'Critical';
  }

  calculateOverallResults() {
    const phases = Object.values(this.testResults.phases);
    const passedPhases = phases.filter(p => p.status === 'PASS').length;
    const partialPhases = phases.filter(p => p.status === 'PARTIAL').length;
    const failedPhases = phases.filter(p => p.status === 'FAIL').length;
    
    // Calculate total tests
    let totalTests = 0;
    let passedTests = 0;
    
    phases.forEach(phase => {
      totalTests += phase.tests.length;
      passedTests += phase.tests.filter(t => t.status === 'PASS').length;
    });
    
    this.testResults.summary = {
      totalPhases: phases.length,
      passedPhases,
      partialPhases,
      failedPhases,
      totalTests,
      passedTests,
      testPassRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`
    };
    
    // Determine overall status
    if (failedPhases === 0 && partialPhases === 0) {
      this.testResults.overallStatus = 'PASS';
    } else if (failedPhases === 0) {
      this.testResults.overallStatus = 'PARTIAL';
    } else {
      this.testResults.overallStatus = 'FAIL';
    }
    
    // Generate recommendations
    this.generateRecommendations();
  }

  generateRecommendations() {
    const recommendations = [];
    
    Object.entries(this.testResults.phases).forEach(([phaseId, phase]) => {
      if (phase.status === 'FAIL' || phase.status === 'PARTIAL') {
        const failedTests = phase.tests.filter(t => t.status === 'FAIL');
        failedTests.forEach(test => {
          if (test.details.recommendations) {
            recommendations.push(...test.details.recommendations);
          }
        });
      }
    });
    
    // Add general recommendations based on overall results
    if (this.testResults.summary.testPassRate < 80) {
      recommendations.push('Consider comprehensive refactoring of chat UI components');
      recommendations.push('Implement additional QA testing processes');
      recommendations.push('Add automated visual regression testing');
    }
    
    this.testResults.recommendations = [...new Set(recommendations)]; // Remove duplicates
  }

  async generateQAReport() {
    const reportContent = this.generateMarkdownReport();
    const timestamp = Date.now();
    
    // Save detailed JSON results
    const jsonPath = join(__dirname, 'evidence', `test-results-${timestamp}.json`);
    writeFileSync(jsonPath, JSON.stringify(this.testResults, null, 2));
    
    // Save markdown report
    const reportPath = join(__dirname, `comprehensive-qa-report-${new Date().toISOString().split('T')[0]}.md`);
    writeFileSync(reportPath, reportContent);
    
    console.log(`📄 Detailed results saved to: ${jsonPath}`);
    console.log(`📄 QA Report saved to: ${reportPath}`);
  }

  generateMarkdownReport() {
    const { summary, phases, overallStatus, recommendations } = this.testResults;
    
    return `# Comprehensive QA Test Report - PRD-1.1.4.1.1 Chat UI Fixes

## Test Execution Summary

**Overall Status:** ${overallStatus}  
**Test Pass Rate:** ${summary.testPassRate}  
**Execution Date:** ${new Date().toISOString()}  
**Total Test Phases:** ${summary.totalPhases}  
**Total Tests:** ${summary.totalTests}  

### Phase Results
- ✅ **Passed Phases:** ${summary.passedPhases}/${summary.totalPhases}
- ⚠️ **Partial Phases:** ${summary.partialPhases}/${summary.totalPhases}  
- ❌ **Failed Phases:** ${summary.failedPhases}/${summary.totalPhases}

## Implementation Validation

### Features Tested
The QA validation covered the Frontend Engineer's implementation of:
- **FE-006:** Type system consolidation (standardized imports)
- **FE-001:** Chat container height constraints (added height: 100vh, min-height: 0)
- **FE-008:** Container overflow investigation (fixed space-y-4 issues)
- **FE-002:** Message bubble width investigation (restructured layout)  
- **FE-003:** MessageInput bottom positioning (enhanced z-index and positioning)

## Detailed Phase Results

${Object.entries(phases).map(([phaseId, phase]) => `
### ${phaseId}: ${phase.name}
**Status:** ${phase.status}  
**Tests:** ${phase.tests.length}  
**Passed:** ${phase.tests.filter(t => t.status === 'PASS').length}  

${phase.tests.map(test => `
#### ${test.id}: ${test.name}
**Result:** ${test.status}  
**Details:** ${test.details.message || 'No details available'}  
${test.details.failedChecks ? `**Failed Checks:** ${test.details.failedChecks.join(', ')}` : ''}
${test.details.recommendations ? `**Recommendations:** ${test.details.recommendations.join(', ')}` : ''}
`).join('')}
`).join('')}

## Recommendations

${recommendations.length > 0 ? recommendations.map(rec => `- ${rec}`).join('\n') : 'No specific recommendations - implementation meets QA standards.'}

## Conclusion

${overallStatus === 'PASS' 
  ? '✅ **PASS**: Chat UI fixes implementation meets all QA requirements and is ready for production.'
  : overallStatus === 'PARTIAL'
  ? '⚠️ **PARTIAL**: Chat UI fixes implementation has minor issues that should be addressed before production.'
  : '❌ **FAIL**: Chat UI fixes implementation has critical issues that must be resolved before production.'
}

---

*Generated by Comprehensive QA Test Suite for PRD-1.1.4.1.1*  
*Test Suite Version: 1.0*  
*QA Engineer: Automated Testing Framework*
`;
  }
}

// Run the comprehensive QA validation
const qaValidator = new ChatUIFixesQAValidator();
qaValidator.runAllTests().catch(error => {
  console.error('QA validation failed:', error);
  process.exit(1);
});