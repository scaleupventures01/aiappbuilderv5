# CLAUDE.md - Session Preferences & Instructions

## Agent Invocation Policy

### DEFAULT BEHAVIOR: ALWAYS INVOKE REAL AGENTS

**Critical Instruction**: When asked to have team members, agents, or roles review something or perform tasks, the DEFAULT action is to:

1. **USE THE TASK TOOL** to invoke actual autonomous agents
2. **SPAWN SEPARATE AGENT INSTANCES** for each role/team member
3. **ALLOW AGENTS TO WORK INDEPENDENTLY** and provide their own analysis
4. **COMPILE ACTUAL AGENT RESPONSES**, not simulated ones

### When NOT to Invoke Agents:

ONLY skip actual agent invocation when explicitly told:
- "Don't actually call the agents"
- "Just simulate their responses"
- "Give me a quick simulation"
- "Mock up what they might say"
- "Don't use the Task tool for this"

### Examples:

✅ **These require REAL agent invocation:**
- "Have the team review this"
- "Get feedback from all team members"
- "Have the @orch/team/ analyze this"
- "Get everyone's perspective"
- "Have them put together their thoughts"

❌ **These DON'T require agent invocation:**
- "Simulate what the team might say"
- "Give me a mock review"
- "What would the team likely think (without calling agents)"
- "Quick summary of probable team feedback"

### Implementation Requirements:

When invoking multiple agents:
1. **Be Transparent**: State "I'm now invoking X separate agent instances..."
2. **Warn About Resources**: "This will take approximately X minutes..."
3. **Show Progress**: Update after each agent completes
4. **Never Simulate Without Permission**: If agent invocation fails, ask before simulating

### Performance Considerations:

- Invoking 34 agents (full team) takes approximately 20-25 minutes
- Each agent works independently and in parallel when possible
- Agent responses are autonomous and may vary significantly
- Resource usage will be higher with multiple agents

### User Preference:

**This user prefers actual agent execution over simulation, even if it takes longer and uses more resources.**

---

## Complete Team Invocation System

### CRITICAL: Dynamic Agent Discovery

**The ORCH system has 34 agents** (as of December 2024). This number is dynamically discovered, not hardcoded.

### When User Requests "Whole Team" or "All Agents":

1. **ALWAYS discover current agent count** from `/orch/team/` directory
2. **VERIFY all agents are included** (should be 34, not 25 or 33)
3. **CHECK for critical agents** that must never be excluded:
   - AI Safety Engineer
   - Privacy Engineer
   - CISO
   - Security Architect
   - Business Analyst
   - Project Manager

### System Components for Complete Invocation:

- **orch-team-manifest.json**: Registry of all 34 agents with their domains and expertise
- **orch-config.yaml**: Configuration for discovery, safety checks, and invocation rules
- **discover-agents.py**: Dynamically finds all agents in `/orch/team/`
- **verify-invocation.py**: Ensures complete team invocation and prevents missing agents

### Invocation Verification Process:

```
1. Discovery: Scan /orch/team/ → Find 35 files → Exclude utility files → Confirm 34 agents
2. Validation: Check critical agents included → Verify completeness
3. Planning: Group by domain → Estimate time (20 min) → Calculate cost ($3.40)
4. Confirmation: Show plan → Get user approval for >10 agents
5. Execution: Invoke in parallel batches → Track progress
6. Verification: Confirm all 34 responded → Log audit trail
```

### Common Aliases Recognized:
- "whole team" = All 34 agents
- "everyone" = All 34 agents
- "full team" = All 34 agents
- "complete review" = All 34 agents
- "all agents" = All 34 agents

### Safety Rules:
- **NEVER invoke less than 30 agents** when "whole team" is requested
- **ALWAYS include the 6 critical agents** for platform safety
- **REQUIRE confirmation** for invocations >10 agents
- **BLOCK invocation** if critical agents are missing

### Audit Trail:
All invocations are logged to `/orch/logs/invocations/` with:
- Agents planned vs actually invoked
- Completion rate (should be 100%)
- Time and cost metrics
- Any issues or warnings

---

## Other Session Preferences

### Lint and Type Checking
- Always run lint and typecheck commands when completing coding tasks
- Commands to run: `npm run lint`, `npm run typecheck`, `ruff`, etc.
- Ask for the correct commands if unable to find them

### File Creation
- NEVER create documentation files (*.md) or README files unless explicitly requested
- ALWAYS prefer editing existing files over creating new ones
- Only create files when absolutely necessary for the task

---

**Last Updated**: December 2024
**Priority**: These are CRITICAL preferences that override default behaviors