# OrchV2 - Claude Code Orchestration System v2.0

## Overview

OrchV2 is a next-generation orchestration system built specifically for Claude Code environment. It manages unlimited AI agents with multi-LLM support, provides real-time visibility through an HTML dashboard, and continuously improves through machine learning.

## Key Features

- **Dynamic Agent Management** - No hardcoded limits, discover agents at runtime
- **Multi-LLM Router** - Assign different LLMs to different agents for 60% cost savings
- **HTML Dashboard** - Real-time progress tracking with 5-level drill-down navigation
- **Sub-Agent Services** - Service-like architecture using Claude Code's Task tool
- **Self-Learning** - 3-5% improvement per iteration
- **Live Browser Testing** - Playwright integration for real validation
- **Leader Verification** - Verify all agent claims with evidence

## Quick Start

```bash
cd orchv2
npm install
npm run start
```

Dashboard will be available at: http://localhost:8080

## Directory Structure

```
orchv2/
├── core/           # Core orchestration engine
├── agents/         # Agent definitions (37 agents)
├── services/       # Sub-agent services
├── dashboard/      # HTML reporting dashboard
├── llm-router/     # Multi-LLM assignment
├── testing/        # Playwright & verification
├── learning/       # Self-improvement system
└── config/         # Configuration files
```

## Dashboard Navigation

The dashboard provides drill-down navigation:
```
Roadmap → Milestones → PRDs → Tasks → Agent Actions
```

## Multi-LLM Configuration

Agents are assigned to optimal LLMs:
- **Claude-3-Opus**: Complex tasks (CTO, Security Architect)
- **Claude-3-Sonnet**: Standard development (Engineers)
- **Claude-3-Haiku**: Simple tasks (Analysts)
- **GPT-4**: Creative tasks (Designers)
- **GPT-3.5**: Routine tasks (DevOps)

## Files Migrated from V1

- ✅ All 37 agents
- ✅ Core orchestration libraries
- ✅ Testing systems (Playwright)
- ✅ Learning system
- ✅ Configuration files
- ✅ Package.json

## See Also

- [ROADMAP.md](./ROADMAP.md) - Implementation roadmap
- [TODOS.md](./TODOS.md) - Task list
- [../PROJECT-STRUCTURE.md](../PROJECT-STRUCTURE.md) - Full project structure