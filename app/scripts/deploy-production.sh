#!/bin/bash
# Production Deployment Script
# PRD Reference: PRD-1.2.10-openai-api-configuration.md
#
# This script handles the complete production deployment process including
# validation, deployment, and post-deployment verification.
#
# Usage:
#   ./scripts/deploy-production.sh [--skip-validation] [--force]
#   
# Options:
#   --skip-validation    Skip pre-deployment validation (not recommended)
#   --force             Force deployment even if validation warnings exist
#   --rollback          Rollback to previous deployment

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_DIR}/production-deployment.log"
ENVIRONMENT="production"

# Command line options
SKIP_VALIDATION=false
FORCE_DEPLOY=false
ROLLBACK_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --rollback)
            ROLLBACK_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-validation] [--force] [--rollback]"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# Check if Railway CLI is installed and authenticated
check_railway_cli() {
    if ! command -v railway >/dev/null 2>&1; then
        error "Railway CLI is not installed"
        echo "Install it with: npm install -g @railway/cli"
        exit 1
    fi
    
    if ! railway whoami >/dev/null 2>&1; then
        error "Railway CLI is not authenticated"
        echo "Run: railway login"
        exit 1
    fi
    
    success "Railway CLI is ready"
}

# Rollback function
perform_rollback() {
    log "🔄 Starting production rollback process"
    
    # Get list of recent deployments
    log "Fetching recent deployments..."
    railway deployments list --environment production
    
    echo ""
    echo "Enter the deployment ID to rollback to (or 'cancel' to abort):"
    read -r DEPLOYMENT_ID
    
    if [ "$DEPLOYMENT_ID" = "cancel" ] || [ -z "$DEPLOYMENT_ID" ]; then
        warning "Rollback cancelled by user"
        exit 0
    fi
    
    log "Rolling back to deployment: $DEPLOYMENT_ID"
    
    # Perform rollback
    if railway rollback "$DEPLOYMENT_ID" --environment production; then
        success "Rollback initiated successfully"
        
        # Wait for rollback to complete
        log "Waiting for rollback to complete..."
        sleep 60
        
        # Verify rollback
        log "Verifying rollback success..."
        if curl -f -s https://elite-trading-coach.railway.app/api/health >/dev/null; then
            success "✅ Rollback completed successfully"
            log "Running post-rollback validation..."
            node tests/integration/production-smoke-test.mjs
        else
            error "❌ Rollback verification failed"
            exit 1
        fi
    else
        error "Rollback failed"
        exit 1
    fi
    
    exit 0
}

# Pre-deployment validation
run_pre_deployment_validation() {
    log "🔍 Running pre-deployment validation"
    
    cd "$PROJECT_DIR"
    
    # Check git status
    if ! git diff --quiet; then
        warning "Working directory has uncommitted changes"
        if [ "$FORCE_DEPLOY" = false ]; then
            error "Commit or stash changes before deployment"
            exit 1
        fi
    fi
    
    # Run validation script
    if [ -f "scripts/validate-production-deployment.sh" ]; then
        log "Running comprehensive validation..."
        if ./scripts/validate-production-deployment.sh; then
            success "Pre-deployment validation passed"
        else
            error "Pre-deployment validation failed"
            if [ "$FORCE_DEPLOY" = false ]; then
                exit 1
            else
                warning "Continuing with force deployment"
            fi
        fi
    else
        warning "Validation script not found"
    fi
    
    # Check deployment readiness
    if [ -f "devops/deployment-readiness.js" ]; then
        log "Checking deployment readiness..."
        if node devops/deployment-readiness.js; then
            success "Deployment readiness check passed"
        else
            error "Deployment readiness check failed"
            if [ "$FORCE_DEPLOY" = false ]; then
                exit 1
            fi
        fi
    fi
}

# Deploy to production
deploy_to_production() {
    log "🚀 Starting production deployment"
    
    # Get current deployment info for potential rollback
    log "Recording current deployment state..."
    CURRENT_DEPLOYMENT=$(railway deployments list --environment production --json | jq -r '.[0].id' 2>/dev/null || echo "none")
    log "Current deployment: $CURRENT_DEPLOYMENT"
    
    # Start deployment
    log "Initiating Railway deployment..."
    if railway deploy --environment production; then
        success "Deployment initiated successfully"
    else
        error "Deployment initiation failed"
        exit 1
    fi
    
    # Monitor deployment progress
    log "Monitoring deployment progress..."
    local deployment_timeout=600  # 10 minutes
    local check_interval=15       # 15 seconds
    local elapsed=0
    
    while [ $elapsed -lt $deployment_timeout ]; do
        if railway status --environment production | grep -q "RUNNING"; then
            success "Deployment completed successfully"
            break
        elif railway status --environment production | grep -q "FAILED"; then
            error "Deployment failed"
            exit 1
        else
            log "Deployment in progress... (${elapsed}s elapsed)"
            sleep $check_interval
            elapsed=$((elapsed + check_interval))
        fi
    done
    
    if [ $elapsed -ge $deployment_timeout ]; then
        error "Deployment timeout reached"
        exit 1
    fi
}

# Post-deployment validation
run_post_deployment_validation() {
    log "✅ Running post-deployment validation"
    
    # Wait for application to fully start
    log "Waiting for application startup..."
    sleep 30
    
    # Check basic health
    log "Checking application health..."
    local health_checks=0
    local max_health_checks=10
    
    while [ $health_checks -lt $max_health_checks ]; do
        if curl -f -s https://elite-trading-coach.railway.app/api/health >/dev/null; then
            success "Health check passed"
            break
        else
            health_checks=$((health_checks + 1))
            log "Health check attempt $health_checks/$max_health_checks"
            sleep 10
        fi
    done
    
    if [ $health_checks -eq $max_health_checks ]; then
        error "Health checks failed after $max_health_checks attempts"
        return 1
    fi
    
    # Run comprehensive smoke tests
    if [ -f "tests/integration/production-smoke-test.mjs" ]; then
        log "Running production smoke tests..."
        if PRODUCTION_URL="https://elite-trading-coach.railway.app" node tests/integration/production-smoke-test.mjs; then
            success "Production smoke tests passed"
        else
            error "Production smoke tests failed"
            return 1
        fi
    fi
    
    # Check OpenAI production mode
    log "Verifying OpenAI production mode..."
    OPENAI_HEALTH=$(curl -s https://elite-trading-coach.railway.app/api/health/openai/production)
    if echo "$OPENAI_HEALTH" | jq -e '.mode == "production" and .mockMode == false' >/dev/null 2>&1; then
        success "OpenAI production mode verified"
    else
        error "OpenAI not in production mode"
        echo "OpenAI health response: $OPENAI_HEALTH"
        return 1
    fi
    
    return 0
}

# Performance monitoring
monitor_performance() {
    log "📊 Monitoring initial performance metrics"
    
    # Check response times
    RESPONSE_TIME=$(curl -w "%{time_total}" -s -o /dev/null https://elite-trading-coach.railway.app/api/health)
    if [ "$(echo "$RESPONSE_TIME < 5.0" | bc -l)" -eq 1 ]; then
        success "Response time acceptable: ${RESPONSE_TIME}s"
    else
        warning "Response time high: ${RESPONSE_TIME}s"
    fi
    
    # Check memory and CPU usage
    log "Current resource usage:"
    railway ps --environment production
    
    # Monitor error rates
    log "Checking error rates..."
    sleep 60  # Wait for some traffic
    railway logs --environment production | grep -i error | tail -10 || log "No recent errors found"
}

# Deployment summary
generate_deployment_summary() {
    log "📋 Generating deployment summary"
    
    local new_deployment=$(railway deployments list --environment production --json | jq -r '.[0].id' 2>/dev/null || echo "unknown")
    
    echo ""
    echo "============================================"
    echo "🎉 PRODUCTION DEPLOYMENT SUMMARY"
    echo "============================================"
    echo "Deployment Time: $(date)"
    echo "Environment: production"
    echo "Previous Deployment: $CURRENT_DEPLOYMENT"
    echo "New Deployment: $new_deployment"
    echo "Application URL: https://elite-trading-coach.railway.app"
    echo "Health Check: https://elite-trading-coach.railway.app/api/health"
    echo "OpenAI Status: https://elite-trading-coach.railway.app/api/health/openai/production"
    echo "============================================"
    
    success "Production deployment completed successfully!"
}

# Main execution flow
main() {
    # Initialize log file
    echo "=== Production Deployment Started at $(date) ===" > "$LOG_FILE"
    
    log "🚀 Elite Trading Coach AI - Production Deployment"
    log "Environment: $ENVIRONMENT"
    log "Project Directory: $PROJECT_DIR"
    log "Log File: $LOG_FILE"
    
    echo "============================================"
    
    # Handle rollback mode
    if [ "$ROLLBACK_MODE" = true ]; then
        perform_rollback
        exit 0
    fi
    
    # Check prerequisites
    check_railway_cli
    
    # Pre-deployment validation
    if [ "$SKIP_VALIDATION" = false ]; then
        run_pre_deployment_validation
    else
        warning "Skipping pre-deployment validation"
    fi
    
    # Confirm deployment
    if [ "$FORCE_DEPLOY" = false ]; then
        echo ""
        echo "🚨 PRODUCTION DEPLOYMENT CONFIRMATION"
        echo "This will deploy to the live production environment."
        echo "Users will be affected by this deployment."
        echo ""
        echo "Are you sure you want to continue? (yes/no)"
        read -r CONFIRM
        
        if [ "$CONFIRM" != "yes" ]; then
            warning "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Execute deployment
    deploy_to_production
    
    # Post-deployment validation
    if run_post_deployment_validation; then
        success "Post-deployment validation passed"
    else
        error "Post-deployment validation failed"
        
        echo ""
        echo "🚨 DEPLOYMENT VALIDATION FAILED"
        echo "Consider immediate rollback if issues are critical."
        echo "To rollback, run: $0 --rollback"
        
        exit 1
    fi
    
    # Performance monitoring
    monitor_performance
    
    # Generate summary
    generate_deployment_summary
    
    # Final success message
    echo ""
    success "🎉 Production deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Monitor application logs: railway logs --follow --environment production"
    echo "2. Watch performance metrics and error rates"
    echo "3. Validate user-facing functionality"
    echo "4. Update team on deployment status"
    echo ""
}

# Error handling
trap 'error "Deployment script interrupted"; exit 1' INT TERM

# Run main function
main "$@"