/**
 * Agent Registry - Auto-generated from team roles
 * Each agent is a specialized instance configured from team/*.md files
 */

import { Agent } from '../lib/orch/agent-system.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export specialized agent classes
export { AIEngineerAgent } from './ai-engineer.mjs';
export { AIProductManagerAgent } from './ai-product-manager.mjs';
export { AISafetyEngineerAgent } from './ai-safety-engineer.mjs';
export { ApplicationSecurityEngineerAgent } from './application-security-engineer.mjs';
export { BackendEngineerAgent } from './backend-engineer.mjs';
export { BusinessAnalystAgent } from './business-analyst.mjs';
export { ChiefAIOfficerAgent } from './chief-ai-officer.mjs';
export { CISOAgent } from './ciso.mjs';
export { CTOAgent } from './cto.mjs';
export { DataAnalystAgent } from './data-analyst.mjs';
export { DataEngineerAgent } from './data-engineer.mjs';
export { DataScientistAgent } from './data-scientist.mjs';
export { DevOpsEngineerAgent } from './devops-engineer.mjs';
export { DevSecOpsEngineerAgent } from './devsecops-engineer.mjs';
export { FrontendEngineerAgent } from './frontend-engineer.mjs';
export { FullStackEngineerAgent } from './full-stack-engineer.mjs';
export { ImplementationOwnerAgent } from './implementation-owner.mjs';
export { MachineLearningEngineerAgent } from './machine-learning-engineer.mjs';
export { MLResearchScientistAgent } from './ml-research-scientist.mjs';
export { MLOpsEngineerAgent } from './mlops-engineer.mjs';
export { PrivacyEngineerAgent } from './privacy-engineer.mjs';
export { ProductManagerAgent } from './product-manager.mjs';
export { ProjectManagerAgent } from './project-manager.mjs';
export { QAAutomationEngineerAgent } from './qa-automation-engineer.mjs';
export { QAEngineerAgent } from './qa-engineer.mjs';
export { SecurityArchitectAgent } from './security-architect.mjs';
export { SiteReliabilityEngineerAgent } from './site-reliability-engineer.mjs';
export { StaffEngineerAgent } from './staff-engineer.mjs';
export { TechnicalProductManagerAgent } from './technical-product-manager.mjs';
export { UXResearcherAgent } from './ux-researcher.mjs';
export { UXUIDesignerAgent } from './ux-ui-designer.mjs';
export { VPEngineeringAgent } from './vp-engineering.mjs';
export { VPProductAgent } from './vp-product.mjs';

/**
 * Create all agents from team definitions
 */
export async function createAllAgents() {
  const agents = [];
  
  // Import all agent classes dynamically
  const agentModules = [
    './ai-engineer.mjs',
    './ai-product-manager.mjs',
    './ai-safety-engineer.mjs',
    './application-security-engineer.mjs',
    './backend-engineer.mjs',
    './business-analyst.mjs',
    './chief-ai-officer.mjs',
    './ciso.mjs',
    './cto.mjs',
    './data-analyst.mjs',
    './data-engineer.mjs',
    './data-scientist.mjs',
    './devops-engineer.mjs',
    './devsecops-engineer.mjs',
    './frontend-engineer.mjs',
    './full-stack-engineer.mjs',
    './implementation-owner.mjs',
    './machine-learning-engineer.mjs',
    './ml-research-scientist.mjs',
    './mlops-engineer.mjs',
    './privacy-engineer.mjs',
    './product-manager.mjs',
    './project-manager.mjs',
    './qa-automation-engineer.mjs',
    './qa-engineer.mjs',
    './security-architect.mjs',
    './site-reliability-engineer.mjs',
    './staff-engineer.mjs',
    './technical-product-manager.mjs',
    './ux-researcher.mjs',
    './ux-ui-designer.mjs',
    './vp-engineering.mjs',
    './vp-product.mjs'
  ];
  
  for (const modulePath of agentModules) {
    try {
      const module = await import(modulePath);
      const AgentClass = Object.values(module)[0]; // Get the first export
      const agent = new AgentClass();
      agents.push(agent);
    } catch (error) {
      console.error(`Failed to load agent from ${modulePath}:`, error.message);
    }
  }
  
  return agents;
}

/**
 * Get agent by role name
 */
export async function getAgentByRole(role) {
  const normalizedRole = role.toLowerCase().replace(/[\s-]/g, '');
  
  const roleMap = {
    'aiengineer': () => import('./ai-engineer.mjs').then(m => new m.AIEngineerAgent()),
    'aiproductmanager': () => import('./ai-product-manager.mjs').then(m => new m.AIProductManagerAgent()),
    'aisafetyengineer': () => import('./ai-safety-engineer.mjs').then(m => new m.AISafetyEngineerAgent()),
    'applicationsecurityengineer': () => import('./application-security-engineer.mjs').then(m => new m.ApplicationSecurityEngineerAgent()),
    'backendengineer': () => import('./backend-engineer.mjs').then(m => new m.BackendEngineerAgent()),
    'businessanalyst': () => import('./business-analyst.mjs').then(m => new m.BusinessAnalystAgent()),
    'chiefaiofficer': () => import('./chief-ai-officer.mjs').then(m => new m.ChiefAIOfficerAgent()),
    'ciso': () => import('./ciso.mjs').then(m => new m.CISOAgent()),
    'cto': () => import('./cto.mjs').then(m => new m.CTOAgent()),
    'dataanalyst': () => import('./data-analyst.mjs').then(m => new m.DataAnalystAgent()),
    'dataengineer': () => import('./data-engineer.mjs').then(m => new m.DataEngineerAgent()),
    'datascientist': () => import('./data-scientist.mjs').then(m => new m.DataScientistAgent()),
    'devopsengineer': () => import('./devops-engineer.mjs').then(m => new m.DevOpsEngineerAgent()),
    'devsecops': () => import('./devsecops-engineer.mjs').then(m => new m.DevSecOpsEngineerAgent()),
    'frontendengineer': () => import('./frontend-engineer.mjs').then(m => new m.FrontendEngineerAgent()),
    'fullstackengineer': () => import('./full-stack-engineer.mjs').then(m => new m.FullStackEngineerAgent()),
    'implementationowner': () => import('./implementation-owner.mjs').then(m => new m.ImplementationOwnerAgent()),
    'machinelearningengineer': () => import('./machine-learning-engineer.mjs').then(m => new m.MachineLearningEngineerAgent()),
    'mlresearchscientist': () => import('./ml-research-scientist.mjs').then(m => new m.MLResearchScientistAgent()),
    'mlopsengineer': () => import('./mlops-engineer.mjs').then(m => new m.MLOpsEngineerAgent()),
    'privacyengineer': () => import('./privacy-engineer.mjs').then(m => new m.PrivacyEngineerAgent()),
    'productmanager': () => import('./product-manager.mjs').then(m => new m.ProductManagerAgent()),
    'projectmanager': () => import('./project-manager.mjs').then(m => new m.ProjectManagerAgent()),
    'qaautomationengineer': () => import('./qa-automation-engineer.mjs').then(m => new m.QAAutomationEngineerAgent()),
    'qaengineer': () => import('./qa-engineer.mjs').then(m => new m.QAEngineerAgent()),
    'securityarchitect': () => import('./security-architect.mjs').then(m => new m.SecurityArchitectAgent()),
    'sitereliabilityengineer': () => import('./site-reliability-engineer.mjs').then(m => new m.SiteReliabilityEngineerAgent()),
    'staffengineer': () => import('./staff-engineer.mjs').then(m => new m.StaffEngineerAgent()),
    'technicalproductmanager': () => import('./technical-product-manager.mjs').then(m => new m.TechnicalProductManagerAgent()),
    'uxresearcher': () => import('./ux-researcher.mjs').then(m => new m.UXResearcherAgent()),
    'uxuidesigner': () => import('./ux-ui-designer.mjs').then(m => new m.UXUIDesignerAgent()),
    'vpengineering': () => import('./vp-engineering.mjs').then(m => new m.VPEngineeringAgent()),
    'vpproduct': () => import('./vp-product.mjs').then(m => new m.VPProductAgent())
  };
  
  const factory = roleMap[normalizedRole];
  if (factory) {
    return await factory();
  }
  
  throw new Error(`Unknown role: ${role}`);
}