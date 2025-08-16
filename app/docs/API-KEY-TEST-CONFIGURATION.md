# Real API Key Testing Configuration Guide

## Overview

This document provides comprehensive instructions for configuring and testing the Elite Trading Coach AI system with real OpenAI API keys for production validation. Mock mode is available only for initial development - all production testing must use real API keys.

## Table of Contents

1. [Quick Start Guide](#quick-start)
2. [Environment Configuration](#environment-configuration)
3. [Mock Mode Setup](#mock-mode-setup)
4. [Sample Mock Responses](#sample-mock-responses)
5. [Testing Without API Credits](#testing-without-api-credits)
6. [Development Workflow](#development-workflow)
7. [Production Transition](#production-transition)
8. [Troubleshooting](#troubleshooting)

## Real API Setup Guide {#real-api-setup}

### Production Testing Setup (10 minutes)

1. **Obtain OpenAI API Key**
   ```bash
   # Visit https://platform.openai.com/api-keys
   # Create new API key for production testing
   # Set usage limits: $50/month recommended for testing
   ```

2. **Create Production Environment File**
   ```bash
   # Create .env.production in /app/ directory
   echo "USE_MOCK_OPENAI=false" > .env.production
   echo "OPENAI_API_KEY=sk-your-actual-api-key-here" >> .env.production
   ```

3. **Start Server in Production Mode**
   ```bash
   cd /app
   NODE_ENV=production npm start
   ```

4. **Verify Real API Mode Active**
   Look for these console messages:
   ```
   [PRODUCTION MODE] GPT-4 Vision service connected to OpenAI API
   [API READY] Using model: gpt-4-vision-preview
   [COST TRACKING] Token usage monitoring enabled
   ```

5. **Test API Endpoint with Real Costs**
   ```bash
   curl -X POST http://localhost:3000/api/analyze-trade \
     -F "image=@test-chart.png" \
     -F "description=Production testing"
   # Expected cost: $0.01-0.03 per call
   ```

## Environment Configuration {#environment-configuration}

### Production Testing Environment (.env.production)

```bash
# === PRODUCTION MODE CONFIGURATION ===
USE_MOCK_OPENAI=false
OPENAI_API_KEY=sk-your-actual-production-api-key-here

# === DATABASE CONFIGURATION ===
DATABASE_URL=postgresql://username:password@localhost:5432/trading_coach_dev
DB_SSL_MODE=prefer

# === SERVER CONFIGURATION ===
PORT=3000
NODE_ENV=development

# === CLOUDINARY CONFIGURATION ===
CLOUDINARY_CLOUD_NAME=your-dev-cloud-name
CLOUDINARY_API_KEY=your-dev-api-key
CLOUDINARY_API_SECRET=your-dev-api-secret

# === JWT CONFIGURATION ===
JWT_SECRET=dev-jwt-secret-key
JWT_REFRESH_SECRET=dev-jwt-refresh-secret

# === CORS CONFIGURATION ===
FRONTEND_URL=http://localhost:5173
```

### Development Environment (.env.development)

```bash
# === DEVELOPMENT MODE (Mock allowed for initial development only) ===
USE_MOCK_OPENAI=true
OPENAI_API_KEY=sk-dev-api-key-here

# NOTE: Mock mode is for development only.
# All testing and validation must use real API keys.

# === TEST DATABASE ===
DATABASE_URL=postgresql://username:password@localhost:5432/trading_coach_test
DB_SSL_MODE=disable

# === SERVER CONFIGURATION ===
PORT=3001
NODE_ENV=test

# === MINIMAL EXTERNAL SERVICES ===
CLOUDINARY_CLOUD_NAME=test-cloud
CLOUDINARY_API_KEY=test-key
CLOUDINARY_API_SECRET=test-secret

JWT_SECRET=test-jwt-secret
JWT_REFRESH_SECRET=test-jwt-refresh-secret
```

### Test Environment (.env.test)

```bash
# === TEST MODE (Real API required for validation) ===
USE_MOCK_OPENAI=false
OPENAI_API_KEY=sk-your-test-api-key-here

# NOTE: Even test environment must use real API for validation

# === PRODUCTION DATABASE ===
DATABASE_URL=postgresql://prod_user:secure_password@prod-host:5432/trading_coach_prod
DB_SSL_MODE=require

# === SERVER CONFIGURATION ===
PORT=3000
NODE_ENV=production

# === PRODUCTION EXTERNAL SERVICES ===
CLOUDINARY_CLOUD_NAME=your-prod-cloud-name
CLOUDINARY_API_KEY=your-prod-api-key
CLOUDINARY_API_SECRET=your-prod-api-secret

JWT_SECRET=super-secure-production-jwt-secret
JWT_REFRESH_SECRET=super-secure-production-refresh-secret
```

## Real API Requirements {#real-api-requirements}

### Production Testing Validation

**CRITICAL: Mock mode is deprecated for production testing. All validation must use real OpenAI API keys.**

The system requires real API mode when:

1. **Environment Variable Set**: `USE_MOCK_OPENAI=false`
2. **Valid API Key Required**: Must meet these conditions:
   - `OPENAI_API_KEY` is a valid OpenAI API key
   - Key starts with `sk-proj-` or `sk-` format
   - Key is at least 20 characters long
   - Key has valid API access and quotas

### Real API Features

```javascript
// Real API mode provides:
{
  "actual_ai_analysis": true,
  "real_api_costs": "$0.01-0.03 per image",
  "authentic_responses": true,
  "actual_delays": "2-5 seconds",
  "genuine_variety": "Based on actual chart analysis",
  "real_metadata": "Actual tokens, costs, performance",
  "production_ready": true
}
```

### Mock Response Logic

The system intelligently selects responses based on:

1. **Filename Analysis**:
   - `bullish.png` → Diamond verdict
   - `bearish.jpg` → Skull verdict
   - `uptrend.jpeg` → Diamond verdict
   - `downtrend.png` → Skull verdict

2. **Description Keywords**:
   - "strong", "bullish", "breakout" → Diamond
   - "weak", "bearish", "breakdown" → Skull
   - "mixed", "uncertain", "volatile" → Fire

3. **Random Selection**: Default varied responses for realistic testing

## Sample Mock Responses {#sample-mock-responses}

### Diamond Verdict (Bullish)
```json
{
  "success": true,
  "data": {
    "verdict": "Diamond",
    "confidence": 85,
    "reasoning": "Strong upward trend with volume confirmation and clean breakout pattern."
  },
  "metadata": {
    "processingTime": 1800,
    "imageSize": { "width": 1920, "height": 1080 },
    "model": "gpt-4-vision-preview-mock",
    "tokensUsed": 0,
    "mockMode": true,
    "cost": 0
  }
}
```

### Fire Verdict (Aggressive/Risky)
```json
{
  "success": true,
  "data": {
    "verdict": "Fire",
    "confidence": 72,
    "reasoning": "High volatility setup with potential for significant moves but increased risk."
  },
  "metadata": {
    "processingTime": 1650,
    "imageSize": { "width": 1920, "height": 1080 },
    "model": "gpt-4-vision-preview-mock",
    "tokensUsed": 0,
    "mockMode": true,
    "cost": 0
  }
}
```

### Skull Verdict (Bearish)
```json
{
  "success": true,
  "data": {
    "verdict": "Skull",
    "confidence": 78,
    "reasoning": "Clear downward momentum with resistance rejection and declining volume."
  },
  "metadata": {
    "processingTime": 1920,
    "imageSize": { "width": 1920, "height": 1080 },
    "model": "gpt-4-vision-preview-mock",
    "tokensUsed": 0,
    "mockMode": true,
    "cost": 0
  }
}
```

### Error Response (Invalid Image)
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Invalid image format",
    "code": "INVALID_IMAGE_FORMAT"
  },
  "metadata": {
    "processingTime": 150,
    "mockMode": true,
    "cost": 0
  }
}
```

## Production API Testing {#production-api-testing}

### Complete Test Suite

#### 1. Basic Functionality Tests

```bash
# Test basic endpoint availability
curl -X GET http://localhost:3000/health

# Test with valid image
curl -X POST http://localhost:3000/api/analyze-trade \
  -F "image=@bullish-chart.png" \
  -F "description=Strong upward trend"

# Test with different image format
curl -X POST http://localhost:3000/api/analyze-trade \
  -F "image=@bearish-chart.jpg"

# Test error handling with invalid file
curl -X POST http://localhost:3000/api/analyze-trade \
  -F "image=@invalid.txt"
```

#### 2. Response Validation Tests

```bash
# Test Diamond response (bullish filename)
curl -X POST http://localhost:3000/api/analyze-trade \
  -F "image=@bullish-pattern.png" | jq '.data.verdict'
# Expected: "Diamond"

# Test Skull response (bearish filename)
curl -X POST http://localhost:3000/api/analyze-trade \
  -F "image=@bearish-trend.jpg" | jq '.data.verdict'
# Expected: "Skull"

# Test Fire response (mixed signals)
curl -X POST http://localhost:3000/api/analyze-trade \
  -F "image=@mixed-signals.png" | jq '.data.verdict'
# Expected: "Fire"
```

#### 3. Performance Tests

```bash
# Test response time (should be 1-2 seconds)
time curl -X POST http://localhost:3000/api/analyze-trade \
  -F "image=@large-chart.png"

# Test concurrent requests
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/analyze-trade \
    -F "image=@test-chart-$i.png" &
done
wait
```

#### 4. Mock Mode Verification Tests

```bash
# Verify mock mode indicators
curl -X POST http://localhost:3000/api/analyze-trade \
  -F "image=@test.png" | jq '.metadata.mockMode'
# Expected: true

# Verify zero token usage
curl -X POST http://localhost:3000/api/analyze-trade \
  -F "image=@test.png" | jq '.metadata.tokensUsed'
# Expected: 0

# Verify zero cost
curl -X POST http://localhost:3000/api/analyze-trade \
  -F "image=@test.png" | jq '.metadata.cost'
# Expected: 0
```

### Test Image Creation

Create test images for comprehensive testing:

```bash
# Create test image directory
mkdir -p test-images

# Create various test images (you can use any image files)
cp sample-chart.png test-images/bullish-pattern.png
cp sample-chart.png test-images/bearish-trend.jpg
cp sample-chart.png test-images/mixed-signals.jpeg
cp sample-chart.png test-images/large-chart.png
cp invalid-file.txt test-images/invalid.txt
```

## Development Workflow {#development-workflow}

### Daily Development Process

1. **Start Development Session**
   ```bash
   cd /app
   npm run dev
   # Verify mock mode active in console
   ```

2. **Test New Features**
   ```bash
   # Test each feature change immediately
   curl -X POST http://localhost:3000/api/analyze-trade \
     -F "image=@test.png"
   ```

3. **Validate Response Format**
   ```bash
   # Ensure responses match expected structure
   npm run test:mock-responses
   ```

4. **Performance Check**
   ```bash
   # Verify mock responses are fast
   time curl -X POST http://localhost:3000/api/analyze-trade \
     -F "image=@large-test.png"
   ```

### Feature Development Cycle

1. **Code Changes**: Implement new features
2. **Mock Testing**: Test immediately with mock responses
3. **Format Validation**: Ensure consistent response structure
4. **Error Handling**: Test error scenarios with invalid inputs
5. **Performance Check**: Verify acceptable response times
6. **Integration Test**: Test with frontend components

### Testing Before Production

```bash
# 1. Comprehensive mock testing
npm run test:comprehensive

# 2. Load testing with mocks
npm run test:load-mock

# 3. Error scenario testing
npm run test:error-scenarios

# 4. Response format validation
npm run test:format-validation
```

## Real API Testing Requirements {#real-api-testing-requirements}

### Step-by-Step Real API Validation

#### Phase 1: Obtain API Key (MANDATORY)
1. **Get OpenAI API Key**:
   - Visit https://platform.openai.com/api-keys
   - Create new API key for testing/production
   - Set usage limits: $50/month minimum for comprehensive testing
   - Enable GPT-4 Vision access

2. **Validate API Key**:
   ```bash
   # Test key with minimal API call
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer sk-your-new-api-key"
   
   # Test GPT-4 Vision specifically
   curl https://api.openai.com/v1/chat/completions \
     -H "Authorization: Bearer sk-your-new-api-key" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "gpt-4-vision-preview",
       "messages": [{"role": "user", "content": "Hello"}],
       "max_tokens": 10
     }'
   ```

#### Phase 2: Environment Configuration (MANDATORY)
1. **Update All Environments for Real API Testing**:
   ```bash
   # .env.test
   USE_MOCK_OPENAI=false
   OPENAI_API_KEY=sk-your-actual-test-api-key
   
   # .env.production
   USE_MOCK_OPENAI=false
   OPENAI_API_KEY=sk-your-actual-production-api-key
   ```

2. **Deploy Configuration**:
   ```bash
   # Test environment
   NODE_ENV=test npm test
   
   # Production environment
   NODE_ENV=production npm start
   ```

#### Phase 3: Cost Management & Monitoring (MANDATORY)
1. **Set Up Cost Monitoring**:
   ```bash
   # Configure usage alerts
   # Daily limit: $10 for testing
   # Monthly limit: $50 for comprehensive validation
   # Enable email alerts at 80% usage
   ```

2. **Monitor API Usage in Real-Time**:
   ```bash
   # Watch for actual token usage and costs
   tail -f logs/api-usage.log
   
   # Expected output:
   # [API] Tokens used: 1250, Cost: $0.025
   # [DAILY] Total cost so far: $2.45
   ```

3. **Validate Production Responses**:
   ```bash
   # Test with real API calls
   curl -X POST https://staging.your-domain.com/api/analyze-trade \
     -F "image=@real-chart.png"
   ```

#### Phase 4: Production Launch
1. **Deploy to Production**:
   ```bash
   # Deploy with production environment
   NODE_ENV=production npm start
   ```

2. **Monitor Initial Performance**:
   - Response times (should be 2-4 seconds)
   - API costs (track spending)
   - Error rates (should be <1%)
   - Response quality

3. **Gradual Traffic Increase**:
   - Start with limited users
   - Monitor API limits and costs
   - Scale up gradually

### Cost & Performance Monitoring (MANDATORY)

```javascript
// Required monitoring for real API usage
{
  "api_cost_tracking": {
    "daily_budget": 10.00, // $10/day for testing
    "monthly_budget": 50.00, // $50/month for comprehensive testing
    "cost_per_image": 0.025, // Average $0.025 per image analysis
    "alert_threshold": 0.8 // Alert at 80% of budget
  },
  "performance_requirements": {
    "max_response_time": 5000, // 5 seconds max
    "target_response_time": 3000, // 3 seconds target
    "timeout_threshold": 10000 // 10 seconds timeout
  },
  "quality_metrics": {
    "min_confidence_threshold": 60, // Minimum 60% confidence
    "verdict_accuracy_target": 0.85, // 85% accuracy target
    "test_image_variety": 10 // Minimum 10 diverse test images
  }
}
```

## Troubleshooting {#troubleshooting}

### Common Issues and Solutions

#### Issue: Mock Mode Not Working
```bash
# Check environment variables
echo $USE_MOCK_OPENAI
echo $OPENAI_API_KEY

# Verify .env file loading
node -e "require('dotenv').config(); console.log(process.env.USE_MOCK_OPENAI);"

# Check console for mock mode messages
grep "MOCK MODE" logs/server.log
```

#### Issue: Responses Taking Too Long
```bash
# Check if accidentally using real API
grep "PRODUCTION" logs/server.log

# Verify mock delay settings
# Should be 1-2 seconds, not longer
```

#### Issue: Inconsistent Response Format
```bash
# Validate response structure
curl -X POST http://localhost:3000/api/analyze-trade \
  -F "image=@test.png" | jq '.metadata.mockMode'

# Should return: true
```

#### Issue: Server Won't Start
```bash
# Check environment file syntax
cat .env.development | grep -E '^[A-Z_]+='

# Verify no trailing spaces or invalid characters
sed 's/[[:space:]]*$//' .env.development > .env.development.clean
mv .env.development.clean .env.development
```

### Debug Commands

```bash
# Check current configuration
npm run debug:config

# Test mock response generation
npm run debug:mock-responses

# Validate API endpoint health
npm run debug:health-check

# Test image processing pipeline
npm run debug:image-processing
```

### Support and Resources

- **Mock Mode Documentation**: See PRD-1.2.3 Section 10
- **API Endpoint Documentation**: See PRD-1.2.5
- **Environment Setup Guide**: See this document
- **Production Deployment Guide**: See sections above

### Emergency Rollback

If production issues occur:

```bash
# Immediate rollback to mock mode
export USE_MOCK_OPENAI=true
pm2 restart trading-coach-api

# Or update environment and restart
echo "USE_MOCK_OPENAI=true" >> .env.production
pm2 restart trading-coach-api
```

This ensures service continuity while resolving production issues.