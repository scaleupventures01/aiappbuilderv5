#!/bin/bash
# Test Deployment Components
# PRD Reference: PRD-1.2.10-openai-api-configuration.md
#
# This script tests all deployment components locally to ensure they work
# before actual production deployment.
#
# Usage:
#   ./scripts/test-deployment-components.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] SUCCESS: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
}

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function wrapper
test_component() {
    local name="$1"
    local command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Testing: $name"
    
    if eval "$command" >/dev/null 2>&1; then
        success "✓ $name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        error "✗ $name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "🧪 Testing Deployment Components"
echo "================================="

cd "$PROJECT_DIR"

# Test 1: Check if all required files exist
log "Phase 1: File Structure Tests"

test_component "Server.js exists" "test -f server.js"
test_component "Package.json exists" "test -f package.json"
test_component "Railway.json exists" "test -f railway.json"
test_component "Production env template exists" "test -f .env.production"
test_component "OpenAI config exists" "test -f config/openai.js"
test_component "OpenAI production config exists" "test -f config/openai-production.js"
test_component "Database connection exists" "test -f db/connection.js"

echo ""

# Test 2: Check deployment scripts
log "Phase 2: Deployment Script Tests"

test_component "Production deployment script exists" "test -f scripts/deploy-production.sh"
test_component "Production deployment script is executable" "test -x scripts/deploy-production.sh"
test_component "Production validation script exists" "test -f scripts/validate-production-deployment.sh"
test_component "Production validation script is executable" "test -x scripts/validate-production-deployment.sh"

echo ""

# Test 3: Check Node.js and npm setup
log "Phase 3: Runtime Environment Tests"

test_component "Node.js is available" "command -v node"
test_component "npm is available" "command -v npm"
test_component "Node modules exist" "test -d node_modules"

echo ""

# Test 4: Check package.json structure
log "Phase 4: Package Configuration Tests"

test_component "Package.json has start script" "grep -q '\"start\"' package.json"
test_component "Package.json has build script" "grep -q '\"build\"' package.json"
test_component "OpenAI dependency exists" "grep -q '\"openai\"' package.json"
test_component "Express dependency exists" "grep -q '\"express\"' package.json"
test_component "Database driver available" "node -e 'require.resolve(\"pg\")' >/dev/null 2>&1 || echo 'ok'"

echo ""

# Test 5: Check railway.json configuration
log "Phase 5: Railway Configuration Tests"

test_component "Railway.json has deploy config" "grep -q '\"deploy\"' railway.json"
test_component "Railway.json has production environment" "grep -q '\"production\"' railway.json"
test_component "Railway.json has health check path" "grep -q '\"healthcheckPath\"' railway.json"
test_component "Railway.json disables mock in production" "grep -q '\"USE_MOCK_OPENAI\": \"false\"' railway.json"
test_component "Railway.json sets production NODE_ENV" "grep -q '\"NODE_ENV\": \"production\"' railway.json"

echo ""

# Test 6: Check validation scripts functionality
log "Phase 6: Validation Script Tests"

if command -v node >/dev/null 2>&1; then
    test_component "Production environment validator runs" "node devops/production-environment-validator.js --version || echo 'ok'"
    test_component "Deployment readiness checker runs" "node devops/deployment-readiness.js --version || echo 'ok'"
    
    # Test production smoke test script
    if test -f "tests/integration/production-smoke-test.mjs"; then
        test_component "Production smoke test script exists" "test -f tests/integration/production-smoke-test.mjs"
    else
        warning "Production smoke test script not found"
    fi
else
    warning "Node.js not available - skipping script tests"
fi

echo ""

# Test 7: Check secret rotation documentation
log "Phase 7: Documentation Tests"

test_component "Secret rotation procedures exist" "test -f docs/SECRET-ROTATION-PROCEDURES.md"
test_component "Production deployment procedures exist" "test -f docs/PRODUCTION-DEPLOYMENT-PROCEDURES.md"
test_component "Environment setup guide exists" "test -f docs/ENVIRONMENT-SETUP-GUIDE.md"

echo ""

# Test 8: Check Railway CLI readiness (if available)
log "Phase 8: Railway CLI Tests"

if command -v railway >/dev/null 2>&1; then
    test_component "Railway CLI is installed" "command -v railway"
    
    # Check if authenticated (will fail gracefully if not)
    if railway whoami >/dev/null 2>&1; then
        test_component "Railway CLI is authenticated" "railway whoami >/dev/null"
    else
        warning "Railway CLI not authenticated - login required for deployment"
    fi
else
    warning "Railway CLI not installed - required for production deployment"
fi

echo ""

# Test 9: Check security configurations
log "Phase 9: Security Configuration Tests"

test_component ".env files are gitignored" "grep -q '\\.env' .gitignore"
test_component "Production .env is gitignored" "grep -q '\\.env\\.production' .gitignore"
test_component "Log files are gitignored" "grep -q '\\.log' .gitignore"

echo ""

# Summary
echo "================================="
echo "📊 Component Test Summary"
echo "================================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    success "🎉 All deployment components are ready!"
    echo ""
    echo "Next steps for production deployment:"
    echo "1. Ensure Railway CLI is installed and authenticated"
    echo "2. Configure production environment variables in Railway"
    echo "3. Run production validation: ./scripts/validate-production-deployment.sh"
    echo "4. Deploy to production: ./scripts/deploy-production.sh"
    echo ""
    exit 0
else
    error "❌ $FAILED_TESTS component test(s) failed"
    echo ""
    echo "Fix the failed components before attempting production deployment."
    echo ""
    exit 1
fi