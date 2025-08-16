#!/usr/bin/env node
/**
 * ORCH System Health Check
 * Comprehensive system health monitoring and status reporting
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const appRoot = path.resolve(__dirname, '../../app');

// System components to check
const healthChecks = {
  core: { status: 'unknown', message: '', score: 0 },
  documentation: { status: 'unknown', message: '', score: 0 },
  qa: { status: 'unknown', message: '', score: 0 },
  roadmap: { status: 'unknown', message: '', score: 0 },
  team: { status: 'unknown', message: '', score: 0 },
  dependencies: { status: 'unknown', message: '', score: 0 },
  cli: { status: 'unknown', message: '', score: 0 },
  integration: { status: 'unknown', message: '', score: 0 }
};

// Health status colors
const statusColors = {
  healthy: '\x1b[32m✅\x1b[0m',
  warning: '\x1b[33m⚠️\x1b[0m',
  critical: '\x1b[31m❌\x1b[0m',
  unknown: '\x1b[37m❓\x1b[0m'
};

function getStatus(score) {
  if (score >= 90) return 'healthy';
  if (score >= 70) return 'warning';
  if (score > 0) return 'critical';
  return 'unknown';
}

async function checkCore() {
  let score = 0;
  const coreFiles = [
    'lib/orch-start.mjs',
    'lib/orch/prd-utils.mjs',
    'lib/orch/qa-utils.mjs',
    'lib/orch/roadmap-utils.mjs',
    'lib/orch/workflow-runner.mjs'
  ];
  
  let found = 0;
  for (const file of coreFiles) {
    if (fs.existsSync(path.join(orchRoot, file))) found++;
  }
  
  score = Math.round((found / coreFiles.length) * 100);
  healthChecks.core.score = score;
  healthChecks.core.status = getStatus(score);
  healthChecks.core.message = `${found}/${coreFiles.length} core files operational`;
}

async function checkDocumentation() {
  let score = 0;
  const docs = [
    'docs/RUNBOOK.md',
    'docs/Excellence-Standard.md',
    'docs/WORKFLOWS.md',
    'docs/IMPROVEMENTS-CHECKLIST.md',
    'templates/prd-template.md'
  ];
  
  let found = 0;
  for (const doc of docs) {
    if (fs.existsSync(path.join(orchRoot, doc))) found++;
  }
  
  score = Math.round((found / docs.length) * 100);
  healthChecks.documentation.score = score;
  healthChecks.documentation.status = getStatus(score);
  healthChecks.documentation.message = `${found}/${docs.length} documentation files present`;
}

async function checkQA() {
  const qaPath = path.join(appRoot, 'QA');
  if (!fs.existsSync(qaPath)) {
    healthChecks.qa.score = 0;
    healthChecks.qa.status = 'critical';
    healthChecks.qa.message = 'QA directory not found';
    return;
  }
  
  const features = fs.readdirSync(qaPath).filter(d => 
    fs.statSync(path.join(qaPath, d)).isDirectory()
  );
  
  let score = features.length > 0 ? 100 : 50;
  healthChecks.qa.score = score;
  healthChecks.qa.status = getStatus(score);
  healthChecks.qa.message = `${features.length} features with QA artifacts`;
}

async function checkRoadmap() {
  const roadmapMd = path.join(appRoot, 'Plans/product-roadmap.md');
  const roadmapHtml = path.join(orchRoot, 'docs/product-roadmap.html');
  
  let score = 0;
  let message = [];
  
  if (fs.existsSync(roadmapMd)) {
    score += 50;
    message.push('Markdown roadmap found');
  }
  
  if (fs.existsSync(roadmapHtml)) {
    score += 30;
    message.push('HTML mirror found');
    
    // Check sync status
    const mdTime = fs.statSync(roadmapMd).mtime;
    const htmlTime = fs.statSync(roadmapHtml).mtime;
    const timeDiff = Math.abs(htmlTime - mdTime);
    
    if (timeDiff < 60000) { // Within 1 minute
      score += 20;
      message.push('In sync');
    } else {
      message.push('Out of sync');
    }
  }
  
  healthChecks.roadmap.score = score;
  healthChecks.roadmap.status = getStatus(score);
  healthChecks.roadmap.message = message.join(', ');
}

async function checkTeam() {
  const teamPath = path.join(orchRoot, 'team');
  if (!fs.existsSync(teamPath)) {
    healthChecks.team.score = 0;
    healthChecks.team.status = 'critical';
    healthChecks.team.message = 'Team directory not found';
    return;
  }
  
  const roles = fs.readdirSync(teamPath).filter(f => 
    f.endsWith('.md') && !f.startsWith('_')
  );
  
  const score = roles.length >= 20 ? 100 : Math.round((roles.length / 20) * 100);
  healthChecks.team.score = score;
  healthChecks.team.status = getStatus(score);
  healthChecks.team.message = `${roles.length} team roles defined`;
}

async function checkDependencies() {
  try {
    const { stdout } = await execAsync('npm ls --depth=0 --json', { cwd: orchRoot });
    const deps = JSON.parse(stdout);
    
    if (deps.problems && deps.problems.length > 0) {
      healthChecks.dependencies.score = 50;
      healthChecks.dependencies.status = 'warning';
      healthChecks.dependencies.message = `${deps.problems.length} dependency issues`;
    } else {
      healthChecks.dependencies.score = 100;
      healthChecks.dependencies.status = 'healthy';
      healthChecks.dependencies.message = 'All dependencies resolved';
    }
  } catch (error) {
    healthChecks.dependencies.score = 0;
    healthChecks.dependencies.status = 'critical';
    healthChecks.dependencies.message = 'Failed to check dependencies';
  }
}

async function checkCLI() {
  try {
    const { stdout } = await execAsync('node lib/orch-start.mjs --help', { cwd: orchRoot });
    
    const requiredOptions = ['--autonomous', '--generate-report', '--status'];
    let found = 0;
    
    for (const option of requiredOptions) {
      if (stdout.includes(option)) found++;
    }
    
    const score = Math.round((found / requiredOptions.length) * 100);
    healthChecks.cli.score = score;
    healthChecks.cli.status = getStatus(score);
    healthChecks.cli.message = `${found}/${requiredOptions.length} CLI options available`;
  } catch (error) {
    healthChecks.cli.score = 0;
    healthChecks.cli.status = 'critical';
    healthChecks.cli.message = 'CLI not responding';
  }
}

async function checkIntegration() {
  try {
    // Test dry run
    const { stdout, stderr } = await execAsync(
      'node lib/orch-start.mjs --id 1.1.1.1.0.0 --dry-run',
      { cwd: orchRoot, timeout: 10000 }
    );
    
    if (stderr && !stderr.includes('Warning')) {
      healthChecks.integration.score = 50;
      healthChecks.integration.status = 'warning';
      healthChecks.integration.message = 'Integration works with warnings';
    } else if (stdout.includes('"mode": "dry-run"')) {
      healthChecks.integration.score = 100;
      healthChecks.integration.status = 'healthy';
      healthChecks.integration.message = 'Full integration operational';
    } else {
      healthChecks.integration.score = 25;
      healthChecks.integration.status = 'critical';
      healthChecks.integration.message = 'Integration partially working';
    }
  } catch (error) {
    healthChecks.integration.score = 0;
    healthChecks.integration.status = 'critical';
    healthChecks.integration.message = 'Integration test failed';
  }
}

function calculateOverallHealth() {
  const scores = Object.values(healthChecks).map(h => h.score);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(average);
}

function printHealthReport() {
  console.log('\n' + '='.repeat(60));
  console.log('🏥 ORCH System Health Check Report');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Location: ${orchRoot}\n`);
  
  console.log('Component Status:');
  console.log('-'.repeat(60));
  
  for (const [component, health] of Object.entries(healthChecks)) {
    const icon = statusColors[health.status];
    const name = component.charAt(0).toUpperCase() + component.slice(1);
    const padding = ' '.repeat(15 - name.length);
    console.log(`${icon} ${name}${padding}[${health.score}%] ${health.message}`);
  }
  
  console.log('-'.repeat(60));
  
  const overall = calculateOverallHealth();
  const overallStatus = getStatus(overall);
  const overallIcon = statusColors[overallStatus];
  
  console.log(`\n${overallIcon} Overall System Health: ${overall}%`);
  
  // Recommendations
  console.log('\n📋 Recommendations:');
  
  let recommendations = [];
  
  if (healthChecks.core.score < 100) {
    recommendations.push('• Run npm install to ensure all core files are present');
  }
  
  if (healthChecks.documentation.score < 100) {
    recommendations.push('• Review and create missing documentation files');
  }
  
  if (healthChecks.roadmap.status === 'warning' || healthChecks.roadmap.status === 'critical') {
    recommendations.push('• Synchronize roadmap: npm run orch:roadmap-sync');
  }
  
  if (healthChecks.dependencies.status !== 'healthy') {
    recommendations.push('• Fix dependencies: npm install or npm audit fix');
  }
  
  if (healthChecks.integration.status === 'critical') {
    recommendations.push('• Debug integration issues: Check error logs');
  }
  
  if (recommendations.length === 0) {
    console.log('✅ System is healthy - no actions required');
  } else {
    recommendations.forEach(r => console.log(r));
  }
  
  // Quick actions
  console.log('\n🚀 Quick Actions:');
  console.log('• Run validation: node scripts/validate-improvements.mjs');
  console.log('• Test workflow: npm run orch:start -- --id 1.1.1.1.0.0 --dry-run');
  console.log('• View help: npm run orch:start -- --help');
  console.log('• Check docs: cat docs/IMPROVEMENTS-CHECKLIST.md');
  
  console.log('\n' + '='.repeat(60));
  
  // Exit code based on health
  if (overall < 50) {
    console.log('\n⚠️  System health is critical. Please address issues above.');
    process.exit(1);
  } else if (overall < 80) {
    console.log('\n⚠️  System health needs attention.');
    process.exit(0);
  } else {
    console.log('\n✅ System is healthy and operational.');
    process.exit(0);
  }
}

// Main execution
async function main() {
  console.log('🔍 Running system health checks...\n');
  
  // Run all checks in parallel where possible
  await Promise.all([
    checkCore(),
    checkDocumentation(),
    checkQA(),
    checkRoadmap(),
    checkTeam()
  ]);
  
  // These need to run sequentially
  await checkDependencies();
  await checkCLI();
  await checkIntegration();
  
  // Print report
  printHealthReport();
}

// Handle errors
main().catch(error => {
  console.error('❌ Health check failed:', error.message);
  process.exit(1);
});