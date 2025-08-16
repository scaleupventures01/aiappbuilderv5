# Secret Rotation Procedures

## Overview

This document outlines the procedures for safely rotating secrets and API keys in the Elite Trading Coach AI application across all environments.

## Rotation Schedule

### Recommended Rotation Intervals
- **OpenAI API Keys**: Every 90 days
- **JWT Secrets**: Every 60 days  
- **Database Passwords**: Every 180 days
- **API Keys**: Every 90 days
- **Cloudinary Secrets**: Every 180 days

### Emergency Rotation
Immediately rotate secrets if:
- Suspected credential compromise
- Security incident detected
- Employee access changes
- Third-party breach notification

## OpenAI API Key Rotation

### 1. Pre-Rotation Checks
```bash
# Verify current key is working
curl -X GET "https://api.openai.com/v1/models" \
  -H "Authorization: Bearer $CURRENT_OPENAI_API_KEY"

# Check current usage and rate limits
# Document current configuration
```

### 2. Generate New API Key
1. Log into OpenAI Dashboard
2. Navigate to API Keys section
3. Create new key with descriptive name: `elite-trading-coach-prod-YYYY-MM-DD`
4. Copy the new key securely
5. **DO NOT delete old key yet**

### 3. Test New Key
```bash
# Test new key functionality
export NEW_OPENAI_API_KEY="sk-new-key-here"
curl -X GET "https://api.openai.com/v1/models" \
  -H "Authorization: Bearer $NEW_OPENAI_API_KEY"

# Verify models list includes required models
# Test basic completion request
```

### 4. Update Production Environment
```bash
# Using Railway CLI
railway variables set OPENAI_API_KEY=$NEW_OPENAI_API_KEY

# Or via Railway Dashboard:
# 1. Go to Variables section
# 2. Update OPENAI_API_KEY value
# 3. Deploy changes
```

### 5. Verification Steps
```bash
# Check application health after deployment
curl https://elite-trading-coach.railway.app/api/health/openai

# Monitor application logs for errors
railway logs

# Test core functionality
# - Image upload
# - Trade analysis requests
# - Chat functionality
```

### 6. Clean Up Old Key
```bash
# After 24-48 hours of successful operation:
# 1. Delete old API key from OpenAI Dashboard
# 2. Update documentation with new key details
# 3. Log rotation completion
```

## JWT Secret Rotation

### 1. Generate New Secret
```bash
# Generate cryptographically secure secret (32+ characters)
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Update Environment Variables
```bash
# Production
railway variables set JWT_SECRET=$NEW_JWT_SECRET

# Staging
railway variables set STAGING_JWT_SECRET=$NEW_JWT_SECRET

# Development (local .env.development)
JWT_SECRET=new-development-secret-here
```

### 3. Coordinate Deployment
```bash
# Deploy all environments simultaneously to prevent token mismatch
railway deploy --environment production
railway deploy --environment staging

# Clear all active sessions (users will need to re-login)
# This is expected behavior after JWT secret rotation
```

### 4. Validation
```bash
# Test login functionality
curl -X POST https://elite-trading-coach.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Verify token generation and validation
# Test protected endpoints
```

## Database Password Rotation

### 1. Railway PostgreSQL Rotation
```bash
# Generate new password
NEW_DB_PASSWORD=$(openssl rand -base64 24)

# Update Railway database password through dashboard
# Railway will automatically update environment variables
```

### 2. Application Update
```bash
# Railway automatically updates DATABASE_URL
# Verify new connection string is propagated
railway variables get DATABASE_URL

# Restart application to pick up new connection
railway redeploy
```

### 3. Verify Connectivity
```bash
# Test database connection
curl https://elite-trading-coach.railway.app/api/health/database

# Check application functionality
# - User registration/login
# - Message storage/retrieval
# - File upload metadata
```

## Cloudinary Secrets Rotation

### 1. Generate New Credentials
1. Log into Cloudinary Dashboard
2. Go to Settings > Security
3. Reset API Secret
4. Copy new credentials

### 2. Update Environment Variables
```bash
railway variables set CLOUDINARY_API_SECRET=$NEW_CLOUDINARY_SECRET
railway variables set CLOUDINARY_API_KEY=$NEW_CLOUDINARY_KEY
```

### 3. Test File Operations
```bash
# Test image upload functionality
# Verify existing images still accessible
# Test new uploads with new credentials
```

## Emergency Rotation Procedures

### Immediate Response (0-30 minutes)
1. **Disable Compromised Credentials**
   ```bash
   # Delete/revoke compromised keys immediately
   # OpenAI: Delete from dashboard
   # Railway: Remove/change variables
   ```

2. **Generate and Deploy New Credentials**
   ```bash
   # Use emergency deployment process
   railway variables set OPENAI_API_KEY=$EMERGENCY_NEW_KEY
   railway deploy --wait
   ```

3. **Verify System Security**
   ```bash
   # Check all health endpoints
   # Verify no unauthorized access
   # Monitor logs for suspicious activity
   ```

### Follow-up Actions (30 minutes - 24 hours)
1. Security incident documentation
2. Root cause analysis
3. Additional security measures if needed
4. Stakeholder notification

## Automation Scripts

### Rotation Testing Script
```bash
#!/bin/bash
# test-secret-rotation.sh

echo "Testing OpenAI API Key Rotation..."

# Test current key
echo "Testing current key..."
CURRENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models)

if [ "$CURRENT_STATUS" = "200" ]; then
  echo "✅ Current key working"
else
  echo "❌ Current key failed (Status: $CURRENT_STATUS)"
fi

# Test application health
echo "Testing application health..."
HEALTH_STATUS=$(curl -s https://elite-trading-coach.railway.app/api/health/openai | jq -r '.status')

if [ "$HEALTH_STATUS" = "healthy" ]; then
  echo "✅ Application health check passed"
else
  echo "❌ Application health check failed (Status: $HEALTH_STATUS)"
fi

echo "Rotation test completed"
```

### Monitoring Script
```bash
#!/bin/bash
# monitor-rotation.sh

echo "Monitoring secret rotation status..."

# Check last rotation dates
echo "Last rotations:"
echo "- OpenAI API Key: $(railway variables get OPENAI_KEY_ROTATED_DATE)"
echo "- JWT Secret: $(railway variables get JWT_SECRET_ROTATED_DATE)"

# Check upcoming rotations needed
CURRENT_DATE=$(date +%s)
NINETY_DAYS=$((90 * 24 * 60 * 60))

# Alert if rotation needed
echo "Rotation alerts:"
# Add logic to check rotation schedules
```

## Security Considerations

### During Rotation
- **Zero-downtime rotation**: Always test new credentials before removing old ones
- **Rollback plan**: Keep old credentials accessible for immediate rollback
- **Monitoring**: Increased monitoring during rotation windows
- **Documentation**: Log all rotation activities

### Access Control
- **Principle of least privilege**: Only authorized personnel can rotate secrets
- **Audit trail**: All rotation activities logged and tracked
- **Secure storage**: New secrets handled through secure channels only

### Validation
- **Functionality testing**: Complete application testing after rotation
- **Performance monitoring**: Check for any performance impacts
- **Error monitoring**: Watch for increased error rates

## Rollback Procedures

### If Rotation Fails
1. **Immediate rollback to previous credentials**
   ```bash
   railway variables set OPENAI_API_KEY=$PREVIOUS_KEY
   railway deploy --wait
   ```

2. **Verify system recovery**
   ```bash
   curl https://elite-trading-coach.railway.app/api/health
   ```

3. **Investigate and document failure**
4. **Plan corrective actions**

## Compliance and Auditing

### Documentation Requirements
- Rotation schedule adherence
- Security incident responses
- Access logs for rotation activities
- Compliance with security policies

### Audit Trail
- All rotations logged with timestamps
- Personnel responsible documented
- Reason for rotation recorded
- Validation results stored

## Contact Information

### Emergency Contacts
- **DevOps Lead**: [Contact info]
- **Security Team**: [Contact info]
- **Platform Admin**: [Contact info]

### Service Providers
- **OpenAI Support**: help@openai.com
- **Railway Support**: help@railway.app
- **Cloudinary Support**: support@cloudinary.com

---

**Last Updated**: 2025-08-15
**Document Version**: 1.0
**Review Schedule**: Monthly