// init.js - Simple Node.js initialization for Team Leader System v4.0

const fs = require('fs');
const path = require('path');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        🚀 Team Leader System v4.0 - Node.js Mode            ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Mock console.clear for Node.js
global.console.clear = () => {
    console.log('\n'.repeat(50));
};

// Load SetupWizard directly
const setupWizardPath = path.join(__dirname, 'lib', 'SetupWizard.js');
const setupWizardCode = fs.readFileSync(setupWizardPath, 'utf8');

// Mock window object to capture the export
global.window = {
    SetupWizard: null
};

// Execute the code to define the class
eval(setupWizardCode);

// Get the class from the window mock or global scope
const SetupWizard = global.window.SetupWizard || global.SetupWizard;

// Verify SetupWizard is defined
if (!SetupWizard) {
    console.error("❌ SetupWizard class not found");
    process.exit(1);
}

// Create wizard instance
const wizard = new SetupWizard();

console.log("✅ SetupWizard loaded and ready!");
console.log("\n🎯 Quick Start:");
console.log("---------------------");
console.log("wizard.start()        // Start the setup wizard");
console.log("wizard.select(1)      // Select template 1 after starting");
console.log("\n💡 Wizard is available as 'wizard' variable");

// Make wizard globally available
global.wizard = wizard;

// Start wizard automatically
wizard.start();