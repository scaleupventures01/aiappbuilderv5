#!/usr/bin/env node
/**
 * Status Dashboard
 * Real-time system and agent status visualization
 * Shows activity across all 33 agents
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const appRoot = path.resolve(__dirname, '../../app');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Status emojis
const statusEmoji = {
  'Draft': '📝',
  'Planned': '📋',
  'In Progress': '🚧',
  'Ready': '🎯',
  'Blocked': '🚫',
  'Complete': '✅',
  'active': '🟢',
  'idle': '⚪',
  'assigned': '🔵',
  'error': '🔴'
};

// Gather system statistics
async function gatherStatistics() {
  const stats = {
    totalFeatures: 0,
    byStatus: {},
    activeAgents: 0,
    totalAgents: 33,
    testsPassed: 0,
    testsFailed: 0,
    prdCount: 0,
    qaProjects: 0,
    securityScans: 0,
    codeFiles: 0,
    lastActivity: null
  };
  
  // Count features from roadmap
  const roadmapPath = path.join(appRoot, 'Plans/product-roadmap.md');
  if (fs.existsSync(roadmapPath)) {
    const roadmap = fs.readFileSync(roadmapPath, 'utf8');
    const lines = roadmap.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/\|\s*V\d+[^|]*\s*\|\s*(\d+\.\d+\.\d+\.\d+\.\d+\.\d+)\s*\|[^|]+\|\s*([^|]+)/);
      if (match) {
        stats.totalFeatures++;
        const status = match[2].trim();
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      }
    });
  }
  
  // Count PRDs
  const prdsDir = path.join(appRoot, 'PRDs');
  if (fs.existsSync(prdsDir)) {
    ['V1', 'V2', 'V3'].forEach(version => {
      const versionDir = path.join(prdsDir, version);
      if (fs.existsSync(versionDir)) {
        stats.prdCount += fs.readdirSync(versionDir).filter(f => f.endsWith('.md')).length;
      }
    });
  }
  
  // Count QA projects
  const qaDir = path.join(appRoot, 'QA');
  if (fs.existsSync(qaDir)) {
    const projects = fs.readdirSync(qaDir);
    stats.qaProjects = projects.length;
    
    // Check test results
    projects.forEach(project => {
      const evidenceDir = path.join(qaDir, project, 'evidence');
      if (fs.existsSync(evidenceDir)) {
        const testResults = fs.readdirSync(evidenceDir).filter(f => f.startsWith('test-results'));
        testResults.forEach(file => {
          try {
            const results = JSON.parse(fs.readFileSync(path.join(evidenceDir, file), 'utf8'));
            if (results.passed) stats.testsPassed += results.passed;
            if (results.failed) stats.testsFailed += results.failed;
          } catch (e) {
            // Skip invalid JSON files
          }
        });
      }
    });
  }
  
  // Count active agents (check assignment files)
  const agentAssignments = [];
  if (fs.existsSync(qaDir)) {
    fs.readdirSync(qaDir).forEach(project => {
      const assignmentFile = path.join(qaDir, project, 'agent-assignments.json');
      if (fs.existsSync(assignmentFile)) {
        try {
          const assignments = JSON.parse(fs.readFileSync(assignmentFile, 'utf8'));
          agentAssignments.push(...assignments.agents);
        } catch (e) {
          // Skip invalid files
        }
      }
    });
  }
  stats.activeAgents = new Set(agentAssignments.map(a => a.id)).size;
  
  // Count security scans
  const securityDir = path.join(appRoot, 'security/evidence');
  if (fs.existsSync(securityDir)) {
    stats.securityScans = fs.readdirSync(securityDir).length;
  }
  
  // Count source code files
  const srcDir = path.join(appRoot, 'src');
  if (fs.existsSync(srcDir)) {
    const countFiles = (dir) => {
      let count = 0;
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          count += countFiles(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          count++;
        }
      });
      return count;
    };
    stats.codeFiles = countFiles(srcDir);
  }
  
  // Get last activity
  const getLatestModified = (dir) => {
    let latest = 0;
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const dirLatest = getLatestModified(fullPath);
          if (dirLatest > latest) latest = dirLatest;
        } else {
          if (stat.mtimeMs > latest) latest = stat.mtimeMs;
        }
      });
    }
    return latest;
  };
  
  const latestApp = getLatestModified(appRoot);
  const latestOrch = getLatestModified(orchRoot);
  stats.lastActivity = new Date(Math.max(latestApp, latestOrch));
  
  return stats;
}

// Get agent status
function getAgentStatus() {
  const agentsDir = path.join(orchRoot, 'agents');
  const agents = [];
  
  if (fs.existsSync(agentsDir)) {
    const files = fs.readdirSync(agentsDir);
    files.forEach(file => {
      if (file.endsWith('.mjs') && file !== 'index.mjs') {
        const agentId = file.replace('.mjs', '');
        const agentName = agentId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        // Check if agent is assigned to any features
        let status = 'idle';
        let assignedFeatures = [];
        
        const qaDir = path.join(appRoot, 'QA');
        if (fs.existsSync(qaDir)) {
          fs.readdirSync(qaDir).forEach(project => {
            const assignmentFile = path.join(qaDir, project, 'agent-assignments.json');
            if (fs.existsSync(assignmentFile)) {
              try {
                const assignments = JSON.parse(fs.readFileSync(assignmentFile, 'utf8'));
                const agentAssignment = assignments.agents.find(a => a.id === agentId);
                if (agentAssignment) {
                  status = 'assigned';
                  assignedFeatures.push(assignments.featureId);
                }
              } catch (e) {
                // Skip
              }
            }
          });
        }
        
        agents.push({
          id: agentId,
          name: agentName,
          status: status,
          features: assignedFeatures
        });
      }
    });
  }
  
  return agents;
}

// Display dashboard
export async function showDashboard() {
  console.clear();
  const stats = await gatherStatistics();
  const agents = getAgentStatus();
  
  // Header
  console.log(colors.cyan + colors.bright);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              📊 ORCH SYSTEM STATUS DASHBOARD               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  // System Overview
  console.log('\n' + colors.bright + '📈 System Overview' + colors.reset);
  console.log('─────────────────────────────────────────');
  
  const overviewData = [
    ['Total Features', stats.totalFeatures, colors.cyan],
    ['Active Agents', `${stats.activeAgents}/${stats.totalAgents}`, colors.green],
    ['PRDs Created', stats.prdCount, colors.blue],
    ['QA Projects', stats.qaProjects, colors.magenta],
    ['Code Files', stats.codeFiles, colors.yellow],
    ['Security Scans', stats.securityScans, colors.red]
  ];
  
  overviewData.forEach(([label, value, color]) => {
    console.log(`  ${label.padEnd(20)} ${color}${value}${colors.reset}`);
  });
  
  // Feature Status
  console.log('\n' + colors.bright + '📋 Feature Status' + colors.reset);
  console.log('─────────────────────────────────────────');
  
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    const emoji = statusEmoji[status] || '❓';
    const bar = '█'.repeat(Math.min(count * 2, 40));
    const statusColor = status === 'Complete' ? colors.green :
                       status === 'In Progress' ? colors.yellow :
                       status === 'Blocked' ? colors.red : colors.blue;
    console.log(`  ${emoji} ${status.padEnd(15)} ${statusColor}${bar}${colors.reset} ${count}`);
  });
  
  // Test Results
  if (stats.testsPassed > 0 || stats.testsFailed > 0) {
    console.log('\n' + colors.bright + '🧪 Test Results' + colors.reset);
    console.log('─────────────────────────────────────────');
    const total = stats.testsPassed + stats.testsFailed;
    const passRate = total > 0 ? Math.round((stats.testsPassed / total) * 100) : 0;
    console.log(`  Passed: ${colors.green}${stats.testsPassed}${colors.reset}`);
    console.log(`  Failed: ${colors.red}${stats.testsFailed}${colors.reset}`);
    console.log(`  Pass Rate: ${passRate >= 80 ? colors.green : passRate >= 60 ? colors.yellow : colors.red}${passRate}%${colors.reset}`);
  }
  
  // Agent Status (Top 10 Active)
  console.log('\n' + colors.bright + '🤖 Agent Status (33 Total)' + colors.reset);
  console.log('─────────────────────────────────────────');
  
  const activeAgents = agents.filter(a => a.status === 'assigned');
  const idleAgents = agents.filter(a => a.status === 'idle');
  
  console.log(`  ${statusEmoji.active} Active: ${colors.green}${activeAgents.length}${colors.reset}`);
  console.log(`  ${statusEmoji.idle} Idle: ${colors.dim}${idleAgents.length}${colors.reset}`);
  
  if (activeAgents.length > 0) {
    console.log('\n  ' + colors.dim + 'Active Agents:' + colors.reset);
    activeAgents.slice(0, 10).forEach(agent => {
      console.log(`    ${statusEmoji.assigned} ${agent.name.padEnd(30)} ${colors.dim}→ ${agent.features.join(', ')}${colors.reset}`);
    });
    if (activeAgents.length > 10) {
      console.log(`    ${colors.dim}... and ${activeAgents.length - 10} more${colors.reset}`);
    }
  }
  
  // Recent Activity
  console.log('\n' + colors.bright + '⏰ Recent Activity' + colors.reset);
  console.log('─────────────────────────────────────────');
  
  if (stats.lastActivity) {
    const timeAgo = Math.round((Date.now() - stats.lastActivity.getTime()) / 1000 / 60);
    const timeStr = timeAgo < 60 ? `${timeAgo} minutes ago` :
                   timeAgo < 1440 ? `${Math.round(timeAgo / 60)} hours ago` :
                   `${Math.round(timeAgo / 1440)} days ago`;
    console.log(`  Last activity: ${colors.cyan}${timeStr}${colors.reset}`);
    console.log(`  Timestamp: ${colors.dim}${stats.lastActivity.toLocaleString()}${colors.reset}`);
  }
  
  // Health Score
  console.log('\n' + colors.bright + '💚 System Health' + colors.reset);
  console.log('─────────────────────────────────────────');
  
  const healthScore = calculateHealthScore(stats);
  const healthColor = healthScore >= 80 ? colors.green :
                      healthScore >= 60 ? colors.yellow : colors.red;
  const healthBar = '█'.repeat(Math.round(healthScore / 5));
  console.log(`  Score: ${healthColor}${healthScore}%${colors.reset}`);
  console.log(`  ${healthColor}${healthBar}${colors.reset}`);
  
  // Quick Actions
  console.log('\n' + colors.bright + '⚡ Quick Actions' + colors.reset);
  console.log('─────────────────────────────────────────');
  console.log('  • Create feature:  ' + colors.cyan + './orch "create feature"' + colors.reset);
  console.log('  • Start feature:   ' + colors.cyan + './orch "start feature X.X.X.X.X.X"' + colors.reset);
  console.log('  • View agents:     ' + colors.cyan + './orch "view agents"' + colors.reset);
  console.log('  • Team review:     ' + colors.cyan + './orch "team review X.X.X.X.X.X"' + colors.reset);
  console.log('  • System check:    ' + colors.cyan + './orch "check system"' + colors.reset);
  
  // Footer
  console.log('\n' + colors.dim + '─'.repeat(60) + colors.reset);
  console.log(colors.dim + `Dashboard generated at ${new Date().toLocaleString()}` + colors.reset);
  console.log(colors.dim + 'Press Ctrl+C to exit' + colors.reset);
}

// Calculate system health score
function calculateHealthScore(stats) {
  let score = 100;
  
  // Deduct for no features
  if (stats.totalFeatures === 0) score -= 20;
  
  // Deduct for no active agents
  if (stats.activeAgents === 0) score -= 15;
  
  // Deduct for test failures
  if (stats.testsFailed > 0) {
    const failRate = stats.testsFailed / (stats.testsPassed + stats.testsFailed);
    score -= Math.round(failRate * 30);
  }
  
  // Deduct for blocked features
  if (stats.byStatus['Blocked'] > 0) {
    score -= stats.byStatus['Blocked'] * 5;
  }
  
  // Bonus for completed features
  if (stats.byStatus['Complete'] > 0) {
    score += Math.min(stats.byStatus['Complete'] * 2, 10);
  }
  
  // Bonus for security scans
  if (stats.securityScans > 0) {
    score += Math.min(stats.securityScans, 5);
  }
  
  return Math.max(0, Math.min(100, score));
}

// Auto-refresh mode
async function autoRefresh(interval = 5000) {
  while (true) {
    await showDashboard();
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--auto') || args.includes('-a')) {
    const intervalArg = args.find(a => a.startsWith('--interval='));
    const interval = intervalArg ? parseInt(intervalArg.split('=')[1]) * 1000 : 5000;
    console.log(colors.dim + `Auto-refresh mode enabled (${interval / 1000}s interval)` + colors.reset);
    autoRefresh(interval);
  } else {
    showDashboard().then(() => {
      console.log('\n' + colors.dim + 'Tip: Use --auto flag for auto-refresh mode' + colors.reset);
    });
  }
}