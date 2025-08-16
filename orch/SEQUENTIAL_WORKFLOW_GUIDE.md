# Sequential Workflow Guide

## Overview

This guide explains the **simplified sequential workflow approach** that was implemented based on your feedback that the simple `orch start` commands work reliably while the complex subprocess orchestrator was timing out.

## The Problem with the Complex Approach

The original `MultiPRDOrchestrator` was:
- Spawning subprocesses for each PRD
- Using complex timeout handling
- Managing process communication
- Prone to timeouts and failures

## Your Working Approach

Your command works reliably:
```bash
orch start PRD-1.1.3.3 with real agents and have them analyze the PRD first, put all of their tasks in the PRD (overwrite what is there, it maybe a placeholder and then do the work and follow the rest of the orch start process
```

## New Simplified Sequential Approach

The new `SequentialWorkflowRunner` mimics your working approach by:
- Using `WorkflowController.orchestrateFeature()` directly (no subprocesses)
- Running PRDs one after another (sequential execution)
- Using the same proven code path as your working command
- Avoiding timeout issues and process management complexity

## Usage Examples

### Basic Sequential Workflow
```bash
# Your exact use case
orch workflow sequential run 1.1.3.3 and then 1.1.3.4

# Multiple PRDs in sequence
orch workflow sequential run 1.1.2.1 then 1.1.2.2 then 1.1.2.3

# Natural language variations
orch workflow sequential do 1.1.1.2 and then do 1.1.1.3 after that
```

### Available Commands

1. **Recommended: Sequential Workflow**
   ```bash
   orch workflow sequential <description>
   ```
   - Uses direct function calls
   - Reliable and proven approach
   - Based on your working command pattern

2. **Legacy: Parallel Workflow** 
   ```bash
   orch workflow <description>
   ```
   - Uses subprocess spawning
   - May timeout on complex workflows
   - Kept for backward compatibility

## How It Works Internally

### Sequential Workflow Flow
```
1. Parse natural language description
2. Extract PRD IDs and execution order
3. For each PRD in sequence:
   a. Resolve PRD file path
   b. Call WorkflowController.orchestrateFeature() directly
   c. Wait for completion before starting next PRD
   d. Stop on first failure (fail-fast)
4. Return combined results
```

### Key Differences from Complex Approach

| Aspect | Complex Orchestrator | Sequential Runner |
|--------|---------------------|------------------|
| **Execution** | Subprocess spawning | Direct function calls |
| **Concurrency** | Parallel with coordination | Sequential (reliable) |
| **Error Handling** | Complex timeout management | Simple exception handling |
| **Resource Usage** | High (multiple processes) | Low (single process) |
| **Reliability** | Prone to timeouts | Proven stable |

## Benefits

✅ **Reliability**: Uses the same code path as your working command  
✅ **Simplicity**: No subprocess management or timeouts  
✅ **Performance**: Lower resource usage, faster startup  
✅ **Debugging**: Easier to trace and debug issues  
✅ **Maintenance**: Simpler codebase with fewer failure points  

## Migration Guide

If you were using the complex workflow commands, migrate like this:

```bash
# OLD (complex, may timeout)
orch workflow run 1.1.3.3, 1.1.3.4, 1.1.3.5 in parallel then 1.1.3.6

# NEW (simple, reliable) 
orch workflow sequential run 1.1.3.3 then 1.1.3.4 then 1.1.3.5 then 1.1.3.6
```

## Testing

Test the sequential workflow:
```bash
node orch/test-sequential-workflow.mjs
```

## Architecture

```
Sequential Workflow Request
           ↓
    Natural Language Parser
           ↓
    Extract PRD IDs & Order
           ↓
    For Each PRD (Sequential):
           ↓
    WorkflowController.orchestrateFeature()
           ↓
    Real Agent Orchestration
           ↓
    Complete Implementation
           ↓
    Continue to Next PRD
           ↓
    Return Combined Results
```

## Implementation Files

- **`orch/lib/orch/sequential-workflow-runner.mjs`** - Main sequential runner
- **`orch/orch`** - Updated CLI with `workflow sequential` command  
- **`orch/test-sequential-workflow.mjs`** - Test script

## Why This Approach Works Better

1. **Follows Your Pattern**: Mimics your successful `orch start` command structure
2. **Direct Function Calls**: No process boundaries or communication overhead
3. **Proven Code Path**: Uses the same `WorkflowController` that works in individual PRDs
4. **Sequential Execution**: Simpler than parallel coordination, more predictable
5. **Fail-Fast**: Stops on first error instead of complex error aggregation

## Conclusion

The sequential workflow runner addresses the timeout and reliability issues you experienced by adopting the simple, direct approach that mirrors your working command pattern. It prioritizes reliability and simplicity over complex parallel orchestration.

---

**Generated**: Based on user feedback about working vs. failing approaches
**Status**: Ready for use - recommended over complex orchestrator