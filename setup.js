// setup.js - Main Entry Point for Team Leader System v4.0

/**
 * Team Leader System v4.0 - Main Setup Entry Point
 * 
 * This is the single file users need to run to start the system.
 * It handles loading all components, checking dependencies, and
 * launching the appropriate initialization flow.
 * 
 * Updated with CommunicationMonitor and UserInteractionProcessor support
 */

(async function() {
    console.clear();
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        🚀 Team Leader System v4.0 - Initializing...          ║
╚═══════════════════════════════════════════════════════════════╝
`);

    // Global namespace for Team Leader System
    window.TLS = {
        version: '4.0',
        components: {},
        status: 'initializing'
    };

    /**
     * Validate Claude Code environment
     */
    function validateEnvironment() {
        console.log("🔍 Checking environment...");
        
        if (typeof window === 'undefined') {
            throw new Error("This system requires a browser-like environment (Claude Code)");
        }
        
        if (!window.fs) {
            console.warn("⚠️  File system (window.fs) not detected. Some features may be limited.");
            console.log("   Running in demo mode.");
            window.TLS.demoMode = true;
        }
        
        console.log("✅ Environment validated\n");
        return true;
    }

    /**
     * Load a script/component with error handling
     */
    async function loadComponent(name, path, validator) {
        try {
            console.log(`📦 Loading ${name}...`);
            
            // In Claude Code, components would be loaded via script tags or imports
            // For now, we'll check if they exist in the global scope
            
            if (validator && validator()) {
                console.log(`✅ ${name} loaded`);
                return true;
            }
            
            // Attempt to load the file
            if (window.fs && window.fs.readFile) {
                try {
                    const code = await window.fs.readFile(path, { encoding: 'utf8' });
                    eval(code); // In production, use proper module loading
                    
                    if (validator && validator()) {
                        console.log(`✅ ${name} loaded`);
                        return true;
                    }
                } catch (readError) {
                    console.warn(`⚠️  Could not read ${path}: ${readError.message}`);
                }
            }
            
            console.warn(`⚠️  ${name} not found. Some features may be limited.`);
            return false;
            
        } catch (error) {
            console.error(`❌ Error loading ${name}: ${error.message}`);
            return false;
        }
    }

    /**
     * Load core components
     */
    async function loadCoreComponents() {
        console.log("\n🔧 Loading core components...\n");
        
        const components = [
            {
                name: 'Agent Prompt Library',
                path: 'lib/AgentPromptLibrary.js',
                validator: () => typeof window.AgentPromptLibrary !== 'undefined',
                critical: true
            },
            {
                name: 'Multi-Model API Manager',
                path: 'lib/MultiModelAPIManager.js',
                validator: () => typeof window.MultiModelAPIManager !== 'undefined',
                critical: true
            },
            {
                name: 'Dashboard Generator',
                path: 'lib/DashboardGenerator.js',
                validator: () => typeof window.DashboardGenerator !== 'undefined',
                critical: false
            },
            {
                name: 'Model Selector Integration',
                path: 'lib/ModelSelectorIntegration.js',
                validator: () => typeof window.ModelSelectorIntegration !== 'undefined' &&
                                typeof window.EnhancedModelSelector !== 'undefined',
                critical: false
            }
        ];
        
        let allLoaded = true;
        for (const component of components) {
            const loaded = await loadComponent(component.name, component.path, component.validator);
            if (!loaded) {
                if (component.critical) {
                    throw new Error(`Critical component ${component.name} failed to load.`);
                }
                allLoaded = false;
            }
        }
        
        if (!allLoaded) {
            console.log("\n⚠️  Some core components not loaded. System will have limited functionality.");
            console.log("Please ensure all files are present.");
        }
        
        return true;
    }

    /**
     * Load management components
     */
    async function loadManagementComponents() {
        console.log("\n🔧 Loading management components...\n");
        
        const components = [
            {
                name: 'API Key Manager',
                path: 'lib/APIKeyManager.js',
                validator: () => typeof window.APIKeyManager !== 'undefined' && 
                                typeof window.APIKeyIntegration !== 'undefined',
                critical: false
            },
            {
                name: 'Terminal Setup Wizard',
                path: 'lib/TerminalSetupWizard.js',
                validator: () => typeof window.TerminalSetupWizard !== 'undefined',
                critical: true
            },
            {
                name: 'Communication Monitor',
                path: 'lib/CommunicationMonitor.js',
                validator: () => typeof window.CommunicationMonitor !== 'undefined',
                critical: false
            },
            {
                name: 'User Interaction Processor',
                path: 'lib/UserInteractionProcessor.js',
                validator: () => typeof window.UserInteractionProcessor !== 'undefined',
                critical: false
            }
        ];
        
        for (const component of components) {
            const loaded = await loadComponent(component.name, component.path, component.validator);
            if (!loaded && component.critical) {
                throw new Error(`Critical component ${component.name} failed to load.`);
            }
        }
        
        return true;
    }

    /**
     * Load main system
     */
    async function loadMainSystem() {
        console.log("\n🎯 Loading main system...\n");
        
        const loaded = await loadComponent(
            'Team Leader System',
            'TeamLeaderSystem.js',
            () => typeof window.TeamLeaderSystem !== 'undefined'
        );
        
        if (!loaded) {
            throw new Error("Failed to load Team Leader System. This is required.");
        }
        
        return true;
    }

    /**
     * Initialize integrations
     */
    async function initializeIntegrations() {
        console.log("\n🔌 Initializing integrations...\n");
        
        // Store references in TLS namespace
        window.TLS.components = {
            AgentPromptLibrary: window.AgentPromptLibrary,
            MultiModelAPIManager: window.MultiModelAPIManager,
            DashboardGenerator: window.DashboardGenerator,
            ModelSelectorIntegration: window.ModelSelectorIntegration,
            EnhancedModelSelector: window.EnhancedModelSelector,
            APIKeyManager: window.APIKeyManager,
            APIKeyIntegration: window.APIKeyIntegration,
            TerminalSetupWizard: window.TerminalSetupWizard,
            TeamLeaderSystem: window.TeamLeaderSystem,
            CommunicationMonitor: window.CommunicationMonitor,
            UserInteractionProcessor: window.UserInteractionProcessor
        };
        
        // Check if API Key Manager is available and integrate it
        if (window.APIKeyManager && window.APIKeyIntegration && window.MultiModelAPIManager) {
            console.log("🔑 API key integration available");
            window.TLS.apiKeyIntegrationAvailable = true;
        }
        
        // Check if Communication Monitor is available
        if (window.CommunicationMonitor) {
            console.log("📡 Communication monitoring available");
            window.TLS.communicationMonitorAvailable = true;
        }
        
        // Check if User Interaction Processor is available
        if (window.UserInteractionProcessor) {
            console.log("🤝 User interaction processing available");
            window.TLS.userInteractionAvailable = true;
        }
        
        console.log("✅ Integrations initialized");
        return true;
    }

    /**
     * Check for existing project
     */
    async function checkExistingProject() {
        console.log("\n🔍 Checking for existing projects...\n");
        
        if (!window.fs || window.TLS.demoMode) {
            return null;
        }
        
        try {
            // Look for .teamleader directories
            const dirs = await window.fs.readdir('.');
            const projects = [];
            
            for (const dir of dirs) {
                try {
                    const configPath = `${dir}/.teamleader/config.json`;
                    const config = await window.fs.readFile(configPath, { encoding: 'utf8' });
                    projects.push({
                        name: dir,
                        config: JSON.parse(config)
                    });
                } catch (e) {
                    // Not a project directory
                }
            }
            
            if (projects.length > 0) {
                console.log(`Found ${projects.length} existing project(s):`);
                projects.forEach((p, i) => {
                    console.log(`${i + 1}. ${p.name}`);
                });
                
                console.log("\nTo resume a project: await setup.resume('project-name')");
                console.log("To start new: await setup.start()");
                
                return projects;
            }
        } catch (error) {
            console.log("No existing projects found.");
        }
        
        return null;
    }

    /**
     * Start the setup wizard
     */
    async function startSetupWizard() {
        console.log("\n🚀 Starting setup wizard...\n");
        
        if (!window.TerminalSetupWizard) {
            throw new Error("Setup wizard not loaded. Cannot continue.");
        }
        
        const wizard = new window.TerminalSetupWizard();
        await wizard.start();
        
        // Make wizard globally available
        window.setup = wizard;
        window.TLS.wizard = wizard;
        
        return wizard;
    }

    /**
     * Resume an existing project
     */
    async function resumeProject(projectName) {
        console.log(`\n📂 Resuming project: ${projectName}\n`);
        
        if (!window.TeamLeaderSystem) {
            throw new Error("Team Leader System not loaded. Cannot resume.");
        }
        
        try {
            const system = new window.TeamLeaderSystem(projectName);
            
            // Load project state
            const statePath = `${projectName}/.teamleader/state.json`;
            const state = await window.fs.readFile(statePath, { encoding: 'utf8' });
            const projectState = JSON.parse(state);
            
            // Restore agents
            for (const agent of projectState.agents) {
                system.agents.set(agent.id, agent);
            }
            
            // Restore tasks
            for (const task of projectState.tasks) {
                system.tasks.set(task.id, task);
            }
            
            // Restore other state
            system.currentSprint = projectState.currentSprint;
            system.handoffs = projectState.handoffs;
            system.isActive = true;
            
            // Start communication monitor if available
            if (system.communicationMonitor) {
                system.communicationMonitor.start();
            }
            
            console.log(`✅ Project loaded: ${projectName}`);
            console.log(`📊 Status: Sprint ${projectState.currentSprint}`);
            console.log(`👥 Agents: ${projectState.agents.length}`);
            console.log(`📋 Tasks: ${projectState.tasks.length}`);
            
            // Make system globally available
            window.system = system;
            window.TLS.system = system;
            
            // Create setup wizard for interaction
            const wizard = new window.TerminalSetupWizard();
            wizard.system = system;
            wizard.config.projectName = projectName;
            
            // Initialize processors
            if (window.UserInteractionProcessor) {
                wizard.processor = new UserInteractionProcessor(system);
            }
            
            window.setup = wizard;
            window.TLS.wizard = wizard;
            
            console.log("\n📝 Available commands:");
            console.log("- await setup.status()     - Check status");
            console.log("- await setup.agents()     - List agents");
            console.log("- await setup.pending()    - View pending approvals");
            console.log("- await setup.approve()    - Approve pending items");
            
            return system;
        } catch (error) {
            console.error(`Failed to resume project: ${error.message}`);
            console.log("Starting fresh setup instead...");
            return await startSetupWizard();
        }
    }

    /**
     * Main setup function
     */
    async function main() {
        try {
            // 1. Validate environment
            validateEnvironment();
            
            // 2. Load core components
            await loadCoreComponents();
            
            // 3. Load management components
            await loadManagementComponents();
            
            // 4. Load main system
            await loadMainSystem();
            
            // 5. Initialize integrations
            await initializeIntegrations();
            
            // 6. Check for existing projects
            const existingProjects = await checkExistingProject();
            
            // 7. Set status
            window.TLS.status = 'ready';
            
            console.log(`
╔═══════════════════════════════════════════════════════════════╗
║            ✅ Team Leader System Ready!                       ║
╚═══════════════════════════════════════════════════════════════╝

Components loaded:
${Object.keys(window.TLS.components).map(c => `  ✅ ${c}`).join('\n')}

${existingProjects ? `\n📂 Found existing projects. See above for resume options.\n` : ''}
🚀 To start a new project:
   await setup.quickStart("webapp")
   
📚 For help:
   setup.help()

💡 All components available in window.TLS.components
`);
            
            // If no existing projects, start wizard automatically
            if (!existingProjects) {
                await startSetupWizard();
            }
            
        } catch (error) {
            console.error(`
❌ Setup failed: ${error.message}

Please ensure all required files are present:
- lib/AgentPromptLibrary.js
- lib/MultiModelAPIManager.js
- lib/TerminalSetupWizard.js
- TeamLeaderSystem.js

Optional components for full functionality:
- lib/CommunicationMonitor.js
- lib/UserInteractionProcessor.js
- lib/DashboardGenerator.js
- lib/APIKeyManager.js

For help, check the documentation or try loading components manually.
`);
            
            window.TLS.status = 'error';
            window.TLS.error = error;
        }
    }

    // Add utility functions to global scope
    window.TLS.resume = resumeProject;
    window.TLS.restart = startSetupWizard;
    window.TLS.loadComponent = loadComponent;
    
    // Run main setup
    await main();
    
})();