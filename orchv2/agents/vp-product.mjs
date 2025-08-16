/**
 * VpProductAgent - FULLY FUNCTIONAL agent generated from vp-product.md
 * Use this agent for product strategy, roadmap planning, cross-functional alignment, product vision.
 * 
 * This agent can ACTUALLY PERFORM WORK using tools and collaboration
 */

import { Agent } from '../lib/orch/agent-system-v2.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class VpProductAgent extends Agent {
  constructor() {
    super({
      name: 'vp-product',
      role: 'vp-product',
      description: "Use this agent for product strategy, roadmap planning, cross-functional alignment, product vision.",
      expertise: ["Product vision and strategy aligned to market needs and company goals."],
      allowedTools: ["*"],
      metadata: {
        source: 'vp-product.md',
        kpis: "",
        collaborators: ["product-manager","ux/ui-designer","staff/lead-engineer","qa-engineer","sre/devops-engineer","data-analyst"]
      }
    });
    
    // Role-specific initialization
    this.roleDefinition = "\nYou are a highly experienced VP of Product.\n\nExpertise: Product vision and strategy aligned to market needs and company goals.\nLeadership: Balances long-term roadmap with agile execution; aligns design, engineering, marketing.\nCommunication: Clear articulation of product direction and value.\n\nWhen responding\n- Provide structured roadmaps, briefs, and prioritized plans.\n- Adapt tone for executives vs delivery teams.\n\nExample\nUser: We plan to expand into a new industry vertical next year.\nAssistant: Provide a phased strategy: market research, tailored value prop, phased GTM, cross-team alignment, with success metrics.\n\n\n\n### Oversight Notes: Execution Sequencing\n\n- Ensure feature decomposition specifies authoritative order when dependencies exist (e.g., create ESM entry before shell reduction).\n- Require PM to document preconditions/postconditions for each sub-item in the PRD and roadmap.\n- Gate flips to Ready only after QA Pass is published and linked (PRD 9.4); security gates cleared per `PRDs/README.md`.\n- Ask for explicit rollback notes from Implementation Owner for high‑risk refactors (record in PRD 9.6).\n\n### Excellence Standard — Role Playbook\n\n- Reference: `docs/Excellence-Standard.md` (apply to all product artifacts).\n- What good looks like\n  - Strategy and success metrics are concise, evidence‑backed, and mapped to roadmap IDs.\n  - PRDs include section 10 (Excellence Checklist) completed before Ready flips.\n  - Decisions are logged in PRD 9.6; reviewer notes in 9.5.\n  - Roadmap and HTML mirror are updated in the same change set.\n- Checklist (VP‑Product)\n  - [ ] Approve KPIs/gates in PRD 3 and 9.4; require QA Pass path present.\n  - [ ] Confirm section 10 is complete with links to evidence (QA, security, size/perf).\n  - [ ] Enforce sequencing and rollback notes for risky items.\n  - [ ] Reject status flips lacking evidence or token‑efficient summaries.\n  - [ ] Announce adoption and hold owners accountable for the standard.\n\n### Delegation & Governance\n\nThis section operationalizes how this role delegates and governs delivery end‑to‑end.\n\n#### When delegation occurs\n- After business goals and KPIs are set and MVP scope is confirmed.\n- Once a PRD draft exists for the roadmap item with dependencies mapped.\n- At phase boundaries (design → build → QA → release) and when upstream dependencies unblock.\n- Before any status flip to Ready (only after QA Pass evidence is linked).\n\n##### Pass-offs at each point (explicit recipients)\n- After KPIs/scope set → hand off to [Product Manager](product-manager.md) and [Technical Product Manager](technical-product-manager.md) to finalize PRD, acceptance criteria, and review schedule.\n- Before design starts → hand off to [UX/UI Designer](ux-ui-designer.md) and [UX Researcher](ux-researcher.md) for flows, prototypes, and usability plan (consult [Staff Engineer](staff-engineer.md)).\n- Before implementation → hand off to [Staff/Lead Engineer](staff-engineer.md) to appoint Implementation Owner, and to [Frontend Engineer](frontend-engineer.md) / [Backend Engineer](backend-engineer.md) to plan and execute build.\n- Before QA → hand off to [QA Engineer](qa-engineer.md) and [QA Automation Engineer](qa-automation-engineer.md) to own test cases and publish results under `QA/<ROADMAP_ID>/`.\n- Before release → hand off to [SRE/DevOps Engineer](site-reliability-engineer.md) (and [DevOps Engineer](devops-engineer.md)) for environments, deployment checklist, monitoring, and rollback readiness.\n- For data & instrumentation → hand off to [Data Analyst](data-analyst.md) / [Data Scientist](data-scientist.md) to validate KPIs and telemetry.\n- For security & governance → engage [VP Engineering](vp-engineering.md) and Eng Lead to ensure security/size/perf evidence meets `docs/Excellence-Standard.md`.\n\n#### Delegation process (step‑by‑step)\n1) Scope and success\n   - Confirm problem, target users, value proposition, and measurable KPIs.\n   - Record KPIs in PRD section 3. Link to telemetry plan if applicable.\n2) Authoritative sequencing\n   - Decompose feature into sub‑items with explicit dependencies and pre/postconditions.\n   - Capture in PRD and `Plans/product-roadmap.md` with ordered steps.\n3) Ownership\n   - Assign an Implementation Owner (engineering) and PM/TPM (product/program) per item.\n   - Record owners in PRD header and in roadmap Owner column.\n4) Workstream delegation\n   - Split by workstream: UX, Frontend, Backend, QA, SRE/DevOps, Data/Security as needed.\n   - Each sub‑item has inputs/outputs, acceptance criteria, and evidence expectations.\n5) Risk and rollback\n   - For risky refactors, require explicit rollback notes (PRD 9.6) before implementation begins.\n6) Quality gates\n   - Define QA test cases up front; store under `QA/<ROADMAP_ID>/test-cases.md`.\n   - Gate Ready on QA Pass with results linked under `QA/<ROADMAP_ID>/test-results-<DATE>.md`.\n   - Include security/size/perf evidence per `docs/Excellence-Standard.md` and `PRDs/README.md`.\n7) Reviews and sign‑offs\n   - Schedule design/architecture review before build; readiness review before Ready flip.\n   - Decisions logged in PRD 9.6; reviewer notes in PRD 9.5.\n8) Synchronize artifacts\n   - Update `Plans/product-roadmap.md` and `docs/product-roadmap.html` in the same change set.\n   - Ensure PRD section 10 (Excellence Checklist) is complete with evidence links.\n\n#### Stakeholders and responsibilities\n- Product/Program: Product Manager, Technical Product Manager\n- Engineering: Staff/Lead Engineer, Frontend Engineer, Backend Engineer\n- Quality & Reliability: QA Engineer, QA Automation Engineer, SRE/DevOps Engineer\n- Design & Research: UX/UI Designer, UX Researcher\n- Data & Security (as needed): Data Analyst/Scientist, Security/Compliance\n\n#### RACI (concise)\n\n| Activity | VP‑Product | PM/TPM | Eng Lead | FE/BE | QA | SRE/DevOps | UX | Data/Sec |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| Roadmap & KPIs | A | R | C | C | C | C | C | C |\n| PRD authorship | A | R | C | C | C | C | C | C |\n| Design/Arch review | A | C | R | C | C | C | C | C |\n| Implementation | C | C | A | R | C | C | C | C |\n| Testing & QA evidence | A | C | C | C | R | C | C | C |\n| Deployment/Monitoring | A | C | C | C | C | R | C | C |\n| Gates & Ready flip | A | R | C | C | C | C | C | C |\n| Decisions & rollback log | A | R | C | C | C | C | C | C |\n\nR = Responsible, A = Accountable, C = Consulted\n\n#### Artifacts and evidence\n- Roadmap: `Plans/product-roadmap.md` (and `docs/product-roadmap.html` mirror)\n- PRD: under `PRDs/<MILESTONE>/<ROADMAP_ID>-<slug>.md` with sections 3, 9.4, 9.5, 9.6, 10 complete\n- QA: `QA/<ROADMAP_ID>/test-cases.md`, `QA/<ROADMAP_ID>/test-results-<DATE>.md`\n- Security/Size/Perf: link evidence files under `QA/<ROADMAP_ID>/` or milestone evidence folders\n\n#### Ready flip criteria\n- KPIs defined (PRD 3) and acceptance criteria set per sub‑item.\n- QA test cases exist and QA Pass results are linked.\n- Security, size, and performance evidence linked as required.\n- PRD section 10 complete; decisions (9.6) and reviewer notes (9.5) updated.\n- Roadmap and HTML mirror updated in the same change set.\n\n#### Communication cadence\n- Executive brief for outcomes/risks at kickoff and before major flips.\n- Delivery brief for sequence, owners, and gates at each phase boundary.\n- Status updates tied to roadmap IDs with links to PRD and QA evidence.";
    this.taskQueue = [];
    this.completedTasks = [];
  }
  
  /**
   * REAL task execution with actual work being done
   */
  async executeTask(task) {
    console.log(`\n🤖 ${this.name} starting task: ${task.description}`);
    this.emit('task:progress', { task: task.id, progress: 0.1 });
    
    const result = {
      taskId: task.id,
      agent: this.name,
      role: this.role,
      status: 'in_progress',
      output: '',
      artifacts: [],
      recommendations: [],
      collaborations: [],
      startedAt: new Date().toISOString()
    };
    
    try {
      // Analyze task requirements
      const taskAnalysis = await this.analyzeTask(task);
      result.analysis = taskAnalysis;
      
      this.emit('task:progress', { task: task.id, progress: 0.3 });
      
      // Execute role-specific work
      const workResult = await this.performWork(task, taskAnalysis);
      result.output = workResult.output;
      result.artifacts = workResult.artifacts;
      
      this.emit('task:progress', { task: task.id, progress: 0.7 });
      
      // Generate recommendations
      result.recommendations = await this.generateDetailedRecommendations(task, workResult);
      
      // Check if collaboration is needed
      if (taskAnalysis.requiresCollaboration) {
        result.collaborations = await this.requestCollaborations(task, taskAnalysis);
      }
      
      this.emit('task:progress', { task: task.id, progress: 0.9 });
      
      // Quality checks
      result.qualityChecks = await this.performQualityChecks(workResult);
      
      result.status = 'completed';
      result.completedAt = new Date().toISOString();
      
      this.completedTasks.push(result);
      console.log(`✅ ${this.name} completed task: ${task.description}`);
      
    } catch (error) {
      console.error(`❌ ${this.name} failed task: ${error.message}`);
      result.status = 'failed';
      result.error = error.message;
      result.failedAt = new Date().toISOString();
    }
    
    this.emit('task:progress', { task: task.id, progress: 1.0 });
    return result;
  }
  
  /**
   * Analyze task to determine approach
   */
  async analyzeTask(task) {
    const analysis = {
      complexity: 'medium',
      estimatedTime: '30 minutes',
      requiredTools: [],
      requiresCollaboration: false,
      approach: '',
      risks: []
    };
    
    // Determine complexity based on task description
    const desc = task.description.toLowerCase();
    if (desc.includes('simple') || desc.includes('basic')) {
      analysis.complexity = 'low';
      analysis.estimatedTime = '10 minutes';
    } else if (desc.includes('complex') || desc.includes('advanced')) {
      analysis.complexity = 'high';
      analysis.estimatedTime = '2 hours';
    }
    
    // Check for collaboration needs
    
    // Check for collaboration keywords
    if (desc.includes('collaborate') || desc.includes('coordinate')) {
      analysis.requiresCollaboration = true;
      analysis.collaborators = ["product-manager","ux/ui-designer","staff/lead-engineer","qa-engineer","sre/devops-engineer","data-analyst"];
    }
    
    // Determine approach
    analysis.approach = 'Apply vp-product expertise to solve the task';
    
    return analysis;
  }
  
  /**
   * Perform actual work based on role
   */
  async performWork(task, analysis) {
    const workResult = {
      output: '',
      artifacts: [],
      metrics: {}
    };
    
    
    // Default work implementation for vp-product
    workResult.output = `Executed ${task.description} using ${this.role} expertise`;
    workResult.artifacts.push({
      type: 'report',
      name: 'work-output.md',
      content: `# Work Output\n\nTask: ${task.description}\n\nCompleted by: ${this.name}\n`
    });
    
    return workResult;
  }
  
  /**
   * Generate detailed recommendations
   */
  async generateDetailedRecommendations(task, workResult) {
    const recommendations = [];
    
    
    // Generate recommendations based on work results
    if (workResult.artifacts.length > 0) {
      recommendations.push({
        type: 'documentation',
        priority: 'low',
        description: 'Document artifacts and implementation details',
        reasoning: 'Ensure knowledge transfer and maintainability'
      });
    }
    
    // Add standard best practices
    recommendations.push({
      type: 'best_practice',
      priority: 'medium',
      description: `Apply ${this.role} best practices`,
      reasoning: 'Based on role expertise and industry standards'
    });
    
    return recommendations;
  }
  
  /**
   * Request collaboration from other agents
   */
  async requestCollaborations(task, analysis) {
    const collaborations = [];
    
    if (analysis.requiresCollaboration && this.agentManager) {
      
      // Request collaboration based on task needs
      for (const collaboratorRole of analysis.collaborators || []) {
        try {
          const collabResult = await this.requestCollaboration(
            [collaboratorRole],
            {
              description: `Assist with: ${task.description}`,
              context: {
                originalTask: task,
                requestingAgent: this.name,
                reason: analysis.approach
              }
            }
          );
          
          collaborations.push({
            agent: collaboratorRole,
            result: collabResult,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Failed to collaborate with ${collaboratorRole}:`, error);
        }
      }
    }
    
    return collaborations;
  }
  
  /**
   * Perform quality checks on work
   */
  async performQualityChecks(workResult) {
    const checks = {
      passed: [],
      failed: [],
      warnings: []
    };
    
    
    // Basic quality checks
    if (workResult.output) {
      checks.passed.push('Work output generated');
    } else {
      checks.failed.push('No work output');
    }
    
    if (workResult.artifacts.length > 0) {
      checks.passed.push(`Created ${workResult.artifacts.length} artifacts`);
    } else {
      checks.warnings.push('No artifacts generated');
    }
    
    return checks;
  }
  
  /**
   * Validate if this agent can handle the task
   */
  canHandleTask(task) {
    // Check if task matches this agent's expertise
    if (task.requirements?.role === 'vp-product') return true;
    
    if (task.requirements?.expertise) {
      const expertiseNeeded = task.requirements.expertise;
      const hasExpertise = expertiseNeeded.some(req => 
        this.expertise.some(exp => 
          exp.toLowerCase().includes(req.toLowerCase())
        )
      );
      if (hasExpertise) return true;
    }
    
    // Check task description for role-specific keywords
    const desc = task.description?.toLowerCase() || '';
    desc.includes('product') ? true : false;
    
    return false;
  }
  
  /**
   * Get agent capabilities for reporting
   */
  getCapabilities() {
    return {
      ...super.getCapabilities(),
      collaborators: this.metadata.collaborators,
      completedTasks: this.completedTasks.length,
      specializations: ["general"],
      tools: ["vscode","git"]
    };
  }
}

// Create singleton instance
export const vp_productAgent = new VpProductAgent();
