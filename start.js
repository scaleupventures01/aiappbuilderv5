/**
 * start.js - Simple Project Initiation for Team Leader System v4.0
 * 
 * This is the main entry point for users to start their projects.
 * Focuses on user experience rather than technical setup.
 */

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

💡 Try running: node start.js
📚 For help, check the documentation
`);
        process.exit(1);
    }
}

// Run the main function
main(); 