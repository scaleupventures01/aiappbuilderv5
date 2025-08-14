#!/usr/bin/env node
/**
 * Configuration Loader for ORCH System
 * Manages .orchrc.json configuration with support for 33-agent system
 * Provides defaults, validation, and environment variable overrides
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(__dirname, '../..');

// Configuration file names to search for
const CONFIG_FILES = [
  '.orchrc.json',
  '.orchrc',
  'orch.config.json',
  'orch.config.js'
];

// Default configuration
const DEFAULT_CONFIG = {
  // General settings
  version: '1.0.0',
  defaultOwner: 'Backend Engineer',
  autoCommit: false,
  generateTests: true,
  runPreflightChecks: true,
  verboseLogging: false,
  
  // Agent configuration (33-agent system)
  agents: {
    total: 33,
    autoAssign: true,
    requireApproval: false,
    maxPerFeature: 10,
    minPerFeature: 3,
    communicationMode: 'async', // async, sync, hybrid
    concurrentLimit: 5,
    timeout: 300000, // 5 minutes per agent
    retryAttempts: 2,
    
    // Agent assignment rules
    assignments: {
      frontend: ['frontend-engineer', 'ux-ui-designer', 'ux-researcher'],
      backend: ['backend-engineer', 'technical-product-manager'],
      data: ['data-engineer', 'data-analyst', 'data-scientist'],
      ai: ['ai-engineer', 'machine-learning-engineer', 'mlops-engineer'],
      security: ['security-architect', 'application-security-engineer'],
      infrastructure: ['devops-engineer', 'site-reliability-engineer'],
      leadership: ['cto', 'vp-engineering', 'vp-product']
    },
    
    // Agent priorities (higher number = higher priority)
    priorities: {
      'product-manager': 10,
      'qa-engineer': 9,
      'backend-engineer': 8,
      'frontend-engineer': 8,
      'staff-engineer': 7,
      'full-stack-engineer': 6
    }
  },
  
  // Template paths
  templates: {
    prd: 'app/PRDs/_templates/PRD-template.md',
    test: 'app/tests/_templates/test-template.md',
    qa: 'app/QA/_templates/qa-template.md',
    role: 'orch/team/_templates/role-playbook-template.md'
  },
  
  // Workflow configuration
  workflow: {
    autoLint: true,
    autoTest: true,
    autoFormat: true,
    requireApproval: false,
    runAgentsOnStart: true,
    parallelTasks: true,
    maxParallelTasks: 3,
    
    // Quality gates
    gates: {
      testCoverage: 80,
      lintErrors: 0,
      securityVulnerabilities: 0,
      performanceThreshold: 200 // ms
    }
  },
  
  // Git integration
  gitIntegration: {
    enabled: false,
    autoCreateBranch: false,
    branchPrefix: 'feature/',
    commitPrefix: 'orch:',
    requirePR: true,
    autoMerge: false,
    protectedBranches: ['main', 'master', 'develop']
  },
  
  // Dashboard configuration
  dashboard: {
    refreshInterval: 5000,
    showBlockers: true,
    showAgentStatus: true,
    maxRecentActivity: 10,
    theme: 'auto', // auto, light, dark
    compactMode: false
  },
  
  // Batch operations
  batch: {
    defaultMode: 'smart', // sequential, parallel, smart
    maxConcurrent: 3,
    queueTimeout: 600000, // 10 minutes
    retryFailedFeatures: true
  },
  
  // Task decomposition
  decomposition: {
    autoDecompose: true,
    maxTaskDepth: 3,
    defaultComplexity: 3,
    includeEstimates: true,
    assignAgentsToTasks: true
  },
  
  // Security settings
  security: {
    enableAuth: false,
    requireHTTPS: false,
    apiKeyRequired: false,
    allowedOrigins: ['http://localhost:3000'],
    rateLimit: {
      enabled: false,
      maxRequests: 100,
      windowMs: 60000
    }
  },
  
  // Notification settings
  notifications: {
    enabled: false,
    channels: {
      slack: {
        enabled: false,
        webhook: '',
        mentions: {
          critical: '@channel',
          warning: '@here'
        }
      },
      email: {
        enabled: false,
        smtp: {},
        recipients: []
      }
    },
    events: {
      featureComplete: true,
      testFailure: true,
      deploymentSuccess: true,
      agentError: true
    }
  },
  
  // Hooks
  hooks: {
    preStart: null,
    postStart: null,
    preCommit: null,
    postCommit: null,
    preDeploy: null,
    postDeploy: null,
    onError: null,
    onSuccess: null
  },
  
  // Environment-specific overrides
  environments: {
    development: {
      verboseLogging: true,
      runPreflightChecks: false
    },
    staging: {
      requireApproval: true,
      autoCommit: false
    },
    production: {
      requireApproval: true,
      autoCommit: false,
      runPreflightChecks: true,
      security: {
        enableAuth: true,
        requireHTTPS: true
      }
    }
  }
};

// Configuration cache
let configCache = null;
let configPath = null;

// Load configuration
export function loadConfig(options = {}) {
  // Return cache if available and not forcing reload
  if (configCache && !options.reload) {
    return configCache;
  }
  
  // Find configuration file
  configPath = findConfigFile(options.path);
  
  let config = {};
  
  if (configPath) {
    try {
      // Load config file
      const ext = path.extname(configPath);
      
      if (ext === '.js') {
        // Dynamic import for JS config
        delete require.cache[configPath];
        config = require(configPath);
      } else {
        // JSON config
        const configContent = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configContent);
      }
      
      if (options.verbose) {
        console.log(`✅ Loaded config from: ${configPath}`);
      }
    } catch (error) {
      console.error(`❌ Error loading config from ${configPath}:`, error.message);
      config = {};
    }
  } else if (options.verbose) {
    console.log('ℹ️  No config file found, using defaults');
  }
  
  // Merge with defaults
  config = deepMerge(DEFAULT_CONFIG, config);
  
  // Apply environment overrides
  const env = process.env.NODE_ENV || 'development';
  if (config.environments && config.environments[env]) {
    config = deepMerge(config, config.environments[env]);
    if (options.verbose) {
      console.log(`📝 Applied ${env} environment overrides`);
    }
  }
  
  // Apply environment variable overrides
  config = applyEnvOverrides(config);
  
  // Validate configuration
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.error('❌ Configuration validation failed:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
    if (options.strict) {
      throw new Error('Invalid configuration');
    }
  }
  
  // Cache the config
  configCache = config;
  
  return config;
}

// Find configuration file
function findConfigFile(customPath) {
  // Check custom path first
  if (customPath && fs.existsSync(customPath)) {
    return path.resolve(customPath);
  }
  
  // Search in project root and up
  let currentDir = repoRoot;
  
  while (currentDir !== path.parse(currentDir).root) {
    for (const configFile of CONFIG_FILES) {
      const configPath = path.join(currentDir, configFile);
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }
    
    // Move up one directory
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

// Deep merge objects
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

// Apply environment variable overrides
function applyEnvOverrides(config) {
  const envMappings = {
    'ORCH_DEFAULT_OWNER': 'defaultOwner',
    'ORCH_AUTO_COMMIT': 'autoCommit',
    'ORCH_VERBOSE': 'verboseLogging',
    'ORCH_MAX_AGENTS': 'agents.maxPerFeature',
    'ORCH_AUTO_ASSIGN_AGENTS': 'agents.autoAssign',
    'ORCH_GIT_ENABLED': 'gitIntegration.enabled',
    'ORCH_GIT_BRANCH_PREFIX': 'gitIntegration.branchPrefix',
    'ORCH_DASHBOARD_REFRESH': 'dashboard.refreshInterval',
    'ORCH_BATCH_MODE': 'batch.defaultMode',
    'ORCH_SECURITY_AUTH': 'security.enableAuth',
    'ORCH_NOTIFICATION_SLACK': 'notifications.channels.slack.enabled',
    'ORCH_ENVIRONMENT': 'environment'
  };
  
  for (const [envVar, configPath] of Object.entries(envMappings)) {
    if (process.env[envVar]) {
      setNestedValue(config, configPath, parseEnvValue(process.env[envVar]));
    }
  }
  
  return config;
}

// Set nested value in object
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Parse environment variable value
function parseEnvValue(value) {
  // Boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Number
  if (!isNaN(value)) return Number(value);
  
  // JSON
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      // Not valid JSON, return as string
    }
  }
  
  return value;
}

// Validate configuration
function validateConfig(config) {
  const errors = [];
  
  // Check required fields
  if (!config.defaultOwner) {
    errors.push('defaultOwner is required');
  }
  
  // Validate agent configuration
  if (config.agents) {
    if (config.agents.maxPerFeature < config.agents.minPerFeature) {
      errors.push('agents.maxPerFeature must be >= agents.minPerFeature');
    }
    
    if (config.agents.concurrentLimit > config.agents.total) {
      errors.push('agents.concurrentLimit cannot exceed agents.total');
    }
    
    if (!['async', 'sync', 'hybrid'].includes(config.agents.communicationMode)) {
      errors.push('agents.communicationMode must be async, sync, or hybrid');
    }
  }
  
  // Validate workflow gates
  if (config.workflow && config.workflow.gates) {
    if (config.workflow.gates.testCoverage < 0 || config.workflow.gates.testCoverage > 100) {
      errors.push('workflow.gates.testCoverage must be between 0 and 100');
    }
  }
  
  // Validate batch configuration
  if (config.batch) {
    if (!['sequential', 'parallel', 'smart'].includes(config.batch.defaultMode)) {
      errors.push('batch.defaultMode must be sequential, parallel, or smart');
    }
  }
  
  // Validate template paths
  if (config.templates) {
    for (const [key, templatePath] of Object.entries(config.templates)) {
      const fullPath = path.join(repoRoot, templatePath);
      if (!fs.existsSync(fullPath) && !fs.existsSync(path.dirname(fullPath))) {
        // Warning only, not an error
        console.warn(`⚠️  Template directory not found: ${path.dirname(fullPath)}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Save configuration
export function saveConfig(config, customPath) {
  const savePath = customPath || configPath || path.join(repoRoot, '.orchrc.json');
  
  try {
    // Remove environment-specific data before saving
    const configToSave = { ...config };
    delete configToSave.environments;
    
    // Pretty print JSON
    const jsonContent = JSON.stringify(configToSave, null, 2);
    fs.writeFileSync(savePath, jsonContent);
    
    // Clear cache
    configCache = null;
    
    return {
      success: true,
      path: savePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Get config value by path
export function getConfigValue(path, defaultValue = null) {
  const config = loadConfig();
  const keys = path.split('.');
  let current = config;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  
  return current;
}

// Set config value by path
export function setConfigValue(path, value) {
  const config = loadConfig();
  setNestedValue(config, path, value);
  return saveConfig(config);
}

// List all configuration values
export function listConfig(filter = null) {
  const config = loadConfig();
  const flat = flattenObject(config);
  
  if (filter) {
    const filtered = {};
    for (const [key, value] of Object.entries(flat)) {
      if (key.includes(filter)) {
        filtered[key] = value;
      }
    }
    return filtered;
  }
  
  return flat;
}

// Flatten nested object
function flattenObject(obj, prefix = '') {
  const flat = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flat, flattenObject(value, newKey));
    } else {
      flat[newKey] = value;
    }
  }
  
  return flat;
}

// Initialize configuration
export function initConfig(options = {}) {
  const configPath = path.join(repoRoot, '.orchrc.json');
  
  if (fs.existsSync(configPath) && !options.force) {
    return {
      success: false,
      error: 'Configuration already exists. Use --force to overwrite.'
    };
  }
  
  // Create config with defaults
  const config = options.minimal ? {
    version: DEFAULT_CONFIG.version,
    defaultOwner: DEFAULT_CONFIG.defaultOwner,
    agents: {
      total: 33,
      autoAssign: true
    },
    workflow: {
      runAgentsOnStart: true
    }
  } : DEFAULT_CONFIG;
  
  return saveConfig(config, configPath);
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'init':
      const initResult = initConfig({
        force: args.includes('--force'),
        minimal: args.includes('--minimal')
      });
      if (initResult.success) {
        console.log(`✅ Configuration created at: ${initResult.path}`);
      } else {
        console.error(`❌ ${initResult.error}`);
        process.exit(1);
      }
      break;
      
    case 'get':
      if (!args[1]) {
        console.error('Usage: config-loader.mjs get <path>');
        process.exit(1);
      }
      const value = getConfigValue(args[1]);
      console.log(value !== null ? value : 'undefined');
      break;
      
    case 'set':
      if (!args[1] || !args[2]) {
        console.error('Usage: config-loader.mjs set <path> <value>');
        process.exit(1);
      }
      const setResult = setConfigValue(args[1], parseEnvValue(args[2]));
      if (setResult.success) {
        console.log(`✅ Configuration updated`);
      } else {
        console.error(`❌ ${setResult.error}`);
        process.exit(1);
      }
      break;
      
    case 'list':
      const filter = args[1];
      const configs = listConfig(filter);
      console.log('\n📋 Configuration Values:\n');
      for (const [key, value] of Object.entries(configs)) {
        console.log(`  ${key}: ${JSON.stringify(value)}`);
      }
      break;
      
    case 'validate':
      const config = loadConfig({ verbose: true });
      const validation = validateConfig(config);
      if (validation.valid) {
        console.log('✅ Configuration is valid');
      } else {
        console.error('❌ Configuration has errors:');
        validation.errors.forEach(err => console.error(`  - ${err}`));
        process.exit(1);
      }
      break;
      
    default:
      console.log(`
Configuration Loader for ORCH System

Usage: config-loader.mjs <command> [options]

Commands:
  init [--force] [--minimal]  Create default configuration
  get <path>                   Get configuration value
  set <path> <value>          Set configuration value
  list [filter]               List all configuration values
  validate                    Validate current configuration

Examples:
  config-loader.mjs init
  config-loader.mjs get agents.total
  config-loader.mjs set agents.maxPerFeature 15
  config-loader.mjs list agents
  config-loader.mjs validate

Environment Variables:
  ORCH_DEFAULT_OWNER          Override default owner
  ORCH_AUTO_COMMIT           Enable/disable auto-commit
  ORCH_MAX_AGENTS            Max agents per feature
  ORCH_AUTO_ASSIGN_AGENTS    Enable/disable auto-assignment
  ORCH_GIT_ENABLED           Enable/disable git integration
  ORCH_ENVIRONMENT           Set environment (development, staging, production)
`);
  }
}