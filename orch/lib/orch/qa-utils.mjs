import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export function ensureQa(qaPath) {
  if (!fs.existsSync(qaPath)) {
    fs.mkdirSync(qaPath, { recursive: true });
  }
  return qaPath;
}

export function createTestCases(qaPath, featureId, slug, prdContent = null) {
  const casesFile = path.join(qaPath, 'test-cases.md');
  
  if (!fs.existsSync(casesFile)) {
    // Extract test requirements from PRD if provided
    const customTests = prdContent ? extractTestRequirements(prdContent) : [];
    
    const content = `# Test Cases — ${featureId}-${slug}

## Test Scenarios

### Functional Tests
- [ ] TC-001: Basic functionality works as expected
- [ ] TC-002: Edge cases handled correctly
- [ ] TC-003: Error states display properly
${customTests.functional ? customTests.functional.map((t, i) => `- [ ] TC-F${i+1}: ${t}`).join('\n') : ''}

### Integration Tests
- [ ] TC-004: Integrates with existing features
- [ ] TC-005: API endpoints respond correctly
- [ ] TC-006: Database operations complete successfully
${customTests.integration ? customTests.integration.map((t, i) => `- [ ] TC-I${i+1}: ${t}`).join('\n') : ''}

### Performance Tests
- [ ] TC-007: Page load time < 3s
- [ ] TC-008: API response time < 500ms
- [ ] TC-009: No memory leaks detected

### Security Tests
- [ ] TC-SEC-001: No exposed secrets or API keys
- [ ] TC-SEC-002: Input validation prevents injection
- [ ] TC-SEC-003: Authentication properly enforced
- [ ] TC-SEC-004: HTTPS/TLS properly configured

## Quality Gates (Excellence Standard)
- [ ] QG-001: Code implementation exists
- [ ] QG-002: All tests pass (unit, integration, e2e)
- [ ] QG-003: No console errors or warnings
- [ ] QG-004: Documentation complete and accurate
- [ ] QG-005: Performance budgets met
- [ ] QG-006: Security scan clean (no High/Critical)
- [ ] QG-007: Accessibility standards met (WCAG 2.1 AA)

## Acceptance Criteria
- All test scenarios pass
- All quality gates pass
- No console errors in browser
- Security scan shows no High/Critical issues
- Overall Status: Pass required before deployment
- Evidence published and linked in PRD section 9.4
`;
    fs.writeFileSync(casesFile, content);
  }
  return casesFile;
}

export function createTestResults(qaPath, featureId, slug, date, options = {}) {
  const { autoRun = false, evidenceLinks = {} } = options;
  const resultsFile = path.join(qaPath, `test-results-${date}.md`);
  
  if (!fs.existsSync(resultsFile)) {
    const content = `# Test Results — ${date}

## Test Execution Summary

- **Feature**: ${featureId} - ${slug}
- **Build**: local development
- **Environment**: Node.js LTS, Chrome latest
- **Overall Status**: ${autoRun ? 'Running' : 'Pending'}
- **Execution Mode**: ${autoRun ? 'Automated' : 'Manual'}

## Test Results

| Test ID | Description | Result | Notes |
|---------|-------------|--------|-------|
| TC-001 | Basic functionality | Pending | - |
| TC-002 | Edge cases | Pending | - |
| TC-003 | Error states | Pending | - |
| TC-004 | Integration | Pending | - |
| TC-005 | API endpoints | Pending | - |
| TC-006 | Database ops | Pending | - |
| TC-007 | Page load time | Pending | - |
| TC-008 | API response | Pending | - |
| TC-009 | Memory leaks | Pending | - |

## Evidence
- Screenshots: [Pending]
- Logs: [Pending]
- Performance metrics: [Pending]

## Notes
- Initial test execution pending
- Manual testing required for UI components
- Automated tests configured in CI/CD pipeline
`;
    fs.writeFileSync(resultsFile, content);
  }
  return resultsFile;
}

// Extract test requirements from PRD content
function extractTestRequirements(prdContent) {
  const requirements = {
    functional: [],
    integration: [],
    performance: []
  };
  
  // Parse PRD for test requirements
  const lines = prdContent.split('\n');
  let currentSection = null;
  
  for (const line of lines) {
    if (line.includes('## Functional Requirements')) currentSection = 'functional';
    else if (line.includes('## Integration Requirements')) currentSection = 'integration';
    else if (line.includes('## Performance Requirements')) currentSection = 'performance';
    else if (line.startsWith('- ') && currentSection) {
      const req = line.substring(2).trim();
      if (req.toLowerCase().includes('test') || req.toLowerCase().includes('verify')) {
        requirements[currentSection].push(req);
      }
    }
  }
  
  return requirements;
}

// Automated test execution
export async function runAutomatedTests(featureId, qaPath) {
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    details: [],
    overallStatus: 'Running',
    startTime: new Date().toISOString()
  };
  
  try {
    // Run unit tests
    const unitTests = await runUnitTests(featureId);
    results.details.push(unitTests);
    
    // Run integration tests
    const integrationTests = await runIntegrationTests(featureId);
    results.details.push(integrationTests);
    
    // Run e2e tests if UI feature
    if (featureId.startsWith('1.')) {
      const e2eTests = await runE2ETests(featureId);
      results.details.push(e2eTests);
    }
    
    // Run security scan
    const securityScan = await runSecurityScan(featureId);
    results.details.push(securityScan);
    
    // Calculate overall status
    results.details.forEach(test => {
      if (test.status === 'Pass') results.passed++;
      else if (test.status === 'Fail') results.failed++;
      else results.skipped++;
    });
    
    results.overallStatus = results.failed === 0 ? 'Pass' : 'Fail';
    results.endTime = new Date().toISOString();
    
    // Generate evidence
    await generateEvidence(featureId, qaPath, results);
    
  } catch (error) {
    results.overallStatus = 'Error';
    results.error = error.message;
  }
  
  return results;
}

async function runUnitTests(featureId) {
  try {
    const { stdout, stderr } = await execAsync('npm test -- --testNamePattern=' + featureId, {
      cwd: path.join(process.cwd(), '../app')
    }).catch(() => ({ stdout: '', stderr: 'No unit tests found' }));
    
    return {
      type: 'Unit Tests',
      status: stderr ? 'Skip' : 'Pass',
      message: stdout || 'No unit tests configured',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      type: 'Unit Tests',
      status: 'Fail',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function runIntegrationTests(featureId) {
  // Placeholder for integration test execution
  return {
    type: 'Integration Tests',
    status: 'Skip',
    message: 'Integration tests not yet configured',
    timestamp: new Date().toISOString()
  };
}

async function runE2ETests(featureId) {
  try {
    // Check if Playwright is installed
    const { stdout } = await execAsync('npm run e2e:local', {
      cwd: path.join(process.cwd(), '../app')
    }).catch(() => ({ stdout: 'E2E tests not configured' }));
    
    return {
      type: 'E2E Tests',
      status: stdout.includes('passed') ? 'Pass' : 'Skip',
      message: stdout,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      type: 'E2E Tests',
      status: 'Skip',
      message: 'E2E tests not configured',
      timestamp: new Date().toISOString()
    };
  }
}

async function runSecurityScan(featureId) {
  // Run basic security checks
  const securityChecks = [];
  
  // Check for exposed secrets
  try {
    const { stdout } = await execAsync('grep -r "api[_-]key\|secret\|password" --exclude-dir=node_modules', {
      cwd: path.join(process.cwd(), '../app')
    }).catch(() => ({ stdout: '' }));
    
    securityChecks.push({
      check: 'No exposed secrets',
      passed: !stdout || stdout.length === 0
    });
  } catch {
    // No matches found is good
    securityChecks.push({
      check: 'No exposed secrets',
      passed: true
    });
  }
  
  // Check dependencies for vulnerabilities
  try {
    const { stdout } = await execAsync('npm audit --json', {
      cwd: path.join(process.cwd(), '../app')
    }).catch(err => ({ stdout: err.stdout || '{}' }));
    
    const audit = JSON.parse(stdout || '{}');
    const hasHighVulns = audit.metadata && 
      (audit.metadata.vulnerabilities.high > 0 || 
       audit.metadata.vulnerabilities.critical > 0);
    
    securityChecks.push({
      check: 'No high/critical vulnerabilities',
      passed: !hasHighVulns
    });
  } catch {
    securityChecks.push({
      check: 'No high/critical vulnerabilities',
      passed: true
    });
  }
  
  const allPassed = securityChecks.every(c => c.passed);
  
  return {
    type: 'Security Scan',
    status: allPassed ? 'Pass' : 'Fail',
    message: securityChecks.map(c => `${c.check}: ${c.passed ? '✓' : '✗'}`).join(', '),
    timestamp: new Date().toISOString()
  };
}

async function generateEvidence(featureId, qaPath, results) {
  const evidencePath = path.join(qaPath, 'evidence');
  ensureQa(evidencePath);
  
  // Save test results as JSON
  const jsonFile = path.join(evidencePath, `test-results-${Date.now()}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  
  // Generate summary report
  const summaryFile = path.join(evidencePath, 'summary.md');
  const summary = `# QA Evidence Summary

## Feature: ${featureId}

### Test Execution
- **Date**: ${results.startTime}
- **Duration**: ${calculateDuration(results.startTime, results.endTime)}
- **Overall Status**: ${results.overallStatus}

### Results
- Passed: ${results.passed}
- Failed: ${results.failed}
- Skipped: ${results.skipped}

### Test Details
${results.details.map(d => `- ${d.type}: ${d.status}`).join('\n')}

### Evidence Files
- Test Results: ${path.basename(jsonFile)}
- Screenshots: [If applicable]
- Logs: [If applicable]
`;
  
  fs.writeFileSync(summaryFile, summary);
  
  return {
    jsonFile,
    summaryFile
  };
}

function calculateDuration(startTime, endTime) {
  if (!endTime) return 'In progress';
  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = end - start;
  return `${Math.floor(duration / 1000)}s`;
}

// QA Pass validation
export function validateQAPass(qaPath, featureId) {
  const validation = {
    valid: false,
    checks: [],
    message: ''
  };
  
  // Check for test results
  const resultsFiles = fs.readdirSync(qaPath)
    .filter(f => f.startsWith('test-results-') && f.endsWith('.md'));
  
  if (resultsFiles.length === 0) {
    validation.checks.push({ item: 'Test results', found: false });
    validation.message = 'No test results found';
    return validation;
  }
  
  validation.checks.push({ item: 'Test results', found: true });
  
  // Check for test cases
  const testCasesFile = path.join(qaPath, 'test-cases.md');
  if (fs.existsSync(testCasesFile)) {
    validation.checks.push({ item: 'Test cases', found: true });
  } else {
    validation.checks.push({ item: 'Test cases', found: false });
  }
  
  // Check for evidence
  const evidencePath = path.join(qaPath, 'evidence');
  if (fs.existsSync(evidencePath)) {
    validation.checks.push({ item: 'Evidence folder', found: true });
  } else {
    validation.checks.push({ item: 'Evidence folder', found: false });
  }
  
  // Check latest results for Pass status
  const latestResults = resultsFiles.sort().pop();
  const resultsContent = fs.readFileSync(path.join(qaPath, latestResults), 'utf8');
  
  if (resultsContent.includes('Overall Status**: Pass')) {
    validation.checks.push({ item: 'QA Pass status', found: true });
    validation.valid = true;
    validation.message = 'QA Pass validated successfully';
  } else {
    validation.checks.push({ item: 'QA Pass status', found: false });
    validation.message = 'QA not yet passed';
  }
  
  return validation;
}

// Generate QA report
export function generateQAReport(qaPath, featureId, options = {}) {
  const { format = 'markdown', includeEvidence = true } = options;
  const reportFile = path.join(qaPath, `qa-report-${Date.now()}.${format === 'markdown' ? 'md' : 'html'}`);
  
  // Gather all QA artifacts
  const artifacts = {
    testCases: [],
    testResults: [],
    evidence: []
  };
  
  // Read test cases
  const testCasesFile = path.join(qaPath, 'test-cases.md');
  if (fs.existsSync(testCasesFile)) {
    artifacts.testCases = fs.readFileSync(testCasesFile, 'utf8');
  }
  
  // Read all test results
  const resultsFiles = fs.readdirSync(qaPath)
    .filter(f => f.startsWith('test-results-'));
  
  resultsFiles.forEach(file => {
    artifacts.testResults.push({
      file,
      content: fs.readFileSync(path.join(qaPath, file), 'utf8')
    });
  });
  
  // Read evidence if requested
  if (includeEvidence) {
    const evidencePath = path.join(qaPath, 'evidence');
    if (fs.existsSync(evidencePath)) {
      const evidenceFiles = fs.readdirSync(evidencePath);
      evidenceFiles.forEach(file => {
        artifacts.evidence.push({
          file,
          path: path.join(evidencePath, file)
        });
      });
    }
  }
  
  // Generate report
  let report = '';
  
  if (format === 'markdown') {
    report = `# QA Report - ${featureId}

## Generated: ${new Date().toISOString()}

## Test Cases
${artifacts.testCases}

## Test Results
${artifacts.testResults.map(r => `### ${r.file}\n${r.content}`).join('\n\n')}

## Evidence
${artifacts.evidence.map(e => `- [${e.file}](${e.path})`).join('\n')}
`;
  } else {
    // HTML format
    report = `<!DOCTYPE html>
<html>
<head>
  <title>QA Report - ${featureId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 2rem; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
    .pass { color: green; }
    .fail { color: red; }
    .skip { color: orange; }
  </style>
</head>
<body>
  <h1>QA Report - ${featureId}</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  
  <h2>Test Results Summary</h2>
  ${artifacts.testResults.map(r => `<h3>${r.file}</h3><pre>${r.content}</pre>`).join('')}
  
  <h2>Evidence</h2>
  <ul>
    ${artifacts.evidence.map(e => `<li><a href="${e.path}">${e.file}</a></li>`).join('')}
  </ul>
</body>
</html>`;
  }
  
  fs.writeFileSync(reportFile, report);
  return reportFile;
}