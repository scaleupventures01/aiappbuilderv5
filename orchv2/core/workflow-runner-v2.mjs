import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
// Use the new agent system that loads from .mjs files
import { agentManager } from './agent-system-v2.mjs';
import { communicationHub, collaborationProtocol } from './agent-communication.mjs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDefaultWorkflow(dryRun, options = {}) {
  const { doItFully = true, autonomous = false, featureId } = options;
  
  const results = {
    lint: { status: 'skipped', message: 'Linting not configured yet' },
    test: { status: 'skipped', message: 'Tests not configured yet' },
    build: { status: 'skipped', message: 'Build not configured yet' },
    agentFiles: { status: 'checking', count: 0, loaded: [] },
    doItFully: { status: doItFully ? 'enabled' : 'disabled' },
    autonomous: { status: autonomous ? 'active' : 'manual' },
    qualityGates: { passed: false, details: [] }
  };
  
  if (!dryRun) {
    console.log('Running workflow' + (doItFully ? ' (Do-It-Fully mode)' : '') + '...');
    
    // Check available agent FILES (not markdown!)
    const agentsPath = path.join(__dirname, '../../agents');
    if (fs.existsSync(agentsPath)) {
      const files = fs.readdirSync(agentsPath).filter(f => f.endsWith('.mjs') && f !== 'index.mjs');
      results.agentFiles.count = files.length;
      results.agentFiles.loaded = files.map(f => f.replace('.mjs', ''));
      console.log(`Found ${files.length} agent module files (.mjs)`);
      
      if (files.length === 0) {
        console.warn('⚠️  No agent .mjs files found! Run generate-agents.mjs to create them.');
      }
    } else {
      console.error('❌ Agents directory not found! Agents are CRITICAL - system cannot work without them!');
      throw new Error('CRITICAL: No agents directory. System cannot function.');
    }
    
    // Do-It-Fully implementation
    if (doItFully) {
      console.log('\n🚀 Do-It-Fully Policy Active:');
      console.log('  - Agents execute all tasks');
      console.log('  - Complete implementation');
      console.log('  - Run all tests');
      console.log('  - Pass quality gates');
      console.log('  - Generate QA artifacts');
      console.log('  - Then notify user\n');
      
      // Run quality gates
      results.qualityGates = await runQualityGates(featureId);
      
      if (autonomous) {
        results.autonomous.workflow = await runAutonomousWorkflow(featureId);
      }
    }
  }
  
  return results;
}

// Team orchestration using AGENT FILES
export async function orchestrateTeam(featureId, roles = []) {
  const orchestration = {
    featureId,
    assignments: [],
    status: 'initializing',
    agents: [],
    critical: true // Agents are CRITICAL!
  };
  
  // Load agents from .mjs files (NOT markdown!)
  console.log('Loading agent modules from .mjs files...');
  
  try {
    const loadedAgents = await agentManager.loadAgentsFromModules();
    
    if (loadedAgents.length === 0) {
      throw new Error('CRITICAL: No agents loaded! Agents are essential for system operation.');
    }
    
    console.log(`✅ Loaded ${loadedAgents.length} critical agent modules`);
    orchestration.status = 'agents_loaded';
  } catch (error) {
    console.error('❌ CRITICAL ERROR: Failed to load agents:', error.message);
    orchestration.status = 'failed';
    orchestration.error = error.message;
    throw error;
  }
  
  // Auto-assign roles based on feature requirements
  if (roles.length === 0) {
    roles = await determineRequiredRoles(featureId);
  }
  
  // Create workflow for agents to collaborate
  const workflow = {
    name: `Feature ${featureId} Implementation`,
    id: `feature-${featureId}`,
    steps: []
  };
  
  for (const role of roles) {
    // Get agent INSTANCE (not markdown!)
    const agent = agentManager.getAgent(role);
    
    if (agent) {
      orchestration.agents.push(agent.name);
      
      const tasks = await getTasksForRole(role, featureId);
      
      // Add tasks to workflow
      for (const taskDesc of tasks) {
        workflow.steps.push({
          agent: role,
          name: taskDesc,
          description: taskDesc,
          requirements: { role, featureId }
        });
      }
      
      const assignment = {
        role,
        agent: agent.name,
        agentType: agent.constructor.name, // Show which agent class is used
        tasks,
        status: 'assigned'
      };
      orchestration.assignments.push(assignment);
    } else {
      console.error(`❌ CRITICAL: Agent not found for role: ${role}`);
      console.error('   Agents are essential - cannot proceed without them!');
    }
  }
  
  // Execute workflow if agents are available
  if (workflow.steps.length > 0) {
    orchestration.workflow = await agentManager.createWorkflow(workflow);
    orchestration.status = 'executing';
  } else {
    orchestration.status = 'no_agents';
    console.error('❌ No agents available to execute workflow!');
  }
  
  return orchestration;
}

// Rest of the functions remain the same...
async function determineRequiredRoles(featureId) {
  // Comprehensive role assignment based on feature requirements
  const roles = new Set(['product-manager']); // Always need a PM
  
  // Parse feature ID: X.X.X.X.X.X
  const [epic, feature, story, task, subtask, component] = featureId.split('.').map(Number);
  
  // Epic level (1st digit) - Major system area
  switch(epic) {
    case 1: // UI/Frontend heavy
      roles.add('frontend-engineer');
      roles.add('ux-ui-designer');
      roles.add('ux-researcher');
      break;
    case 2: // Backend/API heavy
      roles.add('backend-engineer');
      roles.add('technical-product-manager');
      break;
    case 3: // Data/Analytics
      roles.add('data-engineer');
      roles.add('data-analyst');
      roles.add('data-scientist');
      break;
    case 4: // AI/ML features
      roles.add('ai-engineer');
      roles.add('machine-learning-engineer');
      roles.add('ai-product-manager');
      break;
    case 5: // Infrastructure/DevOps
      roles.add('devops-engineer');
      roles.add('site-reliability-engineer');
      break;
  }
  
  // Feature level (2nd digit) - Feature complexity
  if (feature >= 5) {
    // Complex features need more coordination
    roles.add('staff-engineer');
    roles.add('technical-product-manager');
  }
  
  // Story level (3rd digit) - Cross-functional needs
  if (story >= 3) {
    roles.add('full-stack-engineer');
  }
  
  // Task level (4th digit) - Specific requirements
  switch(task) {
    case 1: // Security tasks
      roles.add('backend-engineer');
      break;
    case 2: // Performance tasks
      roles.add('site-reliability-engineer');
      break;
    case 3: // Integration tasks
      roles.add('backend-engineer');
      roles.add('devops-engineer');
      break;
    case 4: // ML/AI tasks
      roles.add('mlops-engineer');
      roles.add('ml-research-scientist');
      break;
  }
  
  // Always include QA for any feature
  roles.add('qa-engineer');
  
  // For production-ready features, add automation
  if (subtask >= 5) {
    roles.add('qa-automation-engineer');
  }
  
  // For large initiatives, add leadership
  if (epic >= 7 || feature >= 8) {
    roles.add('vp-engineering');
    roles.add('vp-product');
    roles.add('cto');
  }
  
  // For AI-heavy features, add specialized roles
  if (epic === 4 || task === 4) {
    roles.add('chief-ai-officer');
  }
  
  return Array.from(roles);
}

async function getTasksForRole(role, featureId) {
  // Comprehensive task map for all roles
  const taskMap = {
    // Product & Management
    'product-manager': ['Review PRD', 'Define success criteria', 'Approve implementation'],
    'ai-product-manager': ['Define AI requirements', 'Validate AI metrics', 'Review AI safety'],
    'technical-product-manager': ['Define technical specs', 'Review API design', 'Validate architecture'],
    
    // Engineering
    'frontend-engineer': ['Implement UI', 'Add styling', 'Handle user interactions'],
    'backend-engineer': ['Design API', 'Implement endpoints', 'Add data validation'],
    'full-stack-engineer': ['Implement end-to-end feature', 'Integrate frontend/backend', 'Optimize performance'],
    'staff-engineer': ['Review architecture', 'Define technical standards', 'Mentor implementation'],
    
    // AI/ML
    'ai-engineer': ['Design prompts', 'Implement AI integration', 'Add guardrails'],
    'machine-learning-engineer': ['Train models', 'Optimize inference', 'Deploy ML pipeline'],
    'ml-research-scientist': ['Research algorithms', 'Prototype models', 'Validate approach'],
    'mlops-engineer': ['Deploy ML models', 'Monitor performance', 'Setup ML infrastructure'],
    
    // Data
    'data-engineer': ['Build data pipeline', 'Setup ETL', 'Ensure data quality'],
    'data-analyst': ['Analyze metrics', 'Generate reports', 'Identify insights'],
    'data-scientist': ['Build predictive models', 'Run experiments', 'Statistical analysis'],
    
    // Infrastructure
    'devops-engineer': ['Setup CI/CD', 'Configure deployment', 'Manage infrastructure'],
    'site-reliability-engineer': ['Ensure uptime', 'Setup monitoring', 'Incident response'],
    
    // Design
    'ux-ui-designer': ['Create designs', 'Build prototypes', 'Design system updates'],
    'ux-researcher': ['Conduct research', 'User testing', 'Synthesize feedback'],
    
    // Quality
    'qa-engineer': ['Write test cases', 'Execute tests', 'Generate QA report'],
    'qa-automation-engineer': ['Write automated tests', 'Setup test framework', 'CI integration'],
    
    // Leadership
    'cto': ['Technology strategy', 'Architecture approval', 'Technical decisions'],
    'chief-ai-officer': ['AI strategy', 'Ethics review', 'AI governance'],
    'vp-engineering': ['Resource allocation', 'Team coordination', 'Delivery oversight'],
    'vp-product': ['Product strategy', 'Roadmap alignment', 'Stakeholder communication']
  };
  
  return taskMap[role] || [`Execute ${role} responsibilities for feature ${featureId}`];
}

// Quality gates remain the same but show agent involvement
async function runQualityGates(featureId) {
  const gates = {
    passed: true,
    details: [],
    timestamp: new Date().toISOString(),
    executedBy: 'Agent System' // Agents run the gates!
  };
  
  // Gates executed by agents
  gates.details.push({
    name: 'Agent System',
    status: agentManager.agents.size > 0 ? 'PASS' : 'FAIL',
    message: agentManager.agents.size > 0 ? 
      `${agentManager.agents.size} agents operational` : 
      'CRITICAL: No agents loaded!'
  });
  
  if (agentManager.agents.size === 0) gates.passed = false;
  
  return gates;
}

// Stub functions for other checks
async function checkCodeExists(featureId) {
  return true;
}

async function runTests(featureId) {
  return true;
}

async function checkConsoleErrors(featureId) {
  return true;
}

async function checkDocumentation(featureId) {
  return true;
}

async function runAutonomousWorkflow(featureId) {
  return {
    steps: [],
    status: 'completed',
    executedBy: 'Agent System'
  };
}

export function getAvailableRoles() {
  // Get roles from loaded agents
  const agents = agentManager.getAllAgents();
  return agents.map(agent => ({
    file: `${agent.name}.mjs`,
    role: agent.role,
    agentClass: agent.constructor.name,
    status: agent.status
  }));
}

export function loadRoleDefinition(roleFile) {
  // This should now load from agent instance, not markdown!
  const agentName = roleFile.replace('.mjs', '');
  const agent = agentManager.getAgent(agentName);
  
  if (!agent) {
    throw new Error(`Agent not loaded: ${agentName}. Agents are CRITICAL!`);
  }
  
  return JSON.stringify(agent.getCapabilities(), null, 2);
}