# Production Deployment Procedures

## Overview

This document outlines the complete procedures for deploying the Elite Trading Coach AI application to production on Railway, including validation, deployment, monitoring, and rollback procedures.

## Prerequisites

### Required Credentials
- Railway account with project access
- OpenAI API key (production tier)
- PostgreSQL database (Railway)
- Cloudinary account credentials
- JWT signing secret (production-grade)

### Required Tools
- Railway CLI installed and authenticated
- Git repository access
- Node.js 18+ and npm

## Pre-Deployment Validation

### 1. Environment Validation
```bash
# Run comprehensive validation script
./scripts/validate-production-deployment.sh

# Check deployment readiness
node devops/deployment-readiness.js

# Verify production configuration
node test-production-mode.mjs
```

### 2. Code Quality Checks
```bash
# Run linting and type checking
npm run lint
npm run typecheck

# Run test suite
npm test

# Check for security vulnerabilities
npm audit --audit-level moderate
```

### 3. Secret Configuration
```bash
# Verify all required secrets are configured in Railway
railway variables list --environment production

# Required variables checklist:
# ✓ OPENAI_API_KEY (valid sk- format)
# ✓ USE_MOCK_OPENAI=false
# ✓ NODE_ENV=production
# ✓ JWT_SECRET (32+ characters)
# ✓ DATABASE_URL (Railway PostgreSQL)
# ✓ CLOUDINARY_* credentials
```

## Deployment Process

### Step 1: Pre-deployment Health Check
```bash
# Check current production status (if applicable)
curl https://elite-trading-coach.railway.app/api/health || echo "New deployment"

# Verify database connectivity
railway run --environment production node db/health-check.js
```

### Step 2: Deploy to Production
```bash
# Ensure clean working directory
git status

# Deploy to production environment
railway deploy --environment production

# Monitor deployment progress
railway logs --follow --environment production
```

### Step 3: Post-deployment Validation
```bash
# Wait for deployment to complete (usually 2-5 minutes)
sleep 120

# Run comprehensive health checks
curl https://elite-trading-coach.railway.app/api/health
curl https://elite-trading-coach.railway.app/api/health/openai/production
curl https://elite-trading-coach.railway.app/api/health/database

# Test core functionality
node tests/integration/production-smoke-test.mjs
```

### Step 4: Performance Validation
```bash
# Run load testing
node devops/simple-load-test.js

# Monitor response times
curl -w "@curl-format.txt" -s -o /dev/null https://elite-trading-coach.railway.app/api/health

# Check memory and CPU usage
railway ps --environment production
```

## Production Validation Checklist

### Critical Functionality Tests
- [ ] Application startup and health check endpoints respond
- [ ] OpenAI API integration working (production mode, not mock)
- [ ] Database connections established
- [ ] File upload and Cloudinary integration functional
- [ ] User authentication and JWT token generation
- [ ] Trade analysis API endpoints responding
- [ ] WebSocket connections for real-time features
- [ ] Rate limiting and security headers applied
- [ ] CORS configuration allows frontend connections
- [ ] Error handling and logging operational

### Performance Benchmarks
- [ ] API response times < 2 seconds for standard requests
- [ ] OpenAI analysis requests < 30 seconds
- [ ] Database query performance acceptable
- [ ] Memory usage within expected ranges
- [ ] No memory leaks detected
- [ ] WebSocket connections stable

### Security Validation
- [ ] USE_MOCK_OPENAI=false enforced
- [ ] Production JWT secrets in use
- [ ] API keys not exposed in logs or responses
- [ ] HTTPS enforced for all connections
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] File upload restrictions enforced

## Monitoring and Alerting

### Health Check Endpoints
```bash
# Primary health check
GET /api/health
# Expected: {"status": "healthy", "timestamp": "...", "services": {...}}

# OpenAI production health check
GET /api/health/openai/production
# Expected: {"status": "healthy", "mode": "production", "mockMode": false}

# Database health check  
GET /api/health/database
# Expected: {"status": "healthy", "connection": "active"}

# WebSocket health check
GET /api/health/websocket
# Expected: {"status": "healthy", "connections": N}
```

### Key Metrics to Monitor
- Response time percentiles (p50, p95, p99)
- Error rates by endpoint
- OpenAI API usage and costs
- Database connection pool health
- Memory and CPU utilization
- Active WebSocket connections
- File upload success rates

### Alert Thresholds
- Error rate > 5% for 5+ minutes
- Response time p95 > 5 seconds
- Health check failures > 3 consecutive
- Memory usage > 80% for 10+ minutes
- OpenAI API failures > 10% for 5+ minutes

## Rollback Procedures

### Immediate Rollback (< 5 minutes)
```bash
# Identify last known good deployment
railway deployments list --environment production

# Rollback to previous deployment
railway rollback [DEPLOYMENT_ID] --environment production

# Verify rollback success
curl https://elite-trading-coach.railway.app/api/health
```

### Configuration Rollback
```bash
# Rollback environment variables if needed
railway variables set OPENAI_API_KEY=$PREVIOUS_OPENAI_KEY
railway variables set USE_MOCK_OPENAI=false
railway variables set JWT_SECRET=$PREVIOUS_JWT_SECRET

# Trigger new deployment with old config
railway redeploy --environment production
```

### Database Rollback (if required)
```bash
# Railway PostgreSQL backup restoration
# Contact Railway support for database restoration
# Or use database-specific backup procedures

# Verify database state after restoration
railway run --environment production node db/validate-schema.js
```

### Rollback Validation
```bash
# Test all critical functionality
node tests/integration/production-smoke-test.mjs

# Verify user data integrity
# Check recent user sessions still valid
# Ensure no data loss occurred

# Monitor for stability
railway logs --follow --environment production | grep -i error
```

## Incident Response

### Deployment Failure Response
1. **Immediate Actions (0-5 minutes)**
   - Stop deployment if in progress: `railway cancel-deploy`
   - Assess impact: Check error logs and health endpoints
   - Initiate rollback if critical functionality affected

2. **Investigation (5-30 minutes)**
   - Analyze deployment logs: `railway logs --environment production`
   - Check configuration changes
   - Identify root cause

3. **Resolution (30+ minutes)**
   - Fix identified issues
   - Re-run pre-deployment validation
   - Deploy fix or complete rollback
   - Document incident and lessons learned

### Production Issue Response
1. **Detection**
   - Monitoring alerts triggered
   - User reports of issues
   - Health check failures

2. **Assessment**
   - Determine impact scope and severity
   - Check if rollback is necessary
   - Identify affected users/functionality

3. **Response**
   - Implement immediate fixes if possible
   - Rollback if issues are severe
   - Communicate with stakeholders
   - Monitor resolution effectiveness

## Security Considerations

### API Key Management
- OpenAI API keys stored securely in Railway variables
- Regular rotation schedule (every 90 days)
- Emergency rotation procedures documented
- No API keys in code or logs

### Environment Isolation
- Production environment completely isolated
- No development/test data in production
- Separate API keys for each environment
- Environment-specific access controls

### Access Control
- Railway project access limited to authorized personnel
- Deployment permissions restricted
- Audit trail for all production changes
- Emergency access procedures documented

## Compliance and Auditing

### Deployment Audit Trail
- All deployments logged with timestamps
- Personnel responsible documented
- Code changes linked to deployments
- Configuration changes tracked

### Security Compliance
- Regular security audits
- Vulnerability scanning
- Compliance with data protection regulations
- Incident documentation and reporting

### Documentation Maintenance
- Procedures reviewed monthly
- Contact information kept current
- Lessons learned incorporated
- Training materials updated

## Emergency Contacts

### Internal Team
- **DevOps Lead**: [Contact info]
- **Backend Team Lead**: [Contact info]
- **Security Officer**: [Contact info]
- **Project Manager**: [Contact info]

### External Support
- **Railway Support**: help@railway.app
- **OpenAI Support**: help@openai.com
- **Cloudinary Support**: support@cloudinary.com

## Appendix

### Useful Commands
```bash
# Check deployment status
railway status --environment production

# View recent deployments
railway deployments list --environment production

# Monitor real-time logs
railway logs --follow --environment production

# Check environment variables
railway variables list --environment production

# Run one-off commands
railway run --environment production [command]

# Connect to production database
railway connect postgres --environment production
```

### Configuration Templates
See:
- `.env.production` - Production environment template
- `railway.json` - Railway deployment configuration
- `scripts/validate-production-deployment.sh` - Validation script

### Related Documentation
- [Secret Rotation Procedures](./SECRET-ROTATION-PROCEDURES.md)
- [Security Compliance Checklist](./SECURITY-COMPLIANCE-CHECKLIST.md)
- [Environment Setup Guide](./ENVIRONMENT-SETUP-GUIDE.md)

---

**Last Updated**: 2025-08-15  
**Document Version**: 1.0  
**Review Schedule**: Monthly  
**Responsible Team**: DevOps Engineering