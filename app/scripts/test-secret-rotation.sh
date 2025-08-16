#!/bin/bash

# Secret Rotation Testing Script
# Tests the secret rotation procedures for Elite Trading Coach AI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
HEALTH_ENDPOINT="http://localhost:3001/api/health"
OPENAI_HEALTH_ENDPOINT="http://localhost:3001/api/health/openai"
LOG_FILE="/tmp/rotation-test-$(date +%Y%m%d-%H%M%S).log"

echo "🔄 Secret Rotation Testing Script"
echo "=================================="
echo "Log file: $LOG_FILE"
echo ""

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"
}

# Function to test API key validity
test_openai_key() {
    local api_key=$1
    local key_name=$2
    
    if [ -z "$api_key" ]; then
        echo -e "${RED}❌ No API key provided for $key_name${NC}"
        return 1
    fi
    
    echo "🔑 Testing $key_name..."
    log "Testing OpenAI API key: $key_name"
    
    # Test the key format first
    if [[ ! "$api_key" =~ ^sk- ]]; then
        echo -e "${RED}❌ Invalid key format for $key_name (must start with 'sk-')${NC}"
        log "ERROR: Invalid key format for $key_name"
        return 1
    fi
    
    # Test actual API connectivity
    local response=$(curl -s -w "%{http_code}" -o /tmp/api_test_response.json \
        -H "Authorization: Bearer $api_key" \
        "https://api.openai.com/v1/models")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $key_name is valid and working${NC}"
        log "SUCCESS: $key_name validated successfully"
        return 0
    else
        echo -e "${RED}❌ $key_name failed (HTTP $response)${NC}"
        if [ -f /tmp/api_test_response.json ]; then
            cat /tmp/api_test_response.json | jq -r '.error.message // "Unknown error"' 2>/dev/null || echo "Error response available in log"
        fi
        log "ERROR: $key_name validation failed with HTTP $response"
        return 1
    fi
}

# Function to test application health
test_application_health() {
    echo "🏥 Testing application health..."
    log "Testing application health endpoints"
    
    # Test general health
    local health_response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$HEALTH_ENDPOINT")
    
    if [ "$health_response" = "200" ]; then
        echo -e "${GREEN}✅ Application health check passed${NC}"
        log "SUCCESS: Application health check passed"
    else
        echo -e "${RED}❌ Application health check failed (HTTP $health_response)${NC}"
        log "ERROR: Application health check failed with HTTP $health_response"
        return 1
    fi
    
    # Test OpenAI specific health
    local openai_health_response=$(curl -s -w "%{http_code}" -o /tmp/openai_health_response.json "$OPENAI_HEALTH_ENDPOINT")
    
    if [ "$openai_health_response" = "200" ]; then
        local status=$(cat /tmp/openai_health_response.json | jq -r '.status' 2>/dev/null || echo "unknown")
        if [ "$status" = "healthy" ]; then
            echo -e "${GREEN}✅ OpenAI health check passed${NC}"
            log "SUCCESS: OpenAI health check passed"
        elif [ "$status" = "degraded" ]; then
            echo -e "${YELLOW}⚠️ OpenAI health check degraded${NC}"
            log "WARNING: OpenAI health check shows degraded status"
        else
            echo -e "${RED}❌ OpenAI health check unhealthy${NC}"
            log "ERROR: OpenAI health check shows unhealthy status"
            return 1
        fi
    else
        echo -e "${RED}❌ OpenAI health check failed (HTTP $openai_health_response)${NC}"
        log "ERROR: OpenAI health check failed with HTTP $openai_health_response"
        return 1
    fi
}

# Function to test JWT token generation and validation
test_jwt_functionality() {
    echo "🔐 Testing JWT functionality..."
    log "Testing JWT token generation and validation"
    
    # Try to generate a test token (requires the application to be running)
    local login_response=$(curl -s -w "%{http_code}" -o /tmp/login_response.json \
        -X POST "$HEALTH_ENDPOINT/../auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"testpass"}' 2>/dev/null)
    
    if [ "$login_response" = "200" ] || [ "$login_response" = "401" ]; then
        echo -e "${GREEN}✅ JWT endpoint responding${NC}"
        log "SUCCESS: JWT endpoint is responding"
    else
        echo -e "${YELLOW}⚠️ JWT endpoint test inconclusive (HTTP $login_response)${NC}"
        log "WARNING: JWT endpoint test inconclusive"
    fi
}

# Function to simulate rotation testing
simulate_rotation_test() {
    echo "🔄 Simulating rotation procedure..."
    log "Starting rotation simulation"
    
    # Test current environment variables
    if [ -n "$OPENAI_API_KEY" ]; then
        test_openai_key "$OPENAI_API_KEY" "Current OpenAI API Key"
    else
        echo -e "${YELLOW}⚠️ OPENAI_API_KEY environment variable not set${NC}"
        log "WARNING: OPENAI_API_KEY not found in environment"
    fi
    
    # Test if we can read configuration
    if command -v node &> /dev/null; then
        echo "📋 Testing configuration loading..."
        node -e "
            try {
                require('dotenv').config();
                const fs = require('fs');
                if (fs.existsSync('./config/openai.js')) {
                    console.log('✅ Configuration file exists');
                } else {
                    console.log('❌ Configuration file not found');
                }
            } catch (error) {
                console.log('❌ Configuration test failed:', error.message);
            }
        " 2>/dev/null || echo "⚠️ Node.js configuration test skipped"
    fi
}

# Function to check rotation schedule compliance
check_rotation_schedule() {
    echo "📅 Checking rotation schedule compliance..."
    log "Checking rotation schedule"
    
    # Check if rotation tracking variables exist
    local rotation_vars_file=".rotation-tracking"
    
    if [ -f "$rotation_vars_file" ]; then
        echo "📋 Found rotation tracking file:"
        cat "$rotation_vars_file"
        log "Rotation tracking file found and displayed"
    else
        echo -e "${YELLOW}⚠️ No rotation tracking file found${NC}"
        echo "Creating sample rotation tracking file..."
        cat > "$rotation_vars_file" << EOF
# Rotation Tracking
# Last rotation dates (YYYY-MM-DD)
OPENAI_API_KEY_LAST_ROTATED=
JWT_SECRET_LAST_ROTATED=
DB_PASSWORD_LAST_ROTATED=
CLOUDINARY_SECRET_LAST_ROTATED=

# Next rotation dates (auto-calculated)
OPENAI_API_KEY_NEXT_ROTATION=
JWT_SECRET_NEXT_ROTATION=
DB_PASSWORD_NEXT_ROTATION=
CLOUDINARY_SECRET_NEXT_ROTATION=
EOF
        echo "✅ Created rotation tracking template"
        log "Created rotation tracking template file"
    fi
}

# Function to generate rotation report
generate_rotation_report() {
    echo "📊 Generating rotation test report..."
    log "Generating final report"
    
    local report_file="rotation-test-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Secret Rotation Test Report

**Date**: $(date)
**Tester**: $(whoami)
**Environment**: $(node -e "console.log(process.env.NODE_ENV || 'development')" 2>/dev/null || echo "unknown")

## Test Results

### API Key Validation
$(grep "Testing OpenAI API key" "$LOG_FILE" | sed 's/^/- /')

### Application Health
$(grep "Application health" "$LOG_FILE" | sed 's/^/- /')

### Configuration Status
$(grep "Configuration" "$LOG_FILE" | sed 's/^/- /')

## Recommendations

1. Review any failed tests above
2. Ensure all API keys are up to date
3. Verify rotation schedule compliance
4. Update monitoring alerts if needed

## Next Steps

- [ ] Address any failed tests
- [ ] Update rotation schedule if needed
- [ ] Plan next rotation based on schedule
- [ ] Update team on any issues found

---
*Generated by Secret Rotation Testing Script*
EOF

    echo "✅ Report generated: $report_file"
    log "Report generated: $report_file"
}

# Main execution
main() {
    log "Starting secret rotation testing script"
    
    echo "Starting comprehensive secret rotation testing..."
    echo ""
    
    # Run all tests
    test_application_health
    echo ""
    
    simulate_rotation_test
    echo ""
    
    test_jwt_functionality
    echo ""
    
    check_rotation_schedule
    echo ""
    
    generate_rotation_report
    
    echo ""
    echo "🎯 Secret rotation testing completed!"
    echo "📋 Full log available at: $LOG_FILE"
    log "Secret rotation testing script completed successfully"
}

# Handle script arguments
case "${1:-}" in
    "test-key")
        if [ -z "$2" ]; then
            echo "Usage: $0 test-key <api-key>"
            exit 1
        fi
        test_openai_key "$2" "Provided Key"
        ;;
    "health-only")
        test_application_health
        ;;
    "report-only")
        generate_rotation_report
        ;;
    *)
        main
        ;;
esac