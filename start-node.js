/**
 * start-node.js - Node.js compatible entry point for Team Leader System v4.0
 * 
 * This wrapper provides a mock window object to make the system work in Node.js
 */

// Mock window object for Node.js compatibility
global.window = {
    fs: require('fs').promises,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval
};

// Mock document for any DOM references
global.document = {
    createElement: () => ({}),
    getElementById: () => null,
    querySelector: () => null
};

// Load environment variables
require('dotenv').config();

// Import the ProjectStarter
const ProjectStarter = require('./lib/ProjectStarter');

async function main() {
    console.clear();
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🚀 Welcome to Team Leader System v4.0!     ║
║                                                               ║
║  I'm here to help you build amazing projects with AI agents. ║
║  Just tell me about your project and I'll get started!       ║
╚═══════════════════════════════════════════════════════════════╝
`);

    try {
        // Initialize the project starter
        const starter = new ProjectStarter();
        
        // Start the project initiation process
        await starter.start();
        
    } catch (error) {
        console.error(`
❌ Something went wrong: ${error.message}

💡 Try running: node start-node.js
📚 For help, check the documentation
`);
        process.exit(1);
    }
}

// Run the main function
main(); 