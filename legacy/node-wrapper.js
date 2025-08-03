// node-wrapper.js - Node.js wrapper for Team Leader System v4.0

/**
 * This wrapper allows the Team Leader System to run in Node.js
 * by providing browser-like APIs and loading all components
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper to convert readline question to promise
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Mock window object with necessary APIs
global.window = {
    fs: {
        readFile: async (filepath, options = {}) => {
            try {
                const content = await fs.readFile(filepath, options.encoding || 'utf8');
                return options.encoding ? content : Buffer.from(content);
            } catch (error) {
                throw new Error(`Failed to read ${filepath}: ${error.message}`);
            }
        },
        
        writeFile: async (filepath, content) => {
            try {
                // Ensure directory exists
                const dir = path.dirname(filepath);
                await fs.mkdir(dir, { recursive: true });
                await fs.writeFile(filepath, content);
            } catch (error) {
                throw new Error(`Failed to write ${filepath}: ${error.message}`);
            }
        },
        
        readdir: async (dirpath) => {
            try {
                return await fs.readdir(dirpath);
            } catch (error) {
                throw new Error(`Failed to read directory ${dirpath}: ${error.message}`);
            }
        },
        
        mkdir: async (dirpath, options = {}) => {
            try {
                await fs.mkdir(dirpath, { recursive: true });
            } catch (error) {
                throw new Error(`Failed to create directory ${dirpath}: ${error.message}`);
            }
        },
        
        exists: async (filepath) => {
            try {
                await fs.access(filepath);
                return true;
            } catch {
                return false;
            }
        }
    },
    
    // Mock fetch for API calls (requires node-fetch for full functionality)
    fetch: async (url, options) => {
        console.warn(`Mock fetch called for ${url}. Install node-fetch for real API calls.`);
        return {
            ok: true,
            json: async () => ({ mocked: true }),
            text: async () => 'Mocked response'
        };
    },
    
    // Add other window properties as needed
    location: {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000'
    },
    
    console: console,
    
    // Event system
    addEventListener: () => {},
    removeEventListener: () => {},
    
    // Timers
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval
};

// Load all components
async function loadComponents() {
    console.log("\n🔧 Loading Team Leader System components...\n");
    
    const components = [
        { name: 'AgentPromptLibrary', file: 'lib/AgentPromptLibrary.js' },
        { name: 'MultiModelAPIManager', file: 'lib/MultiModelAPIManager.js' },
        { name: 'DashboardGenerator', file: 'lib/DashboardGenerator.js' },
        { name: 'ModelSelectorIntegration', file: 'lib/ModelSelectorIntegration.js' },
        { name: 'CommunicationMonitor', file: 'lib/CommunicationMonitor.js' },
        { name: 'UserInteractionProcessor', file: 'lib/UserInteractionProcessor.js' },
        { name: 'CostReporter', file: 'lib/CostReporter.js' },
        { name: 'SprintManager', file: 'lib/SprintManager.js' },
        { name: 'QualityEnforcer', file: 'lib/QualityEnforcer.js' },
        { name: 'APIKeyManager', file: 'lib/APIKeyManager.js' },
        { name: 'TerminalSetupWizard', file: 'lib/TerminalSetupWizard.js' },
        { name: 'TeamLeaderSystem', file: 'TeamLeaderSystem.js' }
    ];
    
    for (const component of components) {
        try {
            const code = await fs.readFile(component.file, 'utf8');
            
            // Evaluate in global context
            eval(code);
            
            // Verify component loaded
            if (global.window[component.name]) {
                console.log(`✅ Loaded ${component.name}`);
            } else {
                console.warn(`⚠️  ${component.name} may not have loaded correctly`);
            }
        } catch (error) {
            console.error(`❌ Failed to load ${component.name}: ${error.message}`);
            if (component.name === 'TeamLeaderSystem' || component.name === 'TerminalSetupWizard') {
                throw error; // Critical components
            }
        }
    }
    
    console.log("\n✅ All components loaded!\n");
}

// Interactive CLI
async function startCLI() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     🚀 Team Leader System v4.0 - Node.js Edition             ║
╚═══════════════════════════════════════════════════════════════╝

Welcome! This is the Node.js wrapper for Team Leader System.
`);
    
    // Check for existing projects
    try {
        const dirs = await fs.readdir('.');
        const projects = [];
        
        for (const dir of dirs) {
            const configPath = path.join(dir, '.teamleader', 'config.json');
            try {
                await fs.access(configPath);
                projects.push(dir);
            } catch {
                // Not a project directory
            }
        }
        
        if (projects.length > 0) {
            console.log(`\n📂 Found existing projects:`);
            projects.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
            console.log(`\nTo resume: node node-wrapper.js resume ${projects[0]}`);
        }
    } catch (error) {
        // Ignore errors
    }
    
    // Start the setup wizard
    const setupWizard = new global.window.TerminalSetupWizard();
    await setupWizard.start();
    
    // Keep the process alive for async operations
    process.stdin.resume();
}

// Main execution
async function main() {
    try {
        // Load all components
        await loadComponents();
        
        // Check command line arguments
        const args = process.argv.slice(2);
        
        if (args[0] === 'resume' && args[1]) {
            // Resume existing project
            console.log(`\n📂 Resuming project: ${args[1]}\n`);
            
            const system = new global.window.TeamLeaderSystem(args[1]);
            const configPath = path.join(args[1], '.teamleader', 'config.json');
            
            try {
                const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
                await system.resumeProject(config);
                console.log("✅ Project resumed successfully!");
            } catch (error) {
                console.error(`❌ Failed to resume project: ${error.message}`);
            }
        } else {
            // Start interactive CLI
            await startCLI();
        }
        
    } catch (error) {
        console.error(`\n❌ Fatal error: ${error.message}\n`);
        process.exit(1);
    }
}

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down Team Leader System...');
    rl.close();
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('\n❌ Uncaught error:', error);
    process.exit(1);
});

// Run the system
main().catch(console.error);