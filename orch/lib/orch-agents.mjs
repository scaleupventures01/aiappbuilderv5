#!/usr/bin/env node

/**
 * ORCH Agents CLI - Manage and interact with team agents
 */

import { agentManager } from './orch/agent-system.mjs';
import { communicationHub, knowledgeBase } from './orch/agent-communication.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = {
    command: '',
    agent: '',
    task: '',
    message: '',
    role: '',
    featureId: '',
    verbose: false,
    help: false
  };
  
  if (argv.length > 2) {
    args.command = argv[2];
  }
  
  for (let i = 3; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { args.help = true; continue; }
    if (a === '--verbose' || a === '-v') { args.verbose = true; continue; }
    if (a === '--agent' && i + 1 < argv.length) { args.agent = argv[++i]; continue; }
    if (a === '--task' && i + 1 < argv.length) { args.task = argv[++i]; continue; }
    if (a === '--message' && i + 1 < argv.length) { args.message = argv[++i]; continue; }
    if (a === '--role' && i + 1 < argv.length) { args.role = argv[++i]; continue; }
    if (a === '--feature' && i + 1 < argv.length) { args.featureId = argv[++i]; continue; }
  }
  
  return args;
}

function showHelp() {
  console.log(`
ORCH Agents - Team Agent Management System

Commands:
  list                    List all available agents and their status
  status [--agent NAME]   Show detailed status of agent(s)
  assign                  Assign a task to an agent
    --agent NAME         Agent to assign task to
    --task "DESCRIPTION" Task description
  
  message                 Send message between agents
    --agent NAME         Target agent
    --message "TEXT"     Message content
  
  workflow                Create and execute a workflow
    --feature ID         Feature ID to implement
    --role NAME          Specific role to involve
  
  history                 Show agent communication history
    --agent NAME         Filter by specific agent
  
  start                   Start the agent system
  stop                    Stop all agents

Options:
  --verbose, -v          Show detailed output
  --help, -h             Show this help message

Examples:
  # List all agents
  npm run orch:agents list
  
  # Check status of frontend engineer
  npm run orch:agents status --agent frontend-engineer
  
  # Assign task to QA engineer
  npm run orch:agents assign --agent qa-engineer --task "Test login feature"
  
  # Start workflow for feature
  npm run orch:agents workflow --feature 1.1.1.1.0.0
`);
}

async function listAgents() {
  console.log('\n🤖 Loading team agents...\n');
  
  const agents = await agentManager.loadTeamAgents();
  
  console.log('Available Agents:');
  console.log('─'.repeat(80));
  
  for (const agent of agents) {
    const status = agent.status === 'idle' ? '🟢 Idle' : '🔴 Working';
    console.log(`  ${status}  ${agent.name}`);
    console.log(`         Role: ${agent.role}`);
    console.log(`         Expertise: ${agent.expertise.slice(0, 3).join(', ')}`);
    console.log('');
  }
  
  console.log(`Total: ${agents.length} agents loaded`);
}

async function showStatus(agentName) {
  await agentManager.loadTeamAgents();
  
  if (agentName) {
    const agent = agentManager.getAgent(agentName);
    if (!agent) {
      console.error(`Agent '${agentName}' not found`);
      process.exit(1);
    }
    
    const status = agent.getStatusReport();
    console.log('\nAgent Status Report:');
    console.log('─'.repeat(80));
    console.log(`Agent: ${status.agent}`);
    console.log(`Role: ${status.role}`);
    console.log(`Status: ${status.status}`);
    console.log(`Tasks Completed: ${status.tasksCompleted}`);
    console.log(`Tasks Failed: ${status.tasksFailed}`);
    if (status.currentTask) {
      console.log(`Current Task: ${status.currentTask.description}`);
    }
    console.log(`Last Activity: ${status.lastActivity}`);
  } else {
    const status = agentManager.getSystemStatus();
    console.log('\nSystem Status:');
    console.log('─'.repeat(80));
    console.log(`Total Agents: ${status.totalAgents}`);
    console.log(`Active: ${status.activeAgents}`);
    console.log(`Idle: ${status.idleAgents}`);
    console.log(`Queued Tasks: ${status.queuedTasks}`);
    console.log(`Active Workflows: ${status.activeWorkflows}`);
  }
}

async function assignTask(agentName, taskDescription) {
  if (!agentName || !taskDescription) {
    console.error('Both --agent and --task are required');
    process.exit(1);
  }
  
  await agentManager.loadTeamAgents();
  
  const agent = agentManager.getAgent(agentName);
  if (!agent) {
    console.error(`Agent '${agentName}' not found`);
    process.exit(1);
  }
  
  console.log(`\n📋 Assigning task to ${agentName}...`);
  
  const result = await agent.assignTask({
    description: taskDescription,
    requirements: { role: agentName }
  });
  
  console.log('\nTask Result:');
  console.log('─'.repeat(80));
  console.log(`Status: ${result.status}`);
  console.log(`Output: ${result.output}`);
  if (result.artifacts.length > 0) {
    console.log(`Artifacts: ${result.artifacts.map(a => a.name).join(', ')}`);
  }
}

async function sendMessage(targetAgent, message) {
  if (!targetAgent || !message) {
    console.error('Both --agent and --message are required');
    process.exit(1);
  }
  
  await agentManager.loadTeamAgents();
  
  const agent = agentManager.getAgent(targetAgent);
  if (!agent) {
    console.error(`Agent '${targetAgent}' not found`);
    process.exit(1);
  }
  
  console.log(`\n💬 Sending message to ${targetAgent}...`);
  
  const result = communicationHub.sendDirectMessage(
    'cli-user',
    targetAgent,
    message
  );
  
  console.log('\nMessage sent:');
  console.log(`ID: ${result.id}`);
  console.log(`Timestamp: ${result.timestamp}`);
}

async function runWorkflow(featureId, role) {
  await agentManager.loadTeamAgents();
  
  console.log(`\n🔄 Starting workflow for feature ${featureId || 'unspecified'}...`);
  
  const requirements = [];
  if (featureId) {
    if (featureId.startsWith('1.')) requirements.push('ui');
    if (featureId.startsWith('2.')) requirements.push('backend');
    requirements.push('testing');
  }
  
  const workflow = await agentManager.coordinateFeature(
    featureId || 'general',
    requirements
  );
  
  console.log('\nWorkflow Result:');
  console.log('─'.repeat(80));
  console.log(`ID: ${workflow.id}`);
  console.log(`Status: ${workflow.status}`);
  console.log(`Steps Completed: ${workflow.results.length}`);
  
  if (workflow.results.length > 0) {
    console.log('\nStep Results:');
    for (const result of workflow.results) {
      console.log(`  - ${result.agent}: ${result.output}`);
    }
  }
}

async function showHistory(agentName) {
  await agentManager.loadTeamAgents();
  
  console.log('\n📜 Communication History:');
  console.log('─'.repeat(80));
  
  if (agentName) {
    const messages = communicationHub.getAgentMessages(agentName, 20);
    console.log(`Messages for ${agentName}:`);
    
    for (const msg of messages) {
      console.log(`\n[${msg.timestamp}]`);
      console.log(`From: ${msg.from} To: ${msg.to || 'broadcast'}`);
      console.log(`Message: ${msg.content}`);
    }
  } else {
    console.log('Recent system messages:');
    const messages = communicationHub.messageHistory.slice(-10);
    
    for (const msg of messages) {
      console.log(`\n[${msg.timestamp}] ${msg.type}`);
      console.log(`${msg.from} → ${msg.to || 'all'}: ${msg.content}`);
    }
  }
}

async function startAgents() {
  console.log('\n🚀 Starting agent system...');
  
  const agents = await agentManager.loadTeamAgents();
  
  console.log(`\n✅ ${agents.length} agents loaded and ready`);
  console.log('\nAgents are now listening for tasks and messages.');
  console.log('Use "npm run orch:agents assign" to assign tasks.');
}

async function stopAgents() {
  console.log('\n🛑 Stopping all agents...');
  
  const status = agentManager.getSystemStatus();
  
  if (status.activeAgents > 0) {
    console.log(`Warning: ${status.activeAgents} agents are still working`);
  }
  
  console.log('Agent system stopped.');
}

// Main execution
async function main() {
  const args = parseArgs(process.argv);
  
  if (args.help || !args.command) {
    showHelp();
    process.exit(0);
  }
  
  try {
    switch (args.command) {
      case 'list':
        await listAgents();
        break;
        
      case 'status':
        await showStatus(args.agent);
        break;
        
      case 'assign':
        await assignTask(args.agent, args.task);
        break;
        
      case 'message':
        await sendMessage(args.agent, args.message);
        break;
        
      case 'workflow':
        await runWorkflow(args.featureId, args.role);
        break;
        
      case 'history':
        await showHistory(args.agent);
        break;
        
      case 'start':
        await startAgents();
        break;
        
      case 'stop':
        await stopAgents();
        break;
        
      default:
        console.error(`Unknown command: ${args.command}`);
        console.log('Use --help to see available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);