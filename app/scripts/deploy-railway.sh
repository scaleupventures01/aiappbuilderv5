#!/bin/bash

# Railway Deployment Script for Elite Trading Coach AI
# This script automates the deployment process to Railway

set -e  # Exit on any error

echo "🚂 Starting Railway deployment for Elite Trading Coach AI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Please install it first:"
        echo "npm install -g @railway/cli"
        echo "or"
        echo "curl -fsSL https://railway.app/install.sh | sh"
        exit 1
    fi
    print_success "Railway CLI found"
}

# Check if user is logged in to Railway
check_railway_auth() {
    if ! railway whoami &> /dev/null; then
        print_error "Not logged in to Railway. Please login first:"
        echo "railway login"
        exit 1
    fi
    print_success "Railway authentication verified"
}

# Pre-deployment checks
pre_deployment_checks() {
    print_status "Running pre-deployment checks..."
    
    # Check if package.json exists
    if [[ ! -f "package.json" ]]; then
        print_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    # Check if railway.json exists
    if [[ ! -f "railway.json" ]]; then
        print_error "railway.json not found. Railway configuration is missing."
        exit 1
    fi
    
    # Check if database connection files exist
    if [[ ! -f "db/connection.js" ]]; then
        print_error "Database connection file not found."
        exit 1
    fi
    
    if [[ ! -f "db/railway-config.js" ]]; then
        print_error "Railway database configuration file not found."
        exit 1
    fi
    
    print_success "Pre-deployment checks passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm run install:all
    print_success "Dependencies installed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    if npm run test:all; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed, but continuing deployment"
    fi
}

# Run linting
run_linting() {
    print_status "Running linting..."
    if npm run lint:all; then
        print_success "Linting passed"
    else
        print_warning "Linting issues found, but continuing deployment"
    fi
}

# Build the application
build_application() {
    print_status "Building application..."
    npm run app:build
    print_success "Application built successfully"
}

# Deploy to Railway
deploy_to_railway() {
    print_status "Deploying to Railway..."
    
    # Check if project is linked
    if ! railway status &> /dev/null; then
        print_warning "Project not linked to Railway. Linking now..."
        railway link
    fi
    
    # Deploy
    railway deploy
    print_success "Deployment completed"
}

# Get deployment information
get_deployment_info() {
    print_status "Getting deployment information..."
    echo ""
    echo "🚂 Railway Deployment Summary:"
    echo "================================"
    railway status
    echo ""
    railway domain
    echo ""
    print_success "Deployment information retrieved"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Get the deployment URL
    DOMAIN=$(railway domain 2>/dev/null | grep -o 'https://[^[:space:]]*' | head -1)
    
    if [[ -n "$DOMAIN" ]]; then
        print_status "Testing health endpoint at: $DOMAIN/health"
        
        # Wait a moment for the service to start
        sleep 10
        
        if curl -f -s "$DOMAIN/health" > /dev/null; then
            print_success "Health check passed - deployment is live!"
            echo "🌐 Your application is running at: $DOMAIN"
        else
            print_warning "Health check failed - deployment may still be starting"
            echo "🌐 Check your application at: $DOMAIN"
        fi
    else
        print_warning "Could not retrieve domain URL"
    fi
}

# Main deployment process
main() {
    echo "🚂 Elite Trading Coach AI - Railway Deployment"
    echo "=============================================="
    echo ""
    
    check_railway_cli
    check_railway_auth
    pre_deployment_checks
    install_dependencies
    run_tests
    run_linting
    build_application
    deploy_to_railway
    get_deployment_info
    verify_deployment
    
    echo ""
    print_success "🎉 Deployment process completed!"
    echo ""
    echo "Next steps:"
    echo "1. Set up your PostgreSQL database service in Railway"
    echo "2. Configure environment variables if not already done"
    echo "3. Run database migrations if needed"
    echo "4. Monitor your application logs: railway logs"
    echo ""
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"