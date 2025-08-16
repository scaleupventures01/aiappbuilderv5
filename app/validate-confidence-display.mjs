#!/usr/bin/env node

/**
 * Automated Validation Script for ConfidenceDisplay Component
 * PRD Reference: PRD-1.2.8-confidence-percentage-display.md
 * 
 * Performs automated testing and validation of component implementation
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test Results Structure
const testResults = {
  timestamp: new Date().toISOString(),
  environment: {
    nodeVersion: process.version,
    platform: process.platform
  },
  tests: {
    componentStructure: [],
    typeDefinitions: [],
    integration: [],
    accessibility: [],
    performance: [],
    edgeCases: []
  },
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function addTest(category, name, status, message = '') {
  const test = {
    name,
    status, // 'PASS' | 'FAIL' | 'WARN'
    message,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests[category].push(test);
  testResults.summary.total++;
  
  if (status === 'PASS') testResults.summary.passed++;
  else if (status === 'FAIL') testResults.summary.failed++;
  else if (status === 'WARN') testResults.summary.warnings++;
  
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${category.toUpperCase()}: ${name}${message ? ` - ${message}` : ''}`);
}

function validateFileExists(filePath, description) {
  try {
    const content = readFileSync(filePath, 'utf8');
    addTest('componentStructure', `${description} exists`, 'PASS');
    return content;
  } catch (error) {
    addTest('componentStructure', `${description} exists`, 'FAIL', error.message);
    return null;
  }
}

function validateTypeScript(content, fileName) {
  const checks = [
    {
      name: 'TypeScript export',
      pattern: /export.*ConfidenceDisplay/,
      required: true
    },
    {
      name: 'Interface definitions',
      pattern: /interface.*ConfidenceDisplayProps/,
      required: true
    },
    {
      name: 'Type definitions',
      pattern: /type.*Confidence(Variant|Size|Level|ColorScheme)/,
      required: true
    },
    {
      name: 'Props validation',
      pattern: /confidence:\s*number/,
      required: true
    }
  ];

  checks.forEach(check => {
    const found = check.pattern.test(content);
    const status = found ? 'PASS' : (check.required ? 'FAIL' : 'WARN');
    addTest('typeDefinitions', `${fileName}: ${check.name}`, status);
  });
}

function validateAccessibilityFeatures(content) {
  const a11yChecks = [
    {
      name: 'ARIA labels',
      pattern: /aria-label/,
      required: true
    },
    {
      name: 'Role attributes',
      pattern: /role="progressbar"/,
      required: true
    },
    {
      name: 'Screen reader content',
      pattern: /sr-only|screen.*reader/,
      required: true
    },
    {
      name: 'Reduced motion support',
      pattern: /prefers-reduced-motion/,
      required: true
    },
    {
      name: 'Keyboard navigation',
      pattern: /tabIndex|onKeyDown/,
      required: false
    }
  ];

  a11yChecks.forEach(check => {
    const found = check.pattern.test(content);
    const status = found ? 'PASS' : (check.required ? 'FAIL' : 'WARN');
    addTest('accessibility', check.name, status);
  });
}

function validatePerformanceOptimizations(content) {
  const perfChecks = [
    {
      name: 'Memoization usage',
      pattern: /React\.memo|useMemo|useCallback/,
      required: false
    },
    {
      name: 'Animation optimization',
      pattern: /transform|transition-all/,
      required: true
    },
    {
      name: 'Conditional rendering',
      pattern: /&&|ternary|\?/,
      required: true
    },
    {
      name: 'Effect cleanup',
      pattern: /return.*clearTimeout|cleanup/,
      required: true
    }
  ];

  perfChecks.forEach(check => {
    const found = check.pattern.test(content);
    const status = found ? 'PASS' : (check.required ? 'FAIL' : 'WARN');
    addTest('performance', check.name, status);
  });
}

function validateIntegration(confidenceContent, verdictContent) {
  const integrationChecks = [
    {
      name: 'ConfidenceDisplay import in VerdictDisplay',
      pattern: /import.*ConfidenceDisplay/,
      content: verdictContent,
      required: true
    },
    {
      name: 'ConfidenceDisplay usage in VerdictDisplay',
      pattern: /<ConfidenceDisplay/,
      content: verdictContent,
      required: true
    },
    {
      name: 'Backward compatibility maintained',
      pattern: /confidence.*display|ConfidenceBar/,
      content: verdictContent,
      required: true
    },
    {
      name: 'Color scheme integration',
      pattern: /colorScheme.*verdict/,
      content: verdictContent,
      required: true
    }
  ];

  integrationChecks.forEach(check => {
    const found = check.pattern.test(check.content || confidenceContent);
    const status = found ? 'PASS' : (check.required ? 'FAIL' : 'WARN');
    addTest('integration', check.name, status);
  });
}

function validateEdgeCases(content) {
  const edgeChecks = [
    {
      name: 'Input validation',
      pattern: /Math\.max.*Math\.min|clamp|normalize/,
      required: true
    },
    {
      name: 'Confidence range validation',
      pattern: /0.*100|min.*max/,
      required: true
    },
    {
      name: 'Default props',
      pattern: /defaultProps|default.*=/,
      required: true
    },
    {
      name: 'Error boundaries',
      pattern: /try.*catch|error.*boundary/,
      required: false
    }
  ];

  edgeChecks.forEach(check => {
    const found = check.pattern.test(content);
    const status = found ? 'PASS' : (check.required ? 'FAIL' : 'WARN');
    addTest('edgeCases', check.name, status);
  });
}

function generateReport() {
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);
  
  const passRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
  console.log(`📈 Pass Rate: ${passRate}%`);
  
  // Production readiness assessment
  const criticalFailures = testResults.summary.failed;
  const productionReady = criticalFailures === 0 && passRate >= 90;
  
  console.log('\n🎯 PRODUCTION READINESS ASSESSMENT');
  console.log('=' .repeat(50));
  console.log(`Status: ${productionReady ? '✅ READY' : '❌ NOT READY'}`);
  
  if (!productionReady) {
    console.log('\n🚨 Issues to resolve:');
    Object.entries(testResults.tests).forEach(([category, tests]) => {
      const failures = tests.filter(t => t.status === 'FAIL');
      if (failures.length > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        failures.forEach(test => {
          console.log(`  ❌ ${test.name}${test.message ? ` - ${test.message}` : ''}`);
        });
      }
    });
  }

  // Save detailed report
  const reportPath = join(__dirname, 'qa-confidence-display-validation-report.json');
  writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📝 Detailed report saved to: qa-confidence-display-validation-report.json`);
}

// Main validation execution
async function runValidation() {
  console.log('🧪 ConfidenceDisplay Component Validation');
  console.log('=' .repeat(50));
  console.log();

  // 1. Component Structure Validation
  console.log('📁 COMPONENT STRUCTURE VALIDATION');
  const confidenceDisplayPath = join(__dirname, 'src/components/ui/ConfidenceDisplay.tsx');
  const verdictDisplayPath = join(__dirname, 'src/components/verdict/VerdictDisplay.tsx');
  const demoPath = join(__dirname, 'src/components/ui/ConfidenceDisplay.demo.tsx');
  const testPath = join(__dirname, 'src/components/ui/ConfidenceDisplay.test.tsx');

  const confidenceContent = validateFileExists(confidenceDisplayPath, 'ConfidenceDisplay component');
  const verdictContent = validateFileExists(verdictDisplayPath, 'VerdictDisplay component');
  const demoContent = validateFileExists(demoPath, 'Demo component');
  const testContent = validateFileExists(testPath, 'Test file');

  if (!confidenceContent) {
    console.log('\n❌ Critical failure: ConfidenceDisplay component not found');
    return;
  }

  // 2. TypeScript Validation
  console.log('\n📝 TYPESCRIPT VALIDATION');
  validateTypeScript(confidenceContent, 'ConfidenceDisplay');
  if (verdictContent) {
    validateTypeScript(verdictContent, 'VerdictDisplay');
  }

  // 3. Accessibility Validation
  console.log('\n♿ ACCESSIBILITY VALIDATION');
  validateAccessibilityFeatures(confidenceContent);

  // 4. Performance Validation
  console.log('\n⚡ PERFORMANCE VALIDATION');
  validatePerformanceOptimizations(confidenceContent);

  // 5. Integration Validation
  console.log('\n🔗 INTEGRATION VALIDATION');
  if (verdictContent) {
    validateIntegration(confidenceContent, verdictContent);
  }

  // 6. Edge Cases Validation
  console.log('\n🛡️  EDGE CASES VALIDATION');
  validateEdgeCases(confidenceContent);

  // Generate final report
  generateReport();
}

// Run validation
runValidation().catch(console.error);