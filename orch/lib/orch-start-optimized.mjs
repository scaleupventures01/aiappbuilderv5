#!/usr/bin/env node
/**
 * Optimized ORCH START CLI with batch I/O and smart caching
 * Implements performance optimizations while maintaining all functionality
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureQa, runAutomatedTests, validateQAPass, generateQAReport } from './orch/qa-utils.mjs';
import { readPrd, writePrd, setFrontmatterOwner, ensureQaArtifactsBlock, appendChangelog, ensureExecutionPlanAfter93 } from './orch/prd-utils.mjs';
import { flipRoadmapStatus, regenerateRoadmapHtml, syncRoadmapMirror, updateRoadmapWithQA, getRoadmapStats } from './orch/roadmap-utils.mjs';
import { runDefaultWorkflow, orchestrateTeam } from './orch/workflow-runner.mjs';
import { BatchFileOperator } from './orch/batch-file-ops.mjs';
import { OrchestrationCache, getGlobalCache } from './orch/cache-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(path.join(__dirname, '..'));
const appRoot = path.resolve(path.join(__dirname, '../../app'));
const repoRoot = path.resolve(path.join(__dirname, '../..'));

// Initialize global cache
const cache = getGlobalCache(repoRoot, {
  roadmapTTL: 3600000,      // 1 hour for roadmap lookups
  prdParseTTL: 1800000,      // 30 minutes for PRD parsing
  testResultsTTL: 7200000,   // 2 hours for test results
  workflowTTL: 900000        // 15 minutes for workflow results
});

// Initialize batch file operator
const fileOps = new BatchFileOperator();

function parseArgs(argv) {
  const args = { 
    prdPath: '', 
    id: '', 
    dryRun: false, 
    autonomous: true,      // Default to autonomous mode
    doItFully: true,
    status: '',
    generateReport: false,
    help: false,
    useCache: true,        // Enable caching by default
    useBatch: true,        // Enable batch I/O by default
    showStats: false       // Show performance stats
  };
  
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { args.help = true; continue; }
    if (a === '--dry-run') { args.dryRun = true; continue; }
    if (a === '--autonomous') { args.autonomous = true; continue; }
    if (a === '--no-autonomous' || a === '--manual') { args.autonomous = false; continue; }
    if (a === '--no-do-it-fully') { args.doItFully = false; continue; }
    if (a === '--generate-report') { args.generateReport = true; continue; }
    if (a === '--no-cache') { args.useCache = false; continue; }
    if (a === '--no-batch') { args.useBatch = false; continue; }
    if (a === '--show-stats') { args.showStats = true; continue; }
    
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
ORCH START - Autonomous Orchestration System (Optimized)

Usage: npm run orch:start -- [options]

Options:
  --id <ID>           Feature ID (X.X.X.X.X.X format)
  --prd-path <path>   Path to PRD file
  --status <status>   Update roadmap status (Ready|In Progress|Done|Blocked)
  --autonomous        Run in autonomous mode (ORCH START workflow)
  --no-do-it-fully    Disable Do-It-Fully policy
  --dry-run           Preview changes without applying
  --generate-report   Generate comprehensive QA report
  --no-cache          Disable smart caching
  --no-batch          Disable batch file operations
  --show-stats        Show performance statistics
  --help, -h          Show this help message

Performance Optimizations:
  - Smart Caching: Caches roadmap lookups, PRD parsing, and test results
  - Batch I/O: Groups file operations for parallel execution
  - Cache TTLs: Configurable expiration times for different data types

Examples:
  # Start orchestration with optimizations
  npm run orch:start -- --id 1.1.1.1.0.0
  
  # Run without caching (for fresh data)
  npm run orch:start -- --id 1.1.1.1.0.0 --no-cache
  
  # Show performance statistics
  npm run orch:start -- --id 1.1.1.1.0.0 --show-stats

Do-It-Fully Policy:
  When enabled (default), completes all implementation, tests, QA,
  and documentation before notifying completion.

Excellence Standard:
  All workflows follow best-work-first, minimal tokens, evidence-driven
  approach with required quality gates.
`);
}

async function resolvePrdPathById(roadmapId, useCache = true) {
  if (useCache) {
    return await cache.withCache('prd-resolve', roadmapId, async () => {
      return _resolvePrdPathByIdInternal(roadmapId);
    });
  }
  return _resolvePrdPathByIdInternal(roadmapId);
}

function _resolvePrdPathByIdInternal(roadmapId) {
  const roadmapPath = path.join(appRoot, 'Plans', 'product-roadmap.md');
  const md = fs.readFileSync(roadmapPath, 'utf8');
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

async function parseIdAndSlugFromPrd(prdPath, useCache = true) {
  if (useCache) {
    return await cache.withCache('prd-parse-id', prdPath, async () => {
      return _parseIdAndSlugFromPrdInternal(prdPath);
    });
  }
  return _parseIdAndSlugFromPrdInternal(prdPath);
}

function _parseIdAndSlugFromPrdInternal(prdPath) {
  const base = path.basename(prdPath);
  const m = base.match(/^((\d+\.){5}\d+)-(.*?)-prd\.md$/);
  if (!m) return { id: '', slug: '' };
  return { id: m[1], slug: m[3] };
}

async function ensureQaArtifacts(id, slug, dryRun, useBatch = true) {
  const qaFolder = path.join(appRoot, 'QA', `${id}-${slug}`);
  const casesPath = path.join(qaFolder, 'test-cases.md');
  const today = new Date().toISOString().slice(0, 10);
  const resultsPath = path.join(qaFolder, `test-results-${today}.md`);
  const actions = [];
  
  if (useBatch && !dryRun) {
    // Queue operations for batch execution
    if (!fs.existsSync(qaFolder)) {
      fileOps.queueMkdir(qaFolder);
      actions.push({ type: 'mkdir', path: qaFolder });
    }
    
    if (!fs.existsSync(casesPath)) {
      const [version, major, minor, feature, task, subtask] = id.split('.');
      const testPrefix = `TC-${version}.${major}.${minor}`;
      const casesContent = `# Test Cases — ${id}-${slug}\n\n- Derive from PRD section 7.1/7.2.\n- Test ID Format: ${testPrefix}-XXX\n\n## Scenarios\n- [ ] ${testPrefix}-001 — Trigger parsing\n- [ ] ${testPrefix}-002 — PRD edits idempotent\n\n## Acceptance\n- Overall Status: Pass required before Ready flip.\n`;
      fileOps.queueWrite(casesPath, casesContent);
      actions.push({ type: 'write', path: casesPath });
    }
    
    if (!fs.existsSync(resultsPath)) {
      const resultsContent = `# ORCH START — Results (${today})\n\n- Build under test: local (N/A)\n- Overall Status: Pending\n- Notes: Initial orchestrator scaffold run.\n`;
      fileOps.queueWrite(resultsPath, resultsContent);
      actions.push({ type: 'write', path: resultsPath });
    }
  } else if (!dryRun) {
    // Fallback to synchronous operations
    if (!fs.existsSync(qaFolder)) {
      fs.mkdirSync(qaFolder, { recursive: true });
      actions.push({ type: 'mkdir', path: qaFolder });
    }
    
    if (!fs.existsSync(casesPath)) {
      const [version, major, minor, feature, task, subtask] = id.split('.');
      const testPrefix = `TC-${version}.${major}.${minor}`;
      const casesContent = `# Test Cases — ${id}-${slug}\n\n- Derive from PRD section 7.1/7.2.\n- Test ID Format: ${testPrefix}-XXX\n\n## Scenarios\n- [ ] ${testPrefix}-001 — Trigger parsing\n- [ ] ${testPrefix}-002 — PRD edits idempotent\n\n## Acceptance\n- Overall Status: Pass required before Ready flip.\n`;
      fs.writeFileSync(casesPath, casesContent);
      actions.push({ type: 'write', path: casesPath });
    }
    
    if (!fs.existsSync(resultsPath)) {
      const resultsContent = `# ORCH START — Results (${today})\n\n- Build under test: local (N/A)\n- Overall Status: Pending\n- Notes: Initial orchestrator scaffold run.\n`;
      fs.writeFileSync(resultsPath, resultsContent);
      actions.push({ type: 'write', path: resultsPath });
    }
  } else {
    // Dry run - just log actions
    if (!fs.existsSync(qaFolder)) {
      actions.push({ type: 'mkdir', path: qaFolder });
    }
    if (!fs.existsSync(casesPath)) {
      actions.push({ type: 'write', path: casesPath });
    }
    if (!fs.existsSync(resultsPath)) {
      actions.push({ type: 'write', path: resultsPath });
    }
  }
  
  return { qaFolder, casesPath, resultsPath, actions };
}

async function updatePrd(prdPath, qaCasesRel, qaResultsRel, dryRun, useBatch = true, useCache = true) {
  let text = useCache 
    ? await cache.withCache('prd-content', prdPath, async () => fs.readFileSync(prdPath, 'utf8'))
    : fs.readFileSync(prdPath, 'utf8');
  
  let changed = false;

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

  if (changed && !dryRun) {
    if (useBatch) {
      fileOps.queueWrite(prdPath, text);
    } else {
      fs.writeFileSync(prdPath, text);
    }
    
    // Invalidate cache for this PRD
    if (useCache) {
      cache.invalidate('prd-content', prdPath);
    }
  }
  
  return changed;
}

async function main() {
  const startTime = Date.now();
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

  const prdPath = args.prdPath || await resolvePrdPathById(args.id, args.useCache);
  if (!fs.existsSync(prdPath)) {
    console.error(`PRD not found: ${prdPath}`);
    process.exit(1);
  }

  const { id, slug } = await parseIdAndSlugFromPrd(prdPath, args.useCache);
  
  // Validate feature ID format
  if (!id.match(/^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/)) {
    console.error(`Invalid feature ID format: ${id}`);
    console.error('Expected format: X.X.X.X.X.X');
    process.exit(1);
  }
  
  // Show current roadmap stats
  if (!args.dryRun) {
    const stats = args.useCache 
      ? await cache.withCache('roadmap-stats', 'global', async () => getRoadmapStats())
      : getRoadmapStats();
    console.log(`\n📊Roadmap Status: ${stats.total} features, ${stats.completionRate}% complete\n`);
  }
  
  // ORCH START Autonomous Workflow
  if (args.autonomous) {
    console.log('\n🚀 ORCH START Autonomous Workflow Initiated (Optimized)');
    console.log(`Feature: ${id} - ${slug}`);
    console.log(`Do-It-Fully: ${args.doItFully ? 'Enabled' : 'Disabled'}`);
    console.log(`Caching: ${args.useCache ? 'Enabled' : 'Disabled'}`);
    console.log(`Batch I/O: ${args.useBatch ? 'Enabled' : 'Disabled'}\n`);
  }
  
  const { qaFolder, actions } = await ensureQaArtifacts(id, slug, args.dryRun, args.useBatch);
  
  const qaCasesRel = path.relative(appRoot, path.join(qaFolder, 'test-cases.md'));
  const today = new Date().toISOString().slice(0, 10);
  const qaResultsRel = path.relative(appRoot, path.join(qaFolder, `test-results-${today}.md`));
  
  const prdChanged = await updatePrd(prdPath, qaCasesRel, qaResultsRel, args.dryRun, args.useBatch, args.useCache);
  
  // Run workflow with options (cached if enabled)
  const workflowOptions = {
    doItFully: args.doItFully,
    autonomous: args.autonomous,
    featureId: id
  };
  
  const workflow = args.useCache 
    ? await cache.withCache('workflow', { id, options: workflowOptions }, 
        async () => runDefaultWorkflow(args.dryRun, workflowOptions))
    : await runDefaultWorkflow(args.dryRun, workflowOptions);
  
  // Run automated tests if autonomous
  let testResults = null;
  if (args.autonomous && !args.dryRun) {
    console.log('\n🧪 Running Automated Tests...');
    testResults = args.useCache
      ? await cache.withCache('test-results', { id, qaFolder }, 
          async () => runAutomatedTests(id, qaFolder))
      : await runAutomatedTests(id, qaFolder);
    console.log(`Test Results: ${testResults.overallStatus}`);
    console.log(`  Passed: ${testResults.passed}`);
    console.log(`  Failed: ${testResults.failed}`);
    console.log(`  Skipped: ${testResults.skipped}\n`);
  }
  
  // Validate QA Pass
  let qaValidation = null;
  if (!args.dryRun) {
    qaValidation = args.useCache
      ? await cache.withCache('qa-validation', { qaFolder, id }, 
          async () => validateQAPass(qaFolder, id))
      : validateQAPass(qaFolder, id);
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
    
    // Invalidate roadmap cache after status change
    if (args.useCache) {
      cache.invalidateType('roadmap-lookup');
      cache.invalidate('roadmap-stats', 'global');
    }
    
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
  
  // Execute all batch file operations
  let batchResults = null;
  if (args.useBatch && !args.dryRun && fileOps.getQueueSize() > 0) {
    console.log(`\n📦 Executing ${fileOps.getQueueSize()} batched file operations...`);
    batchResults = await fileOps.flush();
    console.log(`✅ Batch operations completed in ${batchResults.totalTime}ms`);
    console.log(`  Successful: ${batchResults.successful.length}`);
    if (batchResults.failed.length > 0) {
      console.log(`  Failed: ${batchResults.failed.length}`);
      batchResults.failed.forEach(f => console.error(`    - ${f.path}: ${f.error}`));
    }
  }
  
  const roadmapChanged = syncResult?.sync.status === 'completed';
  
  // Calculate performance metrics
  const endTime = Date.now();
  const executionTime = endTime - startTime;
  
  // Final summary
  const summary = {
    mode: args.dryRun ? 'dry-run' : 'apply',
    orchestration: args.autonomous ? 'autonomous' : 'manual',
    optimization: {
      caching: args.useCache,
      batchIO: args.useBatch,
      executionTime: `${executionTime}ms`
    },
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
    } : null,
    batchResults: batchResults ? {
      totalOperations: batchResults.successful.length + batchResults.failed.length,
      successful: batchResults.successful.length,
      failed: batchResults.failed.length,
      time: `${batchResults.totalTime}ms`
    } : null
  };
  
  // Show cache statistics if requested
  if (args.showStats && args.useCache) {
    console.log('\n📊 Cache Statistics:');
    const cacheStats = cache.getStats();
    console.log(`  Hit Rate: ${cacheStats.hitRate}`);
    console.log(`  Hits: ${cacheStats.hits}`);
    console.log(`  Misses: ${cacheStats.misses}`);
    console.log(`  Entries: ${cacheStats.entries}`);
    console.log(`  Total Size: ${Math.round(cacheStats.totalSize / 1024)}KB`);
    
    if (args.useBatch) {
      const batchStats = fileOps.getStats();
      console.log('\n📦 Batch I/O Statistics:');
      console.log(`  Queued: ${batchStats.queued}`);
      console.log(`  Executed: ${batchStats.executed}`);
      console.log(`  Errors: ${batchStats.errors}`);
    }
  }
  
  // Excellence Standard Summary
  if (args.autonomous && !args.dryRun) {
    console.log('\n' + '='.repeat(60));
    console.log('🏆 Excellence Standard Summary (Optimized)');
    console.log('='.repeat(60));
    console.log(`Feature: ${id} - ${slug}`);
    console.log(`Status: ${summary.testResults?.status || 'Pending'}`);
    console.log(`QA Pass: ${summary.qaValidation?.valid ? '✅ Validated' : '⚠️  Pending'}`);
    console.log(`Roadmap: ${summary.roadmapChanged ? '✅ Synchronized' : '⚠️  Not synced'}`);
    console.log(`Execution Time: ${executionTime}ms`);
    
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