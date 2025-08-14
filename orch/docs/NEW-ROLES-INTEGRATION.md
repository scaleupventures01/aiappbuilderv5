# New Roles Integration Guide

## Overview
This document describes the new roles that have been integrated into the orchestration system to enhance security, privacy, and project management capabilities.

## New Roles Added

### Security & Privacy Roles

#### 1. Chief Information Security Officer (CISO)
- **File**: `team/ciso.md`
- **Agent**: `agents/ciso.mjs`
- **Responsibilities**:
  - Security governance and risk assessment
  - Compliance alignment and policy development
  - Security gate approvals
  - Risk acceptance decisions (documented in PRD §9.6)

#### 2. Security Architect
- **File**: `team/security-architect.md`
- **Agent**: `agents/security-architect.mjs`
- **Responsibilities**:
  - Threat modeling and trust boundary analysis
  - Security control design
  - Architecture security reviews
  - Security requirements in PRD §6

#### 3. Application Security Engineer
- **File**: `team/application-security-engineer.md`
- **Agent**: `agents/application-security-engineer.mjs`
- **Responsibilities**:
  - SAST/DAST scanning and review
  - Secure code guidance
  - Vulnerability triage and remediation
  - Confirming no High/Critical vulnerabilities

#### 4. DevSecOps Engineer
- **File**: `team/devsecops-engineer.md`
- **Agent**: `agents/devsecops-engineer.mjs`
- **Responsibilities**:
  - CI/CD security gate implementation
  - Secrets and dependency scanning
  - SBOM generation
  - Security automation and monitoring

#### 5. Privacy Engineer / Data Protection Officer (DPO)
- **File**: `team/privacy-engineer.md`
- **Agent**: `agents/privacy-engineer.mjs`
- **Responsibilities**:
  - Data classification and PII handling
  - Privacy-by-design implementation
  - GDPR/CCPA compliance
  - Data retention policies (PRD §6)

#### 6. AI Safety Engineer
- **File**: `team/ai-safety-engineer.md`
- **Agent**: `agents/ai-safety-engineer.mjs`
- **Responsibilities**:
  - LLM/AI abuse testing and red teaming
  - Jailbreak prevention
  - Safety mitigation strategies
  - AI-specific security testing

### Management & Operations Roles

#### 7. Implementation Owner
- **File**: `team/implementation-owner.md`
- **Agent**: `agents/implementation-owner.mjs`
- **Responsibilities**:
  - End-to-end feature delivery ownership
  - Technical coordination across teams
  - Risk assessment and rollback planning
  - Delivery confirmation with evidence

#### 8. Business Analyst
- **File**: `team/business-analyst.md`
- **Agent**: `agents/business-analyst.mjs`
- **Responsibilities**:
  - Requirements gathering and analysis
  - Process analysis and optimization
  - Market research and competitive analysis
  - Bridging business and technical teams

#### 9. Project Manager
- **File**: `team/project-manager.md`
- **Agent**: `agents/project-manager.mjs`
- **Responsibilities**:
  - Project planning and timeline management
  - Risk management and mitigation
  - Stakeholder communication
  - Resource coordination

## Integration with Workflow Runner

### Automatic Role Assignment
The workflow runner (`lib/orch/workflow-runner.mjs`) has been updated to automatically assign security roles based on feature requirements:

```javascript
// Security-heavy features (task digit = 1)
if (task === 1) {
  roles.add('ciso');
  roles.add('security-architect');
  roles.add('application-security-engineer');
  roles.add('devsecops-engineer');
}

// Privacy-sensitive features
if (epic === 3 || story >= 5) {
  roles.add('privacy-engineer');
}

// AI features requiring safety
if (epic === 4 || task === 4) {
  roles.add('ai-safety-engineer');
}
```

### Security Quality Gates
New quality gates have been added to the workflow:

1. **Security Review Gate**
   - SAST/DAST scanning
   - Secrets scanning
   - Threat model review
   - Risk assessment

2. **Privacy Compliance Gate**
   - Data classification check
   - Retention policy verification
   - Consent management review

## Testing the Integration

### Test Script
A comprehensive test script has been created at `test-security-workflow.mjs` that:
- Verifies all new agents load correctly
- Tests security gate execution
- Validates automatic role assignment
- Checks agent capabilities

### Running the Test
```bash
cd orch
node test-security-workflow.mjs
```

## Usage Examples

### Manual Role Assignment
```javascript
import { orchestrateTeam } from './lib/orch/workflow-runner.mjs';

// Orchestrate with specific security roles
await orchestrateTeam('1.1.1.1.0.0', [
  'ciso',
  'security-architect',
  'devsecops-engineer',
  'privacy-engineer'
]);
```

### Automatic Security Review
```javascript
import { runDefaultWorkflow } from './lib/orch/workflow-runner.mjs';

// Run workflow with security gates enabled
const result = await runDefaultWorkflow(false, {
  doItFully: true,
  featureId: '1.1.1.1.7.5' // Security-critical feature
});

// Check security gate results
const securityGate = result.qualityGates.details.find(
  g => g.name === 'Security Review'
);
console.log('Security Status:', securityGate.status);
```

## Best Practices

### 1. Security-First Development
- Always include security roles for production features
- Run security gates before deployment
- Document all security decisions in PRD §9.6

### 2. Privacy by Design
- Include privacy engineer early in feature planning
- Conduct privacy impact assessments
- Implement data minimization principles

### 3. Collaborative Security
- Security roles work alongside development roles
- Early threat modeling with security architect
- Continuous security testing with DevSecOps

### 4. Compliance Documentation
- All security decisions documented in PRD
- Audit trails maintained for compliance
- Regular security reviews and updates

## Future Enhancements

### Planned Improvements
1. Automated threat modeling based on architecture
2. Real-time security monitoring dashboard
3. AI-powered vulnerability detection
4. Automated compliance reporting

### Integration Opportunities
1. Connect with external security tools (Snyk, SonarQube)
2. Integrate with SIEM systems
3. Automated penetration testing
4. Supply chain security scanning

## Support and Maintenance

### Updating Role Definitions
Role definitions are in `team/*.md` files. To update:
1. Edit the markdown file with new responsibilities
2. Reload agents: `agentManager.loadTeamAgents(true)`

### Adding New Security Checks
Security functions are in `workflow-runner.mjs`:
- `runSecurityReview()` - Main security review
- `checkPrivacyCompliance()` - Privacy checks

### Troubleshooting
- Check agent loading: `agentManager.getAllAgents()`
- Verify role assignment: Check orchestration.agents array
- Debug security gates: Enable DEBUG=orch:* environment variable

## Conclusion
The integration of these new roles significantly enhances the orchestration system's capabilities in security, privacy, and project management. The system now provides comprehensive coverage for modern software development requirements with built-in security and compliance checks.