# Orchestrator Runbook

## Overview
The orchestrator system manages autonomous workflows for development, testing, and deployment of features following PRD specifications. It enforces the Do-It-Fully policy and Excellence Standard to ensure complete, high-quality deliverables.

## Quick Start Commands

### Start Orchestrator Workflow
```bash
# Start with PRD path
npm run orch:start -- --prd-path app/PRDs/V1/1.1.1.1.0.0-user-authentication-prd.md

# Start with roadmap ID
npm run orch:start -- --id 1.1.1.1.0.0

# Dry run mode
npm run orch:start -- --id 1.1.1.1.0.0 --dry-run
```

### Natural Language Interface
```bash
# View pending approvals
./orch/orch "view pending approvals"

# See task breakdown
./orch/orch "see task breakdown 1"

# Approve feature
./orch/orch "approve 1"
```

## Team Roles & Responsibilities

The system includes 25 role definitions in `orch/team/`:

### Engineering Roles
- `frontend-engineer.md` - UI/UX implementation
- `backend-engineer.md` - API and server logic
- `full-stack-engineer.md` - End-to-end features
- `devops-engineer.md` - Infrastructure and CI/CD
- `site-reliability-engineer.md` - Monitoring and reliability

### AI/ML Roles
- `ai-engineer.md` - AI system integration
- `machine-learning-engineer.md` - ML model development
- `ml-research-scientist.md` - Algorithm research
- `mlops-engineer.md` - ML operations and deployment
- `data-scientist.md` - Data analysis and insights
- `data-engineer.md` - Data pipeline development
- `data-analyst.md` - Business intelligence

### Quality & Testing
- `qa-engineer.md` - Manual testing and test planning
- `qa-automation-engineer.md` - Automated test development

### Product & Design
- `product-manager.md` - Feature requirements and roadmap
- `technical-product-manager.md` - Technical specifications
- `ux-ui-designer.md` - User interface design
- `ux-researcher.md` - User research and testing

### Leadership
- `cto.md` - Technical strategy and architecture
- `chief-ai-officer.md` - AI strategy and governance
- `vp-engineering.md` - Engineering management
- `vp-product.md` - Product strategy
- `staff-engineer.md` - Technical leadership

### Special Workflows
- `rca-10-whys-prompt.md` - Root cause analysis workflow

## Incident Response

### Severity Levels
- **SEV-1**: App unusable for all users (cannot load/seed data), system completely unusable
- **SEV-2**: Core flows blocked (cannot save plan or log journal), core functionality blocked
- **SEV-3**: Degraded experience (toasts/banners/diagnostics issues)

### Triage Steps
1. Reproduce issue and capture console logs with timestamps
2. Check sessionStorage['lastError'] if available
3. Toggle Monitoring in Settings to capture breadcrumbs (dev only)
4. Check CSP console for violations after recent changes
5. Review recent changes for correlation
6. Run RCA workflow if needed

### Recovery Procedures
1. **Data Issues**:
   - Open Settings → Backup & Restore
   - Export backup if possible (for evidence)
   - If prior backup exists: Import Backup JSON
   - Verify plan/journal restored
   - Verify data integrity

2. **Build/Deploy Issues**:
   - Roll back to last known good version
   - Run smoke tests
   - Verify all critical paths

3. **UI Stuck Due to Error Overlay**:
   - Reload page
   - Verify auth gate and resume

### Root Cause Analysis
Use the RCA workflow:
```bash
# Trigger RCA workflow
./orch/orch "fix the bug"
# or
./orch/orch "fix the problem"
```

## Workflow Execution

### PRD-Driven Development (ORCH START Workflow)

#### Do-It-Fully Policy
Done means shipped code + green CI + published QA Pass + roadmap/mirror updated in the same commit. Documentation-only or QA-only changes cannot mark features Done.

1. **Initialization**:
   - PRD created from template
   - QA artifacts scaffolded
   - Status flipped to "In Progress"

2. **Role Assignment**:
   - PM/TPM select required roles
   - Team members assigned to tasks
   - Dependencies mapped

3. **Implementation**:
   - Code developed per PRD specs
   - Tests written and executed
   - QA validation performed

4. **Quality Gates (Excellence Standard)**:
   - Lint/build/test suite passes
   - QA publishes "Overall Status: Pass"
   - Security scans complete (no High/Critical)
   - Zero console errors and warnings
   - Performance budgets met
   - Screenshots captured (UI features)

5. **Completion**:
   - Status flipped to "Done"
   - Roadmap updated
   - HTML mirror synchronized
   - Evidence published under QA/<id>-<slug>/
   - Links added to PRD section 9.4

### Continuous Testing
- **Unit Tests**: `npm test` (happy-dom)
- **Real Browser Tests**: `npm run e2e:install` then `npm run e2e` or `npm run e2e:local`
- **Smoke Tests**: Run on every change
- **Full Regression**: Before releases
- **Performance Tests**: For critical paths
- **Security Scans**: On every build
- **UI Quality Gate**: Mandatory for any UI-affecting change

## File Structure

```
orch/
├── docs/               # Documentation
│   ├── RUNBOOK.md     # This file
│   └── WORKFLOWS.md   # Detailed workflows
├── lib/               # Core libraries
│   ├── orch-start.mjs # Main orchestrator
│   └── orch/          # Utility modules
├── team/              # Role definitions
│   └── *.md          # Individual role files
├── scripts/           # Automation scripts
└── tests/            # Test suites
```

## Monitoring & Observability

### Key Metrics
- Task completion rate
- Test pass rate
- Build success rate
- Time to resolution

### Logging
- All actions logged with timestamps
- Error details captured
- Performance metrics tracked

### Alerts
- Build failures
- Test regressions
- Security violations
- Performance degradation

## Security Considerations

### Access Control
- Role-based permissions
- Audit logging enabled
- Sensitive data protected

### Scanning Requirements
- Secrets scanning (no high/critical)
- Dependency vulnerabilities (no high/critical)
- SAST analysis (no high/critical)
- SBOM generation required

## Maintenance

### Daily Tasks
- Review pending approvals
- Monitor build status
- Check test results
- Update PRD section 9.5 (Reviewer Notes) with date/owner

### Weekly Tasks
- Update dependencies
- Review security reports
- Archive old artifacts
- Check file sizes: `node lib/check-size.mjs`

### Monthly Tasks
- Performance review
- Process improvements
- Documentation updates
- Update Excellence Standard checklist

## Size Governance

### Thresholds
- **WARN**: > 400 lines (advisory)
- **FAIL**: > 600 lines (blocking)
- **Scope**: `.js`, `.mjs`, `.cjs`, `.css`, `.html`
- **Ignore**: `node_modules`, `.git`, `QA`, `docs`, `index.html`

### CI Gate
- Run: `node lib/check-size.mjs`
- Treat WARN as advisory
- Treat FAIL as blocking
- Publish results in `QA/file-architecture-split/test-results-YYYY-MM-DD.md`

## Dependency Management Policy

### Approval Rules
- Project-local dependency changes are pre-approved
- Editing `package.json` and lockfiles in-repo
- Running installs in-repo (e.g., `npm install`, `npm ci`)

### Procedure
1. Use `npm` (lockfile present)
2. Install within the repo only:
   - Root: `npm install <pkg>@<version>`
   - App: `cd app && npm install <pkg>@<version>`
   - Orch: `cd orch && npm install <pkg>@<version>`
3. Commit both `package.json` and lockfile changes together

### Recording Changes
- Summarize dependency deltas in PRD section 8 (Changelog)
- If deps impact functionality or size gates, include note in QA results

### Lockfiles and Reproducibility
- Prefer `npm ci` in CI for deterministic installs
- Do not hand-edit lockfiles

## Release/Push Procedure

### Preconditions
- QA results published with Overall Status: Pass and linked in PRD 9.4
- Roadmap updated and HTML mirror in sync (same change set)

### Steps
1. Merge/push to default branch: `git push -u origin main`
2. Optional: create and push tag: `git tag -a vX.Y -m "<release notes>" && git push --tags`

### Notes
- For multi-feature ranges, repeat per feature after each Done flip
- Ensure ordering rules hold after merges

## Troubleshooting

### Common Issues

**Issue**: Orchestrator fails to start
- Check PRD path exists
- Verify roadmap ID format
- Ensure dependencies installed

**Issue**: Tests failing
- Check test environment
- Verify test data
- Review recent changes

**Issue**: Build errors
- Clear node_modules
- Reinstall dependencies
- Check Node version

### Debug Commands
```bash
# Verbose logging
DEBUG=* npm run orch:start -- --id 1.1.1.1.0.0

# Check team files
ls -la orch/team/

# Validate PRD
node -e "console.log(require('fs').readFileSync('app/PRDs/V1/1.1.1.1.0.0-user-authentication-prd.md', 'utf8'))"
```

## Contact & Support

For issues or questions:
1. Check this runbook first
2. Review team role definitions
3. Consult PRD documentation
4. Reference `docs/Excellence-Standard.md`
5. Apply Excellence Checklist when closing incidents
6. Provide high-signal notes and link evidence
7. Escalate to technical lead if needed

## Postmortem

After incident resolution:
1. Document root cause, impact, and fixes in PRD section 8 (Changelog)
2. Apply Excellence Checklist (summary, evidence links, roadmap/mirror verified)
3. Update this runbook with learnings

## Excellence Standard Summary

All roles follow the Excellence Standard:
- Best-work-first approach
- Minimal tokens usage
- Evidence-driven decisions
- See PRD section 10 (Excellence Checklist) for required links and gates