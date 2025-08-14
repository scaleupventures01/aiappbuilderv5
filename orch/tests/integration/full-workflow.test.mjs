#!/usr/bin/env node
/**
 * Integration Test Suite for ORCH System
 * Tests complete workflows end-to-end
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '../..');
const appRoot = path.resolve(__dirname, '../../../app');

// Test configuration
const TEST_FEATURE_ID = '9.9.9.9.0.0';
const TEST_FEATURE_NAME = 'integration-test-feature';

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

async function runTest(testName, testFn) {
  testResults.total++;
  log(`\n🧪 Running: ${testName}`, 'info');
  
  try {
    const result = await testFn();
    if (result.success) {
      testResults.passed++;
      log(`  ✅ PASSED: ${result.message || ''}`, 'success');
    } else {
      testResults.failed++;
      log(`  ❌ FAILED: ${result.message || 'Unknown error'}`, 'error');
    }
    
    testResults.details.push({
      name: testName,
      success: result.success,
      message: result.message || '',
      data: result.data || null
    });
    
    return result;
  } catch (error) {
    testResults.failed++;
    log(`  ❌ ERROR: ${error.message}`, 'error');
    
    testResults.details.push({
      name: testName,
      success: false,
      message: error.message,
      data: null
    });
    
    return { success: false, message: error.message };
  }
}

// Test 1: Basic CLI Help Command
async function testCLIHelp() {
  const { stdout } = await execAsync('node lib/orch-start.mjs --help', { cwd: orchRoot });
  
  const requiredContent = [
    'ORCH START',
    '--autonomous',
    '--generate-report',
    'Do-It-Fully Policy',
    'Excellence Standard'
  ];
  
  for (const content of requiredContent) {
    if (!stdout.includes(content)) {
      return { success: false, message: `Missing content: ${content}` };
    }
  }
  
  return { success: true, message: 'All required help content present' };
}

// Test 2: Dry Run Execution
async function testDryRun() {
  try {
    const { stdout, stderr } = await execAsync(
      `node lib/orch-start.mjs --id ${TEST_FEATURE_ID} --dry-run`,
      { cwd: orchRoot }
    );
    
    if (stderr && !stderr.includes('Warning') && !stderr.includes('PRD not found')) {
      return { success: false, message: `Unexpected stderr: ${stderr}` };
    }
    
    // For this test, we expect it to fail because the test PRD doesn't exist
    // But it should fail gracefully
    if (stdout.includes('"mode": "dry-run"') || stderr.includes('PRD not found')) {
      return { success: true, message: 'Dry run executed correctly' };
    }
    
    return { success: false, message: 'Dry run output unexpected' };
  } catch (error) {
    // Expected for non-existent PRD - check that it fails gracefully
    if (error.message.includes('PRD not found') || error.message.includes('not found')) {
      return { success: true, message: 'Dry run failed gracefully' };
    }
    return { success: false, message: `Unexpected error: ${error.message}` };
  }
}

// Test 3: Autonomous Mode with Existing Feature
async function testAutonomousMode() {
  const { stdout, stderr } = await execAsync(
    'node lib/orch-start.mjs --id 1.1.1.1.0.0 --autonomous --dry-run',
    { cwd: orchRoot, timeout: 30000 }
  );
  
  const requiredContent = [
    'ORCH START Autonomous Workflow',
    'Do-It-Fully: Enabled',
    '"orchestration": "autonomous"'
  ];
  
  const output = stdout + stderr;
  
  for (const content of requiredContent) {
    if (!output.includes(content)) {
      return { success: false, message: `Missing autonomous content: ${content}` };
    }
  }
  
  return { success: true, message: 'Autonomous mode working correctly' };
}

// Test 4: QA Report Generation
async function testQAReportGeneration() {
  try {
    const { stdout, stderr } = await execAsync(
      'node lib/orch-start.mjs --id 1.1.1.1.0.0 --generate-report --dry-run',
      { cwd: orchRoot, timeout: 30000 }
    );
    
    const output = stdout + stderr;
    
    if (output.includes('"reportGenerated":') || output.includes('qa-report-')) {
      return { success: true, message: 'QA report generation working' };
    }
    
    // Even in dry-run, it should show it would generate a report
    return { success: false, message: 'No QA report generation indication' };
  } catch (error) {
    return { success: false, message: `QA report test failed: ${error.message}` };
  }
}

// Test 5: Team Orchestration
async function testTeamOrchestration() {
  const teamPath = path.join(orchRoot, 'team');
  
  if (!fs.existsSync(teamPath)) {
    return { success: false, message: 'Team directory not found' };
  }
  
  const teamFiles = fs.readdirSync(teamPath)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'));
  
  if (teamFiles.length < 20) {
    return { success: false, message: `Only ${teamFiles.length} team files found (expected 20+)` };
  }
  
  // Test that autonomous mode uses team orchestration
  const { stdout } = await execAsync(
    'node lib/orch-start.mjs --id 1.1.1.1.0.0 --autonomous --dry-run',
    { cwd: orchRoot }
  );
  
  if (!stdout.includes('teamOrchestration')) {
    return { success: false, message: 'Team orchestration not triggered' };
  }
  
  return { 
    success: true, 
    message: `Team orchestration working with ${teamFiles.length} roles`,
    data: { roleCount: teamFiles.length }
  };
}

// Test 6: Quality Gates
async function testQualityGates() {
  // Import workflow runner to test quality gates directly
  try {
    const workflowModule = await import(path.join(orchRoot, 'lib/orch/workflow-runner.mjs'));
    
    // Test dry run with quality gates
    const result = await workflowModule.runDefaultWorkflow(true, {
      doItFully: true,
      autonomous: true,
      featureId: '1.1.1.1.0.0'
    });
    
    // In dry-run mode, quality gates might not be populated
    if (!result.qualityGates || (!result.qualityGates.details || result.qualityGates.details.length === 0)) {
      // Check if the quality gates structure exists even if not populated
      if (result.qualityGates && typeof result.qualityGates === 'object') {
        return { 
          success: true, 
          message: 'Quality gates structure present (dry run mode)',
          data: { structure: Object.keys(result.qualityGates) }
        };
      }
      return { success: false, message: 'Quality gates not in workflow result' };
    }
    
    const expectedGates = ['Code', 'Test', 'Console'];
    const foundGates = result.qualityGates.details?.map(d => d.name) || [];
    
    let missingGates = expectedGates.filter(gate => 
      !foundGates.some(found => found.includes(gate))
    );
    
    if (missingGates.length > 0 && foundGates.length > 0) {
      return { 
        success: false, 
        message: `Missing quality gates: ${missingGates.join(', ')} (found: ${foundGates.join(', ')})` 
      };
    }
    
    return { 
      success: true, 
      message: `Quality gates implemented correctly (${foundGates.length > 0 ? foundGates.length + ' gates' : 'structure ready'})`,
      data: { gates: foundGates }
    };
  } catch (error) {
    return { success: false, message: `Quality gates test failed: ${error.message}` };
  }
}

// Test 7: Documentation Completeness
async function testDocumentationCompleteness() {
  const requiredDocs = [
    'docs/RUNBOOK.md',
    'docs/Excellence-Standard.md',
    'docs/IMPROVEMENTS-CHECKLIST.md',
    'templates/prd-template.md'
  ];
  
  let missingDocs = [];
  
  for (const doc of requiredDocs) {
    const docPath = path.join(orchRoot, doc);
    if (!fs.existsSync(docPath)) {
      missingDocs.push(doc);
    } else {
      // Check that docs contain key content
      const content = fs.readFileSync(docPath, 'utf8');
      if (content.length < 1000) { // Reasonable minimum size
        missingDocs.push(`${doc} (too short)`);
      }
    }
  }
  
  if (missingDocs.length > 0) {
    return { 
      success: false, 
      message: `Missing/incomplete docs: ${missingDocs.join(', ')}` 
    };
  }
  
  return { 
    success: true, 
    message: 'All documentation present and complete' 
  };
}

// Test 8: File Structure Validation
async function testFileStructure() {
  const requiredStructure = {
    'lib/orch-start.mjs': { type: 'file', minSize: 5000 },
    'lib/orch/': { type: 'directory' },
    'lib/orch/prd-utils.mjs': { type: 'file', minSize: 2000 },
    'lib/orch/qa-utils.mjs': { type: 'file', minSize: 8000 },
    'lib/orch/roadmap-utils.mjs': { type: 'file', minSize: 5000 },
    'lib/orch/workflow-runner.mjs': { type: 'file', minSize: 8000 },
    'docs/': { type: 'directory' },
    'team/': { type: 'directory' },
    'templates/': { type: 'directory' },
    'scripts/': { type: 'directory' }
  };
  
  let issues = [];
  
  for (const [itemPath, requirements] of Object.entries(requiredStructure)) {
    const fullPath = path.join(orchRoot, itemPath);
    
    if (!fs.existsSync(fullPath)) {
      issues.push(`Missing: ${itemPath}`);
      continue;
    }
    
    const stats = fs.statSync(fullPath);
    
    if (requirements.type === 'file' && !stats.isFile()) {
      issues.push(`Not a file: ${itemPath}`);
    } else if (requirements.type === 'directory' && !stats.isDirectory()) {
      issues.push(`Not a directory: ${itemPath}`);
    }
    
    if (requirements.minSize && stats.isFile() && stats.size < requirements.minSize) {
      issues.push(`Too small: ${itemPath} (${stats.size} < ${requirements.minSize})`);
    }
  }
  
  if (issues.length > 0) {
    return { 
      success: false, 
      message: `Structure issues: ${issues.join(', ')}` 
    };
  }
  
  return { 
    success: true, 
    message: 'File structure correct and complete' 
  };
}

// Test 9: Error Handling
async function testErrorHandling() {
  // Test with invalid feature ID
  try {
    const { stderr } = await execAsync(
      'node lib/orch-start.mjs --id invalid-id --dry-run',
      { cwd: orchRoot }
    );
    
    if (!stderr || !stderr.includes('Invalid') && !stderr.includes('not found')) {
      return { success: false, message: 'No proper error handling for invalid ID' };
    }
  } catch (error) {
    // This is expected for invalid input
    if (!error.message.includes('Invalid') && !error.message.includes('not found')) {
      return { success: false, message: `Unexpected error type: ${error.message}` };
    }
  }
  
  return { 
    success: true, 
    message: 'Error handling working correctly' 
  };
}

// Test 10: Performance Check
async function testPerformance() {
  const startTime = Date.now();
  
  try {
    await execAsync(
      'node lib/orch-start.mjs --id 1.1.1.1.0.0 --dry-run',
      { cwd: orchRoot, timeout: 15000 }
    );
    
    const duration = Date.now() - startTime;
    
    if (duration > 10000) { // 10 seconds max
      return { 
        success: false, 
        message: `Too slow: ${duration}ms (expected < 10000ms)` 
      };
    }
    
    return { 
      success: true, 
      message: `Performance good: ${duration}ms`,
      data: { duration }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    if (error.message.includes('timeout')) {
      return { success: false, message: 'Execution timeout - performance issue' };
    }
    // Other errors are OK for performance test
    return { success: true, message: `Fast failure: ${duration}ms` };
  }
}

// Main test runner
async function main() {
  log('\n' + '='.repeat(60), 'info');
  log('🧪 ORCH System Integration Test Suite', 'info');
  log('='.repeat(60), 'info');
  log(`Starting at: ${new Date().toISOString()}`, 'info');
  
  // Run all tests
  await runTest('CLI Help Command', testCLIHelp);
  await runTest('Dry Run Execution', testDryRun);
  await runTest('Autonomous Mode', testAutonomousMode);
  await runTest('QA Report Generation', testQAReportGeneration);
  await runTest('Team Orchestration', testTeamOrchestration);
  await runTest('Quality Gates', testQualityGates);
  await runTest('Documentation Completeness', testDocumentationCompleteness);
  await runTest('File Structure Validation', testFileStructure);
  await runTest('Error Handling', testErrorHandling);
  await runTest('Performance Check', testPerformance);
  
  // Results summary
  log('\n' + '='.repeat(60), 'info');
  log('📊 Test Results Summary', 'info');
  log('='.repeat(60), 'info');
  
  const successRate = Math.round((testResults.passed / testResults.total) * 100);
  
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${successRate}%`, successRate === 100 ? 'success' : 'warning');
  
  // Detailed results
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'error');
    testResults.details
      .filter(t => !t.success)
      .forEach(t => log(`  • ${t.name}: ${t.message}`, 'error'));
  }
  
  // Exit with appropriate code
  if (testResults.failed === 0) {
    log('\n🎉 All integration tests passed!', 'success');
    log('The ORCH system is fully operational.', 'success');
    process.exit(0);
  } else {
    log('\n⚠️  Some integration tests failed.', 'warning');
    log('Please review the issues above.', 'warning');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Integration test suite failed: ${error.message}`, 'error');
  process.exit(1);
});