#!/usr/bin/env node
/**
 * Interactive Setup Wizard
 * User-friendly interface for feature creation and agent management
 * Works with all 33 agents in the system
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const appRoot = path.resolve(__dirname, '../../app');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to get user input
function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

// Helper to display options
function displayOptions(options, title) {
  console.log(`\n${title}:`);
  options.forEach((opt, idx) => {
    console.log(`  ${idx + 1}. ${opt}`);
  });
}

// Get all available agents
function getAllAgents() {
  const agentsDir = path.join(orchRoot, 'agents');
  const agents = [];
  
  if (fs.existsSync(agentsDir)) {
    const files = fs.readdirSync(agentsDir);
    files.forEach(file => {
      if (file.endsWith('.mjs') && file !== 'index.mjs') {
        const agentName = file.replace('.mjs', '');
        agents.push({
          id: agentName,
          name: agentName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        });
      }
    });
  }
  
  return agents;
}

// Get feature recommendations based on ID
function getRecommendedAgents(featureType) {
  const recommendations = {
    '1': ['frontend-engineer', 'ux-ui-designer', 'ux-researcher', 'qa-engineer'],
    '2': ['backend-engineer', 'technical-product-manager', 'qa-engineer'],
    '3': ['data-engineer', 'data-analyst', 'data-scientist', 'qa-engineer'],
    '4': ['ai-engineer', 'machine-learning-engineer', 'chief-ai-officer', 'mlops-engineer', 'qa-engineer'],
    '5': ['devops-engineer', 'site-reliability-engineer', 'qa-engineer'],
    '6': ['ciso', 'security-architect', 'application-security-engineer', 'qa-engineer'],
    '7': ['privacy-engineer', 'security-architect', 'qa-engineer'],
    '8': ['business-analyst', 'project-manager', 'qa-engineer'],
    '9': ['full-stack-engineer', 'staff-engineer', 'qa-engineer']
  };
  
  return recommendations[featureType] || ['full-stack-engineer', 'qa-engineer'];
}

// Main wizard function
export async function interactiveSetup() {
  console.log('\n🚀 ORCH Interactive Setup Wizard');
  console.log('================================');
  console.log('Working with 33 specialized agents\n');
  
  const mainOptions = [
    'Create new feature with agent assignment',
    'Start existing feature with agents',
    'View all 33 agents and their roles',
    'Check system status and agent health',
    'Assign agents to existing feature',
    'Run agent team review',
    'Generate reports',
    'Exit'
  ];
  
  displayOptions(mainOptions, 'What would you like to do?');
  const choice = await question('\nSelect an option (1-8): ');
  
  switch(choice) {
    case '1':
      await createNewFeature();
      break;
    case '2':
      await startExistingFeature();
      break;
    case '3':
      await viewAllAgents();
      break;
    case '4':
      await checkSystemStatus();
      break;
    case '5':
      await assignAgentsToFeature();
      break;
    case '6':
      await runTeamReview();
      break;
    case '7':
      await generateReports();
      break;
    case '8':
      console.log('\n👋 Goodbye!');
      rl.close();
      process.exit(0);
    default:
      console.log('\n❌ Invalid option. Please try again.');
      await interactiveSetup();
  }
  
  // Ask if user wants to continue
  const continueChoice = await question('\n\nWould you like to perform another action? (y/n): ');
  if (continueChoice.toLowerCase() === 'y') {
    await interactiveSetup();
  } else {
    console.log('\n👋 Goodbye!');
    rl.close();
  }
}

// Create new feature
async function createNewFeature() {
  console.log('\n📝 Create New Feature\n');
  
  // Get feature type
  const featureTypes = [
    'UI/Frontend Feature',
    'Backend/API Feature',
    'Data Processing Feature',
    'AI/ML Feature',
    'Infrastructure Feature',
    'Security Feature',
    'Privacy Feature',
    'Enterprise/Business Feature',
    'General/Mixed Feature'
  ];
  
  displayOptions(featureTypes, 'Select feature type');
  const typeChoice = await question('\nSelect type (1-9): ');
  
  // Generate ID based on type
  const version = typeChoice;
  const major = await question('Enter major version number (0-9): ');
  const minor = await question('Enter minor version number (0-9): ');
  const feature = await question('Enter feature number (0-9): ');
  const featureId = `${version}.${major}.${minor}.${feature}.0.0`;
  
  // Get feature details
  const title = await question('Enter feature title: ');
  const description = await question('Enter brief description: ');
  
  // Show recommended agents
  const recommended = getRecommendedAgents(version);
  const allAgents = getAllAgents();
  
  console.log('\n🤖 Recommended Agents for this feature type:');
  recommended.forEach(agentId => {
    const agent = allAgents.find(a => a.id === agentId);
    if (agent) {
      console.log(`  ✓ ${agent.name}`);
    }
  });
  
  // Ask about additional agents
  const addMore = await question('\nWould you like to add more agents? (y/n): ');
  let selectedAgents = [...recommended];
  
  if (addMore.toLowerCase() === 'y') {
    console.log('\n📋 Available Agents (33 total):');
    
    // Group agents by category
    const categories = {
      'Leadership': ['cto', 'chief-ai-officer', 'vp-engineering', 'vp-product', 'ciso'],
      'Product': ['product-manager', 'ai-product-manager', 'technical-product-manager', 'business-analyst'],
      'Engineering': ['frontend-engineer', 'backend-engineer', 'full-stack-engineer', 'staff-engineer'],
      'AI/ML': ['ai-engineer', 'machine-learning-engineer', 'data-scientist', 'ml-research-scientist', 'mlops-engineer'],
      'Security': ['security-architect', 'application-security-engineer', 'ai-safety-engineer', 'devsecops-engineer', 'privacy-engineer'],
      'Data': ['data-engineer', 'data-analyst'],
      'Infrastructure': ['devops-engineer', 'site-reliability-engineer'],
      'Quality': ['qa-engineer', 'qa-automation-engineer'],
      'Design': ['ux-ui-designer', 'ux-researcher'],
      'Management': ['project-manager', 'implementation-owner']
    };
    
    for (const [category, agents] of Object.entries(categories)) {
      console.log(`\n  ${category}:`);
      agents.forEach(agentId => {
        const agent = allAgents.find(a => a.id === agentId);
        if (agent) {
          const selected = selectedAgents.includes(agentId) ? '✓' : ' ';
          console.log(`    [${selected}] ${agent.name}`);
        }
      });
    }
    
    const additionalAgents = await question('\nEnter additional agent IDs (comma-separated, or press enter to skip): ');
    if (additionalAgents) {
      selectedAgents.push(...additionalAgents.split(',').map(a => a.trim()));
    }
  }
  
  // Determine primary owner
  const ownerChoice = await question('\nWho should be the primary owner? (press enter for auto-select): ');
  const owner = ownerChoice || (selectedAgents.includes('backend-engineer') ? 'Backend Engineer' : 
                                selectedAgents.includes('frontend-engineer') ? 'Frontend Engineer' :
                                'Full-Stack Engineer');
  
  console.log('\n📊 Feature Summary:');
  console.log(`  ID: ${featureId}`);
  console.log(`  Title: ${title}`);
  console.log(`  Description: ${description}`);
  console.log(`  Owner: ${owner}`);
  console.log(`  Agents: ${selectedAgents.length} assigned`);
  
  const confirm = await question('\nCreate this feature? (y/n): ');
  
  if (confirm.toLowerCase() === 'y') {
    // Call scaffold-feature.mjs
    console.log('\n🔨 Creating feature...');
    
    const child = spawn('node', [
      path.join(__dirname, 'scaffold-feature.mjs'),
      featureId,
      title,
      owner,
      selectedAgents.join(',')
    ], {
      stdio: 'inherit',
      cwd: orchRoot
    });
    
    await new Promise(resolve => child.on('exit', resolve));
    
    console.log('\n✅ Feature created successfully!');
    
    const startNow = await question('\nWould you like to start development now? (y/n): ');
    if (startNow.toLowerCase() === 'y') {
      const startChild = spawn('node', [
        path.join(__dirname, 'orch-start-real.mjs'),
        '--id', featureId
      ], {
        stdio: 'inherit',
        cwd: orchRoot
      });
      
      await new Promise(resolve => startChild.on('exit', resolve));
    }
  } else {
    console.log('\n❌ Feature creation cancelled.');
  }
}

// Start existing feature
async function startExistingFeature() {
  console.log('\n🚀 Start Existing Feature\n');
  
  // Read roadmap to get available features
  const roadmapPath = path.join(appRoot, 'Plans/product-roadmap.md');
  if (!fs.existsSync(roadmapPath)) {
    console.log('❌ No roadmap found. Please create a feature first.');
    return;
  }
  
  const roadmap = fs.readFileSync(roadmapPath, 'utf8');
  const lines = roadmap.split('\n');
  const features = [];
  
  lines.forEach(line => {
    const match = line.match(/\|\s*(V\d+[^|]*)\s*\|\s*(\d+\.\d+\.\d+\.\d+\.\d+\.\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)/);
    if (match) {
      features.push({
        phase: match[1].trim(),
        id: match[2].trim(),
        title: match[3].trim(),
        status: match[4].trim()
      });
    }
  });
  
  if (features.length === 0) {
    console.log('❌ No features found in roadmap.');
    return;
  }
  
  console.log('Available features:');
  features.forEach((f, idx) => {
    const statusEmoji = f.status === 'Complete' ? '✅' : 
                       f.status === 'In Progress' ? '🚧' :
                       f.status === 'Ready' ? '🎯' : '📝';
    console.log(`  ${idx + 1}. ${statusEmoji} ${f.id} - ${f.title} (${f.status})`);
  });
  
  const selection = await question('\nSelect feature to start (number): ');
  const selectedFeature = features[parseInt(selection) - 1];
  
  if (!selectedFeature) {
    console.log('❌ Invalid selection.');
    return;
  }
  
  const withAgents = await question('Start with agents? (y/n, default: y): ');
  const useAgents = withAgents.toLowerCase() !== 'n';
  
  console.log(`\n🔨 Starting feature: ${selectedFeature.title}`);
  
  const args = ['--id', selectedFeature.id];
  if (!useAgents) {
    args.push('--manual');
  }
  
  const child = spawn('node', [
    path.join(__dirname, 'orch-start-real.mjs'),
    ...args
  ], {
    stdio: 'inherit',
    cwd: orchRoot
  });
  
  await new Promise(resolve => child.on('exit', resolve));
}

// View all agents
async function viewAllAgents() {
  console.log('\n🤖 All 33 Available Agents\n');
  
  const agents = getAllAgents();
  
  // Group by category
  const categories = {
    'Leadership (5)': ['cto', 'chief-ai-officer', 'vp-engineering', 'vp-product', 'ciso'],
    'Product Management (4)': ['product-manager', 'ai-product-manager', 'technical-product-manager', 'business-analyst'],
    'Engineering (4)': ['frontend-engineer', 'backend-engineer', 'full-stack-engineer', 'staff-engineer'],
    'AI/ML (5)': ['ai-engineer', 'machine-learning-engineer', 'data-scientist', 'ml-research-scientist', 'mlops-engineer'],
    'Security & Privacy (5)': ['security-architect', 'application-security-engineer', 'ai-safety-engineer', 'devsecops-engineer', 'privacy-engineer'],
    'Data (2)': ['data-engineer', 'data-analyst'],
    'Infrastructure (2)': ['devops-engineer', 'site-reliability-engineer'],
    'Quality (2)': ['qa-engineer', 'qa-automation-engineer'],
    'Design (2)': ['ux-ui-designer', 'ux-researcher'],
    'Project Management (2)': ['project-manager', 'implementation-owner']
  };
  
  for (const [category, agentIds] of Object.entries(categories)) {
    console.log(`\n${category}:`);
    agentIds.forEach(agentId => {
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        // Try to load agent module for description
        const agentPath = path.join(orchRoot, 'agents', `${agentId}.mjs`);
        let description = '';
        if (fs.existsSync(agentPath)) {
          const content = fs.readFileSync(agentPath, 'utf8');
          const descMatch = content.match(/description:\s*['"]([^'"]+)['"]/);
          if (descMatch) {
            description = ` - ${descMatch[1]}`;
          }
        }
        console.log(`  • ${agent.name}${description}`);
      }
    });
  }
  
  console.log('\n📊 Total: 33 specialized agents ready for assignment');
}

// Check system status
async function checkSystemStatus() {
  console.log('\n🔍 Checking System Status...\n');
  
  // Check agent modules
  const agentsDir = path.join(orchRoot, 'agents');
  const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.mjs'));
  console.log(`✅ Agent Modules: ${agentFiles.length - 1} agents available`); // -1 for index.mjs
  
  // Check PRDs
  const prdsDir = path.join(appRoot, 'PRDs');
  let prdCount = 0;
  if (fs.existsSync(prdsDir)) {
    ['V1', 'V2', 'V3'].forEach(version => {
      const versionDir = path.join(prdsDir, version);
      if (fs.existsSync(versionDir)) {
        prdCount += fs.readdirSync(versionDir).filter(f => f.endsWith('.md')).length;
      }
    });
  }
  console.log(`📄 PRDs: ${prdCount} documents`);
  
  // Check QA
  const qaDir = path.join(appRoot, 'QA');
  const qaProjects = fs.existsSync(qaDir) ? fs.readdirSync(qaDir).length : 0;
  console.log(`🧪 QA Projects: ${qaProjects} test suites`);
  
  // Check auth system
  const authDir = path.join(orchRoot, 'auth');
  const hasAuth = fs.existsSync(authDir);
  console.log(`🔐 Auth System: ${hasAuth ? 'Configured' : 'Not configured'}`);
  
  // Check for active features
  const roadmapPath = path.join(appRoot, 'Plans/product-roadmap.md');
  if (fs.existsSync(roadmapPath)) {
    const roadmap = fs.readFileSync(roadmapPath, 'utf8');
    const inProgress = (roadmap.match(/In Progress/g) || []).length;
    const ready = (roadmap.match(/Ready/g) || []).length;
    const complete = (roadmap.match(/Complete/g) || []).length;
    
    console.log('\n📈 Feature Status:');
    console.log(`  🚧 In Progress: ${inProgress}`);
    console.log(`  🎯 Ready: ${ready}`);
    console.log(`  ✅ Complete: ${complete}`);
  }
  
  // Run health check if available
  const healthCheckPath = path.join(orchRoot, 'scripts/health-check.mjs');
  if (fs.existsSync(healthCheckPath)) {
    console.log('\n🏥 Running health check...');
    const child = spawn('node', [healthCheckPath], {
      stdio: 'inherit',
      cwd: orchRoot
    });
    await new Promise(resolve => child.on('exit', resolve));
  }
}

// Assign agents to feature
async function assignAgentsToFeature() {
  console.log('\n🤖 Assign Agents to Feature\n');
  
  const featureId = await question('Enter feature ID (X.X.X.X.X.X): ');
  
  // Validate ID
  if (!/^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/.test(featureId)) {
    console.log('❌ Invalid feature ID format.');
    return;
  }
  
  const child = spawn('node', [
    path.join(__dirname, 'orch-agents.mjs'),
    'assign',
    '--id', featureId
  ], {
    stdio: 'inherit',
    cwd: orchRoot
  });
  
  await new Promise(resolve => child.on('exit', resolve));
}

// Run team review
async function runTeamReview() {
  console.log('\n👥 Run Team Review\n');
  
  const featureId = await question('Enter feature ID for review (X.X.X.X.X.X): ');
  
  // Validate ID
  if (!/^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/.test(featureId)) {
    console.log('❌ Invalid feature ID format.');
    return;
  }
  
  const allAgents = await question('Review with all 33 agents? (y/n, default: n): ');
  
  const args = ['review', '--id', featureId];
  if (allAgents.toLowerCase() === 'y') {
    args.push('--all-agents');
    console.log('\n⚠️  Note: Running all 33 agents may take 10-15 minutes...');
  }
  
  const child = spawn('node', [
    path.join(__dirname, 'orch-agents.mjs'),
    ...args
  ], {
    stdio: 'inherit',
    cwd: orchRoot
  });
  
  await new Promise(resolve => child.on('exit', resolve));
}

// Generate reports
async function generateReports() {
  console.log('\n📊 Generate Reports\n');
  
  const reportTypes = [
    'Roadmap HTML',
    'Agent Activity Report',
    'QA Test Results',
    'Feature Progress Report',
    'System Health Report'
  ];
  
  displayOptions(reportTypes, 'Select report type');
  const choice = await question('\nSelect report (1-5): ');
  
  switch(choice) {
    case '1':
      console.log('Generating roadmap HTML...');
      const roadmapChild = spawn('node', [
        path.join(__dirname, 'generate-roadmap-html.mjs')
      ], {
        stdio: 'inherit',
        cwd: orchRoot
      });
      await new Promise(resolve => roadmapChild.on('exit', resolve));
      break;
      
    case '2':
      console.log('Generating agent activity report...');
      const agentChild = spawn('node', [
        path.join(__dirname, 'orch-agents.mjs'),
        'report'
      ], {
        stdio: 'inherit',
        cwd: orchRoot
      });
      await new Promise(resolve => agentChild.on('exit', resolve));
      break;
      
    default:
      console.log('❌ Report type not yet implemented.');
  }
}

// Run the wizard if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  interactiveSetup().catch(err => {
    console.error('❌ Error:', err);
    rl.close();
    process.exit(1);
  });
}