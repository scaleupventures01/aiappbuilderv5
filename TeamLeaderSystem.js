/**
 * TeamLeaderSystem.js - Main system orchestrator
 * Coordinates all modules and agents in the Team Leader System
 */

const SprintManager = require('./lib/SprintManager');
const QualityEnforcer = require('./lib/QualityEnforcer');
const CostReporter = require('./lib/CostReporter');
const UserInteractionProcessor = require('./lib/UserInteractionProcessor');
const CommunicationMonitor = require('./lib/CommunicationMonitor');
const ModelSelectorIntegration = require('./lib/ModelSelectorIntegration');
const DashboardGenerator = require('./lib/DashboardGenerator');
const MultiModelAPIManager = require('./lib/MultiModelAPIManager');
const AgentPromptLibrary = require('./lib/AgentPromptLibrary');
const APIKeyManager = require('./lib/APIKeyManager');
const SetupWizard = require('./lib/SetupWizard');

class TeamLeaderSystem {
    constructor(projectName = 'default-project') {
        this.projectName = projectName;
        this.projectPath = projectName;
        
        // Initialize modules with proper references
        this.modules = {
            sprintManager: new SprintManager(this),
            qualityEnforcer: new QualityEnforcer(this),
            costReporter: new CostReporter(this),
            userInteractionProcessor: new UserInteractionProcessor(this),
            communicationMonitor: new CommunicationMonitor(this.projectPath, this),
            modelSelector: new ModelSelectorIntegration(),
            dashboardGenerator: new DashboardGenerator(this.projectName),
            apiManager: new MultiModelAPIManager(),
            promptLibrary: new AgentPromptLibrary(),
            keyManager: new APIKeyManager()
        };
        
        // System state
        this.isInitialized = false;
        this.isActive = false;
        this.currentSprint = null;
        
        // Agent and task management
        this.agents = new Map();
        this.tasks = new Map();
        this.handoffs = new Map();
        this.approvals = new Map();
        
        // File system reference
        this.fs = typeof window !== 'undefined' ? window.fs : null;
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.createAgent = this.createAgent.bind(this);
        this.assignTask = this.assignTask.bind(this);
        this.processHandoff = this.processHandoff.bind(this);
        this.processApproval = this.processApproval.bind(this);
    }
    
    /**
     * Initialize the system and all modules
     */
    async initialize() {
        try {
            console.log(`\n🚀 Initializing Team Leader System for project: ${this.projectName}`);
            
            // Create project directory structure
            await this.createProjectStructure();
            
            // Initialize API key manager first
            if (this.modules.keyManager) {
                await this.modules.keyManager.initialize();
                console.log("✅ API Key Manager initialized");
            }
            
            // Initialize multi-model API manager
            if (this.modules.apiManager) {
                await this.modules.apiManager.initialize(this.modules.keyManager);
                console.log("✅ Multi-Model API Manager initialized");
            }
            
            // Initialize model selector
            if (this.modules.modelSelector) {
                await this.modules.modelSelector.initialize();
                console.log("✅ Model Selector initialized");
            }
            
            // Initialize sprint manager
            if (this.modules.sprintManager) {
                await this.modules.sprintManager.initialize();
                console.log("✅ Sprint Manager initialized");
            }
            
            // Initialize cost reporter
            if (this.modules.costReporter) {
                await this.modules.costReporter.initialize();
                console.log("✅ Cost Reporter initialized");
            }
            
            // Initialize quality enforcer
            if (this.modules.qualityEnforcer) {
                await this.modules.qualityEnforcer.initialize();
                console.log("✅ Quality Enforcer initialized");
            }
            
            // Initialize dashboard generator
            if (this.modules.dashboardGenerator) {
                await this.modules.dashboardGenerator.initializeDashboard();
                console.log("✅ Dashboard Generator initialized");
            }
            
            // Initialize communication monitor
            if (this.modules.communicationMonitor) {
                await this.modules.communicationMonitor.start();
                console.log("✅ Communication Monitor started");
            }
            
            // Initialize user interaction processor
            if (this.modules.userInteractionProcessor) {
                await this.modules.userInteractionProcessor.initialize();
                console.log("✅ User Interaction Processor initialized");
            }
            
            this.isInitialized = true;
            console.log("\n✅ Team Leader System initialization complete!");
            
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to initialize Team Leader System: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Create project directory structure
     */
    async createProjectStructure() {
        if (!this.fs) {
            console.warn("⚠️  File system not available, skipping directory creation");
            return;
        }
        
        try {
            const dirs = [
                this.projectPath,
                `${this.projectPath}/.teamleader`,
                `${this.projectPath}/.teamleader/agents`,
                `${this.projectPath}/.teamleader/tasks`,
                `${this.projectPath}/.teamleader/handoffs`,
                `${this.projectPath}/.teamleader/approvals`,
                `${this.projectPath}/.teamleader/sprints`,
                `${this.projectPath}/.teamleader/reports`,
                `${this.projectPath}/.teamleader/dashboard`
            ];
            
            for (const dir of dirs) {
                await this.fs.mkdir(dir, { recursive: true });
            }
            
            // Create initial config file
            const config = {
                projectName: this.projectName,
                version: '4.0',
                createdAt: new Date().toISOString(),
                modules: Object.keys(this.modules)
            };
            
            await this.fs.writeFile(
                `${this.projectPath}/.teamleader/config.json`,
                JSON.stringify(config, null, 2)
            );
            
            console.log("✅ Project structure created");
            
        } catch (error) {
            console.error(`❌ Failed to create project structure: ${error.message}`);
        }
    }
    
    /**
     * Start the system
     */
    async start() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        this.isActive = true;
        console.log(`\n🎯 Team Leader System started for project: ${this.projectName}`);
        
        // Start monitoring
        if (this.modules.communicationMonitor) {
            this.modules.communicationMonitor.start();
        }
        
        return true;
    }
    
    /**
     * Stop the system
     */
    async stop() {
        this.isActive = false;
        
        // Stop monitoring
        if (this.modules.communicationMonitor) {
            this.modules.communicationMonitor.stop();
        }
        
        // Save state
        await this.saveState();
        
        console.log(`\n⏹️  Team Leader System stopped for project: ${this.projectName}`);
        return true;
    }
    
    /**
     * Create a new agent
     */
    async createAgent(agentConfig) {
        try {
            const agent = {
                id: agentConfig.id,
                name: agentConfig.name,
                team: agentConfig.team,
                seniority: agentConfig.seniority,
                model: agentConfig.model || 'claude-3-sonnet-20240229',
                systemPrompt: agentConfig.systemPrompt,
                status: 'idle',
                createdAt: new Date().toISOString(),
                tasks: [],
                handoffs: []
            };
            
            this.agents.set(agent.id, agent);
            
            // Save agent to file system
            if (this.fs) {
                await this.fs.writeFile(
                    `${this.projectPath}/.teamleader/agents/${agent.id}.json`,
                    JSON.stringify(agent, null, 2)
                );
            }
            
            console.log(`✅ Created agent: ${agent.name} (${agent.id})`);
            return agent;
            
        } catch (error) {
            console.error(`❌ Failed to create agent: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Assign a task to an agent
     */
    async assignTask(taskConfig) {
        try {
            const task = {
                id: taskConfig.id,
                title: taskConfig.title,
                description: taskConfig.description,
                assignedTo: taskConfig.assignedTo,
                status: 'assigned',
                priority: taskConfig.priority || 'medium',
                createdAt: new Date().toISOString(),
                estimatedPoints: taskConfig.estimatedPoints || 5
            };
            
            this.tasks.set(task.id, task);
            
            // Update agent
            const agent = this.agents.get(task.assignedTo);
            if (agent) {
                agent.tasks.push(task.id);
                agent.status = 'busy';
            }
            
            // Save task to file system
            if (this.fs) {
                await this.fs.writeFile(
                    `${this.projectPath}/.teamleader/tasks/${task.id}.json`,
                    JSON.stringify(task, null, 2)
                );
            }
            
            console.log(`✅ Assigned task: ${task.title} to ${task.assignedTo}`);
            return task;
            
        } catch (error) {
            console.error(`❌ Failed to assign task: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Process a handoff between agents
     */
    async processHandoff(handoffData) {
        try {
            const handoff = {
                id: handoffData.id,
                fromAgent: handoffData.fromAgent,
                toAgent: handoffData.toAgent,
                taskId: handoffData.taskId,
                reason: handoffData.reason,
                data: handoffData.data,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            this.handoffs.set(handoff.id, handoff);
            
            // Save handoff to file system
            if (this.fs) {
                await this.fs.writeFile(
                    `${this.projectPath}/.teamleader/handoffs/${handoff.id}.json`,
                    JSON.stringify(handoff, null, 2)
                );
            }
            
            console.log(`✅ Processed handoff: ${handoff.fromAgent} → ${handoff.toAgent}`);
            return handoff;
            
        } catch (error) {
            console.error(`❌ Failed to process handoff: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Process an approval request
     */
    async processApproval(approvalData) {
        try {
            const approval = {
                id: approvalData.id,
                type: approvalData.type,
                title: approvalData.title,
                description: approvalData.description,
                requestedBy: approvalData.requestedBy,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            this.approvals.set(approval.id, approval);
            
            // Save approval to file system
            if (this.fs) {
                await this.fs.writeFile(
                    `${this.projectPath}/.teamleader/approvals/${approval.id}.json`,
                    JSON.stringify(approval, null, 2)
                );
            }
            
            console.log(`✅ Processed approval request: ${approval.title}`);
            return approval;
            
        } catch (error) {
            console.error(`❌ Failed to process approval: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Save system state
     */
    async saveState() {
        if (!this.fs) return;
        
        try {
            const state = {
                projectName: this.projectName,
                isActive: this.isActive,
                currentSprint: this.currentSprint,
                agents: Array.from(this.agents.values()),
                tasks: Array.from(this.tasks.values()),
                handoffs: Array.from(this.handoffs.values()),
                approvals: Array.from(this.approvals.values()),
                lastSaved: new Date().toISOString()
            };
            
            await this.fs.writeFile(
                `${this.projectPath}/.teamleader/state.json`,
                JSON.stringify(state, null, 2)
            );
            
        } catch (error) {
            console.error(`❌ Failed to save state: ${error.message}`);
        }
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            projectName: this.projectName,
            isInitialized: this.isInitialized,
            isActive: this.isActive,
            currentSprint: this.currentSprint,
            agentCount: this.agents.size,
            taskCount: this.tasks.size,
            handoffCount: this.handoffs.size,
            approvalCount: this.approvals.size,
            modules: Object.keys(this.modules).map(name => ({
                name,
                loaded: !!this.modules[name]
            }))
        };
    }
    
    /**
     * Get module by name
     */
    getModule(name) {
        return this.modules[name];
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamLeaderSystem;
}

// Make available globally in browser/Claude Code
if (typeof window !== 'undefined') {
    window.TeamLeaderSystem = TeamLeaderSystem;
}

console.log("Team Leader System v4.0 - Main orchestrator loaded!");
console.log("Usage: const system = new TeamLeaderSystem('project-name');");
console.log("       await system.initialize();");
