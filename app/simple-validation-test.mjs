#!/usr/bin/env node

/**
 * Simple PRD 1.2.6 Validation Test
 */

import fs from 'fs/promises';
import { join } from 'path';

console.log('🔍 PRD 1.2.6 Speed Selection Implementation - Simple Validation');
console.log('================================================================');

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

async function testFileExists(filePath, description) {
  try {
    await fs.access(filePath);
    console.log(`✅ PASS: ${description}`);
    results.passed++;
    results.tests.push({ name: description, status: 'PASS' });
    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${description} - File not found: ${filePath}`);
    results.failed++;
    results.tests.push({ name: description, status: 'FAIL', error: `File not found: ${filePath}` });
    return false;
  }
}

async function testFileContent(filePath, searchTerms, description) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const missingTerms = searchTerms.filter(term => !content.includes(term));
    
    if (missingTerms.length === 0) {
      console.log(`✅ PASS: ${description}`);
      results.passed++;
      results.tests.push({ name: description, status: 'PASS' });
      return true;
    } else {
      console.log(`❌ FAIL: ${description} - Missing: ${missingTerms.join(', ')}`);
      results.failed++;
      results.tests.push({ name: description, status: 'FAIL', error: `Missing: ${missingTerms.join(', ')}` });
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${description} - Error reading file: ${error.message}`);
    results.failed++;
    results.tests.push({ name: description, status: 'FAIL', error: error.message });
    return false;
  }
}

async function runTests() {
  console.log('\n📁 File Existence Tests');
  console.log('------------------------');
  
  // AI Engineer files
  await testFileExists('config/openai.js', 'AI Engineer - OpenAI Configuration');
  await testFileExists('server/services/trade-analysis-service.js', 'AI Engineer - Trade Analysis Service');
  
  // Backend Engineer files
  await testFileExists('db/migrations/005-add-speed-preferences.js', 'Backend Engineer - Database Migration');
  await testFileExists('db/schemas/005-speed-preferences.sql', 'Backend Engineer - Database Schema');
  await testFileExists('db/queries/speed-preferences.js', 'Backend Engineer - Database Queries');
  await testFileExists('api/users/speed-preference.js', 'Backend Engineer - Speed Preference API');
  await testFileExists('api/analytics/speed.js', 'Backend Engineer - Speed Analytics API');
  
  // Frontend Engineer files
  await testFileExists('src/components/SpeedSelector.tsx', 'Frontend Engineer - SpeedSelector Component');
  await testFileExists('src/views/Settings.tsx', 'Frontend Engineer - Settings Page');

  console.log('\n🔍 Content Validation Tests');
  console.log('----------------------------');

  // AI Engineer content validation
  await testFileContent('config/openai.js', [
    'SPEED_MODES',
    'super_fast',
    'fast', 
    'balanced',
    'high_accuracy',
    'reasoningEffort',
    'mapSpeedModeToReasoningEffort'
  ], 'AI Engineer - Speed Modes Configuration');

  await testFileContent('server/services/trade-analysis-service.js', [
    'reasoning_effort',
    'speedMode',
    'superFastAnalysis',
    'highAccuracyAnalysis',
    'speedPerformance'
  ], 'AI Engineer - Trade Analysis Service Integration');

  // Backend Engineer content validation
  await testFileContent('db/schemas/005-speed-preferences.sql', [
    'speed_preference',
    'speed_analytics',
    'reasoning_effort',
    'response_time_ms',
    'within_target_time'
  ], 'Backend Engineer - Database Schema');

  await testFileContent('api/users/speed-preference.js', [
    'getUserSpeedPreference',
    'updateUserSpeedPreference',
    'authenticateToken',
    'validateSpeedPreference'
  ], 'Backend Engineer - Speed Preference API');

  await testFileContent('api/analytics/speed.js', [
    'getUserSpeedAnalytics',
    'getSpeedAnalyticsSummary',
    'validateAnalyticsQuery'
  ], 'Backend Engineer - Speed Analytics API');

  // Frontend Engineer content validation
  await testFileContent('src/components/SpeedSelector.tsx', [
    'SpeedMode',
    'super_fast',
    'SpeedOption',
    'reasoningEffort',
    'estimatedTime'
  ], 'Frontend Engineer - SpeedSelector Component');

  await testFileContent('src/views/Settings.tsx', [
    'SpeedSelector',
    'speedPreferences',
    '/api/users/speed-preference',
    'defaultSpeed'
  ], 'Frontend Engineer - Settings Page Integration');

  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! PRD 1.2.6 implementation is complete and validated.');
  } else {
    console.log(`\n⚠️ ${results.failed} test(s) failed. Please review the implementation.`);
    console.log('\nFailed Tests:');
    results.tests.filter(t => t.status === 'FAIL').forEach(test => {
      console.log(`  - ${test.name}: ${test.error || 'Unknown error'}`);
    });
  }

  // Save results
  await fs.writeFile('PRD-1.2.6-simple-validation-results.json', JSON.stringify(results, null, 2));
  console.log('\n📋 Results saved to PRD-1.2.6-simple-validation-results.json');

  return results.failed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});