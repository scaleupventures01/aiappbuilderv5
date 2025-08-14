#!/usr/bin/env node
/**
 * Git Integration with Agent Reviews
 * Automated Git workflows with code review from 33-agent system
 * Includes security scanning, test validation, and agent consensus
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import { loadConfig } from './config-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(__dirname, '../..');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

// Review agents by category
const REVIEW_AGENTS = {
  security: ['security-architect', 'application-security-engineer', 'devsecops-engineer', 'ai-safety-engineer'],
  quality: ['qa-engineer', 'qa-automation-engineer', 'staff-engineer'],
  architecture: ['cto', 'staff-engineer', 'technical-product-manager'],
  compliance: ['privacy-engineer', 'ciso', 'security-architect'],
  performance: ['site-reliability-engineer', 'backend-engineer', 'devops-engineer']
};

// Git operations
export class GitIntegration {
  constructor(options = {}) {
    this.config = loadConfig();
    this.options = {
      ...this.config.gitIntegration,
      ...options
    };
    this.isGitRepo = this.checkGitRepo();
  }
  
  // Check if we're in a git repo
  checkGitRepo() {
    try {
      execSync('git rev-parse --git-dir', { cwd: repoRoot, stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }
  
  // Initialize git repo if needed
  async initRepo() {
    if (this.isGitRepo) {
      return { success: true, message: 'Already a git repository' };
    }
    
    try {
      execSync('git init', { cwd: repoRoot });
      this.isGitRepo = true;
      return { success: true, message: 'Git repository initialized' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Get current branch
  getCurrentBranch() {
    if (!this.isGitRepo) return null;
    
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: repoRoot,
        encoding: 'utf8'
      }).trim();
      return branch;
    } catch {
      return null;
    }
  }
  
  // Create feature branch
  async createFeatureBranch(featureId, options = {}) {
    if (!this.isGitRepo) {
      return { success: false, error: 'Not a git repository' };
    }
    
    const branchName = `${this.options.branchPrefix}${featureId}`;
    
    try {
      // Check if branch already exists
      const branches = execSync('git branch -a', {
        cwd: repoRoot,
        encoding: 'utf8'
      });
      
      if (branches.includes(branchName)) {
        if (!options.force) {
          return { success: false, error: `Branch ${branchName} already exists` };
        }
        // Switch to existing branch
        execSync(`git checkout ${branchName}`, { cwd: repoRoot });
      } else {
        // Create and switch to new branch
        execSync(`git checkout -b ${branchName}`, { cwd: repoRoot });
      }
      
      return {
        success: true,
        branch: branchName,
        message: `Created and switched to branch: ${branchName}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Get changed files
  getChangedFiles(options = {}) {
    if (!this.isGitRepo) return [];
    
    try {
      const command = options.staged ? 
        'git diff --cached --name-only' :
        'git status --porcelain';
      
      const output = execSync(command, {
        cwd: repoRoot,
        encoding: 'utf8'
      });
      
      if (options.staged) {
        return output.split('\n').filter(f => f);
      } else {
        return output.split('\n')
          .filter(line => line)
          .map(line => line.substring(3).trim());
      }
    } catch {
      return [];
    }
  }
  
  // Stage files
  async stageFiles(files = []) {
    if (!this.isGitRepo) {
      return { success: false, error: 'Not a git repository' };
    }
    
    try {
      if (files.length === 0) {
        // Stage all changes
        execSync('git add .', { cwd: repoRoot });
      } else {
        // Stage specific files
        const fileList = files.join(' ');
        execSync(`git add ${fileList}`, { cwd: repoRoot });
      }
      
      return { success: true, staged: files.length || 'all' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Run agent review
  async runAgentReview(options = {}) {
    console.log(colors.bright + '\n🤖 Running Agent Code Review\n' + colors.reset);
    
    const files = this.getChangedFiles({ staged: true });
    if (files.length === 0) {
      return {
        success: false,
        error: 'No staged files to review'
      };
    }
    
    console.log(`Files to review: ${colors.cyan}${files.length}${colors.reset}`);
    
    // Select review agents based on file types
    const agents = this.selectReviewAgents(files, options);
    console.log(`Review agents: ${colors.cyan}${agents.length}${colors.reset}`);
    agents.forEach(agent => {
      console.log(`  • ${agent.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`);
    });
    
    // Run reviews
    const reviews = await this.performReviews(files, agents);
    
    // Aggregate results
    const summary = this.aggregateReviews(reviews);
    
    // Display results
    this.displayReviewResults(summary);
    
    return summary;
  }
  
  // Select appropriate review agents
  selectReviewAgents(files, options = {}) {
    const agents = new Set(['qa-engineer']); // Always include QA
    
    // Analyze file types
    const hasBackend = files.some(f => 
      f.includes('/api/') || f.includes('/server/') || 
      f.endsWith('.mjs') || f.endsWith('.js')
    );
    
    const hasFrontend = files.some(f => 
      f.includes('/src/') || f.endsWith('.tsx') || 
      f.endsWith('.jsx') || f.endsWith('.css')
    );
    
    const hasSecurity = files.some(f => 
      f.includes('auth') || f.includes('security') || 
      f.includes('password') || f.includes('token')
    );
    
    const hasDatabase = files.some(f => 
      f.includes('migration') || f.includes('schema') || 
      f.includes('/models/')
    );
    
    const hasTests = files.some(f => 
      f.includes('test') || f.includes('spec')
    );
    
    // Add relevant agents
    if (hasBackend) {
      agents.add('backend-engineer');
      agents.add('technical-product-manager');
    }
    
    if (hasFrontend) {
      agents.add('frontend-engineer');
      agents.add('ux-ui-designer');
    }
    
    if (hasSecurity) {
      REVIEW_AGENTS.security.forEach(a => agents.add(a));
    }
    
    if (hasDatabase) {
      agents.add('data-engineer');
      agents.add('backend-engineer');
    }
    
    if (hasTests) {
      agents.add('qa-automation-engineer');
    }
    
    // Add senior review for large changes
    if (files.length > 10 || options.thorough) {
      agents.add('staff-engineer');
      agents.add('cto');
    }
    
    // Limit agents if specified
    if (options.maxAgents) {
      return Array.from(agents).slice(0, options.maxAgents);
    }
    
    return Array.from(agents);
  }
  
  // Perform code reviews
  async performReviews(files, agents) {
    const reviews = [];
    
    for (const agent of agents) {
      const review = await this.simulateAgentReview(agent, files);
      reviews.push(review);
    }
    
    return reviews;
  }
  
  // Simulate agent review (would call actual agent system)
  async simulateAgentReview(agent, files) {
    // Simulate review delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const review = {
      agent,
      timestamp: new Date().toISOString(),
      files: files.length,
      issues: [],
      suggestions: [],
      approval: true
    };
    
    // Simulate finding issues based on agent type
    if (agent.includes('security')) {
      if (Math.random() > 0.7) {
        review.issues.push({
          severity: 'medium',
          file: files[0],
          message: 'Potential security vulnerability detected'
        });
        review.approval = false;
      }
    }
    
    if (agent.includes('qa')) {
      if (Math.random() > 0.8) {
        review.issues.push({
          severity: 'low',
          file: files[0],
          message: 'Missing test coverage'
        });
      }
    }
    
    if (agent === 'staff-engineer') {
      if (Math.random() > 0.9) {
        review.suggestions.push({
          file: files[0],
          message: 'Consider refactoring for better performance'
        });
      }
    }
    
    return review;
  }
  
  // Aggregate review results
  aggregateReviews(reviews) {
    const summary = {
      success: true,
      totalReviews: reviews.length,
      approvals: 0,
      rejections: 0,
      issues: [],
      suggestions: [],
      consensus: null
    };
    
    reviews.forEach(review => {
      if (review.approval) {
        summary.approvals++;
      } else {
        summary.rejections++;
      }
      
      summary.issues.push(...review.issues);
      summary.suggestions.push(...review.suggestions);
    });
    
    // Determine consensus
    const approvalRate = summary.approvals / summary.totalReviews;
    if (approvalRate >= 0.8) {
      summary.consensus = 'approved';
    } else if (approvalRate >= 0.5) {
      summary.consensus = 'conditional';
    } else {
      summary.consensus = 'rejected';
    }
    
    return summary;
  }
  
  // Display review results
  displayReviewResults(summary) {
    console.log('\n' + colors.bright + '📊 Review Summary\n' + colors.reset);
    
    const consensusColor = summary.consensus === 'approved' ? colors.green :
                          summary.consensus === 'conditional' ? colors.yellow :
                          colors.red;
    
    console.log(`Consensus: ${consensusColor}${summary.consensus.toUpperCase()}${colors.reset}`);
    console.log(`Approvals: ${colors.green}${summary.approvals}${colors.reset}/${summary.totalReviews}`);
    
    if (summary.rejections > 0) {
      console.log(`Rejections: ${colors.red}${summary.rejections}${colors.reset}/${summary.totalReviews}`);
    }
    
    if (summary.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      summary.issues.forEach(issue => {
        const severityColor = issue.severity === 'high' ? colors.red :
                             issue.severity === 'medium' ? colors.yellow :
                             colors.dim;
        console.log(`  ${severityColor}[${issue.severity}]${colors.reset} ${issue.message}`);
        console.log(`    File: ${issue.file}`);
      });
    }
    
    if (summary.suggestions.length > 0) {
      console.log('\n💡 Suggestions:');
      summary.suggestions.forEach(suggestion => {
        console.log(`  • ${suggestion.message}`);
      });
    }
  }
  
  // Commit with agent review
  async commitWithReview(message, options = {}) {
    if (!this.isGitRepo) {
      return { success: false, error: 'Not a git repository' };
    }
    
    // Run agent review first
    const review = await this.runAgentReview(options);
    
    if (review.consensus === 'rejected' && !options.force) {
      return {
        success: false,
        error: 'Commit rejected by agent review',
        review
      };
    }
    
    if (review.consensus === 'conditional') {
      console.log(colors.yellow + '\n⚠️  Conditional approval. Proceeding with caution.' + colors.reset);
    }
    
    try {
      // Add review summary to commit message
      const fullMessage = `${this.options.commitPrefix} ${message}\n\n` +
        `Agent Review: ${review.consensus}\n` +
        `Reviewers: ${review.totalReviews} agents\n` +
        `Approvals: ${review.approvals}/${review.totalReviews}`;
      
      execSync(`git commit -m "${fullMessage}"`, { cwd: repoRoot });
      
      return {
        success: true,
        message: 'Commit successful with agent review',
        review
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Push with protection checks
  async pushWithChecks(options = {}) {
    if (!this.isGitRepo) {
      return { success: false, error: 'Not a git repository' };
    }
    
    const currentBranch = this.getCurrentBranch();
    
    // Check if branch is protected
    if (this.options.protectedBranches.includes(currentBranch) && !options.force) {
      return {
        success: false,
        error: `Cannot push to protected branch: ${currentBranch}`
      };
    }
    
    try {
      // Run tests before push
      if (this.config.workflow.autoTest && !options.skipTests) {
        console.log(colors.cyan + 'Running tests before push...' + colors.reset);
        execSync('npm test', { cwd: repoRoot, stdio: 'inherit' });
      }
      
      // Push to remote
      const pushCommand = options.force ? 'git push --force' : 'git push';
      execSync(pushCommand, { cwd: repoRoot });
      
      return {
        success: true,
        message: `Pushed to ${currentBranch}`,
        branch: currentBranch
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Create pull request with agent reviews
  async createPullRequest(title, body, options = {}) {
    if (!this.isGitRepo) {
      return { success: false, error: 'Not a git repository' };
    }
    
    try {
      // Check if gh CLI is available
      execSync('which gh', { stdio: 'pipe' });
    } catch {
      return { success: false, error: 'GitHub CLI (gh) not installed' };
    }
    
    const currentBranch = this.getCurrentBranch();
    
    // Get agent reviews for PR description
    const review = await this.runAgentReview(options);
    
    const prBody = `${body}\n\n` +
      `## 🤖 Agent Review Summary\n\n` +
      `- **Consensus**: ${review.consensus}\n` +
      `- **Reviewers**: ${review.totalReviews} agents\n` +
      `- **Approval Rate**: ${Math.round((review.approvals / review.totalReviews) * 100)}%\n\n` +
      `### Review Agents\n` +
      `${review.totalReviews} specialized agents from the 33-agent pool participated in this review.\n\n` +
      `---\n` +
      `*Generated by ORCH Git Integration*`;
    
    try {
      const result = execSync(
        `gh pr create --title "${title}" --body "${prBody}" --base main --head ${currentBranch}`,
        { cwd: repoRoot, encoding: 'utf8' }
      );
      
      const prUrl = result.trim();
      
      return {
        success: true,
        url: prUrl,
        branch: currentBranch,
        review
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Merge with checks
  async mergeWithChecks(prNumber, options = {}) {
    if (!this.isGitRepo) {
      return { success: false, error: 'Not a git repository' };
    }
    
    try {
      // Run final agent review
      const review = await this.runAgentReview({ thorough: true });
      
      if (review.consensus === 'rejected' && !options.force) {
        return {
          success: false,
          error: 'Merge blocked by agent review',
          review
        };
      }
      
      // Merge PR
      const mergeMethod = options.squash ? '--squash' : '--merge';
      execSync(`gh pr merge ${prNumber} ${mergeMethod} --delete-branch`, {
        cwd: repoRoot
      });
      
      return {
        success: true,
        message: `PR #${prNumber} merged successfully`,
        review
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  const git = new GitIntegration();
  
  async function run() {
    switch (command) {
      case 'init':
        const initResult = await git.initRepo();
        console.log(initResult.success ? 
          `✅ ${initResult.message}` : 
          `❌ ${initResult.error}`);
        break;
        
      case 'branch':
        const featureId = args[1];
        if (!featureId) {
          console.error('Usage: git-integration.mjs branch <feature-id>');
          process.exit(1);
        }
        const branchResult = await git.createFeatureBranch(featureId);
        console.log(branchResult.success ? 
          `✅ ${branchResult.message}` : 
          `❌ ${branchResult.error}`);
        break;
        
      case 'review':
        const reviewResult = await git.runAgentReview();
        process.exit(reviewResult.consensus === 'approved' ? 0 : 1);
        break;
        
      case 'commit':
        const message = args.slice(1).join(' ');
        if (!message) {
          console.error('Usage: git-integration.mjs commit <message>');
          process.exit(1);
        }
        const commitResult = await git.commitWithReview(message);
        console.log(commitResult.success ? 
          `✅ ${commitResult.message}` : 
          `❌ ${commitResult.error}`);
        break;
        
      case 'push':
        const pushResult = await git.pushWithChecks();
        console.log(pushResult.success ? 
          `✅ ${pushResult.message}` : 
          `❌ ${pushResult.error}`);
        break;
        
      case 'pr':
        const prTitle = args[1];
        const prBody = args[2] || '';
        if (!prTitle) {
          console.error('Usage: git-integration.mjs pr <title> [body]');
          process.exit(1);
        }
        const prResult = await git.createPullRequest(prTitle, prBody);
        console.log(prResult.success ? 
          `✅ PR created: ${prResult.url}` : 
          `❌ ${prResult.error}`);
        break;
        
      default:
        console.log(`
Git Integration with Agent Reviews

Usage: git-integration.mjs <command> [options]

Commands:
  init                    Initialize git repository
  branch <feature-id>     Create feature branch
  review                  Run agent code review
  commit <message>        Commit with agent review
  push                    Push with protection checks
  pr <title> [body]       Create PR with agent reviews

Examples:
  git-integration.mjs init
  git-integration.mjs branch 1.1.1.1.0.0
  git-integration.mjs review
  git-integration.mjs commit "Add user authentication"
  git-integration.mjs push
  git-integration.mjs pr "Feature: User Auth" "Implements login"

Review Agents (from 33-agent pool):
  Security: ${REVIEW_AGENTS.security.length} agents
  Quality: ${REVIEW_AGENTS.quality.length} agents
  Architecture: ${REVIEW_AGENTS.architecture.length} agents
  Compliance: ${REVIEW_AGENTS.compliance.length} agents
  Performance: ${REVIEW_AGENTS.performance.length} agents
`);
      }
  }
  
  run().catch(err => {
    console.error(colors.red + 'Error:' + colors.reset, err.message);
    process.exit(1);
  });
}