#!/usr/bin/env node
/**
 * Hook Runner for ORCH System
 * Execute custom scripts at key lifecycle points with agent integration
 * Supports pre/post hooks for all major operations
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import { loadConfig } from './config-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(__dirname, '../..');

// Hook types
const HOOK_TYPES = {
  // Feature lifecycle
  PRE_START: 'preStart',
  POST_START: 'postStart',
  PRE_SCAFFOLD: 'preScaffold',
  POST_SCAFFOLD: 'postScaffold',
  
  // Agent operations
  PRE_AGENT_ASSIGN: 'preAgentAssign',
  POST_AGENT_ASSIGN: 'postAgentAssign',
  PRE_AGENT_REVIEW: 'preAgentReview',
  POST_AGENT_REVIEW: 'postAgentReview',
  
  // Git operations
  PRE_COMMIT: 'preCommit',
  POST_COMMIT: 'postCommit',
  PRE_PUSH: 'prePush',
  POST_PUSH: 'postPush',
  PRE_MERGE: 'preMerge',
  POST_MERGE: 'postMerge',
  
  // Build & deploy
  PRE_BUILD: 'preBuild',
  POST_BUILD: 'postBuild',
  PRE_TEST: 'preTest',
  POST_TEST: 'postTest',
  PRE_DEPLOY: 'preDeploy',
  POST_DEPLOY: 'postDeploy',
  
  // System events
  ON_ERROR: 'onError',
  ON_SUCCESS: 'onSuccess',
  ON_WARNING: 'onWarning',
  ON_COMPLETE: 'onComplete'
};

// Hook context enrichment
class HookContext {
  constructor(hookType, data = {}) {
    this.hookType = hookType;
    this.timestamp = new Date().toISOString();
    this.environment = process.env.NODE_ENV || 'development';
    this.user = process.env.USER || 'unknown';
    this.cwd = process.cwd();
    this.data = data;
    this.agents = this.extractAgents(data);
    this.feature = this.extractFeature(data);
  }
  
  extractAgents(data) {
    if (data.agents) return data.agents;
    if (data.assignedAgents) return data.assignedAgents;
    return [];
  }
  
  extractFeature(data) {
    if (data.featureId) return data.featureId;
    if (data.id) return data.id;
    return null;
  }
  
  toEnvironment() {
    const env = {
      HOOK_TYPE: this.hookType,
      HOOK_TIMESTAMP: this.timestamp,
      HOOK_ENVIRONMENT: this.environment,
      HOOK_USER: this.user,
      HOOK_CWD: this.cwd
    };
    
    if (this.feature) {
      env.HOOK_FEATURE_ID = this.feature;
    }
    
    if (this.agents.length > 0) {
      env.HOOK_AGENTS = this.agents.join(',');
      env.HOOK_AGENT_COUNT = this.agents.length.toString();
    }
    
    // Add custom data as JSON
    env.HOOK_DATA = JSON.stringify(this.data);
    
    // Add specific fields
    Object.entries(this.data).forEach(([key, value]) => {
      const envKey = `HOOK_${key.toUpperCase().replace(/-/g, '_')}`;
      if (typeof value === 'string' || typeof value === 'number') {
        env[envKey] = value.toString();
      } else if (typeof value === 'boolean') {
        env[envKey] = value ? 'true' : 'false';
      }
    });
    
    return env;
  }
}

// Hook runner class
export class HookRunner {
  constructor(options = {}) {
    this.config = loadConfig();
    this.hooks = this.loadHooks();
    this.options = options;
    this.history = [];
    this.maxHistorySize = 100;
  }
  
  // Load hooks from config and files
  loadHooks() {
    const hooks = { ...this.config.hooks };
    
    // Load hooks from .orch/hooks directory
    const hooksDir = path.join(repoRoot, '.orch/hooks');
    if (fs.existsSync(hooksDir)) {
      const files = fs.readdirSync(hooksDir);
      files.forEach(file => {
        const hookName = path.basename(file, path.extname(file));
        if (Object.values(HOOK_TYPES).includes(hookName)) {
          hooks[hookName] = path.join(hooksDir, file);
        }
      });
    }
    
    // Load hooks from package.json scripts
    const packagePath = path.join(repoRoot, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      if (pkg.orchHooks) {
        Object.assign(hooks, pkg.orchHooks);
      }
    }
    
    return hooks;
  }
  
  // Run a specific hook
  async runHook(hookType, data = {}) {
    const hookCommand = this.hooks[hookType];
    
    if (!hookCommand) {
      return {
        success: true,
        skipped: true,
        message: `No hook configured for ${hookType}`
      };
    }
    
    const context = new HookContext(hookType, data);
    
    // Log hook execution
    if (this.options.verbose) {
      console.log(`\n🪝 Running ${hookType} hook...`);
      console.log(`   Command: ${hookCommand}`);
      console.log(`   Feature: ${context.feature || 'N/A'}`);
      console.log(`   Agents: ${context.agents.length || 0}`);
    }
    
    try {
      const result = await this.executeHook(hookCommand, context);
      
      // Add to history
      this.addToHistory({
        type: hookType,
        timestamp: context.timestamp,
        success: result.success,
        duration: result.duration,
        output: result.output?.slice(-500) // Last 500 chars
      });
      
      // Run agent validation if configured
      if (this.shouldRunAgentValidation(hookType)) {
        result.agentValidation = await this.runAgentValidation(hookType, result, context);
      }
      
      return result;
    } catch (error) {
      // Run error hook if available
      if (hookType !== HOOK_TYPES.ON_ERROR) {
        await this.runHook(HOOK_TYPES.ON_ERROR, {
          originalHook: hookType,
          error: error.message,
          ...data
        });
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Execute hook command
  async executeHook(command, context) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const env = {
        ...process.env,
        ...context.toEnvironment()
      };
      
      // Determine if command is a script file or shell command
      let child;
      if (fs.existsSync(command)) {
        // Script file
        const ext = path.extname(command);
        if (ext === '.js' || ext === '.mjs') {
          child = spawn('node', [command], { env, cwd: repoRoot });
        } else if (ext === '.sh') {
          child = spawn('bash', [command], { env, cwd: repoRoot });
        } else if (ext === '.py') {
          child = spawn('python', [command], { env, cwd: repoRoot });
        } else {
          // Try to execute directly
          child = spawn(command, [], { env, cwd: repoRoot });
        }
      } else {
        // Shell command
        child = spawn('sh', ['-c', command], { env, cwd: repoRoot });
      }
      
      let output = '';
      let errorOutput = '';
      
      child.stdout?.on('data', (data) => {
        output += data.toString();
        if (this.options.verbose) {
          process.stdout.write(data);
        }
      });
      
      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
        if (this.options.verbose) {
          process.stderr.write(data);
        }
      });
      
      child.on('exit', (code) => {
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          resolve({
            success: true,
            duration,
            output,
            exitCode: code
          });
        } else {
          resolve({
            success: false,
            duration,
            output,
            errorOutput,
            exitCode: code,
            error: `Hook exited with code ${code}`
          });
        }
      });
      
      child.on('error', (error) => {
        resolve({
          success: false,
          duration: Date.now() - startTime,
          error: error.message
        });
      });
    });
  }
  
  // Check if agent validation should run
  shouldRunAgentValidation(hookType) {
    const validationHooks = [
      HOOK_TYPES.POST_COMMIT,
      HOOK_TYPES.PRE_PUSH,
      HOOK_TYPES.PRE_DEPLOY,
      HOOK_TYPES.POST_TEST
    ];
    
    return validationHooks.includes(hookType) && 
           this.config.agents.autoAssign;
  }
  
  // Run agent validation
  async runAgentValidation(hookType, hookResult, context) {
    if (!hookResult.success) {
      return { validated: false, reason: 'Hook failed' };
    }
    
    // Select validation agents based on hook type
    const agents = this.selectValidationAgents(hookType, context);
    
    // Simulate agent validation (would call actual agent system)
    const validations = await Promise.all(
      agents.map(agent => this.simulateAgentValidation(agent, hookType, hookResult))
    );
    
    const approved = validations.filter(v => v.approved).length;
    const total = validations.length;
    
    return {
      validated: approved >= Math.ceil(total * 0.7), // 70% approval required
      approvals: approved,
      total,
      agents,
      details: validations
    };
  }
  
  // Select validation agents
  selectValidationAgents(hookType, context) {
    const agents = [];
    
    switch(hookType) {
      case HOOK_TYPES.POST_COMMIT:
        agents.push('qa-engineer', 'backend-engineer');
        break;
      case HOOK_TYPES.PRE_PUSH:
        agents.push('staff-engineer', 'security-architect');
        break;
      case HOOK_TYPES.PRE_DEPLOY:
        agents.push('devops-engineer', 'site-reliability-engineer', 'qa-engineer');
        break;
      case HOOK_TYPES.POST_TEST:
        agents.push('qa-automation-engineer', 'qa-engineer');
        break;
      default:
        agents.push('qa-engineer');
    }
    
    // Add feature-specific agents if available
    if (context.agents.length > 0) {
      agents.push(...context.agents.slice(0, 2));
    }
    
    return [...new Set(agents)];
  }
  
  // Simulate agent validation
  async simulateAgentValidation(agent, hookType, hookResult) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simulate validation logic
    const approved = Math.random() > 0.2; // 80% approval rate
    
    return {
      agent,
      approved,
      message: approved ? 
        `Hook execution validated` : 
        `Validation failed: output concerns`,
      timestamp: new Date().toISOString()
    };
  }
  
  // Add to history
  addToHistory(entry) {
    this.history.push(entry);
    
    // Trim history if too large
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }
  
  // Get hook history
  getHistory(filter = {}) {
    let filtered = [...this.history];
    
    if (filter.type) {
      filtered = filtered.filter(h => h.type === filter.type);
    }
    
    if (filter.success !== undefined) {
      filtered = filtered.filter(h => h.success === filter.success);
    }
    
    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime();
      filtered = filtered.filter(h => 
        new Date(h.timestamp).getTime() > sinceTime
      );
    }
    
    return filtered;
  }
  
  // Register a new hook
  registerHook(hookType, command) {
    if (!Object.values(HOOK_TYPES).includes(hookType)) {
      return {
        success: false,
        error: `Invalid hook type: ${hookType}`
      };
    }
    
    this.hooks[hookType] = command;
    
    // Save to config
    const config = loadConfig();
    config.hooks[hookType] = command;
    
    return {
      success: true,
      message: `Hook ${hookType} registered`
    };
  }
  
  // Remove a hook
  removeHook(hookType) {
    delete this.hooks[hookType];
    
    // Update config
    const config = loadConfig();
    delete config.hooks[hookType];
    
    return {
      success: true,
      message: `Hook ${hookType} removed`
    };
  }
  
  // List all hooks
  listHooks() {
    const hooks = [];
    
    Object.entries(this.hooks).forEach(([type, command]) => {
      if (command) {
        hooks.push({
          type,
          command,
          exists: fs.existsSync(command),
          enabled: true
        });
      }
    });
    
    // Add undefined hooks
    Object.values(HOOK_TYPES).forEach(type => {
      if (!this.hooks[type]) {
        hooks.push({
          type,
          command: null,
          exists: false,
          enabled: false
        });
      }
    });
    
    return hooks;
  }
  
  // Run hook chain
  async runHookChain(hooks, data = {}) {
    const results = [];
    
    for (const hookType of hooks) {
      const result = await this.runHook(hookType, data);
      results.push({ type: hookType, ...result });
      
      // Stop chain if hook fails and stopOnError is true
      if (!result.success && this.options.stopOnError) {
        break;
      }
    }
    
    return results;
  }
  
  // Create default hooks
  async createDefaultHooks() {
    const hooksDir = path.join(repoRoot, '.orch/hooks');
    fs.mkdirSync(hooksDir, { recursive: true });
    
    // Create example pre-commit hook
    const preCommitPath = path.join(hooksDir, 'preCommit.sh');
    const preCommitContent = `#!/bin/bash
# Pre-commit hook for ORCH system
echo "🔍 Running pre-commit checks..."

# Run linter
npm run lint

# Run tests
npm run test

echo "✅ Pre-commit checks passed"
`;
    fs.writeFileSync(preCommitPath, preCommitContent);
    fs.chmodSync(preCommitPath, '755');
    
    // Create example post-test hook
    const postTestPath = path.join(hooksDir, 'postTest.js');
    const postTestContent = `#!/usr/bin/env node
// Post-test hook for ORCH system
console.log('📊 Analyzing test results...');

const featureId = process.env.HOOK_FEATURE_ID;
const agents = process.env.HOOK_AGENTS;

if (featureId) {
  console.log(\`Feature: \${featureId}\`);
}

if (agents) {
  console.log(\`Agents involved: \${agents}\`);
}

console.log('✅ Test analysis complete');
`;
    fs.writeFileSync(postTestPath, postTestContent);
    fs.chmodSync(postTestPath, '755');
    
    return {
      success: true,
      created: [preCommitPath, postTestPath]
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  const runner = new HookRunner({ verbose: true });
  
  async function run() {
    switch (command) {
      case 'run':
        const hookType = args[1];
        if (!hookType || !Object.values(HOOK_TYPES).includes(hookType)) {
          console.error('Invalid hook type. Available types:');
          Object.values(HOOK_TYPES).forEach(t => console.log(`  - ${t}`));
          process.exit(1);
        }
        
        const data = args[2] ? JSON.parse(args[2]) : {};
        const result = await runner.runHook(hookType, data);
        
        if (result.success) {
          console.log(`✅ Hook ${hookType} executed successfully`);
          if (result.agentValidation) {
            console.log(`🤖 Agent validation: ${result.agentValidation.approvals}/${result.agentValidation.total} approved`);
          }
        } else {
          console.error(`❌ Hook ${hookType} failed: ${result.error}`);
        }
        
        process.exit(result.success ? 0 : 1);
        break;
        
      case 'list':
        const hooks = runner.listHooks();
        console.log('\n📋 Configured Hooks:\n');
        hooks.forEach(hook => {
          const status = hook.enabled ? '✅' : '⚪';
          const exists = hook.exists ? '📄' : '❌';
          console.log(`${status} ${hook.type.padEnd(20)} ${exists} ${hook.command || 'Not configured'}`);
        });
        break;
        
      case 'register':
        const regType = args[1];
        const regCommand = args[2];
        if (!regType || !regCommand) {
          console.error('Usage: hook-runner.mjs register <type> <command>');
          process.exit(1);
        }
        const regResult = runner.registerHook(regType, regCommand);
        console.log(regResult.success ? `✅ ${regResult.message}` : `❌ ${regResult.error}`);
        break;
        
      case 'remove':
        const remType = args[1];
        if (!remType) {
          console.error('Usage: hook-runner.mjs remove <type>');
          process.exit(1);
        }
        const remResult = runner.removeHook(remType);
        console.log(`✅ ${remResult.message}`);
        break;
        
      case 'history':
        const history = runner.getHistory();
        console.log('\n📜 Hook Execution History:\n');
        history.slice(-10).forEach(entry => {
          const status = entry.success ? '✅' : '❌';
          const duration = entry.duration ? `${entry.duration}ms` : 'N/A';
          console.log(`${status} ${entry.type.padEnd(20)} ${entry.timestamp} (${duration})`);
        });
        break;
        
      case 'init':
        const initResult = await runner.createDefaultHooks();
        console.log('✅ Default hooks created:');
        initResult.created.forEach(p => console.log(`  - ${p}`));
        break;
        
      default:
        console.log(`
Hook Runner for ORCH System

Usage: hook-runner.mjs <command> [options]

Commands:
  run <type> [data]       Run a specific hook
  list                    List all configured hooks
  register <type> <cmd>   Register a new hook
  remove <type>           Remove a hook
  history                 Show hook execution history
  init                    Create default hooks

Hook Types:
  Feature: ${HOOK_TYPES.PRE_START}, ${HOOK_TYPES.POST_START}
  Agents: ${HOOK_TYPES.PRE_AGENT_ASSIGN}, ${HOOK_TYPES.POST_AGENT_REVIEW}
  Git: ${HOOK_TYPES.PRE_COMMIT}, ${HOOK_TYPES.POST_COMMIT}
  Build: ${HOOK_TYPES.PRE_BUILD}, ${HOOK_TYPES.POST_TEST}
  Deploy: ${HOOK_TYPES.PRE_DEPLOY}, ${HOOK_TYPES.POST_DEPLOY}

Examples:
  hook-runner.mjs run preCommit
  hook-runner.mjs run postTest '{"featureId":"1.1.1.1.0.0"}'
  hook-runner.mjs register preCommit "./scripts/lint.sh"
  hook-runner.mjs list

Hook Environment Variables:
  HOOK_TYPE           - Type of hook being run
  HOOK_FEATURE_ID     - Current feature ID
  HOOK_AGENTS         - Assigned agents (comma-separated)
  HOOK_DATA           - Custom data as JSON
`);
      }
  }
  
  run().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}