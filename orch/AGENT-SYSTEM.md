# ORCH Agent System

## Overview

The ORCH system now includes a comprehensive agent system where each team role operates as an autonomous agent that can collaborate on features.

## 🤖 24 Specialized Agents

Each team member in `orch/team/` is now an autonomous agent:

### Leadership
- CTO - Technology strategy and architecture decisions
- Chief AI Officer - AI/ML strategy and governance
- VP Engineering - Resource allocation and delivery oversight
- VP Product - Product vision and roadmap alignment

### Product & Design
- Product Manager - PRDs and success criteria
- AI Product Manager - AI feature requirements
- Technical Product Manager - Technical specifications
- UX Researcher - User research and testing
- UX/UI Designer - Interface design and prototypes

### Engineering
- Frontend Engineer - UI implementation
- Backend Engineer - API development
- Full Stack Engineer - End-to-end features
- Staff Engineer - Architecture and standards

### AI/ML
- AI Engineer - LLM integration and prompts
- Data Scientist - Predictive models and analysis
- Machine Learning Engineer - Model training and deployment
- ML Research Scientist - Algorithm research
- MLOps Engineer - ML infrastructure

### Infrastructure & Quality
- Data Engineer - Data pipelines
- Data Analyst - Metrics and reports
- DevOps Engineer - CI/CD and deployment
- Site Reliability Engineer - Monitoring and uptime
- QA Engineer - Testing and validation
- QA Automation Engineer - Automated testing

## 🚀 Autonomous Mode (Default)

**As of now, autonomous mode runs by default!** When you run `orch start`, agents are automatically assigned based on feature requirements.

### Basic Usage

```bash
# Start with agents (default behavior)
npm run start -- --id 1.1.1.1.0.0

# Explicitly run without agents (manual mode)
npm run start -- --id 1.1.1.1.0.0 --manual

# Or use the manual shortcut
npm run manual -- --id 1.1.1.1.0.0
```

## 🎯 Intelligent Agent Assignment

The system assigns agents based on feature ID pattern (X.X.X.X.X.X):

### By Feature Type (1st digit)
- **1.x.x.x.x.x** - UI features → Frontend, UX Designer, UX Researcher
- **2.x.x.x.x.x** - Backend → Backend Engineer, Technical PM
- **3.x.x.x.x.x** - Data → Data Engineer, Data Analyst, Data Scientist
- **4.x.x.x.x.x** - AI/ML → AI Engineer, ML Engineer, Chief AI Officer
- **5.x.x.x.x.x** - Infrastructure → DevOps, SRE

### By Complexity
- Features with 2nd digit ≥ 5 → Add Staff Engineer, Technical PM
- Features with 3rd digit ≥ 3 → Add Full Stack Engineer
- Features with 5th digit ≥ 5 → Add QA Automation Engineer
- Features with 1st digit ≥ 7 or 2nd digit ≥ 8 → Add VPs and CTO

### Examples

```bash
# Simple UI feature (6 agents)
npm run start -- --id 1.1.1.1.0.0
# Assigns: PM, Frontend, UX Designer, UX Researcher, Backend, QA

# Complex UI feature (13 agents including leadership)
npm run start -- --id 1.8.3.1.5.0
# Adds: VPs, CTO, Staff Engineer, Full Stack, QA Automation

# AI/ML feature (8 agents with AI specialists)
npm run start -- --id 4.1.1.4.0.0
# Assigns: PM, AI PM, AI Engineer, ML Engineer, MLOps, ML Research, Chief AI Officer, QA
```

## 🛠️ Agent Management Commands

```bash
# List all agents and their status
npm run agents:list

# Check system status
npm run agents:status

# Assign task to specific agent
npm run agents:assign -- --agent frontend-engineer --task "Build dashboard"

# Run workflow with specific agents
npm run agents:workflow -- --feature 1.1.1.1.0.0
```

## 💬 Agent Capabilities

Each agent can:
- **Execute tasks** independently based on their expertise
- **Communicate** with other agents via channels
- **Share knowledge** through artifacts
- **Collaborate** in multi-agent workflows
- **Track history** of completed tasks

## 🔄 How It Works

1. **Feature starts** → `npm run start -- --id X.X.X.X.X.X`
2. **System analyzes** feature ID to determine requirements
3. **Agents assigned** based on feature type and complexity
4. **Workflow created** with tasks for each agent
5. **Agents collaborate** to complete the feature
6. **Results tracked** and reported

## 📊 Performance

- All 24 agents tested and working
- Agents load in < 1 second
- Tasks execute asynchronously
- Communication happens in real-time
- System scales with feature complexity

## 🎯 Benefits

- **Automatic expertise** - Right skills for each feature
- **Parallel execution** - Agents work simultaneously
- **Consistent quality** - Each agent follows their playbook
- **Full traceability** - All actions logged
- **Reduced overhead** - No manual role assignment

## 🔧 Customization

To modify agent behavior:
1. Edit role definitions in `orch/team/*.md`
2. Regenerate agents: `node scripts/generate-agents.mjs`
3. Restart system: `npm run agents:start`

## 📝 Notes

- Agents are stateless between runs
- Each run creates a new workflow
- Agent assignments are deterministic based on feature ID
- Manual mode still available with `--manual` flag