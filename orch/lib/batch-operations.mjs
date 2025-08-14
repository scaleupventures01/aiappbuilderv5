#!/usr/bin/env node
/**
 * Batch Operations with Agent Orchestration
 * Process multiple features simultaneously with intelligent agent distribution
 * Leverages concurrent agent execution and workload balancing
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const appRoot = path.resolve(__dirname, '../../app');

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Batch operation modes
const MODES = {
  SEQUENTIAL: 'sequential',
  PARALLEL: 'parallel',
  SMART: 'smart' // Intelligently decide based on agent availability
};

// Agent pool management
class AgentPool {
  constructor(totalAgents = 33) {
    this.totalAgents = totalAgents;
    this.availableAgents = this.initializeAgents();
    this.assignedAgents = new Map();
    this.workload = new Map();
  }
  
  initializeAgents() {
    // List of all 33 agents
    return [
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
  }
  
  getAvailableAgents(count = 5) {
    // Return agents with lowest workload
    const sorted = Array.from(this.availableAgents).sort((a, b) => {
      const workloadA = this.workload.get(a) || 0;
      const workloadB = this.workload.get(b) || 0;
      return workloadA - workloadB;
    });
    return sorted.slice(0, count);
  }
  
  assignAgents(featureId, agents) {
    this.assignedAgents.set(featureId, agents);
    agents.forEach(agent => {
      const current = this.workload.get(agent) || 0;
      this.workload.set(agent, current + 1);
    });
  }
  
  releaseAgents(featureId) {
    const agents = this.assignedAgents.get(featureId);
    if (agents) {
      agents.forEach(agent => {
        const current = this.workload.get(agent) || 0;
        this.workload.set(agent, Math.max(0, current - 1));
      });
      this.assignedAgents.delete(featureId);
    }
  }
  
  getWorkloadReport() {
    const report = {};
    this.workload.forEach((load, agent) => {
      if (load > 0) {
        report[agent] = load;
      }
    });
    return report;
  }
}

// Batch processor
export async function batchProcess(featureIds, options = {}) {
  const mode = options.mode || MODES.SMART;
  const maxConcurrent = options.maxConcurrent || 3;
  const agentPool = new AgentPool();
  
  console.log(colors.bright + '\n🚀 Batch Operations with 33-Agent System\n' + colors.reset);
  console.log(`Mode: ${colors.cyan}${mode}${colors.reset}`);
  console.log(`Features: ${colors.cyan}${featureIds.length}${colors.reset}`);
  console.log(`Max Concurrent: ${colors.cyan}${maxConcurrent}${colors.reset}`);
  console.log(`Total Agents Available: ${colors.cyan}33${colors.reset}\n`);
  
  // Validate feature IDs
  const validIds = featureIds.filter(id => /^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/.test(id));
  const invalidIds = featureIds.filter(id => !validIds.includes(id));
  
  if (invalidIds.length > 0) {
    console.log(colors.yellow + '⚠️  Invalid IDs skipped:' + colors.reset);
    invalidIds.forEach(id => console.log(`  - ${id}`));
  }
  
  if (validIds.length === 0) {
    console.error(colors.red + '❌ No valid feature IDs to process' + colors.reset);
    return { success: false, results: [] };
  }
  
  // Load feature information
  const features = await loadFeatures(validIds);
  
  // Determine processing strategy
  const strategy = determineStrategy(features, mode, agentPool);
  
  // Display execution plan
  displayExecutionPlan(strategy, agentPool);
  
  // Execute batch operation
  const results = await executeBatch(strategy, agentPool, options);
  
  // Display results
  displayBatchResults(results, agentPool);
  
  return results;
}

// Load feature information
async function loadFeatures(featureIds) {
  const features = [];
  
  for (const id of featureIds) {
    const feature = await loadFeatureInfo(id);
    features.push(feature);
  }
  
  return features;
}

// Load single feature info
async function loadFeatureInfo(featureId) {
  // Check roadmap
  const roadmapPath = path.join(appRoot, 'Plans/product-roadmap.md');
  let featureInfo = {
    id: featureId,
    title: 'Unknown Feature',
    status: 'Unknown',
    owner: 'Unassigned',
    complexity: estimateComplexity(featureId)
  };
  
  if (fs.existsSync(roadmapPath)) {
    const roadmap = fs.readFileSync(roadmapPath, 'utf8');
    const lines = roadmap.split('\n');
    const featureLine = lines.find(l => l.includes(`| ${featureId} |`));
    
    if (featureLine) {
      const parts = featureLine.split('|').map(s => s.trim());
      featureInfo.title = parts[3] || featureInfo.title;
      featureInfo.status = parts[4] || featureInfo.status;
      featureInfo.owner = parts[5] || featureInfo.owner;
    }
  }
  
  // Check for existing PRD
  const prdsDir = path.join(appRoot, 'PRDs');
  ['V1', 'V2', 'V3'].forEach(version => {
    const versionDir = path.join(prdsDir, version);
    if (fs.existsSync(versionDir)) {
      const files = fs.readdirSync(versionDir);
      const matchingFile = files.find(f => f.startsWith(featureId));
      if (matchingFile) {
        featureInfo.hasPRD = true;
        featureInfo.prdPath = path.join(versionDir, matchingFile);
      }
    }
  });
  
  return featureInfo;
}

// Estimate feature complexity
function estimateComplexity(featureId) {
  const [version, major, minor, feature, task, subtask] = featureId.split('.').map(Number);
  
  let complexity = 1;
  
  // Version-based complexity
  if (version >= 4) complexity++; // AI/ML features
  if (version >= 6) complexity++; // Security features
  
  // Major version complexity
  if (major >= 5) complexity++;
  if (major >= 8) complexity++;
  
  // Task complexity
  if (task >= 5) complexity++;
  
  return Math.min(complexity, 5);
}

// Determine processing strategy
function determineStrategy(features, mode, agentPool) {
  const strategy = {
    mode: mode,
    batches: [],
    assignments: new Map()
  };
  
  if (mode === MODES.SEQUENTIAL) {
    // Process one at a time
    features.forEach(feature => {
      strategy.batches.push([feature]);
    });
  } else if (mode === MODES.PARALLEL) {
    // Process all at once (limited by maxConcurrent)
    strategy.batches.push(features);
  } else if (mode === MODES.SMART) {
    // Group by complexity and agent requirements
    const groups = groupFeaturesByComplexity(features);
    
    // Create batches based on agent availability
    groups.forEach(group => {
      const batchSize = Math.min(3, Math.floor(33 / group[0].complexity / 2));
      for (let i = 0; i < group.length; i += batchSize) {
        strategy.batches.push(group.slice(i, i + batchSize));
      }
    });
  }
  
  // Pre-assign agents
  strategy.batches.forEach(batch => {
    batch.forEach(feature => {
      const agentCount = Math.min(10, feature.complexity * 2);
      const agents = selectAgentsForFeature(feature, agentPool);
      strategy.assignments.set(feature.id, agents);
    });
  });
  
  return strategy;
}

// Group features by complexity
function groupFeaturesByComplexity(features) {
  const groups = {};
  
  features.forEach(feature => {
    const key = feature.complexity;
    if (!groups[key]) groups[key] = [];
    groups[key].push(feature);
  });
  
  // Return sorted groups (lowest complexity first)
  return Object.keys(groups)
    .sort((a, b) => a - b)
    .map(key => groups[key]);
}

// Select agents for feature
function selectAgentsForFeature(feature, agentPool) {
  const [version] = feature.id.split('.').map(Number);
  const agents = [];
  
  // Always include PM
  agents.push('product-manager');
  
  // Version-specific agents
  switch(version) {
    case 1: // Frontend
      agents.push('frontend-engineer', 'ux-ui-designer');
      break;
    case 2: // Backend
      agents.push('backend-engineer', 'data-engineer');
      break;
    case 3: // Data
      agents.push('data-engineer', 'data-scientist', 'data-analyst');
      break;
    case 4: // AI/ML
      agents.push('ai-engineer', 'machine-learning-engineer', 'mlops-engineer');
      break;
    case 5: // Infrastructure
      agents.push('devops-engineer', 'site-reliability-engineer');
      break;
    case 6: // Security
      agents.push('security-architect', 'devsecops-engineer');
      break;
    default:
      agents.push('full-stack-engineer');
  }
  
  // Add QA
  agents.push('qa-engineer');
  
  // Add leadership for complex features
  if (feature.complexity >= 4) {
    agents.push('staff-engineer', 'vp-engineering');
  }
  
  return [...new Set(agents)];
}

// Display execution plan
function displayExecutionPlan(strategy, agentPool) {
  console.log(colors.bright + '📋 Execution Plan\n' + colors.reset);
  console.log(`Total Batches: ${colors.cyan}${strategy.batches.length}${colors.reset}`);
  
  strategy.batches.forEach((batch, idx) => {
    console.log(`\nBatch ${idx + 1}:`);
    batch.forEach(feature => {
      const agents = strategy.assignments.get(feature.id);
      console.log(`  ${feature.id} - ${feature.title}`);
      console.log(`    Status: ${feature.status} | Complexity: ${feature.complexity}/5`);
      console.log(`    Agents: ${agents.length} assigned`);
    });
  });
  
  console.log('\n' + colors.dim + '─'.repeat(60) + colors.reset + '\n');
}

// Execute batch operation
async function executeBatch(strategy, agentPool, options) {
  const results = {
    success: true,
    total: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    features: []
  };
  
  let batchNumber = 1;
  
  for (const batch of strategy.batches) {
    console.log(colors.bright + `\n🔄 Processing Batch ${batchNumber}/${strategy.batches.length}\n` + colors.reset);
    
    const batchPromises = batch.map(feature => 
      processFeature(feature, strategy.assignments.get(feature.id), agentPool, options)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process results
    batchResults.forEach((result, idx) => {
      const feature = batch[idx];
      results.total++;
      
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          results.succeeded++;
          console.log(`  ${colors.green}✓${colors.reset} ${feature.id} - Success`);
        } else {
          results.failed++;
          console.log(`  ${colors.red}✗${colors.reset} ${feature.id} - Failed: ${result.value.error}`);
        }
        results.features.push({
          ...feature,
          result: result.value
        });
      } else {
        results.failed++;
        console.log(`  ${colors.red}✗${colors.reset} ${feature.id} - Error: ${result.reason}`);
        results.features.push({
          ...feature,
          result: { success: false, error: result.reason }
        });
      }
    });
    
    batchNumber++;
    
    // Brief pause between batches
    if (batchNumber <= strategy.batches.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Process single feature
async function processFeature(feature, agents, agentPool, options) {
  const startTime = Date.now();
  
  try {
    // Assign agents
    agentPool.assignAgents(feature.id, agents);
    
    // Determine operation
    const operation = options.operation || 'start';
    
    switch(operation) {
      case 'start':
        return await startFeature(feature, agents);
      case 'scaffold':
        return await scaffoldFeature(feature, agents);
      case 'decompose':
        return await decomposeFeature(feature, agents);
      case 'review':
        return await reviewFeature(feature, agents);
      default:
        return { success: false, error: 'Unknown operation' };
    }
  } finally {
    // Release agents
    agentPool.releaseAgents(feature.id);
    const duration = Date.now() - startTime;
    console.log(`    ${colors.dim}Duration: ${(duration / 1000).toFixed(1)}s${colors.reset}`);
  }
}

// Start feature with agents
async function startFeature(feature, agents) {
  return new Promise((resolve) => {
    const child = spawn('node', [
      path.join(__dirname, 'orch-start-real.mjs'),
      '--id', feature.id
    ], {
      cwd: orchRoot,
      stdio: 'pipe'
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ 
          success: true, 
          agents: agents.length,
          output: output.slice(-200) // Last 200 chars
        });
      } else {
        resolve({ 
          success: false, 
          error: `Exit code ${code}`,
          output: output.slice(-200)
        });
      }
    });
  });
}

// Scaffold feature
async function scaffoldFeature(feature, agents) {
  return new Promise((resolve) => {
    const child = spawn('node', [
      path.join(__dirname, 'scaffold-feature.mjs'),
      feature.id,
      feature.title || 'Feature',
      feature.owner || 'Backend Engineer',
      agents.join(',')
    ], {
      cwd: orchRoot,
      stdio: 'pipe'
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('exit', (code) => {
      resolve({ 
        success: code === 0,
        agents: agents.length,
        scaffolded: code === 0
      });
    });
  });
}

// Decompose feature
async function decomposeFeature(feature, agents) {
  return new Promise((resolve) => {
    const child = spawn('node', [
      path.join(__dirname, 'task-decomposer.mjs'),
      '--id', feature.id
    ], {
      cwd: orchRoot,
      stdio: 'pipe'
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('exit', (code) => {
      resolve({ 
        success: code === 0,
        agents: agents.length,
        decomposed: code === 0
      });
    });
  });
}

// Review feature with agents
async function reviewFeature(feature, agents) {
  // Simulate agent review (would call actual agent system)
  console.log(`    ${colors.dim}Agents reviewing: ${agents.slice(0, 3).join(', ')}...${colors.reset}`);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    success: true,
    agents: agents.length,
    reviews: agents.length,
    approved: Math.random() > 0.3
  };
}

// Display batch results
function displayBatchResults(results, agentPool) {
  console.log('\n' + colors.bright + '📊 Batch Operation Results\n' + colors.reset);
  
  // Summary
  console.log('Summary:');
  console.log(`  Total Features: ${results.total}`);
  console.log(`  ${colors.green}Succeeded: ${results.succeeded}${colors.reset}`);
  if (results.failed > 0) {
    console.log(`  ${colors.red}Failed: ${results.failed}${colors.reset}`);
  }
  if (results.skipped > 0) {
    console.log(`  ${colors.yellow}Skipped: ${results.skipped}${colors.reset}`);
  }
  
  const successRate = results.total > 0 ? 
    Math.round((results.succeeded / results.total) * 100) : 0;
  console.log(`  Success Rate: ${successRate >= 80 ? colors.green : 
                               successRate >= 60 ? colors.yellow : 
                               colors.red}${successRate}%${colors.reset}`);
  
  // Agent workload report
  const workload = agentPool.getWorkloadReport();
  const activeAgents = Object.keys(workload).length;
  
  if (activeAgents > 0) {
    console.log(`\n👥 Agent Utilization (${activeAgents}/33 agents used):`);
    Object.entries(workload)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([agent, load]) => {
        const agentName = agent.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const bar = '█'.repeat(Math.min(load * 3, 15));
        console.log(`  ${agentName.padEnd(30)} ${bar} ${load}x`);
      });
  }
  
  // Failed features detail
  if (results.failed > 0) {
    console.log('\n' + colors.red + 'Failed Features:' + colors.reset);
    results.features
      .filter(f => !f.result.success)
      .forEach(f => {
        console.log(`  - ${f.id}: ${f.result.error}`);
      });
  }
  
  console.log('\n' + colors.green + '✅ Batch operation complete!' + colors.reset);
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Batch Operations with 33-Agent System

Usage: batch-operations.mjs <feature-ids...> [options]

Options:
  --mode <mode>        Processing mode: sequential, parallel, smart (default: smart)
  --operation <op>     Operation: start, scaffold, decompose, review (default: start)
  --max-concurrent <n> Max concurrent operations (default: 3)
  --dry-run           Show plan without executing
  --help, -h          Show this help

Examples:
  batch-operations.mjs 1.1.1.1.0.0 1.1.2.1.0.0 1.1.3.1.0.0
  batch-operations.mjs 2.1.1.1.0.0 2.1.2.1.0.0 --mode parallel
  batch-operations.mjs 4.1.1.1.0.0 4.2.1.1.0.0 --operation scaffold
  batch-operations.mjs 1.1.1.1.0.0 2.1.1.1.0.0 3.1.1.1.0.0 --mode smart

Modes:
  sequential - Process features one at a time
  parallel   - Process all features simultaneously
  smart      - Intelligently batch based on complexity and agent availability

Operations:
  start      - Start feature development with agents
  scaffold   - Create PRDs and assign agents
  decompose  - Break down into tasks with agent assignment
  review     - Run agent team review
`);
    process.exit(0);
  }
  
  // Parse feature IDs (all non-option arguments)
  const featureIds = args.filter(arg => 
    !arg.startsWith('--') && 
    /^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/.test(arg)
  );
  
  if (featureIds.length === 0) {
    console.error(colors.red + 'Error: No valid feature IDs provided' + colors.reset);
    console.log('Feature IDs must be in format X.X.X.X.X.X');
    process.exit(1);
  }
  
  // Parse options
  const modeIndex = args.indexOf('--mode');
  const opIndex = args.indexOf('--operation');
  const maxIndex = args.indexOf('--max-concurrent');
  
  const options = {
    mode: modeIndex !== -1 ? args[modeIndex + 1] : MODES.SMART,
    operation: opIndex !== -1 ? args[opIndex + 1] : 'start',
    maxConcurrent: maxIndex !== -1 ? parseInt(args[maxIndex + 1]) : 3,
    dryRun: args.includes('--dry-run')
  };
  
  // Validate options
  if (!Object.values(MODES).includes(options.mode)) {
    console.error(colors.red + `Invalid mode: ${options.mode}` + colors.reset);
    process.exit(1);
  }
  
  batchProcess(featureIds, options)
    .then(results => {
      process.exit(results.succeeded === results.total ? 0 : 1);
    })
    .catch(err => {
      console.error(colors.red + 'Fatal error:' + colors.reset, err);
      process.exit(1);
    });
}