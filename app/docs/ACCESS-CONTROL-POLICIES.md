# Access Control Policies for Secrets Management

## Overview

This document defines access control policies for managing secrets, API keys, and sensitive configuration data in the Elite Trading Coach AI application.

## Principle of Least Privilege

All access to secrets follows the principle of least privilege:
- Users receive the minimum access necessary to perform their role
- Access is granted for the shortest time necessary
- Permissions are regularly reviewed and updated
- Unused access is promptly revoked

## Role-Based Access Control (RBAC)

### 1. Production Environment Access

#### Super Admin
- **Who**: Lead DevOps Engineer, CTO
- **Access**: Full read/write access to all production secrets
- **Responsibilities**:
  - Emergency secret rotation
  - Access control management
  - Security incident response
  - Audit compliance
- **Requirements**: 
  - Multi-factor authentication
  - VPN access required
  - Activity logging enabled

#### DevOps Engineers
- **Who**: DevOps team members
- **Access**: Read access to production secrets, write access to non-critical secrets
- **Responsibilities**:
  - Regular secret rotation
  - Monitoring and alerts
  - Backup and recovery
- **Requirements**:
  - Multi-factor authentication
  - Approval required for critical changes
  - Activity logging enabled

#### Backend Developers (Production)
- **Who**: Senior backend developers
- **Access**: Read-only access to non-sensitive configuration
- **Responsibilities**:
  - Application configuration
  - Debugging production issues
- **Requirements**:
  - Business justification required
  - Time-limited access (max 24 hours)
  - Supervisor approval

### 2. Staging Environment Access

#### DevOps Engineers
- **Access**: Full read/write access
- **Purpose**: Testing deployment procedures

#### Backend Developers
- **Access**: Read/write access to staging secrets
- **Purpose**: Feature development and testing

#### QA Engineers
- **Access**: Read-only access to configuration
- **Purpose**: Testing and validation

### 3. Development Environment Access

#### All Developers
- **Access**: Full access to development secrets
- **Requirements**: Use development-specific API keys only

## Secret Classification

### Critical Secrets (Highest Security)
- Production OpenAI API keys
- Production database passwords
- JWT signing secrets
- Payment gateway secrets

**Access Requirements**:
- Super Admin approval required
- Multi-factor authentication mandatory
- Activity auditing required
- Break-glass procedures documented

### Standard Secrets (High Security)
- Staging API keys
- Cloudinary production credentials
- Third-party integration keys

**Access Requirements**:
- DevOps Engineer approval required
- Multi-factor authentication recommended
- Regular access reviews

### Development Secrets (Standard Security)
- Development API keys
- Test environment credentials
- Non-production configurations

**Access Requirements**:
- Team lead approval
- Standard authentication
- Basic activity logging

## Access Control Implementation

### 1. Railway Environment Variables

#### Production Access Control
```bash
# Only Super Admins can modify critical variables
railway variables set --environment production OPENAI_API_KEY=xxx
# Requires admin token and MFA

# DevOps Engineers can read variables
railway variables get --environment production
# Requires DevOps role assignment
```

#### Access Audit Trail
```bash
# Track all variable changes
railway logs --filter "variable"
railway audit --type variables --environment production
```

### 2. GitHub Repository Access

#### Secret Files Protection
```yaml
# .github/CODEOWNERS
# Protect sensitive configuration files
app/.env.* @devops-team @super-admins
app/config/ @backend-team @devops-team
scripts/ @devops-team
docs/SECRET-* @super-admins
```

#### Branch Protection Rules
- `main` branch: Requires 2 reviews from CODEOWNERS
- `staging` branch: Requires 1 review from DevOps team
- Secret-related files: Requires security team approval

### 3. Local Development Controls

#### Environment File Permissions
```bash
# Restrict file permissions for local env files
chmod 600 .env.*
chown $USER:$USER .env.*

# Prevent accidental commits
echo ".env.*" >> .gitignore
echo "!.env.example" >> .gitignore
```

#### Development Secret Rotation
```bash
# Rotate development secrets monthly
# Script: scripts/rotate-dev-secrets.sh
#!/bin/bash
export NEW_DEV_OPENAI_KEY="sk-dev-$(date +%Y%m)-new"
sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$NEW_DEV_OPENAI_KEY/" .env.development
```

## Access Request Procedures

### 1. Production Secret Access Request

**Process**:
1. Submit access request ticket
2. Business justification required
3. Manager approval needed
4. Security team review
5. Time-limited access granted
6. Access automatically revoked after period

**Required Information**:
- Purpose of access
- Duration needed
- Specific secrets required
- Emergency contact information

### 2. Emergency Access Procedures

**Break-Glass Process**:
1. Emergency declared by incident commander
2. Super Admin grants immediate access
3. Access logged and monitored
4. Post-incident review required
5. Access revoked after incident resolution

**Emergency Contacts**:
- Primary: Lead DevOps Engineer
- Secondary: CTO
- Escalation: Security Team

## Monitoring and Auditing

### 1. Access Monitoring

#### Real-Time Alerts
```bash
# Set up alerts for secret access
railway alerts create \
  --type "variable-access" \
  --environment "production" \
  --webhook "https://alerts.company.com/secret-access"
```

#### Daily Access Reports
```bash
# Generate daily access report
railway audit --type variables --since 24h --format json > daily-access-report.json
```

### 2. Regular Access Reviews

#### Monthly Reviews
- Review all production access
- Validate business need for access
- Remove unnecessary permissions
- Update role assignments

#### Quarterly Security Audits
- Complete access control review
- Penetration testing of access controls
- Policy compliance verification
- Update procedures based on findings

### 3. Compliance Tracking

#### SOC 2 Requirements
- Logical access controls implemented
- Regular access reviews documented
- Segregation of duties enforced
- Audit trail maintained

#### GDPR Compliance
- Access to personal data tracked
- Data processing purposes documented
- Retention periods enforced
- Right to be forgotten implemented

## Technical Implementation

### 1. Railway Access Control

#### Environment-Specific Tokens
```bash
# Production token (Super Admin only)
export RAILWAY_PROD_TOKEN="xxx"

# Staging token (DevOps team)
export RAILWAY_STAGING_TOKEN="xxx"

# Development token (All developers)
export RAILWAY_DEV_TOKEN="xxx"
```

#### Token Rotation Schedule
- Production tokens: Every 30 days
- Staging tokens: Every 60 days
- Development tokens: Every 90 days

### 2. Application-Level Controls

#### Secret Access Validation
```javascript
// config/secret-access-validator.js
class SecretAccessValidator {
  static validateAccess(userId, secretType, environment) {
    const userRole = this.getUserRole(userId);
    const requiredPermission = this.getRequiredPermission(secretType, environment);
    
    if (!this.hasPermission(userRole, requiredPermission)) {
      this.logUnauthorizedAccess(userId, secretType, environment);
      throw new UnauthorizedAccessError('Insufficient permissions');
    }
    
    this.logAuthorizedAccess(userId, secretType, environment);
    return true;
  }
}
```

#### Runtime Secret Masking
```javascript
// middleware/secret-protection.js
app.use((req, res, next) => {
  // Override console methods to mask secrets
  const originalLog = console.log;
  console.log = (...args) => {
    const maskedArgs = args.map(arg => 
      typeof arg === 'string' ? maskSecrets(arg) : arg
    );
    originalLog.apply(console, maskedArgs);
  };
  next();
});
```

### 3. Infrastructure Controls

#### Network Segmentation
```yaml
# docker-compose.production.yml
version: '3.8'
services:
  app:
    networks:
      - app-network
    environment:
      - SECRETS_NETWORK=secrets-only
networks:
  app-network:
    driver: bridge
    internal: true
  secrets-only:
    driver: bridge
    internal: true
```

#### Container Security
```dockerfile
# Dockerfile.production
FROM node:18-alpine

# Create non-root user for secrets access
RUN addgroup -g 1001 -S secrets && \
    adduser -S -D -h /app -s /bin/false -G secrets -u 1001 appuser

# Set strict permissions on secret files
COPY --chown=appuser:secrets --chmod=600 .env.production /app/

USER appuser
```

## Incident Response

### 1. Unauthorized Access Detection

**Immediate Actions**:
1. Revoke compromised access immediately
2. Rotate affected secrets
3. Assess scope of potential damage
4. Notify security team and management

**Investigation Steps**:
1. Review access logs and audit trails
2. Identify root cause of unauthorized access
3. Document timeline of events
4. Assess data exposure risk

### 2. Secret Compromise Response

**Containment**:
1. Immediately rotate compromised secrets
2. Revoke all related access tokens
3. Block potentially compromised accounts
4. Monitor for suspicious activity

**Recovery**:
1. Deploy new secrets to all environments
2. Verify application functionality
3. Update monitoring and alerting
4. Conduct post-incident review

## Training and Awareness

### 1. Security Training Requirements

#### New Employee Onboarding
- Secret management policies overview
- Role-specific access procedures
- Security best practices training
- Incident reporting procedures

#### Annual Refresher Training
- Policy updates and changes
- New threat landscape awareness
- Hands-on security exercises
- Compliance requirements review

### 2. Documentation and Resources

#### Quick Reference Guides
- Secret access request procedures
- Emergency contact information
- Common troubleshooting steps
- Policy compliance checklists

#### Technical Documentation
- Access control implementation details
- Secret rotation procedures
- Monitoring and alerting setup
- Incident response playbooks

## Policy Compliance

### 1. Regular Assessments

#### Monthly Self-Assessments
- Team leads review team access
- Validate ongoing business need
- Report access anomalies
- Update role assignments

#### Quarterly Internal Audits
- Security team conducts comprehensive review
- Test access control effectiveness
- Verify policy compliance
- Document findings and remediation

### 2. External Audits

#### Annual Third-Party Security Audit
- Independent assessment of access controls
- Penetration testing of secret management
- Compliance verification (SOC 2, ISO 27001)
- Management reporting and remediation

#### Continuous Monitoring
- Automated policy compliance checking
- Real-time access anomaly detection
- Regular security posture assessments
- Threat intelligence integration

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-15  
**Next Review**: 2025-11-15  
**Owner**: DevOps Team  
**Approved By**: CTO, Security Team