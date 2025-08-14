#!/usr/bin/env node
/**
 * Task Decomposer with Agent Integration
 * Breaks down features into tasks and subtasks with intelligent agent assignment
 * Leverages AI agents to suggest optimal task breakdown
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const appRoot = path.resolve(__dirname, '../../app');

// Task complexity levels
const COMPLEXITY = {
  TRIVIAL: 1,
  SIMPLE: 2,
  MODERATE: 3,
  COMPLEX: 4,
  EPIC: 5
};

// Agent specializations for task types
const TASK_AGENT_MAPPING = {
  'ui': ['frontend-engineer', 'ux-ui-designer'],
  'api': ['backend-engineer', 'technical-product-manager'],
  'database': ['data-engineer', 'backend-engineer'],
  'auth': ['security-architect', 'backend-engineer'],
  'testing': ['qa-engineer', 'qa-automation-engineer'],
  'deployment': ['devops-engineer', 'site-reliability-engineer'],
  'ai': ['ai-engineer', 'machine-learning-engineer'],
  'security': ['security-architect', 'devsecops-engineer'],
  'performance': ['staff-engineer', 'site-reliability-engineer'],
  'documentation': ['technical-product-manager', 'product-manager'],
  'integration': ['full-stack-engineer', 'backend-engineer'],
  'analytics': ['data-analyst', 'data-scientist']
};

// Decompose feature into tasks
export async function decomposeFeature(featureId, options = {}) {
  console.log('\n🔍 Task Decomposer with Agent Assignment\n');
  console.log(`Feature ID: ${featureId}`);
  
  // Validate feature ID
  if (!/^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/.test(featureId)) {
    throw new Error('Invalid feature ID format. Expected: X.X.X.X.X.X');
  }
  
  // Load feature PRD if exists
  const featureInfo = await loadFeatureInfo(featureId);
  
  if (!featureInfo) {
    console.log('⚠️  Feature not found. Creating decomposition template...');
  }
  
  // Generate task breakdown
  const tasks = await generateTaskBreakdown(featureId, featureInfo, options);
  
  // Assign agents to tasks
  const tasksWithAgents = await assignAgentsToTasks(tasks, featureId);
  
  // Calculate complexity and estimates
  const analyzed = analyzeComplexity(tasksWithAgents);
  
  // Display results
  displayDecomposition(analyzed, options);
  
  // Save if requested
  if (options.save) {
    await saveDecomposition(featureId, analyzed);
  }
  
  return analyzed;
}

// Load feature information from PRD
async function loadFeatureInfo(featureId) {
  // Try to find PRD
  const prdsDir = path.join(appRoot, 'PRDs');
  let prdPath = null;
  
  ['V1', 'V2', 'V3'].forEach(version => {
    const versionDir = path.join(prdsDir, version);
    if (fs.existsSync(versionDir)) {
      const files = fs.readdirSync(versionDir);
      const matchingFile = files.find(f => f.startsWith(featureId));
      if (matchingFile) {
        prdPath = path.join(versionDir, matchingFile);
      }
    }
  });
  
  if (!prdPath) {
    // Check roadmap for feature info
    const roadmapPath = path.join(appRoot, 'Plans/product-roadmap.md');
    if (fs.existsSync(roadmapPath)) {
      const roadmap = fs.readFileSync(roadmapPath, 'utf8');
      const lines = roadmap.split('\n');
      const featureLine = lines.find(l => l.includes(`| ${featureId} |`));
      
      if (featureLine) {
        const parts = featureLine.split('|').map(s => s.trim());
        return {
          id: featureId,
          title: parts[3] || 'Unknown Feature',
          status: parts[4] || 'Draft',
          owner: parts[5] || 'Unassigned'
        };
      }
    }
    return null;
  }
  
  // Parse PRD
  const prdContent = fs.readFileSync(prdPath, 'utf8');
  const titleMatch = prdContent.match(/title:\s*(.+)/);
  const ownerMatch = prdContent.match(/owner:\s*(.+)/);
  const statusMatch = prdContent.match(/status:\s*(.+)/);
  
  return {
    id: featureId,
    title: titleMatch ? titleMatch[1] : 'Unknown Feature',
    status: statusMatch ? statusMatch[1] : 'Draft',
    owner: ownerMatch ? ownerMatch[1] : 'Unassigned',
    prdPath: prdPath,
    content: prdContent
  };
}

// Generate task breakdown
async function generateTaskBreakdown(featureId, featureInfo, options) {
  const [version, major, minor, feature, task, subtask] = featureId.split('.').map(Number);
  const tasks = [];
  
  // Determine feature type and generate appropriate tasks
  const featureType = determineFeatureType(version, major);
  
  // Core task templates based on feature type
  const taskTemplates = getTaskTemplates(featureType);
  
  // Generate tasks with proper numbering
  let taskNumber = 1;
  
  taskTemplates.forEach(template => {
    const taskId = `${version}.${major}.${minor}.${feature}.${taskNumber}.0`;
    
    // Main task
    tasks.push({
      id: taskId,
      title: template.title,
      description: template.description,
      type: template.type,
      complexity: template.complexity || COMPLEXITY.MODERATE,
      dependencies: template.dependencies || [],
      subtasks: []
    });
    
    // Generate subtasks
    if (template.subtasks) {
      template.subtasks.forEach((subtaskTemplate, idx) => {
        const subtaskId = `${version}.${major}.${minor}.${feature}.${taskNumber}.${idx + 1}`;
        tasks[tasks.length - 1].subtasks.push({
          id: subtaskId,
          title: subtaskTemplate.title,
          description: subtaskTemplate.description,
          type: subtaskTemplate.type,
          complexity: subtaskTemplate.complexity || COMPLEXITY.SIMPLE,
          estimatedHours: subtaskTemplate.hours || 4
        });
      });
    }
    
    taskNumber++;
  });
  
  // Add testing tasks if not present
  if (!tasks.some(t => t.type === 'testing')) {
    tasks.push({
      id: `${version}.${major}.${minor}.${feature}.${taskNumber}.0`,
      title: 'Testing & Validation',
      description: 'Comprehensive testing of the feature',
      type: 'testing',
      complexity: COMPLEXITY.MODERATE,
      dependencies: tasks.map(t => t.id).filter(id => !id.includes('testing')),
      subtasks: [
        {
          id: `${version}.${major}.${minor}.${feature}.${taskNumber}.1`,
          title: 'Unit Tests',
          description: 'Write unit tests for all components',
          type: 'testing',
          complexity: COMPLEXITY.SIMPLE,
          estimatedHours: 8
        },
        {
          id: `${version}.${major}.${minor}.${feature}.${taskNumber}.2`,
          title: 'Integration Tests',
          description: 'Test component integration',
          type: 'testing',
          complexity: COMPLEXITY.MODERATE,
          estimatedHours: 6
        },
        {
          id: `${version}.${major}.${minor}.${feature}.${taskNumber}.3`,
          title: 'E2E Tests',
          description: 'End-to-end user flow testing',
          type: 'testing',
          complexity: COMPLEXITY.MODERATE,
          estimatedHours: 8
        }
      ]
    });
  }
  
  return tasks;
}

// Determine feature type based on ID
function determineFeatureType(version, major) {
  if (version === 1) return 'frontend';
  if (version === 2) return 'backend';
  if (version === 3) return 'data';
  if (version === 4) return 'ai';
  if (version === 5) return 'infrastructure';
  if (version === 6) return 'security';
  if (version === 7) return 'privacy';
  if (version === 8) return 'enterprise';
  return 'general';
}

// Get task templates based on feature type
function getTaskTemplates(featureType) {
  const templates = {
    'frontend': [
      {
        title: 'UI Component Development',
        description: 'Build user interface components',
        type: 'ui',
        complexity: COMPLEXITY.MODERATE,
        subtasks: [
          { title: 'Create component structure', type: 'ui', hours: 2 },
          { title: 'Implement component logic', type: 'ui', hours: 4 },
          { title: 'Add styling and responsiveness', type: 'ui', hours: 3 },
          { title: 'Add accessibility features', type: 'ui', hours: 2 }
        ]
      },
      {
        title: 'State Management',
        description: 'Implement state management logic',
        type: 'ui',
        complexity: COMPLEXITY.MODERATE,
        subtasks: [
          { title: 'Define state structure', type: 'ui', hours: 2 },
          { title: 'Create actions and reducers', type: 'ui', hours: 3 },
          { title: 'Connect components to state', type: 'ui', hours: 2 }
        ]
      },
      {
        title: 'API Integration',
        description: 'Connect frontend to backend APIs',
        type: 'integration',
        complexity: COMPLEXITY.SIMPLE,
        subtasks: [
          { title: 'Create API service layer', type: 'integration', hours: 3 },
          { title: 'Handle API responses', type: 'integration', hours: 2 },
          { title: 'Error handling', type: 'integration', hours: 2 }
        ]
      }
    ],
    'backend': [
      {
        title: 'API Endpoint Development',
        description: 'Create REST API endpoints',
        type: 'api',
        complexity: COMPLEXITY.MODERATE,
        subtasks: [
          { title: 'Define API routes', type: 'api', hours: 2 },
          { title: 'Implement controllers', type: 'api', hours: 4 },
          { title: 'Add validation middleware', type: 'api', hours: 2 },
          { title: 'Document API endpoints', type: 'documentation', hours: 2 }
        ]
      },
      {
        title: 'Database Schema',
        description: 'Design and implement database schema',
        type: 'database',
        complexity: COMPLEXITY.MODERATE,
        subtasks: [
          { title: 'Design schema', type: 'database', hours: 3 },
          { title: 'Create migrations', type: 'database', hours: 2 },
          { title: 'Add indexes', type: 'database', hours: 1 },
          { title: 'Seed test data', type: 'database', hours: 1 }
        ]
      },
      {
        title: 'Business Logic',
        description: 'Implement core business logic',
        type: 'api',
        complexity: COMPLEXITY.COMPLEX,
        subtasks: [
          { title: 'Service layer implementation', type: 'api', hours: 6 },
          { title: 'Data validation', type: 'api', hours: 3 },
          { title: 'Error handling', type: 'api', hours: 2 }
        ]
      }
    ],
    'ai': [
      {
        title: 'Model Integration',
        description: 'Integrate AI/ML models',
        type: 'ai',
        complexity: COMPLEXITY.COMPLEX,
        subtasks: [
          { title: 'Model selection', type: 'ai', hours: 4 },
          { title: 'API integration', type: 'ai', hours: 6 },
          { title: 'Prompt engineering', type: 'ai', hours: 8 },
          { title: 'Response handling', type: 'ai', hours: 4 }
        ]
      },
      {
        title: 'Training Pipeline',
        description: 'Set up model training pipeline',
        type: 'ai',
        complexity: COMPLEXITY.COMPLEX,
        subtasks: [
          { title: 'Data preparation', type: 'ai', hours: 6 },
          { title: 'Training configuration', type: 'ai', hours: 4 },
          { title: 'Evaluation metrics', type: 'ai', hours: 3 }
        ]
      }
    ],
    'security': [
      {
        title: 'Security Implementation',
        description: 'Implement security measures',
        type: 'security',
        complexity: COMPLEXITY.COMPLEX,
        subtasks: [
          { title: 'Authentication setup', type: 'auth', hours: 6 },
          { title: 'Authorization rules', type: 'auth', hours: 4 },
          { title: 'Encryption implementation', type: 'security', hours: 4 },
          { title: 'Security audit', type: 'security', hours: 4 }
        ]
      }
    ],
    'general': [
      {
        title: 'Planning & Design',
        description: 'Initial planning and design phase',
        type: 'documentation',
        complexity: COMPLEXITY.SIMPLE,
        subtasks: [
          { title: 'Requirements gathering', type: 'documentation', hours: 4 },
          { title: 'Technical design', type: 'documentation', hours: 4 },
          { title: 'Architecture review', type: 'documentation', hours: 2 }
        ]
      },
      {
        title: 'Implementation',
        description: 'Core feature implementation',
        type: 'integration',
        complexity: COMPLEXITY.MODERATE,
        subtasks: [
          { title: 'Core functionality', type: 'integration', hours: 8 },
          { title: 'Edge cases', type: 'integration', hours: 4 },
          { title: 'Performance optimization', type: 'performance', hours: 4 }
        ]
      }
    ]
  };
  
  return templates[featureType] || templates['general'];
}

// Assign agents to tasks based on type and complexity
async function assignAgentsToTasks(tasks, featureId) {
  const assignedTasks = [];
  
  for (const task of tasks) {
    const agents = selectAgentsForTask(task);
    
    // Assign agents to main task
    task.assignedAgents = agents;
    task.leadAgent = agents[0]; // First agent is the lead
    
    // Assign agents to subtasks
    if (task.subtasks) {
      task.subtasks = task.subtasks.map(subtask => {
        const subtaskAgents = selectAgentsForTask(subtask);
        return {
          ...subtask,
          assignedAgents: subtaskAgents,
          leadAgent: subtaskAgents[0]
        };
      });
    }
    
    assignedTasks.push(task);
  }
  
  return assignedTasks;
}

// Select appropriate agents for a task
function selectAgentsForTask(task) {
  const agents = [];
  
  // Get agents based on task type
  const typeAgents = TASK_AGENT_MAPPING[task.type] || ['full-stack-engineer'];
  agents.push(...typeAgents);
  
  // Add additional agents based on complexity
  if (task.complexity >= COMPLEXITY.COMPLEX) {
    agents.push('staff-engineer');
    agents.push('technical-product-manager');
  }
  
  if (task.complexity >= COMPLEXITY.EPIC) {
    agents.push('vp-engineering');
    agents.push('cto');
  }
  
  // Always add QA for validation
  if (!agents.includes('qa-engineer')) {
    agents.push('qa-engineer');
  }
  
  // Remove duplicates
  return [...new Set(agents)];
}

// Analyze complexity and generate estimates
function analyzeComplexity(tasks) {
  let totalComplexity = 0;
  let totalEstimatedHours = 0;
  let totalSubtasks = 0;
  const agentWorkload = {};
  
  tasks.forEach(task => {
    totalComplexity += task.complexity;
    
    // Track agent workload
    task.assignedAgents.forEach(agent => {
      agentWorkload[agent] = (agentWorkload[agent] || 0) + task.complexity;
    });
    
    if (task.subtasks) {
      totalSubtasks += task.subtasks.length;
      task.subtasks.forEach(subtask => {
        totalEstimatedHours += subtask.estimatedHours || 4;
        
        // Track subtask agent workload
        if (subtask.assignedAgents) {
          subtask.assignedAgents.forEach(agent => {
            agentWorkload[agent] = (agentWorkload[agent] || 0) + 1;
          });
        }
      });
    }
  });
  
  const averageComplexity = totalComplexity / tasks.length;
  const estimatedDays = Math.ceil(totalEstimatedHours / 8);
  const estimatedSprints = Math.ceil(estimatedDays / 10);
  
  return {
    tasks,
    summary: {
      totalTasks: tasks.length,
      totalSubtasks,
      totalComplexity,
      averageComplexity: averageComplexity.toFixed(1),
      totalEstimatedHours,
      estimatedDays,
      estimatedSprints,
      agentWorkload,
      uniqueAgents: Object.keys(agentWorkload).length
    }
  };
}

// Display decomposition results
function displayDecomposition(analyzed, options) {
  const { tasks, summary } = analyzed;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Task Decomposition Results');
  console.log('='.repeat(60));
  
  // Summary
  console.log('\n📈 Summary:');
  console.log(`  Total Tasks: ${summary.totalTasks}`);
  console.log(`  Total Subtasks: ${summary.totalSubtasks}`);
  console.log(`  Average Complexity: ${summary.averageComplexity}/5`);
  console.log(`  Estimated Hours: ${summary.totalEstimatedHours}`);
  console.log(`  Estimated Days: ${summary.estimatedDays}`);
  console.log(`  Estimated Sprints: ${summary.estimatedSprints}`);
  console.log(`  Unique Agents Required: ${summary.uniqueAgents}`);
  
  // Task breakdown
  console.log('\n📋 Task Breakdown:');
  tasks.forEach(task => {
    const complexityBar = '█'.repeat(task.complexity) + '░'.repeat(5 - task.complexity);
    console.log(`\n  ${task.id} - ${task.title}`);
    console.log(`    Complexity: ${complexityBar} (${task.complexity}/5)`);
    console.log(`    Type: ${task.type}`);
    console.log(`    Lead Agent: ${formatAgentName(task.leadAgent)}`);
    console.log(`    Team: ${task.assignedAgents.map(formatAgentName).join(', ')}`);
    
    if (task.dependencies && task.dependencies.length > 0) {
      console.log(`    Dependencies: ${task.dependencies.join(', ')}`);
    }
    
    if (task.subtasks && task.subtasks.length > 0) {
      console.log(`    Subtasks (${task.subtasks.length}):`);
      task.subtasks.forEach(subtask => {
        console.log(`      • ${subtask.id} - ${subtask.title}`);
        console.log(`        Hours: ${subtask.estimatedHours}h | Agent: ${formatAgentName(subtask.leadAgent)}`);
      });
    }
  });
  
  // Agent workload distribution
  console.log('\n👥 Agent Workload Distribution:');
  const sortedAgents = Object.entries(summary.agentWorkload)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  sortedAgents.forEach(([agent, workload]) => {
    const bar = '█'.repeat(Math.min(workload * 2, 20));
    console.log(`  ${formatAgentName(agent).padEnd(30)} ${bar} ${workload} units`);
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (summary.averageComplexity > 3.5) {
    console.log('  ⚠️  High complexity detected. Consider breaking down further.');
  }
  if (summary.estimatedSprints > 3) {
    console.log('  ⚠️  Long timeline. Consider parallel task execution.');
  }
  if (summary.uniqueAgents > 10) {
    console.log('  ⚠️  Many agents required. Consider phased approach.');
  }
  if (summary.uniqueAgents <= 5) {
    console.log('  ✅ Manageable team size.');
  }
  if (summary.estimatedSprints <= 2) {
    console.log('  ✅ Reasonable timeline.');
  }
}

// Format agent name
function formatAgentName(agentId) {
  if (!agentId) return 'Unassigned';
  return agentId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Save decomposition to file
async function saveDecomposition(featureId, analyzed) {
  const outputDir = path.join(appRoot, 'Plans', 'decompositions');
  fs.mkdirSync(outputDir, { recursive: true });
  
  const outputPath = path.join(outputDir, `${featureId}-decomposition.json`);
  
  fs.writeFileSync(outputPath, JSON.stringify(analyzed, null, 2));
  console.log(`\n💾 Decomposition saved to: ${outputPath}`);
  
  // Also create markdown report
  const mdPath = path.join(outputDir, `${featureId}-decomposition.md`);
  const mdContent = generateMarkdownReport(featureId, analyzed);
  fs.writeFileSync(mdPath, mdContent);
  console.log(`📄 Markdown report saved to: ${mdPath}`);
}

// Generate markdown report
function generateMarkdownReport(featureId, analyzed) {
  const { tasks, summary } = analyzed;
  const date = new Date().toISOString().slice(0, 10);
  
  let md = `# Task Decomposition Report\n\n`;
  md += `**Feature ID:** ${featureId}\n`;
  md += `**Generated:** ${date}\n`;
  md += `**Total Agents:** ${summary.uniqueAgents} from 33-agent pool\n\n`;
  
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Tasks | ${summary.totalTasks} |\n`;
  md += `| Total Subtasks | ${summary.totalSubtasks} |\n`;
  md += `| Average Complexity | ${summary.averageComplexity}/5 |\n`;
  md += `| Estimated Hours | ${summary.totalEstimatedHours} |\n`;
  md += `| Estimated Days | ${summary.estimatedDays} |\n`;
  md += `| Estimated Sprints | ${summary.estimatedSprints} |\n\n`;
  
  md += `## Task Details\n\n`;
  tasks.forEach(task => {
    md += `### ${task.id} - ${task.title}\n\n`;
    md += `- **Complexity:** ${task.complexity}/5\n`;
    md += `- **Type:** ${task.type}\n`;
    md += `- **Lead Agent:** ${formatAgentName(task.leadAgent)}\n`;
    md += `- **Team:** ${task.assignedAgents.map(formatAgentName).join(', ')}\n\n`;
    
    if (task.subtasks && task.subtasks.length > 0) {
      md += `#### Subtasks\n\n`;
      task.subtasks.forEach(subtask => {
        md += `- **${subtask.id}** - ${subtask.title}\n`;
        md += `  - Hours: ${subtask.estimatedHours}h\n`;
        md += `  - Agent: ${formatAgentName(subtask.leadAgent)}\n`;
      });
      md += '\n';
    }
  });
  
  md += `## Agent Assignments\n\n`;
  md += `| Agent | Workload Units |\n`;
  md += `|-------|---------------|\n`;
  Object.entries(summary.agentWorkload)
    .sort((a, b) => b[1] - a[1])
    .forEach(([agent, workload]) => {
      md += `| ${formatAgentName(agent)} | ${workload} |\n`;
    });
  
  md += `\n---\n*Generated by ORCH Task Decomposer with 33-agent system*\n`;
  
  return md;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Task Decomposer with Agent Integration

Usage: task-decomposer.mjs --id <feature-id> [options]

Options:
  --id <ID>        Feature ID to decompose (required)
  --save           Save decomposition to file
  --with-agents    Show detailed agent assignments (default: true)
  --json           Output as JSON
  --help, -h       Show this help

Examples:
  task-decomposer.mjs --id 1.1.1.1.0.0
  task-decomposer.mjs --id 2.1.1.1.0.0 --save
  task-decomposer.mjs --id 4.1.1.1.0.0 --json

Feature Types (by version number):
  1.x.x.x - Frontend features
  2.x.x.x - Backend features
  3.x.x.x - Data features
  4.x.x.x - AI/ML features
  5.x.x.x - Infrastructure
  6.x.x.x - Security features
`);
    process.exit(0);
  }
  
  const idIndex = args.indexOf('--id');
  if (idIndex === -1 || !args[idIndex + 1]) {
    console.error('Error: Feature ID required. Use --id <feature-id>');
    process.exit(1);
  }
  
  const featureId = args[idIndex + 1];
  const options = {
    save: args.includes('--save'),
    withAgents: !args.includes('--no-agents'),
    json: args.includes('--json')
  };
  
  decomposeFeature(featureId, options)
    .then(result => {
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      }
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}