# Complete Agent System Setup Guide

## What We Built vs What's Missing in orch-system-reorganized.md

### 🚨 CRITICAL ADDITIONS NEEDED

The `orch-system-reorganized.md` file is missing the entire agent system. Here's everything that needs to be added for a complete setup:

## 1. NEW FILES CREATED (Not in Original)

### Core Agent Infrastructure
```
orch/
├── lib/
│   ├── orch/
│   │   ├── agent-system.mjs           # Base Agent class & AgentManager
│   │   ├── agent-communication.mjs    # CommunicationHub, CollaborationProtocol
│   │   └── workflow-runner.mjs        # MODIFIED to use agents
│   └── orch-agents.mjs                # Agent CLI commands
├── agents/                             # NEW DIRECTORY - 24 agent files
│   ├── index.mjs
│   ├── ai-engineer.mjs
│   ├── backend-engineer.mjs
│   └── ... (22 more agent files)
├── scripts/
│   └── generate-agents.mjs            # Agent generator script
└── AGENT-SYSTEM.md                    # Agent documentation
```

## 2. MODIFIED FILES

### A. orch-start.mjs Changes
```javascript
// OLD (line 32)
autonomous: false,

// NEW - Default to autonomous
autonomous: true,  // Default to autonomous mode

// Added new flag parsing (line 44)
if (a === '--no-autonomous' || a === '--manual') { args.autonomous = false; }
```

### B. workflow-runner.mjs Major Changes
```javascript
// Added imports
import { agentManager } from './agent-system.mjs';
import { communicationHub, collaborationProtocol } from './agent-communication.mjs';

// Completely rewrote orchestrateTeam() function (lines 204-270)
// Completely rewrote determineRequiredRoles() function (lines 273-357)
// Completely rewrote getTasksForRole() function (lines 360-405)
```

### C. package.json Scripts
```json
// Changed
"autonomous": "node lib/orch-start.mjs --autonomous",  // REMOVED
"manual": "node lib/orch-start.mjs --manual",          // NEW

// Added
"agents": "node lib/orch-agents.mjs",
"agents:list": "node lib/orch-agents.mjs list",
"agents:status": "node lib/orch-agents.mjs status",
"agents:start": "node lib/orch-agents.mjs start",
"agents:assign": "node lib/orch-agents.mjs assign",
"agents:workflow": "node lib/orch-agents.mjs workflow"
```

## 3. COMPLETE SETUP SCRIPT

Add this to the setup.sh or create a new setup-agents.sh:

```bash
#!/bin/bash

echo "🤖 Setting up ORCH Agent System..."

# Create agent directories
mkdir -p orch/agents
mkdir -p orch/lib/orch

# Create agent-system.mjs
cat > orch/lib/orch/agent-system.mjs << 'EOF'
[INSERT FULL agent-system.mjs CONTENT - 400+ lines]
EOF

# Create agent-communication.mjs
cat > orch/lib/orch/agent-communication.mjs << 'EOF'
[INSERT FULL agent-communication.mjs CONTENT - 350+ lines]
EOF

# Create generate-agents.mjs script
cat > orch/scripts/generate-agents.mjs << 'EOF'
[INSERT FULL generate-agents.mjs CONTENT - 150+ lines]
EOF

# Create orch-agents.mjs CLI
cat > orch/lib/orch-agents.mjs << 'EOF'
[INSERT FULL orch-agents.mjs CONTENT - 300+ lines]
EOF

# Generate all agent files from team roles
node orch/scripts/generate-agents.mjs

# Update orch-start.mjs to default autonomous
sed -i '' 's/autonomous: false/autonomous: true/' orch/lib/orch-start.mjs
sed -i '' 's/autonomous: false/autonomous: true/' orch/lib/orch-start-optimized.mjs

# Add manual mode flag parsing
sed -i '' "/--autonomous.*continue/a\\
    if (a === '--no-autonomous' || a === '--manual') { args.autonomous = false; continue; }
" orch/lib/orch-start.mjs

echo "✅ Agent system setup complete!"
echo "   - 24 agents created from team roles"
echo "   - Autonomous mode set as default"
echo "   - Agent CLI commands available"
```

## 4. KEY AGENT SYSTEM FEATURES

### Agent Infrastructure (agent-system.mjs)
- **Base Agent Class**: Task execution, status tracking, event handling
- **AgentManager**: Orchestrates multiple agents, manages workflows
- **Methods**: assignTask(), executeTask(), getCapabilities(), collaborateWith()

### Communication System (agent-communication.mjs)
- **CommunicationHub**: Inter-agent messaging channels
- **CollaborationProtocol**: Structured workflows (code-review, feature-planning)
- **KnowledgeBase**: Artifact sharing between agents

### Intelligent Role Assignment (workflow-runner.mjs)
```javascript
// Feature ID determines agents: X.X.X.X.X.X
switch(epic) {  // 1st digit
  case 1: // UI → Frontend, UX Designer, UX Researcher
  case 2: // Backend → Backend Engineer, Technical PM
  case 3: // Data → Data Engineer, Analyst, Scientist
  case 4: // AI/ML → AI Engineer, ML Engineer, Chief AI Officer
  case 5: // Infrastructure → DevOps, SRE
}
```

## 5. REQUIRED UPDATES TO orch-system-reorganized.md

### Add New Section After "Team Roles" (Section 9):

```markdown
## 10. Agent System

### Overview
Each team role operates as an autonomous agent that can collaborate on features.

### Architecture
- **24 Specialized Agents**: One for each team role
- **Agent Manager**: Orchestrates agent collaboration
- **Communication Hub**: Inter-agent messaging
- **Knowledge Base**: Shared artifacts and learnings

### Automatic Agent Assignment
Features are analyzed by ID pattern (X.X.X.X.X.X) to determine required agents:
- 1.x.x.x.x.x → UI team (Frontend, UX, Designer)
- 2.x.x.x.x.x → Backend team
- 3.x.x.x.x.x → Data team
- 4.x.x.x.x.x → AI/ML team
- 5.x.x.x.x.x → Infrastructure team

### Agent Commands
\`\`\`bash
npm run agents:list     # List all agents
npm run agents:status   # System status
npm run agents:workflow # Run workflow
\`\`\`

### Default Behavior
**Autonomous mode is now default** - agents automatically assigned when running:
\`\`\`bash
npm run start -- --id X.X.X.X.X.X
\`\`\`
```

### Update CLI Commands Section:

```markdown
### Core Commands
\`\`\`bash
# Start with agents (default)
npm run start -- --id 1.1.1.1.0.0

# Manual mode (no agents)
npm run start -- --id 1.1.1.1.0.0 --manual

# Agent management
npm run agents:list
npm run agents:status
npm run agents:assign -- --agent frontend-engineer --task "Build UI"
\`\`\`
```

### Add to File Structure:

```markdown
orch/
├── agents/        # Generated agent files (24 total)
├── lib/
│   ├── orch/
│   │   ├── agent-system.mjs
│   │   ├── agent-communication.mjs
│   └── orch-agents.mjs
```

## 6. COMPLETE FILE LIST FOR AGENT SYSTEM

Files that MUST be created for agents to work:

1. **Core System** (3 files):
   - `orch/lib/orch/agent-system.mjs` - 400 lines
   - `orch/lib/orch/agent-communication.mjs` - 350 lines
   - `orch/lib/orch-agents.mjs` - 300 lines

2. **Generator** (1 file):
   - `orch/scripts/generate-agents.mjs` - 150 lines

3. **Generated Agents** (25 files):
   - `orch/agents/index.mjs`
   - `orch/agents/[role-name].mjs` (24 files)

4. **Modified Files** (4 files):
   - `orch/lib/orch-start.mjs` - Change autonomous default
   - `orch/lib/orch-start-optimized.mjs` - Change autonomous default
   - `orch/lib/orch/workflow-runner.mjs` - Complete rewrite of 3 functions
   - `orch/package.json` - Add agent scripts

5. **Documentation** (2 files):
   - `orch/AGENT-SYSTEM.md`
   - `AGENT-SYSTEM-SETUP-GUIDE.md` (this file)

## 7. VERIFICATION CHECKLIST

After setup, verify:

```bash
# 1. Check agent files exist
ls orch/agents/*.mjs | wc -l  # Should show 25

# 2. Test agent listing
npm run agents:list  # Should show 24 agents

# 3. Test autonomous default
npm run start -- --id 1.1.1.1.0.0 --dry-run | grep "autonomous"
# Should show: "orchestration": "autonomous"

# 4. Test manual mode
npm run start -- --id 1.1.1.1.0.0 --manual --dry-run | grep "orchestration"
# Should show: "orchestration": "manual"

# 5. Run agent test
node test-all-agents.mjs  # Should show 24/24 passed
```

## SUMMARY

The original `orch-system-reorganized.md` provides the foundation but is missing:
1. **Entire agent system** (1500+ lines of code)
2. **Autonomous mode as default**
3. **Intelligent agent assignment logic**
4. **Agent CLI commands**
5. **Inter-agent communication**

To make it complete, you need to:
1. Add all agent system files (listed above)
2. Modify workflow-runner.mjs substantially
3. Change autonomous to default in orch-start files
4. Update package.json scripts
5. Generate agent files from team roles
6. Add agent documentation sections

This represents approximately **2,000 lines of new code** not present in the original reorganized system.