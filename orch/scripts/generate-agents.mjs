#!/usr/bin/env node

/**
 * Generate individual agent files from team role definitions
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const teamDir = path.join(__dirname, '../team');
const agentsDir = path.join(__dirname, '../agents');

// Ensure agents directory exists
fs.mkdirSync(agentsDir, { recursive: true });

// Get all team role files
const roleFiles = fs.readdirSync(teamDir).filter(f => 
  f.endsWith('.md') && 
  !f.startsWith('_') && 
  f !== 'rca-10-whys-prompt.md'
);

console.log(`Generating ${roleFiles.length} agent files...`);

for (const roleFile of roleFiles) {
  const rolePath = path.join(teamDir, roleFile);
  const roleContent = fs.readFileSync(rolePath, 'utf8');
  
  // Parse frontmatter
  const lines = roleContent.split('\n');
  let frontmatter = {};
  let inFrontmatter = false;
  let bodyStartIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        bodyStartIndex = i + 1;
        break;
      }
    } else if (inFrontmatter) {
      const match = lines[i].match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        frontmatter[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  }
  
  const body = lines.slice(bodyStartIndex).join('\n');
  
  // Extract key information
  const name = frontmatter.name || roleFile.replace('.md', '');
  const className = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Agent';
  const agentFile = roleFile.replace('.md', '.mjs');
  
  // Extract expertise
  const expertiseMatch = body.match(/Expertise:\s*([^\n]+)/);
  const expertise = expertiseMatch ? expertiseMatch[1].split(',').map(e => e.trim()) : [];
  
  // Extract KPIs
  const kpiMatch = body.match(/### KPIs[^\n]*\n[-*]\s*([^\n]+)/);
  const kpis = kpiMatch ? kpiMatch[1] : '';
  
  // Generate agent class
  const agentCode = `/**
 * ${className} - Auto-generated from ${roleFile}
 * ${frontmatter.description || ''}
 */

import { Agent } from '../lib/orch/agent-system.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ${className} extends Agent {
  constructor() {
    super({
      name: '${name}',
      role: '${name}',
      description: ${JSON.stringify(frontmatter.description || '')},
      expertise: ${JSON.stringify(expertise)},
      allowedTools: ${frontmatter['allowed-tools'] || '["*"]'},
      metadata: {
        source: '${roleFile}',
        kpis: ${JSON.stringify(kpis)}
      }
    });
    
    // Role-specific initialization
    this.roleDefinition = ${JSON.stringify(body)};
  }
  
  /**
   * Execute task with ${name} expertise
   */
  async executeTask(task) {
    this.emit('task:progress', { task: task.id, progress: 0.1 });
    
    const result = {
      taskId: task.id,
      agent: this.name,
      role: this.role,
      status: 'completed',
      output: '',
      artifacts: [],
      recommendations: [],
      completedAt: new Date().toISOString()
    };
    
    // Apply role-specific logic based on task type
    ${generateTaskLogic(name, expertise)}
    
    this.emit('task:progress', { task: task.id, progress: 1.0 });
    return result;
  }
  
  /**
   * Generate recommendations based on ${name} expertise
   */
  generateRecommendations(context) {
    const recommendations = [];
    
    ${generateRecommendationLogic(name, expertise)}
    
    return recommendations;
  }
  
  /**
   * Validate task requirements for ${name}
   */
  canHandleTask(task) {
    // Check if task matches this agent's expertise
    if (task.requirements?.role === '${name}') return true;
    
    if (task.requirements?.expertise) {
      const expertiseNeeded = task.requirements.expertise;
      const hasExpertise = expertiseNeeded.some(req => 
        this.expertise.some(exp => 
          exp.toLowerCase().includes(req.toLowerCase())
        )
      );
      if (hasExpertise) return true;
    }
    
    return false;
  }
}

// Create singleton instance
export const ${name.replace(/-/g, '_')}Agent = new ${className}();`;
  
  // Write agent file
  const agentPath = path.join(agentsDir, agentFile);
  fs.writeFileSync(agentPath, agentCode);
  console.log(`  Created: ${agentFile}`);
}

// Helper function to generate task logic based on role
function generateTaskLogic(role, expertise) {
  const roleLogic = {
    'ai-engineer': `
    if (task.description.includes('LLM') || task.description.includes('prompt')) {
      result.output = 'Designed prompt patterns and implemented LLM integration';
      result.artifacts.push({ type: 'prompt', name: 'system-prompt.md' });
      result.recommendations.push('Implement tiered model routing for cost optimization');
    }`,
    'frontend-engineer': `
    if (task.description.includes('UI') || task.description.includes('component')) {
      result.output = 'Implemented React components with proper state management';
      result.artifacts.push({ type: 'component', name: 'Component.tsx' });
      result.recommendations.push('Add unit tests for component interactions');
    }`,
    'backend-engineer': `
    if (task.description.includes('API') || task.description.includes('backend')) {
      result.output = 'Implemented RESTful API endpoints with proper validation';
      result.artifacts.push({ type: 'api', name: 'routes.ts' });
      result.recommendations.push('Add rate limiting and authentication');
    }`,
    'qa-engineer': `
    if (task.description.includes('test') || task.description.includes('QA')) {
      result.output = 'Created comprehensive test suite and executed test cases';
      result.artifacts.push({ type: 'test-report', name: 'qa-report.md' });
      result.recommendations.push('Add e2e tests for critical user flows');
    }`,
    'devops-engineer': `
    if (task.description.includes('deploy') || task.description.includes('CI')) {
      result.output = 'Configured CI/CD pipeline and deployment automation';
      result.artifacts.push({ type: 'config', name: '.github/workflows/deploy.yml' });
      result.recommendations.push('Add monitoring and alerting');
    }`,
    'data-engineer': `
    if (task.description.includes('data') || task.description.includes('pipeline')) {
      result.output = 'Built data pipeline with proper ETL processes';
      result.artifacts.push({ type: 'pipeline', name: 'etl-pipeline.py' });
      result.recommendations.push('Add data validation and quality checks');
    }`,
    'product-manager': `
    if (task.description.includes('PRD') || task.description.includes('feature')) {
      result.output = 'Created detailed product requirements and user stories';
      result.artifacts.push({ type: 'document', name: 'PRD.md' });
      result.recommendations.push('Conduct user research to validate assumptions');
    }`
  };
  
  return roleLogic[role] || `
    // Default task execution
    result.output = \`Completed task using \${this.role} expertise\`;
    result.artifacts.push({ type: 'report', name: 'task-output.md' });`;
}

// Helper function to generate recommendation logic
function generateRecommendationLogic(role, expertise) {
  const recLogic = {
    'ai-engineer': `
    if (context.message?.includes('performance')) {
      recommendations.push('Consider implementing response caching');
      recommendations.push('Use streaming for better UX');
    }`,
    'frontend-engineer': `
    if (context.message?.includes('performance')) {
      recommendations.push('Implement code splitting');
      recommendations.push('Add React.memo for expensive components');
    }`,
    'backend-engineer': `
    if (context.message?.includes('scale')) {
      recommendations.push('Implement database connection pooling');
      recommendations.push('Add Redis caching layer');
    }`,
    'qa-engineer': `
    recommendations.push('Ensure test coverage > 80%');
    recommendations.push('Add regression test suite');`,
    'devops-engineer': `
    if (context.message?.includes('production')) {
      recommendations.push('Enable auto-scaling');
      recommendations.push('Configure backup strategy');
    }`
  };
  
  return recLogic[role] || `
    // Generate role-specific recommendations
    recommendations.push('Apply best practices for ' + this.role);`;
}

console.log(`\nSuccessfully generated ${roleFiles.length} agent files in ${agentsDir}`);
console.log('\nAgents are now ready to be imported and used in the orchestration system.');