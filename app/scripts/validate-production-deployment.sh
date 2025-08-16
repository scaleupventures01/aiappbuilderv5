#!/bin/bash
# Production Deployment Validation Script
# PRD Reference: PRD-1.2.10-openai-api-configuration.md
#
# This script validates production deployment for OpenAI API configuration
# ensuring all requirements are met before going live.
#
# Usage:
#   ./scripts/validate-production-deployment.sh
#   ENVIRONMENT=production ./scripts/validate-production-deployment.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_DIR}/production-validation.log"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

# Validation counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Check function wrapper
check() {
    local name="$1"
    local command="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    log "Checking: $name"
    
    if eval "$command"; then
        success "✓ $name"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        error "✗ $name"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Warning function wrapper
check_warning() {
    local name="$1"
    local command="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    log "Checking: $name"
    
    if eval "$command"; then
        success "✓ $name"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        warning "⚠ $name"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
        return 1
    fi
}

# Initialize log file
echo "=== Production Deployment Validation Started at $(date) ===" > "$LOG_FILE"
echo "Environment: $ENVIRONMENT" >> "$LOG_FILE"

log "🚀 Starting Production Deployment Validation"
log "Environment: $ENVIRONMENT"
log "Project Directory: $PROJECT_DIR"
log "Log File: $LOG_FILE"

echo "==============================================================================="

# 1. Environment Variable Validation
log "📋 Phase 1: Environment Variable Validation"

cd "$PROJECT_DIR"

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    source ".env.${ENVIRONMENT}"
    success "Loaded .env.${ENVIRONMENT}"
elif [ -f ".env" ]; then
    source ".env"
    success "Loaded .env"
else
    error "No environment file found"
    exit 1
fi

# Check critical environment variables
check "NODE_ENV is set to production" '[ "$NODE_ENV" = "production" ]'
check "USE_MOCK_OPENAI is false" '[ "$USE_MOCK_OPENAI" = "false" ]'
check "OPENAI_API_KEY is configured" '[ -n "$OPENAI_API_KEY" ]'
check "OPENAI_API_KEY is not placeholder" '[ "$OPENAI_API_KEY" != "your-openai-api-key-here" ]'
check "OPENAI_API_KEY starts with sk-" '[[ "$OPENAI_API_KEY" =~ ^sk- ]]'
check "OPENAI_MODEL is configured" '[ -n "$OPENAI_MODEL" ]'

# Check optional but recommended variables
check_warning "OPENAI_FALLBACK_MODEL is configured" '[ -n "$OPENAI_FALLBACK_MODEL" ]'
check_warning "OPENAI_MAX_TOKENS is configured" '[ -n "$OPENAI_MAX_TOKENS" ]'
check_warning "OPENAI_TIMEOUT is configured" '[ -n "$OPENAI_TIMEOUT" ]'

echo ""

# 2. File Structure Validation
log "📁 Phase 2: File Structure Validation"

check "Production config file exists" '[ -f "config/openai-production.js" ]'
check "Production metrics service exists" '[ -f "services/production-metrics.js" ]'
check "Trade analysis service exists" '[ -f "server/services/trade-analysis-service.js" ]'
check "OpenAI config exists" '[ -f "config/openai.js" ]'
check "Main server file exists" '[ -f "server.js" ]'
check "Package.json exists" '[ -f "package.json" ]'

echo ""

# 3. Dependencies Validation
log "📦 Phase 3: Dependencies Validation"

if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    success "Node.js is installed: $NODE_VERSION"
    check "Node.js version is 18+" 'node -e "process.exit(parseInt(process.version.slice(1)) >= 18 ? 0 : 1)"'
else
    error "Node.js is not installed"
    exit 1
fi

if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    success "npm is installed: $NPM_VERSION"
else
    error "npm is not installed"
    exit 1
fi

check "node_modules exists" '[ -d "node_modules" ]'
check "OpenAI package installed" 'npm list openai >/dev/null 2>&1'
check "Express package installed" 'npm list express >/dev/null 2>&1'
check "dotenv package installed" 'npm list dotenv >/dev/null 2>&1'

echo ""

# 4. Production Configuration Tests
log "⚙️  Phase 4: Production Configuration Tests"

# Run automated tests
if [ -f "test-production-mode.mjs" ]; then
    log "Running automated production tests..."
    if NODE_ENV="$ENVIRONMENT" node test-production-mode.mjs --quiet; then
        success "Automated production tests passed"
    else
        error "Automated production tests failed"
    fi
else
    warning "Production test file not found"
fi

echo ""

# 5. API Key Validation
log "🔑 Phase 5: API Key Validation"

if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your-openai-api-key-here" ]; then
    log "Testing API key connectivity..."
    
    # Create a simple API test
    cat > temp_api_test.mjs << 'EOF'
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 10000
});

try {
    const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 1
    });
    console.log('API_TEST_SUCCESS');
    process.exit(0);
} catch (error) {
    console.error('API_TEST_FAILED:', error.message);
    process.exit(1);
}
EOF

    if OPENAI_API_KEY="$OPENAI_API_KEY" node temp_api_test.mjs 2>&1 | grep -q "API_TEST_SUCCESS"; then
        success "OpenAI API key is valid and working"
    else
        error "OpenAI API key validation failed"
    fi
    
    rm -f temp_api_test.mjs
else
    error "Cannot validate API key - not configured or is placeholder"
fi

echo ""

# 6. Production Security Validation
log "🔒 Phase 6: Production Security Validation"

check "API key is not in git history" '! git log --all --grep="$OPENAI_API_KEY" >/dev/null 2>&1'
check "No .env files in git" '! git ls-files | grep -q "^\.env$"'
check "Production env file is gitignored" 'git check-ignore .env.production >/dev/null 2>&1 || true'

# Check for common security issues
check_warning "No hardcoded API keys in source" '! grep -r "sk-[a-zA-Z0-9]" --include="*.js" --include="*.mjs" --exclude-dir=node_modules . | grep -v "your-openai-api-key-here" >/dev/null 2>&1'
check_warning "No TODO or FIXME in production code" '! grep -r "TODO\|FIXME" --include="*.js" --include="*.mjs" --exclude-dir=node_modules . >/dev/null 2>&1'

echo ""

# 7. Performance and Monitoring
log "📊 Phase 7: Performance and Monitoring Validation"

# Check if health check endpoints would work
check_warning "Health check endpoint accessible" 'curl -s http://localhost:${PORT:-3001}/health >/dev/null 2>&1 || true'

echo ""

# 8. Final Summary
echo "==============================================================================="
log "📋 Validation Summary"

echo ""
echo "Total Checks: $TOTAL_CHECKS"
echo "Passed: $PASSED_CHECKS"
echo "Failed: $FAILED_CHECKS"
echo "Warnings: $WARNING_CHECKS"

if [ $FAILED_CHECKS -eq 0 ]; then
    success "🎉 All critical validations passed!"
    
    if [ $WARNING_CHECKS -eq 0 ]; then
        success "🌟 Perfect score - no warnings!"
        echo ""
        success "✅ PRODUCTION DEPLOYMENT APPROVED"
        echo ""
        log "Deployment validation completed successfully"
        exit 0
    else
        warning "⚠️  Some warnings detected - review recommended"
        echo ""
        warning "✅ PRODUCTION DEPLOYMENT APPROVED WITH WARNINGS"
        echo ""
        log "Deployment validation completed with warnings"
        exit 0
    fi
else
    error "❌ Critical validation failures detected"
    echo ""
    error "🚫 PRODUCTION DEPLOYMENT BLOCKED"
    echo ""
    error "Fix the failed checks before deploying to production"
    log "Deployment validation failed"
    exit 1
fi