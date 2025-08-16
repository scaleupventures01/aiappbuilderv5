#!/bin/bash

# Elite Trading Coach AI - Test Server Startup Script
# This script starts the server in test mode with mock OpenAI enabled
# Created: 2025-08-15

echo "🚀 Elite Trading Coach AI - Starting Test Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Set environment to development if not already set
export NODE_ENV=development

# Check if .env.development exists
if [ ! -f ".env.development" ]; then
    echo "❌ .env.development file not found!"
    echo "   Creating minimal .env.development for testing..."
    
    cat > .env.development << 'EOF'
# Minimal configuration for testing
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Mock mode enabled - no real API key needed
USE_MOCK_OPENAI=true
OPENAI_MODEL=gpt-4-vision-preview
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# JWT (development only)
JWT_SECRET=test-jwt-secret-not-for-production

# Database (optional for chart analysis testing)
DATABASE_URL=postgresql://test:test@localhost:5432/test_db

# Rate limiting (permissive for testing)
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=1000
EOF
    echo "✅ Created .env.development with test configuration"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo ""
echo "🔧 Configuration:"
echo "   • Environment: development"
echo "   • Port: 3001"
echo "   • Mock OpenAI: enabled"
echo "   • Test endpoint: /api/test-analyze-trade"
echo ""

echo "🌟 Starting server..."
echo "   • Chart analysis test page: http://localhost:3001/api/test-analyze-trade"
echo "   • Health check: http://localhost:3001/health"
echo "   • OpenAI health: http://localhost:3001/health/openai"
echo ""

# Start the server with development environment
npm run start:dev

# If that fails, try with node directly
if [ $? -ne 0 ]; then
    echo "⚠️  npm start:dev failed, trying with node directly..."
    node server.js
fi