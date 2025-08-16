# CRITICAL INSTRUCTIONS FOR CLAUDE - WORKFLOW COMMANDS

## IMPORTANT: How to Handle "orch workflow" Commands

When a user types any of these patterns in your interface:
- `orch workflow run X and then Y`
- `workflow execute X then Y`  
- `run X, Y, Z in parallel then A`
- Any variation with PRD IDs and execution order

### ❌ DO NOT:
- Manually call `orch start` for each PRD
- Implement the PRDs yourself
- Try to orchestrate manually

### ✅ DO THIS INSTEAD:

```javascript
import { ClaudeIntegration } from './orch/lib/orch/claude-integration.mjs';

// When user types a workflow command
const userMessage = "orch workflow run 1.1.3.3 and then 1.1.3.4";

// Check if it's a workflow command
const analysis = ClaudeIntegration.analyzeCommand(userMessage);

if (analysis.isWorkflowCommand) {
  // Execute via the orchestrator
  const result = await ClaudeIntegration.handleWorkflowCommand(
    userMessage,
    { autoConfirm: true } // or false to show confirmation
  );
  
  // The orchestrator handles everything:
  // - Parsing the workflow
  // - Managing dependencies
  // - Running PRDs in parallel/sequence
  // - Invoking real agents
  // - Progress tracking
  // - Reporting results
}
```

## Command Recognition Patterns

The system recognizes these patterns as workflow commands:

### Sequential Execution:
- `run 1.1.3.3 then 1.1.3.4`
- `execute 1.1.3.3 followed by 1.1.3.4`
- `start with 1.1.3.3 and then 1.1.3.4`
- `1.1.3.3 after that 1.1.3.4`

### Parallel Execution:
- `run 1.1.3.3 and 1.1.3.4 together`
- `execute 1.1.3.3, 1.1.3.4 in parallel`
- `start 1.1.3.3 and 1.1.3.4 at the same time`
- `1.1.3.3, 1.1.3.4 concurrently`

### Mixed Workflows:
- `run 1.1.3.3, 1.1.3.4 together then 1.1.3.5`
- `execute 1.1.3.3 and 1.1.3.4 in parallel, followed by 1.1.3.5`

## Integration Flow

When you detect a workflow command:

1. **Recognize**: Use `ClaudeIntegration.shouldTriggerOrchestrator(message)`
2. **Execute**: Call `ClaudeIntegration.handleWorkflowCommand(message)`
3. **Report**: Show the results to the user

The orchestrator will:
- Parse the natural language
- Create execution stages
- Call `orch start` for each PRD with proper paths
- Manage parallel/sequential execution
- Track progress
- Return comprehensive results

## Example Implementation in Claude

```javascript
// In your message handler
async function handleUserMessage(message) {
  // Check if it's a workflow command
  if (ClaudeIntegration.shouldTriggerOrchestrator(message)) {
    console.log("🎯 Detected workflow command - using orchestrator");
    
    // Get execution plan first (optional)
    const plan = await ClaudeIntegration.getExecutionPlan(message);
    console.log("📋 Execution plan:", plan.plan);
    
    // Execute the workflow
    const result = await ClaudeIntegration.handleWorkflowCommand(
      message,
      { 
        autoConfirm: true,  // Skip confirmation prompt
        dryRun: false       // Set to true for testing
      }
    );
    
    if (result.success) {
      console.log("✅ Workflow completed successfully");
      console.log(`Completed PRDs: ${result.completedPRDs.join(', ')}`);
    } else {
      console.log("❌ Workflow failed:", result.error);
    }
    
    return result;
  }
  
  // Not a workflow command - handle normally
  // ... your normal handling code
}
```

## Testing Workflow Commands

You can test with these commands:

```bash
# Simple sequential
"orch workflow run 1.1.3.3 then 1.1.3.4"

# Parallel execution  
"workflow execute 1.1.3.3 and 1.1.3.4 together"

# Complex mixed
"run 1.1.3.1, 1.1.3.2, 1.1.3.3 in parallel, then 1.1.3.4, then 1.1.3.5"

# Natural variations
"start with PRD-1.1.3.3 and then move to PRD-1.1.3.4"
"execute features 1.1.3.3 and 1.1.3.4 sequentially"
```

## Important Notes

1. **Always use the orchestrator** for multi-PRD workflows
2. **Don't bypass** the system by calling orch start directly
3. **Let the system handle** dependencies and parallelization
4. **Real agents** will be invoked through the proper flow
5. **Progress tracking** happens automatically

## Troubleshooting

If workflow commands aren't working:

1. Check if the message matches a workflow pattern
2. Verify ClaudeIntegration module is imported
3. Ensure you're calling handleWorkflowCommand()
4. Check for validation errors in the workflow
5. Look at the console output for debugging

---

**Remember**: The multi-PRD orchestrator is a sophisticated system that handles complex workflows. Don't try to replicate its functionality manually - just call it!