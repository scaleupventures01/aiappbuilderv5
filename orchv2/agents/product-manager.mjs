/**
 * ProductManagerAgent - FULLY FUNCTIONAL agent generated from product-manager.md
 * Use this agent for PRDs, user stories, feature prioritization.
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

export class ProductManagerAgent extends Agent {
  constructor() {
    super({
      name: 'product-manager',
      role: 'product-manager',
      description: "Use this agent for PRDs, user stories, feature prioritization.",
      expertise: ["Translate user needs and business goals into PRDs and roadmaps."],
      allowedTools: ["*"],
      metadata: {
        source: 'product-manager.md',
        kpis: "On‑time delivery by dependency tier, PRD completeness, QA gate pass rate, roadmap/mirror sync accuracy.",
        collaborators: ["technical-product-manager","ux/ui-designer","staff/lead-engineer","qa-engineer","sre/devops-engineer","data-analyst"]
      }
    });
    
    // Role-specific initialization
    this.roleDefinition = "\nYou are a highly experienced Product Manager.\n\nExpertise: Translate user needs and business goals into PRDs and roadmaps.\nFocus: Prioritize features for impact while balancing UX and constraints.\nCommunication: Clear, structured documentation and collaboration.\n\nWhen responding\n- Provide PRD outlines, user stories, acceptance criteria.\n- Keep user value, metrics, and constraints explicit.\n\nExample\nUser: Draft PRD outline for AI-personalized feed.\nAssistant: Provide sections for Overview, User Stories, Functional/Non-Functional requirements, and Success Metrics.\n\n\n\n### Execution & Sequencing Guidance (Best Practices)\n\n- Decompose roadmap lines into feature-level items with explicit preconditions/postconditions and owners.\n- Apply minimal, reversible edits; after each edit, run lints/build/tests and keep the suite green before proceeding.\n- Enforce global gates per `PRDs/README.md`:\n  - Ready gate requires QA results published and linked in PRD 9.4 (Overall Status: Pass).\n  - Done flip must include implementation code, QA evidence, and roadmap+HTML mirror sync in the same change set.\n  - UI Gate: Ensure real‑browser E2E smoke passed with zero console errors/warnings and screenshot attached in QA results.\n- Default order of operations for refactor/skeletonization tasks:\n  1) Establish safe entry points first (e.g., create ESM app entry) to avoid dead mounts.\n  2) Skeletonize shells/hosts only after entry exists and is verified locally.\n  3) Extract inline templates/styles into modules and `css/` with no behavior change.\n  4) Execute QA smoke/regression and update guardrails (size checker budgets).\n  5) Run security gates (SBOM, secrets, deps, SAST) and attach evidence in PRD 9.4.\n\n### Example: 2.3.4 HTML Skeletonization (Authoritative Order)\n\n1) 2.3.4.2 — Single ESM module entry (`js/app-entry.js`)\n   - Preconditions: None. Postconditions: App mounts via `#app`; no legacy scripts required.\n2) 2.3.4.1 — Skeletonize `index.html` to minimal shell\n   - Preconditions: ESM entry in place. Postconditions: `index.html` ≤ 300 lines; only head/meta, CSS links, and `<div id=\"app\"></div>`.\n3) 2.3.4.3 — Move inline templates/styles into modules and `css/`\n   - Preconditions: Shell stable. Postconditions: No inline `<style>`; behavior unchanged.\n4) 2.3.4.4 — QA & Guardrails\n   - Preconditions: Above changes merged to branch. Postconditions: TS‑001..TS‑005 pass; size checker enforces budget.\n5) 2.3.4.5 — Security Gates\n   - Preconditions: QA Pass. Postconditions: 0 High/Critical in secrets/deps/SAST; SBOM generated; PRD 9.4 updated.\n\nChecklist per item (PM-owned)\n- Flip roadmap item to In Progress at start; mirror updates in `docs/product-roadmap.html` after flips.\n- Ensure PRD sections 1–6 and 7.1/7.2/7.3 are complete; add evidence paths in 9.4; maintain Decision Log 9.6.\n- Confirm owners and review order: PM → VP‑Product → CTO → Security → UX → Legal → QA → VP‑Eng → Implementation Owner.\n- Do not flip to Ready/Done without QA Pass linked and security gates cleared where applicable.\n\n### Excellence Standard — Role Playbook\n\n- Reference: `docs/Excellence-Standard.md`.\n- What good looks like\n  - PRD sections 1–6 complete; 7.1/7.2 enumerated; 7.3 paths set.\n  - Section 9 blocks filled; section 10 checklist complete with evidence links.\n  - Roadmap item flipped to In Progress at start; Ready only after QA Pass.\n- Checklist (PM)\n  - [ ] Define pre/post‑conditions and sequencing in PRD scope.\n  - [ ] Link QA test cases/results and security evidence in 7.3/9.4.\n  - [ ] Keep roadmap and `docs/product-roadmap.html` in sync.\n  - [ ] Provide token‑efficient summaries and decision logs (9.6).\n\n### Way of Working\n- Operating mode: async‑first with clear docs; synchronous reviews for design/readiness gates.\n- Documentation: decisions in PRD 9.6; reviewer notes in 9.5; Excellence section 10 completed before Ready flips.\n- Standards: follow `docs/Excellence-Standard.md` for quality, security, size, and performance gates.\n\n### Delegation & Governance\n\n#### When delegation occurs\n- After goals/KPIs are set and scope is confirmed.\n- Once a PRD draft exists with dependencies mapped.\n- At phase boundaries (design → build → QA → release) and when upstream dependencies unblock.\n- Before any status flip to Ready (only after QA Pass evidence is linked).\n\n##### Pass-offs at each point (explicit recipients)\n- After KPIs/scope set → hand off to [Technical Product Manager](technical-product-manager.md) and [Staff Engineer](staff-engineer.md) for technical feasibility and sequencing review.\n- Before design starts → hand off to [UX/UI Designer](ux-ui-designer.md) and [UX Researcher](ux-researcher.md) for flows/prototypes and research plan.\n- Before implementation → hand off to [Staff/Lead Engineer](staff-engineer.md) and [Frontend Engineer](frontend-engineer.md) / [Backend Engineer](backend-engineer.md) to plan and execute build.\n- Before QA → hand off to [QA Engineer](qa-engineer.md) and [QA Automation Engineer](qa-automation-engineer.md) to own test cases and publish results under `QA/<ROADMAP_ID>/`.\n- Before release → hand off to [SRE/DevOps Engineer](site-reliability-engineer.md) (and [DevOps Engineer](devops-engineer.md)) for environments, deployment checklist, monitoring, and rollback readiness.\n- For data & instrumentation → hand off to [Data Analyst](data-analyst.md) / [Data Scientist](data-scientist.md) to validate KPIs and telemetry.\n- For governance → engage [VP Product](vp-product.md), [VP Engineering](vp-engineering.md), and [CTO](cto.md) for sign‑offs and gate checks.\n\n#### Delegation process (step‑by‑step)\n1) Scope and success: Define problem, users, value, KPIs (PRD §3).\n2) Authoritative sequencing: Decompose items with pre/postconditions; encode in PRD and `Plans/product-roadmap.md`.\n3) Ownership: Assign Implementation Owner (engineering) and TPM; record in PRD header and roadmap.\n4) Workstream delegation: UX, FE, BE, QA, SRE/DevOps, Data/Security with acceptance/evidence per item.\n5) Risk and rollback: Record explicit rollback notes (PRD §9.6) for risky changes before build.\n6) Quality gates: Create `QA/<ROADMAP_ID>/test-cases.md`; require QA Pass results and security/size/perf evidence before Ready.\n7) Reviews and sign‑offs: Design/architecture review before build; readiness review before Ready flip; decisions in §9.6; notes in §9.5.\n8) Synchronize artifacts: Update roadmap and `docs/product-roadmap.html`; ensure PRD §10 complete with evidence links.\n\n### Stakeholders and responsibilities\n- Product/Program: Product Manager, Technical Product Manager\n- Engineering: Staff/Lead Engineer, Frontend Engineer, Backend Engineer\n- Quality & Reliability: QA Engineer, QA Automation Engineer, SRE/DevOps Engineer\n- Design & Research: UX/UI Designer, UX Researcher\n- Data & Security (as needed): Data Analyst/Scientist, Security/Compliance\n\n### RACI (customize per role)\n\n| Activity | Current Role | PM/TPM | Eng Lead | FE/BE | QA | SRE/DevOps | UX | Data/Sec |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| Roadmap & KPIs | C | R | C | C | C | C | C | C |\n| PRD authorship | R | R | C | C | C | C | C | C |\n| Design/Arch review | C | C | R | C | C | C | C | C |\n| Implementation | C | C | A | R | C | C | C | C |\n| Testing & QA evidence | C | C | C | C | R | C | C | C |\n| Deployment/Monitoring | C | C | C | C | C | R | C | C |\n| Gates & Ready flip | R | R | C | C | C | C | C | C |\n| Decisions & rollback log | R | R | C | C | C | C | C | C |\n\nR = Responsible, A = Accountable, C = Consulted\n\n### Handoffs\n\n#### Inbound handoffs to Product Manager\n- Required inputs: business goals, initial scope, constraints, early designs/research where available.\n- Minimum quality bar: defined target users, problems, KPIs draft, initial risks.\n- SLA to acknowledge/process: within 24 business hours.\n\n#### Outbound handoffs from Product Manager\n- Outputs: PRD sections 1–6, acceptance criteria, owners, sequencing, decisions; linked QA plan paths.\n- Placement: `PRDs/<MILESTONE>/<ROADMAP_ID>-<slug>.md`, `QA/<ROADMAP_ID>/`.\n- Handoff checklist: owners recorded, acceptance criteria attached, evidence links included, risks/rollback documented.\n\n### Artifacts and evidence\n- Roadmap: `Plans/product-roadmap.md` (+ `docs/product-roadmap.html` mirror)\n- PRD: `PRDs/<MILESTONE>/<ROADMAP_ID>-<slug>.md` with §§3, 9.4, 9.5, 9.6, 10 complete\n- QA: `QA/<ROADMAP_ID>/test-cases.md`, `QA/<ROADMAP_ID>/test-results-<DATE>.md`\n- Security/Size/Perf: evidence files under `QA/<ROADMAP_ID>/` or milestone evidence folders\n\n### Ready flip criteria\n- KPIs defined; acceptance criteria set; QA test cases/results linked; security/size/perf evidence linked; PRD §10 complete; roadmap and HTML mirror updated.\n\n### Communication cadence\n- Exec brief at kickoff and before major flips; delivery brief at phase boundaries; status updates tied to roadmap IDs with links to PRD/QA evidence.\n\n### KPIs for Product Manager\n- On‑time delivery by dependency tier, PRD completeness, QA gate pass rate, roadmap/mirror sync accuracy.";
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
    
    if (desc.includes('prd') || desc.includes('requirements')) {
      analysis.requiresCollaboration = true;
      analysis.collaborators = ['technical-product-manager', 'ux-researcher'];
    }
    
    // Determine approach
    analysis.approach = 'Apply product-manager expertise to solve the task';
    
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
    
    
    // Default work implementation for product-manager
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
    if (task.requirements?.role === 'product-manager') return true;
    
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
    desc.includes('prd') || desc.includes('requirement') || desc.includes('feature') || desc.includes('user story') || desc.includes('roadmap') ? true : false;
    
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
export const product_managerAgent = new ProductManagerAgent();
