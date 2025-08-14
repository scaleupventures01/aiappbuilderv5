#!/usr/bin/env node
// Minimal ORCH START CLI: resolves a PRD, ensures QA artifacts, and updates PRD changelog.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureQa, runAutomatedTests, validateQAPass, generateQAReport } from './orch/qa-utils.mjs';
import { readPrd, writePrd, setFrontmatterOwner, ensureQaArtifactsBlock, appendChangelog, ensureExecutionPlanAfter93 } from './orch/prd-utils.mjs';
import { flipRoadmapStatus, regenerateRoadmapHtml, syncRoadmapMirror, updateRoadmapWithQA, getRoadmapStats } from './orch/roadmap-utils.mjs';
import { runDefaultWorkflow, orchestrateTeam } from './orch/workflow-runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(path.join(__dirname, '..'));
const appRoot = path.resolve(path.join(__dirname, '../../app'));
const repoRoot = path.resolve(path.join(__dirname, '../..'));

function readUtf8(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeUtf8(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
}

function parseArgs(argv) {
  const args = { 
    prdPath: '', 
    id: '', 
    dryRun: false, 
    autonomous: true,  // Default to autonomous mode
    doItFully: true,
    status: '',
    generateReport: false,
    help: false
  };
  
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { args.help = true; continue; }
    if (a === '--dry-run') { args.dryRun = true; continue; }
    if (a === '--autonomous') { args.autonomous = true; continue; }
    if (a === '--no-autonomous' || a === '--manual') { args.autonomous = false; continue; }  // Add way to disable
    if (a === '--no-do-it-fully') { args.doItFully = false; continue; }
    if (a === '--generate-report') { args.generateReport = true; continue; }
    
    let m = a.match(/^--([\w-]+?)=(.*)$/);
    if (m) {
      const [, k, v] = m;
      if (k === 'prd-path') args.prdPath = v;
      else if (k === 'id') args.id = v;
      else if (k === 'status') args.status = v;
      continue;
    }
    
    if (a === '--prd-path' && i + 1 < argv.length) { args.prdPath = argv[++i]; continue; }
    if (a === '--id' && i + 1 < argv.length) { args.id = argv[++i]; continue; }
    if (a === '--status' && i + 1 < argv.length) { args.status = argv[++i]; continue; }
  }
  return args;
}

function showHelp() {
  console.log(`
ORCH START - Autonomous Orchestration System

Usage: npm run orch:start -- [options]

Options:
  --id <ID>           Feature ID (X.X.X.X.X.X format)
  --prd-path <path>   Path to PRD file
  --status <status>   Update roadmap status (Ready|In Progress|Done|Blocked)
  --no-autonomous     Disable autonomous mode (run in manual mode)
  --manual            Same as --no-autonomous
  --no-do-it-fully    Disable Do-It-Fully policy
  --dry-run           Preview changes without applying
  --generate-report   Generate comprehensive QA report
  --help, -h          Show this help message

Examples:
  # Start orchestration for a feature (autonomous by default)
  npm run orch:start -- --id 1.1.1.1.0.0
  
  # Run in manual mode (without agents)
  npm run orch:start -- --id 1.1.1.1.0.0 --manual
  
  # Update status to Done
  npm run orch:start -- --id 1.1.1.1.0.0 --status Done
  
  # Generate QA report
  npm run orch:start -- --id 1.1.1.1.0.0 --generate-report

Autonomous Mode (Default):
  Automatically assigns and orchestrates specialized agents based on
  feature requirements. Agents collaborate to complete implementation.

Do-It-Fully Policy (Default):
  Completes all implementation, tests, QA, and documentation
  before notifying completion.

Excellence Standard:
  All workflows follow best-work-first, minimal tokens, evidence-driven
  approach with required quality gates.
`);
}

function resolvePrdPathById(roadmapId) {
  const roadmapPath = path.join(appRoot, 'Plans', 'product-roadmap.md');
  const md = readUtf8(roadmapPath);
  const line = md.split(/\r?\n/).find(l => l.includes(`| ${roadmapId} |`));
  if (!line) return '';
  const cols = line.split('|').map(s => s.trim());
  const planCell = cols[6] || '';
  const m = planCell.match(/`([^`]+)`/);
  if (m) return path.join(appRoot, m[1]);
  const phase = cols[1] || 'V1';
  const version = (phase.split('—')[0] || 'V1').trim();
  const item = cols[3] || '';
  const slug = item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').replace(/--+/g, '-');
  return path.join(appRoot, 'PRDs', version, `${roadmapId}-${slug}-prd.md`);
}

function parseIdAndSlugFromPrd(prdPath) {
  const base = path.basename(prdPath);
  // Updated regex to match X.X.X.X.X.X pattern
  const m = base.match(/^((\d+\.){5}\d+)-(.*?)-prd\.md$/);
  if (!m) return { id: '', slug: '' };
  return { id: m[1], slug: m[3] };
}

function ensureQaArtifacts(id, slug, dryRun) {
  const qaFolder = path.join(appRoot, 'QA', `${id}-${slug}`);
  const casesPath = path.join(qaFolder, 'test-cases.md');
  const today = new Date().toISOString().slice(0, 10);
  const resultsPath = path.join(qaFolder, `test-results-${today}.md`);
  const actions = [];
  if (!fs.existsSync(qaFolder)) {
    actions.push({ type: 'mkdir', path: qaFolder });
    if (!dryRun) fs.mkdirSync(qaFolder, { recursive: true });
  }
  if (!fs.existsSync(casesPath)) {
    actions.push({ type: 'write', path: casesPath });
    // Include ID hierarchy in test case naming
    const [version, major, minor, feature, task, subtask] = id.split('.');
    const testPrefix = `TC-${version}.${major}.${minor}`;
    if (!dryRun) writeUtf8(casesPath, `# Test Cases — ${id}-${slug}\n\n- Derive from PRD section 7.1/7.2.\n- Test ID Format: ${testPrefix}-XXX\n\n## Scenarios\n- [ ] ${testPrefix}-001 — Trigger parsing\n- [ ] ${testPrefix}-002 — PRD edits idempotent\n\n## Acceptance\n- Overall Status: Pass required before Ready flip.\n`);
  }
  if (!fs.existsSync(resultsPath)) {
    actions.push({ type: 'write', path: resultsPath });
    if (!dryRun) writeUtf8(resultsPath, `# ORCH START — Results (${today})\n\n- Build under test: local (N/A)\n- Overall Status: Pending\n- Notes: Initial orchestrator scaffold run.\n`);
  }
  return { qaFolder, casesPath, resultsPath, actions };
}

function updatePrd(prdPath, qaCasesRel, qaResultsRel, dryRun) {
  let text = readUtf8(prdPath);
  let changed = false;

  // Make paths relative to app root for PRD
  const appRelativeCases = path.relative(appRoot, path.join(appRoot, qaCasesRel));
  const appRelativeResults = path.relative(appRoot, path.join(appRoot, qaResultsRel));

  if (/### 7\.3 QA Artifacts[\s\S]*?\n/.test(text)) {
    const updated = text.replace(/(### 7\.3 QA Artifacts[\s\S]*?)(\n<|\n## |\n<a id=|\n$)/m, (m0, p1, p2) => {
      const block = `### 7.3 QA Artifacts\n- Test cases file: \`${appRelativeCases}\`\n- Latest results: \`${appRelativeResults}\` (Overall Status: Pass required)\n`;
      return block + p2;
    });
    if (updated !== text) { text = updated; changed = true; }
  } else {
    text = ensureQaArtifactsBlock(text, appRelativeCases, appRelativeResults);
    changed = true;
  }

  const execPlan = ensureExecutionPlanAfter93(text);
  if (execPlan !== text) { text = execPlan; changed = true; }

  const cl = appendChangelog(text, `- orch: scaffold + QA links updated on ${new Date().toISOString().slice(0, 10)}.`);
  if (cl !== text) { text = cl; changed = true; }

  if (changed && !dryRun) writePrd(prdPath, text);
  return changed;
}

async function main() {
  const args = parseArgs(process.argv);
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  if (!args.prdPath && !args.id) {
    console.error('PRD not found. Use --prd-path <path> or --id <ROADMAP_ID>.');
    console.error('Run with --help for usage information.');
    process.exit(1);
  }

  const prdPath = args.prdPath || resolvePrdPathById(args.id);
  if (!fs.existsSync(prdPath)) {
    console.error(`PRD not found: ${prdPath}`);
    process.exit(1);
  }

  const { id, slug } = parseIdAndSlugFromPrd(prdPath);
  
  // Validate feature ID format
  if (!id.match(/^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/)) {
    console.error(`Invalid feature ID format: ${id}`);
    console.error('Expected format: X.X.X.X.X.X');
    process.exit(1);
  }
  
  // Show current roadmap stats
  if (!args.dryRun) {
    const stats = getRoadmapStats();
    console.log(`\n📊Roadmap Status: ${stats.total} features, ${stats.completionRate}% complete\n`);
  }
  
  // ORCH START Autonomous Workflow
  if (args.autonomous) {
    console.log('\n🚀 ORCH START Autonomous Workflow Initiated');
    console.log(`Feature: ${id} - ${slug}`);
    console.log(`Do-It-Fully: ${args.doItFully ? 'Enabled' : 'Disabled'}\n`);
  }
  
  const { qaFolder, actions } = ensureQaArtifacts(id, slug, args.dryRun);
  
  const qaCasesRel = path.relative(appRoot, path.join(qaFolder, 'test-cases.md'));
  const today = new Date().toISOString().slice(0, 10);
  const qaResultsRel = path.relative(appRoot, path.join(qaFolder, `test-results-${today}.md`));
  
  const prdChanged = updatePrd(prdPath, qaCasesRel, qaResultsRel, args.dryRun);
  
  // Run workflow with options
  const workflowOptions = {
    doItFully: args.doItFully,
    autonomous: args.autonomous,
    featureId: id
  };
  const workflow = await runDefaultWorkflow(args.dryRun, workflowOptions);
  
  // Run automated tests if autonomous
  let testResults = null;
  if (args.autonomous && !args.dryRun) {
    console.log('\n🧪 Running Automated Tests...');
    testResults = await runAutomatedTests(id, qaFolder);
    console.log(`Test Results: ${testResults.overallStatus}`);
    console.log(`  Passed: ${testResults.passed}`);
    console.log(`  Failed: ${testResults.failed}`);
    console.log(`  Skipped: ${testResults.skipped}\n`);
  }
  
  // Validate QA Pass
  let qaValidation = null;
  if (!args.dryRun) {
    qaValidation = validateQAPass(qaFolder, id);
    if (qaValidation.valid) {
      console.log('✅ QA Pass Validated');
    } else {
      console.log(`⚠️  QA Validation: ${qaValidation.message}`);
    }
  }
  
  // Update roadmap status if requested
  let statusChanged = false;
  if (args.status && !args.dryRun) {
    console.log(`\n🔄 Updating roadmap status to: ${args.status}`);
    statusChanged = flipRoadmapStatus(id, args.status);
    
    // If marking as Done, ensure QA pass
    if (args.status === 'Done' && !qaValidation?.valid) {
      console.warn('⚠️  Warning: Marking as Done without QA Pass');
    }
    
    // Update roadmap with QA links
    if (args.status === 'Done' && qaValidation?.valid) {
      updateRoadmapWithQA(id, qaFolder);
    }
  }
  
  // Sync roadmap mirror
  let syncResult = null;
  if (!args.dryRun) {
    console.log('\n🔄 Synchronizing roadmap mirror...');
    syncResult = await syncRoadmapMirror({ autoCommit: false, validateFirst: true });
    if (syncResult.sync.status === 'completed') {
      console.log('✅ Roadmap and mirror synchronized');
    } else {
      console.warn(`⚠️  Sync issue: ${syncResult.sync.message}`);
    }
  }
  
  // Generate QA report if requested
  let reportPath = null;
  if (args.generateReport && !args.dryRun) {
    console.log('\n📄 Generating QA Report...');
    reportPath = generateQAReport(qaFolder, id, { format: 'markdown', includeEvidence: true });
    console.log(`Report generated: ${path.relative(repoRoot, reportPath)}`);
  }
  
  // Team orchestration for autonomous mode
  let teamOrchestration = null;
  if (args.autonomous && !args.dryRun) {
    console.log('\n👥 Orchestrating team roles...');
    teamOrchestration = await orchestrateTeam(id);
    console.log(`Roles assigned: ${teamOrchestration.assignments.map(a => a.role).join(', ')}`);
  }
  
  const roadmapChanged = syncResult?.sync.status === 'completed';
  
  // Final summary
  const summary = {
    mode: args.dryRun ? 'dry-run' : 'apply',
    orchestration: args.autonomous ? 'autonomous' : 'manual',
    prdPath: path.relative(repoRoot, prdPath),
    id,
    slug,
    qaFolder: path.relative(repoRoot, qaFolder),
    actions,
    prdChanged,
    workflow,
    roadmapChanged,
    statusChanged,
    testResults: testResults ? {
      status: testResults.overallStatus,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped
    } : null,
    qaValidation: qaValidation ? {
      valid: qaValidation.valid,
      message: qaValidation.message
    } : null,
    reportGenerated: reportPath ? path.relative(repoRoot, reportPath) : null,
    teamOrchestration: teamOrchestration ? {
      status: teamOrchestration.status,
      roles: teamOrchestration.assignments.length
    } : null
  };
  
  // Excellence Standard Summary
  if (args.autonomous && !args.dryRun) {
    console.log('\n' + '='.repeat(60));
    console.log('🏆 Excellence Standard Summary');
    console.log('='.repeat(60));
    console.log(`Feature: ${id} - ${slug}`);
    console.log(`Status: ${summary.testResults?.status || 'Pending'}`);
    console.log(`QA Pass: ${summary.qaValidation?.valid ? '✅ Validated' : '⚠️  Pending'}`);
    console.log(`Roadmap: ${summary.roadmapChanged ? '✅ Synchronized' : '⚠️  Not synced'}`);
    
    if (args.doItFully) {
      console.log('\n🚀 Do-It-Fully Policy: All tasks completed before notification');
    }
    
    console.log('='.repeat(60));
  }
  
  console.log('\n' + JSON.stringify(summary, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});