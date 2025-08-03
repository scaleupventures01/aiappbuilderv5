// quick-test.js - Quick test to verify all components load

console.log("🧪 Testing Team Leader System components...\n");

const components = [
    { name: 'AgentPromptLibrary', path: './lib/AgentPromptLibrary.js' },
    { name: 'MultiModelAPIManager', path: './lib/MultiModelAPIManager.js' },
    { name: 'DashboardGenerator', path: './lib/DashboardGenerator.js' },
    { name: 'ModelSelectorIntegration', path: './lib/ModelSelectorIntegration.js' },
    { name: 'CommunicationMonitor', path: './lib/CommunicationMonitor.js' },
    { name: 'UserInteractionProcessor', path: './lib/UserInteractionProcessor.js' },
    { name: 'CostReporter', path: './lib/CostReporter.js' },
    { name: 'SprintManager', path: './lib/SprintManager.js' },
    { name: 'QualityEnforcer', path: './lib/QualityEnforcer.js' },
    { name: 'TerminalSetupWizard', path: './lib/TerminalSetupWizard.js' },
    { name: 'APIKeyManager', path: './lib/APIKeyManager.js' },
    { name: 'PerformanceBenchmarkingDashboard', path: './lib/PerformanceBenchmarkingDashboard.js' },
    { name: 'DynamicBudgetManager', path: './lib/DynamicBudgetManager.js' },
    { name: 'CostPredictionEngine', path: './lib/CostPredictionEngine.js' },
    { name: 'WebhookManager', path: './lib/WebhookManager.js' },
    { name: 'AdvancedRateLimitManager', path: './lib/AdvancedRateLimitManager.js' },
    { name: 'ModelRecommendationEngine', path: './lib/ModelRecommendationEngine.js' },
    { name: 'TeamLeaderSystem', path: './TeamLeaderSystem.js' }
];

let passed = 0;
let failed = 0;

// Mock window for testing
global.window = {
    fs: require('fs').promises,
    console: console
};

for (const component of components) {
    try {
        // Check if file exists
        require(component.path);
        console.log(`✅ ${component.name} - OK`);
        passed++;
    } catch (error) {
        console.log(`❌ ${component.name} - FAILED`);
        console.log(`   ${error.message}\n`);
        failed++;
    }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log("\n🎉 All components loaded successfully!");
    console.log("\nRun 'node node-wrapper.js' to start the system");
} else {
    console.log("\n⚠️  Some components failed to load.");
    console.log("Create the missing files and try again.");
}