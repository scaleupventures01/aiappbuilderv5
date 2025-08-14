# Orchestrator Workflows

## ORCH START - Autonomous Testing & Verification

### Invocation
```bash
# In terminal or chat
ORCH START

# With specific PRD
npm run orch:start -- --prd-path app/PRDs/V1/1.1.1.1.0.0-feature-prd.md

# With roadmap ID
npm run orch:start -- --id 1.1.1.1.0.0
```

### Workflow Steps

#### 1. Discovery Phase
- Identify ROADMAP_ID from Plans/product-roadmap.md
- Open PRD at PRDs/<Milestone>/<ROADMAP_ID>-<slug>-prd.md
- Set roadmap Status → In Progress
- Mirror status in docs/product-roadmap.html

#### 2. Team Activation (PM/TPM-led)
- Select required roles from orch/team/
- Record owners in PRD header and collaboration blocks
- Available roles:
  - Engineering: frontend, backend, full-stack, devops, SRE
  - AI/ML: ai-engineer, ml-engineer, data-scientist, mlops
  - Quality: qa-engineer, qa-automation-engineer
  - Product: product-manager, technical-product-manager
  - Design: ux-ui-designer, ux-researcher
  - Leadership: cto, vp-engineering, vp-product

#### 3. Task Decomposition
Insert execution plan into PRD:

| Task ID | Owner (Role) | Description | Dependencies | Outputs | Risks | Status |
|---------|--------------|-------------|--------------|---------|-------|--------|
| EX-01 | Frontend | Build UI component | None | src/components/X.tsx | Browser compat | Planned |
| EX-02 | QA | Test component | EX-01 | QA/test-results.md | Flaky tests | Blocked |

#### 4. Implementation
- Complete docs/design/code/tests per Execution Plan
- After each change: run lint/build/tests to green
- Update PRD §8 (Changelog) and §9.6 (Decisions)
- Create QA artifacts under QA/<ROADMAP_ID>-<slug>/

#### 5. Verification
- Run full test suite
- Execute QA test cases
- Publish results with Overall Status: Pass
- Link in PRD §7.3 and §9.4

#### 6. Completion
- Flip roadmap status to Ready/Done
- Mirror in docs/product-roadmap.html
- Maintain natural ascending phase order
- Ensure all references are clickable

## PRD Collaboration Workflow

### Review Sequence
1. **Product Manager** - Scope/user stories/acceptance
2. **VP-Product** - Business alignment/KPIs
3. **CTO** - Tech constraints/defaults
4. **Security** - Threat model/controls
5. **UX/UI Designer** - Flow notes/labels/states
6. **Legal/Compliance** - Disclaimer/privacy
7. **QA Engineer** - Test scenarios/acceptance
8. **VP-Engineering** - Feasibility/sequencing
9. **Implementation Owner** - Implementation plan/risks

### Handoff Contracts

#### Product Manager
- **Input**: Business strategy constraints
- **Output**: Final scope, user stories, acceptance criteria

#### VP-Product
- **Input**: PM outputs
- **Output**: Success metrics/KPIs, go/no-go gates

#### CTO
- **Input**: PM scope, VP-Product KPIs
- **Output**: Technical constraints, security guardrails

#### Security
- **Input**: PM scope, CTO constraints
- **Output**: Threat model, security requirements, scan plan

#### UX/UI Designer
- **Input**: PM scope, CTO constraints
- **Output**: Flow notes, labels, validation states

#### Legal
- **Input**: UX copy, CTO constraints
- **Output**: Approved disclaimer/privacy language

#### QA Engineer
- **Input**: PM acceptance, CTO constraints, UX states
- **Output**: Test scenarios, published test results

#### VP-Engineering
- **Input**: All above
- **Output**: Feasibility note, Ready recommendation

#### Implementation Owner
- **Input**: All above
- **Output**: Implementation plan, rollback notes

## Do-It-Fully Policy

### Definition of Done
- Code implemented and merged to main branch
- Linting/type checks pass
- Unit/integration tests passing in CI
- QA test cases executed with Overall Status: Pass
- QA results published and linked in PRD
- Roadmap updated in both .md and .html formats
- Performance budgets configured (if applicable)
- Security scans complete (no High/Critical)
- Excellence Checklist completed

### No Partial Handoffs
- Do not pause after coding to ask about testing
- Do not ask user to test
- Testing must be completed first
- Only notify after QA Pass published

## Range Execution Workflow

### Invocation
```bash
# Execute range of features
DO RANGE START=2.3.1.3 END=2.3.1.7

# Or with arrow notation
DO RANGE 2.3.1.3 → 2.3.1.7
```

### Behavior
- Process items in document order from roadmap
- For each item: 
  - Flip to In Progress
  - Create/confirm PRD
  - Conduct role reviews
  - Implement with minimal edits
  - Run tests and QA
  - Publish results
  - Update PRD and roadmap
  - Advance to next item
- Stop only if blocked by unresolved questions

## List Execution Workflow

### Invocation
```bash
# Execute specific items
DO LIST=2.1.1.1,2.1.2.3,2.3.1.2

# Or with items keyword
DO ITEMS 2.3.1.3, 2.3.1.7, 2.2.1.2
```

### Behavior
- Process items in order specified
- Same workflow as Range Execution
- Skip items not found in roadmap
- Maintain phase ordering after updates

## Bug Fix Workflow (RCA + 10-Whys)

### Invocation
```bash
# Trigger RCA workflow
"fix the bug"
# or
"fix the problem"
```

### Process
1. **Triage & Evidence**:
   - Capture logs and error details
   - Document reproduction steps
   - Save sessionStorage['lastError']

2. **10-Whys Analysis**:
   - Run across all roles (PM, VP-Product, CTO, UX, Legal, QA, VP-Eng)
   - Identify root causes
   - Document causal chain

3. **Solution Development**:
   - Generate ≥2 solution options per root cause
   - Include effort/risk/owner/files/tests
   - Select minimal, reversible approach

4. **Implementation**:
   - Apply fixes with minimal edits
   - Run lint/build/tests
   - Execute QA validation

5. **Verification**:
   - Publish test results with Overall Status: Pass
   - Link in PRD 9.4
   - Update roadmap and mirror

### Multi-Issue Mode
When multiple bugs present:
- Normalize and cluster issues
- Analyze linkage between bugs
- Run per-issue and cross-cutting analysis
- Plan shared and issue-specific fixes

## Continuous Testing Methodology

### Required Smoke Tests
Always run for UI changes:
- Component mounting
- Core user flows
- Data persistence
- No console errors

### Full Regression
Run before releases:
- All test cases from QA folder
- Performance benchmarks
- Security scans
- Accessibility checks

### Test Execution
```bash
# Unit tests
npm test --run

# E2E tests
npm run e2e:local

# With Playwright
npx playwright test --reporter=list

# Coverage
npm test -- --coverage
```

### Reporting Requirements
Each test run must document:
- Build under test (commit/date)
- Environment/browsers tested
- Tester identification
- Overall Status (Pass/Fail)
- Per-case results table
- Evidence artifacts (screenshots, logs)

## Security Gates

### Required Scans
Before marking Ready/Done:

1. **Secrets Scanning**:
   - Tool: Gitleaks/TruffleHog
   - Gate: No High/Critical findings

2. **Dependency Scan**:
   - Tool: npm audit, OSV
   - Gate: No High/Critical vulnerabilities

3. **SAST Analysis**:
   - Tool: Semgrep
   - Gate: No High/Critical issues

4. **SBOM Generation**:
   - Format: CycloneDX
   - Required for each build

### Evidence Storage
- Location: security/evidence/<roadmap-id>/
- Link in PRD §9.4 and §10

## Roadmap Synchronization

### Files to Keep in Sync
- **Source**: Plans/product-roadmap.md
- **Mirror**: docs/product-roadmap.html

### Sync Requirements
- Any change to .md must update .html
- Same change cycle/commit
- Content must match exactly
- HTML includes "Output Files/Folder" column
- All paths must be clickable links

### Validation Checklist
- [ ] IDs match between files
- [ ] Status/dates synchronized
- [ ] Owners consistent
- [ ] File paths updated
- [ ] Links are clickable
- [ ] Natural phase ordering maintained

## Excellence Standard

### Principles
- Best-work-first approach
- Minimal token usage
- Evidence-driven decisions
- Comprehensive documentation

### Excellence Checklist (PRD §10)
- [ ] QA results linked with Pass status
- [ ] Security evidence attached
- [ ] Performance metrics documented
- [ ] Roadmap/mirror synchronized
- [ ] Changelog updated
- [ ] Decision log current
- [ ] All reviewer checkboxes marked

## Automation Helpers

### File Creation Policy
For this project, automatic creation allowed for:
- QA artifacts (test-cases.md, test-results.md)
- Documentation files
- Evidence artifacts
- Test scaffolds

### Parallel Execution
When possible, parallelize:
- Independent file reads/searches
- Multiple tool invocations
- Diagnostic commands
- Test suite components

### Error Recovery
On failure:
1. Capture full error context
2. Identify minimal fix
3. Apply reversible edit
4. Rerun affected component
5. Verify green status
6. Run full suite confirmation