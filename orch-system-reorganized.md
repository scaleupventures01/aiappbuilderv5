# ORCH System - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [ID Format Convention](#id-format-convention)
4. [Installation & Setup](#installation--setup)
5. [File Structure](#file-structure)
6. [Core Components](#core-components)
7. [CLI Commands & Usage](#cli-commands--usage)
8. [Templates](#templates)
9. [Team Roles](#team-roles)
10. [Configuration](#configuration)
11. [Advanced Features](#advanced-features)
12. [Implementation Roadmap](#implementation-roadmap)
13. [Troubleshooting](#troubleshooting)

## Overview

The ORCH System is a comprehensive orchestration framework for managing the complete product development lifecycle. It provides:

- **Clear Separation of Concerns**: App-specific content (PRDs, Plans, QA) in `app/` folder, orchestration tools in `orch/` folder
- **Hierarchical Task Management**: X.X.X.X.X.X ID format for features, tasks, and subtasks
- **Automated Workflows**: PRD generation, QA artifact creation, roadmap synchronization
- **Team Collaboration**: Role-based assignments and handoffs
- **Quality Gates**: Built-in testing, security scanning, and performance checks

### Key Benefits
- ✅ Reduced manual work through automation
- ✅ Consistent project structure across teams
- ✅ Clear traceability from requirements to deployment
- ✅ Built-in best practices and quality checks
- ✅ Scalable from small projects to enterprise

## System Architecture

### Workspace Structure
```
project-root/
├── app/          # Application + app-specific content
│   ├── src/      # Application source code
│   ├── PRDs/     # Product Requirements Documents
│   ├── Plans/    # Roadmaps and sprint plans
│   ├── QA/       # Test cases and results
│   └── security/ # Security evidence
│
├── orch/         # Orchestration system
│   ├── lib/      # Core libraries and utilities
│   ├── team/     # Role definitions
│   ├── docs/     # System documentation
│   └── scripts/  # Automation scripts
│
└── package.json  # Root workspace configuration
```

### Design Principles
1. **Separation of Concerns**: Application logic separate from orchestration
2. **Single Source of Truth**: Roadmap in markdown, HTML generated from it
3. **One Feature Per PRD**: Clear ownership and scope
4. **Automation First**: Minimize manual processes
5. **Progressive Enhancement**: Start simple, add complexity as needed

## ID Format Convention

All features, tasks, and subtasks follow a hierarchical ID format: **X.X.X.X.X.X**

| Position | Component | Description | Example |
|----------|-----------|-------------|---------|
| 1st digit | Version | Major release version | 1, 2, 3 |
| 2nd digit | Major | Major feature category | Authentication, Profile |
| 3rd digit | Minor | Minor feature group | Login, Settings |
| 4th digit | Feature | Specific feature (gets PRD) | User Login Form |
| 5th digit | Task | Task within feature | Add validation |
| 6th digit | Subtask | Subtask within task | Email validation |

### Examples
- `1.1.1.1.0.0` - User Authentication (feature-level, gets its own PRD)
- `1.1.2.1.0.0` - User Profile Page (separate feature, separate PRD)
- `1.1.2.1.1.0` - Profile Avatar Upload (task within Profile Page)
- `1.1.2.1.1.1` - Avatar Compression (subtask of Avatar Upload)

**Important Rules:**
- Each X.X.X.X.0.0 represents ONE feature and gets ONE PRD
- Tasks (5th digit) are tracked within the parent feature's PRD
- Subtasks (6th digit) are implementation details within tasks

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm 8+
- Git (optional but recommended)
- Unix-like environment (macOS, Linux, WSL)

### Quick Start (Automated)

```bash
# Clone the setup script
curl -O https://raw.githubusercontent.com/your-org/orch-system/main/setup.sh
chmod +x setup.sh
./setup.sh my-project

# Or use the interactive wizard
npx create-orch-system my-project
```

### Manual Setup

#### Step 1: Initialize Project
```bash
# Create project directory
mkdir my-project && cd my-project

# Initialize npm with workspaces
npm init -y

# Set up workspace structure
mkdir app orch
```

#### Step 2: Configure Workspaces
```bash
# Configure root package.json
cat > package.json << 'EOF'
{
  "name": "project-root",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["app", "orch"],
  "scripts": {
    "app:dev": "cd app && npm run dev",
    "app:build": "cd app && npm run build",
    "app:test": "cd app && npm run test",
    "app:lint": "cd app && npm run lint",
    "orch:start": "cd orch && node lib/orch-start.mjs",
    "orch:new": "cd orch && node lib/scaffold-feature.mjs",
    "orch:wizard": "cd orch && node lib/interactive-setup.mjs",
    "orch:status": "cd orch && node lib/status-dashboard.mjs",
    "orch:check": "cd orch && node lib/preflight-check.mjs",
    "install:all": "npm install",
    "test:all": "npm run test --workspaces",
    "lint:all": "npm run lint --workspaces"
  }
}
EOF
```

#### Step 3: Install Dependencies

##### Core Dependencies
```bash
npm install --save-dev \
  eslint@^9.33.0 \
  prettier@^3.3.3 \
  vitest@^2.1.9 \
  @playwright/test@^1.46.0 \
  typescript@^5.5.4 \
  @typescript-eslint/parser@^8.7.0 \
  @typescript-eslint/eslint-plugin@^8.7.0 \
  vite@^5.4.2 \
  happy-dom@^18.0.1 \
  eslint-config-prettier@^9.1.0
```

##### Enhanced CLI Dependencies (Optional but Recommended)
```bash
npm install --save-dev \
  inquirer@^9.2.0 \
  chalk@^5.3.0 \
  progress@^2.0.3 \
  cli-table3@^0.6.3 \
  figlet@^1.6.0
```

#### Step 4: Create Directory Structure
```bash
# App directories
cd app
mkdir -p src/{components,views,services,utils,types} \
         public dist \
         PRDs/{V1,V2,V3,_templates} \
         Plans QA security/evidence \
         tests/{unit,e2e}

# Initialize app package.json
npm init -y

# Orch directories
cd ../orch
mkdir -p lib/orch team/_templates \
         docs scripts tests/{unit,integration}

# Initialize orch package.json
npm init -y

# Create executable
touch orch && chmod +x orch
cd ..
```

#### Step 5: Initialize Core Files
```bash
# Run preflight check to create missing files
npm run orch:check

# Or use the wizard for guided setup
npm run orch:wizard
```

## File Structure

### Complete Directory Layout
```
project-root/
├── app/                         # APPLICATION + APP-SPECIFIC CONTENT
│   ├── index.html              # Main application HTML
│   ├── package.json            # App-specific dependencies
│   ├── vite.config.mjs         # Vite configuration
│   ├── tsconfig.json           # TypeScript config
│   ├── src/
│   │   ├── main.ts             # App entry point
│   │   ├── components/         # UI components
│   │   ├── views/              # Page views
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Utility functions
│   │   └── types/              # TypeScript types
│   ├── public/                 # Static assets
│   ├── dist/                   # Build output
│   ├── PRDs/                   # Product Requirements Documents
│   │   ├── README.md           # PRD governance & gates
│   │   ├── V1/                 # Version 1 PRDs (1.x.x.x)
│   │   ├── V2/                 # Version 2 PRDs (2.x.x.x)
│   │   ├── V3/                 # Version 3 PRDs (3.x.x.x)
│   │   └── _templates/
│   │       ├── PRD-template.md
│   │       └── feature-kickoff-plan.md
│   ├── Plans/
│   │   ├── product-roadmap.md  # Canonical roadmap
│   │   ├── sprint-plan.md      # Current sprint
│   │   └── task-breakdown.md   # Task decomposition
│   ├── QA/
│   │   └── [feature-id]/
│   │       ├── test-cases.md
│   │       ├── test-results-*.md
│   │       └── evidence/
│   ├── security/
│   │   ├── README.md           # Security SOP
│   │   ├── evidence/           # Scan results
│   │   └── schemas/            # Evidence schemas
│   └── tests/
│       ├── unit/               # Unit tests
│       └── e2e/                # E2E tests
│
├── orch/                        # ORCHESTRATION SYSTEM
│   ├── orch                    # Main CLI (executable)
│   ├── package.json            # Orch dependencies
│   ├── README.md               # Orch documentation
│   ├── lib/
│   │   ├── orch-start.mjs      # Feature starter
│   │   ├── scaffold-feature.mjs # PRD scaffolding
│   │   ├── interactive-setup.mjs # Wizard interface
│   │   ├── status-dashboard.mjs # System dashboard
│   │   ├── preflight-check.mjs # Health checks
│   │   ├── batch-operations.mjs # Bulk processing
│   │   ├── generate-roadmap-html.mjs # HTML generator
│   │   ├── check-roadmap-sync.mjs # Sync checker
│   │   ├── check-size.mjs      # File size governance
│   │   ├── task-decomposer.mjs # Task breakdown
│   │   ├── config-loader.mjs   # Configuration
│   │   ├── git-integration.mjs # Git automation
│   │   └── orch/
│   │       ├── prd-utils.mjs   # PRD utilities
│   │       ├── qa-utils.mjs    # QA management
│   │       ├── roadmap-utils.mjs # Roadmap sync
│   │       ├── workflow-runner.mjs # Build/test
│   │       ├── team-utils.mjs  # Role utilities
│   │       ├── security-runner.mjs # Security gates
│   │       └── task-manager.mjs # Task tracking
│   ├── team/                   # Team Role Definitions
│   │   ├── _templates/
│   │   │   └── role-playbook-template.md
│   │   ├── product-manager.md
│   │   ├── backend-engineer.md
│   │   ├── frontend-engineer.md
│   │   ├── qa-engineer.md
│   │   └── [23 more roles...]
│   ├── docs/
│   │   ├── product-roadmap.html # Generated HTML
│   │   ├── Excellence-Standard.md
│   │   └── RUNBOOK.md
│   ├── scripts/
│   │   ├── seed.mjs
│   │   └── role-assign.mjs
│   └── tests/
│       ├── unit/               # Orch unit tests
│       └── integration/        # Integration tests
│
├── package.json                # Root workspace config
├── .orchrc.json               # System configuration
├── eslint.config.mjs          # Linting rules
├── prettier.config.mjs        # Code formatting
├── .gitignore                 # Git exclusions
├── README.md                  # Project readme
└── .github/
    └── workflows/
        ├── ci.yml             # CI/CD pipeline
        └── orch-automation.yml # Automation

```

## Core Components

### 1. Main Orchestrator CLI (`orch/orch`)

The main entry point supporting natural language commands:

```javascript
#!/usr/bin/env node
/**
 * Natural Language Orchestrator Interface
 * Supports both natural language and traditional CLI commands
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get user input
const userInput = process.argv.slice(2).join(' ').toLowerCase();

// Map natural language to commands
const commandMappings = {
  // View commands
  'view pending approvals': ['approve', '--list'],
  'show pending approvals': ['approve', '--list'],
  'list pending approvals': ['approve', '--list'],
  
  // Task breakdown
  'see task breakdown': (input) => {
    const idMatch = input.match(/\b(\d+)\b/);
    if (idMatch) {
      return ['approve', '--view', idMatch[1]];
    }
    console.log('Please specify an ID. Example: "see task breakdown 1"');
    process.exit(1);
  },
  
  // Approval commands
  'approve': (input) => {
    const idMatch = input.match(/\b(\d+)\b/);
    if (idMatch) {
      return ['approve', '--id', idMatch[1], '--decision', 'approved'];
    }
    console.log('Please specify an ID. Example: "approve 1"');
    process.exit(1);
  },
  
  // Help command
  'help': () => {
    console.log(`
Natural Language Orchestrator Commands:

View Commands:
  - "view pending approvals" or "show approvals"
  - "see task breakdown 1" or "view task 1"
  
Action Commands:
  - "approve 1" - Approve feature
  - "reject 1" - Reject feature
  - "start feature 1.1.1.1" - Start development

Traditional Commands:
  - orch start --id <ID>
  - orch scaffold --id <ID> --title <TITLE>
  - orch status
  - orch check
`);
    process.exit(0);
  }
};

// Function implementation continues...
```

### 2. Feature Starter (`orch/lib/orch-start.mjs`)

Orchestrates feature development with improved error handling:

```javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureQa } from './orch/qa-utils.mjs';
import { readPrd, writePrd, ensureQaArtifactsBlock, appendChangelog } from './orch/prd-utils.mjs';
import { flipRoadmapStatus, regenerateRoadmapHtml } from './orch/roadmap-utils.mjs';
import { runDefaultWorkflow } from './orch/workflow-runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(path.join(__dirname, '..'));
const appRoot = path.resolve(path.join(__dirname, '../../app'));
const repoRoot = path.resolve(path.join(__dirname, '../..'));

// Enhanced validation
function validateFeatureId(id) {
  const pattern = /^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/;
  if (!pattern.test(id)) {
    console.error(`Invalid ID format: ${id}`);
    console.error('Expected format: X.X.X.X.X.X (e.g., 1.1.1.1.0.0)');
    console.error('Where: Version.Major.Minor.Feature.Task.Subtask');
    return false;
  }
  return true;
}

// Improved error messages
function resolvePrdPathById(roadmapId) {
  if (!validateFeatureId(roadmapId)) {
    process.exit(1);
  }
  
  const roadmapPath = path.join(appRoot, 'Plans', 'product-roadmap.md');
  
  if (!fs.existsSync(roadmapPath)) {
    console.error('❌ Roadmap not found. Creating default roadmap...');
    createDefaultRoadmap(roadmapPath);
  }
  
  const md = fs.readFileSync(roadmapPath, 'utf8');
  const line = md.split(/\r?\n/).find(l => l.includes(`| ${roadmapId} |`));
  
  if (!line) {
    console.error(`\n❌ Error: Feature ID '${roadmapId}' not found in roadmap.`);
    console.error('\n📋 Available feature IDs:');
    
    // Extract and display available IDs
    const lines = md.split(/\r?\n/);
    const idPattern = /\|\s*([\d.]+)\s*\|/;
    const availableIds = [];
    
    lines.forEach(line => {
      const match = line.match(idPattern);
      if (match && match[1].match(/^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/)) {
        availableIds.push(match[1]);
      }
    });
    
    if (availableIds.length > 0) {
      availableIds.forEach(id => console.error(`  - ${id}`));
      console.error('\n💡 Tip: Use one of the IDs above or run "npm run orch:new" to create a new feature.');
    } else {
      console.error('  No features found in roadmap.');
      console.error('\n💡 Tip: Run "npm run orch:new" to create your first feature.');
    }
    return '';
  }
  
  // Parse PRD path from roadmap
  const cols = line.split('|').map(s => s.trim());
  const planCell = cols[6] || '';
  const m = planCell.match(/`([^`]+)`/);
  if (m) return path.join(appRoot, m[1]);
  
  // Generate path if not specified
  const phase = cols[1] || 'V1';
  const version = (phase.split('—')[0] || 'V1').trim();
  const item = cols[3] || '';
  const slug = item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').replace(/--+/g, '-');
  return path.join(appRoot, 'PRDs', version, `${roadmapId}-${slug}-prd.md`);
}

// Main function continues with enhanced features...
```

### 3. Feature Scaffolding (`orch/lib/scaffold-feature.mjs`)

Automated PRD creation from templates:

```javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFeatureId } from './orch/validation-utils.mjs';
import { addToRoadmap } from './orch/roadmap-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '../../app');

export async function scaffoldFeature(id, title, owner, assignedRoles = []) {
  // Validate ID format
  if (!validateFeatureId(id)) {
    throw new Error('Invalid feature ID format');
  }
  
  // Read template
  const templatePath = path.join(appRoot, 'PRDs/_templates/PRD-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error('PRD template not found. Run "npm run orch:check" to create it.');
  }
  
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders
  const today = new Date().toISOString().slice(0, 10);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const version = `V${id.split('.')[0]}`;
  
  const prd = template
    .replace(/X\.X\.X\.X\.X\.X/g, id)
    .replace(/\[Single Feature Name\]/g, title)
    .replace(/\[Implementation Owner Role\]/g, owner)
    .replace(/\[List of roles working on this feature\]/g, assignedRoles.join(', '))
    .replace(/YYYY-MM-DD/g, today)
    .replace(/\[slug\]/g, slug);
  
  // Write PRD
  const prdPath = path.join(appRoot, 'PRDs', version, `${id}-${slug}-prd.md`);
  fs.mkdirSync(path.dirname(prdPath), { recursive: true });
  fs.writeFileSync(prdPath, prd);
  
  // Update roadmap
  await addToRoadmap(id, title, owner, prdPath);
  
  console.log(`✅ Created PRD: ${prdPath}`);
  console.log(`✅ Updated roadmap with new feature`);
  
  return prdPath;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: scaffold-feature.mjs <id> <title> <owner> [role1,role2,...]');
    console.error('Example: scaffold-feature.mjs 1.1.1.1.0.0 "User Authentication" "Backend Engineer" "QA Engineer,DevOps Engineer"');
    process.exit(1);
  }
  
  const [id, title, owner, rolesStr] = args;
  const roles = rolesStr ? rolesStr.split(',') : [];
  
  scaffoldFeature(id, title, owner, roles)
    .then(() => console.log('✨ Feature scaffolding complete!'))
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
```

### 4. Interactive Setup Wizard (`orch/lib/interactive-setup.mjs`)

User-friendly interface for feature management:

```javascript
#!/usr/bin/env node
import inquirer from 'inquirer';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import { scaffoldFeature } from './scaffold-feature.mjs';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');

export async function interactiveSetup() {
  console.log(chalk.bold.cyan('\n🚀 ORCH Feature Setup Wizard\n'));
  
  const roles = await getAvailableRoles();
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'Create new feature',
        'Start existing feature',
        'Check system status',
        'Run tests',
        'Generate reports',
        'Exit'
      ]
    }
  ]);
  
  switch(answers.action) {
    case 'Create new feature':
      await createNewFeature(roles);
      break;
    case 'Start existing feature':
      await startExistingFeature();
      break;
    case 'Check system status':
      execSync('node lib/status-dashboard.mjs', { cwd: orchRoot, stdio: 'inherit' });
      break;
    case 'Run tests':
      await runTests();
      break;
    case 'Generate reports':
      await generateReports();
      break;
    case 'Exit':
      console.log(chalk.gray('Goodbye!'));
      process.exit(0);
  }
  
  // Ask if user wants to continue
  const { continueWork } = await inquirer.prompt([{
    type: 'confirm',
    name: 'continueWork',
    message: 'Do you want to perform another action?',
    default: true
  }]);
  
  if (continueWork) {
    await interactiveSetup();
  }
}

// Implementation continues...
```

### 5. Status Dashboard (`orch/lib/status-dashboard.mjs`)

Comprehensive system overview:

```javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import Table from 'cli-table3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '../../app');

const statusEmoji = {
  'Draft': '📝',
  'Planned': '📋',
  'In Progress': '🚧',
  'Ready': '✅',
  'Blocked': '🚫',
  'Complete': '🎉'
};

export async function showDashboard() {
  const stats = await gatherStatistics();
  
  // Header
  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║       📊 ORCH System Dashboard        ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════╝\n'));
  
  // Overall Statistics Table
  const overallTable = new Table({
    head: ['Metric', 'Value'],
    colWidths: [20, 20]
  });
  
  overallTable.push(
    ['Total Features', chalk.green(stats.totalFeatures)],
    ['Active Sprints', chalk.yellow(stats.activeSprints)],
    ['Team Members', chalk.blue(stats.teamMembers)],
    ['Health Score', getHealthColor(stats.healthScore)]
  );
  
  console.log(chalk.bold('📈 Overall Statistics:'));
  console.log(overallTable.toString());
  
  // Status Breakdown
  console.log(chalk.bold('\n📋 Status Breakdown:'));
  const statusTable = new Table({
    head: ['Status', 'Count', 'Progress'],
    colWidths: [15, 10, 30]
  });
  
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    const emoji = statusEmoji[status] || '❓';
    const bar = '█'.repeat(Math.floor(count * 2));
    statusTable.push([`${emoji} ${status}`, count, bar]);
  });
  
  console.log(statusTable.toString());
  
  // Continue with more dashboard sections...
}
```

### 6. Pre-flight Checks (`orch/lib/preflight-check.mjs`)

System health verification and auto-repair:

```javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const appRoot = path.resolve(__dirname, '../../app');
const repoRoot = path.resolve(__dirname, '../..');

export async function preflightCheck(autoFix = false) {
  console.log(chalk.bold('\n🔍 Running Pre-flight Checks...\n'));
  
  const checks = [
    {
      name: 'Directory Structure',
      check: () => checkDirectories(),
      fix: () => createMissingDirectories()
    },
    {
      name: 'Required Files',
      check: () => checkRequiredFiles(),
      fix: () => createMissingFiles()
    },
    {
      name: 'NPM Dependencies',
      check: () => checkDependencies(),
      fix: () => installDependencies()
    },
    {
      name: 'Roadmap Sync',
      check: () => checkRoadmapSync(),
      fix: () => syncRoadmap()
    },
    {
      name: 'PRD Templates',
      check: () => checkTemplates(),
      fix: () => createDefaultTemplates()
    },
    {
      name: 'Configuration',
      check: () => checkConfiguration(),
      fix: () => createDefaultConfig()
    }
  ];
  
  const results = [];
  let hasFailures = false;
  
  for (const check of checks) {
    process.stdout.write(`Checking ${check.name}... `);
    try {
      const result = await check.check();
      if (result.ok) {
        console.log(chalk.green('✓'));
        results.push({ ...check, status: 'pass', result });
      } else {
        console.log(chalk.red('✗'));
        console.log(chalk.yellow(`  Issue: ${result.error}`));
        results.push({ ...check, status: 'fail', result });
        hasFailures = true;
      }
    } catch (error) {
      console.log(chalk.red('✗'));
      console.log(chalk.red(`  Error: ${error.message}`));
      results.push({ ...check, status: 'error', error });
      hasFailures = true;
    }
  }
  
  if (hasFailures) {
    const failed = results.filter(r => r.status !== 'pass');
    
    if (!autoFix) {
      console.log(chalk.yellow('\n⚠️  Some checks failed.\n'));
      const { shouldFix } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldFix',
        message: 'Attempt to fix issues automatically?',
        default: true
      }]);
      autoFix = shouldFix;
    }
    
    if (autoFix) {
      console.log(chalk.bold('\n🔧 Attempting fixes...\n'));
      
      for (const item of failed) {
        process.stdout.write(`Fixing ${item.name}... `);
        try {
          await item.fix();
          console.log(chalk.green('✓'));
        } catch (error) {
          console.log(chalk.red('✗'));
          console.log(chalk.red(`  Error: ${error.message}`));
        }
      }
      
      console.log(chalk.green('\n✅ Fixes applied. Re-running checks...\n'));
      return preflightCheck(false); // Re-run without auto-fix
    }
  } else {
    console.log(chalk.green('\n✅ All checks passed!\n'));
  }
  
  return results;
}

// Check implementations
function checkDirectories() {
  const requiredDirs = [
    'app/PRDs/V1',
    'app/PRDs/V2',
    'app/PRDs/V3',
    'app/PRDs/_templates',
    'app/Plans',
    'app/QA',
    'app/security/evidence',
    'app/tests/unit',
    'app/tests/e2e',
    'orch/lib/orch',
    'orch/team/_templates',
    'orch/docs',
    'orch/scripts'
  ];
  
  const missing = requiredDirs.filter(dir => 
    !fs.existsSync(path.join(repoRoot, dir))
  );
  
  return {
    ok: missing.length === 0,
    error: missing.length > 0 ? `Missing directories: ${missing.join(', ')}` : null,
    missing
  };
}

function createMissingDirectories() {
  const result = checkDirectories();
  if (result.missing) {
    result.missing.forEach(dir => {
      fs.mkdirSync(path.join(repoRoot, dir), { recursive: true });
    });
  }
}

// More check and fix implementations...
```

## CLI Commands & Usage

### Basic Commands

```bash
# Check system health
npm run orch:check

# Interactive wizard
npm run orch:wizard

# View system status
npm run orch:status

# Create new feature
npm run orch:new 1.1.1.1.0.0 "User Authentication" "Backend Engineer"

# Start feature development
npm run orch:start 1.1.1.1.0.0

# Run application
npm run app:dev
```

### Advanced Commands

```bash
# Batch operations
node orch/lib/batch-operations.mjs 1.1.1.1.0.0 1.1.1.2.0.0 1.1.2.1.0.0

# Generate roadmap HTML
node orch/lib/generate-roadmap-html.mjs

# Decompose tasks
node orch/lib/task-decomposer.mjs --id 1.1.1.1.0.0

# Check roadmap sync
node orch/lib/check-roadmap-sync.mjs
```

### Natural Language Commands

```bash
# Using the orch CLI directly
cd orch
./orch "view pending approvals"
./orch "start feature 1.1.1.1"
./orch "show system status"
./orch "create new feature"
```

## Templates

### PRD Template (`app/PRDs/_templates/PRD-template.md`)

```markdown
---
id: X.X.X.X.X.X
title: [Single Feature Name]
status: Draft
owner: [Implementation Owner Role]
assigned_roles: [List of roles working on this feature]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# [Single Feature Name] PRD

## Table of Contents
1. [Overview](#sec-1)
2. [User Stories](#sec-2)
3. [Functional Requirements](#sec-3)
4. [Non-Functional Requirements](#sec-4)
5. [Architecture & Design](#sec-5)
6. [Implementation Notes](#sec-6)
7. [Testing & Acceptance](#sec-7)
8. [Changelog](#sec-8)
9. [Dynamic Collaboration & Review Workflow](#sec-9)
10. [Reference Links](#sec-10)

[Template content continues...]
```

### Product Roadmap Template (`app/Plans/product-roadmap.md`)

```markdown
---
title: Product Roadmap
version: v1.0
last-updated: YYYY-MM-DD
owner: VP-Product / CTO / VP-Engineering
---

## 0. Executive Rollup

- Overall: [Status]
- Focus (next 2 sprints): [Key initiatives]
- Top risks: [Risk list]
- Mitigations: [Mitigation strategies]

## 1. Vision & Strategy

[Product vision and strategic goals]

## 2. Phases and Milestones (Canonical)

| Phase | ID | Item (Single Feature) | Status | Owner | PRD/Plan | Files/QA |
|-------|-----|----------------------|--------|-------|----------|----------|
| V1 — Foundation | 1.1.1.1.0.0 | User Authentication | Draft | Backend Eng | `PRDs/V1/1.1.1.1.0.0-user-authentication-prd.md` | `QA/1.1.1.1.0.0-user-authentication/` |

[Template continues...]
```

## Team Roles

### CRITICAL: Agent Invocation Policy

**DEFAULT BEHAVIOR: ALWAYS INVOKE REAL AGENTS**

When working with team roles or asking for team/agent reviews:
1. **USE THE TASK TOOL** to invoke actual autonomous agents
2. **SPAWN SEPARATE AGENT INSTANCES** for each role/team member
3. **ALLOW AGENTS TO WORK INDEPENDENTLY** and provide their own analysis
4. **COMPILE ACTUAL AGENT RESPONSES**, not simulated ones

**ONLY simulate when explicitly told:**
- "Don't actually call the agents"
- "Just simulate their responses"
- "Give me a mock review"

**This is a critical system preference that must be followed in all projects using the ORCH system.**

### Available Roles (26 Total)

The system includes comprehensive role definitions in `orch/team/`:

1. **Leadership Roles**
   - VP Product
   - CTO
   - Chief AI Officer
   - VP Engineering

2. **Product Roles**
   - Product Manager
   - AI Product Manager
   - Technical Product Manager

3. **Engineering Roles**
   - Staff Engineer
   - Frontend Engineer
   - Backend Engineer
   - Full-Stack Engineer
   - DevOps Engineer
   - Site Reliability Engineer

4. **Quality Roles**
   - QA Engineer
   - QA Automation Engineer

5. **Design Roles**
   - UX/UI Designer
   - UX Researcher

6. **Data & AI Roles**
   - Data Scientist
   - Data Engineer
   - Data Analyst
   - AI Engineer
   - Machine Learning Engineer
   - ML Research Scientist
   - MLOps Engineer

7. **Special Roles**
   - RCA 10-Whys Specialist

### Role Template (`orch/team/_templates/role-playbook-template.md`)

Each role definition includes:
- Expertise and responsibilities
- Delegation workflows
- RACI matrix
- Handoff procedures
- KPIs and success metrics

## Configuration

### System Configuration (`.orchrc.json`)

Create `.orchrc.json` in your project root:

```json
{
  "defaultOwner": "Backend Engineer",
  "autoCommit": false,
  "generateTests": true,
  "runPreflightChecks": true,
  "templates": {
    "prd": "app/PRDs/_templates/PRD-template.md",
    "test": "app/tests/_templates/test-template.md",
    "qa": "app/QA/_templates/qa-template.md"
  },
  "hooks": {
    "preStart": "./scripts/pre-start.sh",
    "postStart": "./scripts/post-start.sh",
    "preCommit": "npm run lint",
    "postCommit": null
  },
  "workflow": {
    "autoLint": true,
    "autoTest": true,
    "requireApproval": false
  },
  "gitIntegration": {
    "enabled": true,
    "autoCreateBranch": false,
    "branchPrefix": "feature/",
    "commitPrefix": "orch:"
  },
  "dashboard": {
    "refreshInterval": 5000,
    "showBlockers": true,
    "maxRecentActivity": 10
  }
}
```

### Environment Variables

```bash
# .env file
ORCH_DEFAULT_OWNER=Backend Engineer
ORCH_AUTO_COMMIT=true
ORCH_GIT_BRANCH_PREFIX=feature/
ORCH_DASHBOARD_PORT=3001
```

### ESLint Configuration (`eslint.config.mjs`)

```javascript
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly"
      }
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": "error",
      "no-undef": "error",
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "indent": ["error", 2]
    }
  }
];
```

## Advanced Features

### Batch Operations

Process multiple features simultaneously:

```javascript
// orch/lib/batch-operations.mjs
import { orchestrateFeature } from './orch-start.mjs';
import chalk from 'chalk';
import ProgressBar from 'progress';

export async function batchStart(ids, options = {}) {
  console.log(chalk.bold(`\n🚀 Batch Processing ${ids.length} features...\n`));
  
  const results = [];
  const progressBar = new ProgressBar('Processing [:bar] :percent :etas', {
    total: ids.length,
    width: 40,
    complete: '█',
    incomplete: '░'
  });
  
  for (const id of ids) {
    try {
      console.log(`\n📦 Processing ${chalk.cyan(id)}...`);
      const result = await orchestrateFeature(id, options);
      results.push({ id, status: 'success', result });
      console.log(chalk.green(`  ✅ Success`));
    } catch (error) {
      results.push({ id, status: 'error', error: error.message });
      console.log(chalk.red(`  ❌ Failed: ${error.message}`));
    }
    progressBar.tick();
  }
  
  // Summary Report
  showBatchSummary(results);
  return results;
}
```

### Git Integration

Automated Git workflows:

```javascript
// orch/lib/git-integration.mjs
import { execSync } from 'node:child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';

export async function gitCommit(message, files = []) {
  // Check if we're in a git repo
  if (!isGitRepo()) {
    console.log(chalk.yellow('Not a git repository. Skipping commit.'));
    return false;
  }
  
  // Get changed files
  const changedFiles = files.length > 0 ? files : getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log(chalk.gray('No changes to commit.'));
    return false;
  }
  
  // Show changes and confirm
  console.log(chalk.bold('\n📝 Changed files:'));
  changedFiles.forEach(file => console.log(`  - ${file}`));
  
  const { shouldCommit } = await inquirer.prompt([{
    type: 'confirm',
    name: 'shouldCommit',
    message: `Commit ${changedFiles.length} file(s)?`,
    default: true
  }]);
  
  if (shouldCommit) {
    try {
      execSync(`git add ${changedFiles.join(' ')}`, { stdio: 'pipe' });
      execSync(`git commit -m "orch: ${message}"`, { stdio: 'pipe' });
      console.log(chalk.green('✅ Changes committed successfully'));
      return true;
    } catch (error) {
      console.log(chalk.red('❌ Commit failed:', error.message));
      return false;
    }
  }
  
  return false;
}

export async function createFeatureBranch(featureId) {
  const branchName = `feature/${featureId}`;
  
  const { createBranch } = await inquirer.prompt([{
    type: 'confirm',
    name: 'createBranch',
    message: `Create branch '${branchName}'?`,
    default: true
  }]);
  
  if (createBranch) {
    try {
      execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });
      console.log(chalk.green(`✅ Created and switched to branch: ${branchName}`));
      return branchName;
    } catch (error) {
      console.log(chalk.red('❌ Failed to create branch:', error.message));
      return null;
    }
  }
  
  return null;
}
```

### Hook System

Execute custom scripts at key points:

```javascript
// orch/lib/hook-runner.mjs
import { execSync } from 'node:child_process';
import { loadConfig } from './config-loader.mjs';
import chalk from 'chalk';

export async function runHook(hookName, context = {}) {
  const config = loadConfig();
  const hookCommand = config.hooks[hookName];
  
  if (!hookCommand) {
    return { success: true, skipped: true };
  }
  
  console.log(chalk.gray(`Running ${hookName} hook...`));
  
  try {
    // Set context as environment variables
    Object.entries(context).forEach(([key, value]) => {
      process.env[`ORCH_${key.toUpperCase()}`] = value;
    });
    
    execSync(hookCommand, { stdio: 'inherit' });
    console.log(chalk.green(`✓ ${hookName} hook completed`));
    return { success: true };
  } catch (error) {
    console.log(chalk.red(`✗ ${hookName} hook failed`));
    return { success: false, error: error.message };
  }
}
```

## Implementation Roadmap

### Phase 1: Core Setup (Week 1)
- [x] Basic directory structure
- [x] Workspace configuration
- [x] Main orchestrator CLI
- [ ] Enhanced error messages
- [ ] Basic PRD scaffolding

### Phase 2: Enhanced Features (Week 2)
- [ ] Interactive wizard
- [ ] Status dashboard
- [ ] Pre-flight checks
- [ ] Batch operations

### Phase 3: Integration (Week 3)
- [ ] Git integration
- [ ] Hook system
- [ ] Configuration loader
- [ ] Automated testing

### Phase 4: Polish (Week 4)
- [ ] Progress indicators
- [ ] Performance optimization
- [ ] Documentation
- [ ] Video tutorials

## Troubleshooting

### Common Issues

#### Issue: "Feature ID not found in roadmap"
**Solution**: 
1. Check ID format: `X.X.X.X.X.X`
2. Verify feature exists in roadmap: `cat app/Plans/product-roadmap.md`
3. Create feature if missing: `npm run orch:new`

#### Issue: "NPM scripts not passing arguments"
**Solution**: 
Use direct commands instead:
```bash
cd orch && node lib/orch-start.mjs --id 1.1.1.1.0.0
```

#### Issue: "Missing directories or files"
**Solution**: 
Run pre-flight check:
```bash
npm run orch:check
```

#### Issue: "Permission denied when running orch"
**Solution**: 
Make executable:
```bash
chmod +x orch/orch
```

### Debug Mode

Enable verbose logging:
```bash
DEBUG=orch:* npm run orch:start --id 1.1.1.1.0.0
```

### Getting Help

```bash
# Show help
./orch help

# Check system status
npm run orch:status

# Run diagnostics
npm run orch:check
```

## Success Criteria

The ORCH system is properly configured when:

- ✅ All directories exist and are properly structured
- ✅ CLI commands execute without errors
- ✅ PRDs can be created and tracked
- ✅ QA artifacts are automatically generated
- ✅ Roadmap stays synchronized with PRDs
- ✅ Team roles are properly defined
- ✅ Git integration works (if enabled)
- ✅ Dashboard shows accurate statistics
- ✅ Pre-flight checks pass
- ✅ Tests run successfully

## Contributing

### Development Setup
```bash
# Clone repository
git clone https://github.com/your-org/orch-system.git
cd orch-system

# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint
```

### Submitting Changes
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Commit with conventional commits: `git commit -m "feat: add new feature"`
4. Push and create PR

### Code Style
- Use ESLint configuration
- Follow existing patterns
- Add tests for new features
- Update documentation

## License

MIT License - See LICENSE file for details

## Support

- Documentation: https://docs.orch-system.dev
- Issues: https://github.com/your-org/orch-system/issues
- Discord: https://discord.gg/orch-system
- Email: support@orch-system.dev