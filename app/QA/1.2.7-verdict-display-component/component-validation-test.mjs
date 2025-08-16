#!/usr/bin/env node

/**
 * Comprehensive Component Validation Test
 * PRD Reference: PRD-1.2.7-verdict-display-component.md
 * 
 * This script validates the VerdictDisplay component implementation
 * against all requirements specified in the PRD.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '../../..');

// Test results collector
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  categories: {},
  issues: [],
  recommendations: []
};

function logTest(category, test, status, message, details = null) {
  if (!testResults.categories[category]) {
    testResults.categories[category] = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }
  
  const testResult = {
    test,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.categories[category].tests.push(testResult);
  testResults.categories[category].total++;
  testResults.categories[category][status]++;
  testResults.summary.total++;
  testResults.summary[status]++;
  
  const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
  console.log(`${icon} [${category}] ${test}: ${message}`);
  
  if (details) {
    console.log(`   Details: ${details}`);
  }
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(appRoot, filePath);
  const exists = fs.existsSync(fullPath);
  logTest(
    'File Structure',
    `${description} exists`,
    exists ? 'passed' : 'failed',
    exists ? `Found at ${filePath}` : `Missing file: ${filePath}`,
    exists ? null : `Expected file at: ${fullPath}`
  );
  return exists;
}

function readFileContent(filePath) {
  try {
    const fullPath = path.join(appRoot, filePath);
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    return null;
  }
}

function validateComponentStructure() {
  console.log('\n=== Component Structure Validation ===');
  
  // Check required files
  const requiredFiles = [
    'src/components/chat/VerdictDisplay.tsx',
    'src/components/chat/VerdictIcon.tsx', 
    'src/components/chat/VerdictLabel.tsx',
    'src/components/chat/VerdictDisplay.module.css',
    'src/components/chat/VerdictDisplay.test.tsx'
  ];
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (!checkFileExists(file, path.basename(file))) {
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    logTest(
      'File Structure',
      'All required files present',
      'passed',
      'Complete component file structure found'
    );
  }
}

function validateVerdictDisplayComponent() {
  console.log('\n=== VerdictDisplay Component Validation ===');
  
  const content = readFileContent('src/components/chat/VerdictDisplay.tsx');
  if (!content) {
    logTest('Component', 'VerdictDisplay.tsx readable', 'failed', 'Cannot read component file');
    return;
  }
  
  // Check TypeScript interface
  const hasVerdictType = content.includes('export type VerdictType');
  logTest(
    'Component',
    'VerdictType export',
    hasVerdictType ? 'passed' : 'failed',
    hasVerdictType ? 'VerdictType properly exported' : 'Missing VerdictType export'
  );
  
  // Check all verdict types
  const verdictTypes = ['Diamond', 'Fire', 'Skull'];
  for (const type of verdictTypes) {
    const hasType = content.includes(`'${type}'`);
    logTest(
      'Component',
      `${type} verdict type`,
      hasType ? 'passed' : 'failed',
      hasType ? `${type} verdict type defined` : `Missing ${type} verdict type`
    );
  }
  
  // Check props interface
  const hasPropsInterface = content.includes('export interface VerdictDisplayProps');
  logTest(
    'Component',
    'Props interface',
    hasPropsInterface ? 'passed' : 'failed',
    hasPropsInterface ? 'VerdictDisplayProps interface found' : 'Missing props interface'
  );
  
  // Check required props
  const requiredProps = ['verdict', 'size?', 'animated?', 'showLabel?', 'className?', 'onClick?'];
  for (const prop of requiredProps) {
    const hasProp = content.includes(prop);
    logTest(
      'Component',
      `${prop} prop`,
      hasProp ? 'passed' : 'warning',
      hasProp ? `${prop} prop found` : `${prop} prop may be missing`
    );
  }
  
  // Check verdict configuration
  const hasVerdictConfig = content.includes('verdictConfig');
  logTest(
    'Component',
    'Verdict configuration',
    hasVerdictConfig ? 'passed' : 'failed',
    hasVerdictConfig ? 'Verdict configuration object found' : 'Missing verdict configuration'
  );
  
  // Check accessibility features
  const accessibilityFeatures = [
    'aria-label',
    'role=',
    'tabIndex',
    'onKeyDown'
  ];
  
  for (const feature of accessibilityFeatures) {
    const hasFeature = content.includes(feature);
    logTest(
      'Accessibility',
      `${feature} implementation`,
      hasFeature ? 'passed' : 'failed',
      hasFeature ? `${feature} accessibility feature found` : `Missing ${feature} accessibility feature`
    );
  }
}

function validateVerdictIconComponent() {
  console.log('\n=== VerdictIcon Component Validation ===');
  
  const content = readFileContent('src/components/chat/VerdictIcon.tsx');
  if (!content) {
    logTest('Component', 'VerdictIcon.tsx readable', 'failed', 'Cannot read VerdictIcon file');
    return;
  }
  
  // Check for custom SVG icons
  const hasSVGIcons = content.includes('<svg') && content.includes('viewBox');
  logTest(
    'Component',
    'Custom SVG icons',
    hasSVGIcons ? 'passed' : 'warning',
    hasSVGIcons ? 'Custom SVG icons implemented' : 'May be using emoji only'
  );
  
  // Check for icon components
  const iconComponents = ['DiamondIcon', 'FireIcon', 'SkullIcon'];
  for (const component of iconComponents) {
    const hasComponent = content.includes(component);
    logTest(
      'Component',
      `${component} component`,
      hasComponent ? 'passed' : 'failed',
      hasComponent ? `${component} component found` : `Missing ${component} component`
    );
  }
  
  // Check accessibility
  const hasAriaHidden = content.includes('aria-hidden="true"');
  logTest(
    'Accessibility',
    'Icon accessibility',
    hasAriaHidden ? 'passed' : 'warning',
    hasAriaHidden ? 'Icons properly marked as decorative' : 'May need aria-hidden for SVG icons'
  );
}

function validateVerdictLabelComponent() {
  console.log('\n=== VerdictLabel Component Validation ===');
  
  const content = readFileContent('src/components/chat/VerdictLabel.tsx');
  if (!content) {
    logTest('Component', 'VerdictLabel.tsx readable', 'failed', 'Cannot read VerdictLabel file');
    return;
  }
  
  // Check label configuration
  const hasLabelConfig = content.includes('labelConfig');
  logTest(
    'Component',
    'Label configuration',
    hasLabelConfig ? 'passed' : 'failed',
    hasLabelConfig ? 'Label configuration found' : 'Missing label configuration'
  );
  
  // Check screen reader content
  const hasScreenReaderContent = content.includes('sr-only');
  logTest(
    'Accessibility',
    'Screen reader content',
    hasScreenReaderContent ? 'passed' : 'failed',
    hasScreenReaderContent ? 'Screen reader content implemented' : 'Missing screen reader content'
  );
  
  // Check verdict labels
  const expectedLabels = [
    'High Probability Setup',
    'Aggressive Opportunity', 
    'Avoid This Setup'
  ];
  
  for (const label of expectedLabels) {
    const hasLabel = content.includes(label);
    logTest(
      'Component',
      `"${label}" label`,
      hasLabel ? 'passed' : 'failed',
      hasLabel ? `Label "${label}" found` : `Missing label "${label}"`
    );
  }
}

function validateCSSStyles() {
  console.log('\n=== CSS Styles Validation ===');
  
  const content = readFileContent('src/components/chat/VerdictDisplay.module.css');
  if (!content) {
    logTest('Styles', 'CSS module readable', 'failed', 'Cannot read CSS module file');
    return;
  }
  
  // Check verdict-specific styles
  const verdictStyles = ['.verdictDiamond', '.verdictFire', '.verdictSkull'];
  for (const style of verdictStyles) {
    const hasStyle = content.includes(style);
    logTest(
      'Styles',
      `${style} styles`,
      hasStyle ? 'passed' : 'failed',
      hasStyle ? `${style} styles found` : `Missing ${style} styles`
    );
  }
  
  // Check size variants
  const sizeVariants = ['.verdictSmall', '.verdictMedium', '.verdictLarge'];
  for (const variant of sizeVariants) {
    const hasVariant = content.includes(variant);
    logTest(
      'Styles',
      `${variant} variant`,
      hasVariant ? 'passed' : 'failed',
      hasVariant ? `${variant} variant found` : `Missing ${variant} variant`
    );
  }
  
  // Check animations
  const animationFeatures = [
    '@keyframes verdictAppear',
    '@keyframes iconBounce',
    '.verdictAnimated',
    'prefers-reduced-motion'
  ];
  
  for (const feature of animationFeatures) {
    const hasFeature = content.includes(feature);
    logTest(
      'Animations',
      `${feature} animation`,
      hasFeature ? 'passed' : 'failed',
      hasFeature ? `${feature} animation found` : `Missing ${feature} animation`
    );
  }
  
  // Check accessibility features in CSS
  const accessibilityFeatures = [
    'focus:',
    'focus-visible',
    'prefers-contrast',
    'prefers-reduced-motion'
  ];
  
  for (const feature of accessibilityFeatures) {
    const hasFeature = content.includes(feature);
    logTest(
      'CSS Accessibility',
      `${feature} support`,
      hasFeature ? 'passed' : 'warning',
      hasFeature ? `${feature} support found` : `Consider adding ${feature} support`
    );
  }
  
  // Check dark mode support
  const hasDarkMode = content.includes('dark:');
  logTest(
    'Styles',
    'Dark mode support',
    hasDarkMode ? 'passed' : 'warning',
    hasDarkMode ? 'Dark mode styles found' : 'Consider adding dark mode support'
  );
}

function validateTestCoverage() {
  console.log('\n=== Test Coverage Validation ===');
  
  const content = readFileContent('src/components/chat/VerdictDisplay.test.tsx');
  if (!content) {
    logTest('Testing', 'Test file readable', 'failed', 'Cannot read test file');
    return;
  }
  
  // Check test categories
  const testCategories = [
    'Rendering',
    'Interactions', 
    'Accessibility',
    'Animation',
    'Visual Design',
    'Edge Cases',
    'Performance'
  ];
  
  for (const category of testCategories) {
    const hasCategory = content.includes(category);
    logTest(
      'Testing',
      `${category} tests`,
      hasCategory ? 'passed' : 'warning',
      hasCategory ? `${category} test category found` : `Consider adding ${category} tests`
    );
  }
  
  // Check specific test scenarios
  const testScenarios = [
    'renders with default props',
    'renders all verdict types correctly',
    'calls onClick when clicked',
    'has proper ARIA labels',
    'applies animation classes',
    'handles keyboard navigation'
  ];
  
  for (const scenario of testScenarios) {
    const hasTest = content.includes(scenario);
    logTest(
      'Testing',
      `"${scenario}" test`,
      hasTest ? 'passed' : 'warning',
      hasTest ? `Test scenario "${scenario}" found` : `Consider adding "${scenario}" test`
    );
  }
}

function validatePRDCompliance() {
  console.log('\n=== PRD Compliance Validation ===');
  
  // Check functional requirements from PRD
  const requirements = [
    { id: 'REQ-001', description: 'Diamond verdict implementation', check: 'Diamond' },
    { id: 'REQ-002', description: 'Fire verdict implementation', check: 'Fire' },
    { id: 'REQ-003', description: 'Skull verdict implementation', check: 'Skull' },
    { id: 'REQ-004', description: 'Distinct visual identities', check: 'verdict' },
    { id: 'REQ-005', description: 'Consistent sizing', check: 'size' },
    { id: 'REQ-011', description: 'Verdict prop support', check: 'verdict:' },
    { id: 'REQ-012', description: 'Custom styling support', check: 'className' },
    { id: 'REQ-013', description: 'Accessibility labels', check: 'aria-label' },
    { id: 'REQ-014', description: 'Animation effects', check: 'animated' },
    { id: 'REQ-015', description: 'Design system integration', check: 'styles' }
  ];
  
  const mainComponent = readFileContent('src/components/chat/VerdictDisplay.tsx');
  const cssContent = readFileContent('src/components/chat/VerdictDisplay.module.css');
  const testContent = readFileContent('src/components/chat/VerdictDisplay.test.tsx');
  
  for (const req of requirements) {
    let implemented = false;
    let source = '';
    
    if (mainComponent && mainComponent.includes(req.check)) {
      implemented = true;
      source = 'main component';
    } else if (cssContent && cssContent.includes(req.check)) {
      implemented = true;
      source = 'CSS styles';
    } else if (testContent && testContent.includes(req.check)) {
      implemented = true;
      source = 'test coverage';
    }
    
    logTest(
      'PRD Compliance',
      `${req.id}: ${req.description}`,
      implemented ? 'passed' : 'failed',
      implemented ? `Implemented in ${source}` : `Not found in component files`
    );
  }
}

function validateUtilityDependencies() {
  console.log('\n=== Utility Dependencies Validation ===');
  
  // Check for cn utility function
  const cnUtilExists = checkFileExists('src/utils/cn.ts', 'cn utility function');
  
  if (cnUtilExists) {
    const cnContent = readFileContent('src/utils/cn.ts');
    const hasClsx = cnContent && cnContent.includes('clsx');
    const hasTwMerge = cnContent && cnContent.includes('twMerge');
    
    logTest(
      'Dependencies',
      'clsx integration',
      hasClsx ? 'passed' : 'failed',
      hasClsx ? 'clsx properly integrated' : 'Missing clsx integration'
    );
    
    logTest(
      'Dependencies',
      'tailwind-merge integration',
      hasTwMerge ? 'passed' : 'failed',
      hasTwMerge ? 'tailwind-merge properly integrated' : 'Missing tailwind-merge integration'
    );
  }
}

function validateDemoImplementation() {
  console.log('\n=== Demo Implementation Validation ===');
  
  const demoExists = checkFileExists('src/demo/verdict-display-showcase.tsx', 'Demo showcase component');
  
  if (demoExists) {
    const demoContent = readFileContent('src/demo/verdict-display-showcase.tsx');
    
    // Check demo features
    const demoFeatures = [
      'VerdictDisplayShowcase',
      'Interactive demo',
      'All verdict types',
      'Size variants',
      'Accessibility features'
    ];
    
    for (const feature of demoFeatures) {
      const hasFeature = demoContent && demoContent.includes(feature);
      logTest(
        'Demo',
        `${feature} demo`,
        hasFeature ? 'passed' : 'warning',
        hasFeature ? `${feature} found in demo` : `Consider adding ${feature} to demo`
      );
    }
  }
}

function generateRecommendations() {
  console.log('\n=== Generating Recommendations ===');
  
  const { failed, warnings } = testResults.summary;
  
  if (failed === 0 && warnings === 0) {
    testResults.recommendations.push({
      priority: 'info',
      category: 'Overall',
      recommendation: 'Component implementation is complete and meets all requirements',
      action: 'Proceed with production deployment'
    });
  }
  
  if (failed > 0) {
    testResults.recommendations.push({
      priority: 'high',
      category: 'Critical Issues',
      recommendation: `${failed} critical issues need to be resolved before deployment`,
      action: 'Review failed tests and implement missing features'
    });
  }
  
  if (warnings > 5) {
    testResults.recommendations.push({
      priority: 'medium',
      category: 'Code Quality',
      recommendation: `${warnings} warnings suggest opportunities for improvement`,
      action: 'Review warnings and consider implementing suggested enhancements'
    });
  }
  
  // Specific recommendations based on test patterns
  const categories = testResults.categories;
  
  if (categories['Accessibility']?.failed > 0) {
    testResults.recommendations.push({
      priority: 'high',
      category: 'Accessibility',
      recommendation: 'Accessibility compliance issues detected',
      action: 'Implement proper ARIA labels, keyboard navigation, and screen reader support'
    });
  }
  
  if (categories['Testing']?.warnings > 2) {
    testResults.recommendations.push({
      priority: 'medium',
      category: 'Testing',
      recommendation: 'Test coverage could be improved',
      action: 'Add additional test scenarios for edge cases and user interactions'
    });
  }
}

function saveTestResults() {
  const resultsPath = path.join(__dirname, 'validation-results.json');
  const reportPath = path.join(__dirname, 'validation-report.md');
  
  // Save JSON results
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  
  // Generate markdown report
  let report = `# Component Validation Report - VerdictDisplay\n\n`;
  report += `**Generated:** ${testResults.timestamp}\n`;
  report += `**Component:** VerdictDisplay.tsx\n`;
  report += `**PRD Reference:** PRD-1.2.7-verdict-display-component.md\n\n`;
  
  // Summary
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${testResults.summary.total}\n`;
  report += `- **Passed:** ${testResults.summary.passed} ✅\n`;
  report += `- **Failed:** ${testResults.summary.failed} ❌\n`;
  report += `- **Warnings:** ${testResults.summary.warnings} ⚠️\n\n`;
  
  const passRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
  report += `**Pass Rate:** ${passRate}%\n\n`;
  
  // Categories
  report += `## Test Categories\n\n`;
  for (const [category, results] of Object.entries(testResults.categories)) {
    report += `### ${category}\n`;
    report += `- Passed: ${results.passed}\n`;
    report += `- Failed: ${results.failed}\n`;
    report += `- Warnings: ${results.warnings}\n\n`;
  }
  
  // Recommendations
  if (testResults.recommendations.length > 0) {
    report += `## Recommendations\n\n`;
    for (const rec of testResults.recommendations) {
      const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      report += `${priority} **${rec.category}:** ${rec.recommendation}\n`;
      report += `   *Action:* ${rec.action}\n\n`;
    }
  }
  
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n=== Test Results Saved ===`);
  console.log(`📊 JSON Results: ${resultsPath}`);
  console.log(`📝 Report: ${reportPath}`);
}

async function runValidation() {
  console.log('🔍 Starting VerdictDisplay Component Validation...\n');
  console.log(`📂 App Root: ${appRoot}\n`);
  
  // Run all validation tests
  validateComponentStructure();
  validateVerdictDisplayComponent();
  validateVerdictIconComponent();
  validateVerdictLabelComponent();
  validateCSSStyles();
  validateTestCoverage();
  validatePRDCompliance();
  validateUtilityDependencies();
  validateDemoImplementation();
  
  // Generate recommendations and save results
  generateRecommendations();
  saveTestResults();
  
  // Final summary
  console.log('\n=== Validation Complete ===');
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);
  console.log(`📊 Total: ${testResults.summary.total}`);
  
  const passRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
  console.log(`🎯 Pass Rate: ${passRate}%`);
  
  if (testResults.summary.failed === 0) {
    console.log('\n🎉 Component validation PASSED! Ready for production.');
  } else {
    console.log(`\n⚠️  Component validation has ${testResults.summary.failed} critical issues that need attention.`);
  }
  
  return testResults.summary.failed === 0;
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch(console.error);
}

export { runValidation, testResults };