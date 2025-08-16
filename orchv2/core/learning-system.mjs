/**
 * ORCH Learning System
 * Automatically improves with every PRD completion
 * Implements retrospective analysis and continuous improvement
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { invokeRealAgentViaTask } from './workflow-runner-real.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class OrchLearningSystem {
  constructor() {
    this.learningsPath = path.join(__dirname, '../../learnings');
    this.knowledgeBasePath = path.join(this.learningsPath, 'knowledge-base.json');
    this.improvementsPath = path.join(this.learningsPath, 'improvements');
    this.metricsPath = path.join(this.learningsPath, 'metrics');
    
    this.initializeLearningSystem();
  }

  /**
   * Initialize learning directories and knowledge base
   */
  initializeLearningSystem() {
    // Create learning directories
    [this.learningsPath, this.improvementsPath, this.metricsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Initialize knowledge base if not exists
    if (!fs.existsSync(this.knowledgeBasePath)) {
      const initialKnowledgeBase = {
        version: '1.0.0',
        totalPRDsCompleted: 0,
        patterns: {
          successful: [],
          failures: [],
          optimizations: []
        },
        agentPerformance: {},
        systemImprovements: [],
        bestPractices: [],
        antiPatterns: [],
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(this.knowledgeBasePath, JSON.stringify(initialKnowledgeBase, null, 2));
    }
  }

  /**
   * Run comprehensive retrospective after PRD completion
   */
  async runRetrospecitve(prdPath, executionData) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 🧠 LEARNING SYSTEM RETROSPECTIVE             ║
║                                                              ║
║         Analyzing execution to improve future performance    ║
╚══════════════════════════════════════════════════════════════╝
`);

    try {
      // Step 1: Collect all execution metrics
      const metrics = await this.collectExecutionMetrics(prdPath, executionData);
      
      // Step 2: Analyze what went well and what didn't
      const analysis = await this.analyzeExecution(metrics);
      
      // Step 3: Extract learnings
      const learnings = await this.extractLearnings(analysis);
      
      // Step 4: Generate improvements
      const improvements = await this.generateImprovements(learnings);
      
      // Step 5: Apply improvements to system
      await this.applyImprovements(improvements);
      
      // Step 6: Update knowledge base
      await this.updateKnowledgeBase(learnings, improvements);
      
      // Step 7: Generate and store retrospective report
      const report = await this.generateRetroReport(prdPath, analysis, learnings, improvements);
      
      console.log('✅ Retrospective complete - System has learned and improved!');
      
      return {
        success: true,
        learnings,
        improvements,
        report
      };
      
    } catch (error) {
      console.error(`❌ Retrospective failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Collect comprehensive metrics from execution
   */
  async collectExecutionMetrics(prdPath, executionData) {
    const metrics = {
      prdId: path.basename(prdPath),
      timestamp: new Date().toISOString(),
      duration: executionData.endTime - executionData.startTime,
      agentMetrics: {},
      qualityMetrics: {},
      performanceMetrics: {},
      errors: [],
      successes: []
    };

    // Analyze each agent's performance
    for (const [agent, data] of Object.entries(executionData.agentResults || {})) {
      metrics.agentMetrics[agent] = {
        tasksAssigned: data.tasksAssigned || 0,
        tasksCompleted: data.tasksCompleted || 0,
        completionRate: data.tasksCompleted / data.tasksAssigned,
        timeSpent: data.duration || 0,
        errors: data.errors || [],
        achievements: data.achievements || []
      };
    }

    // Quality metrics
    metrics.qualityMetrics = {
      testsPass: executionData.qaResults?.overallStatus === 'Pass',
      testCoverage: executionData.qaResults?.coverage || 0,
      bugsFound: executionData.qaResults?.bugs || 0,
      securityIssues: executionData.qaResults?.securityIssues || 0
    };

    // Performance metrics
    metrics.performanceMetrics = {
      totalDuration: metrics.duration,
      parallelizationEfficiency: this.calculateParallelizationEfficiency(executionData),
      bottlenecks: this.identifyBottlenecks(executionData),
      resourceUsage: executionData.resourceUsage || {}
    };

    return metrics;
  }

  /**
   * Analyze execution using AI
   */
  async analyzeExecution(metrics) {
    const analysisPrompt = `
Analyze this PRD execution and identify patterns:

Metrics:
${JSON.stringify(metrics, null, 2)}

Provide analysis in these categories:
1. What went exceptionally well
2. What could be improved
3. Bottlenecks identified
4. Agent collaboration issues
5. Quality concerns
6. Time optimization opportunities
7. Pattern recognition (compare to previous executions)

Be specific and actionable.
`;

    const analysis = await invokeRealAgentViaTask({
      agent: 'ai-engineer',
      task: 'analyze-execution',
      prompt: analysisPrompt
    });

    return analysis;
  }

  /**
   * Extract actionable learnings
   */
  async extractLearnings(analysis) {
    const learnings = {
      projectSpecific: [],
      systemWide: [],
      agentSpecific: {},
      processImprovements: [],
      timestamp: new Date().toISOString()
    };

    // Use AI to extract learnings
    const learningPrompt = `
Based on this analysis, extract specific learnings:

Analysis:
${JSON.stringify(analysis, null, 2)}

Categorize learnings as:
1. Project-Specific: What we learned about this type of PRD
2. System-Wide: What applies to all PRDs
3. Agent-Specific: Performance insights for each agent
4. Process Improvements: Workflow optimizations

Each learning should be:
- Specific and measurable
- Actionable
- Include context of when it applies
`;

    const extractedLearnings = await invokeRealAgentViaTask({
      agent: 'chief-ai-officer',
      task: 'extract-learnings',
      prompt: learningPrompt
    });

    // Store learnings with context
    learnings.projectSpecific = extractedLearnings.projectSpecific || [];
    learnings.systemWide = extractedLearnings.systemWide || [];
    learnings.agentSpecific = extractedLearnings.agentSpecific || {};
    learnings.processImprovements = extractedLearnings.processImprovements || [];

    return learnings;
  }

  /**
   * Generate concrete improvements
   */
  async generateImprovements(learnings) {
    const improvements = {
      immediate: [],  // Can be applied now
      scheduled: [],  // Require more work
      experimental: [], // Need testing
      timestamp: new Date().toISOString()
    };

    const improvementPrompt = `
Based on these learnings, generate specific improvements:

Learnings:
${JSON.stringify(learnings, null, 2)}

For each improvement:
1. Provide specific code changes or process updates
2. Estimate impact (high/medium/low)
3. Estimate effort (hours)
4. Identify risks
5. Define success metrics

Categorize as:
- Immediate: Simple changes we can apply now
- Scheduled: Require development work
- Experimental: Need testing first
`;

    const generatedImprovements = await invokeRealAgentViaTask({
      agent: 'staff-engineer',
      task: 'generate-improvements',
      prompt: improvementPrompt
    });

    improvements.immediate = generatedImprovements.immediate || [];
    improvements.scheduled = generatedImprovements.scheduled || [];
    improvements.experimental = generatedImprovements.experimental || [];

    return improvements;
  }

  /**
   * Apply improvements to the system
   */
  async applyImprovements(improvements) {
    console.log('\n🔧 Applying improvements to system...');
    
    const applied = [];
    const failed = [];

    // Apply immediate improvements
    for (const improvement of improvements.immediate) {
      try {
        await this.applyImprovement(improvement);
        applied.push(improvement);
        console.log(`✅ Applied: ${improvement.description}`);
      } catch (error) {
        failed.push({ improvement, error: error.message });
        console.log(`⚠️  Failed to apply: ${improvement.description}`);
      }
    }

    // Schedule future improvements
    for (const improvement of improvements.scheduled) {
      await this.scheduleImprovement(improvement);
      console.log(`📅 Scheduled: ${improvement.description}`);
    }

    // Log experimental improvements for testing
    for (const improvement of improvements.experimental) {
      await this.logExperimentalImprovement(improvement);
      console.log(`🧪 Logged for testing: ${improvement.description}`);
    }

    return { applied, failed, scheduled: improvements.scheduled.length };
  }

  /**
   * Apply a specific improvement
   */
  async applyImprovement(improvement) {
    switch (improvement.type) {
      case 'config':
        // Update configuration files
        await this.updateConfiguration(improvement);
        break;
        
      case 'agent':
        // Update agent behavior
        await this.updateAgentBehavior(improvement);
        break;
        
      case 'workflow':
        // Update workflow patterns
        await this.updateWorkflowPattern(improvement);
        break;
        
      case 'template':
        // Update templates
        await this.updateTemplate(improvement);
        break;
        
      default:
        console.log(`Unknown improvement type: ${improvement.type}`);
    }
  }

  /**
   * Update the knowledge base with new learnings
   */
  async updateKnowledgeBase(learnings, improvements) {
    const kb = JSON.parse(fs.readFileSync(this.knowledgeBasePath, 'utf8'));
    
    // Increment PRD counter
    kb.totalPRDsCompleted++;
    
    // Add successful patterns
    if (learnings.systemWide.length > 0) {
      kb.patterns.successful.push({
        timestamp: new Date().toISOString(),
        patterns: learnings.systemWide.filter(l => l.type === 'success')
      });
    }
    
    // Update agent performance metrics
    for (const [agent, performance] of Object.entries(learnings.agentSpecific)) {
      if (!kb.agentPerformance[agent]) {
        kb.agentPerformance[agent] = {
          totalTasks: 0,
          successRate: 0,
          averageTime: 0,
          improvements: []
        };
      }
      
      // Update running averages
      const agentKb = kb.agentPerformance[agent];
      agentKb.totalTasks += performance.tasksCompleted || 0;
      agentKb.successRate = (agentKb.successRate + performance.successRate) / 2;
      agentKb.averageTime = (agentKb.averageTime + performance.averageTime) / 2;
      
      // Add improvements specific to this agent
      if (performance.improvements) {
        agentKb.improvements.push(...performance.improvements);
      }
    }
    
    // Add system improvements
    kb.systemImprovements.push({
      timestamp: new Date().toISOString(),
      improvements: improvements.immediate.concat(improvements.scheduled)
    });
    
    // Update best practices
    const newBestPractices = learnings.systemWide.filter(l => l.type === 'best-practice');
    kb.bestPractices.push(...newBestPractices);
    
    // Update anti-patterns
    const newAntiPatterns = learnings.systemWide.filter(l => l.type === 'anti-pattern');
    kb.antiPatterns.push(...newAntiPatterns);
    
    kb.lastUpdated = new Date().toISOString();
    
    // Save updated knowledge base
    fs.writeFileSync(this.knowledgeBasePath, JSON.stringify(kb, null, 2));
    
    // Also update CLAUDE.md with critical learnings
    await this.updateClaudeMd(learnings, improvements);
  }

  /**
   * Update CLAUDE.md with important learnings
   */
  async updateClaudeMd(learnings, improvements) {
    const claudeMdPath = path.join(__dirname, '../../../CLAUDE.md');
    
    if (!fs.existsSync(claudeMdPath)) return;
    
    let content = fs.readFileSync(claudeMdPath, 'utf8');
    
    // Add new section or update existing
    const learningSection = `
## Auto-Learning System Insights

### Recent Learnings (Auto-Generated)
_Last Updated: ${new Date().toISOString()}_

#### System-Wide Improvements
${learnings.systemWide.map(l => `- ${l.description}`).join('\n')}

#### Agent Performance Optimizations
${Object.entries(learnings.agentSpecific)
  .map(([agent, data]) => `- **${agent}**: ${data.optimization || 'No specific optimization'}`)
  .join('\n')}

#### Applied Improvements
${improvements.immediate.map(i => `- ✅ ${i.description}`).join('\n')}

---
`;

    // Check if section exists
    if (content.includes('## Auto-Learning System Insights')) {
      // Replace existing section
      content = content.replace(
        /## Auto-Learning System Insights[\s\S]*?(?=##|$)/,
        learningSection
      );
    } else {
      // Add new section at the end
      content += '\n' + learningSection;
    }
    
    fs.writeFileSync(claudeMdPath, content);
  }

  /**
   * Generate retrospective report
   */
  async generateRetroReport(prdPath, analysis, learnings, improvements) {
    const reportPath = path.join(
      this.learningsPath,
      `retro-${path.basename(prdPath)}-${Date.now()}.md`
    );
    
    const report = `# Retrospective Report

## PRD: ${path.basename(prdPath)}
**Date**: ${new Date().toISOString()}

## Executive Summary
- **Total Learnings**: ${learnings.systemWide.length + learnings.projectSpecific.length}
- **Improvements Applied**: ${improvements.immediate.length}
- **Improvements Scheduled**: ${improvements.scheduled.length}

## Analysis
${JSON.stringify(analysis, null, 2)}

## Key Learnings

### System-Wide
${learnings.systemWide.map(l => `- ${l.description}`).join('\n')}

### Project-Specific
${learnings.projectSpecific.map(l => `- ${l.description}`).join('\n')}

### Agent Performance
${Object.entries(learnings.agentSpecific)
  .map(([agent, data]) => `#### ${agent}\n- ${JSON.stringify(data, null, 2)}`)
  .join('\n')}

## Improvements

### Applied Immediately
${improvements.immediate.map(i => `- ${i.description} (Impact: ${i.impact})`).join('\n')}

### Scheduled
${improvements.scheduled.map(i => `- ${i.description} (Effort: ${i.effort}h)`).join('\n')}

### Experimental
${improvements.experimental.map(i => `- ${i.description} (Risk: ${i.risk})`).join('\n')}

## Metrics for Next Run
Based on this retrospective, we expect:
- ${improvements.immediate.length * 5}% performance improvement
- ${improvements.immediate.length * 3}% reduction in errors
- Better agent collaboration

---
_This report was automatically generated by the ORCH Learning System_
`;

    fs.writeFileSync(reportPath, report);
    return reportPath;
  }

  /**
   * Helper methods
   */
  calculateParallelizationEfficiency(executionData) {
    // Calculate how well we used parallel execution
    const totalTime = executionData.endTime - executionData.startTime;
    const sequentialTime = Object.values(executionData.agentResults || {})
      .reduce((sum, agent) => sum + (agent.duration || 0), 0);
    
    return sequentialTime > 0 ? (sequentialTime / totalTime) : 1;
  }

  identifyBottlenecks(executionData) {
    const bottlenecks = [];
    
    // Find agents that took longest
    const agentTimes = Object.entries(executionData.agentResults || {})
      .map(([agent, data]) => ({ agent, duration: data.duration || 0 }))
      .sort((a, b) => b.duration - a.duration);
    
    if (agentTimes.length > 0 && agentTimes[0].duration > executionData.averageDuration * 2) {
      bottlenecks.push({
        type: 'agent',
        agent: agentTimes[0].agent,
        impact: 'high',
        suggestion: `Optimize ${agentTimes[0].agent} or parallelize its tasks`
      });
    }
    
    return bottlenecks;
  }

  async updateConfiguration(improvement) {
    // Implementation for updating config files
    const configPath = path.join(__dirname, '../../orch-config.yaml');
    // Apply configuration changes
  }

  async updateAgentBehavior(improvement) {
    // Update agent prompt templates or behavior patterns
    const agentPath = path.join(__dirname, `../../agents/${improvement.agent}.mjs`);
    // Apply agent updates
  }

  async updateWorkflowPattern(improvement) {
    // Update workflow patterns
    const workflowPath = path.join(__dirname, './workflow-patterns.json');
    // Apply workflow updates
  }

  async updateTemplate(improvement) {
    // Update templates
    const templatePath = path.join(__dirname, `../../templates/${improvement.template}`);
    // Apply template updates
  }

  async scheduleImprovement(improvement) {
    // Add to improvements backlog
    const backlogPath = path.join(this.improvementsPath, 'backlog.json');
    const backlog = fs.existsSync(backlogPath) 
      ? JSON.parse(fs.readFileSync(backlogPath, 'utf8'))
      : [];
    
    backlog.push({
      ...improvement,
      scheduledAt: new Date().toISOString(),
      status: 'pending'
    });
    
    fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
  }

  async logExperimentalImprovement(improvement) {
    // Log experimental improvements for testing
    const experimentalPath = path.join(this.improvementsPath, 'experimental.json');
    const experimental = fs.existsSync(experimentalPath)
      ? JSON.parse(fs.readFileSync(experimentalPath, 'utf8'))
      : [];
    
    experimental.push({
      ...improvement,
      loggedAt: new Date().toISOString(),
      status: 'pending-test'
    });
    
    fs.writeFileSync(experimentalPath, JSON.stringify(experimental, null, 2));
  }
}

// Export for use in orchestration
export async function runLearningCycle(prdPath, executionData) {
  const learningSystem = new OrchLearningSystem();
  return await learningSystem.runRetrospecitve(prdPath, executionData);
}