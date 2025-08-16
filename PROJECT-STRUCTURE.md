# PROJECT FILE STRUCTURE

## Current Directory Layout

```
gtcv05/
├── orchv2/                      # Orchestration System v2.0
│   ├── agents/                  # All agent definitions
│   │   ├── frontend-engineer.mjs
│   │   ├── backend-engineer.mjs
│   │   ├── qa-engineer.mjs
│   │   ├── leader-orchestrator.mjs
│   │   └── ... (34 total agents)
│   │
│   ├── lib/                     # Core orchestration libraries
│   │   ├── orch/               # Orchestration core
│   │   │   ├── agent-registry.mjs
│   │   │   ├── agent-system-v2.mjs
│   │   │   ├── claude-integration.mjs
│   │   │   ├── learning-system.mjs
│   │   │   ├── playwright-testing-system.mjs
│   │   │   ├── prd-utils.mjs
│   │   │   ├── task-manager.mjs
│   │   │   ├── task-tool-integration.mjs
│   │   │   ├── total-workflow-orchestrator.mjs
│   │   │   ├── workflow-runner-real.mjs
│   │   │   └── ... (other orchestration files)
│   │   │
│   │   ├── orch-start.mjs      # Original start script
│   │   ├── orch-start-real.mjs # Real agent invocation
│   │   ├── orch-agents.mjs     # Agent management
│   │   ├── scaffold-feature.mjs
│   │   └── task-decomposer.mjs
│   │
│   ├── auth/                    # Authentication system
│   │   ├── server.mjs
│   │   ├── models/
│   │   └── middleware/
│   │
│   ├── tests/                   # Test files
│   │   ├── integration/
│   │   └── unit/
│   │
│   ├── scripts/                 # Utility scripts
│   │   ├── health-check.mjs
│   │   ├── validate-improvements.mjs
│   │   └── role-assign.mjs
│   │
│   ├── config/                  # Configuration files
│   │   ├── orch-config.yaml
│   │   └── orch-team-manifest.json
│   │
│   ├── logs/                    # Log files
│   │   └── invocations/
│   │
│   ├── test-evidence/           # Playwright test results
│   ├── test-videos/            # Test recordings
│   │
│   ├── package.json            # Dependencies
│   ├── package-lock.json
│   └── README.md
│
├── orchv2/                      # Orchestration System v2.0 (continued)
│   ├── core/                   # Core orchestration engine
│   │   ├── orchestrator.mjs   # Main orchestrator
│   │   ├── claude-adapter.mjs # Claude Code integration
│   │   ├── agent-registry.mjs # Dynamic agent management
│   │   └── workflow-engine.mjs # Phase execution
│   │
│   ├── services/               # Sub-agent services (via Task tool)
│   │   ├── agent-service.mjs  # Agent management service
│   │   ├── workflow-service.mjs # Workflow execution
│   │   ├── verification-service.mjs # Testing & verification
│   │   ├── learning-service.mjs # ML & optimization
│   │   └── reporting-service.mjs # Metrics & dashboard data
│   │
│   ├── dashboard/              # HTML Reporting Dashboard
│   │   ├── server.mjs         # Express server (localhost:8080)
│   │   ├── public/            # Dashboard frontend
│   │   │   ├── index.html    # Main dashboard page
│   │   │   ├── css/          # Styles
│   │   │   │   └── dashboard.css
│   │   │   ├── js/           # Client-side JavaScript
│   │   │   │   ├── app.js
│   │   │   │   ├── drill-down.js
│   │   │   │   └── websocket.js
│   │   │   └── assets/       # Images, icons
│   │   │
│   │   ├── views/            # Dashboard views
│   │   │   ├── roadmap.html
│   │   │   ├── milestones.html
│   │   │   ├── prds.html
│   │   │   ├── tasks.html
│   │   │   └── agents.html
│   │   │
│   │   └── api/              # Dashboard API endpoints
│   │       ├── progress.mjs
│   │       ├── metrics.mjs
│   │       └── drill-down.mjs
│   │
│   ├── llm-router/            # Multi-LLM Assignment
│   │   ├── router.mjs        # LLM selection logic
│   │   ├── cost-optimizer.mjs # Cost optimization
│   │   ├── llm-registry.mjs  # LLM configurations
│   │   └── performance-tracker.mjs
│   │
│   ├── agents/                # Agent definitions (copied from v1)
│   │   └── ... (all agents)
│   │
│   ├── testing/               # Testing framework
│   │   ├── playwright-integration.mjs
│   │   ├── leader-verification.mjs
│   │   └── evidence-collector.mjs
│   │
│   ├── learning/              # Self-learning system
│   │   ├── pattern-analyzer.mjs
│   │   ├── improvement-engine.mjs
│   │   ├── metrics-collector.mjs
│   │   └── optimization-applier.mjs
│   │
│   ├── communication/         # Agent communication
│   │   ├── message-bus.mjs
│   │   ├── broadcast.mjs
│   │   └── audit-logger.mjs
│   │
│   ├── defects/              # Bug & defect resolution
│   │   ├── detector.mjs
│   │   ├── triage.mjs
│   │   ├── resolver.mjs
│   │   └── prevention.mjs
│   │
│   ├── config/               # Configuration
│   │   ├── orchv2-config.yaml
│   │   ├── llm-config.json
│   │   ├── dashboard-config.json
│   │   └── claude-code-config.json
│   │
│   ├── data/                 # Data storage
│   │   ├── metrics/         # Performance metrics
│   │   ├── learning/        # Learning data
│   │   ├── evidence/        # Test evidence
│   │   └── sessions/        # Session state
│   │
│   ├── logs/                 # Logging
│   │   ├── orchestration/
│   │   ├── agents/
│   │   ├── services/
│   │   └── dashboard/
│   │
│   ├── scripts/              # Utility scripts
│   │   ├── start.mjs        # Main entry point
│   │   ├── migrate-v1.mjs   # Migrate from v1
│   │   ├── health-check.mjs
│   │   └── deploy.mjs
│   │
│   ├── docs/                 # Documentation
│   │   ├── architecture.md
│   │   ├── api-reference.md
│   │   ├── dashboard-guide.md
│   │   ├── llm-assignment.md
│   │   └── claude-code-integration.md
│   │
│   ├── package.json         # Dependencies
│   ├── README.md           # Getting started
│   └── ROADMAP.md          # Implementation roadmap
│
├── new-input/               # Input directory for new requirements
│   ├── requirements/
│   ├── designs/
│   └── specifications/
│
├── ORCHESTRATION-SYSTEM-ROADMAP.md  # v2.0 roadmap
├── ORCHESTRATION-TODOS.md          # TODO list
├── CLAUDE.md                       # Claude Code preferences
└── README.md                       # Project overview
```

## Migration Path from v1 to v2

### Phase 1: Setup orchv2 structure
```bash
# Create new directory structure
mkdir -p orchv2/{core,services,dashboard,llm-router,agents,testing,learning}
mkdir -p orchv2/{communication,defects,config,data,logs,scripts,docs}
mkdir -p orchv2/dashboard/{public,views,api}
mkdir -p orchv2/dashboard/public/{css,js,assets}
```

### Phase 2: Copy and adapt from v1
```bash
# Copy agents
cp -r orch/agents/* orchv2/agents/

# Copy useful libraries
cp orch/lib/orch/agent-registry.mjs orchv2/core/
cp orch/lib/orch/playwright-testing-system.mjs orchv2/testing/
cp orch/lib/orch/learning-system.mjs orchv2/learning/
```

### Phase 3: Implement new features
- Dashboard server and UI
- Multi-LLM router
- Sub-agent services
- Claude Code optimizations

## Key Differences: v1 vs v2

### orch/ (v1.0)
- Monolithic architecture
- Fixed agent count
- Basic orchestration
- Limited visibility
- Single LLM usage

### orchv2/ (v2.0)
- Service-oriented (via sub-agents)
- Dynamic agent discovery
- HTML dashboard with drill-down
- Multi-LLM optimization
- Claude Code native
- Self-learning system
- Live browser testing
- Leader verification

## Dashboard URL Structure

```
http://localhost:8080/
├── /                      # Roadmap overview
├── /milestone/:id         # Milestone details
├── /prd/:id              # PRD progress
├── /task/:id             # Task details
├── /agent/:name          # Agent activity
├── /metrics              # Performance metrics
├── /costs                # LLM cost breakdown
└── /api/                 # REST API endpoints
    ├── /api/progress
    ├── /api/agents
    ├── /api/metrics
    └── /api/drill-down
```

## Data Flow in v2.0

```
1. Claude Code → Main Orchestrator
2. Main Orchestrator → Task Tool → Sub-Agent Services
3. Sub-Agent Services → Individual Agents (via Task Tool)
4. Agents → Work Output → Verification Service
5. All Services → Reporting Service → Dashboard
6. Dashboard → WebSocket → Real-time Updates to Browser
```

## Configuration Files

### orchv2/config/orchv2-config.yaml
```yaml
orchestration:
  max_parallel_agents: 100
  phase_timeout: 3600
  verification_required: true
  learning_enabled: true

dashboard:
  port: 8080
  update_interval: 1000
  drill_down_levels: 5

claude_code:
  tool_batch_size: 10
  context_optimization: true
  session_persistence: true
```

### orchv2/config/llm-config.json
```json
{
  "models": {
    "claude-3-opus": {
      "cost_per_1k": 0.015,
      "max_tokens": 4096,
      "assigned_agents": ["cto", "security-architect"]
    },
    "claude-3-sonnet": {
      "cost_per_1k": 0.003,
      "max_tokens": 4096,
      "assigned_agents": ["frontend-engineer", "backend-engineer"]
    }
  }
}
```

## Start Commands

### v1.0 (Current)
```bash
cd orch
npm run start:real  # Start with real agents
```

### v2.0 (New)
```bash
cd orchv2
npm run start       # Start orchestrator with dashboard
npm run dashboard   # Dashboard only
npm run migrate     # Migrate from v1
```

## Development Workflow

1. **Development** happens in orchv2/
2. **Testing** uses orchv2/testing/
3. **Agent work** outputs to app/
4. **PRDs** stored in app/PRDs/
5. **Dashboard** accessible at localhost:8080
6. **Logs** in orchv2/logs/
7. **Metrics** in orchv2/data/metrics/

---

*This structure supports the transition from v1.0 to v2.0 while maintaining backward compatibility*