# Environment Setup Guide

## Overview

This guide details the environment variable configuration for the Elite Trading Coach AI application across different deployment environments.

## Environment Files

### 1. `.env.example` - Template File
- Contains all available environment variables with example values
- Safe to commit to version control
- Used as a reference for setting up other environments

### 2. `.env.development` - Development Environment
- Local development configuration
- Lower rate limits and resource usage
- Debug logging enabled
- Uses test/development API keys

### 3. `.env.production` - Production Environment  
- Production configuration template
- Uses Railway variables for sensitive data
- Strict security settings
- Optimized for performance

### 4. `.env.test` - Test Environment
- Test configuration with mock/test values
- Minimal resource usage
- Mock responses enabled where possible
- Isolated test database

## Required Environment Variables

### Core Application
```bash
NODE_ENV=production|development|test|staging
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

### Database Configuration
```bash
DATABASE_URL=postgresql://user:pass@host:port/database
PGUSER=postgres
PGPASSWORD=your-secure-password
PGHOST=localhost
PGPORT=5432
PGDATABASE=elite_trading_coach
```

### JWT Authentication
```bash
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### OpenAI API Configuration
```bash
# Required
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-vision-preview
OPENAI_FALLBACK_MODEL=gpt-4

# Performance & Reliability
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
OPENAI_TIMEOUT=30000
OPENAI_MAX_RETRIES=3
OPENAI_RETRY_BASE_DELAY=1000
OPENAI_RETRY_MAX_DELAY=10000

# Rate Limiting
OPENAI_RATE_LIMIT_RPM=60
OPENAI_RATE_LIMIT_RPD=1000
OPENAI_RATE_LIMIT_ENABLED=true

# Monitoring
OPENAI_HEALTH_CHECK_INTERVAL=5
OPENAI_USAGE_LOGGING=true
OPENAI_COST_TRACKING=true

# Circuit Breaker
OPENAI_CIRCUIT_BREAKER_ENABLED=true
OPENAI_CIRCUIT_BREAKER_THRESHOLD=5
OPENAI_CIRCUIT_BREAKER_TIMEOUT=60000

# Optional
OPENAI_ORGANIZATION=org-your-organization-id
OPENAI_PROJECT=proj-your-project-id
OPENAI_MOCK_ENABLED=false
```

### Cloudinary File Storage
```bash
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### Security & Rate Limiting
```bash
API_KEY=your-api-key-for-external-integrations
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
SECURITY_LEVEL=strict|development|test
```

### File Upload Configuration
```bash
MAX_FILE_SIZE_MB=10
MAX_AVATAR_SIZE_MB=2
MAX_IMAGE_SIZE_MB=5
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp,pdf,doc,docx,txt
USER_STORAGE_QUOTA=1073741824
ADMIN_STORAGE_QUOTA=10737418240
```

## Environment-Specific Configurations

### Development Environment
- Lower rate limits for cost control
- Debug logging enabled
- Relaxed security settings
- Uses development API keys

```bash
OPENAI_RATE_LIMIT_RPM=30
OPENAI_MAX_TOKENS=500
LOG_LEVEL=debug
SECURITY_LEVEL=development
```

### Production Environment
- Strict rate limits
- Enhanced security
- Error-only logging
- Production API keys via Railway Variables

```bash
OPENAI_RATE_LIMIT_RPM=60
OPENAI_MAX_TOKENS=1000
LOG_LEVEL=info
SECURITY_LEVEL=strict
```

### Test Environment
- Mock responses enabled
- Minimal resource usage
- Isolated test database
- Very low rate limits

```bash
OPENAI_MOCK_ENABLED=true
OPENAI_RATE_LIMIT_RPM=10
OPENAI_MAX_TOKENS=100
LOG_LEVEL=error
```

## Setup Instructions

### 1. Local Development Setup

1. Copy the template file:
   ```bash
   cp .env.example .env.development
   ```

2. Update the required variables:
   - `OPENAI_API_KEY` - Get from OpenAI Dashboard
   - `DATABASE_URL` - Your local PostgreSQL connection
   - `JWT_SECRET` - Generate a secure 32+ character string
   - `CLOUDINARY_*` - Get from Cloudinary Dashboard

3. Set environment:
   ```bash
   export NODE_ENV=development
   ```

### 2. Production Setup (Railway)

1. Set Railway Variables via CLI or Dashboard:
   ```bash
   railway variables set OPENAI_API_KEY=sk-your-production-key
   railway variables set JWT_SECRET=your-secure-jwt-secret
   railway variables set CLOUDINARY_API_SECRET=your-cloudinary-secret
   ```

2. The `railway.json` configuration automatically maps these to environment variables.

### 3. Testing Setup

1. Copy and modify for testing:
   ```bash
   cp .env.example .env.test
   ```

2. Enable mock mode:
   ```bash
   OPENAI_MOCK_ENABLED=true
   NODE_ENV=test
   ```

## Security Best Practices

### 1. API Key Management
- Never commit actual API keys to version control
- Use different API keys for different environments
- Rotate API keys regularly
- Monitor API key usage

### 2. Environment File Security
- Add all `.env.*` files to `.gitignore` (except `.env.example`)
- Use file permissions to restrict access: `chmod 600 .env.*`
- Store production secrets in Railway Variables or secure vaults

### 3. Secret Rotation
- Implement regular secret rotation procedures
- Use different secrets for each environment
- Monitor for secret exposure in logs

## Validation

### Environment Variable Validation
The application validates environment variables on startup:

```javascript
// config/environment-validator.js validates:
- Required variables are present
- API key format is correct (sk- prefix for OpenAI)
- Numeric values are valid
- URL formats are correct
```

### Health Checks
- OpenAI API connectivity: `GET /api/health/openai`
- Database connectivity: `GET /api/health/database`
- Overall health: `GET /api/health`

## Troubleshooting

### Common Issues

1. **OpenAI API Key Invalid**
   ```
   Error: Invalid OpenAI API key format
   Solution: Ensure key starts with 'sk-' and is from OpenAI Dashboard
   ```

2. **Database Connection Failed**
   ```
   Error: Connection refused
   Solution: Check DATABASE_URL format and database availability
   ```

3. **JWT Secret Too Short**
   ```
   Error: JWT secret must be at least 32 characters
   Solution: Generate longer secret: openssl rand -base64 32
   ```

4. **Rate Limit Exceeded**
   ```
   Error: OpenAI rate limit exceeded
   Solution: Adjust OPENAI_RATE_LIMIT_RPM or upgrade OpenAI plan
   ```

### Debug Mode
Enable debug logging:
```bash
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

## Monitoring

### Environment Variable Monitoring
- Monitor for missing or invalid environment variables
- Alert on configuration changes
- Track environment variable usage patterns

### API Usage Monitoring
- OpenAI API usage and costs
- Rate limit utilization
- Error rates by environment

## Support

For environment setup issues:
1. Check this documentation
2. Validate configuration with health check endpoints
3. Review application logs for specific errors
4. Contact DevOps team for production environment issues