#!/usr/bin/env node
/**
 * Feature Scaffolding with Automatic Agent Assignment
 * Creates PRDs and assigns agents from the 33-agent pool based on feature type
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '../../app');
const orchRoot = path.resolve(__dirname, '..');

// Import agent assignment logic
async function getAgentAssignments(featureId) {
  // Agent assignment based on feature ID pattern
  const [version, major, minor, feature, task, subtask] = featureId.split('.').map(Number);
  const agents = [];
  
  // Always include Product Manager
  agents.push('product-manager');
  
  // Version-based assignments (1st digit)
  switch(version) {
    case 1: // UI/Frontend features
      agents.push('frontend-engineer', 'ux-ui-designer', 'ux-researcher');
      break;
    case 2: // Backend features
      agents.push('backend-engineer', 'technical-product-manager');
      break;
    case 3: // Data features
      agents.push('data-engineer', 'data-analyst', 'data-scientist');
      break;
    case 4: // AI/ML features
      agents.push('ai-engineer', 'machine-learning-engineer', 'chief-ai-officer', 'mlops-engineer');
      break;
    case 5: // Infrastructure
      agents.push('devops-engineer', 'site-reliability-engineer');
      break;
    case 6: // Security features
      agents.push('ciso', 'security-architect', 'application-security-engineer');
      break;
    case 7: // Privacy features
      agents.push('privacy-engineer', 'security-architect');
      break;
    case 8: // Enterprise features
      agents.push('business-analyst', 'project-manager');
      break;
    default: // General features
      agents.push('full-stack-engineer');
  }
  
  // Complexity-based additions (2nd digit)
  if (major >= 5) {
    agents.push('staff-engineer', 'technical-product-manager');
  }
  if (major >= 8) {
    agents.push('vp-engineering', 'cto');
  }
  
  // Feature scope additions (3rd digit)
  if (minor >= 3) {
    agents.push('full-stack-engineer');
  }
  if (minor >= 5) {
    agents.push('ai-product-manager');
  }
  
  // Always add QA
  agents.push('qa-engineer');
  
  // Add QA automation for complex features
  if (task >= 5 || major >= 7) {
    agents.push('qa-automation-engineer');
  }
  
  // Add leadership for critical features
  if (version >= 7 || major >= 8) {
    agents.push('vp-product');
  }
  
  // Add security review for certain features
  if (version === 6 || major === 9 || (version === 1 && minor >= 7)) {
    agents.push('devsecops-engineer', 'ai-safety-engineer');
  }
  
  // Remove duplicates
  return [...new Set(agents)];
}

// Load agent details
function getAgentDetails(agentName) {
  const agentPath = path.join(orchRoot, 'agents', `${agentName}.mjs`);
  if (fs.existsSync(agentPath)) {
    // Extract role title from agent file
    const content = fs.readFileSync(agentPath, 'utf8');
    const roleMatch = content.match(/role:\s*['"]([^'"]+)['"]/);
    const expertiseMatch = content.match(/expertise:\s*\[([^\]]+)\]/);
    
    return {
      name: agentName,
      role: roleMatch ? roleMatch[1] : agentName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      expertise: expertiseMatch ? expertiseMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')) : []
    };
  }
  
  // Fallback for agents without modules yet
  return {
    name: agentName,
    role: agentName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    expertise: []
  };
}

export async function scaffoldFeature(id, title, primaryOwner = null, additionalAgents = []) {
  console.log('\n🚀 Scaffolding Feature with Agent Assignment\n');
  
  // Validate ID format
  const idPattern = /^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/;
  if (!idPattern.test(id)) {
    throw new Error(`Invalid feature ID format: ${id}. Expected: X.X.X.X.X.X`);
  }
  
  // Get automatic agent assignments
  const autoAgents = await getAgentAssignments(id);
  const allAgents = [...new Set([...autoAgents, ...additionalAgents])];
  
  // Determine primary owner
  const owner = primaryOwner || (allAgents.includes('backend-engineer') ? 'Backend Engineer' : 
                                  allAgents.includes('frontend-engineer') ? 'Frontend Engineer' :
                                  allAgents.includes('ai-engineer') ? 'AI Engineer' : 
                                  'Full-Stack Engineer');
  
  console.log(`📋 Feature: ${title}`);
  console.log(`🆔 ID: ${id}`);
  console.log(`👤 Primary Owner: ${owner}`);
  console.log(`🤖 Assigned Agents (${allAgents.length}):`)
  ;
  
  // Display agent details
  allAgents.forEach(agent => {
    const details = getAgentDetails(agent);
    console.log(`   - ${details.role}`);
  });
  
  // Read PRD template
  const templatePath = path.join(appRoot, 'PRDs/_templates/PRD-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ PRD template not found. Creating default template...');
    createDefaultPRDTemplate(templatePath);
  }
  
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // Prepare agent roles string
  const agentRoles = allAgents.map(a => getAgentDetails(a).role).join(', ');
  
  // Replace placeholders
  const today = new Date().toISOString().slice(0, 10);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const version = `V${id.split('.')[0]}`;
  
  const prd = template
    .replace(/X\.X\.X\.X\.X\.X/g, id)
    .replace(/\[Single Feature Name\]/g, title)
    .replace(/\[Implementation Owner Role\]/g, owner)
    .replace(/\[List of roles working on this feature\]/g, agentRoles)
    .replace(/YYYY-MM-DD/g, today)
    .replace(/\[slug\]/g, slug);
  
  // Write PRD
  const prdDir = path.join(appRoot, 'PRDs', version);
  const prdPath = path.join(prdDir, `${id}-${slug}-prd.md`);
  
  fs.mkdirSync(prdDir, { recursive: true });
  fs.writeFileSync(prdPath, prd);
  
  console.log(`\n✅ Created PRD: ${prdPath}`);
  
  // Update roadmap
  await updateRoadmap(id, title, owner, prdPath);
  
  // Create QA directory structure
  const qaDir = path.join(appRoot, 'QA', `${id}-${slug}`);
  fs.mkdirSync(path.join(qaDir, 'evidence'), { recursive: true });
  
  // Create initial test cases file
  const testCasesPath = path.join(qaDir, 'test-cases.md');
  const testCasesContent = `# Test Cases for ${title}

## Feature ID: ${id}

### Assigned QA Agents
${allAgents.filter(a => a.includes('qa')).map(a => `- ${getAgentDetails(a).role}`).join('\n')}

### Test Categories

#### Unit Tests
- [ ] Component isolation tests
- [ ] Service logic tests
- [ ] Utility function tests

#### Integration Tests
- [ ] API endpoint tests
- [ ] Database interaction tests
- [ ] External service integration tests

#### E2E Tests
- [ ] User workflow tests
- [ ] Cross-browser compatibility
- [ ] Performance benchmarks

### Test Scenarios

1. **Happy Path**
   - Description: [To be defined by QA agents]
   - Expected: Success
   - Priority: High

2. **Edge Cases**
   - Description: [To be defined by QA agents]
   - Expected: Graceful handling
   - Priority: Medium

3. **Error Handling**
   - Description: [To be defined by QA agents]
   - Expected: Appropriate error messages
   - Priority: High

---
*Generated by ORCH System with ${allAgents.length} agents assigned*
`;
  
  fs.writeFileSync(testCasesPath, testCasesContent);
  console.log(`✅ Created QA structure: ${qaDir}`);
  
  // Create agent assignment file
  const assignmentPath = path.join(qaDir, 'agent-assignments.json');
  const assignmentData = {
    featureId: id,
    title: title,
    owner: owner,
    createdAt: today,
    agents: allAgents.map(a => {
      const details = getAgentDetails(a);
      return {
        id: a,
        role: details.role,
        expertise: details.expertise,
        status: 'assigned',
        assignedAt: new Date().toISOString()
      };
    })
  };
  
  fs.writeFileSync(assignmentPath, JSON.stringify(assignmentData, null, 2));
  console.log(`✅ Saved agent assignments: ${assignmentPath}`);
  
  console.log(`\n🎉 Feature scaffolding complete!`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review the PRD at: ${prdPath}`);
  console.log(`   2. Start development: npm run orch:start -- --id ${id}`);
  console.log(`   3. View agent status: ./orch "agent status"`);
  console.log(`   4. Get team review: ./orch "team review ${id}"`);
  
  return {
    prdPath,
    qaDir,
    agents: allAgents,
    owner
  };
}

// Update roadmap with new feature
async function updateRoadmap(id, title, owner, prdPath) {
  const roadmapPath = path.join(appRoot, 'Plans/product-roadmap.md');
  
  if (!fs.existsSync(roadmapPath)) {
    console.log('📝 Creating new roadmap...');
    createDefaultRoadmap(roadmapPath);
  }
  
  const roadmap = fs.readFileSync(roadmapPath, 'utf8');
  
  // Check if feature already exists
  if (roadmap.includes(`| ${id} |`)) {
    console.log('ℹ️  Feature already exists in roadmap');
    return;
  }
  
  // Determine version phase
  const version = id.split('.')[0];
  const phase = `V${version} — ${version === '1' ? 'Foundation' : version === '2' ? 'Enhancement' : 'Advanced'}`;
  
  // Create new row
  const relativePrdPath = path.relative(appRoot, prdPath).replace(/\\/g, '/');
  const qaPath = `QA/${id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`;
  const newRow = `| ${phase} | ${id} | ${title} | Draft | ${owner} | \`${relativePrdPath}\` | \`${qaPath}\` |`;
  
  // Find the table and add the row
  const lines = roadmap.split('\n');
  let tableIndex = lines.findIndex(line => line.includes('| Phase | ID | Item'));
  
  if (tableIndex === -1) {
    console.error('❌ Could not find roadmap table');
    return;
  }
  
  // Find the end of the table
  let insertIndex = tableIndex + 2; // Skip header and separator
  while (insertIndex < lines.length && lines[insertIndex].startsWith('|')) {
    insertIndex++;
  }
  
  // Insert the new row
  lines.splice(insertIndex, 0, newRow);
  
  // Write back
  fs.writeFileSync(roadmapPath, lines.join('\n'));
  console.log('✅ Updated roadmap with new feature');
}

// Create default PRD template if missing
function createDefaultPRDTemplate(templatePath) {
  const defaultTemplate = `---
id: X.X.X.X.X.X
title: [Single Feature Name]
status: Draft
owner: [Implementation Owner Role]
assigned_roles: [List of roles working on this feature]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# [Single Feature Name] PRD

## Table of Contents
1. [Overview](#overview)
2. [User Stories](#user-stories)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [Architecture & Design](#architecture--design)
6. [Implementation Notes](#implementation-notes)
7. [Testing & Acceptance](#testing--acceptance)
8. [Agent Assignments](#agent-assignments)

## Overview

### Problem Statement
[Describe the problem this feature solves]

### Solution Summary
[Brief description of the proposed solution]

### Success Metrics
- [ ] Metric 1
- [ ] Metric 2
- [ ] Metric 3

## User Stories

### Story 1: [Title]
**As a** [user type]
**I want to** [action]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

## Functional Requirements

### FR-1: [Requirement Name]
- **Description**: [Detailed description]
- **Priority**: High/Medium/Low
- **Assigned Agent**: [Agent role]

## Non-Functional Requirements

### NFR-1: Performance
- Response time < 200ms
- Support 1000 concurrent users

### NFR-2: Security
- Authentication required
- Data encryption at rest and in transit

## Architecture & Design

### System Components
1. Component 1
2. Component 2

### Data Model
\`\`\`json
{
  "example": "schema"
}
\`\`\`

## Implementation Notes

### Phase 1: Foundation
- [ ] Task 1
- [ ] Task 2

### Phase 2: Enhancement
- [ ] Task 3
- [ ] Task 4

## Testing & Acceptance

### Test Scenarios
1. Scenario 1
2. Scenario 2

### Definition of Done
- [ ] Code complete and reviewed
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Security review completed

## Agent Assignments

### Primary Owner
- **Role**: [Implementation Owner Role]
- **Responsibilities**: Overall feature delivery

### Assigned Agents
[List of roles working on this feature]

---
*Generated by ORCH System*
`;
  
  fs.mkdirSync(path.dirname(templatePath), { recursive: true });
  fs.writeFileSync(templatePath, defaultTemplate);
}

// Create default roadmap if missing
function createDefaultRoadmap(roadmapPath) {
  const defaultRoadmap = `---
title: Product Roadmap
version: v1.0
last-updated: ${new Date().toISOString().slice(0, 10)}
owner: VP-Product / CTO / VP-Engineering
---

# Product Roadmap

## Executive Summary

This roadmap outlines the development phases and features for the system.

## Phases and Milestones

| Phase | ID | Item (Single Feature) | Status | Owner | PRD/Plan | Files/QA |
|-------|-----|----------------------|--------|-------|----------|----------|
| V1 — Foundation | 1.1.1.1.0.0 | User Authentication | Draft | Backend Engineer | \`PRDs/V1/1.1.1.1.0.0-user-authentication-prd.md\` | \`QA/1.1.1.1.0.0-user-authentication/\` |

## Legend

### Status Values
- **Draft**: Initial planning
- **Planned**: Ready for development
- **In Progress**: Active development
- **Ready**: Development complete, testing in progress
- **Complete**: Deployed to production

### ID Format
- X.X.X.X.X.X = Version.Major.Minor.Feature.Task.Subtask

---
*Maintained by ORCH System with 33 Agents*
`;
  
  fs.mkdirSync(path.dirname(roadmapPath), { recursive: true });
  fs.writeFileSync(roadmapPath, defaultRoadmap);
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: scaffold-feature.mjs <id> <title> [owner] [agent1,agent2,...]');
    console.log('Example: scaffold-feature.mjs 1.1.2.1.0.0 "User Profile" "Frontend Engineer" "ux-ui-designer,data-analyst"');
    console.log('\nNote: Agents are automatically assigned based on feature ID.');
    console.log('  1.x.x.x = UI features (Frontend, UX Designer, UX Researcher)');
    console.log('  2.x.x.x = Backend features (Backend Engineer, Technical PM)');
    console.log('  3.x.x.x = Data features (Data Engineer, Data Analyst, Data Scientist)');
    console.log('  4.x.x.x = AI/ML features (AI Engineer, ML Engineer, Chief AI Officer)');
    console.log('  5.x.x.x = Infrastructure (DevOps, Site Reliability Engineer)');
    console.log('  6.x.x.x = Security features (CISO, Security Architect)');
    console.log('\nView all 33 agents: ./orch "view agents"');
    process.exit(1);
  }
  
  const [id, title, owner, agentsStr] = args;
  const additionalAgents = agentsStr ? agentsStr.split(',').map(a => a.trim()) : [];
  
  scaffoldFeature(id, title, owner, additionalAgents)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}