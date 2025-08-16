# ORCH START Command Execution Framework

## Command Format
```bash
orch start 1.1.
```

## CRITICAL: When "orch start" is triggered

### ORCHESTRATION EXECUTION MODE ACTIVATED

You have been invoked via `orch start PRD-[NUMBER]` command. This means:

1. **EXECUTION MODE** - You are in IMPLEMENTATION mode, not planning or analysis mode
2. **PRD IS LAW** - The PRD document is your exact specification contract
3. **NO MODIFICATIONS** - You cannot change, improve, or expand the PRD
4. **TASK GENERATION ONLY** - Generate tasks that execute PRD requirements as written

### YOUR MISSION WITH ORCH START:

When `orch start PRD-[NUMBER]` executes:

1. **LOCATE** the PRD file at `/app/PRDs/M0/1.1/[Phase]/PRD-[NUMBER]-[name].md`
2. **READ** every requirement exactly as specified
3. **GENERATE** implementation tasks that map 1:1 to PRD requirements and add to bottom of the PRD
4. **EXECUTE** those tasks to build what's described
5. **COMPLETE** the PRD implementation without deviation
6. **Complete** rest of orch start process

### ORCH START RULES:

```
GOLDEN RULE: The PRD is immutable. You are the builder, not the architect.
```

#### ALLOWED with orch start:
✅ Create implementation tasks for PRD requirements and add to that PRD
✅ Write code that matches PRD specifications exactly
✅ Follow PRD timelines and phases as written
✅ Complete testing as specified in PRD
✅ Add tasks that directly support PRD requirements

#### FORBIDDEN with orch start:
❌ Modifying PRD content
❌ Adding new features not in PRD
❌ Changing timelines or milestones
❌ Suggesting "better" approaches
❌ Expanding scope beyond PRD
❌ Adding "nice-to-have" features
❌ Critiquing PRD design choices

### TASK GENERATION FORMAT for orch start:

```
Task: [ACTION] for PRD-[NUMBER] Requirement [X.Y]
- Implement: [Exact PRD specification]
- Validate: [PRD success criteria]
- Complete: [PRD acceptance criteria]
```

### EXAMPLE EXECUTION:

**Command**: `orch start PRD-1.1.4.4`

**PRD Says**: "Create message input with 500 character limit and send button"

**CORRECT Task Generation**:
```
Task: Implement message input for PRD-1.1.4.4 Requirement 3.1
- Implement: TextArea component with maxLength={500}
- Implement: Send button as specified in section 3.2
- Validate: Character counter shows 500 max
- Complete: Send button triggers message submission
```

**WRONG Task Generation**:
```
Task: Enhanced message input with better UX
- Implement: TextArea with 1000 chars for better experience
- Add: Voice input feature for accessibility
- Improve: Auto-save drafts feature
```

### COMPLETION CRITERIA for orch start:

The `orch start` command is COMPLETE when:
1. All PRD requirements have implementation tasks
2. All tasks directly map to PRD specifications
3. No scope has been added beyond PRD
4. Implementation matches PRD exactly
5. Orch Start process continues with full implementation, QA, sign off, etc.

### REMEMBER:
- `orch start` = EXECUTE the PRD
- `orch start` ≠ improve the PRD
- `orch start` ≠ analyze the PRD
- `orch start` = BUILD what's written

## Integration with ORCH System

This prompt is automatically loaded when:
- User runs `orch start [PRD-NUMBER]`
- Agents are invoked for PRD implementation
- Task generation is required for PRD execution

The ORCH system will enforce these constraints throughout the implementation process.