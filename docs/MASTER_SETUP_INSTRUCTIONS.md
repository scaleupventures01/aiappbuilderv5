# Team Leader System v4.0 - Master Setup Instructions

## For Claude Code

Please help me complete the Team Leader System v4.0 setup by following these steps:

### Step 1: Verify Existing Files

Check that these files exist and are complete:
- `/setup.js`
- `/TeamLeaderSystem.js`
- `/lib/AgentPromptLibrary.js`
- `/lib/MultiModelAPIManager.js`
- `/lib/DashboardGenerator.js`
- `/lib/ModelSelectorIntegration.js`
- `/lib/CommunicationMonitor.js`
- `/lib/UserInteractionProcessor.js`
- `/lib/CostReporter.js`
- `/lib/SprintManager.js`
- `/lib/QualityEnforcer.js`

### Step 2: Create Missing Files

1. **Create `/lib/TerminalSetupWizard.js`** - Copy the code from the TerminalSetupWizard.js artifact
2. **Create `/lib/APIKeyManager.js`** - Copy the code from the APIKeyManager.js artifact
3. **Create `/node-wrapper.js`** - Copy the code from the node-wrapper.js artifact

### Step 3: Create Agent Prompt Directory

Create the following directory structure with agent prompts:

```
/agent-prompts/
├── senior-team-leader.md
├── junior-team-leader.md
├── senior-requirements.md
├── junior-requirements.md
├── senior-architect.md
├── junior-architect.md
├── senior-database.md
├── junior-database.md
├── senior-security.md
├── junior-security.md
├── senior-design.md
├── junior-design.md
├── senior-content.md
├── junior-content.md
├── senior-development.md
├── junior-development.md
├── senior-validation.md
├── junior-validation.md
├── senior-orchestrator.md
└── junior-orchestrator.md
```

### Step 4: Update the Main Setup File

Update `/setup.js` to include the new components in the loading sequence:

```javascript
// Add to loadManagementComponents function:
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
}
```

### Step 5: Create Test Script

Create a `/test-complete-system.js` file that verifies everything works:

```javascript
// test-complete-system.js
console.log("Testing Team Leader System v4.0...\n");

// Test loading in Node.js
require('./node-wrapper.js');

// The wrapper will handle everything
```

### Step 6: Create Package.json (Optional)

Create a `package.json` for easier setup:

```json
{
  "name": "team-leader-system",
  "version": "4.0.0",
  "description": "Hierarchical AI Agent Orchestration System",
  "main": "node-wrapper.js",
  "scripts": {
    "start": "node node-wrapper.js",
    "test": "node test-complete-system.js",
    "setup": "node node-wrapper.js"
  },
  "keywords": ["ai", "agents", "orchestration"],
  "author": "Team Leader System",
  "license": "MIT"
}
```

### Step 7: Final Verification

After creating all files, please:

1. List all files in the project directory
2. Verify each component can be loaded
3. Test the node-wrapper.js runs without errors
4. Confirm the Terminal Setup Wizard starts properly

## Expected Result

When complete, running `node node-wrapper.js` should:
1. Load all components successfully
2. Start the Terminal Setup Wizard
3. Allow project configuration
4. Initialize the Team Leader System
5. Create project structure and start AI agents

Please implement these steps and let me know if any issues arise!