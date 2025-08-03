// lib/TerminalSetupWizard.js - Terminal-Based Setup Wizard for Team Leader System v4.0

/**
 * Terminal-Based Setup Wizard
 * All interactions happen directly in the terminal
 * No file watching or complex forms needed
 * 
 * Includes UserInteractionProcessor integration for approve/reject
 */

class TerminalSetupWizard {
    constructor() {
        this.config = {
            projectName: '',
            projectType: '',
            description: '',
            requirements: {
                userStories: [],
                integrations: [],
                aiFeatures: [],
                pageCount: 0,
                customComponents: 0
            },
            apiKeys: {},
            complexity: null,
            teamComposition: null
        };
        
        this.keyManager = null;
        this.system = null;
        this.processor = null; // UserInteractionProcessor instance
        
        // Quick templates
        this.templates = {
            webapp: {
                projectType: 'webapp',
                userStories: ['User authentication', 'Dashboard', 'User profile', 'Settings'],
                integrations: ['Stripe'],
                pageCount: 10,
                customComponents: 12
            },
            saas: {
                projectType: 'saas',
                userStories: ['User authentication', 'Subscription management', 'Team management', 'Admin dashboard', 'API access'],
                integrations: ['Stripe', 'SendGrid', 'Slack'],
                aiFeatures: ['Usage analytics', 'Smart notifications'],
                pageCount: 20,
                customComponents: 25
            },
            ecommerce: {
                projectType: 'ecommerce',
                userStories: ['Product catalog', 'Shopping cart', 'Checkout', 'Order tracking', 'User accounts'],
                integrations: ['Stripe', 'ShipStation', 'Mailchimp'],
                aiFeatures: ['Product recommendations', 'Search'],
                pageCount: 15,
                customComponents: 20
            },
            mobile: {
                projectType: 'mobile',
                userStories: ['Onboarding', 'User authentication', 'Main features', 'Push notifications', 'Settings'],
                integrations: ['Firebase', 'RevenueCat'],
                aiFeatures: ['Personalization'],
                pageCount: 12,
                customComponents: 18
            }
        };
    }
    
    /**
     * Start the setup wizard
     */
    async start() {
        console.clear();
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║       🚀 Team Leader System v4.0 - Terminal Setup            ║
╚═══════════════════════════════════════════════════════════════╝

Welcome! Let's set up your project. Everything happens right here 
in the terminal - just copy and paste commands.

📋 Quick Start Options:
`);
        
        // Show quick start templates
        console.log("1. Quick setup with template:");
        Object.keys(this.templates).forEach(type => {
            console.log(`   await setup.quickStart("${type}")`);
        });
        
        console.log(`
2. Custom setup:
   await setup.configure({
       name: "my-app",
       type: "webapp",
       userStories: ["story 1", "story 2"],
       integrations: ["stripe", "slack"]
   })

3. Add API keys (optional but recommended):
   await setup.setKey("openai", "sk-...")
   await setup.setKey("google", "...")

📌 Current Status:`);
        
        this.showStatus();
        
        // Make setup methods available globally
        window.setup = this;
        
        console.log(`
Ready! Use the commands above to configure your project.
Type 'setup.help()' for more options.
`);
        
        return this;
    }
    
    /**
     * Quick start with a template
     */
    async quickStart(templateName) {
        if (!this.templates[templateName]) {
            console.error(`❌ Unknown template: ${templateName}`);
            console.log(`Available templates: ${Object.keys(this.templates).join(', ')}`);
            return false;
        }
        
        console.log(`\n🎯 Using ${templateName} template...`);
        
        // Generate project name
        const projectName = `my-${templateName}-${Date.now().toString(36)}`;
        
        // Apply template
        const template = this.templates[templateName];
        this.config = {
            projectName,
            projectType: template.projectType,
            description: `${templateName} application built with Team Leader System`,
            requirements: { ...template },
            apiKeys: {},
            complexity: null,
            teamComposition: null
        };
        
        // Calculate complexity
        this.config.complexity = this.assessComplexity(this.config.requirements);
        
        // Show results
        console.log(`
✅ Project configured!

📊 Project: ${projectName}
📈 Complexity: ${this.config.complexity.level} (${this.config.complexity.score.toFixed(1)}/100)
👥 Estimated team size: ${this.config.complexity.juniorsPerTeam * 9 + 9} agents

Next steps:
1. (Optional) Add API keys for cost savings:
   await setup.setKey("openai", "sk-...")
   await setup.setKey("google", "...")

2. Initialize the system:
   await setup.initialize()
`);
        
        return true;
    }
    
    /**
     * Custom configuration
     */
    async configure(options) {
        console.log("\n⚙️ Configuring project...");
        
        this.config = {
            projectName: options.name || `project-${Date.now().toString(36)}`,
            projectType: options.type || 'webapp',
            description: options.description || 'Custom project',
            requirements: {
                userStories: options.userStories || [],
                integrations: options.integrations || [],
                aiFeatures: options.aiFeatures || [],
                pageCount: options.pageCount || 10,
                customComponents: options.customComponents || 10
            },
            apiKeys: {},
            complexity: null,
            teamComposition: null
        };
        
        // Calculate complexity
        this.config.complexity = this.assessComplexity(this.config.requirements);
        
        console.log("✅ Configuration complete!");
        this.showStatus();
        
        return true;
    }
    
    /**
     * Set API key
     */
    async setKey(provider, key) {
        const validProviders = ['openai', 'google', 'anthropic'];
        
        if (!validProviders.includes(provider)) {
            console.error(`❌ Unknown provider: ${provider}`);
            console.log(`Valid providers: ${validProviders.join(', ')}`);
            return false;
        }
        
        this.config.apiKeys[provider] = key;
        console.log(`✅ ${provider} API key configured`);
        
        // If we have an API Key Manager, use it
        if (window.APIKeyManager) {
            this.keyManager = new APIKeyManager();
            await this.keyManager.setKey(provider, key);
        }
        
        return true;
    }
    
    /**
     * Show current status
     */
    showStatus() {
        const configured = !!this.config.projectName;
        const hasKeys = Object.keys(this.config.apiKeys).length > 0;
        
        console.log(`
📊 Configuration Status:
- Project: ${configured ? `✅ ${this.config.projectName}` : '❌ Not configured'}
- Type: ${this.config.projectType || 'Not set'}
- Complexity: ${this.config.complexity ? `${this.config.complexity.level}` : 'Not calculated'}
- API Keys: ${hasKeys ? `✅ ${Object.keys(this.config.apiKeys).length} configured` : '⚠️ None (will use fallback models)'}
`);
        
        if (!configured) {
            console.log("💡 Use quickStart() or configure() to set up your project");
        } else if (!this.system) {
            console.log("💡 Ready to initialize() when you are!");
        } else {
            console.log("🚀 System is running!");
        }
    }
    
    /**
     * Initialize the Team Leader System
     */
    async initialize() {
        if (!this.config.projectName) {
            console.error("❌ No project configured. Use quickStart() or configure() first.");
            return false;
        }
        
        if (!window.TeamLeaderSystem) {
            console.error("❌ Team Leader System not loaded. Cannot initialize.");
            return false;
        }
        
        console.log("\n🚀 Initializing Team Leader System...");
        
        // Create system instance
        this.system = new TeamLeaderSystem(this.config.projectName);
        
        // Initialize with configuration
        const result = await this.system.initializeProject(this.config.requirements);
        
        // Initialize UserInteractionProcessor if available
        if (window.UserInteractionProcessor) {
            this.processor = new UserInteractionProcessor(this.system);
        }
        
        console.log(`
✅ System initialized successfully!

📊 Project Dashboard: ${this.config.projectName}/project-status.html
👥 Active Agents: ${result.teamComposition.totalAgents}
📈 Complexity: ${result.complexity.level}

The system is now running. Agents will begin working on your project.

📝 Available commands:
- await setup.approve(item)     - Approve pending items
- await setup.reject(item, reason) - Reject with feedback
- await setup.status()          - Check project status
- await setup.agents()          - List all agents
- await setup.metrics()         - View efficiency metrics
`);
        
        // Make system available globally
        window.system = this.system;
        
        return result;
    }
    
    /**
     * Approve a pending item
     */
    async approve(item, conditions = null) {
        if (!this.system) {
            console.error("❌ System not initialized. Run setup.initialize() first");
            return false;
        }
        
        if (!this.processor) {
            console.error("❌ UserInteractionProcessor not available");
            return false;
        }
        
        const result = await this.processor.approveItem(item, conditions);
        if (result) {
            console.log(`✅ Approved: ${item}`);
            if (conditions) {
                console.log(`   Conditions: ${conditions}`);
            }
        } else {
            console.error(`❌ Failed to approve: ${item}`);
        }
        
        return result;
    }
    
    /**
     * Reject a pending item
     */
    async reject(item, reason) {
        if (!this.system) {
            console.error("❌ System not initialized. Run setup.initialize() first");
            return false;
        }
        
        if (!this.processor) {
            console.error("❌ UserInteractionProcessor not available");
            return false;
        }
        
        const result = await this.processor.rejectItem(item, reason);
        if (result) {
            console.log(`❌ Rejected: ${item}`);
            console.log(`   Reason: ${reason}`);
        } else {
            console.error(`❌ Failed to reject: ${item}`);
        }
        
        return result;
    }
    
    /**
     * List pending approvals
     */
    async pending() {
        if (!this.system) {
            console.error("❌ System not initialized. Run setup.initialize() first");
            return [];
        }
        
        if (!this.processor) {
            console.error("❌ UserInteractionProcessor not available");
            return [];
        }
        
        const pending = await this.processor.listPendingApprovals();
        
        if (pending.length === 0) {
            console.log("✅ No pending approvals!");
        } else {
            console.log(`\n📋 Pending Approvals (${pending.length}):\n`);
            pending.forEach((item, index) => {
                console.log(`${index + 1}. ${item.title}`);
                console.log(`   ID: ${item.id}`);
                console.log(`   Team: ${item.team}`);
                console.log(`   Created: ${item.created}\n`);
            });
            
            console.log("To approve: await setup.approve('ID')");
            console.log("To reject: await setup.reject('ID', 'reason')");
        }
        
        return pending;
    }
    
    /**
     * Check project status
     */
    async status() {
        if (!this.system) {
            this.showStatus();
            return;
        }
        
        const metrics = this.system.getSystemMetrics();
        const activeAgents = Array.from(this.system.agents.values())
            .filter(a => a.status === 'active').length;
        
        console.log(`
📊 Project Status: ${this.config.projectName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏃 Sprint: ${this.system.currentSprint}
👥 Agents: ${activeAgents}/${this.system.agents.size} active
📈 Progress: ${metrics.completedTasks}/${metrics.totalTasks} tasks
💰 Cost: $${metrics.totalCost?.toFixed(2) || '0.00'}
⚡ Efficiency: ${metrics.averageEfficiency?.toFixed(2) || '0.00'}:1

Dashboard: ${this.config.projectName}/project-status.html
`);
    }
    
    /**
     * List all agents
     */
    async agents() {
        if (!this.system) {
            console.error("❌ System not initialized. Run setup.initialize() first");
            return;
        }
        
        const agents = Array.from(this.system.agents.values());
        const byTeam = {};
        
        agents.forEach(agent => {
            const team = agent.team || 'Other';
            if (!byTeam[team]) byTeam[team] = [];
            byTeam[team].push(agent);
        });
        
        console.log(`\n👥 Active Agents (${agents.length}):\n`);
        
        Object.entries(byTeam).forEach(([team, teamAgents]) => {
            console.log(`${team} Team:`);
            teamAgents.forEach(agent => {
                const status = agent.status === 'active' ? '🟢' : '⭕';
                console.log(`  ${status} ${agent.name} (${agent.model})`);
            });
            console.log('');
        });
    }
    
    /**
     * Send feedback to an agent
     */
    async feedback(agentName, message) {
        if (!this.system) {
            console.error("❌ System not initialized. Run setup.initialize() first");
            return false;
        }
        
        // Create feedback file
        const timestamp = Date.now().toString(36);
        const target = agentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const feedbackPath = `${this.system.projectName}/communications/feedback/FB-${timestamp}_${target}.md`;
        
        const content = `# Feedback for ${target}

**From**: Human User
**Time**: ${new Date().toISOString()}
**Message**: ${message}

## Context
This feedback was provided through the Terminal Setup Wizard.

## Action Required
Please review and incorporate this feedback into your work.
`;
        
        try {
            if (window.fs && window.fs.writeFile) {
                await window.fs.writeFile(feedbackPath, content);
                console.log("✅ Feedback sent successfully");
                return true;
            }
        } catch (error) {
            console.error("❌ Failed to send feedback:", error.message);
        }
        
        return false;
    }
    
    /**
     * Make a decision
     */
    async decide(option) {
        console.log(`\n✅ Decision made: Option ${option}`);
        // This would integrate with decision points
        return true;
    }
    
    /**
     * Show help
     */
    help() {
        console.log(`
📚 Team Leader System - Terminal Commands

🚀 Setup Commands:
- setup.quickStart("webapp")     - Start with a template
- setup.configure({...})         - Custom configuration
- setup.setKey(provider, key)    - Add API key
- setup.initialize()             - Start the system

📝 Interaction Commands:
- setup.approve(item)            - Approve pending work
- setup.reject(item, reason)     - Reject with feedback
- setup.pending()                - List pending approvals
- setup.feedback(agent, msg)     - Send feedback
- setup.decide(option)           - Make decisions

📊 Monitoring Commands:
- setup.status()                 - Project status
- setup.agents()                 - List all agents
- setup.metrics()                - Efficiency metrics
- setup.showStatus()             - Configuration status

💡 Examples:
await setup.quickStart("webapp")
await setup.setKey("openai", "sk-...")
await setup.initialize()
await setup.pending()
await setup.approve("APR-20240315-123456")
`);
    }
    
    /**
     * Get efficiency metrics
     */
    async metrics() {
        if (!this.system) {
            console.error("❌ System not initialized. Run setup.initialize() first");
            return false;
        }
        
        const metrics = this.system.getSystemMetrics();
        const cost = metrics.totalCost || 0;
        
        console.log(`
📈 Efficiency Metrics:
- Token Usage: ${(metrics.totalTokensUsed / 1000).toFixed(1)}k tokens
- Average Efficiency: ${metrics.averageEfficiency.toFixed(2)}:1
- Estimated Cost: $${cost.toFixed(2)}
- Task Completion: ${metrics.completedTasks}/${metrics.totalTasks}
- Active Utilization: ${((metrics.activeAgents / metrics.totalAgents) * 100).toFixed(0)}%
`);
        
        return metrics;
    }
    
    /**
     * Calculate complexity (same as main system)
     */
    assessComplexity(requirements) {
        const factors = {
            userStories: (requirements.userStories?.length || 0) * 0.1,
            integrations: (requirements.integrations?.length || 0) * 0.3,
            aiFeatures: (requirements.aiFeatures?.length || 0) * 0.4,
            pages: (requirements.pageCount || 0) * 0.05,
            customComponents: (requirements.customComponents || 0) * 0.15
        };
        
        const score = Object.values(factors).reduce((sum, val) => sum + val, 0);
        
        let level, juniorsPerTeam;
        if (score < 10) {
            level = "SMALL";
            juniorsPerTeam = 1;
        } else if (score < 25) {
            level = "MEDIUM";
            juniorsPerTeam = 2;
        } else {
            level = "LARGE";
            juniorsPerTeam = 3;
        }
        
        return {
            score: Math.min(score, 100),
            level,
            juniorsPerTeam,
            factors
        };
    }
}

// Make available globally
window.TerminalSetupWizard = TerminalSetupWizard;

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalSetupWizard;
}

// Auto-start message
console.log(`
✨ Terminal Setup Wizard loaded!

To begin:
const setup = new TerminalSetupWizard();
await setup.start();

Or quick start:
await new TerminalSetupWizard().start();
`);