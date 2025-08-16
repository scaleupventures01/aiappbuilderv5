#!/usr/bin/env node
/**
 * Validation Script for ORCH System Improvements
 * This script validates that all improvements from MVP v.03 are properly integrated
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const appRoot = path.resolve(__dirname, '../../app');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const tests = [];
let passedTests = 0;
let failedTests = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testCase(name, fn) {
  tests.push({ name, fn });
}

async function runTest(test) {
  try {
    log(`\n🧪 Testing: ${test.name}`, 'cyan');
    const result = await test.fn();
    if (result) {
      log(`  ✅ PASSED`, 'green');
      passedTests++;
      return true;
    } else {
      log(`  ❌ FAILED`, 'red');
      failedTests++;
      return false;
    }
  } catch (error) {
    log(`  ❌ ERROR: ${error.message}`, 'red');
    failedTests++;
    return false;
  }
}

// Test 1: Core Files Exist
testCase('Core library files exist', async () => {
  const requiredFiles = [
    'lib/orch-start.mjs',
    'lib/orch/prd-utils.mjs',
    'lib/orch/qa-utils.mjs',
    'lib/orch/roadmap-utils.mjs',
    'lib/orch/workflow-runner.mjs'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(orchRoot, file);
    if (!fs.existsSync(filePath)) {
      log(`    Missing: ${file}`, 'red');
      return false;
    }
    log(`    Found: ${file}`, 'green');
  }
  return true;
});

// Test 2: Documentation Files
testCase('Documentation files exist', async () => {
  const docs = [
    'docs/RUNBOOK.md',
    'docs/Excellence-Standard.md',
    'docs/WORKFLOWS.md',
    'templates/prd-template.md'
  ];
  
  for (const doc of docs) {
    const docPath = path.join(orchRoot, doc);
    if (!fs.existsSync(docPath)) {
      log(`    Missing: ${doc}`, 'red');
      return false;
    }
    log(`    Found: ${doc}`, 'green');
  }
  return true;
});

// Test 3: Do-It-Fully Policy Integration
testCase('Do-It-Fully policy in workflow-runner.mjs', async () => {
  const content = fs.readFileSync(path.join(orchRoot, 'lib/orch/workflow-runner.mjs'), 'utf8');
  const checks = [
    'doItFully',
    'Do-It-Fully Policy Active',
    'runQualityGates',
    'Excellence Standard'
  ];
  
  for (const check of checks) {
    if (!content.includes(check)) {
      log(`    Missing: ${check}`, 'red');
      return false;
    }
    log(`    Found: ${check}`, 'green');
  }
  return true;
});

// Test 4: QA Automation Features
testCase('QA automation features in qa-utils.mjs', async () => {
  const content = fs.readFileSync(path.join(orchRoot, 'lib/orch/qa-utils.mjs'), 'utf8');
  const features = [
    'runAutomatedTests',
    'validateQAPass',
    'generateQAReport',
    'runSecurityScan',
    'extractTestRequirements'
  ];
  
  for (const feature of features) {
    if (!content.includes(feature)) {
      log(`    Missing: ${feature}`, 'red');
      return false;
    }
    log(`    Found: ${feature}`, 'green');
  }
  return true;
});

// Test 5: Roadmap Mirror Sync
testCase('Roadmap mirror sync functionality', async () => {
  const content = fs.readFileSync(path.join(orchRoot, 'lib/orch/roadmap-utils.mjs'), 'utf8');
  const features = [
    'syncRoadmapMirror',
    'validateRoadmap',
    'verifySyncIntegrity',
    'getRoadmapStats',
    'batchUpdateRoadmap'
  ];
  
  for (const feature of features) {
    if (!content.includes(feature)) {
      log(`    Missing: ${feature}`, 'red');
      return false;
    }
    log(`    Found: ${feature}`, 'green');
  }
  return true;
});

// Test 6: ORCH START Autonomous Mode
testCase('ORCH START autonomous mode', async () => {
  const content = fs.readFileSync(path.join(orchRoot, 'lib/orch-start.mjs'), 'utf8');
  const features = [
    '--autonomous',
    'ORCH START Autonomous Workflow',
    'orchestrateTeam',
    'runAutomatedTests',
    'Excellence Standard Summary'
  ];
  
  for (const feature of features) {
    if (!content.includes(feature)) {
      log(`    Missing: ${feature}`, 'red');
      return false;
    }
    log(`    Found: ${feature}`, 'green');
  }
  return true;
});

// Test 7: Team Role Definitions
testCase('Team role definitions', async () => {
  const teamPath = path.join(orchRoot, 'team');
  if (!fs.existsSync(teamPath)) {
    log(`    Missing team directory`, 'red');
    return false;
  }
  
  const files = fs.readdirSync(teamPath).filter(f => f.endsWith('.md'));
  if (files.length < 20) {
    log(`    Only ${files.length} role files (expected 20+)`, 'red');
    return false;
  }
  
  log(`    Found ${files.length} team role definitions`, 'green');
  return true;
});

// Test 8: Excellence Standard Implementation
testCase('Excellence Standard implementation', async () => {
  const docPath = path.join(orchRoot, 'docs/Excellence-Standard.md');
  const content = fs.readFileSync(docPath, 'utf8');
  const sections = [
    'Quality Gates',
    'Definition of Done',
    'Do-It-Fully Policy',
    'Evidence Requirements',
    'Review Workflow'
  ];
  
  for (const section of sections) {
    if (!content.includes(section)) {
      log(`    Missing section: ${section}`, 'red');
      return false;
    }
    log(`    Found section: ${section}`, 'green');
  }
  return true;
});

// Test 9: PRD Template Completeness
testCase('PRD template completeness', async () => {
  const templatePath = path.join(orchRoot, 'templates/prd-template.md');
  const content = fs.readFileSync(templatePath, 'utf8');
  const sections = [
    '9.4 Evidence & Artifacts',
    '9.5 Reviewer Notes',
    '10. Excellence Checklist',
    'Do-It-Fully Compliance',
    'Quality Gates'
  ];
  
  for (const section of sections) {
    if (!content.includes(section)) {
      log(`    Missing: ${section}`, 'red');
      return false;
    }
    log(`    Found: ${section}`, 'green');
  }
  return true;
});

// Test 10: Command Line Interface
testCase('CLI commands and options', async () => {
  try {
    const { stdout } = await execAsync('node lib/orch-start.mjs --help', { cwd: orchRoot });
    const requiredOptions = [
      '--autonomous',
      '--no-do-it-fully',
      '--generate-report',
      '--status',
      'ORCH START'
    ];
    
    for (const option of requiredOptions) {
      if (!stdout.includes(option)) {
        log(`    Missing option: ${option}`, 'red');
        return false;
      }
      log(`    Found option: ${option}`, 'green');
    }
    return true;
  } catch (error) {
    log(`    Error running help command: ${error.message}`, 'red');
    return false;
  }
});

// Test 11: RUNBOOK Enhancements
testCase('RUNBOOK enhancements from MVP v.03', async () => {
  const runbookPath = path.join(orchRoot, 'docs/RUNBOOK.md');
  const content = fs.readFileSync(runbookPath, 'utf8');
  const enhancements = [
    'Size Governance',
    'Dependency Management Policy',
    'Release/Push Procedure',
    'Excellence Standard',
    'Do-It-Fully Policy'
  ];
  
  for (const enhancement of enhancements) {
    if (!content.includes(enhancement)) {
      log(`    Missing: ${enhancement}`, 'red');
      return false;
    }
    log(`    Found: ${enhancement}`, 'green');
  }
  return true;
});

// Test 12: Workspace Configuration
testCase('NPM workspace configuration', async () => {
  const packagePath = path.join(orchRoot, '..', 'package.json');
  if (!fs.existsSync(packagePath)) {
    log(`    Root package.json not found`, 'red');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (!packageJson.workspaces || !packageJson.workspaces.includes('orch')) {
    log(`    Workspace not configured properly`, 'red');
    return false;
  }
  
  log(`    Workspaces: ${packageJson.workspaces.join(', ')}`, 'green');
  return true;
});

// Test 13: Integration Test - Dry Run
testCase('Integration test - dry run', async () => {
  try {
    const { stdout, stderr } = await execAsync(
      'node lib/orch-start.mjs --id 1.1.1.1.0.0 --dry-run',
      { cwd: orchRoot }
    );
    
    if (stderr && !stderr.includes('Warning')) {
      log(`    Error: ${stderr}`, 'red');
      return false;
    }
    
    const output = stdout + stderr;
    if (!output.includes('"mode": "dry-run"')) {
      log(`    Dry run mode not working`, 'red');
      return false;
    }
    
    log(`    Dry run completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`    Integration test failed: ${error.message}`, 'red');
    return false;
  }
});

// Test 14: Quality Gates Implementation
testCase('Quality gates implementation', async () => {
  const content = fs.readFileSync(path.join(orchRoot, 'lib/orch/workflow-runner.mjs'), 'utf8');
  const gates = [
    'checkCodeExists',
    'runTests',
    'checkConsoleErrors',
    'checkDocumentation',
    'Quality Gates'
  ];
  
  for (const gate of gates) {
    if (!content.includes(gate)) {
      log(`    Missing gate: ${gate}`, 'red');
      return false;
    }
    log(`    Found gate: ${gate}`, 'green');
  }
  return true;
});

// Test 15: File Structure Validation
testCase('Complete file structure', async () => {
  const structure = {
    'lib/': ['orch-start.mjs', 'generate-roadmap-html.mjs'],
    'lib/orch/': ['prd-utils.mjs', 'qa-utils.mjs', 'roadmap-utils.mjs', 'workflow-runner.mjs'],
    'docs/': ['RUNBOOK.md', 'Excellence-Standard.md'],
    'templates/': ['prd-template.md'],
    'team/': [],
    'scripts/': []
  };
  
  for (const [dir, files] of Object.entries(structure)) {
    const dirPath = path.join(orchRoot, dir);
    if (!fs.existsSync(dirPath)) {
      log(`    Missing directory: ${dir}`, 'red');
      return false;
    }
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (!fs.existsSync(filePath)) {
        log(`    Missing file: ${dir}${file}`, 'red');
        return false;
      }
    }
  }
  
  log(`    File structure validated`, 'green');
  return true;
});

// Main execution
async function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('🔍 ORCH System Improvements Validation', 'blue');
  log('='.repeat(60), 'blue');
  log(`\nValidating ${tests.length} test cases...`, 'cyan');
  
  for (const test of tests) {
    await runTest(test);
  }
  
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Validation Summary', 'blue');
  log('='.repeat(60), 'blue');
  
  const total = passedTests + failedTests;
  const percentage = Math.round((passedTests / total) * 100);
  
  log(`\nTotal Tests: ${total}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Success Rate: ${percentage}%`, percentage === 100 ? 'green' : 'yellow');
  
  if (failedTests === 0) {
    log('\n🎉 All improvements are properly integrated!', 'green');
    log('The ORCH system is fully operational with all enhancements.', 'green');
  } else {
    log('\n⚠️  Some improvements need attention.', 'yellow');
    log('Please review the failed tests above.', 'yellow');
  }
  
  log('\n' + '='.repeat(60), 'blue');
  
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n❌ Validation script error: ${error.message}`, 'red');
  process.exit(1);
});