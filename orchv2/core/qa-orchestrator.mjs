/**
 * Total Workflow Orchestrator with Real Agent Integration
 * Orchestrates ALL 34 agents across the entire development lifecycle
 * Not just QA - this is comprehensive team orchestration
 */

import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { invokeRealAgentViaTask } from './workflow-runner-real.mjs';
import { readPrd, writePrd } from './prd-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class QAOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.requiredLeadership = [
      'product-manager',
      'chief-ai-officer', 
      'cto',
      'vp-engineering',
      'vp-product'
    ];
    this.securitySensitiveRoles = ['ciso'];
    this.qaPhases = [];
    this.signOffs = new Map();
  }

  /**
   * Main QA orchestration workflow
   */
  async orchestrateQA(prdPath, options = {}) {
    const { realAgents = true, doItFully = true } = options;
    
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║               🎯 ENHANCED QA ORCHESTRATION                   ║
║                                                              ║
║   Using REAL AI agents for comprehensive quality assurance  ║
╚══════════════════════════════════════════════════════════════╝
`);

    try {
      // Phase 1: Analyze PRD and identify required agents
      const prdContent = await readPrd(prdPath);
      const requiredAgents = await this.identifyRequiredAgents(prdContent);
      
      console.log('\n📋 Required Agents Identified:');
      requiredAgents.forEach(agent => {
        console.log(`  • ${agent}`);
      });

      // Phase 2: Agent task assignment and review
      if (realAgents) {
        await this.assignAgentTasks(prdPath, requiredAgents);
      }

      // Phase 3: Implementation phase with real agents
      if (doItFully) {
        await this.executeImplementation(prdPath, requiredAgents);
      }

      // Phase 4: QA validation
      await this.runQAValidation(prdPath);

      // Phase 5: Leadership sign-offs
      await this.getLeadershipSignOffs(prdPath);

      // Phase 6: Final verification
      const result = await this.finalVerification(prdPath);
      
      return result;

    } catch (error) {
      console.error(`❌ QA Orchestration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Identify required agents from PRD
   */
  async identifyRequiredAgents(prdContent) {
    const agents = new Set();
    
    // Check assigned_roles in frontmatter
    const assignedRolesMatch = prdContent.match(/assigned_roles:\s*\[(.*?)\]/);
    if (assignedRolesMatch) {
      const roles = assignedRolesMatch[1].split(',').map(r => r.trim().replace(/['"]/g, ''));
      roles.forEach(role => agents.add(role));
    }

    // Scan PRD content for @orch/agents/ mentions
    const agentMentions = prdContent.matchAll(/@orch\/agents?\/([\w-]+)/g);
    for (const match of agentMentions) {
      agents.add(match[1]);
    }

    // Add mandatory QA roles
    agents.add('qa-engineer');
    agents.add('qa-automation-engineer');
    
    // Add leadership for sign-offs
    this.requiredLeadership.forEach(role => agents.add(role));
    
    // Check if security-sensitive
    if (this.isSecuritySensitive(prdContent)) {
      agents.add('ciso');
      agents.add('security-architect');
      agents.add('application-security-engineer');
    }

    return Array.from(agents);
  }

  /**
   * Check if PRD involves security-sensitive features
   */
  isSecuritySensitive(prdContent) {
    const securityKeywords = [
      'authentication', 'authorization', 'auth',
      'password', 'token', 'jwt', 'oauth',
      'encryption', 'security', 'sensitive data',
      'payment', 'financial', 'pii', 'gdpr', 'ccpa'
    ];
    
    const contentLower = prdContent.toLowerCase();
    return securityKeywords.some(keyword => contentLower.includes(keyword));
  }

  /**
   * Assign tasks to agents and get their input
   */
  async assignAgentTasks(prdPath, agents) {
    console.log('\n🤖 Assigning tasks to agents...');
    
    for (const agent of agents) {
      console.log(`\n📝 ${agent}: Reviewing PRD and adding tasks...`);
      
      const prompt = `
You are the ${agent} for this project.
Review the PRD at: ${prdPath}

Your tasks:
1. Thoroughly review the PRD
2. Identify your specific responsibilities
3. Add your tasks to Section 9.2 Execution Plan
4. Ensure your tasks are comprehensive and cover all aspects of your role
5. Return a structured list of your tasks

Focus on your domain expertise and ensure 100% coverage of your responsibilities.
`;

      if (options.realAgents) {
        const result = await invokeRealAgentViaTask({
          agent,
          task: 'review-prd-and-add-tasks',
          prompt,
          prdPath
        });
        
        // Add agent's tasks to execution plan
        await this.updateExecutionPlan(prdPath, agent, result.tasks);
      }
    }
  }

  /**
   * Execute implementation with all agents
   */
  async executeImplementation(prdPath, agents, options = {}) {
    console.log('\n🚀 Executing implementation phase...');
    
    const implementationAgents = agents.filter(a => 
      !this.requiredLeadership.includes(a) && 
      !['qa-engineer', 'qa-automation-engineer'].includes(a)
    );

    const agentResults = new Map();

    for (const agent of implementationAgents) {
      console.log(`\n⚡ ${agent}: Implementing tasks...`);
      
      const prompt = `
You are the ${agent} implementing your assigned tasks.
PRD: ${prdPath}

Instructions:
1. Review your tasks in Section 9.2 Execution Plan
2. Implement 100% of your assigned tasks
3. Create all required artifacts in /app/ folder structure
4. Follow PRD requirements exactly - they are immutable
5. Document your work for QA validation
6. Provide detailed completion report of what you achieved

Complete ALL tasks before reporting done.
`;

      if (options.realAgents) {
        const result = await invokeRealAgentViaTask({
          agent,
          task: 'implement-tasks',
          prompt,
          prdPath
        });
        
        agentResults.set(agent, result);
        
        // Verify agent achievements if requested
        if (options.verifyAgentAchievements) {
          await this.verifyAgentAchievement(agent, result, prdPath);
        }
      }
    }
    
    return agentResults;
  }

  /**
   * Verify that agent achieved what they claim
   */
  async verifyAgentAchievement(agent, claimedResult, prdPath) {
    console.log(`\n🔍 Verifying ${agent} achievements...`);
    
    const verificationPrompt = `
You are an independent auditor verifying the work of ${agent}.

Claimed achievements:
${JSON.stringify(claimedResult, null, 2)}

PRD: ${prdPath}

Verification tasks:
1. Check if claimed artifacts actually exist
2. Verify code/files were actually created/modified
3. Validate that implementation matches PRD requirements
4. Assess if agent completed 100% of assigned tasks
5. Report any discrepancies between claims and reality

Be thorough and skeptical. Return verification result.
`;

    const verification = await invokeRealAgentViaTask({
      agent: 'qa-engineer',  // Use QA engineer for verification
      task: 'verify-agent-work',
      prompt: verificationPrompt,
      prdPath
    });

    if (!verification.verified) {
      console.log(`⚠️  ${agent} verification failed: ${verification.reason}`);
      console.log(`   Discrepancies: ${verification.discrepancies.join(', ')}`);
      
      // Request agent to complete missing work
      await this.requestAgentCompletion(agent, verification.missingWork, prdPath);
    } else {
      console.log(`✅ ${agent} achievements verified`);
    }
    
    return verification;
  }

  /**
   * Request agent to complete missing work
   */
  async requestAgentCompletion(agent, missingWork, prdPath) {
    console.log(`\n🔄 Requesting ${agent} to complete missing work...`);
    
    const completionPrompt = `
You are ${agent}. Verification found incomplete work.

Missing items:
${missingWork.map(item => `- ${item}`).join('\n')}

PRD: ${prdPath}

Complete ALL missing work now. No excuses.
`;

    await invokeRealAgentViaTask({
      agent,
      task: 'complete-missing-work',
      prompt: completionPrompt,
      prdPath
    });
  }

  /**
   * Run comprehensive QA validation
   */
  async runQAValidation(prdPath) {
    console.log('\n✅ Running QA validation...');
    
    const qaPrompt = `
You are the QA Engineer validating the implementation.
PRD: ${prdPath}

Validation tasks:
1. Review all implemented features against PRD requirements
2. Execute comprehensive test plan
3. Verify all acceptance criteria are met
4. Check for security vulnerabilities
5. Validate performance requirements
6. Document test results with evidence
7. Create QA report with Overall Status

Ensure 100% test coverage before approving.
`;

    const qaResult = await invokeRealAgentViaTask({
      agent: 'qa-engineer',
      task: 'qa-validation',
      prompt: qaPrompt,
      prdPath
    });

    // Store QA results
    await this.saveQAResults(prdPath, qaResult);
    
    return qaResult.overallStatus === 'Pass';
  }

  /**
   * Get leadership sign-offs
   */
  async getLeadershipSignOffs(prdPath) {
    console.log('\n📝 Getting leadership sign-offs...');
    
    for (const leader of this.requiredLeadership) {
      console.log(`\n👔 ${leader}: Reviewing for sign-off...`);
      
      const signOffPrompt = `
You are the ${leader} reviewing for final sign-off.
PRD: ${prdPath}

Review criteria:
1. Implementation completeness
2. Quality assurance results
3. Business requirements alignment
4. Technical excellence
5. Risk assessment

Provide your sign-off decision with reasoning.
`;

      const signOff = await invokeRealAgentViaTask({
        agent: leader,
        task: 'leadership-signoff',
        prompt: signOffPrompt,
        prdPath
      });

      this.signOffs.set(leader, signOff);
      
      if (!signOff.approved) {
        console.log(`❌ ${leader} did not approve. Reason: ${signOff.reason}`);
        throw new Error(`Sign-off rejected by ${leader}`);
      }
    }
  }

  /**
   * Final verification before completion
   */
  async finalVerification(prdPath) {
    console.log('\n🏁 Final verification...');
    
    const checks = {
      allAgentsCompleted: true,
      qaValidationPassed: true,
      leadershipSignOffs: this.signOffs.size === this.requiredLeadership.length,
      artifactsCreated: true,
      documentationComplete: true
    };

    const allChecksPassed = Object.values(checks).every(v => v === true);
    
    if (allChecksPassed) {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ✅ QA ORCHESTRATION COMPLETE              ║
║                                                              ║
║   All agents completed work                                 ║
║   QA validation passed                                      ║
║   Leadership sign-offs obtained                             ║
║   Ready for deployment                                      ║
╚══════════════════════════════════════════════════════════════╝
`);
    }

    return {
      success: allChecksPassed,
      checks,
      signOffs: Object.fromEntries(this.signOffs)
    };
  }

  /**
   * Update PRD execution plan with agent tasks
   */
  async updateExecutionPlan(prdPath, agent, tasks) {
    const prdContent = await readPrd(prdPath);
    const executionPlanSection = `### ${agent} Tasks\n${tasks.map(t => `- [ ] ${t}`).join('\n')}\n`;
    
    // Add to Section 9.2
    const updatedPrd = prdContent.replace(
      /## 9\.2 Execution Plan.*?(?=##|$)/s,
      (match) => match + '\n' + executionPlanSection
    );
    
    await writePrd(prdPath, updatedPrd);
  }

  /**
   * Save QA results to appropriate location
   */
  async saveQAResults(prdPath, results) {
    const prdDir = path.dirname(prdPath);
    const qaDir = path.join(prdDir, 'QA');
    
    if (!fs.existsSync(qaDir)) {
      fs.mkdirSync(qaDir, { recursive: true });
    }
    
    const resultsPath = path.join(qaDir, `qa-results-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    return resultsPath;
  }
}

// Export for use in orch-start
export async function runEnhancedQA(prdPath, options = {}) {
  const orchestrator = new QAOrchestrator();
  return await orchestrator.orchestrateQA(prdPath, options);
}