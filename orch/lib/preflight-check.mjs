#!/usr/bin/env node
/**
 * Pre-flight Check System
 * Validates system health, agent availability, and auto-repairs issues
 * Ensures all 33 agents are operational
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const appRoot = path.resolve(__dirname, '../../app');
const repoRoot = path.resolve(__dirname, '../..');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

// Check categories
const checks = [
  {
    name: 'Directory Structure',
    check: checkDirectories,
    fix: createMissingDirectories,
    critical: true
  },
  {
    name: 'Agent Modules (33 agents)',
    check: checkAgentModules,
    fix: validateAgentFiles,
    critical: true
  },
  {
    name: 'Required Files',
    check: checkRequiredFiles,
    fix: createMissingFiles,
    critical: true
  },
  {
    name: 'NPM Dependencies',
    check: checkDependencies,
    fix: installDependencies,
    critical: false
  },
  {
    name: 'PRD Templates',
    check: checkTemplates,
    fix: createDefaultTemplates,
    critical: false
  },
  {
    name: 'Roadmap Sync',
    check: checkRoadmapSync,
    fix: syncRoadmap,
    critical: false
  },
  {
    name: 'Configuration',
    check: checkConfiguration,
    fix: createDefaultConfig,
    critical: false
  },
  {
    name: 'Auth System',
    check: checkAuthSystem,
    fix: null, // No auto-fix for auth
    critical: false
  },
  {
    name: 'File Permissions',
    check: checkPermissions,
    fix: fixPermissions,
    critical: false
  },
  {
    name: 'Agent Communication',
    check: checkAgentCommunication,
    fix: null,
    critical: false
  }
];

// Check directory structure
function checkDirectories() {
  const requiredDirs = [
    'app/PRDs/V1',
    'app/PRDs/V2',
    'app/PRDs/V3',
    'app/PRDs/_templates',
    'app/Plans',
    'app/QA',
    'app/security/evidence',
    'app/tests/unit',
    'app/tests/e2e',
    'app/src/components',
    'app/src/services',
    'app/src/utils',
    'app/src/types',
    'app/src/views',
    'orch/lib/orch',
    'orch/team/_templates',
    'orch/docs',
    'orch/scripts',
    'orch/agents',
    'orch/tests/unit',
    'orch/tests/integration'
  ];
  
  const missing = [];
  requiredDirs.forEach(dir => {
    const fullPath = path.join(repoRoot, dir);
    if (!fs.existsSync(fullPath)) {
      missing.push(dir);
    }
  });
  
  return {
    ok: missing.length === 0,
    error: missing.length > 0 ? `Missing directories: ${missing.length}` : null,
    details: missing,
    total: requiredDirs.length,
    found: requiredDirs.length - missing.length
  };
}

// Create missing directories
function createMissingDirectories() {
  const result = checkDirectories();
  if (result.details && result.details.length > 0) {
    result.details.forEach(dir => {
      const fullPath = path.join(repoRoot, dir);
      fs.mkdirSync(fullPath, { recursive: true });
    });
    return { fixed: result.details.length, message: 'Created missing directories' };
  }
  return { fixed: 0, message: 'No directories to create' };
}

// Check agent modules
function checkAgentModules() {
  const agentsDir = path.join(orchRoot, 'agents');
  const expectedAgents = [
    'ai-engineer', 'ai-product-manager', 'ai-safety-engineer',
    'application-security-engineer', 'backend-engineer', 'business-analyst',
    'chief-ai-officer', 'ciso', 'cto', 'data-analyst', 'data-engineer',
    'data-scientist', 'devops-engineer', 'devsecops-engineer',
    'frontend-engineer', 'full-stack-engineer', 'implementation-owner',
    'machine-learning-engineer', 'ml-research-scientist', 'mlops-engineer',
    'privacy-engineer', 'product-manager', 'project-manager',
    'qa-automation-engineer', 'qa-engineer', 'security-architect',
    'site-reliability-engineer', 'staff-engineer', 'technical-product-manager',
    'ux-researcher', 'ux-ui-designer', 'vp-engineering', 'vp-product'
  ];
  
  const missing = [];
  const invalid = [];
  
  if (!fs.existsSync(agentsDir)) {
    return {
      ok: false,
      error: 'Agents directory not found',
      details: { missing: expectedAgents, invalid: [] },
      total: 33,
      found: 0
    };
  }
  
  expectedAgents.forEach(agent => {
    const agentFile = path.join(agentsDir, `${agent}.mjs`);
    if (!fs.existsSync(agentFile)) {
      missing.push(agent);
    } else {
      // Check if file is valid
      try {
        const content = fs.readFileSync(agentFile, 'utf8');
        if (!content.includes('export') || !content.includes('role')) {
          invalid.push(agent);
        }
      } catch (e) {
        invalid.push(agent);
      }
    }
  });
  
  return {
    ok: missing.length === 0 && invalid.length === 0,
    error: missing.length > 0 ? `Missing ${missing.length} agents` : 
           invalid.length > 0 ? `Invalid ${invalid.length} agents` : null,
    details: { missing, invalid },
    total: 33,
    found: 33 - missing.length,
    valid: 33 - missing.length - invalid.length
  };
}

// Validate agent files
function validateAgentFiles() {
  const result = checkAgentModules();
  let fixed = 0;
  
  if (result.details.invalid && result.details.invalid.length > 0) {
    // We can't auto-fix invalid agents, but we can report them
    return { 
      fixed: 0, 
      message: `Found ${result.details.invalid.length} invalid agent files that need manual review`,
      needsManual: result.details.invalid
    };
  }
  
  return { fixed, message: 'Agent modules validated' };
}

// Check required files
function checkRequiredFiles() {
  const requiredFiles = [
    'package.json',
    'orch/package.json',
    'app/package.json',
    'eslint.config.mjs',
    'orch/orch',
    'app/index.html',
    'app/vite.config.mjs',
    'app/tsconfig.json',
    'app/PRDs/_templates/PRD-template.md',
    'app/Plans/product-roadmap.md',
    'orch/team/_templates/role-playbook-template.md'
  ];
  
  const missing = [];
  requiredFiles.forEach(file => {
    const fullPath = path.join(repoRoot, file);
    if (!fs.existsSync(fullPath)) {
      missing.push(file);
    }
  });
  
  return {
    ok: missing.length === 0,
    error: missing.length > 0 ? `Missing ${missing.length} required files` : null,
    details: missing,
    total: requiredFiles.length,
    found: requiredFiles.length - missing.length
  };
}

// Create missing files
function createMissingFiles() {
  const result = checkRequiredFiles();
  let fixed = 0;
  
  if (result.details && result.details.length > 0) {
    result.details.forEach(file => {
      const fullPath = path.join(repoRoot, file);
      
      // Create appropriate default content based on file
      if (file.endsWith('PRD-template.md')) {
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, getDefaultPRDTemplate());
        fixed++;
      } else if (file.endsWith('product-roadmap.md')) {
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, getDefaultRoadmap());
        fixed++;
      } else if (file.endsWith('role-playbook-template.md')) {
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, getDefaultRoleTemplate());
        fixed++;
      }
      // Other files need manual creation
    });
  }
  
  return { 
    fixed, 
    message: fixed > 0 ? `Created ${fixed} default files` : 'No files created',
    needsManual: result.details.filter(f => 
      !f.endsWith('.md')
    )
  };
}

// Check dependencies
function checkDependencies() {
  const issues = [];
  
  // Check root package.json
  if (fs.existsSync(path.join(repoRoot, 'package.json'))) {
    if (!fs.existsSync(path.join(repoRoot, 'node_modules'))) {
      issues.push('Root node_modules missing');
    }
  }
  
  // Check orch package.json
  if (fs.existsSync(path.join(orchRoot, 'package.json'))) {
    const orchPkg = JSON.parse(fs.readFileSync(path.join(orchRoot, 'package.json'), 'utf8'));
    // Check for critical dependencies
    if (!orchPkg.dependencies || !orchPkg.dependencies.express) {
      issues.push('Orch missing critical dependencies');
    }
  }
  
  // Check app package.json
  if (fs.existsSync(path.join(appRoot, 'package.json'))) {
    const appPkg = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
    if (!appPkg.devDependencies || !appPkg.devDependencies.vite) {
      issues.push('App missing build dependencies');
    }
  }
  
  return {
    ok: issues.length === 0,
    error: issues.length > 0 ? issues.join(', ') : null,
    details: issues
  };
}

// Install dependencies
async function installDependencies() {
  console.log('\n  Installing dependencies...');
  
  return new Promise((resolve) => {
    const child = spawn('npm', ['install'], {
      cwd: repoRoot,
      stdio: 'pipe'
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ fixed: 1, message: 'Dependencies installed' });
      } else {
        resolve({ fixed: 0, message: 'Failed to install dependencies', error: output });
      }
    });
  });
}

// Check templates
function checkTemplates() {
  const templates = [
    'app/PRDs/_templates/PRD-template.md',
    'orch/team/_templates/role-playbook-template.md'
  ];
  
  const missing = templates.filter(t => !fs.existsSync(path.join(repoRoot, t)));
  
  return {
    ok: missing.length === 0,
    error: missing.length > 0 ? `Missing ${missing.length} templates` : null,
    details: missing
  };
}

// Create default templates
function createDefaultTemplates() {
  const result = checkTemplates();
  let fixed = 0;
  
  if (result.details && result.details.length > 0) {
    result.details.forEach(template => {
      const fullPath = path.join(repoRoot, template);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      
      if (template.includes('PRD-template')) {
        fs.writeFileSync(fullPath, getDefaultPRDTemplate());
        fixed++;
      } else if (template.includes('role-playbook')) {
        fs.writeFileSync(fullPath, getDefaultRoleTemplate());
        fixed++;
      }
    });
  }
  
  return { fixed, message: `Created ${fixed} templates` };
}

// Check roadmap sync
function checkRoadmapSync() {
  const roadmapPath = path.join(appRoot, 'Plans/product-roadmap.md');
  const prdsDir = path.join(appRoot, 'PRDs');
  
  if (!fs.existsSync(roadmapPath)) {
    return { ok: false, error: 'Roadmap not found' };
  }
  
  const roadmap = fs.readFileSync(roadmapPath, 'utf8');
  const issues = [];
  
  // Check if PRDs referenced in roadmap exist
  const prdRefs = roadmap.match(/`PRDs\/[^`]+`/g) || [];
  prdRefs.forEach(ref => {
    const prdPath = ref.replace(/`/g, '');
    if (!fs.existsSync(path.join(appRoot, prdPath))) {
      issues.push(`Missing PRD: ${prdPath}`);
    }
  });
  
  return {
    ok: issues.length === 0,
    error: issues.length > 0 ? `${issues.length} sync issues` : null,
    details: issues
  };
}

// Sync roadmap
function syncRoadmap() {
  // This would require more complex logic to actually sync
  // For now, just report the issues
  const result = checkRoadmapSync();
  return {
    fixed: 0,
    message: 'Roadmap sync check complete',
    needsManual: result.details
  };
}

// Check configuration
function checkConfiguration() {
  const configPath = path.join(repoRoot, '.orchrc.json');
  
  if (!fs.existsSync(configPath)) {
    return { ok: false, error: 'Configuration file not found' };
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const requiredKeys = ['defaultOwner', 'workflow', 'templates'];
    const missing = requiredKeys.filter(key => !config[key]);
    
    return {
      ok: missing.length === 0,
      error: missing.length > 0 ? `Missing config keys: ${missing.join(', ')}` : null,
      details: missing
    };
  } catch (e) {
    return { ok: false, error: 'Invalid JSON in config file' };
  }
}

// Create default config
function createDefaultConfig() {
  const configPath = path.join(repoRoot, '.orchrc.json');
  
  const defaultConfig = {
    defaultOwner: 'Backend Engineer',
    autoCommit: false,
    generateTests: true,
    runPreflightChecks: true,
    agentAssignment: {
      automatic: true,
      requireApproval: false,
      maxAgentsPerFeature: 10
    },
    templates: {
      prd: 'app/PRDs/_templates/PRD-template.md',
      test: 'app/tests/_templates/test-template.md',
      qa: 'app/QA/_templates/qa-template.md'
    },
    workflow: {
      autoLint: true,
      autoTest: true,
      requireApproval: false,
      runAgentsOnStart: true
    },
    agents: {
      total: 33,
      communicationMode: 'async',
      concurrentLimit: 5
    },
    gitIntegration: {
      enabled: false,
      autoCreateBranch: false,
      branchPrefix: 'feature/',
      commitPrefix: 'orch:'
    },
    dashboard: {
      refreshInterval: 5000,
      showBlockers: true,
      maxRecentActivity: 10
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  return { fixed: 1, message: 'Created default configuration' };
}

// Check auth system
function checkAuthSystem() {
  const authDir = path.join(orchRoot, 'auth');
  
  if (!fs.existsSync(authDir)) {
    return { ok: true, error: null, warning: 'Auth system not configured (optional)' };
  }
  
  const requiredAuthFiles = [
    'server.mjs',
    'lib/config.mjs',
    'middleware/errorHandler.mjs',
    'routes/auth.mjs'
  ];
  
  const missing = requiredAuthFiles.filter(f => 
    !fs.existsSync(path.join(authDir, f))
  );
  
  return {
    ok: missing.length === 0,
    error: missing.length > 0 ? `Auth system incomplete: missing ${missing.length} files` : null,
    details: missing
  };
}

// Check file permissions
function checkPermissions() {
  const executableFiles = [
    'orch/orch'
  ];
  
  const issues = [];
  executableFiles.forEach(file => {
    const fullPath = path.join(repoRoot, file);
    if (fs.existsSync(fullPath)) {
      try {
        fs.accessSync(fullPath, fs.constants.X_OK);
      } catch (e) {
        issues.push(file);
      }
    }
  });
  
  return {
    ok: issues.length === 0,
    error: issues.length > 0 ? `${issues.length} files need execute permission` : null,
    details: issues
  };
}

// Fix permissions
function fixPermissions() {
  const result = checkPermissions();
  let fixed = 0;
  
  if (result.details && result.details.length > 0) {
    result.details.forEach(file => {
      const fullPath = path.join(repoRoot, file);
      try {
        fs.chmodSync(fullPath, '755');
        fixed++;
      } catch (e) {
        // Can't fix
      }
    });
  }
  
  return { fixed, message: `Fixed permissions for ${fixed} files` };
}

// Check agent communication
function checkAgentCommunication() {
  // Check if agent system files exist and are valid
  const agentSystemFiles = [
    'orch/lib/orch/agent-system.mjs',
    'orch/lib/orch/agent-communication.mjs',
    'orch/lib/orch-agents.mjs'
  ];
  
  const missing = agentSystemFiles.filter(f => !fs.existsSync(path.join(repoRoot, f)));
  
  return {
    ok: missing.length === 0,
    error: missing.length > 0 ? `Agent communication files missing: ${missing.length}` : null,
    details: missing,
    warning: missing.length === 0 ? 'Agent communication system operational' : null
  };
}

// Get default templates
function getDefaultPRDTemplate() {
  return `---
id: X.X.X.X.X.X
title: [Single Feature Name]
status: Draft
owner: [Implementation Owner Role]
assigned_roles: [List of roles working on this feature]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# [Single Feature Name] PRD

## Overview
[Feature description]

## User Stories
[User stories]

## Requirements
[Requirements]

## Testing
[Testing approach]

## Agent Assignments
[Assigned agents from the 33-agent pool]
`;
}

function getDefaultRoadmap() {
  return `---
title: Product Roadmap
version: v1.0
last-updated: ${new Date().toISOString().slice(0, 10)}
---

# Product Roadmap

## Phases and Milestones

| Phase | ID | Item | Status | Owner | PRD/Plan | Files/QA |
|-------|-----|------|--------|-------|----------|----------|
| V1 | 1.1.1.1.0.0 | User Authentication | Draft | Backend Engineer | \`PRDs/V1/1.1.1.1.0.0-user-authentication-prd.md\` | \`QA/1.1.1.1.0.0-user-authentication/\` |
`;
}

function getDefaultRoleTemplate() {
  return `# Role: [Role Name]

## Responsibilities
- Responsibility 1
- Responsibility 2

## Expertise
- Area 1
- Area 2

## KPIs
- Metric 1
- Metric 2
`;
}

// Main preflight check function
export async function preflightCheck(autoFix = false, silent = false) {
  if (!silent) {
    console.log(colors.bright + '\n🔍 Running Pre-flight Checks...\n' + colors.reset);
    console.log('Validating system with 33 agents...\n');
  }
  
  const results = [];
  let hasFailures = false;
  let hasCriticalFailures = false;
  
  // Run all checks
  for (const check of checks) {
    if (!silent) process.stdout.write(`Checking ${check.name.padEnd(35, '.')} `);
    
    try {
      const result = await check.check();
      
      if (result.ok) {
        if (!silent) {
          console.log(colors.green + '✓' + colors.reset);
          if (result.warning) {
            console.log(`  ${colors.yellow}ℹ ${result.warning}${colors.reset}`);
          }
        }
        results.push({ ...check, status: 'pass', result });
      } else {
        if (!silent) {
          console.log(colors.red + '✗' + colors.reset);
          console.log(`  ${colors.yellow}Issue: ${result.error}${colors.reset}`);
        }
        results.push({ ...check, status: 'fail', result });
        hasFailures = true;
        if (check.critical) hasCriticalFailures = true;
      }
    } catch (error) {
      if (!silent) {
        console.log(colors.red + '✗' + colors.reset);
        console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
      }
      results.push({ ...check, status: 'error', error });
      hasFailures = true;
      if (check.critical) hasCriticalFailures = true;
    }
  }
  
  // Summary
  if (!silent) {
    console.log('\n' + colors.bright + 'Summary:' + colors.reset);
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status !== 'pass').length;
    
    console.log(`  Passed: ${colors.green}${passed}/${checks.length}${colors.reset}`);
    if (failed > 0) {
      console.log(`  Failed: ${colors.red}${failed}/${checks.length}${colors.reset}`);
    }
    
    // Special agent status
    const agentCheck = results.find(r => r.name.includes('Agent Modules'));
    if (agentCheck && agentCheck.result) {
      console.log(`  Agents: ${colors.cyan}${agentCheck.result.found}/33 found${colors.reset}`);
      if (agentCheck.result.valid !== undefined) {
        console.log(`  Valid:  ${colors.green}${agentCheck.result.valid}/33 operational${colors.reset}`);
      }
    }
  }
  
  // Auto-fix if requested
  if (hasFailures && (autoFix || (!silent && await promptForFix()))) {
    if (!silent) console.log('\n' + colors.bright + '🔧 Attempting Auto-fixes...\n' + colors.reset);
    
    const failed = results.filter(r => r.status !== 'pass');
    
    for (const item of failed) {
      if (item.fix) {
        if (!silent) process.stdout.write(`Fixing ${item.name.padEnd(35, '.')} `);
        
        try {
          const fixResult = await item.fix();
          if (!silent) {
            if (fixResult.fixed > 0) {
              console.log(colors.green + '✓' + colors.reset);
              console.log(`  ${colors.dim}${fixResult.message}${colors.reset}`);
            } else {
              console.log(colors.yellow + '⚠' + colors.reset);
              console.log(`  ${colors.dim}${fixResult.message}${colors.reset}`);
            }
            
            if (fixResult.needsManual && fixResult.needsManual.length > 0) {
              console.log(`  ${colors.yellow}Manual action needed for:${colors.reset}`);
              fixResult.needsManual.forEach(item => {
                console.log(`    - ${item}`);
              });
            }
          }
        } catch (error) {
          if (!silent) {
            console.log(colors.red + '✗' + colors.reset);
            console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
          }
        }
      } else {
        if (!silent) {
          console.log(`  ${colors.dim}No auto-fix available for ${item.name}${colors.reset}`);
        }
      }
    }
    
    // Re-run checks after fixes
    if (!silent) {
      console.log('\n' + colors.bright + '📊 Re-running checks...\n' + colors.reset);
      return preflightCheck(false, silent);
    }
  }
  
  // Final status
  if (!silent) {
    if (!hasFailures) {
      console.log('\n' + colors.green + colors.bright + '✅ All checks passed!' + colors.reset);
      console.log('System is ready with all 33 agents operational.\n');
    } else if (hasCriticalFailures) {
      console.log('\n' + colors.red + colors.bright + '❌ Critical issues found!' + colors.reset);
      console.log('Please fix critical issues before proceeding.\n');
    } else {
      console.log('\n' + colors.yellow + colors.bright + '⚠️  Non-critical issues found' + colors.reset);
      console.log('System can operate but some features may be limited.\n');
    }
  }
  
  return {
    passed: !hasFailures,
    critical: hasCriticalFailures,
    results
  };
}

// Prompt for fix
async function promptForFix() {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\nAttempt to auto-fix issues? (y/n): ', (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const autoFix = args.includes('--fix') || args.includes('-f');
  const silent = args.includes('--silent') || args.includes('-s');
  
  preflightCheck(autoFix, silent).then((result) => {
    process.exit(result.passed ? 0 : 1);
  }).catch(err => {
    console.error(colors.red + 'Fatal error:' + colors.reset, err);
    process.exit(1);
  });
}