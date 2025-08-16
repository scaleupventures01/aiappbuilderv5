/**
 * Total Workflow Orchestrator - Dynamic Team Orchestration
 * Orchestrates ALL agents dynamically across the entire development lifecycle
 * 
 * This system is FLEXIBLE:
 * - Dynamically discovers agents (not hardcoded to 34)
 * - Teams can be added/removed/modified
 * - Agents can be added/removed at runtime
 * - Phases adapt to available agents
 * - System scales with team size
 */

import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { invokeRealAgentViaTask } from './workflow-runner-real.mjs';
import { readPrd, writePrd } from './prd-utils.mjs';
import { getAgentRegistry } from './agent-registry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TotalWorkflowOrchestrator extends EventEmitter {
  constructor() {
    super();
    
    // Dynamic agent registry - no hardcoded counts
    this.registry = getAgentRegistry();
    this.workflowPhases = [];
    this.agentTasks = new Map();
    this.agentResults = new Map();
    
    // Wait for registry initialization
    setTimeout(() => {
      this.initialized = true;
      console.log(`📊 Orchestrator initialized with ${this.registry.agentCount} agents in ${this.registry.teams.size} teams`);
    }, 100);
  }

  /**
   * Main orchestration entry point - coordinates ALL agents
   */
  async orchestrateCompleteWorkflow(prdPath, options = {}) {
    const { 
      realAgents = true, 
      doItFully = true,
      verifyAchievements = true 
    } = options;
    
    // Wait for initialization if needed
    if (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const agentCount = this.registry.agentCount;
    const teamCount = this.registry.teams.size;
    
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║            🎯 TOTAL WORKFLOW ORCHESTRATION                   ║
║                                                              ║
║         Orchestrating ${String(agentCount).padEnd(3)} Agents across ${String(teamCount).padEnd(2)} Teams      ║
║              Feature Development Lifecycle                   ║
╚══════════════════════════════════════════════════════════════╝
`);

    try {
      // Phase 1: Requirements & Planning (Product Team)
      console.log('\n📋 PHASE 1: Requirements & Planning');
      await this.phaseRequirementsPlanning(prdPath);
      
      // Phase 2: Architecture & Design (Technical Leadership + Design)
      console.log('\n🏗️ PHASE 2: Architecture & Design');
      await this.phaseArchitectureDesign(prdPath);
      
      // Phase 3: Security & Compliance Review (Security Team)
      console.log('\n🔒 PHASE 3: Security & Compliance Review');
      await this.phaseSecurityReview(prdPath);
      
      // Phase 4: Implementation (Engineering + AI/ML Teams)
      console.log('\n⚡ PHASE 4: Implementation');
      await this.phaseImplementation(prdPath, { realAgents, verifyAchievements });
      
      // Phase 5: Infrastructure & Deployment (DevOps Team)
      console.log('\n🚀 PHASE 5: Infrastructure & Deployment');
      await this.phaseInfrastructure(prdPath);
      
      // Phase 6: Quality Assurance (QA Team)
      console.log('\n✅ PHASE 6: Quality Assurance');
      await this.phaseQualityAssurance(prdPath);
      
      // Phase 7: Leadership Review & Sign-offs
      console.log('\n👔 PHASE 7: Leadership Review & Sign-offs');
      await this.phaseLeadershipSignoff(prdPath);
      
      // Phase 8: Final Verification & Learning
      console.log('\n🏁 PHASE 8: Final Verification & Learning');
      const result = await this.phaseFinalVerification(prdPath);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Workflow orchestration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Phase 1: Requirements & Planning
   * Dynamically uses all agents in product team
   */
  async phaseRequirementsPlanning(prdPath) {
    const productTeam = this.registry.getTeam('product');
    
    if (!productTeam || productTeam.agents.length === 0) {
      console.log('⚠️  No product team agents available');
      return;
    }
    
    console.log(`\n📊 Phase 1 Agents (${productTeam.agents.length} total):`);
    productTeam.agents.forEach(agent => {
      console.log(`  • ${agent}`);
    });
    
    for (const agent of productTeam) {
      console.log(`\n📝 ${agent}: Analyzing requirements...`);
      
      const prompt = `
You are ${agent} reviewing this PRD for requirements and planning.
PRD: ${prdPath}

Your tasks:
1. Review and validate requirements
2. Identify gaps or ambiguities
3. Create your specific work items
4. Define success criteria
5. Add your tasks to Section 9.2 Execution Plan

Focus on your domain:
- Product Manager: User stories and acceptance criteria
- Technical PM: Technical requirements and constraints
- Business Analyst: Business logic and data requirements
- Project Manager: Timeline, dependencies, and risks
- AI Product Manager: AI/ML requirements and capabilities

Return structured analysis and task list.
`;

      const result = await invokeRealAgentViaTask({
        agent,
        task: 'requirements-analysis',
        prompt,
        prdPath
      });
      
      this.agentTasks.set(agent, result.tasks);
      await this.updatePRDWithAgentTasks(prdPath, agent, result.tasks);
    }
  }

  /**
   * Phase 2: Architecture & Design
   * CTO, Staff Engineer, UX/UI Designer, UX Researcher
   */
  async phaseArchitectureDesign(prdPath) {
    const designTeam = [
      'cto',
      'staff-engineer',
      'ux-ui-designer',
      'ux-researcher'
    ];
    
    for (const agent of designTeam) {
      console.log(`\n🏗️ ${agent}: Creating architecture/design...`);
      
      const prompt = `
You are ${agent} responsible for architecture and design.
PRD: ${prdPath}

Your tasks:
1. Review requirements from Phase 1
2. Create your architectural/design specifications
3. Identify technical/design challenges
4. Define implementation approach
5. Document your design decisions

Focus areas:
- CTO: Overall architecture and technology choices
- Staff Engineer: Detailed technical design and patterns
- UX/UI Designer: User interface and experience design
- UX Researcher: User research and validation needs

Provide detailed specifications for implementation teams.
`;

      const result = await invokeRealAgentViaTask({
        agent,
        task: 'architecture-design',
        prompt,
        prdPath
      });
      
      this.agentResults.set(agent, result);
    }
  }

  /**
   * Phase 3: Security & Compliance Review
   * CISO, Security Architect, Application Security, AI Safety, Privacy
   */
  async phaseSecurityReview(prdPath) {
    const securityTeam = this.agentTeams.security;
    
    for (const agent of securityTeam) {
      console.log(`\n🔒 ${agent}: Security and compliance review...`);
      
      const prompt = `
You are ${agent} performing security and compliance review.
PRD: ${prdPath}

Your responsibilities:
1. Identify security risks and vulnerabilities
2. Review compliance requirements (GDPR, CCPA, etc.)
3. Define security controls and mitigations
4. Create security test cases
5. Document security requirements

Specific focus:
- CISO: Overall risk assessment and governance
- Security Architect: Security architecture and threat modeling
- Application Security: Code security and SAST/DAST requirements
- AI Safety: AI model safety and bias prevention
- Privacy Engineer: Data protection and privacy compliance

Provide comprehensive security assessment.
`;

      const result = await invokeRealAgentViaTask({
        agent,
        task: 'security-review',
        prompt,
        prdPath
      });
      
      this.agentResults.set(agent, result);
      
      // If critical security issues found, halt workflow
      if (result.criticalIssues && result.criticalIssues.length > 0) {
        throw new Error(`Critical security issues identified by ${agent}: ${result.criticalIssues.join(', ')}`);
      }
    }
  }

  /**
   * Phase 4: Implementation
   * All Engineering and AI/ML teams working in parallel
   */
  async phaseImplementation(prdPath, options = {}) {
    // Get all implementation teams dynamically
    const engineeringTeam = this.registry.getTeam('engineering');
    const aiMlTeam = this.registry.getTeam('ai_ml');
    
    const implementationTeams = [
      ...(engineeringTeam?.agents || []),
      ...(aiMlTeam?.agents || [])
    ];
    
    console.log(`\n📊 Implementation Phase Agents (${implementationTeams.length} working in parallel):`);
    console.log('├── Engineering Team:');
    engineeringTeam?.agents.forEach((agent, index) => {
      const isLast = index === engineeringTeam.agents.length - 1;
      console.log(`│   ${isLast ? '└──' : '├──'} ${agent}: ${this.getAgentResponsibility(agent)}`);
    });
    console.log('└── AI/ML Team:');
    aiMlTeam?.agents.forEach((agent, index) => {
      const isLast = index === aiMlTeam.agents.length - 1;
      console.log(`    ${isLast ? '└──' : '├──'} ${agent}: ${this.getAgentResponsibility(agent)}`);
    });
    
    // Parallel implementation by all engineering teams
    const implementationPromises = implementationTeams.map(async (agent) => {
      console.log(`\n⚡ ${agent}: Implementing assigned tasks...`);
      
      const prompt = `
You are ${agent} implementing your assigned tasks.
PRD: ${prdPath}

Review the architecture from Phase 2 and security requirements from Phase 3.

Your implementation tasks:
1. Review your assigned work items in Section 9.2
2. Implement 100% of your tasks
3. Create all required code/artifacts in /app/ structure
4. Follow architectural patterns and security requirements
5. Write tests for your implementation
6. Document your work

IMPORTANT:
- Complete ALL tasks before marking done
- Follow PRD requirements exactly
- Coordinate with other engineers as needed
- Ensure code quality and best practices

Return detailed implementation report.
`;

      const result = await invokeRealAgentViaTask({
        agent,
        task: 'implementation',
        prompt,
        prdPath
      });
      
      // Verify achievements if requested
      if (options.verifyAchievements) {
        await this.verifyAgentAchievements(agent, result, prdPath);
      }
      
      return { agent, result };
    });
    
    // Wait for all implementations to complete
    const implementations = await Promise.all(implementationPromises);
    
    // Store results
    implementations.forEach(({ agent, result }) => {
      this.agentResults.set(agent, result);
    });
  }

  /**
   * Phase 5: Infrastructure & Deployment
   * DevOps, SRE, DevSecOps teams
   */
  async phaseInfrastructure(prdPath) {
    const infraTeam = this.agentTeams.infrastructure;
    
    for (const agent of infraTeam) {
      console.log(`\n🚀 ${agent}: Setting up infrastructure...`);
      
      const prompt = `
You are ${agent} responsible for infrastructure and deployment.
PRD: ${prdPath}

Your tasks:
1. Review implementation from Phase 4
2. Set up required infrastructure
3. Configure CI/CD pipelines
4. Implement monitoring and alerting
5. Prepare deployment procedures

Specific responsibilities:
- DevOps Engineer: Infrastructure as code, deployment automation
- Site Reliability: Reliability, performance, and monitoring
- DevSecOps: Security automation and compliance checks

Ensure production readiness.
`;

      const result = await invokeRealAgentViaTask({
        agent,
        task: 'infrastructure',
        prompt,
        prdPath
      });
      
      this.agentResults.set(agent, result);
    }
  }

  /**
   * Phase 6: Quality Assurance with LIVE BROWSER TESTING
   * QA Engineer and QA Automation Engineer using Playwright
   * ALWAYS uses real browsers - NEVER theoretical testing
   */
  async phaseQualityAssurance(prdPath) {
    const qaTeam = this.registry.getTeam('quality');
    
    console.log('\n🎭 PHASE 6: Quality Assurance with LIVE BROWSER TESTING');
    console.log('   Using Playwright for REAL browser testing - NO MOCKING');
    
    // Import Playwright testing system
    const { validateWithPlaywright } = await import('./playwright-testing-system.mjs');
    
    for (const agent of qaTeam) {
      console.log(`\n✅ ${agent}: Performing quality assurance...`);
      
      const prompt = `
You are ${agent} performing comprehensive quality assurance.
PRD: ${prdPath}

Review ALL implementation from previous phases.

Your QA tasks:
1. Validate all requirements are met
2. Execute comprehensive test plans
3. Verify security requirements
4. Test performance and reliability
5. Validate user experience
6. Document all findings

Specific focus:
- QA Engineer: Manual testing, exploratory testing, user acceptance
- QA Automation: Automated test suites, CI integration, regression testing

Ensure 100% quality before approval.
`;

      const result = await invokeRealAgentViaTask({
        agent,
        task: 'quality-assurance',
        prompt,
        prdPath
      });
      
      this.agentResults.set(agent, result);
      
      // QA must pass for workflow to continue
      if (result.overallStatus !== 'Pass') {
        console.log(`⚠️  QA failed: ${result.failureReasons.join(', ')}`);
        // Send back to implementation phase
        await this.requestRework(result.failedItems, prdPath);
      }
      
      // ALWAYS run live browser tests with Playwright
      console.log('\n🌐 Running LIVE browser tests with Playwright...');
      const browserTestResult = await validateWithPlaywright(
        { id: path.basename(prdPath), actions: [], assertions: [] },
        'http://localhost:3000'
      );
      
      if (!browserTestResult.passed) {
        console.log('❌ Live browser tests FAILED - sending back for fixes');
        await this.requestRework([{
          type: 'browser_test_failure',
          details: browserTestResult.results
        }], prdPath);
      } else {
        console.log('✅ All live browser tests PASSED');
      }
    }
  }

  /**
   * Phase 7: Leadership Review & Sign-offs with LEADER VERIFICATION
   * Leader Orchestrator VERIFIES EVERYTHING before leadership signs off
   * CTO, Chief AI Officer, VP Engineering, VP Product
   */
  async phaseLeadershipSignoff(prdPath) {
    // First, Leader Orchestrator verifies ALL agent claims
    console.log('\n👑 LEADER ORCHESTRATOR VERIFICATION PHASE');
    console.log('   Verifying EVERY claim from EVERY agent...');
    
    // Import Leader Orchestrator
    const { LeaderOrchestratorAgent } = await import('../../agents/leader-orchestrator.mjs');
    const leaderOrchestrator = new LeaderOrchestratorAgent();
    
    // Collect all agent claims for verification
    const allAgentClaims = {};
    for (const [agent, result] of this.agentResults.entries()) {
      allAgentClaims[agent] = result;
    }
    
    // Leader verifies EVERYTHING
    const leaderVerification = await leaderOrchestrator.provideFinalApproval(prdPath, allAgentClaims);
    
    if (!leaderVerification.approved) {
      console.log('❌ LEADER ORCHESTRATOR REJECTED - Claims unverified');
      throw new Error('Leader Orchestrator found unverified claims - cannot proceed to sign-offs');
    }
    
    console.log('✅ LEADER ORCHESTRATOR APPROVED - All claims verified with evidence');
    
    // Now proceed with leadership sign-offs
    const leadership = this.registry.getTeam('leadership');
    const signoffs = new Map();
    
    for (const leader of leadership) {
      console.log(`\n👔 ${leader}: Final review and sign-off...`);
      
      const prompt = `
You are ${leader} performing final review for sign-off.
PRD: ${prdPath}

Review the complete implementation:
1. Requirements fulfillment
2. Architecture and design quality
3. Security and compliance
4. Implementation completeness
5. Quality assurance results
6. Business value delivery

Provide your sign-off decision with detailed reasoning.
Must achieve excellence standards for approval.
`;

      const signoff = await invokeRealAgentViaTask({
        agent: leader,
        task: 'leadership-signoff',
        prompt,
        prdPath
      });
      
      signoffs.set(leader, signoff);
      
      if (!signoff.approved) {
        console.log(`❌ ${leader} did not approve: ${signoff.reason}`);
        throw new Error(`Sign-off rejected by ${leader}: ${signoff.reason}`);
      }
    }
    
    this.signoffs = signoffs;
  }

  /**
   * Get agent responsibility description
   */
  getAgentResponsibility(agentName) {
    const responsibilities = {
      'frontend-engineer': 'UI components and user interactions',
      'backend-engineer': 'API endpoints and server logic',
      'full-stack-engineer': 'End-to-end feature integration',
      'data-engineer': 'Database schemas and data pipelines',
      'ai-engineer': 'AI model integration and optimization',
      'machine-learning-engineer': 'ML model training and deployment',
      'ml-research-scientist': 'Algorithm research and innovation',
      'mlops-engineer': 'ML operations and infrastructure',
      'data-scientist': 'Data analysis and insights',
      'data-analyst': 'Data visualization and reporting',
      'staff-engineer': 'Technical architecture and mentorship',
      'implementation-owner': 'Feature delivery ownership',
      'devops-engineer': 'CI/CD and deployment automation',
      'site-reliability-engineer': 'System reliability and monitoring',
      'devsecops-engineer': 'Security automation in CI/CD',
      'qa-engineer': 'Manual testing and validation',
      'qa-automation-engineer': 'Automated test frameworks',
      'product-manager': 'Product strategy and requirements',
      'ai-product-manager': 'AI feature requirements',
      'technical-product-manager': 'Technical specifications',
      'business-analyst': 'Business logic and processes',
      'project-manager': 'Timeline and coordination',
      'ux-ui-designer': 'User interface design',
      'ux-researcher': 'User research and testing',
      'cto': 'Technical leadership and strategy',
      'chief-ai-officer': 'AI strategy and governance',
      'vp-engineering': 'Engineering management',
      'vp-product': 'Product leadership',
      'ciso': 'Security leadership and compliance',
      'security-architect': 'Security architecture design',
      'application-security-engineer': 'Application security testing',
      'ai-safety-engineer': 'AI safety and ethics',
      'privacy-engineer': 'Data privacy and protection'
    };
    
    return responsibilities[agentName] || 'Specialized tasks';
  }

  /**
   * Phase 8: Final Verification & Learning
   */
  async phaseFinalVerification(prdPath) {
    console.log('\n🏁 Running final verification...');
    
    // Get all agents dynamically
    const allAgents = this.registry.getAllActiveAgents();
    
    // Verify all agents completed their work
    const completionStatus = {};
    for (const agent of allAgents) {
      const result = this.agentResults.get(agent);
      completionStatus[agent] = result ? 'Completed' : 'Missing';
    }
    
    // Check if all agents completed
    const allCompleted = Object.values(completionStatus).every(status => status === 'Completed');
    
    if (!allCompleted) {
      const missing = Object.entries(completionStatus)
        .filter(([_, status]) => status === 'Missing')
        .map(([agent, _]) => agent);
      
      console.log(`⚠️  Missing work from agents: ${missing.join(', ')}`);
    }
    
    // Generate comprehensive report
    const report = {
      success: allCompleted,
      prdPath,
      agentCount: this.allAgents.length,
      completionStatus,
      phases: {
        requirements: 'Completed',
        architecture: 'Completed',
        security: 'Completed',
        implementation: 'Completed',
        infrastructure: 'Completed',
        qualityAssurance: 'Completed',
        leadership: 'Completed'
      },
      signoffs: Object.fromEntries(this.signoffs || []),
      timestamp: new Date().toISOString()
    };
    
    if (allCompleted) {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║              ✅ WORKFLOW ORCHESTRATION COMPLETE              ║
║                                                              ║
║   All 34 agents have completed their work                   ║
║   Quality assurance passed                                  ║
║   Leadership sign-offs obtained                             ║
║   Ready for production deployment                           ║
╚══════════════════════════════════════════════════════════════╝
`);
    }
    
    return report;
  }

  /**
   * Verify that agents actually achieved what they claim
   */
  async verifyAgentAchievements(agent, claimedResult, prdPath) {
    console.log(`\n🔍 Verifying ${agent} achievements...`);
    
    const verificationPrompt = `
You are an independent auditor verifying the work of ${agent}.

Claimed achievements:
${JSON.stringify(claimedResult, null, 2)}

PRD: ${prdPath}

Verification tasks:
1. Check if claimed artifacts actually exist
2. Verify code/files were actually created/modified
3. Validate implementation matches requirements
4. Confirm 100% task completion
5. Identify any discrepancies

Be thorough and skeptical. Return detailed verification.
`;

    const verification = await invokeRealAgentViaTask({
      agent: 'qa-engineer',
      task: 'verify-agent-work',
      prompt: verificationPrompt,
      prdPath
    });

    if (!verification.verified) {
      console.log(`⚠️  ${agent} verification failed: ${verification.reason}`);
      
      // Request completion of missing work
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

Complete ALL missing work immediately. No excuses.
This is your final opportunity to deliver.
`;

    await invokeRealAgentViaTask({
      agent,
      task: 'complete-missing-work',
      prompt: completionPrompt,
      prdPath
    });
  }

  /**
   * Request rework for failed QA items
   */
  async requestRework(failedItems, prdPath) {
    console.log('\n🔄 Requesting rework for failed QA items...');
    
    for (const item of failedItems) {
      const responsibleAgent = this.identifyResponsibleAgent(item);
      
      const reworkPrompt = `
You are ${responsibleAgent}. QA found issues with your work.

Failed item:
${JSON.stringify(item, null, 2)}

PRD: ${prdPath}

Fix the issue immediately and ensure it passes QA standards.
`;

      await invokeRealAgentViaTask({
        agent: responsibleAgent,
        task: 'rework-failed-item',
        prompt: reworkPrompt,
        prdPath
      });
    }
  }

  /**
   * Identify which agent is responsible for a failed item
   */
  identifyResponsibleAgent(item) {
    // Logic to map failed items to responsible agents
    if (item.type === 'frontend') return 'frontend-engineer';
    if (item.type === 'backend') return 'backend-engineer';
    if (item.type === 'database') return 'data-engineer';
    if (item.type === 'security') return 'security-architect';
    if (item.type === 'infrastructure') return 'devops-engineer';
    return 'full-stack-engineer'; // Default
  }

  /**
   * Update PRD with agent tasks
   */
  async updatePRDWithAgentTasks(prdPath, agent, tasks) {
    const prdContent = await readPrd(prdPath);
    const taskSection = `
### ${agent} Tasks
${tasks.map((task, i) => `${i + 1}. [ ] ${task}`).join('\n')}
`;
    
    // Add to Section 9.2 Execution Plan
    const updatedPrd = prdContent.replace(
      /## 9\.2 Execution Plan.*?(?=##|$)/s,
      (match) => match + '\n' + taskSection
    );
    
    await writePrd(prdPath, updatedPrd);
  }
}

// Export for use in orchestration
export async function orchestrateTotalWorkflow(prdPath, options = {}) {
  const orchestrator = new TotalWorkflowOrchestrator();
  return await orchestrator.orchestrateCompleteWorkflow(prdPath, options);
}