#!/usr/bin/env node
/**
 * REAL ORCH START - Uses actual AI agents via Task tool
 * NO SIMULATIONS - This spawns REAL AI agents for each role
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRealWorkflow, invokeRealAgentViaTask } from './orch/workflow-runner-real.mjs';
import { realAgentManager } from './orch/agent-system-real.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main entry point - starts REAL agents
 */
async function orchStartReal() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   🚀 ORCH REAL AGENT SYSTEM                  ║
║                                                              ║
║         Spawning ACTUAL AI agents - NOT simulations         ║
║     Each agent is a real AI with genuine intelligence       ║
╚══════════════════════════════════════════════════════════════╝
`);

  // Parse command line arguments
  const args = process.argv.slice(2);
  const flags = parseArguments(args);
  
  if (!flags.id) {
    console.error('❌ Error: Feature ID required');
    console.error('Usage: orch-start-real --id X.X.X.X.X.X');
    console.error('Example: orch-start-real --id 1.1.1.1.0.0');
    process.exit(1);
  }
  
  // Validate feature ID format
  if (!validateFeatureId(flags.id)) {
    console.error('❌ Invalid feature ID format');
    console.error('Expected: X.X.X.X.X.X (e.g., 1.1.1.1.0.0)');
    process.exit(1);
  }
  
  // Check for manual override (NOT RECOMMENDED)
  if (flags.manual || flags.noAgents) {
    console.warn('\n⚠️  WARNING: You are disabling REAL AGENTS!');
    console.warn('   This system is designed to use actual AI agents.');
    console.warn('   Proceeding without agents defeats the entire purpose.\n');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('Are you SURE you want to proceed without real agents? (y/N): ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() !== 'y') {
      console.log('✅ Good choice! Proceeding with REAL agents...');
      flags.manual = false;
      flags.noAgents = false;
    }
  }
  
  // Load agent definitions
  console.log('\n📚 Loading agent role definitions...');
  await realAgentManager.loadAgentDefinitions();
  
  // Display what agents will be used
  const requiredAgents = realAgentManager.determineRequiredAgents(flags.id, {});
  console.log('\n🎭 REAL AI agents that will be spawned:');
  requiredAgents.forEach(agent => {
    console.log(`  • ${agent} - Real AI with ${agent.replace(/-/g, ' ')} expertise`);
  });
  
  // Confirm before spawning real agents
  if (!flags.yes && !flags.force) {
    console.log('\n' + '━'.repeat(60));
    console.log('⚡ READY TO SPAWN REAL AI AGENTS');
    console.log('━'.repeat(60));
    console.log(`Feature: ${flags.id}`);
    console.log(`Agents: ${requiredAgents.length} real AI instances`);
    console.log(`Mode: ${flags.autonomous !== false ? 'Autonomous' : 'Manual'}`);
    console.log('━'.repeat(60));
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('\nProceed with spawning REAL agents? (Y/n): ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() === 'n') {
      console.log('❌ Aborted');
      process.exit(0);
    }
  }
  
  // RUN WITH REAL AGENTS
  console.log('\n🚀 SPAWNING REAL AI AGENTS...\n');
  
  try {
    const results = await runRealWorkflow(flags.id, {
      doItFully: flags.doItFully !== false,
      autonomous: flags.autonomous !== false,
      useRealAgents: !flags.noAgents  // This should always be true
    });
    
    // Display results
    console.log('\n' + '═'.repeat(60));
    console.log('📊 REAL AGENT WORKFLOW RESULTS');
    console.log('═'.repeat(60));
    
    if (results.workflow && results.workflow.results) {
      results.workflow.results.forEach(r => {
        const status = r.status === 'completed' ? '✅' : '❌';
        console.log(`${status} ${r.agent}: ${r.status}`);
        if (r.result) {
          console.log(`   Output: ${JSON.stringify(r.result).substring(0, 100)}...`);
        }
      });
    }
    
    console.log('\n✨ Real agent orchestration complete!');
    
  } catch (error) {
    console.error('\n❌ Error spawning real agents:', error.message);
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseArguments(args) {
  const flags = {
    id: null,
    autonomous: true,  // Default to autonomous
    doItFully: true,   // Default to complete implementation
    manual: false,
    noAgents: false,
    yes: false,
    force: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch(arg) {
      case '--id':
      case '-i':
        flags.id = args[++i];
        break;
      case '--manual':
      case '--no-autonomous':
        flags.autonomous = false;
        flags.manual = true;
        break;
      case '--no-agents':  // NEVER USE THIS
        flags.noAgents = true;
        break;
      case '--yes':
      case '-y':
        flags.yes = true;
        break;
      case '--force':
        flags.force = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
      default:
        if (arg.match(/^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/)) {
          flags.id = arg;
        }
    }
  }
  
  return flags;
}

/**
 * Validate feature ID format
 */
function validateFeatureId(id) {
  const pattern = /^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/;
  return pattern.test(id);
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
ORCH REAL AGENT SYSTEM - Help
==============================

This system spawns REAL AI agents for each team role.
Each agent is an actual AI with genuine intelligence and expertise.

USAGE:
  orch-start-real --id <feature-id> [options]

REQUIRED:
  --id, -i <id>     Feature ID (format: X.X.X.X.X.X)

OPTIONS:
  --yes, -y         Skip confirmation prompts
  --force           Force execution without checks
  --help, -h        Show this help message

NOT RECOMMENDED:
  --manual          Disable autonomous agents (NOT RECOMMENDED)
  --no-agents       Don't use real agents (DEFEATS THE PURPOSE!)

EXAMPLES:
  # Spawn real agents for a UI feature
  orch-start-real --id 1.1.1.1.0.0

  # Auto-confirm agent spawning
  orch-start-real --id 2.1.1.1.0.0 --yes

FEATURE ID FORMAT:
  X.X.X.X.X.X where:
  - 1st digit: Version (1, 2, 3...)
  - 2nd digit: Epic/Major feature
  - 3rd digit: Feature
  - 4th digit: Story
  - 5th digit: Task
  - 6th digit: Subtask

AGENT ASSIGNMENT BY FEATURE TYPE:
  1.x.x.x.x.x - UI features → Frontend, UX Designer, UX Researcher
  2.x.x.x.x.x - Backend → Backend Engineer, Technical PM
  3.x.x.x.x.x - Data → Data Engineer, Data Analyst, Data Scientist
  4.x.x.x.x.x - AI/ML → AI Engineer, ML Engineer, Chief AI Officer
  5.x.x.x.x.x - Infrastructure → DevOps, SRE

Remember: This system uses REAL AI agents, not simulations!
`);
}

/**
 * CRITICAL: Bridge function for Claude to spawn real agents
 * This is what makes the agents REAL instead of simulated
 */
export async function spawnRealAgentWithTask(role, task) {
  console.log(`
┌─────────────────────────────────────────────┐
│  🎭 SPAWNING REAL AI AGENT                 │
│  Role: ${role.padEnd(36)}│
│  THIS IS A REAL AI, NOT A SIMULATION       │
└─────────────────────────────────────────────┘
`);
  
  // CLAUDE: THIS IS WHERE YOU USE THE TASK TOOL
  // Use the Task tool to create a real subagent with the specified role
  return await invokeRealAgentViaTask(role, task, {
    realAgent: true,
    timestamp: new Date().toISOString()
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  orchStartReal().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default orchStartReal;