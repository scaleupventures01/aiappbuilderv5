# Orchestrator System (ORCH)

## Overview
The Orchestrator (ORCH) is an autonomous workflow management system that coordinates development, testing, and deployment activities following PRD specifications and team role definitions.

## Quick Start

### Installation
```bash
# From project root
cd orch
npm install
```

### Basic Usage
```bash
# Start orchestrator with roadmap ID
npm run orch:start -- --id 1.1.1.1.0.0

# Start with PRD path
npm run orch:start -- --prd-path ../app/PRDs/V1/1.1.1.1.0.0-feature-prd.md

# Natural language interface
./orch "view pending approvals"
./orch "approve feature 1"
```

## Key Features

### 🤖 Autonomous Workflows
- PRD-driven development lifecycle
- Automated test execution and validation
- Role-based task assignment
- Continuous integration support

### 👥 Team Role Management
25 specialized role definitions for:
- Engineering (frontend, backend, full-stack, DevOps)
- AI/ML (AI engineer, ML engineer, data scientist)
- Quality (QA engineer, automation engineer)
- Product (PM, TPM, UX designer)
- Leadership (CTO, VP Engineering, VP Product)

### 📋 PRD Integration
- Automatic PRD parsing and validation
- QA artifact generation
- Review workflow coordination
- Status tracking and updates

### 🔄 Workflow Types
- **ORCH START**: Full autonomous execution
- **Range Execution**: Process multiple features sequentially
- **List Execution**: Process specific feature set
- **Bug Fix**: RCA with 10-Whys analysis

## Architecture

```
orch/
├── docs/                  # Documentation
│   ├── RUNBOOK.md        # Operational procedures
│   └── WORKFLOWS.md      # Detailed workflow guides
├── lib/                  # Core libraries
│   ├── orch-start.mjs   # Main entry point
│   └── orch/            # Utility modules
│       ├── prd-utils.mjs     # PRD manipulation
│       ├── qa-utils.mjs      # QA management
│       ├── roadmap-utils.mjs # Roadmap sync
│       └── workflow-runner.mjs # Execution engine
├── team/                 # Role definitions
│   ├── _templates/       # Role templates
│   └── *.md             # Individual roles
├── scripts/             # Automation scripts
├── tests/              # Test suites
└── package.json        # Dependencies

```

## Core Workflows

### 1. Development Workflow
```mermaid
graph LR
    A[PRD Created] --> B[Team Assignment]
    B --> C[Task Decomposition]
    C --> D[Implementation]
    D --> E[Testing]
    E --> F[Verification]
    F --> G[Deployment]
```

### 2. Review Workflow
Sequential reviews by:
1. Product Manager
2. VP-Product
3. CTO
4. Security
5. UX/UI Designer
6. Legal/Compliance
7. QA Engineer
8. VP-Engineering
9. Implementation Owner

### 3. Quality Gates
- ✅ Lint/build/test passes
- ✅ QA Overall Status: Pass
- ✅ Security scans clean (SAST/DAST/Secrets)
- ✅ Privacy compliance verified
- ✅ Performance budgets met
- ✅ Documentation updated

### 4. Security Review Workflow
Integrated security review process with specialized agents:
1. **CISO** - Risk assessment and compliance approval
2. **Security Architect** - Threat modeling and control design
3. **Application Security Engineer** - Code security testing
4. **DevSecOps Engineer** - CI/CD security automation
5. **Privacy Engineer** - Data protection and GDPR/CCPA compliance
6. **AI Safety Engineer** - AI-specific security and safety testing

## Team Roles

### Engineering
- `frontend-engineer.md` - UI/UX implementation
- `backend-engineer.md` - Server-side development
- `full-stack-engineer.md` - End-to-end features
- `devops-engineer.md` - Infrastructure & CI/CD
- `site-reliability-engineer.md` - System reliability
- `implementation-owner.md` - Feature delivery ownership

### AI/ML Specialists
- `ai-engineer.md` - AI integration
- `machine-learning-engineer.md` - ML models
- `ml-research-scientist.md` - Algorithm research
- `mlops-engineer.md` - ML operations
- `data-scientist.md` - Data analysis
- `data-engineer.md` - Data pipelines
- `ai-safety-engineer.md` - AI safety & red teaming

### Security & Privacy
- `ciso.md` - Chief Information Security Officer
- `security-architect.md` - Security architecture & threat modeling
- `application-security-engineer.md` - SAST/DAST & vulnerability management
- `devsecops-engineer.md` - CI/CD security automation
- `privacy-engineer.md` - Privacy & data protection (DPO)

### Quality Assurance
- `qa-engineer.md` - Test planning & execution
- `qa-automation-engineer.md` - Test automation

### Product & Design
- `product-manager.md` - Product strategy
- `technical-product-manager.md` - Technical specs
- `ux-ui-designer.md` - Interface design
- `ux-researcher.md` - User research

### Business & Operations
- `business-analyst.md` - Requirements & process analysis
- `project-manager.md` - Project planning & coordination

### Leadership
- `cto.md` - Technical strategy
- `chief-ai-officer.md` - AI governance
- `vp-engineering.md` - Engineering management
- `vp-product.md` - Product leadership
- `staff-engineer.md` - Technical leadership

## Commands Reference

### Start Commands
```bash
# Basic start
npm run orch:start

# With specific ID
npm run orch:start -- --id 1.1.1.1.0.0

# Dry run mode
npm run orch:start -- --id 1.1.1.1.0.0 --dry-run
```

### Natural Language Commands
```bash
# View tasks
./orch "view pending approvals"
./orch "show task breakdown 1"

# Approve/reject
./orch "approve 1"
./orch "reject 1"

# Help
./orch help
```

### Advanced Workflows
```bash
# Range execution
DO RANGE START=2.1.1.1 END=2.1.1.5

# List execution
DO LIST=2.1.1.1,2.2.1.1,2.3.1.1

# Bug fix with RCA
"fix the bug"
"fix the problem"
```

## Configuration

### Environment Variables
```bash
# Debug mode
DEBUG=orch:* npm run orch:start

# Custom paths
ORCH_APP_ROOT=/path/to/app
ORCH_TEAM_DIR=/path/to/team
```

### Package Scripts
```json
{
  "scripts": {
    "orch:start": "node lib/orch-start.mjs",
    "orch:test": "node tests/run-tests.mjs",
    "orch:lint": "eslint lib/**/*.mjs"
  }
}
```

## Integration Points

### With App Development
- Reads PRDs from `app/PRDs/`
- Creates QA artifacts in `app/QA/`
- Updates roadmap in `app/Plans/`
- Syncs HTML mirror in `app/docs/`

### With CI/CD
- Triggers on PR creation
- Runs quality gates including security checks
- Blocks on failures (including security/privacy violations)
- Reports status with detailed security findings

### With Testing
- Executes unit tests
- Runs E2E suites
- Performs security testing (SAST/DAST)
- Generates coverage including security coverage
- Publishes results with vulnerability reports

### With Security & Compliance
- Automated security reviews at each stage
- Privacy impact assessments for data-handling features
- SBOM generation for supply chain security
- Compliance verification (GDPR, CCPA, SOC2)
- AI safety testing for ML/LLM features

## Best Practices

### PRD Management
1. Always create PRD from template
2. Complete all required sections
3. Get role sign-offs sequentially
4. Link QA results before Ready

### Team Coordination
1. Assign roles early
2. Document dependencies
3. Track blockers actively
4. Communicate status changes

### Quality Assurance
1. Write test cases first
2. Execute all scenarios
3. Document evidence
4. Achieve Overall Pass

### Security
1. Run all required scans
2. Fix High/Critical issues
3. Generate SBOM
4. Document mitigations

## Troubleshooting

### Common Issues

**Orchestrator won't start**
- Check Node.js version (≥18)
- Verify PRD path exists
- Ensure dependencies installed

**Tests failing**
- Clear node_modules
- Reinstall dependencies
- Check test environment

**Team roles not loading**
- Verify team/ directory exists
- Check file permissions
- Validate .md extensions

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* npm run orch:start -- --id 1.1.1.1.0.0

# Check configuration
node -p "require('./package.json').scripts"

# List team roles
ls -la team/*.md
```

## Documentation

- 📚 [RUNBOOK](docs/RUNBOOK.md) - Operational procedures
- 🔄 [WORKFLOWS](docs/WORKFLOWS.md) - Detailed workflows
- 👥 [Team Roles](team/) - Role definitions
- 📋 [PRD Template](../app/PRDs/_templates/PRD-template.md) - PRD structure

## Support

For issues or questions:
1. Check documentation first
2. Review runbook procedures
3. Consult workflow guides
4. Contact technical lead

## License

Internal use only. Property of Elite Trading Coach AI.