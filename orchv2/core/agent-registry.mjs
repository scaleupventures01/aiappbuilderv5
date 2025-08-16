/**
 * Dynamic Agent Registry System
 * Flexible agent and team management - no hardcoded counts
 * Automatically discovers and configures agents
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DynamicAgentRegistry {
  constructor() {
    this.agents = new Map();
    this.teams = new Map();
    this.agentCount = 0;
    this.configPath = path.join(__dirname, '../../orch-team-manifest.json');
    this.agentsDir = path.join(__dirname, '../../agents');
    
    // Initialize on creation
    this.initialize();
  }

  /**
   * Initialize registry by discovering all agents
   */
  async initialize() {
    // Discover agents from filesystem
    await this.discoverAgents();
    
    // Load team configuration
    await this.loadTeamConfiguration();
    
    // Validate and organize
    this.validateRegistry();
    
    console.log(`📊 Agent Registry Initialized: ${this.agentCount} agents in ${this.teams.size} teams`);
  }

  /**
   * Dynamically discover all agents from the agents directory
   */
  async discoverAgents() {
    try {
      const files = fs.readdirSync(this.agentsDir);
      
      for (const file of files) {
        if (file.endsWith('.mjs') && file !== 'index.mjs') {
          const agentName = file.replace('.mjs', '');
          const agentPath = path.join(this.agentsDir, file);
          
          // Dynamic import to get agent metadata
          try {
            const agentModule = await import(agentPath);
            const AgentClass = agentModule[Object.keys(agentModule)[0]];
            
            if (AgentClass) {
              const instance = new AgentClass();
              
              this.agents.set(agentName, {
                name: agentName,
                path: agentPath,
                description: instance.description || '',
                expertise: instance.expertise || [],
                team: this.inferTeamFromName(agentName),
                active: true,
                capabilities: instance.allowedTools || ['*']
              });
            }
          } catch (error) {
            console.warn(`⚠️  Could not load agent ${agentName}: ${error.message}`);
          }
        }
      }
      
      this.agentCount = this.agents.size;
      console.log(`✅ Discovered ${this.agentCount} agents dynamically`);
      
    } catch (error) {
      console.error(`❌ Error discovering agents: ${error.message}`);
    }
  }

  /**
   * Load team configuration from manifest
   */
  async loadTeamConfiguration() {
    // Default team structure (can be overridden by config)
    const defaultTeams = {
      leadership: {
        name: 'Leadership',
        phase: 7,
        agents: [],
        responsibilities: 'Strategic decisions and sign-offs'
      },
      product: {
        name: 'Product & Planning',
        phase: 1,
        agents: [],
        responsibilities: 'Requirements and planning'
      },
      architecture: {
        name: 'Architecture & Design',
        phase: 2,
        agents: [],
        responsibilities: 'Technical architecture and UX design'
      },
      legal: {
        name: 'Legal & Compliance',
        phase: 3,
        agents: [],
        responsibilities: 'Legal review, terms of service, compliance verification'
      },
      security: {
        name: 'Security & Compliance',
        phase: 3,
        agents: [],
        responsibilities: 'Security review and compliance'
      },
      engineering: {
        name: 'Engineering',
        phase: 4,
        agents: [],
        responsibilities: 'Implementation and development'
      },
      ai_ml: {
        name: 'AI & Machine Learning',
        phase: 4,
        agents: [],
        responsibilities: 'AI/ML implementation and optimization'
      },
      infrastructure: {
        name: 'Infrastructure & DevOps',
        phase: 5,
        agents: [],
        responsibilities: 'Deployment and operations'
      },
      quality: {
        name: 'Quality Assurance',
        phase: 6,
        agents: [],
        responsibilities: 'Testing and validation'
      },
      design: {
        name: 'Design & UX',
        phase: 2,
        agents: [],
        responsibilities: 'User experience and interface design'
      }
    };

    // Try to load custom configuration
    if (fs.existsSync(this.configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        
        // Merge with defaults
        for (const [teamId, teamConfig] of Object.entries(config.teams || {})) {
          defaultTeams[teamId] = { ...defaultTeams[teamId], ...teamConfig };
        }
      } catch (error) {
        console.warn('⚠️  Using default team configuration');
      }
    }

    // Assign agents to teams based on their names/roles
    for (const [agentName, agentData] of this.agents.entries()) {
      const team = agentData.team || this.inferTeamFromName(agentName);
      
      if (defaultTeams[team]) {
        defaultTeams[team].agents.push(agentName);
        agentData.team = team;
        agentData.phase = defaultTeams[team].phase;
      }
    }

    // Store teams
    for (const [teamId, teamData] of Object.entries(defaultTeams)) {
      if (teamData.agents.length > 0) {
        this.teams.set(teamId, teamData);
      }
    }
  }

  /**
   * Infer team from agent name
   */
  inferTeamFromName(agentName) {
    const name = agentName.toLowerCase();
    
    if (name.includes('cto') || name.includes('vp') || name.includes('chief')) {
      return 'leadership';
    }
    if (name.includes('product') || name.includes('business-analyst') || name.includes('project')) {
      return 'product';
    }
    if (name.includes('frontend') || name.includes('backend') || name.includes('full-stack') || name.includes('staff')) {
      return 'engineering';
    }
    if (name.includes('ai') || name.includes('ml') || name.includes('machine-learning') || name.includes('data')) {
      return 'ai_ml';
    }
    if (name.includes('security') || name.includes('ciso') || name.includes('privacy') || name.includes('safety')) {
      return 'security';
    }
    if (name.includes('devops') || name.includes('sre') || name.includes('site-reliability') || name.includes('devsecops')) {
      return 'infrastructure';
    }
    if (name.includes('qa') || name.includes('quality')) {
      return 'quality';
    }
    if (name.includes('ux') || name.includes('ui') || name.includes('design')) {
      return 'design';
    }
    
    return 'engineering'; // Default fallback
  }

  /**
   * Add a new agent dynamically
   */
  async addAgent(agentConfig) {
    const { name, team, description, expertise, path } = agentConfig;
    
    // Add to registry
    this.agents.set(name, {
      name,
      team,
      description,
      expertise: expertise || [],
      path: path || path.join(this.agentsDir, `${name}.mjs`),
      active: true,
      capabilities: ['*']
    });
    
    // Add to team
    if (this.teams.has(team)) {
      this.teams.get(team).agents.push(name);
    } else {
      // Create new team if doesn't exist
      this.teams.set(team, {
        name: team,
        phase: 4, // Default to implementation phase
        agents: [name],
        responsibilities: 'Custom team responsibilities'
      });
    }
    
    this.agentCount = this.agents.size;
    
    // Persist configuration
    await this.saveConfiguration();
    
    console.log(`✅ Added agent: ${name} to team ${team}`);
    return true;
  }

  /**
   * Remove an agent
   */
  async removeAgent(agentName) {
    if (!this.agents.has(agentName)) {
      console.log(`⚠️  Agent ${agentName} not found`);
      return false;
    }
    
    const agent = this.agents.get(agentName);
    
    // Remove from team
    if (this.teams.has(agent.team)) {
      const team = this.teams.get(agent.team);
      team.agents = team.agents.filter(a => a !== agentName);
    }
    
    // Remove from registry
    this.agents.delete(agentName);
    this.agentCount = this.agents.size;
    
    // Persist configuration
    await this.saveConfiguration();
    
    console.log(`✅ Removed agent: ${agentName}`);
    return true;
  }

  /**
   * Add or modify a team
   */
  async modifyTeam(teamId, teamConfig) {
    this.teams.set(teamId, {
      ...this.teams.get(teamId),
      ...teamConfig
    });
    
    await this.saveConfiguration();
    
    console.log(`✅ Modified team: ${teamId}`);
    return true;
  }

  /**
   * Get agents by phase
   */
  getAgentsByPhase(phase) {
    const phaseAgents = [];
    
    for (const [teamId, team] of this.teams.entries()) {
      if (team.phase === phase) {
        for (const agentName of team.agents) {
          if (this.agents.has(agentName)) {
            phaseAgents.push(this.agents.get(agentName));
          }
        }
      }
    }
    
    return phaseAgents;
  }

  /**
   * Get all active agents
   */
  getAllActiveAgents() {
    return Array.from(this.agents.values()).filter(agent => agent.active);
  }

  /**
   * Get team by ID
   */
  getTeam(teamId) {
    return this.teams.get(teamId);
  }

  /**
   * Validate registry consistency
   */
  validateRegistry() {
    let issues = [];
    
    // Check for orphaned agents (not in any team)
    for (const [agentName, agent] of this.agents.entries()) {
      if (!agent.team) {
        issues.push(`Agent ${agentName} has no team assignment`);
      }
    }
    
    // Check for empty teams
    for (const [teamId, team] of this.teams.entries()) {
      if (team.agents.length === 0) {
        issues.push(`Team ${teamId} has no agents`);
      }
    }
    
    if (issues.length > 0) {
      console.warn('⚠️  Registry validation issues:');
      issues.forEach(issue => console.warn(`   - ${issue}`));
    }
    
    return issues.length === 0;
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration() {
    const config = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      agentCount: this.agentCount,
      teams: Object.fromEntries(this.teams),
      agents: Object.fromEntries(this.agents)
    };
    
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Get statistics about the registry
   */
  getStatistics() {
    const stats = {
      totalAgents: this.agentCount,
      activeAgents: this.getAllActiveAgents().length,
      totalTeams: this.teams.size,
      agentsByTeam: {},
      agentsByPhase: {},
      capabilities: {
        total: 0,
        byType: {}
      }
    };
    
    // Count agents by team
    for (const [teamId, team] of this.teams.entries()) {
      stats.agentsByTeam[teamId] = team.agents.length;
    }
    
    // Count agents by phase
    for (let phase = 1; phase <= 8; phase++) {
      stats.agentsByPhase[phase] = this.getAgentsByPhase(phase).length;
    }
    
    return stats;
  }

  /**
   * Export registry for external use
   */
  exportRegistry() {
    return {
      agents: Array.from(this.agents.values()),
      teams: Array.from(this.teams.values()),
      statistics: this.getStatistics()
    };
  }
}

// Singleton instance
let registryInstance = null;

export function getAgentRegistry() {
  if (!registryInstance) {
    registryInstance = new DynamicAgentRegistry();
  }
  return registryInstance;
}

// CLI interface for managing agents
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const registry = getAgentRegistry();
  
  setTimeout(async () => {
    switch (command) {
      case 'list':
        console.log('\n📊 Agent Registry:');
        console.log(JSON.stringify(registry.exportRegistry(), null, 2));
        break;
        
      case 'add':
        const [name, team, description] = process.argv.slice(3);
        await registry.addAgent({ name, team, description });
        break;
        
      case 'remove':
        await registry.removeAgent(process.argv[3]);
        break;
        
      case 'stats':
        console.log('\n📈 Registry Statistics:');
        console.log(JSON.stringify(registry.getStatistics(), null, 2));
        break;
        
      default:
        console.log('Commands: list, add <name> <team> <description>, remove <name>, stats');
    }
  }, 100); // Allow initialization to complete
}